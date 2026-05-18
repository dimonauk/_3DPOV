/**
 * lib/capabilities/viz/splat-providers/hangar-gsplat.server.ts —
 * hangar-gsplat provider for viz.splat-generate.
 *
 * Bench-side pinhole-video → 3D Gaussian Splat pipeline using
 * COLMAP/GLOMAP SfM + gsplat (or Brush) as the trainer. Apache-2.0 /
 * MIT throughout — commerce-safe, unlike sharp-onnx's research-only
 * apple-amlr.
 *
 * # Source of truth
 *
 * The bench service lives at `D:/The_Hangar/engines/splat360/` (named
 * for the original 360-video workflow; the same service is extended
 * with a non-360 entry point here). The runtime is FastAPI + a job
 * queue + COLMAP + GLOMAP + gsplat/Brush. The expected job-submission
 * contract is documented below.
 *
 * If the bench service hasn't been extended with this entry point
 * yet, the POST returns 404 / 405 and we surface
 * `provider-unavailable` so the caller knows it's a deployment gap,
 * not a code bug.
 *
 * # Bench contract
 *
 *   POST   {SPLAT_VIDEO_SERVICE_URL}/jobs
 *     multipart:
 *       video: <bytes>
 *       params: JSON
 *         { frameStride: number,                      // frame extraction
 *           trainer: "gsplat" | "brush",
 *           sfm: "colmap" | "glomap",
 *           iterations: number }
 *     returns: { jobId, etaSeconds? }
 *
 *   GET    {SPLAT_VIDEO_SERVICE_URL}/jobs/{id}
 *     returns: JobStatus (with frameCount, registeredImages,
 *              sfmDurationSeconds, trainDurationSeconds)
 *
 *   GET    {SPLAT_VIDEO_SERVICE_URL}/jobs/{id}/result/std
 *     returns: standard-3DGS PLY bytes
 *
 * # Cross-network
 *
 * Same posture as sharp-onnx: production calls go through Tailscale
 * Funnel; set `SPLAT_VIDEO_SERVICE_URL` on the Vercel project to the
 * tailnet hostname.
 *
 * # Defaults
 *
 *   frameStride: 4    — every 4th frame at 30fps = ~7.5 fps registration
 *   trainer:    "gsplat"  (fast, ships permissive licence)
 *   sfm:        "glomap"  (faster than COLMAP at modest accuracy cost)
 *   iterations: 30_000    (~5 min on a 3080 Ti for 100 frames)
 */

import "server-only";

import {
  asError,
  authHeaders,
  downloadResultBytes,
  fetchAsset,
  log,
  persistSplat,
  pollUntilDone,
} from "./_helpers.server";

import type {
  SplatGenerateInput,
  SplatRecord,
} from "../splat-generate";

const SERVICE_URL =
  process.env["SPLAT_VIDEO_SERVICE_URL"] ?? "http://localhost:7846";
const SERVICE_AUTH_TOKEN = process.env["SPLAT_VIDEO_AUTH_TOKEN"] ?? "";

const DEFAULT_FRAME_STRIDE = 4;
const DEFAULT_TRAINER: "gsplat" | "brush" = "gsplat";
const DEFAULT_SFM: "colmap" | "glomap" = "glomap";
const DEFAULT_ITERATIONS = 30_000;

/** Pipeline can take several minutes — extend the default 5 min poll. */
const HANGAR_GSPLAT_TIMEOUT_MS = 15 * 60 * 1_000;

// Video POST to splat360 bench — multi-GB multipart upload over a
// 360-camera shoot's worth of footage. 15 min matches the poll
// timeout above; a stalled multipart upload past that is "bench
// gone" not "still chunking bytes".
const HANGAR_GSPLAT_POST_TIMEOUT_MS = HANGAR_GSPLAT_TIMEOUT_MS;

type HangarGsplatParams = {
  frameStride: number;
  trainer: "gsplat" | "brush";
  sfm: "colmap" | "glomap";
  iterations: number;
};

async function postJob(
  videoBytes: Uint8Array,
  videoMimeType: string,
  videoFilename: string,
  params: HangarGsplatParams,
): Promise<{ jobId: string }> {
  const form = new FormData();
  form.set(
    "video",
    new Blob([new Uint8Array(videoBytes)], { type: videoMimeType }),
    videoFilename,
  );
  form.set("params", JSON.stringify(params));
  let res: Response;
  try {
    res = await fetch(`${SERVICE_URL}/video3d/jobs`, {
      method: "POST",
      body: form,
      headers: authHeaders(SERVICE_AUTH_TOKEN),
      signal: AbortSignal.timeout(HANGAR_GSPLAT_POST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw asError(
        "provider-unavailable",
        `hangar-gsplat upload hung (>${HANGAR_GSPLAT_POST_TIMEOUT_MS / 1000}s) — check bench reachability`,
      );
    }
    throw err;
  }
  if (res.status === 404 || res.status === 405) {
    throw asError(
      "provider-unavailable",
      `hangar-gsplat: bench endpoint ${SERVICE_URL}/video3d/jobs returned ${res.status}. ` +
        `The splat360 service has not yet been extended with the video→3D entry point. ` +
        `See lib/capabilities/viz/splat-providers/hangar-gsplat.server.ts for the contract.`,
    );
  }
  if (!res.ok) {
    throw asError(
      "provider-unavailable",
      `hangar-gsplat job submission failed: ${res.status} ${res.statusText}`,
    );
  }
  const body = (await res.json()) as { jobId?: string };
  if (!body.jobId) {
    throw asError("provider-unavailable", "hangar-gsplat returned no jobId");
  }
  return { jobId: body.jobId };
}

export async function generateViaHangarGsplat(
  input: SplatGenerateInput,
  uploadedBy: string,
): Promise<SplatRecord> {
  if (input.source.kind !== "video") {
    throw asError(
      "source-invalid",
      `hangar-gsplat requires source.kind="video", got ${input.source.kind}`,
    );
  }
  const sourceUrl = input.source.url;
  const frameStride = input.source.frameStride ?? DEFAULT_FRAME_STRIDE;

  log.info("hangar-gsplat start", { sourceUrl, frameStride });

  const source = await fetchAsset(sourceUrl);

  const { jobId } = await postJob(
    source.bytes,
    source.mimeType,
    source.filename,
    {
      frameStride,
      trainer: DEFAULT_TRAINER,
      sfm: DEFAULT_SFM,
      iterations: DEFAULT_ITERATIONS,
    },
  );

  const status = await pollUntilDone(SERVICE_URL, jobId, {
    token: SERVICE_AUTH_TOKEN,
    providerLabel: "hangar-gsplat",
    timeoutMs: HANGAR_GSPLAT_TIMEOUT_MS,
    jobsPath: "/video3d/jobs",
  });

  const plyBytes = await downloadResultBytes(SERVICE_URL, jobId, "std", {
    token: SERVICE_AUTH_TOKEN,
    providerLabel: "hangar-gsplat",
    jobsPath: "/video3d/jobs",
  });

  const filenameRoot = source.filename.replace(/\.[^.]+$/, "");
  const gaussianCount = status.gaussianCount ?? 0;

  const record = await persistSplat({
    bytes: plyBytes,
    filename: `${filenameRoot}_gsplat.ply`,
    uploadedBy,
    provider: "hangar-gsplat",
    plyFlavour: "standard-3dgs",
    gaussianCount,
    sourceUrl,
    durationSeconds: status.durationSeconds ?? null,
    meta: {
      jobId,
      frameStride,
      trainer: DEFAULT_TRAINER,
      sfm: DEFAULT_SFM,
      iterations: DEFAULT_ITERATIONS,
      frameCount: status.frameCount ?? null,
      registeredImages: status.registeredImages ?? null,
      sfmDurationSeconds: status.sfmDurationSeconds ?? null,
      trainDurationSeconds: status.trainDurationSeconds ?? null,
    },
    ...(input.recordId !== undefined && { recordId: input.recordId }),
  });

  log.info("hangar-gsplat done", {
    id: record.id,
    jobId,
    plyBytes: record.plyBytes,
    gaussianCount,
    frameCount: status.frameCount ?? null,
  });

  return record;
}
