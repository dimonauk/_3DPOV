/**
 * lib/capabilities/media/library-blob.ts — Vercel Blob storage backend.
 *
 * One-line role: write a `Blob`/`File`/`Buffer` to Vercel Blob, return
 * the URL + Blob pathname for storage in the Firestore metadata record.
 * Read access just returns the public URL (Vercel Blob's `url` field).
 *
 * # Configuration
 * Reads `BLOB_READ_WRITE_TOKEN` from env (Vercel adds this automatically
 * when Vercel Blob is enabled on the project). For local dev: run
 * `vercel env pull .env.local` to fetch it.
 *
 * # Posture
 * Public-access by default — operator-uploaded media is meant to be
 * served to the public. Private-blob is supported via a separate token
 * if a future capability needs it; not used by the media library.
 */

import "server-only";

import { put, del, head, type PutBlobResult } from "@vercel/blob";

import { MediaLibraryError } from "./library-types";

/** Stable Blob pathname pattern: <subject>/<yyyy>/<mm>/<filename>. */
function buildPathname(opts: { subject: string; filename: string }): string {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  // Filename sanitisation: replace spaces and risky chars with underscores.
  const safe = opts.filename
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_{2,}/g, "_");
  return `${opts.subject}/${yyyy}/${mm}/${safe}`;
}

export async function putBlob(opts: {
  file: Blob | File | ArrayBuffer | Uint8Array;
  filename: string;
  mimeType: string;
  subject: string;
}): Promise<PutBlobResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new MediaLibraryError(
      "Vercel Blob not configured. Enable Blob storage in the Vercel project, then `vercel env pull .env.local`.",
      "not-configured",
    );
  }
  const pathname = buildPathname({ subject: opts.subject, filename: opts.filename });
  // @vercel/blob's PutBody doesn't include Uint8Array; wrap it as a Blob.
  // The generic Uint8Array<ArrayBufferLike> doesn't narrow cleanly across
  // the instanceof check in TS 5.8, so the false branch is asserted.
  const body: Blob | ArrayBuffer | File =
    opts.file instanceof Uint8Array
      ? new Blob([new Uint8Array(opts.file)], { type: opts.mimeType })
      : (opts.file as Blob | ArrayBuffer | File);
  try {
    const result = await put(pathname, body, {
      access: "public",
      contentType: opts.mimeType,
      addRandomSuffix: true,
    });
    return result;
  } catch (err) {
    throw new MediaLibraryError(
      `Vercel Blob upload failed: ${err instanceof Error ? err.message : String(err)}`,
      "upload-failed",
    );
  }
}

export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    throw new MediaLibraryError(
      `Vercel Blob delete failed: ${err instanceof Error ? err.message : String(err)}`,
      "upload-failed",
    );
  }
}

export async function headBlob(url: string): Promise<{
  size: number;
  uploadedAt: Date;
  contentType: string;
} | null> {
  try {
    const info = await head(url);
    return {
      size: info.size,
      uploadedAt: info.uploadedAt,
      contentType: info.contentType,
    };
  } catch {
    return null;
  }
}
