/**
 * app/api/print-check/route.ts — Upload an image, get a print verdict.
 *
 * Single-image POST. The verdict is the same shape used everywhere the
 * studio asks "is this printable, and how big?" — see
 * `lib/capabilities/image/print-check.ts` for the verdict shape and
 * threshold rationale.
 *
 * # Auth posture
 *
 * Open route — no auth. The check is read-only (no I/O beyond the
 * sharp decode of the uploaded bytes), no provider keys involved, and
 * the bytes are dropped the moment the response leaves. Rate-limit
 * lightly per-IP to keep abuse manageable.
 *
 * # Limits
 *
 * 30 MB upload cap. Sharp's decode is the bottleneck; 120 MP Osmo 360
 * JPEGs land around 30-40 MB so the cap is borderline — bump if needed.
 */

import { NextResponse } from "next/server";

import { createLogger } from "lib/log";
import { printCheckFromBuffer } from "lib/capabilities/image/print-check.server";

const log = createLogger("api:print-check");

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 40 * 1024 * 1024; // 40 MB — fits Osmo 360 max-res JPEGs

// In-memory per-IP bucket. Best-effort throttle.
type Bucket = { count: number; resetAt: number };
const buckets: Map<string, Bucket> = new Map();
const HOURLY_CAP = 60;
const HOUR_MS = 60 * 60 * 1000;

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

function consumeSlot(ip: string): { ok: boolean; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + HOUR_MS };
    buckets.set(ip, fresh);
    return { ok: true, resetAt: fresh.resetAt };
  }
  if (existing.count >= HOURLY_CAP) {
    return { ok: false, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { ok: true, resetAt: existing.resetAt };
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const slot = consumeSlot(ip);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      {
        error: `Rate-limited — ${HOURLY_CAP} checks per hour per visitor. Resets in ~${Math.ceil(
          retryAfterSec / 60,
        )} min.`,
        code: "rate_limited",
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'image' field." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB; cap is ${MAX_BYTES / 1024 / 1024} MB.`,
        code: "too_large",
      },
      { status: 413 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (err) {
    log.error("buffer read failed", { err });
    return NextResponse.json(
      { error: "Could not read the upload." },
      { status: 400 },
    );
  }

  let verdict;
  try {
    verdict = await printCheckFromBuffer(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn("decode failed", { err: message });
    return NextResponse.json(
      {
        error: `Couldn't decode the image: ${message}`,
        code: "decode_failed",
      },
      { status: 415 },
    );
  }

  log.info("check ok", {
    maxSize: verdict.maxPrintableSize,
    needsReframe: verdict.needsReframe,
    isLikelyWebDownscale: verdict.isLikelyWebDownscale,
  });

  return NextResponse.json({ verdict });
}
