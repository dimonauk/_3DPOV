/**
 * lib/tsl-post/effects/film-grain.ts
 *
 * Animated per-pixel noise. Breaks up the too-clean read on flat matte
 * materials; pairs well with bloom on dark background plates.
 *
 * XR-safety: SAFE at low intensity. Grain that draws attention to
 * itself (large amplitude, slow temporal frequency) is uncomfortable
 * in a headset because the eye keeps trying to focus on the moving
 * pattern. Default amplitude is 0.025; safe ceiling is 0.05.
 *
 * Reduced motion: amplitude held but temporal animation suppressed so
 * the grain becomes a static dither pattern.
 */

import { mx_noise_float, time, uv as tslUv, vec3 } from "three/tsl";
import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:film-grain");

const DEFAULT_AMPLITUDE = 0.025;
const SAFE_CEILING = 0.05;

export const filmGrainEffect: TslPostEffect = {
  config: {
    id: "film-grain",
    name: "Film grain",
    description:
      "Animated luminance noise — texture on otherwise too-clean plates.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const requested = num(opts, "amplitude", DEFAULT_AMPLITUDE);
    const amp = Math.min(requested, SAFE_CEILING);
    const animate = reducedMotion() ? 0 : 1;

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, amp, animate) ?? tryPp(slot, amp) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  amp: number,
  animate: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const t = time.mul(18 * animate);
    const grain = (
      mx_noise_float(vec3(tslUv().mul(512), t)) as unknown as {
        mul: (n: number) => unknown;
      }
    ).mul(amp);
    const prev = slot.webgpu.node;
    const next = (prev as unknown as { add: (n: unknown) => unknown }).add(grain);
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl grain failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  amp: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const noise = new PP.NoiseEffect({ premultiply: true });
    noise.blendMode.opacity.value = amp * 6;
    slot.webgl.addEffect(noise);
    return () => {
      try {
        noise.dispose();
      } catch (err) {
        log.debug("pp grain dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp grain failed", { err: errToObject(err) });
    return null;
  }
}

export default filmGrainEffect;
