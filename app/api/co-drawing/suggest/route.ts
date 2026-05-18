/**
 * app/api/co-drawing/suggest/route.ts — Gemini 2.5 Flash Image
 * co-drawing pass for the /atelier/co-drawing chamber.
 *
 * The bench prototype called Gemini directly from the browser with
 * the API key inlined; that leaks the key on any public deploy. This
 * route is the server-side wrap: client posts JSON
 * `{ prompt, drawingData }` (drawingData is a base64 PNG payload of
 * the canvas, no data: prefix), the route forwards it to Gemini, and
 * sends back `{ imageData, mimeType }` so the client can blit the
 * result back over the canvas.
 *
 * # Env
 *
 * Reuses `googleGenApiKey()` from `lib/env` — same resolution order
 * as the other Atelier Gemini routes:
 *   1. `GOOGLE_AI_API_KEY_GEN` (preferred — dedicated AI-gen project)
 *   2. `GOOGLE_AI_API_KEY`     (fallback — Aura's chat key)
 *
 * Returns 503 with `code: "no_key"` when neither is set.
 *
 * # Model
 *
 * `gemini-2.5-flash-image`, matching the bench source. Override via
 * `GOOGLE_IMAGE_EDIT_MODEL` (shared with the image-edit route — same
 * underlying multimodal model).
 *
 * # Why JSON (and not multipart like image-edit)
 *
 * The canvas already gives us a base64 PNG; sending it as JSON keeps
 * the client one fewer FormData roundtrip and matches the bench's
 * payload shape so the port stays faithful.
 */

import { NextResponse } from "next/server";

import { GoogleGenAI, Modality } from "@google/genai";

import { envOrUndefined, googleGenApiKey } from "lib/env";
import { createLogger } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

const log = createLogger("api:co-drawing-suggest");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Image-generation calls are the priciest path in the atelier. Cap
// generously enough for an active co-drawing session (a sketch every
// ~6 minutes) while shutting down scripted abuse. Auto-upgrades to
// Upstash Redis when env is set.
const HOURLY_CAP = 10;
const limiter = createFixedWindowLimiter({
  scope: "api.co-drawing.suggest",
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

// ~16 MB of base64 = ~12 MB of binary; well above any plausible
// canvas PNG at 960x540 but below the JSON body limit.
const MAX_BASE64_BYTES = 16 * 1024 * 1024;

export async function POST(req: Request) {
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
        message: `Co-drawing cap: ${HOURLY_CAP}/hour/visitor.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected JSON body { prompt, drawingData }" },
      { status: 400 },
    );
  }

  const { prompt: rawPrompt, drawingData: rawDrawing } = (body ?? {}) as {
    prompt?: unknown;
    drawingData?: unknown;
  };

  const prompt = typeof rawPrompt === "string" ? rawPrompt.trim() : "";
  if (prompt.length === 0) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const drawingData = typeof rawDrawing === "string" ? rawDrawing : "";
  if (drawingData.length === 0) {
    return NextResponse.json(
      { error: "drawingData is required (base64 PNG, no data: prefix)" },
      { status: 400 },
    );
  }
  if (drawingData.length > MAX_BASE64_BYTES) {
    return NextResponse.json(
      { error: "drawingData too large" },
      { status: 413 },
    );
  }

  const apiKey = googleGenApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No Google AI key configured on the server. Set GOOGLE_AI_API_KEY_GEN (preferred) or GOOGLE_AI_API_KEY in the environment.",
        code: "no_key",
      },
      { status: 503 },
    );
  }

  const modelName =
    envOrUndefined("GOOGLE_IMAGE_EDIT_MODEL") ?? "gemini-2.5-flash-image";

  const ai = new GoogleGenAI({ apiKey });

  // Match the bench prompt: send the drawing + a text part that asks
  // for the change while preserving the line-drawing style.
  let response;
  try {
    response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/png", data: drawingData } },
            { text: `${prompt}. Keep the same minimal line drawing style.` },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Strip anything that could possibly contain the key from the
    // error string before logging.
    const safeMessage = message.replaceAll(apiKey, "[redacted]");
    log.error("gemini co-drawing call failed", {
      err: safeMessage,
      model: modelName,
    });
    return NextResponse.json(
      { error: "Co-drawing suggest failed upstream.", code: "upstream_failed" },
      { status: 502 },
    );
  }

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  let imageData: string | null = null;
  let mimeType: string = "image/png";
  let explanation = "";

  for (const part of parts) {
    const inline = (part as { inlineData?: { mimeType?: string; data?: string } })
      .inlineData;
    if (inline?.data && imageData === null) {
      imageData = inline.data;
      if (inline.mimeType) mimeType = inline.mimeType;
      continue;
    }
    const text = (part as { text?: string }).text;
    if (typeof text === "string" && text.trim().length > 0) {
      explanation += `${text}\n`;
    }
  }

  if (!imageData) {
    log.warn("gemini co-drawing returned no image", { partCount: parts.length });
    return NextResponse.json(
      {
        error:
          "Gemini responded but returned no image. The prompt may have been refused, or the model didn't see enough to work with. Try drawing more, or rephrase.",
        code: "empty_image",
        explanation: explanation.trim() || undefined,
      },
      { status: 502 },
    );
  }

  log.info("gemini co-drawing ok", { model: modelName });

  return NextResponse.json({
    imageData,
    mimeType,
    explanation: explanation.trim() || undefined,
  });
}
