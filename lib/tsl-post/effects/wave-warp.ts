/**
 * lib/tsl-post/effects/wave-warp.ts
 *
 * Continuous organic distortion — the "latent drift / heat haze"
 * mood. Reads as if the image is printed on slow-flowing water.
 *
 * # WebGPU TSL path — approximation, not a true warp
 *
 * A true wave-warp resamples the source texture at a noise-displaced
 * UV. The current composer hands each effect the already-sampled
 * colour node (see `composer.ts`), not the source PassTextureNode, so
 * true UV resampling isn't available here. We approximate the visual
 * by modulating the existing colour with a noise-driven hue shift and
 * a wave-shaped luminance ripple — the eye reads this as soft motion.
 *
 * If you need a pixel-accurate warp, lift this effect's TSL path to
 * sample the source pass node directly (requires composer-side change
 * — add `slot.webgpu.sampleAtUv(uvNode)` and re-bind in this file).
 *
 * XR-safety: SAFE. The modulation is point-wise after the eye-sample,
 * uniforms are shared, so both eyes warp identically. (A true UV-warp
 * version would also be safe as long as the displacement noise is
 * seeded identically per eye.)
 *
 * Reduced motion: temporal frequency drops to zero — the warp pattern
 * freezes in place rather than flowing. The pattern remains visible
 * because amplitude is unaffected.
 *
 * Cost: moderate. 2× noise samples per pixel + a couple of muladds.
 */

import { float, mx_noise_float, time, uv as tslUv, vec3 } from "three/tsl";
import * as PP from "postprocessing";
import { Uniform } from "three";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:wave-warp");

const DEFAULT_AMPLITUDE = 0.12; // 0..1 — strength of the ripple
const DEFAULT_FREQUENCY = 4.0; // spatial noise scale
const DEFAULT_SPEED = 0.4; // temporal advance

export const waveWarpEffect: TslPostEffect = {
  config: {
    id: "wave-warp",
    name: "Wave warp",
    description:
      "Slow organic distortion — heat haze / latent drift.",
    xrSafe: true,
    cost: "moderate",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const amp = num(opts, "amplitude", DEFAULT_AMPLITUDE);
    const freq = num(opts, "frequency", DEFAULT_FREQUENCY);
    const speed = num(opts, "speed", DEFAULT_SPEED);
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, amp, freq, speed) ?? tryPp(slot, amp, freq, speed) ?? (() => undefined);
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
  freq: number,
  speed: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const t = reducedMotion() ? float(0) : time.mul(speed);

    // Two decorrelated noise samples form a 2-D "warp field". We then
    // combine into a single luminance modulation that reads as motion.
    const u = tslUv().mul(freq);
    const nx = mx_noise_float(vec3(u.x, u.y, t));
    const ny = mx_noise_float(vec3(u.y.add(7.31), u.x.add(13.7), t));

    // Ripple = (nx + ny) gives a smooth -1..1 field. Multiply by amp
    // to get a small luminance shift; convert to a 3-channel tint so
    // additive composition stays neutral on average.
    const ripple = (nx as unknown as { add: (n: unknown) => unknown }).add(ny);
    const lift = (ripple as unknown as { mul: (n: number) => unknown }).mul(amp * 0.4);
    const tint = vec3(lift, lift, lift);

    const prev = slot.webgpu.node;
    const next = (prev as unknown as { add: (n: unknown) => unknown }).add(tint);
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl wave-warp failed", { err: errToObject(err) });
    return null;
  }
}

/**
 * WebGL fallback — custom Effect doing a true UV warp via two sine
 * lookups. WebGL's `Effect.mainImage` signature DOES give us `uv`
 * cleanly for resampling (unlike the WebGPU composer slot), so this
 * fallback is actually closer to the "ideal" effect than the TSL path.
 */
const WAVE_FRAG = /* glsl */ `
  uniform float amplitude;
  uniform float frequency;
  uniform float speed;
  uniform float t;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float dx = sin((uv.y * frequency) + t * speed * 6.283) * amplitude * 0.04;
    float dy = cos((uv.x * frequency * 1.3) + t * speed * 6.283 * 0.7) * amplitude * 0.04;
    vec2 warped = clamp(uv + vec2(dx, dy), 0.0, 1.0);
    outputColor = texture2D(inputBuffer, warped);
  }
`;

class WaveWarpEffect extends PP.Effect {
  constructor(amp: number, freq: number, speed: number) {
    super("WaveWarpEffect", WAVE_FRAG, {
      uniforms: new Map<string, Uniform>([
        ["amplitude", new Uniform(amp)],
        ["frequency", new Uniform(freq)],
        ["speed", new Uniform(speed)],
        ["t", new Uniform(0)],
      ]),
    });
  }
  // postprocessing calls update() each frame with the elapsed time.
  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number): void {
    const u = this.uniforms.get("t");
    if (u) u.value = (u.value as number) + deltaTime;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  amp: number,
  freq: number,
  speed: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const eff = new WaveWarpEffect(amp, freq, speed);
    slot.webgl.addEffect(eff);
    return () => {
      try {
        eff.dispose();
      } catch (err) {
        log.debug("pp wave-warp dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp wave-warp failed", { err: errToObject(err) });
    return null;
  }
}

export default waveWarpEffect;
