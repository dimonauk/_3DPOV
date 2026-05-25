/**
 * app/api/printfiles/intake/route.ts — the listener.
 *
 * Receives inbound emails routed to printfiles@holoflow.co.uk via
 * Resend Inbound webhook. Thin orchestrator: composes signature
 * verification, rate limiting, attachment collection (with link
 * fallback), persistence, and post-persist fan-out.
 *
 * Composition:
 *   ./types.ts                — webhook envelope shapes
 *   ./signature.ts            — verifySignature + clientIp
 *   ./attachments.ts          — attachmentBuffer / attachmentMime /
 *                                hasAcceptedExtension /
 *                                pickFetchableLinks (pure)
 *   ./collect-attachments.ts  — extension filter + link fallback +
 *                                decode + per-attachment & per-total
 *                                size caps + validation
 *   ./dispatch.ts             — forward to print-farm + gracious reply
 *
 * Contract: never throws. Every failure mode → structured JSON +
 * appropriate HTTP status. The print-farm forward + gracious reply
 * fan out in parallel via `Promise.allSettled` so a slow provider
 * doesn't delay the buyer's confirmation email.
 */

import { NextResponse } from "next/server";

import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

import { createOrder } from "lib/printfiles/directory";
import { sendRejectionReply } from "lib/printfiles/reply";
import {
  DEFAULT_MAX_ATTACHMENT_MB,
  DEFAULT_MAX_TOTAL_MB,
  FIRESTORE_COLLECTION,
  type PrintfilesOrder,
} from "lib/printfiles/types";
import { resolveProvider } from "lib/printfarm";
import { requireFirebaseAdminDb } from "lib/firebase/admin";

import { collectAttachments } from "./collect-attachments";
import { forwardToProvider, sendReply } from "./dispatch";
import { clientIp, verifySignature } from "./signature";
import type { ResendInboundBody } from "./types";

export const dynamic = "force-dynamic";

const log = createLogger("api.printfiles.intake");

const PER_SENDER_PER_DAY = 10;
const limiter = createFixedWindowLimiter({
  scope: "api.printfiles.intake",
  limit: PER_SENDER_PER_DAY,
  windowMs: 24 * 60 * 60 * 1000,
});

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
    body.message_id ??
    body.headers?.["message-id"] ??
    body.headers?.["Message-Id"] ??
    null;

  // Per-sender per-day rate limit.
  const rate = await limiter.consume(`sender:${senderAddress}`);
  if (!rate.ok) {
    log.warn("rate limited", {
      sender: senderAddress,
      resetAt: rate.resetAt,
    });
    await silentReject({
      to: senderAddress,
      toName: senderName,
      subject,
      messageId,
      reason: "rate-limited",
      maxMb: DEFAULT_MAX_ATTACHMENT_MB,
    });
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const maxAttachmentBytes =
    (Number(process.env.PRINTFILES_MAX_ATTACHMENT_MB) ||
      DEFAULT_MAX_ATTACHMENT_MB) *
    1024 *
    1024;
  const maxTotalBytes =
    (Number(process.env.PRINTFILES_MAX_TOTAL_MB) || DEFAULT_MAX_TOTAL_MB) *
    1024 *
    1024;

  const collection = await collectAttachments({
    attachments: body.attachments ?? [],
    subject,
    textBody,
    htmlBody,
    senderAddress,
    maxAttachmentBytes,
    maxTotalBytes,
  });

  if (!collection.ok) {
    return handleCollectFailure(collection, {
      to: senderAddress,
      toName: senderName,
      subject,
      messageId,
    });
  }

  const aggregateValidation: PrintfilesOrder["validation"] = {
    ok: collection.anyOk && collection.aggregateIssues.size === 0,
    issues: Array.from(
      collection.aggregateIssues,
    ) as PrintfilesOrder["validation"]["issues"],
  };

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
      collection.inputs,
    );
  } catch (err) {
    log.error("createOrder failed", {
      sender: senderAddress,
      err: errToObject(err),
    });
    return NextResponse.json(
      { error: "order creation failed" },
      { status: 500 },
    );
  }

  // Fetch the canonical doc — directory generator wrote attachment
  // URLs that the forwarder + reply need.
  const db = requireFirebaseAdminDb();
  const doc = await db
    .collection(FIRESTORE_COLLECTION)
    .doc(createResult.orderId)
    .get();
  const order = doc.data() as PrintfilesOrder;

  // Forward + gracious reply fan out in parallel; either may fail
  // without blocking the other or the response.
  await Promise.allSettled([
    forwardToProvider(order, provider),
    sendReply(order),
  ]);

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

// ---------------------------------------------------------------------
// Failure handlers
// ---------------------------------------------------------------------

type RejectArgs = {
  to: string;
  toName: string | null;
  subject: string;
  messageId: string | null;
};

async function silentReject(args: RejectArgs & {
  reason: "rate-limited" | "unsupported-format" | "too-large";
  maxMb: number;
}): Promise<void> {
  try {
    await sendRejectionReply(args);
  } catch (err) {
    log.error("rejection reply failed", { err: errToObject(err) });
  }
}

function handleCollectFailure(
  failure: Extract<
    Awaited<ReturnType<typeof collectAttachments>>,
    { ok: false }
  >,
  reject: RejectArgs,
): Response {
  switch (failure.reason) {
    case "too-large-single":
      void silentReject({
        ...reject,
        reason: "too-large",
        maxMb: DEFAULT_MAX_ATTACHMENT_MB,
      });
      return NextResponse.json(
        { error: "attachment too large" },
        { status: 413 },
      );
    case "too-large-total":
      void silentReject({
        ...reject,
        reason: "too-large",
        maxMb: DEFAULT_MAX_TOTAL_MB,
      });
      return NextResponse.json(
        { error: "total payload too large" },
        { status: 413 },
      );
    case "no-attachments-no-links":
      void silentReject({
        ...reject,
        reason: "unsupported-format",
        maxMb: DEFAULT_MAX_ATTACHMENT_MB,
      });
      return NextResponse.json(
        {
          error: "no attachments and no usable links",
          linkAttemptError: failure.linkAttemptError,
        },
        { status: 400 },
      );
    case "no-usable-attachments":
      void silentReject({
        ...reject,
        reason: "unsupported-format",
        maxMb: DEFAULT_MAX_ATTACHMENT_MB,
      });
      return NextResponse.json(
        { error: "no .stl/.glb/.3mf/.obj attachments" },
        { status: 400 },
      );
    case "no-decodable":
      return NextResponse.json(
        { error: "no decodable attachments" },
        { status: 400 },
      );
  }
}
