/**
 * lib/tsl-post/effects/chromatic-aberration.ts
 *
 * Per-channel UV offset: red sampled inward, blue sampled outward,
 * green at centre. Gives the "old lens" colour fringing on the edges
 * of the frame.
 *
 * XR-safety: UNSAFE. Adds extra per-channel displacement on top of
 * the stereo offset the brain is already trying to fuse, one of the
 * most-cited XR fatigue triggers in the literature (Stanford VHIL
 * 2019). Composer skips this in XR. A low-intensity preset is offered
 * for cinematic 2D stills only.
 */

import { float, uv as tslUv, vec2, vec3 } from "three/tsl";
import * as PP from "postprocessing";
import { Vector2 } from "three";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:chromatic-aberration");

const DEFAULT_OFFSET = 0.0035;
const LOW_INTENSITY_PRESET = 0.0015;

export const chromaticAberrationEffect: TslPostEffect = {
  config: {
    id: "chromatic-aberration",
    name: "Chromatic aberration",
    description:
      "RGB channel split toward the corners — 2D only; breaks stereo vergence in XR.",
    xrSafe: false,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const offset = num(opts, "offset", DEFAULT_OFFSET);
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, offset) ?? tryPp(slot, offset) ?? (() => undefined);
  },
};

export const chromaticAberrationLowPreset = {
  offset: LOW_INTENSITY_PRESET,
} as const;

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  offset: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const dir = tslUv().sub(vec2(0.5, 0.5));
    const mag = dir.length().mul(offset);
    // Approximation: a radial hue tilt rather than a true per-channel
    // resample. True resample needs a second pass sample, which is not
    // exposed cleanly on the texture node we hold here.
    const tint = vec3(mag.mul(80), float(0), mag.mul(-80));

    const prev = slot.webgpu.node;
    const next = (prev as unknown as { add: (n: unknown) => unknown }).add(tint);
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl ca failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  offset: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const ca = new PP.ChromaticAberrationEffect({
      offset: new Vector2(offset, offset),
      radialModulation: true,
      modulationOffset: 0.15,
    });
    slot.webgl.addEffect(ca);
    return () => {
      try {
        ca.dispose();
      } catch (err) {
        log.debug("pp ca dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp ca failed", { err: errToObject(err) });
    return null;
  }
}

export default chromaticAberrationEffect;
