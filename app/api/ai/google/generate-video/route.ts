/**
 * app/api/ai/google/generate-video/route.ts — Veo 3 text-to-video
 * proxy (start job).
 *
 * Veo's API is async: a POST starts a long-running operation, the
 * caller polls with the returned operation name. This route is the
 * "start" half; `[jobId]/route.ts` is the poll half.
 *
 * # Auth posture
 *
 * Identical to the Imagen route — visitor BYO key beats the studio
 * key, no rate-limit on visitor key path, in-process per-IP cap on
 * the studio path. Video is materially more expensive than stills,
 * so the studio cap is set lower (2/hr/IP) than Imagen's (5/hr/IP).
 *
 * # Model
 *
 * `veo-3.0-generate-001` — GA Veo 3 (text-to-video w/ optional audio).
 * Override via env `GOOGLE_VEO_MODEL` if a newer SKU lands.
 *
 * # Response
 *
 *   { jobId: string, etaSeconds: number }
 *
 * The jobId is Google's operation name (e.g.
 * `models/veo-3.0-generate-001/operations/xxx`). The client polls
 * `/api/ai/google/generate-video/<urlencoded jobId>`.
 */

import { NextResponse } from "next/server";

import { GoogleGenAI } from "@google/genai";

import { envOrUndefined, googleGenApiKey } from "lib/env";
import { createLogger } from "lib/log";

const log = createLogger("api:ai-google-veo");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// -------------------- Body shape --------------------

type AspectRatio = "16:9" | "9:16";
const ASPECT_RATIOS: readonly AspectRatio[] = ["16:9", "9:16"] as const;

type Body = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  durationSeconds?: number;
  generateAudio?: boolean;
  enhancePrompt?: boolean;
};

function parseBody(raw: unknown): Body | { error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { error: "body must be a JSON object" };
  }
  const o = raw as Record<string, unknown>;
  const prompt = typeof o["prompt"] === "string" ? o["prompt"].trim() : "";
  if (prompt.length === 0) return { error: "prompt is required" };
  if (prompt.length > 4000) {
    return { error: "prompt is over the 4000-character cap" };
  }

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

  let durationSeconds: number | undefined;
  if (typeof o["durationSeconds"] === "number") {
    const d = o["durationSeconds"];
    if (!Number.isInteger(d) || d < 4 || d > 8) {
      return { error: "durationSeconds must be an integer 4..8" };
    }
    durationSeconds = d;
  }

  const generateAudio =
    typeof o["generateAudio"] === "boolean" ? o["generateAudio"] : undefined;
  const enhancePrompt =
    typeof o["enhancePrompt"] === "boolean" ? o["enhancePrompt"] : undefined;

  const out: Body = { prompt };
  if (negativePrompt !== undefined) out.negativePrompt = negativePrompt;
  if (aspectRatio !== undefined) out.aspectRatio = aspectRatio;
  if (durationSeconds !== undefined) out.durationSeconds = durationSeconds;
  if (generateAudio !== undefined) out.generateAudio = generateAudio;
  if (enhancePrompt !== undefined) out.enhancePrompt = enhancePrompt;
  return out;
}

// -------------------- Rate limit (studio quota only) --------------------

type Bucket = { count: number; resetAt: number };
const studioBuckets: Map<string, Bucket> = new Map();
const STUDIO_HOURLY_CAP = 2;
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

  const visitorKey = req.headers.get("X-Visitor-Google-Key") ?? null;
  const usingVisitorKey = visitorKey !== null && visitorKey.trim().length > 0;
  const apiKey = usingVisitorKey ? visitorKey.trim() : googleGenApiKey();

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
          error: `The studio's free-tier cap is ${STUDIO_HOURLY_CAP} video generations per hour per visitor — Veo is heavy. Open settings and paste your own AI Studio key for unbounded use.`,
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

  const modelName =
    envOrUndefined("GOOGLE_VEO_MODEL") ?? "veo-3.0-generate-001";

  const ai = new GoogleGenAI({ apiKey });

  const config: {
    aspectRatio?: string;
    negativePrompt?: string;
    durationSeconds?: number;
    numberOfVideos: number;
    generateAudio?: boolean;
    enhancePrompt?: boolean;
  } = {
    numberOfVideos: 1,
  };
  if (body.aspectRatio) config.aspectRatio = body.aspectRatio;
  if (body.negativePrompt) config.negativePrompt = body.negativePrompt;
  if (body.durationSeconds !== undefined) {
    config.durationSeconds = body.durationSeconds;
  }
  if (body.generateAudio !== undefined) config.generateAudio = body.generateAudio;
  if (body.enhancePrompt !== undefined) config.enhancePrompt = body.enhancePrompt;

  let operation;
  try {
    operation = await ai.models.generateVideos({
      model: modelName,
      prompt: body.prompt,
      config,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("veo start failed", {
      err: message,
      usingVisitorKey,
      model: modelName,
    });
    return NextResponse.json(
      { error: `Veo call failed: ${message}`, code: "upstream_failed" },
      { status: 502 },
    );
  }

  const jobId = operation?.name;
  if (typeof jobId !== "string" || jobId.length === 0) {
    log.error("veo started but no operation name", { model: modelName });
    return NextResponse.json(
      {
        error: "Veo started a job but didn't return an operation name. Retry.",
        code: "missing_job_id",
      },
      { status: 502 },
    );
  }

  log.info("veo started", {
    jobId,
    usingVisitorKey,
    model: modelName,
    duration: body.durationSeconds ?? 8,
  });

  return NextResponse.json({
    jobId,
    etaSeconds: 60,
  });
}
