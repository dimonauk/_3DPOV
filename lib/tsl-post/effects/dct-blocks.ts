/**
 * lib/tsl-post/effects/dct-blocks.ts
 *
 * JPEG/MPEG macroblock-corruption aesthetic. The image is read as if
 * a frame from a damaged-DCT decoder: 8×8 blocks (or whatever size
 * the operator picks), each with a per-block DC offset that swaps
 * the block's average colour. Reads as "the JPEG decoder gave up".
 *
 * # WebGPU TSL path — approximation
 *
 * The full effect would resample at a block-quantised UV; we don't
 * have that without composer changes. Instead we tint the existing
 * colour by a hash-driven per-block offset. The grid pattern reads
 * even without true block-sampling — the edges between blocks are
 * sharp colour discontinuities because adjacent blocks have
 * uncorrelated hash offsets.
 *
 * XR-safety: SAFE. The block grid + hash are deterministic on UV
 * and uniforms, so both eyes see the same lattice.
 *
 * Reduced motion: cycle frequency goes to zero — the per-block
 * offset stops changing. Pattern still visible.
 *
 * Cost: cheap. One floor() + one hash() + one mix per pixel.
 */

import { float, time, uv as tslUv, vec3 } from "three/tsl";
import * as PP from "postprocessing";
import { Uniform, Vector2 } from "three";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:dct-blocks");

const DEFAULT_BLOCK_PX = 8; // classic JPEG block size
const DEFAULT_INTENSITY = 0.25; // 0..1 — strength of the hash tint
const DEFAULT_CHURN_HZ = 0.25; // how often blocks shuffle their offset

export const dctBlocksEffect: TslPostEffect = {
  config: {
    id: "dct-blocks",
    name: "DCT blocks",
    description:
      "8×8 macroblock corruption — JPEG decoder gave up.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const blockPx = Math.max(2, Math.floor(num(opts, "blockPx", DEFAULT_BLOCK_PX)));
    const intensity = num(opts, "intensity", DEFAULT_INTENSITY);
    const churn = num(opts, "churn", DEFAULT_CHURN_HZ);
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, blockPx, intensity, churn)
      ?? tryPp(slot, blockPx, intensity, churn)
      ?? (() => undefined);
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

/**
 * Cheap deterministic-but-chaotic 2-D hash in TSL primitives.
 * Standard fract(sin(dot)) pattern — not a real PRNG but good enough
 * for visual chaos. Returns a vec3 in [-0.5, 0.5].
 */
function hashTint(
  blockX: unknown,
  blockY: unknown,
  cycle: unknown,
): unknown {
  // dot(blockId, vec2(12.9898, 78.233)) + cycle * 43758
  const k1 = (blockX as unknown as { mul: (n: number) => unknown }).mul(12.9898);
  const k2 = (blockY as unknown as { mul: (n: number) => unknown }).mul(78.233);
  const seed = (
    (k1 as unknown as { add: (n: unknown) => unknown }).add(k2) as unknown as {
      add: (n: unknown) => unknown;
    }
  ).add(cycle as unknown as { mul: (n: number) => unknown });

  // Channel-decorrelated: shift the seed for g and b.
  const r = (
    (seed as unknown as { sin: () => unknown }).sin() as unknown as {
      mul: (n: number) => unknown;
    }
  ).mul(43758.5453);
  const g = (
    ((seed as unknown as { add: (n: number) => unknown }).add(17.0) as unknown as {
      sin: () => unknown;
    }).sin() as unknown as { mul: (n: number) => unknown }
  ).mul(43758.5453);
  const b = (
    ((seed as unknown as { add: (n: number) => unknown }).add(31.0) as unknown as {
      sin: () => unknown;
    }).sin() as unknown as { mul: (n: number) => unknown }
  ).mul(43758.5453);

  const fract = (n: unknown) =>
    (n as unknown as { sub: (m: unknown) => unknown }).sub(
      (n as unknown as { floor: () => unknown }).floor(),
    );
  const f = (n: unknown) =>
    (fract(n) as unknown as { sub: (m: number) => unknown }).sub(0.5);

  return vec3(f(r), f(g), f(b));
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  blockPx: number,
  intensity: number,
  churn: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    // We don't know the framebuffer size at attach time without
    // touching the renderer; approximate with a fixed reference of
    // 1920×1080 so blockPx feels right at common resolutions. A
    // future API addition could swap this for a real `resolution`
    // uniform driven by the composer.
    const refW = 1920;
    const refH = 1080;
    const blocksX = refW / blockPx;
    const blocksY = refH / blockPx;

    const blockUv = tslUv().mul(vec3(float(blocksX), float(blocksY), float(0)));
    const blockX = (blockUv.x as unknown as { floor: () => unknown }).floor();
    const blockY = (blockUv.y as unknown as { floor: () => unknown }).floor();

    const cycle = reducedMotion()
      ? float(0)
      : (time.mul(churn) as unknown as { floor: () => unknown }).floor();

    const tint = hashTint(blockX, blockY, cycle);
    const scaled = (tint as unknown as { mul: (n: number) => unknown }).mul(intensity);

    const prev = slot.webgpu.node;
    const next = (prev as unknown as { add: (n: unknown) => unknown }).add(scaled);
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl dct-blocks failed", { err: errToObject(err) });
    return null;
  }
}

/**
 * WebGL fallback — custom Effect doing the same block-hash tint with
 * a true grid resolution from the input buffer size.
 */
const DCT_FRAG = /* glsl */ `
  uniform float blockPx;
  uniform float intensity;
  uniform float churn;
  uniform float t;
  uniform vec2 resolution;

  vec3 hash3(vec2 p, float c) {
    float s = dot(p, vec2(12.9898, 78.233)) + c * 43758.0;
    return fract(sin(vec3(s, s + 17.0, s + 31.0)) * 43758.5453) - 0.5;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 pixel = uv * resolution;
    vec2 block = floor(pixel / blockPx);
    float cycle = floor(t * churn);
    vec3 tint = hash3(block, cycle) * intensity;
    outputColor = vec4(inputColor.rgb + tint, inputColor.a);
  }
`;

class DctBlocksEffectImpl extends PP.Effect {
  constructor(blockPx: number, intensity: number, churn: number) {
    super("DctBlocksEffect", DCT_FRAG, {
      uniforms: new Map<string, Uniform>([
        ["blockPx", new Uniform(blockPx)],
        ["intensity", new Uniform(intensity)],
        ["churn", new Uniform(churn)],
        ["t", new Uniform(0)],
        ["resolution", new Uniform(new Vector2(1920, 1080))],
      ]),
    });
  }
  update(renderer: unknown, _inputBuffer: unknown, deltaTime: number): void {
    const u = this.uniforms.get("t");
    if (u) u.value = (u.value as number) + deltaTime;

    // Pull current drawing buffer size from the renderer when available.
    const r = renderer as { getDrawingBufferSize?: (target: Vector2) => Vector2 };
    const res = this.uniforms.get("resolution");
    if (res && r.getDrawingBufferSize) {
      r.getDrawingBufferSize(res.value as Vector2);
    }
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  blockPx: number,
  intensity: number,
  churn: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const eff = new DctBlocksEffectImpl(blockPx, intensity, churn);
    slot.webgl.addEffect(eff);
    return () => {
      try {
        eff.dispose();
      } catch (err) {
        log.debug("pp dct-blocks dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp dct-blocks failed", { err: errToObject(err) });
    return null;
  }
}

export default dctBlocksEffect;
