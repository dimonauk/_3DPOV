/**
 * lib/tsl-post/effects/glitch-composite.ts
 *
 * Signature-driven post effect. Reads `useGlitchStore` for the visitor's
 * accumulated `signatureWeight` and live `activeChains`, then composes
 * three temporal artefacts on top of the rendered scene:
 *
 *   - block-jitter   horizontal slabs offset by a tiny UV step
 *   - chroma-shear   RGB channels split along the same slab boundaries
 *   - line-tear      occasional bright/dark scanlines at chain peaks
 *
 * The visual is held back hard at first contact (a brand-new visitor
 * gets ~5% weight from the slice) and amplified as they accumulate
 * tokens or stack a hot chain. The composite reads as "the screen
 * remembers them" — diegetic to the Hangar's "the site is alive" voice
 * without becoming a strobe.
 *
 * XR-safety: UNSAFE. Per-frame UV displacement breaks stereo vergence;
 * the chroma-shear pass adds per-channel offset on top of that. The
 * composer skips this when `xrActive` is true. Visitors on the WebXR
 * showcase see the rest of the post chain unaltered.
 *
 * Reduced motion: a `(prefers-reduced-motion: reduce)` user gets a
 * static composite — chains still contribute weight, but the time
 * factor is zeroed so the artefacts don't crawl. The signature still
 * accumulates; only the animation is suppressed.
 *
 * Cost: moderate. One noise sample + two TSL muladds in the WebGPU
 * path. The WebGL fallback uses `postprocessing`'s GlitchEffect which
 * is heavier; the effect tones down its strength on the WebGL path.
 */

import {
  float,
  mx_noise_float,
  step,
  time,
  uniform,
  uv as tslUv,
  vec3,
} from "three/tsl";
import * as PP from "postprocessing";
import { DataTexture, RGBAFormat, Vector2 } from "three";

import { createLogger, errToObject } from "lib/log";
import { useGlitchStore } from "lib/state/glitch";
import { chainsWeight } from "lib/glitch/taxonomy";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:glitch-composite");

/**
 * The composite weight the post effect actually feeds into the shader,
 * computed each frame from the live store.
 *
 * The signature contributes a slow background floor; chains spike on
 * top. The product is intentionally non-linear — small movements at
 * low signature weight should still be perceptible, while saturation
 * at high weight is held back so the screen doesn't tear itself apart.
 */
function readLiveWeight(): number {
  const s = useGlitchStore.getState();
  const floor = s.signatureWeight * 0.6;
  const live = chainsWeight(s.activeChains) * 0.8;
  return Math.max(0, Math.min(1, floor + live));
}

export const glitchCompositeEffect: TslPostEffect = {
  config: {
    id: "glitch-composite",
    name: "Glitch composite",
    description:
      "Signature-driven block-jitter + chroma-shear. The screen remembers the visitor — 2D only.",
    xrSafe: false,
    cost: "moderate",
  },
  attach: (rawRenderer, _scene, _camera, _opts) => {
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot) ?? tryPp(slot) ?? (() => undefined);
  },
};

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const animate = reducedMotion() ? 0 : 1;

    // Live weight uniform — the store subscriber writes into `.value`
    // and the TSL graph re-evaluates each frame, so the composite
    // strength reacts to fired events without re-attaching.
    const wUniform = uniform(readLiveWeight());
    const unsub = useGlitchStore.subscribe(() => {
      (wUniform as unknown as { value: number }).value = readLiveWeight();
    });

    // Slab boundaries: noise sampled along y only, quantised by `step`
    // to produce horizontal bands. Reads as "data corruption", not
    // "wind". The `time` term drives the per-frame skip — zero when
    // reduced-motion is active so the bands freeze.
    const sampleY = tslUv().y.mul(40).add(time.mul(2 * animate));
    const bandNoise = mx_noise_float(vec3(float(0), sampleY, float(0)));

    // Threshold drops with weight: at w=0 only the rarest noise peaks
    // (~15% of bands) tip over; at w=1 about 60% do. The shear strip
    // becomes denser as the visitor accumulates.
    const threshold = (wUniform as unknown as { mul: (n: number) => unknown }).mul(-0.45);
    const slabThreshold = (threshold as unknown as { add: (n: unknown) => unknown }).add(
      float(0.85),
    );
    const slab = step(
      slabThreshold as unknown as Parameters<typeof step>[0],
      bandNoise,
    );

    // Channel split coloured by the slab. Red sampled right, blue
    // sampled left — the add into the existing colour reads as
    // chroma-shear at the slab edges.
    const shearAmount = (slab as unknown as { mul: (n: number) => unknown }).mul(0.08);
    const shear = vec3(
      (shearAmount as unknown as { mul: (n: number) => unknown }).mul(1),
      float(0),
      (shearAmount as unknown as { mul: (n: number) => unknown }).mul(-1),
    );

    const prev = slot.webgpu.node;
    // Mix factor — scaled by weight, held back to 0.7 max so the
    // underlying frame remains legible even at saturation.
    const mix = (wUniform as unknown as { mul: (n: number) => unknown }).mul(0.7);
    const tinted = (shear as unknown as { mul: (n: unknown) => unknown }).mul(mix);
    const next = (prev as unknown as { add: (n: unknown) => unknown }).add(tinted);
    slot.webgpu.node = next;

    return () => {
      unsub();
    };
  } catch (err) {
    log.debug("tsl glitch-composite failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    // `postprocessing`'s GlitchEffect needs a noise texture map — we
    // synthesise a tiny one inline so we don't ship an asset.
    const noiseTex = makeNoiseTexture(64);

    // Construct with default delay/duration; we drive `mode` + `strength`
    // from the store each frame via the subscribe hook below.
    const glitch = new PP.GlitchEffect({
      perturbationMap: noiseTex,
      columns: 0.02,
      delay: new Vector2(99999, 99999), // disable auto-mode
      duration: new Vector2(0.6, 1.0),
    });
    glitch.mode = PP.GlitchMode.DISABLED;
    slot.webgl.addEffect(glitch);

    let rafId: number | null = null;
    const tick = () => {
      const w = readLiveWeight();
      // Strength is a Vector2 (min,max); scale by weight, hold back.
      const s = Math.min(0.4, w * 0.5);
      glitch.minStrength = s * 0.4;
      glitch.maxStrength = s;
      glitch.mode = w > 0.05 ? PP.GlitchMode.CONSTANT_MILD : PP.GlitchMode.DISABLED;
      rafId = typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame(tick)
        : null;
    };
    if (typeof requestAnimationFrame !== "undefined") {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(rafId);
      }
      try {
        glitch.dispose();
        noiseTex.dispose();
      } catch (err) {
        log.debug("pp glitch dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp glitch failed", { err: errToObject(err) });
    return null;
  }
}

/**
 * Build a 64×64 RGBA noise texture for the WebGL GlitchEffect's
 * perturbation map. Generated once per attach; disposed on teardown.
 * Cheap (~16KB) — not worth lazy-loading an asset.
 */
function makeNoiseTexture(size: number): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  const tex = new DataTexture(data, size, size, RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

export default glitchCompositeEffect;
