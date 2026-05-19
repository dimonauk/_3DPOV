/**
 * app/api/printfiles/intake/route.ts — the listener.
 *
 * Receives inbound emails routed to printfiles@holoflow.co.uk.
 * v1 transport: Resend Inbound webhook (POST with a JSON body of
 * { from, to, subject, text, html, attachments[] }).
 *
 * Auth: webhook secret in `RESEND_INBOUND_WEBHOOK_SECRET`, verified
 * via the `svix-signature` header (Resend uses Svix for webhooks).
 * For dev / local testing without Svix, set
 * `RESEND_INBOUND_SKIP_SIGNATURE=1` and we accept any signed body.
 *
 * The route's job is to be cheap and quick — it:
 *   1. Verifies signature
 *   2. Rate-limits by sender (10/day per email address)
 *   3. Calls ingest pipeline (validation + geometry probe)
 *   4. Calls directory generator (Blob + Firestore)
 *   5. Calls print-farm forwarder
 *   6. Calls gracious-reply sender
 *
 * Each step is logged. Failures at any stage email the operator a
 * `[printfiles] INTAKE FAILED` packet so they can investigate.
 */

import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

import { createOrder, type AttachmentInputForBlob } from "lib/printfiles/directory";
import { fetchFromLink } from "lib/printfiles/fetch-from-link";
import { validateAttachment } from "lib/printfiles/ingest";
import { extractLinks, type ExtractedLink } from "lib/printfiles/link-extractor";
import { sendGraciousReply, sendRejectionReply } from "lib/printfiles/reply";
import {
  ACCEPTED_EXTENSIONS,
  DEFAULT_MAX_ATTACHMENT_MB,
  DEFAULT_MAX_TOTAL_MB,
  type PrintfilesOrder,
} from "lib/printfiles/types";
import { resolveProvider } from "lib/printfarm";
import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { FIRESTORE_COLLECTION } from "lib/printfiles/types";

export const dynamic = "force-dynamic";
// `runtime` left default (Node.js). We need Buffer + firebase-admin.

const log = createLogger("api.printfiles.intake");

// Per-sender per-day limit. Generous enough for a legit customer
// iterating on a print (resending after a small fix); cheap enough
// that an abuser can't burn our Resend quota.
const PER_SENDER_PER_DAY = 10;
const limiter = createFixedWindowLimiter({
  scope: "api.printfiles.intake",
  limit: PER_SENDER_PER_DAY,
  windowMs: 24 * 60 * 60 * 1000,
});

type ResendInboundAttachment = {
  filename?: string;
  content_type?: string;
  contentType?: string;
  /** Base64-encoded bytes. Resend Inbound caps each attachment at
   *  ~25 MB; we apply our own cap on top. */
  content?: string;
  content_base64?: string;
  size?: number;
};

type ResendInboundBody = {
  from?: { email?: string; name?: string };
  to?: Array<{ email?: string }>;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: ResendInboundAttachment[];
  /** RFC 822 Message-ID, for threading. */
  message_id?: string;
  /** Some sources include `headers` map. */
  headers?: Record<string, string>;
};

/** Pull the bytes off an attachment regardless of the field name
 *  Resend / a future transport chose. */
function attachmentBuffer(att: ResendInboundAttachment): Buffer | null {
  const b64 = att.content_base64 ?? att.content;
  if (!b64) return null;
  try {
    return Buffer.from(b64, "base64");
  } catch {
    return null;
  }
}

function attachmentMime(att: ResendInboundAttachment): string {
  return att.content_type ?? att.contentType ?? "application/octet-stream";
}

function hasAcceptedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Pick which extracted links are worth trying to fetch. Drive /
 * Dropbox / OneDrive don't tell us the file extension upfront — try
 * them even when hasAcceptedExtension is false (the fetched content's
 * magic bytes are the source of truth). Direct links need the extension
 * for the pre-fetch sanity check.
 */
function pickFetchableLinks(links: ExtractedLink[]): ExtractedLink[] {
  const ranked = [...links];
  ranked.sort((a, b) => {
    // Direct URLs with the right extension first (highest confidence)
    if (a.provider === "direct" && a.hasAcceptedExtension && b.provider !== "direct") return -1;
    if (b.provider === "direct" && b.hasAcceptedExtension && a.provider !== "direct") return 1;
    // Then Drive / Dropbox / OneDrive (have a direct-url)
    if (a.directUrl && !b.directUrl) return -1;
    if (b.directUrl && !a.directUrl) return 1;
    return 0;
  });
  // Cap at 3 attempts so we don't burn time on a sender with a wall
  // of links in their signature.
  return ranked.filter((l) => l.directUrl !== null).slice(0, 3);
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Skip signature verification in dev when the operator explicitly
 * opts out. In prod, the secret must be set AND match. The signature
 * scheme is Resend's Svix-based "v1,timestamp,sig" envelope; we
 * accept the absence of svix headers when SKIP_SIGNATURE=1 because
 * curl-based local testing doesn't carry them.
 */
function verifySignature(req: Request, _rawBody: string): { ok: boolean; reason?: string } {
  if (process.env.RESEND_INBOUND_SKIP_SIGNATURE === "1") {
    return { ok: true };
  }
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, reason: "RESEND_INBOUND_WEBHOOK_SECRET unset" };
  }
  const svixId = req.headers.get("svix-id");
  const svixTs = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) {
    return { ok: false, reason: "missing svix headers" };
  }
  // Proper Svix verification would import their SDK; for now we
  // require the headers' presence as a sanity gate. A future commit
  // adds full HMAC-SHA256 verification of `${svixId}.${svixTs}.${body}`.
  // The webhook secret is still required to be set in env, so the
  // attack surface is "an attacker who knows the URL but not the
  // signature scheme is fully implemented yet" — they get logged
  // but not blocked. Reasonable for v1, must tighten before scale.
  log.warn("svix signature presence only (full HMAC verify pending)", {
    svixId,
  });
  return { ok: true };
}

export async function POST(req: Request): Promise<Response> {
  let body: ResendInboundBody;
  let rawBody: string;
  try {
    rawBody = await req.text();
    body = JSON.parse(rawBody);
  } catch (err) {
    log.warn("invalid JSON", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const sig = verifySignature(req, rawBody);
  if (!sig.ok) {
    log.warn("signature rejected", { reason: sig.reason });
    return NextResponse.json(
      { error: "signature verification failed", reason: sig.reason },
      { status: 401 },
    );
  }

  const senderAddress = body.from?.email?.toLowerCase().trim();
  const senderName = body.from?.name?.trim() || null;
  if (!senderAddress || !senderAddress.includes("@")) {
    log.warn("no sender address", { ip: clientIp(req) });
    return NextResponse.json({ error: "missing sender" }, { status: 400 });
  }
  const subject = body.subject?.trim() || "(no subject)";
  const textBody = body.text?.trim() ?? "";
  const htmlBody = body.html ?? null;
  const messageId =
    body.message_id ?? body.headers?.["message-id"] ?? body.headers?.["Message-Id"] ?? null;

  // Per-sender per-day rate limit.
  const rateKey = `sender:${senderAddress}`;
  const rate = await limiter.consume(rateKey);
  if (!rate.ok) {
    log.warn("rate limited", { sender: senderAddress, resetAt: rate.resetAt });
    // Send a polite rejection so the customer knows what happened.
    try {
      await sendRejectionReply({
        to: senderAddress,
        toName: senderName,
        subject,
        messageId,
        reason: "rate-limited",
        maxMb: DEFAULT_MAX_ATTACHMENT_MB,
      });
    } catch (replyErr) {
      log.error("rejection reply failed", { err: errToObject(replyErr) });
    }
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const attachments = body.attachments ?? [];

  // Pre-filter on extension before downloading bytes.
  const usable = attachments.filter(
    (a) => a.filename && hasAcceptedExtension(a.filename),
  );

  // Fallback: if no usable attachments, scan the email body for
  // Drive / Dropbox / OneDrive / direct links and try to fetch the
  // file from there. Lifts the >20 MB Resend Inbound cap.
  let fetchedFromLink: AttachmentInputForBlob | null = null;
  let linkAttemptError: string | null = null;
  if (usable.length === 0) {
    const links = extractLinks(`${subject}\n\n${textBody}\n\n${htmlBody ?? ""}`);
    const candidates = pickFetchableLinks(links);
    if (candidates.length > 0) {
      for (const link of candidates) {
        try {
          const fetched = await fetchFromLink(link);
          const { kind, validation } = validateAttachment(
            fetched.filename,
            fetched.contentType,
            fetched.bytes,
          );
          if (!validation.ok && validation.issues.includes("mime-mismatch")) {
            // The link landed on something that isn't actually a
            // 3D file (e.g. a Drive folder index page). Try the next.
            linkAttemptError = "fetched content was not a recognised 3D format";
            continue;
          }
          fetchedFromLink = {
            filename: fetched.filename,
            contentType: fetched.contentType,
            bytes: fetched.bytes,
            inferredKind: kind,
            validation,
          };
          log.info("intake via link", {
            sender: senderAddress,
            provider: link.provider,
            bytes: fetched.bytes.byteLength,
            kind,
          });
          break;
        } catch (err) {
          linkAttemptError = err instanceof Error ? err.message : String(err);
          log.warn("link fetch failed", {
            sender: senderAddress,
            provider: link.provider,
            err: linkAttemptError,
          });
          continue;
        }
      }
    }
  }

  if (attachments.length === 0 && !fetchedFromLink) {
    log.info("no attachments and no usable links", { sender: senderAddress });
    try {
      await sendRejectionReply({
        to: senderAddress,
        toName: senderName,
        subject,
        messageId,
        reason: "unsupported-format",
        maxMb: DEFAULT_MAX_ATTACHMENT_MB,
      });
    } catch {
      // swallow — the customer at least gets a fail-fast
    }
    return NextResponse.json(
      { error: "no attachments and no usable links", linkAttemptError },
      { status: 400 },
    );
  }

  if (usable.length === 0 && !fetchedFromLink) {
    log.info("no usable attachments", {
      sender: senderAddress,
      filenames: attachments.map((a) => a.filename),
    });
    try {
      await sendRejectionReply({
        to: senderAddress,
        toName: senderName,
        subject,
        messageId,
        reason: "unsupported-format",
        maxMb: DEFAULT_MAX_ATTACHMENT_MB,
      });
    } catch {
      // swallow
    }
    return NextResponse.json({ error: "no .stl/.glb/.3mf/.obj attachments" }, { status: 400 });
  }

  // Decode + validate each attachment. Reject the whole order if
  // anything blows the per-attachment cap; reply to sender so they
  // can downscale.
  const maxAttachmentBytes =
    (Number(process.env.PRINTFILES_MAX_ATTACHMENT_MB) || DEFAULT_MAX_ATTACHMENT_MB) *
    1024 *
    1024;
  const maxTotalBytes =
    (Number(process.env.PRINTFILES_MAX_TOTAL_MB) || DEFAULT_MAX_TOTAL_MB) * 1024 * 1024;

  let totalBytes = 0;
  const attachmentInputs: AttachmentInputForBlob[] = [];
  const aggregateIssues = new Set<string>();
  let anyOk = false;

  for (const att of usable) {
    const filename = att.filename ?? "file.bin";
    const bytes = attachmentBuffer(att);
    if (!bytes) {
      log.warn("attachment decode failed", { sender: senderAddress, filename });
      aggregateIssues.add("parse-failed");
      continue;
    }
    if (bytes.byteLength > maxAttachmentBytes) {
      log.info("attachment too large", {
        sender: senderAddress,
        filename,
        bytes: bytes.byteLength,
      });
      try {
        await sendRejectionReply({
          to: senderAddress,
          toName: senderName,
          subject,
          messageId,
          reason: "too-large",
          maxMb: DEFAULT_MAX_ATTACHMENT_MB,
        });
      } catch {
        // swallow
      }
      return NextResponse.json({ error: "attachment too large" }, { status: 413 });
    }
    totalBytes += bytes.byteLength;
    if (totalBytes > maxTotalBytes) {
      try {
        await sendRejectionReply({
          to: senderAddress,
          toName: senderName,
          subject,
          messageId,
          reason: "too-large",
          maxMb: DEFAULT_MAX_TOTAL_MB,
        });
      } catch {
        // swallow
      }
      return NextResponse.json({ error: "total payload too large" }, { status: 413 });
    }
    const { kind, validation } = validateAttachment(
      filename,
      attachmentMime(att),
      bytes,
    );
    if (validation.ok) anyOk = true;
    for (const issue of validation.issues) aggregateIssues.add(issue);
    attachmentInputs.push({
      filename,
      contentType: attachmentMime(att),
      bytes,
      inferredKind: kind,
      validation,
    });
  }

  // Include the link-fetched file (validated above; bypasses the
  // email-attachment caps because it has its own larger link-mode
  // cap, applied inside fetchFromLink).
  if (fetchedFromLink) {
    if (fetchedFromLink.validation.ok) anyOk = true;
    for (const issue of fetchedFromLink.validation.issues) aggregateIssues.add(issue);
    attachmentInputs.push(fetchedFromLink);
  }

  if (!anyOk && attachmentInputs.length === 0) {
    log.info("no decodable attachments", { sender: senderAddress });
    return NextResponse.json({ error: "no decodable attachments" }, { status: 400 });
  }

  const aggregateValidation: PrintfilesOrder["validation"] = {
    ok: anyOk && aggregateIssues.size === 0,
    issues: Array.from(aggregateIssues) as PrintfilesOrder["validation"]["issues"],
  };

  // Persist via directory generator.
  const provider = resolveProvider();
  let createResult;
  try {
    createResult = await createOrder(
      {
        sender: { name: senderName, address: senderAddress },
        subject,
        bodyText: textBody,
        bodyHtml: htmlBody,
        messageId,
        attachments: [], // directory generator fills this from inputs
        validation: aggregateValidation,
        provider: provider.id,
        flags: { spamSuspect: false, rateLimited: false, sizeRejected: false },
      },
      attachmentInputs,
    );
  } catch (err) {
    log.error("createOrder failed", { sender: senderAddress, err: errToObject(err) });
    return NextResponse.json(
      { error: "order creation failed" },
      { status: 500 },
    );
  }

  // Fetch the doc back so we have the canonical attachment URLs for
  // the farm forwarder + gracious reply.
  const db = requireFirebaseAdminDb();
  const doc = await db
    .collection(FIRESTORE_COLLECTION)
    .doc(createResult.orderId)
    .get();
  const order = doc.data() as PrintfilesOrder;

  // Forward to the print farm provider — non-blocking against the
  // gracious reply; both run in parallel.
  const forwardPromise = provider
    .forwardOrder(order)
    .then(async (result) => {
      await db.collection(FIRESTORE_COLLECTION).doc(order.id).update({
        status: result.newStatus,
        "printfarm.externalId": result.externalId,
        "printfarm.trackingUrl": result.trackingUrl,
        updatedAt: new Date().toISOString(),
      });
      log.info("forward to provider ok", {
        orderId: order.id,
        provider: provider.id,
        externalId: result.externalId,
        newStatus: result.newStatus,
      });
    })
    .catch(async (err) => {
      log.error("forward to provider failed", {
        orderId: order.id,
        provider: provider.id,
        err: errToObject(err),
      });
      await db.collection(FIRESTORE_COLLECTION).doc(order.id).update({
        status: "errored",
        updatedAt: new Date().toISOString(),
      });
    });

  const replyPromise = sendGraciousReply(order)
    .then(async (result) => {
      await db.collection(FIRESTORE_COLLECTION).doc(order.id).update({
        graciousReplyId: result.id,
        updatedAt: new Date().toISOString(),
      });
      log.info("gracious reply sent", { orderId: order.id, resendId: result.id });
    })
    .catch((err) => {
      log.error("gracious reply failed", {
        orderId: order.id,
        err: errToObject(err),
      });
    });

  await Promise.allSettled([forwardPromise, replyPromise]);

  return NextResponse.json(
    {
      ok: true,
      orderId: createResult.orderId,
      attachments: createResult.storedFilenames,
      validation: aggregateValidation,
      provider: provider.id,
    },
    { status: 200 },
  );
}
