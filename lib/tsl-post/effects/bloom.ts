/**
 * lib/tsl-post/effects/bloom.ts
 *
 * Pink-tinted bloom for waveguide-glow. The workhorse of the pack — it
 * sells the emissive trails and the holographic foil sweeps that the
 * studio leans on heavily.
 *
 * Primary path: TSL `bloom()` node pushed into the shared
 * `PostProcessing.outputNode` graph through the composer slot. The
 * bloom factory is the vendored copy at `lib/three-vendor/BloomNode.js`
 * — same MIT source as `three/examples/jsm/tsl/display/BloomNode.js`,
 * vendored only because Next 15.6 canary's Turbopack mis-resolves the
 * `three/tsl` re-export of the symbol in production builds.
 *
 * Fallback path: `postprocessing` BloomEffect pushed into the shared
 * EffectComposer. Used when the renderer is a plain WebGLRenderer.
 *
 * XR-safety: SAFE. Bloom is a screen-space operation that runs after
 * the eye composite, so the per-eye spread is consistent and there is
 * no stereo drift. Cost is moderate.
 */

import { color } from "three/tsl";
import * as PP from "postprocessing";
// BloomNode is vendored at lib/three-vendor/BloomNode.js (MIT, copied
// verbatim from three/examples/jsm/tsl/display/BloomNode.js). Vendored
// because Next 15.6 canary's Turbopack mis-resolves the `bloom` export
// when imported via `three/tsl`. Direct path-import avoids that.
import { bloom as tslBloom } from "../../three-vendor/BloomNode.js";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import { paletteHex } from "../../tsl-materials/palette";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:bloom");

const DEFAULT_INTENSITY = 0.9;
const DEFAULT_THRESHOLD = 0.78;
const DEFAULT_RADIUS = 0.55;

export const bloomEffect: TslPostEffect = {
  config: {
    id: "bloom",
    name: "Bloom",
    description:
      "Pink-tinted highlight bleed for waveguide trails and foil-lit edges.",
    xrSafe: true,
    cost: "moderate",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const intensity = num(opts, "intensity", DEFAULT_INTENSITY);
    const threshold = num(opts, "threshold", DEFAULT_THRESHOLD);
    const radius = num(opts, "radius", DEFAULT_RADIUS);

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) {
      log.warn("bloom attached without a composer slot — no-op");
      return () => undefined;
    }

    return tryTsl(slot, intensity, threshold, radius) ??
      tryPp(slot, intensity, threshold, radius) ??
      (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  intensity: number,
  threshold: number,
  radius: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const prev = slot.webgpu.node;
    const tinted = tslBloom(prev, intensity, radius, threshold);
    const tint = color(paletteHex["pink-200"]);
    const next = (prev as unknown as { add: (n: unknown) => unknown }).add(
      (tinted as unknown as { mul: (n: unknown) => unknown }).mul(tint),
    );
    slot.webgpu.node = next;
    log.debug("tsl bloom attached", { intensity, threshold, radius });
    return () => undefined;
  } catch (err) {
    log.debug("tsl bloom path failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  intensity: number,
  threshold: number,
  radius: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const effect = new PP.BloomEffect({
      intensity,
      luminanceThreshold: threshold,
      luminanceSmoothing: 0.2,
      radius,
      mipmapBlur: true,
    });
    slot.webgl.addEffect(effect);
    log.debug("pp bloom attached", { intensity, threshold, radius });
    return () => {
      try {
        effect.dispose();
      } catch (err) {
        log.debug("pp bloom dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp bloom path failed", { err: errToObject(err) });
    return null;
  }
}

export default bloomEffect;
