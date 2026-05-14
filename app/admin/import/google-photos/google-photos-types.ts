/**
 * app/admin/import/google-photos/google-photos-types.ts — Client-side
 * helper types for the Photos picker page. Kept in a tiny file so the
 * page component itself stays under the line ceiling.
 */

import type { MediaSubject } from "lib/capabilities/media/library-types";

export const SUBJECT_OPTIONS: MediaSubject[] = [
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

export type PickedItemRaw = {
  id: string;
  type: "PHOTO" | "VIDEO" | "TYPE_UNSPECIFIED";
  createTime?: string;
  mediaFile?: {
    baseUrl?: string;
    mimeType?: string;
    filename?: string;
  };
};

export type PickedItemRow = {
  raw: PickedItemRaw;
  picked: boolean;
};

export type ImportOutcome =
  | { status: "ok" }
  | { status: "error"; message: string };
