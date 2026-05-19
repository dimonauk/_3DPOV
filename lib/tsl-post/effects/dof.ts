/**
 * lib/tsl-post/effects/dof.ts
 *
 * Depth of field — bokeh blur away from a chosen focus distance.
 *
 * XR-safety: UNSAFE by default. In a flat-screen render, DoF directs
 * the viewer's attention; in stereo, the operator's eyes are already
 * accommodating to the headset's fixed focal plane, and forcing a
 * second software focus on top creates a vergence-accommodation
 * conflict that the literature consistently flags as a fatigue source
 * (Hoffman et al. 2008). The right answer for XR is foveated rendering
 * driven by the eye tracker. Composer skips this in XR.
 *
 * 2D-only by default. Cost band is "expensive".
 */

import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:dof");

const DEFAULT_FOCUS = 6;
const DEFAULT_APERTURE = 0.025;
const DEFAULT_MAX_BLUR = 0.012;

export const dofEffect: TslPostEffect = {
  config: {
    id: "dof",
    name: "Depth of field",
    description:
      "Bokeh blur away from focus — 2D only; XR wants foveation instead.",
    xrSafe: false,
    cost: "expensive",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const focus = num(opts, "focus", DEFAULT_FOCUS);
    const aperture = num(opts, "aperture", DEFAULT_APERTURE);
    const maxBlur = num(opts, "maxBlur", DEFAULT_MAX_BLUR);
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryPp(slot, focus, aperture, maxBlur) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * `postprocessing` ships a battle-tested DepthOfFieldEffect. The TSL
 * `dof()` node has been unstable across the 0.169 → 0.171 window the
 * site sits on, so we use the postprocessing path on both backends —
 * the postprocessing composer only needs `renderer.render` which both
 * backends implement.
 */
function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  focus: number,
  aperture: number,
  maxBlur: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const camera = slot.camera as import("three").PerspectiveCamera;
    const dof = new PP.DepthOfFieldEffect(camera, {
      focusDistance: focus,
      focalLength: aperture,
      bokehScale: maxBlur * 200,
    });
    slot.webgl.addEffect(dof);
    return () => {
      try {
        dof.dispose();
      } catch (err) {
        log.debug("pp dof dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp dof failed", { err: errToObject(err) });
    return null;
  }
}

export default dofEffect;
