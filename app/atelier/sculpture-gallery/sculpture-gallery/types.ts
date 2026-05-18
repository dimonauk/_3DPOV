/**
 * app/atelier/sculpture-gallery/sculpture-gallery/types.ts — Shared
 * types + voxel-grid resolution registry for the sculpture-gallery
 * chamber.
 *
 * Extracted from sculpture-gallery-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

export const RES_OPTIONS = [24, 48, 64, 96] as const;
export type Resolution = (typeof RES_OPTIONS)[number];

export type ImageToGlbState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      glbUrl: string;
      glbBytes: number;
      filename: string;
      durationMs: number;
    }
  | { kind: "error"; message: string };
