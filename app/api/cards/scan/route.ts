// BOM-strip BLOB_READ_WRITE_TOKEN at module load so del() can use it.
// Vercel's env-var UI prepended a U+FEFF when the token was first
// pasted; @vercel/blob reads process.env directly, so we have to mutate
// before the SDK gets to it.
if (
  typeof process !== "undefined" &&
  process.env.BLOB_READ_WRITE_TOKEN &&
  process.env.BLOB_READ_WRITE_TOKEN.charCodeAt(0) === 0xfeff
) {
  process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN.slice(
    1,
  ).trim();
}

import { NextResponse, type NextRequest } from "next/server";
import { del as deleteBlob } from "@vercel/blob";
import {
  isScannerConfigured,
  scanCardImage,
  type ExtractedCardFields,
} from "lib/cards/scanner-server";
import { verifyIdToken } from "lib/firebase/admin";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * POST /api/cards/scan — extract contact fields from a card photo.
 *
 * Auth: signed-in users only — we use the user's identity for
 * rate-limiting (10 scans / hour / uid) to keep Anthropic spend
 * predictable. Visitors can't anonymously hammer this.
 *
 * Body (multipart/form-data OR JSON):
 *   multipart: file field named "image"
 *   JSON:      { imageBase64: string, mediaType?: string }
 *
 * Every response carries X-Request-Id for log correlation.
 *
 * Response:
 *   200 → ExtractedCardFields
 *   401 → not authenticated
 *   413 → image too large (>5 MB after decode)
 *   429 → rate limit exceeded
 *   503 → AI_GATEWAY_API_KEY not configured
 *   502 → upstream Anthropic API error
 *   500 → internal error (uncaught throw — request id in body)
 */

export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const RATE_LIMIT_PER_HOUR = 10;

type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();

function checkRate(uid: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const c = counters.get(uid);
  if (!c || c.resetAt < now) {
    counters.set(uid, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return { ok: true, remaining: RATE_LIMIT_PER_HOUR - 1 };
  }
  if (c.count >= RATE_LIMIT_PER_HOUR) return { ok: false, remaining: 0 };
  c.count += 1;
  return { ok: true, remaining: RATE_LIMIT_PER_HOUR - c.count };
}

export const POST = withRouteLogging("cards.scan", async (req: NextRequest, _ctx, log) => {
  if (!isScannerConfigured()) {
    log.warn("scanner_not_configured");
    return NextResponse.json(
      {
        error: "scanner_not_configured",
        message:
          "The AI scanner needs AI_GATEWAY_API_KEY in Vercel env vars. Set it and the scanner activates everywhere.",
      },
      { status: 503 },
    );
  }

  // Auth.
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    log.info("auth:missing_token");
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let uid: string;
  try {
    uid = (await verifyIdToken(token)).uid;
  } catch (err) {
    log.warn("auth:invalid_token", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  log.debug("auth:ok", { uid });

  const limit = checkRate(uid);
  if (!limit.ok) {
    log.info("rate_limited", { uid });
    return NextResponse.json(
      { error: "rate_limited", message: "10 scans per hour per user." },
      { status: 429 },
    );
  }

  // Parse body.
  const contentType = req.headers.get("content-type") ?? "";
  let imageBase64 = "";
  let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
    "image/jpeg";
  let imageBytes = 0;
  // If the client used the Blob upload path, this holds the temp URL
  // we need to delete after the scan completes (success or failure).
  let blobUrlToDelete: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("image");
      if (!(file instanceof File)) {
        log.info("body:missing_image");
        return NextResponse.json({ error: "missing_image" }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        log.info("body:image_too_large", { size: file.size, max: MAX_IMAGE_BYTES });
        return NextResponse.json(
          { error: "image_too_large", maxBytes: MAX_IMAGE_BYTES },
          { status: 413 },
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      imageBase64 = buf.toString("base64");
      imageBytes = buf.length;
      const ft = (file.type || "").toLowerCase();
      if (ft === "image/png") mediaType = "image/png";
      else if (ft === "image/webp") mediaType = "image/webp";
      else if (ft === "image/gif") mediaType = "image/gif";
      else mediaType = "image/jpeg";
    } else {
      const body = (await req.json()) as {
        imageBase64?: string;
        blobUrl?: string;
        mediaType?: string;
      };

      // Preferred path: blobUrl from a browser-direct Vercel Blob
      // upload. The function fetches the bytes once, then deletes
      // the temp blob.
      if (body.blobUrl) {
        // Refuse anything that isn't our own scan-temp/ prefix on the
        // public Blob store — defence against an attacker passing a
        // 10 GB URL or a URL that lives somewhere expensive to fetch.
        const url = body.blobUrl;
        const isVercelBlob = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(
          url,
        );
        if (!isVercelBlob || !url.includes("/scan-temp/")) {
          log.warn("body:invalid_blob_url", { url });
          return NextResponse.json(
            { error: "invalid_blob_url" },
            { status: 400 },
          );
        }
        blobUrlToDelete = url;

        let fetched: Response;
        try {
          fetched = await fetch(url);
        } catch (err) {
          log.warn("blob:fetch_failed", { err: errToObject(err), url });
          return NextResponse.json(
            { error: "blob_fetch_failed" },
            { status: 502 },
          );
        }
        if (!fetched.ok) {
          log.warn("blob:fetch_status", { status: fetched.status, url });
          return NextResponse.json(
            { error: "blob_fetch_failed", status: fetched.status },
            { status: 502 },
          );
        }

        // Read the response with a hard byte ceiling. Vercel Blob serves
        // Content-Length headers so we can short-circuit oversized files
        // before allocating the buffer.
        const lenHeader = fetched.headers.get("content-length");
        if (lenHeader && Number(lenHeader) > MAX_IMAGE_BYTES) {
          log.info("blob:too_large", { size: Number(lenHeader) });
          return NextResponse.json(
            { error: "image_too_large", maxBytes: MAX_IMAGE_BYTES },
            { status: 413 },
          );
        }
        const buf = Buffer.from(await fetched.arrayBuffer());
        if (buf.length > MAX_IMAGE_BYTES) {
          log.info("blob:too_large_post", { size: buf.length });
          return NextResponse.json(
            { error: "image_too_large", maxBytes: MAX_IMAGE_BYTES },
            { status: 413 },
          );
        }
        imageBytes = buf.length;
        imageBase64 = buf.toString("base64");

        // Pick mediaType: client hint > Content-Type > jpeg default.
        const ct = (body.mediaType || fetched.headers.get("content-type") || "")
          .toLowerCase();
        if (ct.includes("png")) mediaType = "image/png";
        else if (ct.includes("webp")) mediaType = "image/webp";
        else if (ct.includes("gif")) mediaType = "image/gif";
        else mediaType = "image/jpeg";
      } else if (body.imageBase64) {
        // Legacy path: full base64 in the JSON body. Kept for backward
        // compatibility with any pre-Step-4 client.
        imageBytes = Math.round(body.imageBase64.length * 0.75);
        if (imageBytes > MAX_IMAGE_BYTES) {
          log.info("body:image_too_large", { size: imageBytes, max: MAX_IMAGE_BYTES });
          return NextResponse.json(
            { error: "image_too_large" },
            { status: 413 },
          );
        }
        imageBase64 = body.imageBase64;
        if (body.mediaType === "image/png") mediaType = "image/png";
        else if (body.mediaType === "image/webp") mediaType = "image/webp";
        else if (body.mediaType === "image/gif") mediaType = "image/gif";
      } else {
        log.info("body:missing_image_source");
        return NextResponse.json(
          { error: "missing_image_source", message: "expected blobUrl or imageBase64" },
          { status: 400 },
        );
      }
    }
  } catch (err) {
    log.warn("body:invalid", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  log.info("scan:start", { uid, mediaType, imageBytes, source: blobUrlToDelete ? "blob" : "inline" });
  try {
    const extracted: ExtractedCardFields = await scanCardImage(
      imageBase64,
      mediaType,
    );
    log.info("scan:ok", {
      uid,
      confidence: extracted.confidence,
      foundFields: {
        name: !!extracted.name,
        role: !!extracted.role,
        email: !!extracted.email,
        phone: !!extracted.phone,
        website: !!extracted.website,
        handles: extracted.handles?.length ?? 0,
      },
    });
    return NextResponse.json(
      { ok: true, extracted, remaining: limit.remaining },
      {
        status: 200,
        headers: { "X-Holoflow-Scans-Remaining": String(limit.remaining) },
      },
    );
  } catch (err) {
    const msg = (err as Error).message ?? "unknown_error";
    log.error("scan:failed", { uid, err: errToObject(err) });
    return NextResponse.json(
      { error: "scan_failed", message: msg },
      { status: 502 },
    );
  } finally {
    // Best-effort: delete the temp blob so we don't accumulate
    // visitor scan images. A failed delete just leaves a stranded
    // blob that we can sweep later — never block the visitor
    // response on this.
    if (blobUrlToDelete) {
      try {
        await deleteBlob(blobUrlToDelete);
        log.debug("blob:deleted", { url: blobUrlToDelete });
      } catch (err) {
        log.warn("blob:delete_failed", {
          err: errToObject(err),
          url: blobUrlToDelete,
        });
      }
    }
  }
});
