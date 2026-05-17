/**
 * app/atelier/cube-composer/types.ts — Types + constants + the inlined
 * trajectory sample for the cube-composer chamber.
 *
 * Extracted from cube-composer-client.tsx per ARCHITECTURE.md Rule 1.
 * Pure data + types — no React, no Three.js classes (just primitive
 * arrays + tuples). The sub-components (FacePanel, CubeShell,
 * FrustumGizmo, Scene) import the shape they need from here.
 */

// ---- Trajectory ---------------------------------------------------------

// Sampled subset of the rotation trajectory shipped with the bench
// reference at
// engines/CubeComposer/assets/trajectory_rotation_fov90_2wp_20samples.json
// (video_id "003", 27 frames). Inlined so the chamber has no fetch
// dependency; degrees, exactly as the JSON stores them.
export const TRAJECTORY_DEG: ReadonlyArray<{
  frame: number;
  roll: number;
  pitch: number;
  yaw: number;
}> = [
  { frame: 0, roll: 17.79, pitch: 36.15, yaw: 96.0 },
  { frame: 1, roll: 18.28, pitch: 33.29, yaw: 88.57 },
  { frame: 2, roll: 18.83, pitch: 30.58, yaw: 81.2 },
  { frame: 3, roll: 19.27, pitch: 27.56, yaw: 73.84 },
  { frame: 4, roll: 19.7, pitch: 24.87, yaw: 66.38 },
  { frame: 5, roll: 20.18, pitch: 22.05, yaw: 59.04 },
  { frame: 6, roll: 20.87, pitch: 19.38, yaw: 51.52 },
  { frame: 7, roll: 21.38, pitch: 16.64, yaw: 44.09 },
  { frame: 8, roll: 21.79, pitch: 13.91, yaw: 36.6 },
  { frame: 9, roll: 22.09, pitch: 11.2, yaw: 29.21 },
  { frame: 10, roll: 22.31, pitch: 8.42, yaw: 21.76 },
  { frame: 11, roll: 22.45, pitch: 5.68, yaw: 14.36 },
  { frame: 12, roll: 22.5, pitch: 2.86, yaw: 6.91 },
  { frame: 13, roll: 22.47, pitch: 0.0, yaw: 0.0 },
  { frame: 14, roll: 22.36, pitch: -2.86, yaw: -6.91 },
  { frame: 15, roll: 22.18, pitch: -5.68, yaw: -14.36 },
  { frame: 16, roll: 21.92, pitch: -8.42, yaw: -21.76 },
  { frame: 17, roll: 21.59, pitch: -11.2, yaw: -29.21 },
  { frame: 18, roll: 21.19, pitch: -13.91, yaw: -36.6 },
  { frame: 19, roll: 20.72, pitch: -16.64, yaw: -44.09 },
  { frame: 20, roll: 20.19, pitch: -19.38, yaw: -51.52 },
  { frame: 21, roll: 19.6, pitch: -22.05, yaw: -59.04 },
  { frame: 22, roll: 18.94, pitch: -24.87, yaw: -66.38 },
  { frame: 23, roll: 18.24, pitch: -27.56, yaw: -73.84 },
  { frame: 24, roll: 17.48, pitch: -30.58, yaw: -81.2 },
  { frame: 25, roll: 16.68, pitch: -33.29, yaw: -88.57 },
  { frame: 26, roll: 15.83, pitch: -36.15, yaw: -96.0 },
];

export const NUM_FRAMES = TRAJECTORY_DEG.length;

// Temporal window — CubeComposer-3k uses 9 frames per autoregressive
// step, CubeComposer-4k uses 5. We use 9 to match the included asset.
export const WINDOW_LENGTH = 9;

// ---- Face geometry + colour register -----------------------------------

export type CubeFace = "front" | "right" | "left" | "back" | "up" | "down";

export const FACE_ORDER: ReadonlyArray<CubeFace> = [
  "front",
  "right",
  "left",
  "back",
  "up",
  "down",
];

export const FACE_LABELS: Record<CubeFace, string> = {
  front: "Front (input)",
  right: "Right",
  left: "Left",
  back: "Back",
  up: "Up",
  down: "Down",
};

export const FACE_COLOR_ACTIVE: Record<CubeFace, string> = {
  front: "#67e8f9",
  right: "#f9a8d4",
  left: "#c026d3",
  back: "#7c3aed",
  up: "#fbbf24",
  down: "#5eead4",
};

export const FACE_COLOR_DONE = "#3a3a44";
export const FACE_COLOR_PENDING = "#1a1a22";

// Face → position + orientation on a unit cube centred at the origin,
// rendered as a 2x2 plane two units out (so the cube has side length
// 4 — comfortable orbit distance from the inside).
export const CUBE_RADIUS = 2;

export const FACE_TRANSFORMS: Record<
  CubeFace,
  { position: [number, number, number]; rotation: [number, number, number] }
> = {
  // Camera default look direction in three is -Z, so "front" sits at
  // -Z and faces +Z (inward).
  front: { position: [0, 0, -CUBE_RADIUS], rotation: [0, 0, 0] },
  back: { position: [0, 0, CUBE_RADIUS], rotation: [0, Math.PI, 0] },
  right: { position: [CUBE_RADIUS, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  left: { position: [-CUBE_RADIUS, 0, 0], rotation: [0, Math.PI / 2, 0] },
  up: { position: [0, CUBE_RADIUS, 0], rotation: [Math.PI / 2, 0, 0] },
  down: { position: [0, -CUBE_RADIUS, 0], rotation: [-Math.PI / 2, 0, 0] },
};

// Per-face basis vectors used by the projection shader. These describe
// the face's local (u, v, forward) frame in WORLD space — i.e. what
// "right" and "up" mean on each face when the face is rendered with
// BackSide so the visitor inside sees it. Hand-derived from
// FACE_TRANSFORMS; commented to make the next debugger's life easier.
export const FACE_BASIS: Record<
  CubeFace,
  {
    right: [number, number, number];
    up: [number, number, number];
    forward: [number, number, number];
  }
> = {
  // Front face sits at -Z, the visitor looks toward -Z. The face plane
  // is oriented so its +U runs left→right in screen space and +V runs
  // bottom→top. Because we render BackSide, the "outside" forward (i.e.
  // the world ray we want to look up in the equirect) is also -Z.
  // But the FacePanel mirrors U when BackSide — so we flip U here.
  front: { right: [-1, 0, 0], up: [0, 1, 0], forward: [0, 0, -1] },
  back: { right: [1, 0, 0], up: [0, 1, 0], forward: [0, 0, 1] },
  right: { right: [0, 0, 1], up: [0, 1, 0], forward: [1, 0, 0] },
  left: { right: [0, 0, -1], up: [0, 1, 0], forward: [-1, 0, 0] },
  // Top face: looking up, +U world-x, +V world-z (into the back of room).
  up: { right: [-1, 0, 0], up: [0, 0, -1], forward: [0, 1, 0] },
  down: { right: [-1, 0, 0], up: [0, 0, 1], forward: [0, -1, 0] },
};

// ---- Component prop types ----------------------------------------------

export type FrustumProps = {
  frame: number;
  playing: boolean;
  onAdvance: () => void;
};

export type CubeShellProps = {
  faceStatus: Record<CubeFace, "active" | "done" | "pending">;
  equirect: import("three").Texture | null;
};

export type PanoramaState =
  | { status: "idle" }
  | { status: "loading"; prompt: string; startedAt: number }
  | { status: "ready"; url: string; prompt: string; durationMs: number }
  | { status: "error"; message: string };
