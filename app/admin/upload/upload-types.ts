/**
 * app/admin/upload/upload-types.ts — Local types + subject/kind enums
 * for the operator upload page. Pure module, no React.
 */

import type {
  MediaKind,
  MediaSubject,
} from "lib/capabilities/media/library-types";

export const SUBJECTS: MediaSubject[] = [
  "photograph",
  "aerial",
  "holo-walk",
  "codex",
  "article",
  "journal",
  "tutorial",
  "product",
  "rookery",
  "press",
  "other",
];

export const KINDS: MediaKind[] = [
  "photo",
  "photo-single-exposure",
  "video",
  "360-photo",
  "360-video",
  "sbs-stereo-mp4",
  "usdz",
  "glb",
  "ply",
  "audio",
  "pdf",
  "other",
];

export type RowStatus =
  | { kind: "queued" }
  | { kind: "uploading"; percent: number }
  | { kind: "done"; url: string; id: string }
  | { kind: "failed"; message: string };

export type Row = {
  id: string;
  file: File;
  title: string;
  description: string;
  subject: MediaSubject;
  mediaKind: MediaKind;
  capturedAt: string;
  tags: string;
  locationSlug: string;
  locationName: string;
  locationLat: string;
  locationLng: string;
  status: RowStatus;
};
