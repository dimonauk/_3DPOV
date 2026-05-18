/**
 * app/api/holo-walk/generate-splat/route.ts — Operator endpoint that
 * turns an uploaded 360 video into a HoloWalk splat sculpture.
 *
 * Flow:
 *   1. Verify the bearer ID token + operator allow-list.
 *   2. Persist the source video via `mediaUpload` (subject: holo-walk,
 *      kind: 360-video). This gives us a public URL the splat-generate
 *      capability can fetch.
 *   3. Call `splatGenerateServer({ provider: "hangar-gsplat", source:
 *      { kind: "video", url: <video URL> } })`. The capability handles
 *      bench-side job submission, polling, PLY download, and the
 *      Vercel-Blob persist of the resulting .ply.
 *   4. Write a `DynamicSculpture` row that points at both the source
 *      video and the resulting splat. This row is what the HoloWalk
 *      gallery page reads to surface operator additions.
 *
 * The capability operates against the `splat360` bench service at
 * `SPLAT_VIDEO_SERVICE_URL` (defaults to `http://localhost:7846`).
 * With `SPLAT360_VIDEO_3D_FAKE=1` set on the bench the round-trip
 * completes with a placeholder PLY — useful for end-to-end testing
 * without a real training run.
 *
 * Constraint: do not modify the splat-generate capability; only
 * consume it. All adaptation lives in this route + `lib/holo-walk/
 * dynamic-sculptures.ts`.
 */

import { NextResponse } from "next/server";

import { mediaDelete, mediaUpload } from "lib/capabilities/media/library";
import {
  MediaLibraryError,
  type MediaKind,
} from "lib/capabilities/media/library-types";
import { splatGenerateServer } from "lib/capabilities/viz/splat-generate.server";
import { writeDynamicSculpture } from "lib/holo-walk/dynamic-sculptures";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import { createLogger } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

export const dynamic = "force-dynamic";
// Bench-side training can take many minutes. The capability already
// caps at 15 min internally; this matches the upstream budget.
export const maxDuration = 800;

const log = createLogger("api:/holo-walk/generate-splat");

// Bench-side splat training is expensive AND produces large artifacts.
// Cost shape (May 2026, hangar-gsplat provider, single operator):
//   - GPU: ~$0.30-1.50 per job (8-30 min on a single A100, depending
//     on input resolution + iterations). Bench is studio-owned so the
//     marginal cost is electricity + amortised hardware, not on-demand
//     cloud rates — figures here assume cloud-equivalent pricing as a
//     "what would it cost if bench was on RunPod" sanity check.
//   - Vercel Blob: ~50MB-2GB PLY per success (subject + iterations);
//     ~$0.005-0.20 per stored job at $0.10/GB/month.
//   - Egress: free within the studio for splat-AR-deploy renders.
// Cap at 5 jobs/hour per operator UID — enough to iterate on a real
// shoot (typically 1-3 jobs per session as the operator tweaks
// frame-stride / SfM solver), tight enough that an accidental
// form-resubmit loop or compromised operator credential can't run up
// a five-figure cloud bill in a single quiet weekend.
// Auto-upgrades to Upstash Redis when env is set.
const HOURLY_JOB_CAP = 5;
const limiter = createFixedWindowLimiter({
  scope: "holo-walk.generate-splat",
  limit: HOURLY_JOB_CAP,
  windowMs: 60 * 60 * 1000,
});

// Body-size cap on the inbound video upload. The capability itself
// streams the video to the bench so the only Vercel cost here is
// transient memory + the Blob storage write. 2 GB is generous for a
// 360-camera shoot (Insta360 X4 at max bitrate produces ~600MB/min);
// past that the operator should pre-trim before uploading.
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

// Accept the obvious video MIME types the operator console produces.
// Note: DJI .OSV files arrive as application/octet-stream or
// video/octet-stream; we still let them through and let the bench
// service decide how to stitch.
const VIDEO_MIME_PREFIXES = ["video/"];
const VIDEO_FALLBACK_TYPES = new Set([
  "application/octet-stream", // .osv often shows up unrecognised
  "application/mp4",
]);

function asString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function parseNumber(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `sculpture-${suffix}`;
}

function inferKind(mimeType: string): MediaKind {
  // 360 video is the expected input; operators may also drop in a
  // pinhole video and let the bench treat it as such. Tag the row
  // accurately so the media library reflects what was uploaded.
  return mimeType.toLowerCase().includes("360") ? "360-video" : "video";
}

export async function POST(req: Request) {
  let admin: { uid: string; email: string };
  try {
    admin = await requireAdminUser(req);
  } catch (err) {
    if (err instanceof AdminGuardError) {
      const { status, body } = adminGuardErrorBody(err);
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Per-operator rate-limit. Keyed on UID (not IP) — operators can
  // legitimately rotate between Salford / MediaCity Wi-Fi during a
  // shoot. Auth has already been verified so the UID is trustworthy.
  const slot = await limiter.consume(`uid:${admin.uid}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    log.warn("rate_limited", {
      uid: admin.uid,
      retryAfterSec,
      backend: limiter.backend,
    });
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Splat training cap is ${HOURLY_JOB_CAP} jobs per hour per operator. Try again shortly.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const fileEntry = form.get("file");
  const isBlobLike = (
    v: FormDataEntryValue | null,
  ): v is FormDataEntryValue & Blob =>
    v !== null &&
    typeof v !== "string" &&
    typeof (v as { arrayBuffer?: unknown }).arrayBuffer === "function";
  if (!isBlobLike(fileEntry)) {
    return NextResponse.json(
      { error: "Missing 'file' field (360 video bytes)." },
      { status: 400 },
    );
  }
  const file = fileEntry;

  const fileName: string | undefined =
    typeof (file as { name?: unknown }).name === "string"
      ? (file as { name: string }).name
      : undefined;
  const filename = asString(form.get("filename")) ?? fileName ?? "upload.mp4";

  const mimeType =
    asString(form.get("mimeType")) ??
    (typeof file.type === "string" && file.type.length > 0 ? file.type : undefined) ??
    "application/octet-stream";

  const looksLikeVideo =
    VIDEO_MIME_PREFIXES.some((p) => mimeType.toLowerCase().startsWith(p)) ||
    VIDEO_FALLBACK_TYPES.has(mimeType.toLowerCase()) ||
    /\.(mp4|mov|m4v|webm|osv|insv|mkv)$/i.test(filename);
  if (!looksLikeVideo) {
    return NextResponse.json(
      {
        error: `Expected a video upload; got mimeType=${mimeType}, filename=${filename}.`,
      },
      { status: 400 },
    );
  }

  // Body-size cap. The Blob spec exposes a numeric `size` — Node's
  // FormData implementation populates it from Content-Length, so this
  // is reliable for our multipart uploads. A missing/non-numeric size
  // is treated as "trust but don't enforce" (the bench has its own
  // input limits as a backstop).
  const fileSize: number | undefined =
    typeof (file as { size?: unknown }).size === "number"
      ? (file as { size: number }).size
      : undefined;
  if (fileSize !== undefined && fileSize > MAX_VIDEO_BYTES) {
    log.warn("video too large", {
      uid: admin.uid,
      sizeBytes: fileSize,
      maxBytes: MAX_VIDEO_BYTES,
    });
    return NextResponse.json(
      {
        error: "video_too_large",
        message: `Video exceeds ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024 * 1024))}GB cap. Pre-trim before uploading.`,
        sizeBytes: fileSize,
        maxBytes: MAX_VIDEO_BYTES,
      },
      { status: 413 },
    );
  }

  const label = asString(form.get("label"));
  if (!label) {
    return NextResponse.json(
      { error: "Missing 'label' field — every sculpture needs a name." },
      { status: 400 },
    );
  }

  const lat = parseNumber(asString(form.get("lat")));
  const lon = parseNumber(asString(form.get("lon")));
  if (
    (lat !== undefined && (lat < -90 || lat > 90)) ||
    (lon !== undefined && (lon < -180 || lon > 180))
  ) {
    return NextResponse.json(
      { error: "GPS coords out of range (lat ±90, lon ±180)." },
      { status: 400 },
    );
  }

  const id = slugify(label);

  // ---- 1. Persist the source video so the capability can fetch it ----
  log.info("uploading source video", {
    id,
    label,
    filename,
    mimeType,
    sizeBytes: typeof (file as { size?: unknown }).size === "number"
      ? (file as { size: number }).size
      : null,
    hasGps: lat !== undefined && lon !== undefined,
  });

  let videoUrl: string;
  let videoMediaId: string;
  try {
    const videoMedia = await mediaUpload({
      file,
      filename,
      mimeType,
      kind: inferKind(mimeType),
      subject: "holo-walk",
      uploadedBy: admin.uid,
      title: label,
      ...(lat !== undefined && lon !== undefined
        ? { location: { lat, lng: lon, slug: id } }
        : {}),
    });
    videoUrl = videoMedia.url;
    videoMediaId = videoMedia.id;
  } catch (err) {
    if (err instanceof MediaLibraryError) {
      log.error("video upload failed (media library)", {
        id,
        code: err.code,
        message: err.message,
      });
      return NextResponse.json(
        { error: err.message, code: err.code, stage: "video-upload" },
        { status: err.code === "not-configured" ? 503 : 500 },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error("video upload failed", { id, message });
    return NextResponse.json(
      { error: message, stage: "video-upload" },
      { status: 500 },
    );
  }

  // ---- 2. Run the splat-generate capability ----
  log.info("submitting hangar-gsplat job", { id, videoUrl });
  let record;
  try {
    record = await splatGenerateServer(
      {
        provider: "hangar-gsplat",
        source: { kind: "video", url: videoUrl },
        recordId: id,
      },
      { uploadedBy: admin.uid },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("splat-generate failed", { id, videoUrl, message });

    // ---- Orphan-media cleanup ----
    // The source video lives in Vercel Blob + a Firestore media row.
    // When the bench job fails, NEITHER is useful: there's no gallery
    // entry pointing at the video, and the operator's "retry" path
    // (re-upload via /holo-walk/new) provides fresh bytes. Without
    // cleanup, every failed job leaks ~50MB-2GB of Blob storage AND
    // a stale media-library row. Best-effort: log the outcome, don't
    // fail the response on a cleanup miss.
    let sourceVideoCleanup: "deleted" | "failed" = "deleted";
    let sourceVideoCleanupError: string | undefined;
    try {
      await mediaDelete(videoMediaId);
      log.info("cleaned up orphan source video", { id, videoMediaId });
    } catch (cleanupErr) {
      sourceVideoCleanup = "failed";
      sourceVideoCleanupError =
        cleanupErr instanceof Error
          ? cleanupErr.message
          : String(cleanupErr);
      log.warn("orphan source video cleanup failed", {
        id,
        videoMediaId,
        err: sourceVideoCleanupError,
      });
    }

    // Persist the error so the operator can see it in the gallery
    // without having to re-scrape Vercel logs. videoUrl / videoMediaId
    // are kept on the row even after a successful cleanup — they're
    // the canonical record of "what was uploaded" at the time of
    // failure. The errorMessage suffix tells the operator the URL is
    // dead so they don't click expecting bytes.
    let errorRowWriteError: string | undefined;
    try {
      await writeDynamicSculpture({
        id,
        label,
        ...(lat !== undefined ? { lat } : {}),
        ...(lon !== undefined ? { lon } : {}),
        videoUrl,
        videoMediaId,
        status: "error",
        errorMessage:
          sourceVideoCleanup === "deleted"
            ? `${message} (source video removed)`
            : message,
        createdBy: admin.uid,
      });
    } catch (writeErr) {
      errorRowWriteError =
        writeErr instanceof Error ? writeErr.message : String(writeErr);
      log.warn("could not persist error row", {
        id,
        message: errorRowWriteError,
      });
    }

    return NextResponse.json(
      {
        error: message,
        stage: "splat-generate",
        id,
        videoUrl,
        sourceVideoCleanup,
        ...(sourceVideoCleanupError !== undefined
          ? { sourceVideoCleanupError }
          : {}),
        // When the error-row write ALSO failed, surface that in the
        // body so the operator knows the gallery won't reflect this
        // failure — otherwise they'll think the job is "still running"
        // instead of "failed and unrecorded".
        ...(errorRowWriteError !== undefined
          ? { errorRowWriteError }
          : {}),
      },
      { status: 500 },
    );
  }

  const jobId =
    typeof record.meta["jobId"] === "string"
      ? (record.meta["jobId"] as string)
      : undefined;
  const plyMediaId =
    typeof record.meta["mediaId"] === "string"
      ? (record.meta["mediaId"] as string)
      : undefined;

  // ---- 3. Index the result in the gallery store ----
  let row;
  try {
    row = await writeDynamicSculpture({
      id,
      label,
      ...(lat !== undefined ? { lat } : {}),
      ...(lon !== undefined ? { lon } : {}),
      videoUrl,
      videoMediaId,
      plyUrl: record.plyUrl,
      plyBytes: record.plyBytes,
      ...(plyMediaId !== undefined ? { plyMediaId } : {}),
      gaussianCount: record.gaussianCount,
      ...(jobId !== undefined ? { jobId } : {}),
      status: "done",
      createdBy: admin.uid,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("dynamic sculpture write failed", { id, message });
    return NextResponse.json(
      {
        error: `Splat trained but gallery index write failed: ${message}`,
        stage: "gallery-index",
        record,
      },
      { status: 500 },
    );
  }

  log.info("done", {
    id,
    plyUrl: record.plyUrl,
    plyBytes: record.plyBytes,
    gaussianCount: record.gaussianCount,
    jobId: jobId ?? null,
  });

  return NextResponse.json({ sculpture: row, splat: record }, { status: 200 });
}
