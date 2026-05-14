/**
 * lib/capabilities/viz/splat-generate.server.ts — Server-side wiring for
 * the `viz.splat-generate` capability.
 *
 * One-line role: implements the `splatGenerate` router by dispatching to
 * provider-specific functions. Foundation phase wires only `sharp-onnx`;
 * the other providers throw `provider-unavailable` until their runtime
 * paths land.
 *
 * # The sharp-onnx path
 * 1. Fetch the source image bytes (caller passes a URL or hosted ref).
 * 2. POST to the SHARP-ONNX FastAPI service (default `localhost:7845`,
 *    overridable via `SHARP_ONNX_SERVICE_URL`).
 * 3. Poll the job until it reaches `done` (typical: ~10 s on bench GPU).
 * 4. Download the standard-3DGS PLY (`/result/std` — already converted
 *    through `convert_sharp_ply.py` on the service side).
 * 5. Persist via the media library: Vercel Blob put + Firestore Media
 *    record. Splat-specific metadata lands in `sourceRef.splat`.
 * 6. Return a synthesised `SplatRecord` to the caller.
 *
 * # Cross-network
 * When the site is deployed to Vercel the bench is not reachable from
 * the Vercel runtime directly; the service must be exposed via the
 * studio's Tailscale tunnel. Set `SHARP_ONNX_SERVICE_URL` to the
 * tailnet hostname (e.g. `https://sharp-onnx-bench.tail99b2a4.ts.net`).
 * Vercel→Tailscale requires the studio's Tailscale Connector or a
 * permanent funnel, neither of which is wired yet — for now this path
 * only works when the site is running on the bench itself.
 */

import "server-only";

import { mediaUpload } from "../media/library";

import {
  PROVIDER_LICENCE,
  type SplatGenerateError,
  type SplatGenerateInput,
  type SplatRecord,
} from "./splat-generate";

const DEFAULT_SERVICE_URL =
  process.env["SHARP_ONNX_SERVICE_URL"] ?? "http://localhost:7845";

const POLL_INTERVAL_MS = 1_500;
const POLL_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes — single frame should
// finish in ~10s, but cold-start + queue depth could stretch it.

function asError(code: SplatGenerateError["code"], message: string): Error {
  const detail: SplatGenerateError = { code, message };
  return Object.assign(new Error(message), detail);
}

async function postSharpOnnxJob(
  serviceUrl: string,
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
  const res = await fetch(`${serviceUrl}/jobs`, { method: "POST", body: form });
  if (!res.ok) {
    throw asError(
      "provider-unavailable",
      `SHARP-ONNX service rejected job submission: ${res.status} ${res.statusText}`,
    );
  }
  const body = (await res.json()) as { jobId?: string };
  if (!body.jobId) {
    throw asError(
      "provider-unavailable",
      "SHARP-ONNX service returned no jobId",
    );
  }
  return { jobId: body.jobId };
}

type JobStatus = {
  state: "queued" | "running" | "done" | "error" | "cancelled";
  message?: string;
  code?: string;
  gaussianCount?: number;
  stdBytes?: number;
  durationSeconds?: number;
};

async function pollUntilDone(
  serviceUrl: string,
  jobId: string,
): Promise<JobStatus> {
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() - started > POLL_TIMEOUT_MS) {
      throw asError(
        "generation-failed",
        `SHARP-ONNX job ${jobId} timed out after ${POLL_TIMEOUT_MS / 1000}s`,
      );
    }
    const res = await fetch(`${serviceUrl}/jobs/${jobId}`);
    if (!res.ok) {
      throw asError(
        "provider-unavailable",
        `poll failed: ${res.status} ${res.statusText}`,
      );
    }
    const status = (await res.json()) as JobStatus;
    if (status.state === "done") return status;
    if (status.state === "error") {
      throw asError(
        "generation-failed",
        `SHARP-ONNX job ${jobId} failed (${status.code ?? "UNKNOWN"}): ${status.message ?? ""}`,
      );
    }
    if (status.state === "cancelled") {
      throw asError(
        "generation-failed",
        `SHARP-ONNX job ${jobId} was cancelled`,
      );
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

async function downloadResult(
  serviceUrl: string,
  jobId: string,
): Promise<Uint8Array> {
  const res = await fetch(`${serviceUrl}/jobs/${jobId}/result/std`);
  if (!res.ok) {
    throw asError(
      "generation-failed",
      `result download failed: ${res.status} ${res.statusText}`,
    );
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function fetchSourceImage(
  url: string,
): Promise<{ bytes: Uint8Array; mimeType: string; filename: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw asError(
      "source-invalid",
      `failed to fetch source image: ${res.status} ${res.statusText}`,
    );
  }
  const buf = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  const filename = url.split("/").pop()?.split("?")[0] ?? "source.jpg";
  return { bytes: new Uint8Array(buf), mimeType, filename };
}

/**
 * The only provider currently wired. Calls the SHARP-ONNX FastAPI
 * service, uploads the result via the media library, and assembles a
 * SplatRecord.
 */
async function generateViaSharpOnnx(
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
  const serviceUrl = DEFAULT_SERVICE_URL;

  const source = await fetchSourceImage(sourceUrl);
  const { jobId } = await postSharpOnnxJob(
    serviceUrl,
    source.bytes,
    source.mimeType,
    source.filename,
    {},
  );
  const status = await pollUntilDone(serviceUrl, jobId);
  const plyBytes = await downloadResult(serviceUrl, jobId);

  const filename = source.filename.replace(/\.[^.]+$/, "") + "_std.ply";
  const media = await mediaUpload({
    file: plyBytes,
    filename,
    mimeType: "application/octet-stream",
    kind: "ply",
    subject: "research",
    uploadedBy,
    source: "vercel-blob",
    sourceRef: {
      splat: {
        provider: "sharp-onnx",
        licence: "research-only",
        plyFlavour: "standard-3dgs",
        gaussianCount: status.gaussianCount ?? 1_179_648,
        sourceImageUrl: sourceUrl,
        durationSeconds: status.durationSeconds ?? null,
      },
    },
  });

  return {
    id: input.recordId ?? media.id,
    provider: "sharp-onnx",
    licence: PROVIDER_LICENCE["sharp-onnx"],
    plyFlavour: "standard-3dgs",
    plyUrl: media.url,
    plyBytes: media.sizeBytes ?? plyBytes.byteLength,
    gaussianCount: status.gaussianCount ?? 1_179_648,
    generatedAt: media.uploadedAt,
    meta: {
      mediaId: media.id,
      sourceImageUrl: sourceUrl,
      durationSeconds: status.durationSeconds ?? null,
      jobId,
    },
  };
}

/**
 * Server-side router. Picks the right provider and runs it. Caller must
 * pass `uploadedBy` (the operator's Firebase uid) — this matches the
 * media library's auth posture.
 */
export async function splatGenerateServer(
  input: SplatGenerateInput,
  ctx: { uploadedBy: string },
): Promise<SplatRecord> {
  switch (input.provider) {
    case "sharp-onnx":
      return generateViaSharpOnnx(input, ctx.uploadedBy);
    case "postshot":
    case "studio-rig-native":
    case "luma-genie":
      throw asError(
        "provider-unavailable",
        `${input.provider} provider is not yet wired — only sharp-onnx is live in this build`,
      );
  }
}
