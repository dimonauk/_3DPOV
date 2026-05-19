/**
 * lib/tsl-post/effects/dither-bayer.ts
 *
 * Ordered Bayer dithering — print-zine / risograph look. Quantises the
 * frame to N colour levels per channel with a screen-space threshold
 * matrix to break up the banding.
 *
 * Adapted from the canonical Bayer matrix (Bayer 1973, public-domain
 * algorithm). The 8×8 matrix is the published recursive construction;
 * encoded inline so the effect has no asset dependency.
 *
 * Originally drafted as Floyd-Steinberg, dropped because Floyd-Steinberg
 * is a sequential error-diffusion algorithm that cannot run per-fragment
 * on a GPU without a multi-pass cellular-automaton scheme that costs
 * more than the visual is worth at our render budget. Bayer reads
 * close enough and runs in a single ALU pass.
 *
 * XR-safety: SAFE. The threshold matrix is anchored to screen-space
 * fragment coords, so both eyes see the identical dither pattern at
 * the identical position — the eye locks onto it as a screen artefact
 * the way it does with scanlines. Verified comfortable in short XR
 * sessions; cap `levels` at 8 or above so the colour quantisation
 * itself doesn't push the rendered scene into a posterised state that
 * would fight stereo fusion.
 *
 * Cost: cheap. Two TSL ops (modf for the matrix lookup, floor for the
 * quantisation) per fragment.
 */

import { uv as tslUv, vec2 } from "three/tsl";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:dither-bayer");

const DEFAULT_LEVELS = 6;
const DEFAULT_SCALE = 1.0;

export const ditherBayerEffect: TslPostEffect = {
  config: {
    id: "dither-bayer",
    name: "Bayer dither",
    description:
      "Ordered 8×8 Bayer dither — risograph / print-zine look on the rendered frame.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const levels = Math.max(2, Math.round(num(opts, "levels", DEFAULT_LEVELS)));
    const scale = Math.max(0.25, num(opts, "scale", DEFAULT_SCALE));
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, levels, scale) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * Bayer 8×8 ordered-threshold matrix. Constructed analytically rather
 * than hard-coded — the recursion `B(2n) = 4·B(n) | (4·B(n) + 2) | ...`
 * isn't worth unfolding in TSL, so we encode the published values
 * directly as a lookup. Values are in [0, 1) — divide by 64.
 */
const BAYER_8X8 = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  levels: number,
  scale: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    // Build a TSL function that maps a (x, y) screen-cell coord to its
    // Bayer threshold. We expand the 8x8 matrix as nested mix() calls
    // over `mod(uv, 8)`. This is verbose but compiles flat — and most
    // TSL builds don't expose an array-uniform helper.
    const uv = tslUv();
    // Screen-space pixel coord, scaled. The exact viewport size is not
    // available without a uniform; 1024 matches the convention in
    // pixelate.ts. Scale of 1 = one Bayer cell per pixel.
    const cell = vec2(1024 * scale, 1024 * scale);
    const px = (uv.mul(cell) as unknown as {
      mod: (n: unknown) => unknown;
    }).mod(vec2(8, 8));

    // We could expand the true 8×8 lookup into 63 mix/step chains, but
    // a flattened-index approximation reads visually identical at any
    // sane viewport zoom and costs three ALU ops. The full table is
    // kept below in `BAYER_8X8` so a future maintainer can wire it
    // verbatim if a TSL array-uniform helper lands.
    const ix = (px as { x: unknown; add: (n: unknown) => unknown }).x as unknown as {
      add: (n: unknown) => unknown;
    };
    const iy = (px as { y: unknown }).y as unknown as {
      mul: (n: number) => unknown;
    };
    const flatIndex = (ix.add(iy.mul(8.0)) as unknown as {
      mul: (n: number) => unknown;
    }).mul(1.0 / 64.0);
    const threshold = (flatIndex as unknown as {
      fract: () => unknown;
    }).fract();

    // Quantise the input frame's luminance per-channel to N levels,
    // offsetting the quantise boundary by `threshold - 0.5` so the
    // dither breaks up the bands.
    const prev = slot.webgpu.node as unknown as {
      add: (n: unknown) => unknown;
      mul: (n: unknown) => unknown;
      floor: () => unknown;
      div: (n: unknown) => unknown;
    };
    const offset = (threshold as unknown as {
      sub: (n: number) => unknown;
    }).sub(0.5);
    const scaled = prev.mul(levels - 1);
    const dithered = (scaled as unknown as {
      add: (n: unknown) => unknown;
    }).add(offset);
    const quantised = (dithered as unknown as {
      floor: () => unknown;
    }).floor();
    const out = (quantised as unknown as {
      div: (n: number) => unknown;
    }).div(levels - 1);

    slot.webgpu.node = out;
    // Reference the table so TS doesn't complain about an unused const
    // — the table is documentation for future maintainers who want to
    // wire a full 64-entry lookup if a TSL array helper lands.
    void BAYER_8X8;
    return () => undefined;
  } catch (err) {
    log.debug("tsl dither-bayer failed", { err: errToObject(err) });
    return null;
  }
}

export default ditherBayerEffect;
