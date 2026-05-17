/**
 * app/aerial/aerial/gallery.ts — Maps a media-library record list to
 * the gallery shape consumed by the recent-work section.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import type { Media } from "lib/capabilities/media/library-types";

export type GalleryItem = {
  media: Media;
  isVideo: boolean;
  poster?: string;
};

export function pickGalleryItems(records: Media[]): GalleryItem[] {
  // Order by capturedAt where present, then uploadedAt. The library
  // already returns newest-first via `orderBy: 'uploadedAt'`, so
  // we only need a defensive sort if a future query reshuffles.
  return records.map((media) => {
    const isVideo =
      media.kind === "video" ||
      media.kind === "360-video" ||
      media.mimeType.startsWith("video/");
    const poster = media.variants?.thumbnail ?? media.variants?.small;
    return { media, isVideo, ...(poster ? { poster } : {}) };
  });
}
