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
 * Per-frame splat generation is minutes-long for a few-second clip. The
 * handle exposes both whole-job status and a per-frame progress channel
 * (`framesDone / framesTotal`) so the calling UI can render a frame-
 * counter live. Cancellation is honoured between frames. All errors are
 * typed; `SharpServiceUnreachableError` is re-used from
 * `commerce.sharp-job` so the UI's degraded-mode copy works for both.
 *
 * Types live in `./sharp-video-job-types`; JSON parsing + URL helpers
 * in `./sharp-video-job-parser`. Both are re-exported here so the
 * public import path stays stable.
 *
 * Full purpose in sharp-video-job.PURPOSE.md.
 */

import { SharpServiceUnreachableError } from "./sharp-job";
import {
  baseUrl,
  errMessage,
  narrow,
  safeText,
} from "./sharp-video-job-parser";
import type {
  SharpVideoJobHandle,
  SharpVideoJobInput,
  SharpVideoJobStatus,
} from "./sharp-video-job-types";

export type {
  SharpVideoJobHandle,
  SharpVideoJobInput,
  SharpVideoJobStatus,
} from "./sharp-video-job-types";

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
