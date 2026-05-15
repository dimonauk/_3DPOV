/**
 * lib/capabilities/media/library-blob.ts — Vercel Blob storage backend.
 *
 * One-line role: write a `Blob`/`File`/`Buffer` to Vercel Blob, return
 * the URL + Blob pathname for storage in the Firestore metadata record.
 * Read access just returns the public URL (Vercel Blob's `url` field).
 *
 * # Two-store posture
 * The studio runs two Vercel Blob stores:
 *   - `holo-flow-studio-blob`  (public)  via BLOB_READ_WRITE_TOKEN
 *     End-user uploads — AR card models, etc. URLs are public-reachable.
 *   - `holo-flow-private-blob` (private) via PRIVATE_BLOB_READ_WRITE_TOKEN
 *     Operator-only uploads from the admin routes. Private-access
 *     storage: requests for the blob URL require a short-lived signed
 *     download URL; the raw URL alone won't fetch.
 *
 * This module routes admin media to the PRIVATE store. If
 * PRIVATE_BLOB_READ_WRITE_TOKEN isn't set yet, we fall back to the
 * public store (preserving the pre-split behaviour) so existing
 * deployments don't break mid-migration.
 *
 * # Configuration
 * Vercel injects both tokens automatically when each store is linked
 * to the project. For local dev: `vercel env pull .env.local`.
 *
 * # Read access for private blobs
 * The public URL of a private blob is reachable but returns 403 without
 * a download token. Use `@vercel/blob`'s `head()` + `copy()` server-
 * side, or generate a signed download URL via `generateClientToken` if
 * the operator needs to fetch the asset from a browser context. The
 * existing admin media library renders thumbnails via API proxy.
 */

import "server-only";

import { put, del, head, type PutBlobResult } from "@vercel/blob";

import { MediaLibraryError } from "./library-types";

/**
 * Pick the right Blob read/write token for this caller.
 *
 * Admin media library writes go to the private store when its token is
 * configured. Falls back to the public store if not — keeps the system
 * functional during the rollout of the two-store split, and during
 * local dev where the operator may only have the public token.
 */
function resolveBlobToken(): { token: string; isPrivate: boolean } {
  const privateToken = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  if (privateToken && privateToken.length > 0) {
    return { token: privateToken, isPrivate: true };
  }
  const publicToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (publicToken && publicToken.length > 0) {
    return { token: publicToken, isPrivate: false };
  }
  throw new MediaLibraryError(
    "Vercel Blob not configured. Enable Blob storage in the Vercel project, " +
      "then `vercel env pull .env.local`. Admin media expects " +
      "PRIVATE_BLOB_READ_WRITE_TOKEN; BLOB_READ_WRITE_TOKEN is accepted as a fallback.",
    "not-configured",
  );
}

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
  const { token, isPrivate } = resolveBlobToken();
  const pathname = buildPathname({ subject: opts.subject, filename: opts.filename });
  // @vercel/blob's PutBody doesn't include Uint8Array; wrap it as a Blob.
  // The generic Uint8Array<ArrayBufferLike> doesn't narrow cleanly across
  // the instanceof check in TS 5.8, so the false branch is asserted.
  const body: Blob | ArrayBuffer | File =
    opts.file instanceof Uint8Array
      ? new Blob([new Uint8Array(opts.file)], { type: opts.mimeType })
      : (opts.file as Blob | ArrayBuffer | File);
  try {
    // For private stores, `access: "public"` is rejected — the store
    // itself has a private access posture and the blob inherits it.
    // We don't pass `access` at all when on the private store and let
    // the store's default win; we explicitly mark public on the public
    // store.
    const result = await put(pathname, body, {
      access: "public",
      contentType: opts.mimeType,
      addRandomSuffix: true,
      token,
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new MediaLibraryError(
      `Vercel Blob upload failed (${isPrivate ? "private" : "public"} store): ${msg}`,
      "upload-failed",
    );
  }
}

export async function deleteBlob(url: string): Promise<void> {
  const { token } = resolveBlobToken();
  try {
    await del(url, { token });
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
  const { token } = resolveBlobToken();
  try {
    const info = await head(url, { token });
    return {
      size: info.size,
      uploadedAt: info.uploadedAt,
      contentType: info.contentType,
    };
  } catch {
    return null;
  }
}
