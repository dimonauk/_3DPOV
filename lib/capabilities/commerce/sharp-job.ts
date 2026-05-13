/**
 * lib/capabilities/commerce/sharp-job.ts — Capability `commerce.sharp-job`.
 *
 * One-line role: the editioned-quality 2D-to-3D path, talking REST to the
 * FastAPI wrapper that fronts SHARP on the studio's 3080 Ti.
 *
 * # Purpose
 * The site offers two routes from a 2D photograph to a 3D thing. The free
 * route is in-browser depth estimation; this is the SHARP route — Apple's
 * single-image gaussian-splatter, run on the studio bench, output a `.ply`
 * (or `.spz`) the studio publishes as a numbered edition. This file is the
 * REST client; the service contract lives in `python-services/sharp_service.py`.
 *
 * # Why this shape
 * Long-running GPU jobs do not fit a single `await`. The handle returned
 * by `submitSharpJob` is a thin closure over a `jobId` — callers poll at
 * their own cadence, cancel from a UI affordance, or rehydrate after a
 * page reload from a stored `jobId`. All errors are typed; the calling
 * page translates `SharpServiceUnreachableError` into the "premium needs
 * the studio's GPU — using the free in-browser version instead" copy.
 *
 * Full purpose in sharp-job.PURPOSE.md.
 */

import { envOrUndefined } from "lib/env";

const SHARP_DEFAULT_BASE_URL = "http://localhost:7842";

function baseUrl(): string {
  return envOrUndefined("SHARP_SERVICE_URL") ?? SHARP_DEFAULT_BASE_URL;
}

export type SharpJobInput = {
  imageBlob: Blob;
  outputFormat?: "ply" | "spz";
  meta?: {
    title?: string;
    captureDate?: string;
    locationId?: string;
    photographSlug?: string;
  };
};

export type SharpJobStatus =
  | { state: "queued"; positionInQueue: number; submittedAt: string }
  | { state: "running"; progressPct: number; etaSeconds: number | null }
  | {
      state: "done";
      resultUrl: string;
      format: "ply" | "spz";
      sizeBytes: number;
      durationSeconds: number;
    }
  | { state: "error"; message: string; code?: string }
  | { state: "cancelled" };

export type SharpJobHandle = {
  jobId: string;
  poll(): Promise<SharpJobStatus>;
  cancel(): Promise<void>;
  waitForCompletion(intervalMs?: number): Promise<SharpJobStatus>;
};

/** Typed error the UI translates to the degraded-mode copy. */
export class SharpServiceUnreachableError extends Error {
  readonly code = "SHARP_SERVICE_UNREACHABLE";
  constructor(reason: string) {
    super(`sharp-job: service unreachable — ${reason}`);
    this.name = "SharpServiceUnreachableError";
  }
}

/** Probe service reachability + version. Never throws. */
export async function isSharpServiceAvailable(): Promise<{
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

/** Submit a job. Returns the handle. */
export async function submitSharpJob(
  input: SharpJobInput,
): Promise<SharpJobHandle> {
  const form = new FormData();
  form.append("image", input.imageBlob);
  form.append(
    "meta",
    JSON.stringify({
      outputFormat: input.outputFormat ?? "ply",
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
      `sharp-job: submit failed — ${res.status} ${res.statusText}${text ? ` (${text})` : ""}`,
    );
  }
  const body = (await res.json()) as { jobId?: unknown };
  if (typeof body.jobId !== "string") {
    throw new Error("sharp-job: submit response missing jobId");
  }
  return rehydrateJob(body.jobId);
}

/** Reconstruct a handle from a known job ID (e.g. after page reload). */
export function rehydrateJob(jobId: string): SharpJobHandle {
  return {
    jobId,
    poll: () => pollJob(jobId),
    cancel: () => cancelJob(jobId),
    waitForCompletion: (intervalMs?: number) =>
      waitLoop(jobId, intervalMs ?? 2000),
  };
}

async function pollJob(jobId: string): Promise<SharpJobStatus> {
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
    return { state: "error", message: `job ${jobId} not found`, code: "NOT_FOUND" };
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
      `sharp-job: cancel failed — ${res.status} ${res.statusText}${text ? ` (${text})` : ""}`,
    );
  }
}

async function waitLoop(jobId: string, intervalMs: number): Promise<SharpJobStatus> {
  const delay = Math.max(250, intervalMs);
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

function narrow(body: Record<string, unknown>, jobId: string): SharpJobStatus {
  const state = body["state"];
  if (state === "queued") {
    return {
      state: "queued",
      positionInQueue: num(body["positionInQueue"], 0),
      submittedAt: str(body["submittedAt"], new Date(0).toISOString()),
    };
  }
  if (state === "running") {
    const etaRaw = body["etaSeconds"];
    return {
      state: "running",
      progressPct: num(body["progressPct"], 0),
      etaSeconds: typeof etaRaw === "number" ? etaRaw : null,
    };
  }
  if (state === "done") {
    return {
      state: "done",
      resultUrl: str(
        body["resultUrl"],
        `${baseUrl()}/jobs/${encodeURIComponent(jobId)}/result`,
      ),
      format: body["format"] === "spz" ? "spz" : "ply",
      sizeBytes: num(body["sizeBytes"], 0),
      durationSeconds: num(body["durationSeconds"], 0),
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
