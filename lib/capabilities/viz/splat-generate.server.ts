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

import { randomUUID } from "node:crypto";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import {
  ensureFolder,
  publicDriveUrl,
  shareFilePublic,
  uploadFileToDrive,
} from "lib/integrations/google/drive";
import type { Media } from "../media/library-types";
import { mediaUpload } from "../media/library";

import {
  PROVIDER_LICENCE,
  type SplatGenerateError,
  type SplatGenerateInput,
  type SplatRecord,
} from "./splat-generate";

const DEFAULT_SERVICE_URL =
  process.env["SHARP_ONNX_SERVICE_URL"] ?? "http://localhost:7845";

/**
 * Shared bearer token. The bench service is reachable over Tailscale
 * Funnel — i.e. publicly addressable on the internet, TLS-terminated
 * by Tailscale, but with no IP-level gate. This token is the actual
 * lock. Set on both ends: bench `SHARP_ONNX_AUTH_TOKEN` env, Vercel
 * project `SHARP_ONNX_AUTH_TOKEN` env. Empty disables auth (only safe
 * for bench-local dev with Funnel off).
 */
const SERVICE_AUTH_TOKEN = process.env["SHARP_ONNX_AUTH_TOKEN"] ?? "";

function authHeaders(): Record<string, string> {
  return SERVICE_AUTH_TOKEN
    ? { Authorization: `Bearer ${SERVICE_AUTH_TOKEN}` }
    : {};
}

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
  const res = await fetch(`${serviceUrl}/jobs`, {
    method: "POST",
    body: form,
    headers: authHeaders(),
  });
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
    const res = await fetch(`${serviceUrl}/jobs/${jobId}`, {
      headers: authHeaders(),
    });
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
  const res = await fetch(`${serviceUrl}/jobs/${jobId}/result/std`, {
    headers: authHeaders(),
  });
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
 * Output-storage target for a freshly-minted splat.
 *
 * - `vercel-blob` (default) — small files, studio-controlled CDN, paid
 *   egress. Hits the 1 GB Hobby cap fast for splat-scale media.
 * - `google-drive` — file lands in the operator's Drive (anyone-with-link
 *   readable). Browser fetches Drive directly via the API key URL; zero
 *   Vercel egress. Requires the operator's drive.file scope token.
 */
export type SplatOutputTarget =
  | { kind: "vercel-blob" }
  | { kind: "google-drive"; operatorAccessToken: string; folderName?: string };

const DEFAULT_DRIVE_FOLDER = "Holoflow / splats";
const SHARP_GAUSSIAN_DEFAULT = 1_179_648;

/**
 * Inner SHARP-ONNX driver — takes raw image bytes (no source URL
 * required) and lands a SplatRecord. Used by both the URL-based
 * `generateViaSharpOnnx` (which fetches first) and the Photos /
 * Drive orchestrators (which download bytes with Bearer auth and would
 * otherwise have nowhere public to point SHARP at).
 *
 * `sourceImageUrl` is recorded on the resulting splat for provenance
 * when the caller has one; null when the source was a transient byte
 * stream that never had a public URL.
 *
 * `target` controls where the resulting PLY is persisted. Defaults to
 * Vercel Blob; pass `google-drive` to land on the operator's Drive.
 */
export async function generateViaSharpOnnxFromBytes(
  args: {
    bytes: Uint8Array;
    mimeType: string;
    filename: string;
    uploadedBy: string;
    sourceImageUrl?: string | null;
    recordId?: string;
    target?: SplatOutputTarget;
  },
): Promise<SplatRecord> {
  const serviceUrl = DEFAULT_SERVICE_URL;
  const target: SplatOutputTarget = args.target ?? { kind: "vercel-blob" };

  const { jobId } = await postSharpOnnxJob(
    serviceUrl,
    args.bytes,
    args.mimeType,
    args.filename,
    {},
  );
  const status = await pollUntilDone(serviceUrl, jobId);
  const plyBytes = await downloadResult(serviceUrl, jobId);

  const filename = args.filename.replace(/\.[^.]+$/, "") + "_std.ply";
  const gaussianCount = status.gaussianCount ?? SHARP_GAUSSIAN_DEFAULT;
  const splatRef = {
    provider: "sharp-onnx" as const,
    licence: "research-only" as const,
    plyFlavour: "standard-3dgs" as const,
    gaussianCount,
    ...(args.sourceImageUrl ? { sourceImageUrl: args.sourceImageUrl } : {}),
    durationSeconds: status.durationSeconds ?? null,
  };

  if (target.kind === "vercel-blob") {
    const media = await mediaUpload({
      file: plyBytes,
      filename,
      mimeType: "application/octet-stream",
      kind: "ply",
      subject: "research",
      uploadedBy: args.uploadedBy,
      source: "vercel-blob",
      sourceRef: { splat: splatRef },
    });
    return {
      id: args.recordId ?? media.id,
      provider: "sharp-onnx",
      licence: PROVIDER_LICENCE["sharp-onnx"],
      plyFlavour: "standard-3dgs",
      plyUrl: media.url,
      plyBytes: media.sizeBytes ?? plyBytes.byteLength,
      gaussianCount,
      generatedAt: media.uploadedAt,
      meta: {
        mediaId: media.id,
        sourceImageUrl: args.sourceImageUrl ?? null,
        durationSeconds: status.durationSeconds ?? null,
        jobId,
        target: "vercel-blob",
      },
    };
  }

  // ---- google-drive output ------------------------------------------
  const folderId = await ensureFolder(
    target.operatorAccessToken,
    target.folderName ?? DEFAULT_DRIVE_FOLDER,
  );
  const { fileId } = await uploadFileToDrive(target.operatorAccessToken, {
    bytes: plyBytes,
    mimeType: "application/octet-stream",
    filename,
    parentFolderId: folderId,
  });
  await shareFilePublic(target.operatorAccessToken, fileId);
  const url = publicDriveUrl(fileId);
  const mediaId = args.recordId ?? randomUUID();
  const generatedAt = new Date().toISOString();
  const record: Media = {
    id: mediaId,
    kind: "ply",
    subject: "research",
    source: "google-drive",
    url,
    mimeType: "application/octet-stream",
    uploadedAt: generatedAt,
    uploadedBy: args.uploadedBy,
    sizeBytes: plyBytes.byteLength,
    sourceRef: {
      googleDrive: { fileId },
      splat: splatRef,
    },
    variants: { original: url },
  };
  // Strip undefined fields — Firestore rejects them.
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (v !== undefined) cleaned[k] = v;
  }
  const db = requireFirebaseAdminDb();
  await db.collection("media").doc(mediaId).set(cleaned);

  return {
    id: mediaId,
    provider: "sharp-onnx",
    licence: PROVIDER_LICENCE["sharp-onnx"],
    plyFlavour: "standard-3dgs",
    plyUrl: url,
    plyBytes: plyBytes.byteLength,
    gaussianCount,
    generatedAt,
    meta: {
      mediaId,
      driveFileId: fileId,
      sourceImageUrl: args.sourceImageUrl ?? null,
      durationSeconds: status.durationSeconds ?? null,
      jobId,
      target: "google-drive",
    },
  };
}

/**
 * URL-based SHARP-ONNX entry: fetches the source image bytes and
 * delegates to {@link generateViaSharpOnnxFromBytes}.
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
  const source = await fetchSourceImage(sourceUrl);
  return generateViaSharpOnnxFromBytes({
    bytes: source.bytes,
    mimeType: source.mimeType,
    filename: source.filename,
    uploadedBy,
    sourceImageUrl: sourceUrl,
    ...(input.recordId ? { recordId: input.recordId } : {}),
  });
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
    case "hangar-gsplat":
      // Bench-side contract (TODO — splat360 service extension):
      //   POST {SPLAT_VIDEO_SERVICE_URL}/jobs
      //     multipart: { video: <bytes>, params: JSON }
      //     params: { frameStride: number, trainer: "gsplat" | "brush",
      //               sfm: "colmap" | "glomap", iterations: number }
      //   Returns: { jobId, etaSeconds }
      //   Status: GET {SPLAT_VIDEO_SERVICE_URL}/jobs/{jobId}
      //     -> { state, gaussianCount, frameCount, registeredImages,
      //          sfmDurationSeconds, trainDurationSeconds }
      //   Result: GET {SPLAT_VIDEO_SERVICE_URL}/jobs/{jobId}/result/std
      //     -> standard-3DGS PLY bytes
      throw asError(
        "provider-unavailable",
        "hangar-gsplat: bench-side video → 3D splat training pipeline not " +
          "yet wired. Lives at D:/The_Hangar/engines/splat360/ — currently " +
          "foundation-phase. See splat-generate.server.ts for the job " +
          "contract this route expects.",
      );
    case "hangar-4dgs":
      // Bench-side contract (TODO — choose one of: 4D-GS, Deformable-GS,
      // SC-GS, Apple SHARP 4D if available; all share roughly the same
      // pipeline shape):
      //   POST {SPLAT_4D_SERVICE_URL}/jobs
      //     multipart: { video: <bytes>, params: JSON }
      //     params: { encoding: "deformable-mlp" | "canonical-time",
      //               keyframes: number, sfm: "colmap" | "glomap" }
      //   Returns: { jobId, etaSeconds }
      //   Status: GET {SPLAT_4D_SERVICE_URL}/jobs/{jobId}
      //     -> { state, gaussianCount, frameCount, durationSeconds,
      //          encoding, trainDurationSeconds }
      //   Result: depends on encoding:
      //     deformable-mlp -> /result/canonical.ply + /result/deform.bin
      //     canonical-time -> /result/4d.ply (with time-stride attributes)
      //   The 4D PLY flavour is non-standard and needs a matching
      //   browser-side viewer; static splat viewers will render a single
      //   timestamp.
      throw asError(
        "provider-unavailable",
        "hangar-4dgs: 4D dynamic splat training is not yet wired. The aim " +
          "is monocular video → 4D-GS / Deformable-GS / SC-GS bench " +
          "pipeline (Apache/MIT) or Apple SHARP 4D (research-only) once " +
          "an ONNX export ships. Renderer requires 4D-aware viewer; the " +
          "current @mkkellogg/gaussian-splats-3d shows one timestamp only.",
      );
    case "postshot":
    case "studio-rig-native":
    case "luma-genie":
      throw asError(
        "provider-unavailable",
        `${input.provider} provider is not yet wired — only sharp-onnx is live in this build`,
      );
  }
}
