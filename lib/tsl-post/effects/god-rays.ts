/**
 * lib/tsl-post/effects/god-rays.ts
 *
 * Volumetric shafts from a chosen bright source. Reads as crepuscular
 * sun-through-clouds light or a single keylit highlight bleeding into
 * fog.
 *
 * XR-safety: SAFE but expensive. The shafts are screen-space and
 * computed from a projected light source position, so per-eye they
 * land at the right place after each eye's matrix is applied. The
 * cost is the iterative radial blur — at 90Hz on integrated GPUs the
 * pass alone can push the frame above budget.
 */

import * as PP from "postprocessing";
import { Mesh, MeshBasicMaterial, SphereGeometry } from "three";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:god-rays");

const DEFAULT_SAMPLES = 30;
const DEFAULT_DENSITY = 0.92;
const DEFAULT_DECAY = 0.92;
const DEFAULT_WEIGHT = 0.4;

export const godRaysEffect: TslPostEffect = {
  config: {
    id: "god-rays",
    name: "God rays",
    description:
      "Volumetric shafts from a bright source — expensive; expect a budget hit.",
    xrSafe: true,
    cost: "expensive",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const samples = Math.max(8, Math.round(num(opts, "samples", DEFAULT_SAMPLES)));
    const density = num(opts, "density", DEFAULT_DENSITY);
    const decay = num(opts, "decay", DEFAULT_DECAY);
    const weight = num(opts, "weight", DEFAULT_WEIGHT);

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryPp(slot, samples, density, decay, weight) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * GodRays needs a light-source mesh. We build a small unlit sphere at
 * the scene origin so the effect attaches without the caller having
 * to pass one in. Removed in the teardown.
 */
function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  samples: number,
  density: number,
  decay: number,
  weight: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const scene = slot.scene as import("three").Scene;
    const camera = slot.camera as import("three").Camera;

    const placeholder = new Mesh(
      new SphereGeometry(0.5, 16, 16),
      new MeshBasicMaterial({ color: 0xfff5f9 }),
    );
    placeholder.position.set(0, 4, -8);
    scene.add(placeholder);

    const gr = new PP.GodRaysEffect(camera, placeholder, {
      samples,
      density,
      decay,
      weight,
      exposure: 0.6,
      clampMax: 1.0,
    });
    slot.webgl.addEffect(gr);
    return () => {
      try {
        scene.remove(placeholder);
        placeholder.geometry.dispose();
        (placeholder.material as import("three").Material).dispose();
        gr.dispose();
      } catch (err) {
        log.debug("pp god-rays dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp god-rays failed", { err: errToObject(err) });
    return null;
  }
}

export default godRaysEffect;
