/**
 * lib/tsl-post/effects/bitcrush-posterise.ts
 *
 * Hard per-channel colour quantisation. The "broken low-bit LCD" /
 * "memory corruption" aesthetic — pure colour-depth attack, no UV
 * manipulation. Reads completely differently from `glitch-composite`
 * (which is spatial) and `film-grain` / `dither-bayer` (which add
 * stochastic noise on top of full-depth colour).
 *
 * XR-safety: SAFE. Point-wise operation — both eyes see the same
 * quantisation lattice, no stereo divergence.
 *
 * Reduced motion: no temporal component; reduced-motion is a no-op.
 *
 * Cost: cheap. Three floor() / divide operations per pixel.
 */

import { float, vec3 } from "three/tsl";
import * as PP from "postprocessing";
import { Uniform } from "three";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:bitcrush-posterise");

/** Default quantisation levels per channel (3 = 8 colours, 4 = 16, etc.). */
const DEFAULT_LEVELS = 6;

export const bitcrushPosteriseEffect: TslPostEffect = {
  config: {
    id: "bitcrush-posterise",
    name: "Bitcrush / posterise",
    description:
      "Per-channel colour quantisation — broken low-bit LCD mood.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const levels = Math.max(2, Math.floor(num(opts, "levels", DEFAULT_LEVELS)));
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, levels) ?? tryPp(slot, levels) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  levels: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const L = float(levels);
    const prev = slot.webgpu.node;

    // col = floor(col * L) / L  — per-channel hard quantisation.
    const scaled = (prev as unknown as { mul: (n: unknown) => unknown }).mul(L);
    const floored = (scaled as unknown as { floor: () => unknown }).floor();
    const next = (floored as unknown as { div: (n: unknown) => unknown }).div(L);
    slot.webgpu.node = next;

    // Touch vec3 to keep the import live for future tweaks (e.g. a
    // per-channel level vec3). Removes the unused-import warning
    // without a no-op cast at the top.
    void vec3;
    return () => undefined;
  } catch (err) {
    log.debug("tsl bitcrush failed", { err: errToObject(err) });
    return null;
  }
}

/**
 * Custom postprocessing Effect — short fragment that floors the input
 * to N levels. Disposed in the teardown.
 */
const BITCRUSH_FRAG = /* glsl */ `
  uniform float levels;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 q = floor(inputColor.rgb * levels) / levels;
    outputColor = vec4(q, inputColor.a);
  }
`;

class BitcrushEffect extends PP.Effect {
  constructor(levels: number) {
    super("BitcrushEffect", BITCRUSH_FRAG, {
      uniforms: new Map<string, Uniform>([["levels", new Uniform(levels)]]),
    });
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  levels: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const effect = new BitcrushEffect(levels);
    slot.webgl.addEffect(effect);
    return () => {
      try {
        effect.dispose();
      } catch (err) {
        log.debug("pp bitcrush dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp bitcrush failed", { err: errToObject(err) });
    return null;
  }
}

export default bitcrushPosteriseEffect;
