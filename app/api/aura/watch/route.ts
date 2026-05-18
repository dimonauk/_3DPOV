import { NextResponse } from "next/server";
import {
  WATCH_PROMPT_FLAT,
  WATCH_PROMPT_360,
} from "lib/aura/prompts";
import {
  uploadVideoFromUrl,
  generateColdEyeReading,
  parseColdEyeReading,
} from "lib/aura/gemini";
import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

const log = createLogger("api.aura.watch");

// Maximum bytes the route will accept. Phone-recorded 1080p video is
// ~50-100 MB/minute, so 200 MB fits a typical 2-3 minute clip. An
// abuser could bypass by serving the file without a Content-Length
// header — the cap only fires when the HEAD probe returns a number —
// but the per-IP rate-limit below blocks the volume vector regardless.
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

// Per-IP rate-limit. Each call runs Gemini Files-API upload PLUS a
// multi-modal generation pass — both pricey. 3/hour comfortably
// covers a real visitor experimenting; a script trying to spike
// costs hits the wall after the third call. Auto-upgrades to Upstash
// Redis when env is set.
const HOURLY_CAP = 3;
const limiter = createFixedWindowLimiter({
  scope: "api.aura.watch",
  limit: HOURLY_CAP,
  windowMs: 60 * 60 * 1000,
});

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * HEAD the URL to read Content-Length before handing it to Gemini.
 * Returns the announced size in bytes, or null when the server
 * doesn't advertise one. We treat "no Content-Length" as "allow but
 * log" — some CDNs / dynamic endpoints omit it, and we don't want
 * to block legitimate Vercel Blob / S3 URLs.
 */
async function probeVideoBytes(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return null;
    const header = res.headers.get("content-length");
    if (!header) return null;
    const n = Number(header);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    // Network blip on the probe shouldn't fail-closed; Gemini's own
    // fetch will surface a clearer error if the URL is bad.
    return null;
  }
}

// `runtime = "nodejs"` is intentionally NOT exported here. As of Next.js
// 15.6, route segment config `runtime` is incompatible with the global
// `experimental.useCache` flag in next.config.ts (build fails with
// "Route segment config 'runtime' is not compatible with
//  nextConfig.experimental.useCache. Please remove it."). Since
// `'nodejs'` is the default route runtime anyway, omitting the export
// preserves the behaviour this route needs: the Gemini Files API
// upload uses Node-only streaming bytes, and that still runs under
// Node by default. See:
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
// Video understanding passes can take 30–90s for a 1-minute clip.
export const maxDuration = 300;

/**
 * POST /api/aura/watch
 *
 * Body: { url: string, projection?: "flat" | "360", displayName?: string }
 *
 * Returns the cold-eye reading as JSON. The caller is responsible for
 * the read-back pass (Aura's voice rewrite) and the ElevenLabs synth.
 *
 * No upload UI here yet — paste a public Blob URL or any HTTPS URL the
 * Files API can fetch on its own. Vercel Blob, S3, R2 all work.
 */
export async function POST(req: Request) {
  // Per-IP rate-limit BEFORE parsing body. Cheapest check first so
  // a scripted abuser can't burn body-parse cycles to probe the
  // route's behaviour.
  const ip = clientIp(req);
  const slot = await limiter.consume(`ip:${ip}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    log.warn("rate_limited", { ip, retryAfterSec, backend: limiter.backend });
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Watch cap: ${HOURLY_CAP} videos per hour per visitor. Gemini's video uploads aren't cheap.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let body: {
    url?: string;
    projection?: "flat" | "360";
    displayName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { url, projection = "flat", displayName = "watch-upload" } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing `url` field — pass a public HTTPS URL to a video file." },
      { status: 400 },
    );
  }
  if (projection !== "flat" && projection !== "360") {
    return NextResponse.json(
      { error: "`projection` must be 'flat' or '360'." },
      { status: 400 },
    );
  }

  // Probe the URL for Content-Length before paying for the Gemini
  // upload. The probe is best-effort — we only reject when the size
  // is explicitly announced AND over the cap; missing/zero stays
  // through (logged) so legitimate CDN URLs without the header keep
  // working.
  const probedBytes = await probeVideoBytes(url);
  if (probedBytes !== null && probedBytes > MAX_VIDEO_BYTES) {
    log.info("video_too_large", {
      url,
      probedBytes,
      maxBytes: MAX_VIDEO_BYTES,
    });
    return NextResponse.json(
      {
        error: "video_too_large",
        message: `Video is ${Math.round(probedBytes / 1024 / 1024)} MB — the watch cap is ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB. Trim or compress and try again.`,
        maxBytes: MAX_VIDEO_BYTES,
        probedBytes,
      },
      { status: 413 },
    );
  }
  if (probedBytes === null) {
    log.info("video_size_unknown — allowing through (HEAD probe gave no Content-Length)", { url });
  }

  try {
    const uploaded = await uploadVideoFromUrl(url, displayName);
    const prompt =
      projection === "360" ? WATCH_PROMPT_360 : WATCH_PROMPT_FLAT;
    const raw = await generateColdEyeReading(
      uploaded.uri,
      uploaded.mimeType,
      prompt,
    );
    const reading = parseColdEyeReading(raw);
    return NextResponse.json({
      ok: true,
      projection,
      reading,
      file: {
        uri: uploaded.uri,
        mimeType: uploaded.mimeType,
        expirationTime: uploaded.expirationTime,
      },
    });
  } catch (err) {
    // Log the full error server-side for diagnosis; return a safe
    // generic message to the visitor. Gemini's error messages can
    // include API endpoint paths, raw request IDs, or internal trace
    // hints — none of which a visitor needs (or should see).
    log.error("cold-eye reading failed", {
      url,
      projection,
      err: errToObject(err),
    });
    return NextResponse.json(
      {
        error:
          "Cold-eye reading failed. The video may be too long, too large, or unreachable.",
        code: "watch_failed",
      },
      { status: 500 },
    );
  }
}
