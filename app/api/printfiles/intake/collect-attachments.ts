/**
 * app/api/printfiles/intake/collect-attachments.ts
 *
 * The "find the file(s)" phase of the intake pipeline. Two sources:
 *
 *   1. Email attachments — filtered by extension allowlist, decoded
 *      from base64, validated by `validateAttachment`, capped by
 *      per-attachment and per-total byte limits.
 *   2. Link fallback — when no usable attachments, scan the body for
 *      Drive / Dropbox / OneDrive / direct links and fetch the first
 *      that resolves to a recognised 3D format.
 *
 * Returns a tagged result the orchestrator turns into either a 4xx
 * (with a polite rejection reply) or progresses to the persist phase.
 */

import { createLogger } from "lib/log";

import { type AttachmentInputForBlob } from "lib/printfiles/directory";
import { fetchFromLink } from "lib/printfiles/fetch-from-link";
import { validateAttachment } from "lib/printfiles/ingest";
import { extractLinks } from "lib/printfiles/link-extractor";

import {
  attachmentBuffer,
  attachmentMime,
  hasAcceptedExtension,
  pickFetchableLinks,
} from "./attachments";
import type { ResendInboundAttachment } from "./types";

const log = createLogger("api.printfiles.intake.collect");

export type CollectInput = {
  attachments: ResendInboundAttachment[];
  subject: string;
  textBody: string;
  htmlBody: string | null;
  senderAddress: string;
  maxAttachmentBytes: number;
  maxTotalBytes: number;
};

export type CollectResult =
  | {
      ok: true;
      inputs: AttachmentInputForBlob[];
      aggregateIssues: Set<string>;
      anyOk: boolean;
    }
  | {
      ok: false;
      reason:
        | "too-large-single"
        | "too-large-total"
        | "no-attachments-no-links"
        | "no-usable-attachments"
        | "no-decodable";
      linkAttemptError?: string;
    };

export async function collectAttachments(
  input: CollectInput,
): Promise<CollectResult> {
  const usable = input.attachments.filter(
    (a) => a.filename && hasAcceptedExtension(a.filename),
  );

  // Link fallback when no usable attachments.
  let fetchedFromLink: AttachmentInputForBlob | null = null;
  let linkAttemptError: string | undefined;
  if (usable.length === 0) {
    fetchedFromLink = await tryLinkFallback({
      subject: input.subject,
      textBody: input.textBody,
      htmlBody: input.htmlBody,
      senderAddress: input.senderAddress,
      onError: (err) => {
        linkAttemptError = err;
      },
    });
  }

  if (input.attachments.length === 0 && !fetchedFromLink) {
    return {
      ok: false,
      reason: "no-attachments-no-links",
      ...(linkAttemptError ? { linkAttemptError } : {}),
    };
  }
  if (usable.length === 0 && !fetchedFromLink) {
    log.info("no usable attachments", {
      sender: input.senderAddress,
      filenames: input.attachments.map((a) => a.filename),
    });
    return { ok: false, reason: "no-usable-attachments" };
  }

  // Decode + validate each attachment. Reject the whole order if
  // any blows the per-attachment cap.
  let totalBytes = 0;
  const attachmentInputs: AttachmentInputForBlob[] = [];
  const aggregateIssues = new Set<string>();
  let anyOk = false;

  for (const att of usable) {
    const filename = att.filename ?? "file.bin";
    const bytes = attachmentBuffer(att);
    if (!bytes) {
      log.warn("attachment decode failed", {
        sender: input.senderAddress,
        filename,
      });
      aggregateIssues.add("parse-failed");
      continue;
    }
    if (bytes.byteLength > input.maxAttachmentBytes) {
      log.info("attachment too large", {
        sender: input.senderAddress,
        filename,
        bytes: bytes.byteLength,
      });
      return { ok: false, reason: "too-large-single" };
    }
    totalBytes += bytes.byteLength;
    if (totalBytes > input.maxTotalBytes) {
      return { ok: false, reason: "too-large-total" };
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

  // Add the link-fetched file (bypasses email-attachment caps; the
  // link mode has its own larger cap applied inside fetchFromLink).
  if (fetchedFromLink) {
    if (fetchedFromLink.validation.ok) anyOk = true;
    for (const issue of fetchedFromLink.validation.issues)
      aggregateIssues.add(issue);
    attachmentInputs.push(fetchedFromLink);
  }

  if (!anyOk && attachmentInputs.length === 0) {
    return { ok: false, reason: "no-decodable" };
  }

  return { ok: true, inputs: attachmentInputs, aggregateIssues, anyOk };
}

async function tryLinkFallback(args: {
  subject: string;
  textBody: string;
  htmlBody: string | null;
  senderAddress: string;
  onError: (err: string) => void;
}): Promise<AttachmentInputForBlob | null> {
  const links = extractLinks(
    `${args.subject}\n\n${args.textBody}\n\n${args.htmlBody ?? ""}`,
  );
  const candidates = pickFetchableLinks(links);
  if (candidates.length === 0) return null;

  for (const link of candidates) {
    try {
      const fetched = await fetchFromLink(link);
      const { kind, validation } = validateAttachment(
        fetched.filename,
        fetched.contentType,
        fetched.bytes,
      );
      if (!validation.ok && validation.issues.includes("mime-mismatch")) {
        // The link landed on something that isn't actually a 3D file
        // (e.g. a Drive folder index page). Try the next.
        args.onError("fetched content was not a recognised 3D format");
        continue;
      }
      log.info("intake via link", {
        sender: args.senderAddress,
        provider: link.provider,
        bytes: fetched.bytes.byteLength,
        kind,
      });
      return {
        filename: fetched.filename,
        contentType: fetched.contentType,
        bytes: fetched.bytes,
        inferredKind: kind,
        validation,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      args.onError(msg);
      log.warn("link fetch failed", {
        sender: args.senderAddress,
        provider: link.provider,
        err: msg,
      });
    }
  }
  return null;
}
