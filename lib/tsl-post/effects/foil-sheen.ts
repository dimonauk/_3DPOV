/**
 * lib/tsl-post/effects/foil-sheen.ts
 *
 * Full-scene gradient sweep that mirrors the `.lux-foil` CSS class —
 * pink-200 → mint-200 → lavender-200 angled across the frame, slow
 * sinusoidal sweep. Reads as a holographic foil layer at low intensity.
 *
 * XR-safety: SAFE. The sweep is screen-space and identical per eye —
 * the gradient is computed from `uv` directly, so both eyes see the
 * same colour at the same screen position. Cost is cheap: three mixes
 * plus a sin().
 *
 * Reduced motion: when `prefers-reduced-motion: reduce` is set, the
 * sweep freezes at midpoint (the most readable position) rather than
 * playing. Same policy as `.lux-foil`.
 */

import { color, mix, sin, step, time, uv as tslUv, vec2 } from "three/tsl";
import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import { paletteHex } from "../../tsl-materials/palette";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:foil-sheen");

const DEFAULT_INTENSITY = 0.18;
const DEFAULT_SPEED = 0.11;
const DEFAULT_ANGLE = 100; // degrees, matches .lux-foil

export const foilSheenEffect: TslPostEffect = {
  config: {
    id: "foil-sheen",
    name: "Foil sheen",
    description:
      "Slow tri-tone gradient sweep across the frame — the .lux-foil holographic layer.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const intensity = num(opts, "intensity", DEFAULT_INTENSITY);
    const speed = reducedMotion() ? 0 : num(opts, "speed", DEFAULT_SPEED);
    const angle = num(opts, "angle", DEFAULT_ANGLE);

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, intensity, speed, angle) ??
      tryPp(slot, intensity) ??
      (() => undefined);
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
  intensity: number,
  speed: number,
  angleDeg: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const a = (angleDeg * Math.PI) / 180;
    const dir = vec2(Math.cos(a), Math.sin(a));
    const projected = tslUv()
      .sub(vec2(0.5, 0.5))
      .dot(dir)
      .add(time.mul(speed));
    const t = sin(projected.mul(Math.PI * 2)).mul(0.5).add(0.5);

    const cPink = color(paletteHex["pink-200"]);
    const cMint = color(paletteHex["mint-200"]);
    const cLav = color(paletteHex["lavender-200"]);
    const lower = mix(cPink, cMint, t.mul(2).clamp(0, 1));
    const upper = mix(cMint, cLav, t.sub(0.5).mul(2).clamp(0, 1));
    const sweep = mix(lower, upper, step(0.5, t));

    const prev = slot.webgpu.node;
    const next = (prev as unknown as { add: (n: unknown) => unknown }).add(
      (sweep as unknown as { mul: (n: unknown) => unknown }).mul(intensity),
    );
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl foil-sheen failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  intensity: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    // Approximation in WebGL — a low-intensity NoiseEffect overlay.
    // Documented in TSL-POST.md as an honest substitute.
    const noise = new PP.NoiseEffect({
      premultiply: true,
      blendFunction: PP.BlendFunction.OVERLAY,
    });
    noise.blendMode.opacity.value = intensity;
    slot.webgl.addEffect(noise);
    return () => {
      try {
        noise.dispose();
      } catch (err) {
        log.debug("pp foil-sheen dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp foil-sheen failed", { err: errToObject(err) });
    return null;
  }
}

export default foilSheenEffect;
