/**
 * app/atelier/lightpaint/lightpaint/types.ts — Frame + playback +
 * export state shapes, FPS bounds.
 *
 * Extracted from lightpaint-client.tsx per ARCHITECTURE.md Rule 1.
 */

export type Frame = {
  id: string;
  name: string;
  url: string;
  aspect: number;
  isEquirectangular: boolean;
  /** Original file size in bytes. */
  sizeBytes: number;
};

export type PlayState =
  | { kind: "stopped"; frame: number }
  | { kind: "playing"; frame: number; lastTickMs: number };

export type ExportState =
  | { kind: "idle" }
  | { kind: "running"; progress: number }
  | { kind: "ready"; blobUrl: string; sizeMb: number }
  | { kind: "error"; message: string };

export const MIN_FPS = 1;
export const MAX_FPS = 24;
export const DEFAULT_FPS = 6;
