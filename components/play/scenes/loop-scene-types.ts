/**
 * components/play/scenes/loop-scene-types.ts — Shared types + constants
 * for the Loop level. Imported by the orchestrator + the overlays so
 * neither file needs to depend on the other.
 */

export type Stage =
  | "draw"
  | "capture"
  | "reify"
  | "encounter"
  | "pass";

export const MAX_TRAIL_VERTICES = 2000;
export const MIN_VERTICES_TO_CAPTURE = 60;
