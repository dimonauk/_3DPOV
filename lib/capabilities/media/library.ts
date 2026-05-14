/**
 * lib/capabilities/media/library.ts — Media library capabilities.
 *
 * One-line role: the public surface of the media library — `mediaUpload`
 * + `mediaList` + `mediaGet` + `mediaDelete` + `mediaSetRetired`. All
 * server-only; callers in client components must go through API routes
 * or Server Actions.
 *
 * # Composition
 * Upload: hash → Vercel Blob put → Firestore record write → return
 * Media. The two writes aren't transactional; on metadata-write failure
 * the Blob is best-effort deleted to avoid orphans (a permanent failure
 * leaves the blob, which a future GC sweep cleans up).
 */

import "server-only";

import { createHash, randomUUID } from "node:crypto";

import {
  deleteBlob,
  putBlob,
} from "./library-blob";
import {
  deleteMediaRecord,
  getMediaRecord,
  listMediaRecords,
  writeMediaRecord,
} from "./library-firestore";
import {
  MediaLibraryError,
  type Media,
  type MediaPage,
  type MediaQuery,
  type MediaSource,
  type MediaUploadInput,
} from "./library-types";

async function bytesOf(
  file: Blob | File | ArrayBuffer | Uint8Array,
): Promise<Uint8Array> {
  if (file instanceof Uint8Array) return file;
  if (file instanceof ArrayBuffer) return new Uint8Array(file);
  // Blob / File case
  return new Uint8Array(await file.arrayBuffer());
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Upload one media file. Writes the bytes to Vercel Blob, then writes
 * the metadata to Firestore. Returns the new Media record.
 *
 * If `input.source` is set to anything other than `vercel-blob` (e.g.
 * `google-photos`, `google-drive`), the bytes are still stored in
 * Vercel Blob — the source field just records the original provenance
 * so the operator UI can show "imported from Google Photos".
 */
export async function mediaUpload(input: MediaUploadInput): Promise<Media> {
  if (!input.uploadedBy) {
    throw new MediaLibraryError(
      "uploadedBy is required (the operator's Firebase uid).",
      "not-authenticated",
    );
  }

  const bytes = await bytesOf(input.file);
  const sha256 = sha256Hex(bytes);
  const sizeBytes = bytes.byteLength;

  const blob = await putBlob({
    file: bytes,
    filename: input.filename,
    mimeType: input.mimeType,
    subject: input.subject,
  });

  const source: MediaSource = input.source ?? "vercel-blob";
  const sourceRef = {
    ...(input.sourceRef ?? {}),
    blob: { pathname: blob.pathname },
  };

  const media: Media = {
    id: randomUUID(),
    kind: input.kind,
    subject: input.subject,
    source,
    url: blob.url,
    mimeType: input.mimeType,
    uploadedAt: new Date().toISOString(),
    uploadedBy: input.uploadedBy,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.capturedAt !== undefined && { capturedAt: input.capturedAt }),
    ...(input.tags !== undefined && { tags: input.tags }),
    ...(input.location !== undefined && { location: input.location }),
    sizeBytes,
    sha256,
    sourceRef,
    variants: { original: blob.url },
  };

  try {
    await writeMediaRecord(media);
  } catch (err) {
    // Best-effort cleanup so we don't orphan a blob without metadata.
    try {
      await deleteBlob(blob.url);
    } catch {
      // GC will pick this up later.
    }
    throw err;
  }

  return media;
}

export async function mediaList(query: MediaQuery): Promise<MediaPage> {
  return listMediaRecords(query);
}

export async function mediaGet(id: string): Promise<Media | null> {
  return getMediaRecord(id);
}

export async function mediaDelete(id: string): Promise<void> {
  const existing = await getMediaRecord(id);
  if (!existing) {
    throw new MediaLibraryError(`media ${id} not found`, "not-found");
  }
  // Delete the blob first; failures here are tolerable (orphan), but
  // the metadata stays canonical.
  if (existing.source === "vercel-blob" && existing.sourceRef?.blob) {
    try {
      await deleteBlob(existing.url);
    } catch {
      // Continue with metadata deletion.
    }
  }
  await deleteMediaRecord(id);
}

export async function mediaSetRetired(id: string, retired: boolean): Promise<void> {
  const existing = await getMediaRecord(id);
  if (!existing) {
    throw new MediaLibraryError(`media ${id} not found`, "not-found");
  }
  await writeMediaRecord({ ...existing, retired });
}

export type { Media, MediaPage, MediaQuery, MediaUploadInput } from "./library-types";
