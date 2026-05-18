/**
 * lib/capabilities/viz/splat-providers/sharp-onnx.server.ts —
 * SHARP-ONNX provider for viz.splat-generate.
 *
 * Apple's SHARP (Single-image High-quality Photo-realistic Reconstruction)
 * exported to ONNX, served by a FastAPI wrapper on the studio's bench
 * GPU (`D:/The_Hangar/engines/sharp-onnx/`). One input image →
 * ~1.18M-gaussian splat in ~10 s.
 *
 * # Licence
 *
 * apple-amlr: research-only. The licence travels on the resulting
 * SplatRecord and commerce surfaces filter on it.
 *
 * # Bench contract
 *
 *   POST   {SHARP_ONNX_SERVICE_URL}/jobs
 *     multipart: image=<bytes>, meta=<JSON>
 *     returns: { jobId }
 *   GET    {SHARP_ONNX_SERVICE_URL}/jobs/{id}
 *     returns: JobStatus
 *   GET    {SHARP_ONNX_SERVICE_URL}/jobs/{id}/result/std
 *     returns: standard-3DGS PLY bytes (already converted from SHARP's
 *     superset PLY via convert_sharp_ply.py on the service side)
 *
 * # Cross-network
 *
 * When the site is deployed to Vercel the bench is not reachable
 * directly. The service must be exposed via the studio's Tailscale
 * tunnel. Set `SHARP_ONNX_SERVICE_URL` to the tailnet hostname (e.g.
 * `https://sharp-onnx-bench.tail99b2a4.ts.net`); see [[holoflow-bench-bridge]].
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
  type SplatOutputTarget,
} from "./_helpers.server";

import type {
  SplatGenerateInput,
  SplatRecord,
} from "../splat-generate";

const SERVICE_URL =
  process.env["SHARP_ONNX_SERVICE_URL"] ?? "http://localhost:7845";
const SERVICE_AUTH_TOKEN = process.env["SHARP_ONNX_AUTH_TOKEN"] ?? "";

/** Mean gaussian count SHARP's pretrained ONNX emits. Used as a fallback
 *  when the bench reports something other than a count (defensive). */
const SHARP_GAUSSIAN_DEFAULT = 1_179_648;

// Image POST to SHARP bench — single still up to a few MB. 2 min is
// more than enough headroom for the multipart upload; a stalled
// request past that is a real bench-side problem.
const SHARP_POST_TIMEOUT_MS = 2 * 60 * 1_000;

async function postJob(
  imageBytes: Uint8Array,
  imageMimeType: string,
  imageFilename: string,
  meta: Record<string, unknown>,
): Promise<{ jobId: string }> {
  const form = new FormData();
  form.set(
    "image",
    new Blob([new Uint8Array(imageBytes)], { type: imageMimeType }),
    imageFilename,
  );
  form.set("meta", JSON.stringify(meta));
  let res: Response;
  try {
    res = await fetch(`${SERVICE_URL}/jobs`, {
      method: "POST",
      body: form,
      headers: authHeaders(SERVICE_AUTH_TOKEN),
      signal: AbortSignal.timeout(SHARP_POST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw asError(
        "provider-unavailable",
        `sharp-onnx job submission hung (>${SHARP_POST_TIMEOUT_MS / 1000}s)`,
      );
    }
    throw err;
  }
  if (!res.ok) {
    throw asError(
      "provider-unavailable",
      `sharp-onnx job submission failed: ${res.status} ${res.statusText}`,
    );
  }
  const body = (await res.json()) as { jobId?: string };
  if (!body.jobId) {
    throw asError("provider-unavailable", "sharp-onnx returned no jobId");
  }
  return { jobId: body.jobId };
}

/**
 * Bytes-in entry: takes raw image bytes (no source URL required) and
 * lands a SplatRecord. Used by the Photos / Drive orchestrators that
 * download with Bearer auth and have nowhere public to point SHARP at.
 *
 * `sourceImageUrl` is recorded on the resulting splat for provenance
 * when the caller has one; null when the source was transient.
 */
export async function generateViaSharpOnnxFromBytes(args: {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
  uploadedBy: string;
  sourceImageUrl?: string | null;
  recordId?: string;
  target?: SplatOutputTarget;
}): Promise<SplatRecord> {
  log.info("sharp-onnx start", {
    filename: args.filename,
    bytes: args.bytes.byteLength,
  });

  const { jobId } = await postJob(
    args.bytes,
    args.mimeType,
    args.filename,
    {},
  );
  const status = await pollUntilDone(SERVICE_URL, jobId, {
    token: SERVICE_AUTH_TOKEN,
    providerLabel: "sharp-onnx",
  });
  const plyBytes = await downloadResultBytes(SERVICE_URL, jobId, "std", {
    token: SERVICE_AUTH_TOKEN,
    providerLabel: "sharp-onnx",
  });

  const filenameRoot = args.filename.replace(/\.[^.]+$/, "");
  const gaussianCount = status.gaussianCount ?? SHARP_GAUSSIAN_DEFAULT;

  const record = await persistSplat({
    bytes: plyBytes,
    filename: `${filenameRoot}_std.ply`,
    uploadedBy: args.uploadedBy,
    provider: "sharp-onnx",
    plyFlavour: "standard-3dgs",
    gaussianCount,
    sourceUrl: args.sourceImageUrl ?? null,
    durationSeconds: status.durationSeconds ?? null,
    meta: { jobId },
    ...(args.recordId !== undefined && { recordId: args.recordId }),
    ...(args.target !== undefined && { target: args.target }),
  });

  log.info("sharp-onnx done", {
    id: record.id,
    jobId,
    plyBytes: record.plyBytes,
    gaussianCount,
    durationSeconds: status.durationSeconds ?? null,
  });

  return record;
}

/**
 * URL-input entry. Validates the input shape (sharp-onnx requires a
 * single image), fetches the bytes, delegates to the bytes-in entry.
 */
export async function generateViaSharpOnnx(
  input: SplatGenerateInput,
  uploadedBy: string,
): Promise<SplatRecord> {
  if (input.source.kind !== "image-single") {
    throw asError(
      "source-invalid",
      `sharp-onnx requires source.kind="image-single", got ${input.source.kind}`,
    );
  }
  const sourceUrl = input.source.url;
  const source = await fetchAsset(sourceUrl);
  return generateViaSharpOnnxFromBytes({
    bytes: source.bytes,
    mimeType: source.mimeType,
    filename: source.filename,
    uploadedBy,
    sourceImageUrl: sourceUrl,
    ...(input.recordId ? { recordId: input.recordId } : {}),
  });
}
