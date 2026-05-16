/**
 * app/api/ai/google/generate-image/route.ts — Imagen 4 text-to-image
 * proxy.
 *
 * # Auth posture
 *
 * Two paths:
 *
 *   1. Visitor's BYO key — request carries header
 *      `X-Visitor-Google-Key`. We forward it to Google verbatim, never
 *      log it, never persist it. No rate limit (visitor's quota).
 *
 *   2. Studio quota — no visitor key; we fall back to the studio's
 *      server env `GOOGLE_AI_API_KEY`. Rate-limited in-process per
 *      IP / hour to keep the free tier from being eaten by abuse.
 *
 * If neither path is available we 503 with a JSON message pointing
 * the visitor at the chamber's settings dialog.
 *
 * # Model
 *
 * `imagen-4.0-generate-001` — current public Imagen 4 (confirmed in
 * @google/genai's own JSDoc example at v2.2.0). Override via env
 * `GOOGLE_IMAGEN_MODEL` if a newer SKU lands and we want to swap
 * without code change.
 *
 * # Response
 *
 *   { images: Array<{ mimeType: string, dataUrl: string }> }
 *
 * The dataUrl is a base64 `data:` URL the client can drop straight
 * into an `<img>` or a download anchor.
 */

import { NextResponse } from "next/server";

import { GoogleGenAI } from "@google/genai";

import { envOrUndefined, googleGenApiKey } from "lib/env";
import { createLogger } from "lib/log";

const log = createLogger("api:ai-google-imagen");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// -------------------- Body shape --------------------

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
const ASPECT_RATIOS: readonly AspectRatio[] = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
] as const;

type NumImages = 1 | 2 | 3 | 4;
const NUM_IMAGES_ALLOWED: readonly NumImages[] = [1, 2, 3, 4] as const;

type Body = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  numImages?: NumImages;
};

function parseBody(raw: unknown): Body | { error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { error: "body must be a JSON object" };
  }
  const o = raw as Record<string, unknown>;
  const prompt = typeof o["prompt"] === "string" ? o["prompt"].trim() : "";
  if (prompt.length === 0) return { error: "prompt is required" };

  const negativePrompt =
    typeof o["negativePrompt"] === "string"
      ? o["negativePrompt"].trim()
      : undefined;

  let aspectRatio: AspectRatio | undefined;
  if (typeof o["aspectRatio"] === "string") {
    if (!ASPECT_RATIOS.includes(o["aspectRatio"] as AspectRatio)) {
      return {
        error: `aspectRatio must be one of ${ASPECT_RATIOS.join(", ")}`,
      };
    }
    aspectRatio = o["aspectRatio"] as AspectRatio;
  }

  let numImages: NumImages | undefined;
  if (typeof o["numImages"] === "number") {
    const n = o["numImages"];
    if (!NUM_IMAGES_ALLOWED.includes(n as NumImages)) {
      return { error: "numImages must be 1, 2, 3, or 4" };
    }
    numImages = n as NumImages;
  }

  const out: Body = { prompt };
  if (negativePrompt !== undefined) out.negativePrompt = negativePrompt;
  if (aspectRatio !== undefined) out.aspectRatio = aspectRatio;
  if (numImages !== undefined) out.numImages = numImages;
  return out;
}

// -------------------- Rate limit (studio quota only) --------------------

// In-memory map. NB: this is per-Vercel-instance and won't survive a
// cold start or scale-out; it's V1 best-effort to slow obvious abuse.
// V2 should swap in a shared KV store (Upstash, Vercel KV, etc.).
type Bucket = { count: number; resetAt: number };
const studioBuckets: Map<string, Bucket> = new Map();
const STUDIO_HOURLY_CAP = 5;
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

/** Returns null if the IP is within cap, or a {remaining,resetAt} object
 *  if it just consumed a slot. Returns "blocked" with resetAt if over. */
function consumeStudioSlot(
  ip: string,
): { ok: true; remaining: number; resetAt: number } | { ok: false; resetAt: number } {
  const now = Date.now();
  const existing = studioBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + HOUR_MS };
    studioBuckets.set(ip, fresh);
    return { ok: true, remaining: STUDIO_HOURLY_CAP - 1, resetAt: fresh.resetAt };
  }
  if (existing.count >= STUDIO_HOURLY_CAP) {
    return { ok: false, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: STUDIO_HOURLY_CAP - existing.count,
    resetAt: existing.resetAt,
  };
}

// -------------------- Handler --------------------

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }

  const parsed = parseBody(raw);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed;

  // Visitor key wins — header is forwarded to Google verbatim. Never
  // log the value, even partially.
  const visitorKey = req.headers.get("X-Visitor-Google-Key") ?? null;
  const usingVisitorKey = visitorKey !== null && visitorKey.trim().length > 0;
  // Studio key picks: GOOGLE_AI_API_KEY_GEN (the dedicated AI-gen
  // project's key) first, then GOOGLE_AI_API_KEY (Aura's chat key)
  // as fallback. Visitor's BYO key still overrides both.
  const apiKey = usingVisitorKey
    ? visitorKey.trim()
    : googleGenApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No Google AI key configured. Open the settings dialog and paste your AI Studio key, or ask the studio to set GOOGLE_AI_API_KEY_GEN (or GOOGLE_AI_API_KEY as fallback).",
        code: "no_key",
      },
      { status: 503 },
    );
  }

  // Rate-limit only studio-quota path.
  if (!usingVisitorKey) {
    const ip = clientIp(req);
    const slot = consumeStudioSlot(ip);
    if (!slot.ok) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((slot.resetAt - Date.now()) / 1000),
      );
      log.warn("studio quota exhausted", { ip, retryAfterSec });
      return NextResponse.json(
        {
          error: `The studio's free-tier cap is ${STUDIO_HOURLY_CAP} generations per hour per visitor. Open settings and paste your own AI Studio key for unbounded use.`,
          code: "studio_capped",
          retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
          },
        },
      );
    }
    log.info("studio quota consumed", { remaining: slot.remaining });
  }

  const modelName = envOrUndefined("GOOGLE_IMAGEN_MODEL") ?? "imagen-4.0-generate-001";

  const ai = new GoogleGenAI({ apiKey });

  const config: {
    numberOfImages: number;
    aspectRatio?: string;
    negativePrompt?: string;
    includeRaiReason: boolean;
  } = {
    numberOfImages: body.numImages ?? 1,
    includeRaiReason: true,
  };
  if (body.aspectRatio) config.aspectRatio = body.aspectRatio;
  if (body.negativePrompt) config.negativePrompt = body.negativePrompt;

  let response;
  try {
    response = await ai.models.generateImages({
      model: modelName,
      prompt: body.prompt,
      config,
    });
  } catch (err) {
    // Don't echo the visitor's key in error messages, and never log the
    // raw key. Surfacing the message is fine — Google's errors don't
    // include the key.
    const message = err instanceof Error ? err.message : String(err);
    log.error("imagen call failed", {
      err: message,
      usingVisitorKey,
      model: modelName,
    });
    return NextResponse.json(
      { error: `Imagen call failed: ${message}`, code: "upstream_failed" },
      { status: 502 },
    );
  }

  const generated = response?.generatedImages ?? [];
  if (generated.length === 0) {
    log.warn("imagen returned zero images", { model: modelName });
    return NextResponse.json(
      {
        error:
          "Imagen returned no images. The prompt may have been filtered, or the model is having a moment. Try again, or rephrase.",
        code: "empty_result",
      },
      { status: 502 },
    );
  }

  const images: Array<{ mimeType: string; dataUrl: string }> = [];
  for (const g of generated) {
    const bytes = g.image?.imageBytes;
    if (!bytes) continue;
    const mimeType = g.image?.mimeType ?? "image/png";
    images.push({
      mimeType,
      dataUrl: `data:${mimeType};base64,${bytes}`,
    });
  }

  if (images.length === 0) {
    log.warn("imagen returned images with no imageBytes", {
      count: generated.length,
    });
    return NextResponse.json(
      {
        error:
          "Imagen returned a response but no image bytes. This usually means a safety filter caught it.",
        code: "empty_bytes",
      },
      { status: 502 },
    );
  }

  log.info("imagen ok", {
    count: images.length,
    usingVisitorKey,
    model: modelName,
  });

  return NextResponse.json({ images });
}
