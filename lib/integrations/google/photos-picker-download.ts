/**
 * lib/integrations/google/photos-picker-download.ts — Photos Picker
 * file-byte downloader.
 *
 * One-line role: given a PickedMediaItem, fetch the bytes via its
 * `baseUrl=dw` URL with Bearer auth.
 *
 * Split from `./photos-picker.ts` so each file stays well under the
 * 300-line ceiling.
 *
 * # baseUrl semantics
 * The Picker API returns a `mediaFile.baseUrl` per item. Append `=dw`
 * (download with original bytes) for the original file. Other suffixes
 * (=w1024-h1024, =d, etc.) request transcoded sizes — we always want
 * the original for the studio's archive.
 */

import "server-only";

import type { PickedMediaItem } from "./photos-picker";

export type DownloadedMediaItem = {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
};

/**
 * Download the original bytes for a picked media item. Returns
 * a Uint8Array; the caller is responsible for handing those bytes off
 * to `mediaUpload()`.
 *
 * Throws on non-2xx with a useful message including the operation name.
 */
export async function downloadMediaItem(
  accessToken: string,
  mediaItem: PickedMediaItem,
): Promise<DownloadedMediaItem> {
  const baseUrl = mediaItem.mediaFile?.baseUrl;
  if (!baseUrl) {
    throw new Error(
      `photos-picker-download: mediaItem ${mediaItem.id} has no mediaFile.baseUrl`,
    );
  }
  // For photos the `=d` suffix would also work; `=dw` is the canonical
  // "download with EXIF, no resize" form. For videos `=dv` returns the
  // original video. We branch on type so we get the right one.
  const suffix = mediaItem.type === "VIDEO" ? "=dv" : "=d";
  const url = `${baseUrl}${suffix}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `photos-picker-download[downloadMediaItem ${mediaItem.id}]: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 400)}` : ""}`,
    );
  }
  const arrayBuffer = await res.arrayBuffer();
  return {
    bytes: new Uint8Array(arrayBuffer),
    mimeType: mediaItem.mediaFile.mimeType ?? "application/octet-stream",
    filename: mediaItem.mediaFile.filename ?? `${mediaItem.id}`,
  };
}

/** Map a Picker mediaItem's mime to a MediaKind. */
export function pickedMediaKind(
  mediaItem: PickedMediaItem,
): "photo" | "video" | "other" {
  const mt = (mediaItem.mediaFile?.mimeType ?? "").toLowerCase();
  if (mt.startsWith("image/")) return "photo";
  if (mt.startsWith("video/")) return "video";
  if (mediaItem.type === "PHOTO") return "photo";
  if (mediaItem.type === "VIDEO") return "video";
  return "other";
}
