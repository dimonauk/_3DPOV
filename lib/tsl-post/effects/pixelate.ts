/**
 * lib/tsl-post/effects/pixelate.ts
 *
 * Square-grid downsample, snapping the frame to N×N blocks. Useful
 * for the low-resolution wireframe-as-cover treatment on the algorithm
 * tiles.
 *
 * XR-safety: SAFE. Pixelation is screen-space and identical per eye.
 * The block grid does anchor to screen-space coordinates so it can
 * feel artificial at a wide FOV, but does not cause comfort issues.
 * Cost is cheap.
 */

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:pixelate");

const DEFAULT_BLOCK = 6;

export const pixelateEffect: TslPostEffect = {
  config: {
    id: "pixelate",
    name: "Pixelate",
    description: "Snap the frame to an N×N block grid.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const block = Math.max(2, Math.round(num(opts, "block", DEFAULT_BLOCK)));
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, block) ?? tryPp(slot, block) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  block: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TSL = require("three/tsl") as typeof import("three/tsl");

    // Quantise UV to block-grid centres. The 1024 here is an assumed
    // viewport; the postprocessing fallback scales by real viewport
    // because PixelationEffect handles its own resolution.
    const size = TSL.vec2(1024, 1024);
    const cells = size.div(block);
    const snapped = TSL.uv()
      .mul(cells)
      .floor()
      .add(TSL.vec2(0.5, 0.5))
      .div(cells);
    const prev = slot.webgpu.node;
    const resampled =
      (prev as unknown as { uv?: (n: unknown) => unknown }).uv?.(snapped) ?? prev;
    slot.webgpu.node = resampled;
    return () => undefined;
  } catch (err) {
    log.debug("tsl pixelate failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  block: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pp = require("postprocessing") as typeof import("postprocessing");
    const pixel = new pp.PixelationEffect(block);
    slot.webgl.addEffect(pixel);
    return () => {
      try {
        pixel.dispose();
      } catch (err) {
        log.debug("pp pixelate dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp pixelate failed", { err: errToObject(err) });
    return null;
  }
}

export default pixelateEffect;
