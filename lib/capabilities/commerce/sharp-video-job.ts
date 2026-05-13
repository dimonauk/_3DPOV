/**
 * lib/capabilities/commerce/sharp-video-job.ts — Capability `commerce.sharp-video-job`.
 *
 * One-line role: the editioned-quality 2D-video-to-4D-splat path, talking
 * REST to the FastAPI wrapper that fronts the SHARP+4DGS pipeline on the
 * studio's 3080 Ti.
 *
 * # Purpose
 * The site offers two routes from a 2D video to a 4D experience:
 *   - free in-browser per-frame depth-anything-v2 → stereo-MP4 (no GPU
 *     required, but slow on a phone), and
 *   - this — Apple SHARP per keyframe, 4DGaussians for temporal
 *     coherence, stitched into a stereo-MP4 + signed .4dgs bundle.
 *
 * # Why this shape
 * Per-frame splat generation is minutes-long for a few-second clip.
 * The handle exposes both whole-job status and a per-frame progress
 * channel (`framesDone / framesTotal`) so the calling UI can render a
 * frame-counter live. Cancellation is honoured between frames. All
 * errors are typed; `SharpServiceUnreachableError` is re-used from
 * `commerce.sharp-job` so the UI's degraded-mode copy works for both.
 *
 * Full purpose in sharp-video-job.PURPOSE.md.
 */

import { envOrUndefined } from "lib/env";
import { SharpServiceUnreachableError } from "./sharp-job";

const SHARP_VIDEO_DEFAULT_BASE_URL = "http://localhost:7843";

function baseUrl(): string {
  return (
    envOrUndefined("SHARP_VIDEO_SERVICE_URL") ?? SHARP_VIDEO_DEFAULT_BASE_URL
  );
}

export type SharpVideoJobInput = {
  videoBlob: Blob;
  /** 1 keyframe every N input frames. Higher = faster + coarser. Default 6. */
  keyframeStride?: number;
  /** Output formats to bundle. */
  outputs?: {
    splat4d?: boolean;
    stereoMp4?: boolean;
    usdzKeyframes?: boolean;
  };
  meta?: {
    title?: string;
    captureDate?: string;
    locationId?: string;
    photographSlug?: string;
  };
};

export type SharpVideoJobStatus =
  | { state: "queued"; positionInQueue: number; submittedAt: string }
  | {
      state: "decoding";
      framesTotal: number | null;
      progressPct: number;
    }
  | {
      state: "running";
      framesDone: number;
      framesTotal: number;
      progressPct: number;
      etaSeconds: number | null;
      currentFrameStage: "sharp" | "4dgs-fit" | "stitch";
    }
  | {
      state: "done";
      bundle: {
        splat4dUrl?: string;
        stereoMp4Url?: string;
        usdzKeyframesUrl?: string;
      };
      framesTotal: number;
      durationSeconds: number;
      sizeBytes: number;
    }
  | { state: "error"; message: string; code?: string }
  | { state: "cancelled" };

export type SharpVideoJobHandle = {
  jobId: string;
  poll(): Promise<SharpVideoJobStatus>;
  cancel(): Promise<void>;
  waitForCompletion(intervalMs?: number): Promise<SharpVideoJobStatus>;
};

/** Probe service reachability + version. Never throws. */
export async function isSharpVideoServiceAvailable(): Promise<{
  available: boolean;
  version?: string;
  reason?: string;
}> {
  try {
    const res = await fetch(`${baseUrl()}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { available: false, reason: `${res.status} ${res.statusText}` };
    }
    const body = (await res.json()) as { status?: string; version?: string };
    if (body.status !== "ok") {
      return { available: false, reason: `status=${body.status ?? "unknown"}` };
    }
    return body.version !== undefined
      ? { available: true, version: body.version }
      : { available: true };
  } catch (err) {
    return { available: false, reason: errMessage(err) };
  }
}

/** Submit a video job. Returns the handle. */
export async function submitSharpVideoJob(
  input: SharpVideoJobInput,
): Promise<SharpVideoJobHandle> {
  const form = new FormData();
  form.append("video", input.videoBlob);
  form.append(
    "meta",
    JSON.stringify({
      keyframeStride: input.keyframeStride ?? 6,
      outputs: {
        splat4d: input.outputs?.splat4d ?? true,
        stereoMp4: input.outputs?.stereoMp4 ?? true,
        usdzKeyframes: input.outputs?.usdzKeyframes ?? false,
      },
      title: input.meta?.title ?? null,
      captureDate: input.meta?.captureDate ?? null,
      locationId: input.meta?.locationId ?? null,
      photographSlug: input.meta?.photographSlug ?? null,
    }),
  );

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/jobs`, { method: "POST", body: form });
  } catch (err) {
    throw new SharpServiceUnreachableError(errMessage(err));
  }
  if (!res.ok) {
    const text = await safeText(res);
    throw new Error(
      `sharp-video-job: submit failed — ${res.status} ${res.statusText}${text ? ` (${text})` : ""}`,
    );
  }
  const body = (await res.json()) as { jobId?: unknown };
  if (typeof body.jobId !== "string") {
    throw new Error("sharp-video-job: submit response missing jobId");
  }
  return rehydrateVideoJob(body.jobId);
}

/** Reconstruct a handle from a known job ID (e.g. after page reload). */
export function rehydrateVideoJob(jobId: string): SharpVideoJobHandle {
  return {
    jobId,
    poll: () => pollJob(jobId),
    cancel: () => cancelJob(jobId),
    waitForCompletion: (intervalMs?: number) =>
      waitLoop(jobId, intervalMs ?? 5000),
  };
}

async function pollJob(jobId: string): Promise<SharpVideoJobStatus> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new SharpServiceUnreachableError(errMessage(err));
  }
  if (res.status === 404) {
    return {
      state: "error",
      message: `job ${jobId} not found`,
      code: "NOT_FOUND",
    };
  }
  if (!res.ok) {
    const text = await safeText(res);
    return {
      state: "error",
      message: `poll failed — ${res.status} ${res.statusText}${text ? ` (${text})` : ""}`,
      code: "POLL_FAILED",
    };
  }
  return narrow((await res.json()) as Record<string, unknown>, jobId);
}

async function cancelJob(jobId: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/jobs/${encodeURIComponent(jobId)}`, {
      method: "DELETE",
    });
  } catch (err) {
    throw new SharpServiceUnreachableError(errMessage(err));
  }
  if (!res.ok && res.status !== 404) {
    const text = await safeText(res);
    throw new Error(
      `sharp-video-job: cancel failed — ${res.status} ${res.statusText}${text ? ` (${text})` : ""}`,
    );
  }
}

async function waitLoop(
  jobId: string,
  intervalMs: number,
): Promise<SharpVideoJobStatus> {
  const delay = Math.max(500, intervalMs);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const status = await pollJob(jobId);
    if (
      status.state === "done" ||
      status.state === "error" ||
      status.state === "cancelled"
    ) {
      return status;
    }
    await new Promise((r) => setTimeout(r, delay));
  }
}

function narrow(
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
    const bundleRaw = body["bundle"];
    const bundle: SharpVideoJobStatus & { state: "done" } = {
      state: "done",
      bundle: extractBundle(bundleRaw, jobId),
      framesTotal: num(body["framesTotal"], 0),
      durationSeconds: num(body["durationSeconds"], 0),
      sizeBytes: num(body["sizeBytes"], 0),
    };
    return bundle;
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

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}
function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "unknown network error";
}
async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
