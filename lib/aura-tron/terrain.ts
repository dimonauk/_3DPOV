/**
 * lib/aura-tron/terrain.ts
 *
 * Standalone port of the DollyOS AuraTron landscape constants and CPU-side
 * height sampler. Lifted from
 * `D:\The_Hangar\Dolly_OS\src\components\void\aura-tron-landscape\constants.ts`
 * and stripped of every reference to the Aura store, the VRM rig, and the
 * mood-classifier the original scene was wired into.
 *
 * The grid is fixed (48 × 64 cells) so the shader can bake the dimensions
 * into the GLSL at build time. Anything that wants to sit a separate object
 * on the terrain surface calls `sampleTerrainY(xWorld, zWorld)` — the same
 * routine the GPU vertex shader runs, kept in lock-step via
 * `landscapeTime.slowT`.
 */
export const COLS = 48;
export const ROWS = 64;
export const GW = 240.0;
export const Z_EXTENT = 120.0;
export const Y_BASE = -4.0;
export const Y_SCALE = 3.5;
export const FADE_FRAC = 0.55;

/** Shared CPU-side time ref — read by `sampleTerrainY` to stay in phase. */
export const landscapeTime = { slowT: 0 };

function depthFromCamera(zi: number): number {
  const zWorld = -Z_EXTENT + (zi / ROWS) * Z_EXTENT * 2;
  return Math.abs(zWorld) / Z_EXTENT;
}

function hAtCPU(xi: number, zi: number, slowT: number): number {
  const xn = xi / COLS;
  const dn = depthFromCamera(zi);
  const meander =
    Math.sin(dn * 3.0 + slowT * 0.2) * 0.12 +
    Math.sin(dn * 1.2 + slowT * 0.08 + 1.8) * 0.08;
  const dc = Math.abs(xn - 0.5 + meander) * 2.0;
  const r1 = 0.22 * Math.sin(xi * 0.18 + zi * 0.2 + slowT * 0.35 + 1.3);
  const r2 = 0.1 * Math.sin(xi * 0.42 - zi * 0.32 + slowT * 0.18 + 7.2);
  const r3 = 0.04 * Math.sin(xi * 0.8 + zi * 0.65 + slowT * 0.12 + 3.1);
  let h = -0.6 + 1.2 * dc * dc + (r1 + r2 + r3) * (0.3 + 0.7 * dc);
  const ff = Math.pow(Math.max(0, 1.0 - dn * 1.15), 2.5);
  const mtn =
    0.4 * Math.sin(xi * 0.06 + slowT * 0.04) +
    0.25 * Math.sin(xi * 0.12 + slowT * 0.025 + 130) +
    0.15 * Math.sin(xi * 0.28 + slowT * 0.03 + 70);
  h += Math.max(0, mtn) * ff * (1.8 + 1.2 * dc);
  return h;
}

/** Sample terrain world-Y at any (xWorld, zWorld). */
export function sampleTerrainY(xWorld: number, zWorld: number): number {
  const xi = (xWorld / GW + 0.5) * COLS;
  const zi = ((zWorld + Z_EXTENT) / (Z_EXTENT * 2)) * ROWS;
  const d = depthFromCamera(zi);
  const f = Math.max(
    0,
    d <= FADE_FRAC ? 1.0 : Math.max(0, 1.0 - (d - FADE_FRAC) / (1.0 - FADE_FRAC)),
  );
  const sink = f < 1 ? (1 - f) * 8.0 : 0;
  return Y_BASE + hAtCPU(xi, zi, landscapeTime.slowT) * Y_SCALE - sink;
}

/** Mood vocabulary the demo exposes — the original scene shipped six DollyOS
 * moods (`standard_present`, `thinking`, `clinical_sharp`, `adorable_reprimand`,
 * `system_shower`, `void_working`). Four neutral synonyms is enough for a
 * standalone study; `warm` is the on-brand default. */
export type Mood = "calm" | "alert" | "warm" | "cold";

export type MoodPalette = {
  /** Page-background gradient bottom-stop, RGB 0..255. */
  bgFar: [number, number, number];
  /** Page-background gradient horizon-stop, RGB 0..255. */
  bgNear: [number, number, number];
  /** RGB 0..1 — biased into the wire colours by the vertex shader. */
  tint: [number, number, number];
  /** RGB 0..1 — aurora sweep colour. */
  aurora: [number, number, number];
};

export const MOOD_PALETTE: Record<Mood, MoodPalette> = {
  calm: {
    bgFar: [6, 8, 20],
    bgNear: [22, 28, 60],
    tint: [0.55, 0.78, 1.0],
    aurora: [0.55, 0.85, 1.0],
  },
  alert: {
    bgFar: [18, 4, 22],
    bgNear: [54, 12, 44],
    tint: [1.0, 0.45, 0.78],
    aurora: [1.0, 0.4, 0.7],
  },
  warm: {
    bgFar: [16, 8, 14],
    bgNear: [52, 22, 12],
    tint: [1.0, 0.62, 0.32],
    aurora: [1.0, 0.55, 0.25],
  },
  cold: {
    bgFar: [4, 10, 18],
    bgNear: [10, 30, 46],
    tint: [0.6, 0.95, 0.88],
    aurora: [0.45, 0.85, 0.95],
  },
};

export const DEFAULT_MOOD: Mood = "warm";

export function getMoodPalette(mood: Mood | undefined): MoodPalette {
  const key: Mood = mood ?? DEFAULT_MOOD;
  return MOOD_PALETTE[key];
}
