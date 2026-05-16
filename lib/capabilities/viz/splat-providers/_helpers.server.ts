/**
 * lib/capabilities/viz/splat-providers/_helpers.server.ts — Shared
 * server-side helpers for viz.splat-generate providers.
 *
 * Pulled out of splat-generate.server.ts when the file split into
 * per-provider modules. All providers that talk to a bench HTTP
 * service (sharp-onnx, hangar-gsplat, hangar-4dgs, splat-real)
 * share the same shape:
 *   POST job → poll until done → download result → persist.
 *
 * Provider-specific logic (job-body shape, status-field names, result
 * path, output flavour) stays in the provider module. The shared bits
 * — auth, polling, error shape, source fetching, output persistence —
 * live here.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { createLogger } from "lib/log";
import { requireFirebaseAdminDb } from "lib/firebase/admin";
import {
  ensureFolder,
  publicDriveUrl,
  shareFilePublic,
  uploadFileToDrive,
} from "lib/integrations/google/drive";

import type { Media } from "../../media/library-types";
import { mediaUpload } from "../../media/library";

import {
  PROVIDER_LICENCE,
  type SplatGenerateError,
  type SplatLicence,
  type SplatPlyFlavour,
  type SplatProvider,
  type SplatRecord,
  type Splat4DEncoding,
} from "../splat-generate";

export const log = createLogger("capability:viz.splat-generate");

// ---------- error wrapping ----------

export function asError(
  code: SplatGenerateError["code"],
  message: string,
): Error {
  const detail: SplatGenerateError = { code, message };
  return Object.assign(new Error(message), detail);
}

// ---------- shared bearer-token auth ----------

/**
 * Build Authorization headers for bench-service requests. Reads the
 * token name from the caller (every bench service has its own env
 * variable, but they all share the same Bearer pattern).
 */
export function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------- generic job-polling state shape ----------

export type JobStatus = {
  state: "queued" | "running" | "done" | "error" | "cancelled";
  message?: string;
  code?: string;
  gaussianCount?: number;
  stdBytes?: number;
  durationSeconds?: number;
  /** Present on hangar-* jobs reporting per-stage timing. */
  sfmDurationSeconds?: number;
  trainDurationSeconds?: number;
  /** Number of frames extracted from a video source (hangar-* + sharp-video). */
  frameCount?: number;
  /** Number of images COLMAP / GLOMAP registered (hangar-gsplat). */
  registeredImages?: number;
};

export type PollOptions = {
  /** How often to GET {jobsPath}/{id}. Default 1500 ms. */
  intervalMs?: number;
  /** Hard deadline. Default 5 minutes. */
  timeoutMs?: number;
  /** Auth token for the bench service. */
  token?: string;
  /** Provider name used in error messages. */
  providerLabel?: string;
  /**
   * Route prefix where the bench exposes jobs. Default "/jobs".
   * splat360's hangar-gsplat exposes "/video3d/jobs"; splat360's
   * hangar-4dgs will expose "/video4d/jobs". sharp-onnx-bench uses the
   * default. The provider passes this so the helpers stay generic.
   */
  jobsPath?: string;
};

const DEFAULT_POLL_INTERVAL_MS = 1_500;
const DEFAULT_POLL_TIMEOUT_MS = 5 * 60 * 1_000;

/**
 * GET {serviceUrl}/jobs/{jobId} on an interval, returning the status
 * once `state === "done"`. Throws `generation-failed` on `error` /
 * `cancelled` / timeout, `provider-unavailable` on HTTP errors.
 */
export async function pollUntilDone(
  serviceUrl: string,
  jobId: string,
  opts: PollOptions = {},
): Promise<JobStatus> {
  const intervalMs = opts.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  const label = opts.providerLabel ?? "splat";
  const jobsPath = opts.jobsPath ?? "/jobs";
  const headers = opts.token ? authHeaders(opts.token) : {};
  const started = Date.now();

  while (true) {
    if (Date.now() - started > timeoutMs) {
      throw asError(
        "generation-failed",
        `${label} job ${jobId} timed out after ${timeoutMs / 1000}s`,
      );
    }
    const res = await fetch(`${serviceUrl}${jobsPath}/${jobId}`, { headers });
    if (!res.ok) {
      throw asError(
        "provider-unavailable",
        `${label} poll failed: ${res.status} ${res.statusText}`,
      );
    }
    const status = (await res.json()) as JobStatus;
    if (status.state === "done") return status;
    if (status.state === "error") {
      throw asError(
        "generation-failed",
        `${label} job ${jobId} failed (${status.code ?? "UNKNOWN"}): ${status.message ?? ""}`,
      );
    }
    if (status.state === "cancelled") {
      throw asError("generation-failed", `${label} job ${jobId} was cancelled`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * GET {serviceUrl}/jobs/{jobId}/result/{path}. Returns the response
 * body as raw bytes. Throws `generation-failed` on non-2xx.
 */
export async function downloadResultBytes(
  serviceUrl: string,
  jobId: string,
  resultPath: string,
  opts: { token?: string; providerLabel?: string; jobsPath?: string } = {},
): Promise<Uint8Array> {
  const label = opts.providerLabel ?? "splat";
  const jobsPath = opts.jobsPath ?? "/jobs";
  const headers = opts.token ? authHeaders(opts.token) : {};
  const res = await fetch(
    `${serviceUrl}${jobsPath}/${jobId}/result/${resultPath}`,
    { headers },
  );
  if (!res.ok) {
    throw asError(
      "generation-failed",
      `${label} result download failed (${resultPath}): ${res.status} ${res.statusText}`,
    );
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// ---------- source-asset fetching ----------

export type FetchedAsset = {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
};

export async function fetchAsset(url: string): Promise<FetchedAsset> {
  const res = await fetch(url);
  if (!res.ok) {
    throw asError(
      "source-invalid",
      `failed to fetch source asset: ${res.status} ${res.statusText}`,
    );
  }
  const buf = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") ?? "application/octet-stream";
  const filename = url.split("/").pop()?.split("?")[0] ?? "source.bin";
  return { bytes: new Uint8Array(buf), mimeType, filename };
}

// ---------- output persistence ----------

/**
 * Output-storage target for a freshly-minted splat. Same shape
 * regardless of provider; the router picks based on caller intent.
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

/**
 * Common output shape — the SplatRecord-relevant fields each provider
 * computes BEFORE the target decides where the bytes land. Lets the
 * persistence step be uniform across providers.
 */
export type PersistSplatInput = {
  bytes: Uint8Array;
  filename: string;
  uploadedBy: string;
  provider: SplatProvider;
  licence?: SplatLicence; // defaults to PROVIDER_LICENCE[provider]
  plyFlavour: SplatPlyFlavour;
  gaussianCount: number;
  fourD?: Splat4DEncoding;
  sourceUrl?: string | null;
  durationSeconds?: number | null;
  meta?: Record<string, unknown>;
  recordId?: string;
  target?: SplatOutputTarget;
};

/**
 * Persist generated PLY bytes to the chosen target and return the
 * SplatRecord. Used by every provider that produces a single .ply.
 */
export async function persistSplat(
  input: PersistSplatInput,
): Promise<SplatRecord> {
  const target: SplatOutputTarget = input.target ?? { kind: "vercel-blob" };
  const licence = input.licence ?? PROVIDER_LICENCE[input.provider];
  const splatRef = {
    provider: input.provider,
    licence,
    plyFlavour: input.plyFlavour,
    gaussianCount: input.gaussianCount,
    ...(input.sourceUrl ? { sourceImageUrl: input.sourceUrl } : {}),
    durationSeconds: input.durationSeconds ?? null,
  };

  if (target.kind === "vercel-blob") {
    const media = await mediaUpload({
      file: input.bytes,
      filename: input.filename,
      mimeType: "application/octet-stream",
      kind: "ply",
      subject: licence === "research-only" ? "research" : "deploy",
      uploadedBy: input.uploadedBy,
      source: "vercel-blob",
      sourceRef: { splat: splatRef },
    });
    return {
      id: input.recordId ?? media.id,
      provider: input.provider,
      licence,
      plyFlavour: input.plyFlavour,
      plyUrl: media.url,
      plyBytes: media.sizeBytes ?? input.bytes.byteLength,
      gaussianCount: input.gaussianCount,
      generatedAt: media.uploadedAt,
      ...(input.fourD && { fourD: input.fourD }),
      meta: {
        ...input.meta,
        mediaId: media.id,
        sourceImageUrl: input.sourceUrl ?? null,
        durationSeconds: input.durationSeconds ?? null,
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
    bytes: input.bytes,
    mimeType: "application/octet-stream",
    filename: input.filename,
    parentFolderId: folderId,
  });
  await shareFilePublic(target.operatorAccessToken, fileId);
  const url = publicDriveUrl(fileId);
  const mediaId = input.recordId ?? randomUUID();
  const generatedAt = new Date().toISOString();
  const record: Media = {
    id: mediaId,
    kind: "ply",
    subject: licence === "research-only" ? "research" : "deploy",
    source: "google-drive",
    url,
    mimeType: "application/octet-stream",
    uploadedAt: generatedAt,
    uploadedBy: input.uploadedBy,
    sizeBytes: input.bytes.byteLength,
    sourceRef: {
      googleDrive: { fileId },
      splat: splatRef,
    },
    variants: { original: url },
  };
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (v !== undefined) cleaned[k] = v;
  }
  const db = requireFirebaseAdminDb();
  await db.collection("media").doc(mediaId).set(cleaned);

  return {
    id: mediaId,
    provider: input.provider,
    licence,
    plyFlavour: input.plyFlavour,
    plyUrl: url,
    plyBytes: input.bytes.byteLength,
    gaussianCount: input.gaussianCount,
    generatedAt,
    ...(input.fourD && { fourD: input.fourD }),
    meta: {
      ...input.meta,
      mediaId,
      driveFileId: fileId,
      sourceImageUrl: input.sourceUrl ?? null,
      durationSeconds: input.durationSeconds ?? null,
      target: "google-drive",
    },
  };
}
