/**
 * lib/tsl-post/effects/paper-grain.ts
 *
 * Static paper-texture overlay — fibres, pulp specks, a faint warm
 * tint. Pairs with `dither-bayer` for a printed-page look on flat
 * editorial surfaces; pairs with `film-grain` for a hybrid
 * print-meets-film read.
 *
 * Noise primitive adapted from Three.js's own examples
 * (https://github.com/mrdoob/three.js/tree/dev/examples — MIT) which
 * use `mx_noise_float` for procedural-texture work in WebGPU samples;
 * the composition here (two octaves + warm tint + low-frequency
 * stain) is studio code.
 *
 * Why this is its own effect and not a knob on `film-grain`:
 *   - Film grain is animated, paper grain is static. Mixing the two
 *     would force one of them to compromise.
 *   - Paper grain tints toward the warm-black axis; film grain is
 *     achromatic luminance noise. Different intent, different colour
 *     model.
 *   - Editorial surfaces (article body, journal entry covers) want
 *     paper grain alone — film grain on a static image reads as
 *     broken-jpeg artefact rather than texture.
 *
 * XR-safety: SAFE at low intensity. Paper grain is screen-anchored
 * and static, so each eye sees the identical pattern — same logic as
 * scan-lines. Cap `intensity` at 0.4 in XR or the warm tint shifts
 * the white point enough to skew the operator's depth cues.
 *
 * Cost: cheap. Two mx_noise_float calls per fragment, one mix.
 */

import { mx_noise_float, uv as tslUv, vec3 } from "three/tsl";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:paper-grain");

const DEFAULT_INTENSITY = 0.18;
const SAFE_CEILING = 0.4;
const DEFAULT_WARMTH = 0.04;

export const paperGrainEffect: TslPostEffect = {
  config: {
    id: "paper-grain",
    name: "Paper grain",
    description:
      "Static paper-fibre overlay with a warm tint — print-page look. Pairs with bayer dither.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const requested = num(opts, "intensity", DEFAULT_INTENSITY);
    const intensity = Math.min(requested, SAFE_CEILING);
    const warmth = num(opts, "warmth", DEFAULT_WARMTH);

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, intensity, warmth) ?? (() => undefined);
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
  warmth: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    // Two-octave noise: coarse for stains, fine for paper fibres. Both
    // sampled at high UV frequency so the pattern reads as texture at
    // any viewport size. No time dimension — paper grain is static.
    const uv = tslUv();
    const fibreCoord = vec3(uv.mul(820), 0);
    const stainCoord = vec3(uv.mul(48), 0);

    const fibre = (mx_noise_float(fibreCoord) as unknown as {
      mul: (n: number) => unknown;
    }).mul(intensity);
    const stain = (mx_noise_float(stainCoord) as unknown as {
      mul: (n: number) => unknown;
    }).mul(intensity * 0.4);

    // Combined achromatic noise — paper fibres feel mostly luminance,
    // with a faint low-frequency stain biasing brightness.
    const grain = (fibre as unknown as { add: (n: unknown) => unknown }).add(stain);

    // Warm-black tint vector — slightly warm in red, neutral green,
    // pulled cool in blue. Same axis as the studio's --color-warm-black
    // tokens. Magnitude is small (`warmth` defaults to 0.04) so the
    // tint never dominates the rendered content.
    const warm = vec3(warmth, warmth * 0.3, -warmth * 0.4);

    const prev = slot.webgpu.node as unknown as {
      add: (n: unknown) => unknown;
    };
    // Apply grain as a small additive offset to each channel, then a
    // tiny warm bias. Subtractive paper-grain (multiplicative dim)
    // looked worse in test — the studio plates are dark enough that
    // additive reads as paper-on-light-background rather than
    // ink-on-dark-background.
    const grained = prev.add(grain);
    const tinted = (grained as unknown as {
      add: (n: unknown) => unknown;
    }).add(warm);
    slot.webgpu.node = tinted;
    return () => undefined;
  } catch (err) {
    log.debug("tsl paper-grain failed", { err: errToObject(err) });
    return null;
  }
}

export default paperGrainEffect;
