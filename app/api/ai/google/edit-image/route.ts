/**
 * app/api/ai/google/edit-image/route.ts — Gemini 2.5 Flash Image
 * multimodal in-context image edit.
 *
 * Same auth + rate-limit posture as `generate-image/route.ts`:
 *   - Visitor's BYO key via `X-Visitor-Google-Key` header → forwarded
 *     verbatim, never logged, no rate limit.
 *   - Else studio's `GOOGLE_AI_API_KEY` env → in-memory rate limit
 *     per IP / hour (note: per-instance only; V2 should swap a KV).
 *   - 503 if neither is set.
 *
 * # Model
 *
 * `gemini-2.5-flash-image` — the multimodal model that supports
 * `responseModalities: ["TEXT", "IMAGE"]` for in-context image
 * generation / editing. Confirmed in @google/genai v2.2.0's model
 * union. Override via env `GOOGLE_IMAGE_EDIT_MODEL`.
 *
 * # Input
 *
 *   multipart/form-data with:
 *     - `image` (File) — source image
 *     - `prompt` (string) — what to change
 *
 * # Response
 *
 *   { images: Array<{ mimeType, dataUrl }>, explanation?: string }
 *
 * `explanation` is whatever text the model returned alongside the
 * image (it often narrates what it changed). Empty when there's no
 * accompanying text part.
 */

import { NextResponse } from "next/server";

import { GoogleGenAI, Modality } from "@google/genai";

import { envOrUndefined, googleGenApiKey } from "lib/env";
import { createLogger } from "lib/log";

const log = createLogger("api:ai-google-edit");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// -------------------- Rate limit (studio quota only) --------------------

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

// -------------------- Helpers --------------------

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB upper bound on source image

function arrayBufferToBase64(buf: ArrayBuffer): string {
  // Node-side Buffer is available on Vercel's serverless runtime.
  return Buffer.from(buf).toString("base64");
}

// -------------------- Handler --------------------

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "expected multipart/form-data body" },
      { status: 400 },
    );
  }

  const file = form.get("image");
  const promptRaw = form.get("prompt");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "image is required (multipart file part)" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `image too large: ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds ${MAX_BYTES / 1024 / 1024} MB cap`,
      },
      { status: 413 },
    );
  }
  const mimeType = file.type && file.type.startsWith("image/") ? file.type : "image/png";

  const prompt = typeof promptRaw === "string" ? promptRaw.trim() : "";
  if (prompt.length === 0) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  // Visitor key wins. Never log the value. Studio key picks:
  // GOOGLE_AI_API_KEY_GEN (dedicated AI-gen project) first, then
  // GOOGLE_AI_API_KEY (Aura's chat key) as fallback.
  const visitorKey = req.headers.get("X-Visitor-Google-Key") ?? null;
  const usingVisitorKey = visitorKey !== null && visitorKey.trim().length > 0;
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
          error: `The studio's free-tier cap is ${STUDIO_HOURLY_CAP} edits per hour per visitor. Open settings and paste your own AI Studio key for unbounded use.`,
          code: "studio_capped",
          retryAfterSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        },
      );
    }
    log.info("studio quota consumed", { remaining: slot.remaining });
  }

  // Read the source image as base64 inline data.
  const buf = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buf);

  const modelName =
    envOrUndefined("GOOGLE_IMAGE_EDIT_MODEL") ?? "gemini-2.5-flash-image";

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("gemini edit call failed", {
      err: message,
      usingVisitorKey,
      model: modelName,
    });
    return NextResponse.json(
      { error: `Image edit failed: ${message}`, code: "upstream_failed" },
      { status: 502 },
    );
  }

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const images: Array<{ mimeType: string; dataUrl: string }> = [];
  const textChunks: string[] = [];

  for (const part of parts) {
    const inline = (part as { inlineData?: { mimeType?: string; data?: string } })
      .inlineData;
    if (inline?.data) {
      const mt = inline.mimeType ?? "image/png";
      images.push({ mimeType: mt, dataUrl: `data:${mt};base64,${inline.data}` });
      continue;
    }
    const text = (part as { text?: string }).text;
    if (typeof text === "string" && text.trim().length > 0) {
      textChunks.push(text);
    }
  }

  if (images.length === 0) {
    log.warn("gemini edit returned no image parts", {
      partCount: parts.length,
    });
    return NextResponse.json(
      {
        error:
          "Gemini returned a response but no image. The prompt may have been refused, or the model is having a moment. Try again, or rephrase.",
        code: "empty_image",
        explanation: textChunks.join("\n").trim() || undefined,
      },
      { status: 502 },
    );
  }

  log.info("gemini edit ok", {
    count: images.length,
    usingVisitorKey,
    model: modelName,
  });

  const explanation = textChunks.join("\n").trim();
  const payload: {
    images: Array<{ mimeType: string; dataUrl: string }>;
    explanation?: string;
  } = { images };
  if (explanation.length > 0) payload.explanation = explanation;

  return NextResponse.json(payload);
}
