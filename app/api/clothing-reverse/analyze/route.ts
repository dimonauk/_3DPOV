/**
 * app/api/clothing-reverse/analyze/route.ts — Gemini garment analysis
 * for the clothing-reverse chamber.
 *
 * Ported from `D:/The_Hangar/apps/clothing-reverse-engineer/src/services/
 * garmentAI.ts` (Vite + browser-side `@google/genai`). Moved to a Next
 * route so the studio's `GOOGLE_AI_API_KEY_GEN` (or fallback
 * `GOOGLE_AI_API_KEY`) never leaks to the browser. Same auth + rate-
 * limit posture as the edit-image route.
 *
 * # Auth
 *   - `X-Visitor-Google-Key` header → BYO mode, forwarded verbatim,
 *     never logged, no studio rate-limit.
 *   - Else `googleGenApiKey()` env → in-memory studio bucket per IP.
 *   - 503 if neither.
 *
 * # Input
 *   multipart/form-data: `image` (File, image/*, <= 8 MB)
 *
 * # Output
 *   { analysis: GarmentAnalysis }   — see clothing-reverse-client.tsx
 */

import { NextResponse } from "next/server";

import { GoogleGenAI, Type } from "@google/genai";

import { envOrUndefined, googleGenApiKey } from "lib/env";
import { createLogger } from "lib/log";

const log = createLogger("api:clothing-reverse");

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
):
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; resetAt: number } {
  const now = Date.now();
  const existing = studioBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + HOUR_MS };
    studioBuckets.set(ip, fresh);
    return {
      ok: true,
      remaining: STUDIO_HOURLY_CAP - 1,
      resetAt: fresh.resetAt,
    };
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

// -------------------- Constants --------------------

const MAX_BYTES = 8 * 1024 * 1024;

const ANALYSIS_PROMPT = `You are an expert fashion designer and pattern maker with 30 years of experience.

Analyse the clothing image and extract:
1. GARMENT TYPE: dress, shirt, pants, skirt, jacket, coat, blouse, trousers, shorts, jumper, or unknown.
2. STYLE: A-line, fitted, oversized, etc.
3. CONSTRUCTION: seams, closures, construction details, difficulty (beginner / intermediate / advanced).
4. MEASUREMENTS: estimate key measurements (bust, waist, hip, length, shoulder) for a typical M size.
5. PATTERN PIECES: main pieces needed to recreate (name, shape, width/height in cm, cut count, grainline).
6. MATERIALS: fabric and notions needed.
7. COLOURS: main colours with hex.

Be precise, use sewing terminology. Return structured JSON only.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    garmentType: { type: Type.STRING },
    style: { type: Type.STRING },
    description: { type: Type.STRING },
    features: { type: Type.ARRAY, items: { type: Type.STRING } },
    era: { type: Type.STRING },
    occasion: { type: Type.ARRAY, items: { type: Type.STRING } },
    seams: { type: Type.ARRAY, items: { type: Type.STRING } },
    closures: { type: Type.ARRAY, items: { type: Type.STRING } },
    constructionDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
    difficulty: { type: Type.STRING },
    measurements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.NUMBER },
          unit: { type: Type.STRING },
        },
      },
    },
    patternPieces: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          shape: { type: Type.STRING },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          cutCount: { type: Type.NUMBER },
          grainline: { type: Type.STRING },
        },
      },
    },
    materials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
      },
    },
    colors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hex: { type: Type.STRING },
          name: { type: Type.STRING },
          percentage: { type: Type.NUMBER },
        },
      },
    },
    confidence: { type: Type.NUMBER },
  },
} as const;

// -------------------- Helpers --------------------

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64");
}

type RawAnalysis = {
  garmentType?: string;
  style?: string;
  description?: string;
  features?: string[];
  era?: string;
  occasion?: string[];
  seams?: string[];
  closures?: string[];
  constructionDetails?: string[];
  difficulty?: string;
  measurements?: { name?: string; value?: number; unit?: string }[];
  patternPieces?: {
    name?: string;
    shape?: string;
    width?: number;
    height?: number;
    cutCount?: number;
    grainline?: string;
  }[];
  materials?: { type?: string; amount?: number; unit?: string; notes?: string }[];
  colors?: { hex?: string; name?: string; percentage?: number }[];
  confidence?: number;
};

function transformAnalysis(raw: RawAnalysis, processingTime: number) {
  return {
    garment: {
      type: (raw.garmentType?.toLowerCase() ?? "unknown") as string,
      style: raw.style ?? "Classic",
      description: raw.description ?? "",
      features: raw.features ?? [],
      era: raw.era ?? "Contemporary",
      occasion: raw.occasion ?? ["Casual"],
    },
    measurements: (raw.measurements ?? []).map((m) => ({
      name: m.name ?? "",
      value: typeof m.value === "number" ? m.value : 0,
      unit: (m.unit ?? "cm") as "cm" | "inches",
      confidence: 0.85,
    })),
    construction: {
      seams: raw.seams ?? [],
      closures: raw.closures ?? [],
      details: raw.constructionDetails ?? [],
      difficulty: (raw.difficulty?.toLowerCase() ?? "intermediate") as
        | "beginner"
        | "intermediate"
        | "advanced",
    },
    materials: (raw.materials ?? []).map((m) => ({
      type: m.type ?? "",
      amount: typeof m.amount === "number" ? m.amount : 0,
      unit: (m.unit ?? "m") as "m" | "yd",
      notes: m.notes ?? "",
    })),
    pattern: {
      pieces: (raw.patternPieces ?? []).map((p) => ({
        name: p.name ?? "Piece",
        shape: (p.shape ?? "rectangle") as
          | "rectangle"
          | "trapezoid"
          | "curve"
          | "complex",
        estimatedWidth: typeof p.width === "number" ? p.width : 50,
        estimatedHeight: typeof p.height === "number" ? p.height : 60,
        cutCount: typeof p.cutCount === "number" ? p.cutCount : 1,
        grainline: (p.grainline ?? "lengthwise") as
          | "lengthwise"
          | "crosswise"
          | "bias",
      })),
    },
    colors: (raw.colors ?? []).map((c) => ({
      hex: c.hex ?? "#000000",
      name: c.name ?? "Unknown",
      percentage: typeof c.percentage === "number" ? c.percentage : 0,
    })),
    metadata: {
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.85,
      processingTime,
      modelVersion: "gemini-2.0-flash",
    },
  };
}

// -------------------- Handler --------------------

export async function POST(req: Request) {
  const startedAt = Date.now();

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
  const mimeType =
    file.type && file.type.startsWith("image/") ? file.type : "image/png";

  const visitorKey = req.headers.get("X-Visitor-Google-Key") ?? null;
  const usingVisitorKey =
    visitorKey !== null && visitorKey.trim().length > 0;
  const apiKey = usingVisitorKey ? visitorKey!.trim() : googleGenApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No Google AI key configured. Open settings and paste your AI Studio key, or ask the studio to set GOOGLE_AI_API_KEY_GEN.",
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
          error: `The studio's free-tier cap is ${STUDIO_HOURLY_CAP} analyses per hour per visitor. Open settings and paste your own AI Studio key for unbounded use.`,
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

  const buf = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buf);

  const modelName = envOrUndefined("GOOGLE_AI_MODEL") ?? "gemini-2.0-flash";

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
            { text: ANALYSIS_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("gemini analyse call failed", {
      err: message,
      usingVisitorKey,
      model: modelName,
    });
    return NextResponse.json(
      { error: `Analysis failed: ${message}`, code: "upstream_failed" },
      { status: 502 },
    );
  }

  const text = response?.text ?? "";
  let raw: RawAnalysis;
  try {
    raw = JSON.parse(text) as RawAnalysis;
  } catch (err) {
    log.warn("gemini returned non-JSON text", {
      err: err instanceof Error ? err.message : String(err),
      textPreview: text.slice(0, 200),
    });
    return NextResponse.json(
      {
        error:
          "Gemini returned a response that wasn't valid JSON. Try again, or try a clearer photo.",
        code: "bad_json",
      },
      { status: 502 },
    );
  }

  const analysis = transformAnalysis(raw, Date.now() - startedAt);
  log.info("gemini analyse ok", {
    usingVisitorKey,
    model: modelName,
    type: analysis.garment.type,
    pieces: analysis.pattern.pieces.length,
  });

  return NextResponse.json({ analysis });
}
