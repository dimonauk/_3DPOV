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
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

/**
 * POST /api/cards/scan — extract contact fields from a card photo.
 *
 * Auth: signed-in users only — we use the user's identity for
 * rate-limiting (10 scans / hour / uid) to keep Anthropic spend
 * predictable. Visitors can't anonymously hammer this.
 *
 * Body (JSON only — the multipart + imageBase64 legacy paths were
 * dropped now that all clients go browser→Blob direct):
 *   { blobUrl: string, mediaType?: string }
 *
 * blobUrl must point at scan-temp/* on our Vercel Blob host. Any
 * other URL is refused.
 *
 * Every response carries X-Request-Id for log correlation.
 *
 * Rate limiting uses lib/rate-limit/fixed-window — auto-uses Upstash
 * Redis when KV_REST_API_URL or UPSTASH_REDIS_REST_URL is configured
 * (cross-region consistent), falls back to in-memory per-instance
 * Maps otherwise.
 *
 * Response:
 *   200 → ExtractedCardFields
 *   400 → bad body (missing/invalid blobUrl)
 *   401 → not authenticated
 *   413 → image too large (>5 MB after decode)
 *   429 → rate limit exceeded
 *   503 → AI_GATEWAY_API_KEY not configured
 *   502 → upstream AI / blob fetch error
 *   500 → internal error (uncaught throw — request id in body)
 */

export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Module-scoped limiter — one instance per cold start, shared across
// requests on the same isolate. The factory probes the Redis env vars
// once at module init and caches the decision.
const scanLimiter = createFixedWindowLimiter({
  scope: "cards.scan",
  limit: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const POST = withRouteLogging(
  "cards.scan",
  async (req: NextRequest, _ctx, log) => {
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

    // --- Auth ---
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

    // --- Rate limit ---
    const limit = await scanLimiter.consume(`uid:${uid}`);
    if (!limit.ok) {
      log.info("rate_limited", { uid, backend: scanLimiter.backend });
      return NextResponse.json(
        {
          error: "rate_limited",
          message: `10 scans per hour per user.`,
          resetAt: limit.resetAt,
        },
        { status: 429 },
      );
    }

    // --- Body parse ---
    // Only blobUrl is accepted. The multipart + imageBase64 paths used
    // to be here for backward compat with pre-Step-4 clients; both
    // have been gone for one deploy cycle and were dead code.
    let blobUrlToDelete: string | null = null;
    let imageBase64 = "";
    let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
      "image/jpeg";
    let imageBytes = 0;

    try {
      const body = (await req.json()) as {
        blobUrl?: string;
        mediaType?: string;
      };

      if (!body.blobUrl) {
        log.info("body:missing_blob_url");
        return NextResponse.json(
          {
            error: "missing_blob_url",
            message:
              "POST { blobUrl: string } — upload the image to /api/cards/scan/upload-token first.",
          },
          { status: 400 },
        );
      }

      // Refuse anything that isn't our own scan-temp/ prefix on the
      // public Blob store — defence against an attacker passing a
      // 10 GB URL or a URL that lives somewhere expensive to fetch.
      const url = body.blobUrl;
      const isVercelBlob =
        /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(url);
      if (!isVercelBlob || !url.includes("/scan-temp/")) {
        log.warn("body:invalid_blob_url", { url });
        return NextResponse.json(
          { error: "invalid_blob_url" },
          { status: 400 },
        );
      }
      blobUrlToDelete = url;

      // --- Fetch the bytes from Blob ---
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

      // Read with a hard byte ceiling. Vercel Blob serves Content-Length
      // so we can short-circuit oversized files before allocating.
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
      const ct = (
        body.mediaType ||
        fetched.headers.get("content-type") ||
        ""
      ).toLowerCase();
      if (ct.includes("png")) mediaType = "image/png";
      else if (ct.includes("webp")) mediaType = "image/webp";
      else if (ct.includes("gif")) mediaType = "image/gif";
      else mediaType = "image/jpeg";
    } catch (err) {
      log.warn("body:invalid", { err: errToObject(err) });
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    // --- Scan ---
    log.info("scan:start", {
      uid,
      mediaType,
      imageBytes,
      rateBackend: scanLimiter.backend,
    });
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
          headers: {
            "X-Holoflow-Scans-Remaining": String(limit.remaining),
            "X-Rate-Limit-Backend": scanLimiter.backend,
          },
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
      // blob that the daily cron will sweep — never block the visitor
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
  },
);
