/**
 * lib/printfiles/fetch-from-link.ts — fetch a printfile from a Drive /
 * Dropbox / direct link.
 *
 * Used by the intake listener when the customer's email had no
 * usable attachments but DID have a Drive/Dropbox/etc URL in the
 * body. We follow the direct URL, stream the bytes, cap at the
 * link-mode size limit (looser than the email-attachment cap), and
 * return the bytes for the directory generator.
 *
 * # Size cap
 *
 * Defaults to PRINTFILES_MAX_LINK_MB (default 100 MB) — much higher
 * than the 20 MB email-attachment cap because we're no longer
 * constrained by Resend Inbound. 100 MB is what slant3d + treatstock
 * accept comfortably; larger probably means the customer is sending
 * the wrong file.
 */

import "server-only";

import { Buffer } from "node:buffer";

import { createLogger } from "lib/log";

import type { ExtractedLink } from "./link-extractor";

const log = createLogger("printfiles.fetch-from-link");

const DEFAULT_MAX_LINK_MB = 100;
const FETCH_TIMEOUT_MS = 60_000; // 60s — large files over Drive/Dropbox

export type FetchedFile = {
  filename: string;
  contentType: string;
  bytes: Buffer;
  sourceUrl: string;
};

export type FetchFromLinkError = {
  code:
    | "no-direct-url"
    | "fetch-failed"
    | "too-large"
    | "wrong-content-type"
    | "interstitial-detected";
  message: string;
};

function maxBytes(): number {
  const env = process.env.PRINTFILES_MAX_LINK_MB;
  const mb = env ? Number(env) : DEFAULT_MAX_LINK_MB;
  if (!Number.isFinite(mb) || mb <= 0) return DEFAULT_MAX_LINK_MB * 1024 * 1024;
  return Math.floor(mb * 1024 * 1024);
}

/**
 * The Drive direct-download URL sometimes returns an HTML interstitial
 * ("This file is too large for Google to scan for viruses, are you
 * sure?") instead of bytes when the file is over ~25 MB. Detect this
 * by sniffing the first 1024 bytes for `<!DOCTYPE html>` or `<html`.
 * The caller can surface a clearer error to the customer ("ask them
 * to share with 'Anyone with the link can VIEW' enabled, or send via
 * Dropbox/OneDrive instead").
 */
function looksLikeHtml(bytes: Buffer): boolean {
  const head = bytes.subarray(0, 1024).toString("utf8").toLowerCase();
  return head.includes("<!doctype html") || head.includes("<html");
}

/**
 * Fetch a single ExtractedLink. Returns the file bytes on success;
 * throws an Error with `.code` set to a FetchFromLinkError code on
 * failure.
 */
export async function fetchFromLink(link: ExtractedLink): Promise<FetchedFile> {
  if (!link.directUrl) {
    const detail: FetchFromLinkError = {
      code: "no-direct-url",
      message:
        link.provider === "wetransfer"
          ? "WeTransfer links require a click-through; can't fetch automatically. " +
            "Ask the sender to upload via Dropbox / Drive / OneDrive instead."
          : `No direct URL available for ${link.provider} link.`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }

  log.info("fetching from link", {
    provider: link.provider,
    directUrl: link.directUrl,
    expectedFilename: link.inferredFilename,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(link.directUrl, {
      // Follow redirects; Drive's uc?export=download URL bounces
      // through a content-disposition redirect to the actual blob.
      redirect: "follow",
      signal: controller.signal,
      // Force a desktop UA — some providers serve a different page
      // (mobile interstitial, app-store redirect) to default fetch UA.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    const detail: FetchFromLinkError = {
      code: "fetch-failed",
      message: `fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const detail: FetchFromLinkError = {
      code: "fetch-failed",
      message: `HTTP ${res.status} ${res.statusText} from ${link.provider}`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }

  // Check Content-Length BEFORE reading the body so we don't pull
  // 5 GB into memory by accident. Providers may omit Content-Length
  // (e.g. chunked transfer); if so, we cap during streaming.
  const max = maxBytes();
  const announced = Number(res.headers.get("content-length") ?? "");
  if (Number.isFinite(announced) && announced > max) {
    const detail: FetchFromLinkError = {
      code: "too-large",
      message: `Announced size ${(announced / 1024 / 1024).toFixed(1)} MB > ${(max / 1024 / 1024).toFixed(0)} MB cap`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const arr = await res.arrayBuffer();
  const bytes = Buffer.from(arr);

  if (bytes.byteLength > max) {
    const detail: FetchFromLinkError = {
      code: "too-large",
      message: `Downloaded ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB > ${(max / 1024 / 1024).toFixed(0)} MB cap`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }

  // Drive's "this file is too large for virus scan" interstitial
  // returns HTML even at the direct-download URL.
  if (looksLikeHtml(bytes)) {
    const detail: FetchFromLinkError = {
      code: "interstitial-detected",
      message:
        `Provider returned an HTML page instead of bytes — likely a ` +
        `virus-scan interstitial (Drive) or login wall. Ask the sender ` +
        `to set the file to "Anyone with the link" (Drive) or use ` +
        `Dropbox / OneDrive.`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }

  // Best-effort content-type sanity check. Drive sometimes returns
  // `application/octet-stream` (acceptable) or the real MIME
  // (`model/stl`, `model/gltf-binary`). We don't reject on this — the
  // ingest pipeline's magic-byte sniff is the source of truth.
  if (contentType.startsWith("text/html")) {
    const detail: FetchFromLinkError = {
      code: "wrong-content-type",
      message: `Provider returned content-type=${contentType} (expected octet-stream / model/*).`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }

  const filename =
    link.inferredFilename ||
    extractFilenameFromContentDisposition(res.headers.get("content-disposition")) ||
    "model.stl";

  log.info("fetched ok", {
    provider: link.provider,
    bytes: bytes.byteLength,
    contentType,
    filename,
  });

  return {
    filename,
    contentType,
    bytes,
    sourceUrl: link.rawUrl,
  };
}

/**
 * Extract a filename from a `Content-Disposition: attachment; filename="..."`
 * header. Returns null if absent or unparseable.
 */
function extractFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  // Try RFC 5987 first: `filename*=UTF-8''<percent-encoded>`
  const star = /filename\*=([^;]+)/i.exec(header);
  if (star) {
    const v = star[1]!;
    const mm = /^[^']*'[^']*'(.+)$/.exec(v);
    if (mm) {
      try {
        return decodeURIComponent(mm[1]!);
      } catch {
        // fall through
      }
    }
  }
  const simple = /filename="?([^";]+)"?/i.exec(header);
  if (simple) return simple[1]!.trim();
  return null;
}
