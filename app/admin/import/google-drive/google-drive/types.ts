/**
 * app/admin/import/google-drive/google-drive/types.ts — Wire shapes
 * for the Google Drive folder browser + import flow.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

export type DriveImageMediaMetadata = {
  width?: number;
  height?: number;
  rotation?: number;
  cameraMake?: string;
  cameraModel?: string;
};

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
  isFolder: boolean;
  imageMediaMetadata?: DriveImageMediaMetadata;
};

export type PrintFilter =
  | "all"
  | "printable-only"
  | "corpus-only"
  | "hide-downscales";

export type Breadcrumb = { id: string; name: string };

export type ImportOutcome =
  | { status: "ok" }
  | { status: "error"; message: string };

export type ImportMode = "download" | "keep-on-drive";
export type ImportPreset = "" | "sharp-splat";
export type SplatTarget = "vercel-blob" | "google-drive";
