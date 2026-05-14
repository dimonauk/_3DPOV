/**
 * lib/capabilities/commerce/sharp-video-job-parser.ts — JSON → typed
 * status parser + shared helpers for `commerce.sharp-video-job`.
 *
 * The FastAPI wrapper returns an untyped JSON envelope per job state;
 * `narrow()` discriminates it to a `SharpVideoJobStatus`. Bundle URLs
 * default to canonical service paths when the body omits them so the
 * UI can always render a download link.
 */

import { envOrUndefined } from "lib/env";

import type { SharpVideoJobStatus } from "./sharp-video-job-types";

export const SHARP_VIDEO_DEFAULT_BASE_URL = "http://localhost:7843";

export function baseUrl(): string {
  return (
    envOrUndefined("SHARP_VIDEO_SERVICE_URL") ?? SHARP_VIDEO_DEFAULT_BASE_URL
  );
}

export function narrow(
  body: Record<string, unknown>,
  jobId: string,
): SharpVideoJobStatus {
  const state = body["state"];
  if (state === "queued") {
    return {
      state: "queued",
      positionInQueue: num(body["positionInQueue"], 0),
      submittedAt: str(body["submittedAt"], new Date(0).toISOString()),
    };
  }
  if (state === "decoding") {
    const totalRaw = body["framesTotal"];
    return {
      state: "decoding",
      framesTotal: typeof totalRaw === "number" ? totalRaw : null,
      progressPct: num(body["progressPct"], 0),
    };
  }
  if (state === "running") {
    const etaRaw = body["etaSeconds"];
    const stageRaw = body["currentFrameStage"];
    const stage: "sharp" | "4dgs-fit" | "stitch" =
      stageRaw === "4dgs-fit" || stageRaw === "stitch" ? stageRaw : "sharp";
    return {
      state: "running",
      framesDone: num(body["framesDone"], 0),
      framesTotal: num(body["framesTotal"], 0),
      progressPct: num(body["progressPct"], 0),
      etaSeconds: typeof etaRaw === "number" ? etaRaw : null,
      currentFrameStage: stage,
    };
  }
  if (state === "done") {
    return {
      state: "done",
      bundle: extractBundle(body["bundle"], jobId),
      framesTotal: num(body["framesTotal"], 0),
      durationSeconds: num(body["durationSeconds"], 0),
      sizeBytes: num(body["sizeBytes"], 0),
    };
  }
  if (state === "cancelled") return { state: "cancelled" };
  const code = body["code"];
  return {
    state: "error",
    message: str(body["message"], `unknown state: ${String(state)}`),
    ...(typeof code === "string" ? { code } : {}),
  };
}

function extractBundle(
  raw: unknown,
  jobId: string,
): { splat4dUrl?: string; stereoMp4Url?: string; usdzKeyframesUrl?: string } {
  const out: {
    splat4dUrl?: string;
    stereoMp4Url?: string;
    usdzKeyframesUrl?: string;
  } = {};
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (typeof r["splat4dUrl"] === "string") out.splat4dUrl = r["splat4dUrl"];
    if (typeof r["stereoMp4Url"] === "string") out.stereoMp4Url = r["stereoMp4Url"];
    if (typeof r["usdzKeyframesUrl"] === "string")
      out.usdzKeyframesUrl = r["usdzKeyframesUrl"];
  }
  if (!out.splat4dUrl) {
    out.splat4dUrl = `${baseUrl()}/jobs/${encodeURIComponent(jobId)}/result/splat4d`;
  }
  return out;
}

export function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "unknown network error";
}

export async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
