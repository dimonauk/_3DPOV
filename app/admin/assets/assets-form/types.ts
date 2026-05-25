/**
 * app/admin/assets/assets-form/types.ts
 *
 * Mode union, blob upload state machine, the closed lists of asset
 * kinds + licences, and the id-validation regex. Pure data.
 */

import type { AssetKind } from "lib/assets/types";

export type Mode = "vercel-blob" | "google-drive" | "google-photos";

export type BlobState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "ready"; url: string; bytes: number; pathname: string }
  | { kind: "error"; message: string };

export const ID_RE = /^[a-z][a-z0-9-]{1,63}$/;

export const KINDS: AssetKind[] = [
  "mesh",
  "blend",
  "scan",
  "texture",
  "video",
  "audio",
  "archive",
  "image",
  "other",
];

export const LICENCES = [
  "studio-proprietary",
  "cc0",
  "cc-by",
  "cc-by-nc",
  "cc-by-sa",
  "cc-by-nc-sa",
  "apache-2.0",
  "mit",
  "research-only",
  "other",
];
