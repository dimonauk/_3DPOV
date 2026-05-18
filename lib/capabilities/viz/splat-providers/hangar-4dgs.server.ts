/**
 * lib/capabilities/viz/splat-providers/hangar-4dgs.server.ts —
 * hangar-4dgs provider for viz.splat-generate.
 *
 * Bench-side monocular-video → 4D Gaussian Splat pipeline. Choose one
 * of: 4D-GS, Deformable-GS, SC-GS (all Apache/MIT) — or Apple SHARP 4D
 * once an ONNX export ships (research-only). The default ships the
 * commerce-safe path.
 *
 * # 4D shape
 *
 * Two encodings are supported in the SplatRecord:
 *   - `deformable-mlp`: canonical 3DGS PLY + a deformation MLP that
 *     maps (x, t) → Δ. Compact on disk but needs a runtime evaluator
 *     in the renderer. The current @mkkellogg/gaussian-splats-3d
 *     viewer cannot show motion — it'll render the canonical pose only.
 *   - `canonical-time`: per-timestep canonical attributes in a single
 *     PLY with extra columns. Heavier on disk, renderable by stepping
 *     a static viewer through timestamps.
 *
 * # Bench contract
 *
 *   POST   {SPLAT_4D_SERVICE_URL}/jobs
 *     multipart:
 *       video: <bytes>
 *       params: JSON
 *         { encoding: "deformable-mlp" | "canonical-time",
 *           keyframes: number,
 *           sfm: "colmap" | "glomap",
 *           trainer: "4dgs" | "deformable-gs" | "sc-gs" }
 *     returns: { jobId, etaSeconds? }
 *
 *   GET    {SPLAT_4D_SERVICE_URL}/jobs/{id}
 *     returns: JobStatus (extended with frameCount, durationSeconds,
 *              sourceFps, encoding, trainDurationSeconds)
 *
 *   GET    {SPLAT_4D_SERVICE_URL}/jobs/{id}/result/{path}
 *     deformable-mlp: /result/canonical.ply (downloaded here) +
 *                     /result/deform.bin (the MLP weights — TODO: not
 *                     yet plumbed through the SplatRecord; lands when
 *                     the runtime evaluator exists)
 *     canonical-time: /result/4d.ply (with per-timestep attributes)
 *
 * # Licence
 *
 * Open codebases ship Apache/MIT; the resulting splat is
 * commercial-ok. If/when the pipeline is swapped to Apple SHARP 4D
 * the provider id should be renamed (`sharp-onnx-4d`) so the
 * research-only licence travels with the record automatically.
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
  SplatPlyFlavour,
  SplatRecord,
} from "../splat-generate";

const SERVICE_URL =
  process.env["SPLAT_4D_SERVICE_URL"] ?? "http://localhost:7847";
const SERVICE_AUTH_TOKEN = process.env["SPLAT_4D_AUTH_TOKEN"] ?? "";

const DEFAULT_ENCODING: "deformable-mlp" | "canonical-time" = "deformable-mlp";
const DEFAULT_KEYFRAMES = 60;
const DEFAULT_SFM: "colmap" | "glomap" = "glomap";
const DEFAULT_TRAINER: "4dgs" | "deformable-gs" | "sc-gs" = "4dgs";

/** 4D training takes longer than 3D — bump the deadline to 30 minutes. */
const HANGAR_4DGS_TIMEOUT_MS = 30 * 60 * 1_000;

// Video POST to splat360 bench's 4D endpoint — same multi-GB
// multipart upload as gsplat. Matches the poll-loop budget so the
// upload phase can take the full window if the bench is on a slow
// link to its inbound storage.
const HANGAR_4DGS_POST_TIMEOUT_MS = HANGAR_4DGS_TIMEOUT_MS;

type Hangar4dgsParams = {
  encoding: "deformable-mlp" | "canonical-time";
  keyframes: number;
  sfm: "colmap" | "glomap";
  trainer: "4dgs" | "deformable-gs" | "sc-gs";
};

async function postJob(
  videoBytes: Uint8Array,
  videoMimeType: string,
  videoFilename: string,
  params: Hangar4dgsParams,
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
    res = await fetch(`${SERVICE_URL}/video4d/jobs`, {
      method: "POST",
      body: form,
      headers: authHeaders(SERVICE_AUTH_TOKEN),
      signal: AbortSignal.timeout(HANGAR_4DGS_POST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw asError(
        "provider-unavailable",
        `hangar-4dgs upload hung (>${HANGAR_4DGS_POST_TIMEOUT_MS / 1000}s) — check bench reachability`,
      );
    }
    throw err;
  }
  if (res.status === 404 || res.status === 405) {
    throw asError(
      "provider-unavailable",
      `hangar-4dgs: bench endpoint ${SERVICE_URL}/video4d/jobs returned ${res.status}. ` +
        `The 4D-GS service has not yet been built. ` +
        `See lib/capabilities/viz/splat-providers/hangar-4dgs.server.ts for the contract.`,
    );
  }
  if (!res.ok) {
    throw asError(
      "provider-unavailable",
      `hangar-4dgs job submission failed: ${res.status} ${res.statusText}`,
    );
  }
  const body = (await res.json()) as { jobId?: string };
  if (!body.jobId) {
    throw asError("provider-unavailable", "hangar-4dgs returned no jobId");
  }
  return { jobId: body.jobId };
}

export async function generateViaHangar4dgs(
  input: SplatGenerateInput,
  uploadedBy: string,
): Promise<SplatRecord> {
  if (input.source.kind !== "video") {
    throw asError(
      "source-invalid",
      `hangar-4dgs requires source.kind="video", got ${input.source.kind}`,
    );
  }
  const sourceUrl = input.source.url;

  log.info("hangar-4dgs start", {
    sourceUrl,
    encoding: DEFAULT_ENCODING,
    keyframes: DEFAULT_KEYFRAMES,
    trainer: DEFAULT_TRAINER,
  });

  const source = await fetchAsset(sourceUrl);

  const { jobId } = await postJob(source.bytes, source.mimeType, source.filename, {
    encoding: DEFAULT_ENCODING,
    keyframes: DEFAULT_KEYFRAMES,
    sfm: DEFAULT_SFM,
    trainer: DEFAULT_TRAINER,
  });

  const status = await pollUntilDone(SERVICE_URL, jobId, {
    token: SERVICE_AUTH_TOKEN,
    providerLabel: "hangar-4dgs",
    timeoutMs: HANGAR_4DGS_TIMEOUT_MS,
    jobsPath: "/video4d/jobs",
  });

  // Result path depends on encoding. Canonical-time has the time-coded
  // attributes in one file; deformable-mlp keeps the canonical PLY
  // separate and the deformation in a sidecar that the future evaluator
  // will load.
  const resultPath = DEFAULT_ENCODING === "canonical-time" ? "4d.ply" : "canonical.ply";
  const plyBytes = await downloadResultBytes(SERVICE_URL, jobId, resultPath, {
    token: SERVICE_AUTH_TOKEN,
    providerLabel: "hangar-4dgs",
    jobsPath: "/video4d/jobs",
  });

  const plyFlavour: SplatPlyFlavour =
    DEFAULT_ENCODING === "canonical-time"
      ? "4dgs-canonical-time"
      : "4dgs-deformable-mlp";

  const filenameRoot = source.filename.replace(/\.[^.]+$/, "");
  const gaussianCount = status.gaussianCount ?? 0;
  const frameCount = status.frameCount ?? DEFAULT_KEYFRAMES;
  const durationSeconds = status.durationSeconds ?? 0;

  const record = await persistSplat({
    bytes: plyBytes,
    filename: `${filenameRoot}_4dgs.ply`,
    uploadedBy,
    provider: "hangar-4dgs",
    plyFlavour,
    gaussianCount,
    fourD: {
      kind: DEFAULT_ENCODING,
      frameCount,
      durationSeconds,
    },
    sourceUrl,
    durationSeconds,
    meta: {
      jobId,
      encoding: DEFAULT_ENCODING,
      keyframes: DEFAULT_KEYFRAMES,
      trainer: DEFAULT_TRAINER,
      sfm: DEFAULT_SFM,
      trainDurationSeconds: status.trainDurationSeconds ?? null,
    },
    ...(input.recordId !== undefined && { recordId: input.recordId }),
  });

  log.info("hangar-4dgs done", {
    id: record.id,
    jobId,
    plyBytes: record.plyBytes,
    gaussianCount,
    frameCount,
    encoding: DEFAULT_ENCODING,
  });

  return record;
}
