/**
 * lib/tsl-post/effects/vhs-tracking.ts
 *
 * Analogue-tape aesthetic: horizontal wobble + chroma smear +
 * occasional rolling head-switching band at the bottom of the frame.
 * The "recovered from a degraded VHS" mood.
 *
 * # WebGPU TSL path — approximation
 *
 * Like `wave-warp`, this approximates the true UV-warp by modulating
 * the already-sampled colour. The wobble + head-switch read as
 * intended even without a true resample; chroma smear is faked by
 * tinting along the wobble direction.
 *
 * XR-safety: SAFE per-eye. Uniforms are shared, both eyes get the
 * same wobble. (A true UV-warp version would also be safe.)
 *
 * Reduced motion: temporal advance frozen — the wobble + head-switch
 * stop moving. Pattern still visible.
 *
 * Cost: cheap. ~3 sin/cos + a tint composition.
 */

import { float, sin, time, uv as tslUv, vec3 } from "three/tsl";
import * as PP from "postprocessing";
import { Uniform } from "three";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:vhs-tracking");

const DEFAULT_WOBBLE = 0.6; // 0..1 — wobble strength
const DEFAULT_BAND_INTENSITY = 0.5; // head-switching band strength

export const vhsTrackingEffect: TslPostEffect = {
  config: {
    id: "vhs-tracking",
    name: "VHS tracking",
    description:
      "Horizontal wobble + chroma smear + rolling head-switch band.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const wobble = num(opts, "wobble", DEFAULT_WOBBLE);
    const band = num(opts, "band", DEFAULT_BAND_INTENSITY);
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, wobble, band) ?? tryPp(slot, wobble, band) ?? (() => undefined);
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
  wobble: number,
  band: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const t = reducedMotion() ? float(0) : time;

    // Wobble: high-frequency horizontal sine on uv.y. We can't
    // resample, so we encode the wobble as a horizontal red-blue
    // tint shift whose amplitude scales with the wobble field.
    const wobblePhase = tslUv().y.mul(80).add(t.mul(3));
    const wobbleVal = (sin(wobblePhase) as unknown as { mul: (n: number) => unknown }).mul(
      wobble * 0.05,
    );
    const chromaTint = vec3(wobbleVal, float(0), (wobbleVal as unknown as { mul: (n: number) => unknown }).mul(-1));

    // Head-switching band: a scrolling y-position where the bottom
    // ~5% of the frame gets a luminance lift / desync read.
    const bandY = (sin(t.mul(0.15)) as unknown as { mul: (n: number) => unknown }).mul(0.5);
    const bandCenter = (bandY as unknown as { add: (n: number) => unknown }).add(0.05);
    const bandDist = (
      (tslUv().y as unknown as { sub: (n: unknown) => unknown }).sub(bandCenter) as unknown as {
        abs: () => unknown;
      }
    ).abs();
    const bandMask = (
      (bandDist as unknown as { mul: (n: number) => unknown }).mul(60) as unknown as {
        oneMinus: () => unknown;
      }
    ).oneMinus();
    const bandClamped = (
      bandMask as unknown as { max: (n: unknown) => unknown }
    ).max(float(0));
    const bandLift = (bandClamped as unknown as { mul: (n: number) => unknown }).mul(band * 0.3);
    const bandTint = vec3(bandLift, bandLift, bandLift);

    const prev = slot.webgpu.node;
    const withChroma = (prev as unknown as { add: (n: unknown) => unknown }).add(chromaTint);
    const next = (withChroma as unknown as { add: (n: unknown) => unknown }).add(bandTint);
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl vhs-tracking failed", { err: errToObject(err) });
    return null;
  }
}

/**
 * WebGL fallback — custom Effect with a true UV wobble via sin
 * and a vertical band-lift. Closer to the ideal than the TSL path.
 */
const VHS_FRAG = /* glsl */ `
  uniform float wobble;
  uniform float band;
  uniform float t;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float wob = sin(uv.y * 80.0 + t * 3.0) * wobble * 0.005;
    vec2 warped = clamp(vec2(uv.x + wob, uv.y), 0.0, 1.0);
    vec4 base = texture2D(inputBuffer, warped);

    // Chroma smear: red sampled right, blue sampled left, both small.
    float chromaShift = wobble * 0.003;
    float r = texture2D(inputBuffer, clamp(vec2(uv.x + wob + chromaShift, uv.y), 0.0, 1.0)).r;
    float b = texture2D(inputBuffer, clamp(vec2(uv.x + wob - chromaShift, uv.y), 0.0, 1.0)).b;
    base.rgb = vec3(r, base.g, b);

    // Head-switching band scrolling slowly along y.
    float bandY = sin(t * 0.15) * 0.5 + 0.05;
    float bandMask = max(0.0, 1.0 - abs(uv.y - bandY) * 60.0);
    base.rgb += bandMask * band * 0.3;

    outputColor = base;
  }
`;

class VhsTrackingEffectImpl extends PP.Effect {
  constructor(wobble: number, band: number) {
    super("VhsTrackingEffect", VHS_FRAG, {
      uniforms: new Map<string, Uniform>([
        ["wobble", new Uniform(wobble)],
        ["band", new Uniform(band)],
        ["t", new Uniform(0)],
      ]),
    });
  }
  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number): void {
    const u = this.uniforms.get("t");
    if (u) u.value = (u.value as number) + deltaTime;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  wobble: number,
  band: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const eff = new VhsTrackingEffectImpl(wobble, band);
    slot.webgl.addEffect(eff);
    return () => {
      try {
        eff.dispose();
      } catch (err) {
        log.debug("pp vhs-tracking dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp vhs-tracking failed", { err: errToObject(err) });
    return null;
  }
}

export default vhsTrackingEffect;
