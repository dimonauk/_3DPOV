/**
 * lib/tsl-post/effects/vignette.ts
 *
 * Radial dim toward the frame edges. Useful for focusing a 2D viewer's
 * attention on the centre of the canvas.
 *
 * XR-safety: UNSAFE. A vignette is anchored to the screen, not to the
 * eyes — inside a stereo display it pulls the corners of each eye's
 * frame inward, masking part of the FOV the operator's eye is still
 * trying to fixate. Reports of vertigo and tunnel-vision are common
 * on long sessions. The composer skips this entirely when `xrActive`.
 */

import { smoothstep, uv as tslUv, vec2 } from "three/tsl";
import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:vignette");

const DEFAULT_DARKNESS = 0.45;
const DEFAULT_OFFSET = 0.32;

export const vignetteEffect: TslPostEffect = {
  config: {
    id: "vignette",
    name: "Vignette",
    description: "Radial frame dim — 2D only; breaks stereo comfort in XR.",
    xrSafe: false,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const darkness = num(opts, "darkness", DEFAULT_DARKNESS);
    const offset = num(opts, "offset", DEFAULT_OFFSET);

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, darkness, offset) ??
      tryPp(slot, darkness, offset) ??
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
  darkness: number,
  offset: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const uv = tslUv();
    const d = uv.sub(vec2(0.5, 0.5)).length();
    const vign = (smoothstep(offset, 1.0, d) as unknown as {
      mul: (n: number) => unknown;
    }).mul(darkness);
    const prev = slot.webgpu.node;
    const next = (prev as unknown as { mul: (n: unknown) => unknown }).mul(
      (vign as unknown as { oneMinus: () => unknown }).oneMinus(),
    );
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl vignette failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  darkness: number,
  offset: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const v = new PP.VignetteEffect({ darkness, offset });
    slot.webgl.addEffect(v);
    return () => {
      try {
        v.dispose();
      } catch (err) {
        log.debug("pp vignette dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp vignette failed", { err: errToObject(err) });
    return null;
  }
}

export default vignetteEffect;
