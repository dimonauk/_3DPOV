/**
 * scripts/cctv-sharp-client.ts — REST client for the local SHARP service
 * (python-services/sharp_service.py FastAPI wrapper on the studio's
 * 3080 Ti machine, default port 7842).
 *
 * Used by `cctv-sharp-batch.ts`. The sibling InstantMesh service has
 * its own client; the two protocols diverged just enough that sharing
 * a single client would obscure both.
 */

import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

export type SharpStatus =
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

export async function isServiceUp(serviceUrl: string): Promise<{
  ok: boolean;
  version?: string;
  queueDepth?: number;
  gpuAvailable?: boolean;
  reason?: string;
}> {
  try {
    const res = await fetch(`${serviceUrl}/health`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false, reason: `${res.status} ${res.statusText}` };
    }
    const body = (await res.json()) as {
      status?: string;
      version?: string;
      queue_depth?: number;
      gpu_available?: boolean;
    };
    return {
      ok: body.status === "ok",
      version: body.version,
      queueDepth: body.queue_depth,
      gpuAvailable: body.gpu_available,
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function submitJob(
  serviceUrl: string,
  imagePath: string,
  meta: Record<string, unknown>,
  format: "ply" | "spz",
): Promise<string> {
  const buf = await readFile(imagePath);
  const blob = new Blob([buf], { type: "image/jpeg" });
  const form = new FormData();
  form.append("image", blob, basename(imagePath));
  form.append("meta", JSON.stringify({ outputFormat: format, ...meta }));
  const res = await fetch(`${serviceUrl}/jobs`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `submit failed: ${res.status} ${res.statusText} ${text.slice(0, 200)}`,
    );
  }
  const body = (await res.json()) as { jobId?: unknown };
  if (typeof body.jobId !== "string") {
    throw new Error("submit response missing jobId");
  }
  return body.jobId;
}

export async function pollJob(
  serviceUrl: string,
  jobId: string,
): Promise<SharpStatus> {
  const res = await fetch(`${serviceUrl}/jobs/${encodeURIComponent(jobId)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return {
      state: "error",
      message: `poll failed ${res.status}`,
      code: "POLL_FAILED",
    };
  }
  return (await res.json()) as SharpStatus;
}

export async function downloadResult(
  serviceUrl: string,
  jobId: string,
  destPath: string,
): Promise<number> {
  const res = await fetch(
    `${serviceUrl}/jobs/${encodeURIComponent(jobId)}/result`,
  );
  if (!res.ok) {
    throw new Error(`result download failed: ${res.status} ${res.statusText}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return buf.byteLength;
}

export async function waitForCompletion(
  serviceUrl: string,
  jobId: string,
  pollIntervalMs: number,
  onProgress: (s: SharpStatus) => void,
): Promise<SharpStatus> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const s = await pollJob(serviceUrl, jobId);
    onProgress(s);
    if (s.state === "done" || s.state === "error" || s.state === "cancelled") {
      return s;
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
}
