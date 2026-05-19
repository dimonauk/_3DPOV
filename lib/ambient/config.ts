/**
 * lib/ambient/config.ts — palette + sizing presets for the AmbientField.
 *
 * The token hex values mirror app/globals.css. They're duplicated here
 * (rather than re-read from CSS at runtime) because the WebGPU/WebGL
 * renderers want them as Float32 once, not as strings parsed every
 * frame. If you change a colour in globals.css, mirror it here.
 */

export type AmbientDensity = "low" | "medium" | "high";
export type AmbientPalette = "pink" | "mint" | "lavender" | "chrome";

/** Particle counts per density bucket. Kept inside the 16 MB GPU
 *  buffer budget at "high" (15000 * 4 floats * 4 bytes ≈ 240 KB for
 *  positions, same again for velocities and colours — well under). */
export const DENSITY_PRESETS: Record<AmbientDensity, number> = {
  low: 5_000,
  medium: 8_000,
  high: 15_000,
};

/** RGB triplets in 0-1 range. First entry is the "highlight" colour
 *  used at the bright end of each particle; second is the dimmer
 *  trailing colour. Background sits at warm-black-950. */
export const PALETTES: Record<
  AmbientPalette,
  { hi: [number, number, number]; lo: [number, number, number] }
> = {
  pink: {
    hi: hex("#ff9fbf"), // --color-pink-300
    lo: hex("#ffc4d9"), // --color-pink-200, slightly softer
  },
  mint: {
    hi: hex("#76dea6"), // --color-mint-300
    lo: hex("#a8ecc6"), // --color-mint-200
  },
  lavender: {
    hi: hex("#b490ff"), // --color-lavender-300
    lo: hex("#cfb7ff"), // --color-lavender-200
  },
  chrome: {
    hi: hex("#d6dde5"), // --color-chrome-200
    lo: hex("#b5c0cd"), // --color-chrome-300
  },
};

/** Background plate colour (warm-black-950). All renderers clear to
 *  this with low alpha so the page bg shows through. */
export const BACKGROUND_RGB: [number, number, number] = hex("#0c0a12");

/** Intensity 0-1 → exposed alpha at the particle centre. Sub-linear
 *  so 1.0 still reads as "ambient", not "fireworks". */
export function intensityToAlpha(intensity: number): number {
  const clamped = Math.max(0, Math.min(1, intensity));
  return 0.25 + clamped * 0.55; // 0.25 .. 0.80
}

/** Convert "#rrggbb" → [r, g, b] in 0-1. Cheap and parse-once. */
function hex(s: string): [number, number, number] {
  const m = s.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16) / 255,
    parseInt(m.slice(2, 4), 16) / 255,
    parseInt(m.slice(4, 6), 16) / 255,
  ];
}

/** Shared renderer options. Both the WebGPU and WebGL paths consume
 *  this shape and produce the same visible field. */
export type AmbientRendererOptions = {
  density: AmbientDensity;
  palette: AmbientPalette;
  intensity: number;
  interactive: boolean;
  /** Targeted draw rate. 30 on slow networks, 60 otherwise. */
  targetFps: number;
  /** Pre-computed positions + velocities from the worker. The
   *  renderer takes ownership of these typed arrays. */
  positions: Float32Array;
  velocities: Float32Array;
};

/** Decide a sensible fps cap based on the user's network. Cheap
 *  feature-detect; falls back to 60 if `connection` isn't exposed. */
export function pickTargetFps(): number {
  if (typeof navigator === "undefined") return 60;
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string };
  }).connection;
  const et = conn?.effectiveType ?? "";
  if (et === "slow-2g" || et === "2g" || et === "3g") return 30;
  return 60;
}

/** Common shared renderer interface so the component can swap WebGPU
 *  for WebGL without conditional code on its side. */
export interface AmbientRenderer {
  init(canvas: HTMLCanvasElement, opts: AmbientRendererOptions): Promise<void>;
  start(): void;
  stop(): void;
  setMouse(x: number, y: number, active: boolean): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}
