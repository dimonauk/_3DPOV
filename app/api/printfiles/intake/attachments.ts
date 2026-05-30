/**
 * app/api/printfiles/intake/attachments.ts
 *
 * Pure helpers for working with inbound email attachments:
 *   - attachmentBuffer: base64 → Buffer (returns null on malformed)
 *   - attachmentMime: pick whichever field the transport happened to use
 *   - hasAcceptedExtension: filename extension allowlist check
 *   - pickFetchableLinks: rank extracted links by fetch likelihood and
 *     return the top 3 candidates with a directUrl
 */

import { Buffer } from "node:buffer";

import { ACCEPTED_EXTENSIONS } from "lib/printfiles/types";
import type { ExtractedLink } from "lib/printfiles/link-extractor";

import type { ResendInboundAttachment } from "./types";

/** Pull bytes off an attachment regardless of which field name the
 *  transport chose. */
export function attachmentBuffer(att: ResendInboundAttachment): Buffer | null {
  const b64 = att.content_base64 ?? att.content;
  if (!b64) return null;
  try {
    return Buffer.from(b64, "base64");
  } catch {
    return null;
  }
}

export function attachmentMime(att: ResendInboundAttachment): string {
  return att.content_type ?? att.contentType ?? "application/octet-stream";
}

export function hasAcceptedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Pick which extracted links are worth trying to fetch.
 *
 * Drive / Dropbox / OneDrive don't tell us the file extension
 * upfront — try them even when hasAcceptedExtension is false (the
 * fetched content's magic bytes are the source of truth). Direct
 * links need the extension for the pre-fetch sanity check.
 *
 * Cap at 3 attempts so we don't burn time on a sender with a wall
 * of links in their signature.
 */
export function pickFetchableLinks(
  links: ExtractedLink[],
): ExtractedLink[] {
  const ranked = [...links];
  ranked.sort((a, b) => {
    // Direct URLs with the right extension first (highest confidence).
    if (
      a.provider === "direct" &&
      a.hasAcceptedExtension &&
      b.provider !== "direct"
    )
      return -1;
    if (
      b.provider === "direct" &&
      b.hasAcceptedExtension &&
      a.provider !== "direct"
    )
      return 1;
    // Then Drive / Dropbox / OneDrive (have a direct-url).
    if (a.directUrl && !b.directUrl) return -1;
    if (b.directUrl && !a.directUrl) return 1;
    return 0;
  });
  return ranked.filter((l) => l.directUrl !== null).slice(0, 3);
}
