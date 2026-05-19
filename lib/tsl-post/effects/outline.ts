/**
 * lib/tsl-post/effects/outline.ts
 *
 * Outline pass for selected objects — pink-toned silhouette on the
 * meshes pushed into `opts.selection`. Used to call attention to a
 * specific object on the page (a featured product, a diagram callout).
 *
 * XR-safety: SAFE. The outline is depth-clipped and renders into both
 * eyes uniformly. Same caveat as cel-post applies on edge-stability
 * but at lower intensity. Cost is moderate — one extra pass.
 */

import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import { paletteHex } from "../../tsl-materials/palette";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:outline");

const DEFAULT_THICKNESS = 2;
const DEFAULT_STRENGTH = 1.6;

export const outlineEffect: TslPostEffect = {
  config: {
    id: "outline",
    name: "Selection outline",
    description: "Pink silhouette around opts.selection meshes.",
    xrSafe: true,
    cost: "moderate",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const selection = (opts?.["selection"] ?? []) as ReadonlyArray<
      import("three").Object3D
    >;
    const thickness = num(opts, "thickness", DEFAULT_THICKNESS);
    const strength = num(opts, "strength", DEFAULT_STRENGTH);

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryPp(slot, selection, thickness, strength) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  selection: ReadonlyArray<import("three").Object3D>,
  thickness: number,
  strength: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const scene = slot.scene as import("three").Scene;
    const camera = slot.camera as import("three").Camera;

    const kernelOrdinal = Math.max(0, Math.min(5, Math.round(thickness)));
    const outline = new PP.OutlineEffect(scene, camera, {
      edgeStrength: strength,
      pulseSpeed: 0,
      visibleEdgeColor: paletteHex["pink-300"],
      hiddenEdgeColor: paletteHex["lavender-400"],
      // KernelSize is a numeric enum (VERY_SMALL=0…HUGE=5). The cast
      // lets a plain number into the enum-typed slot; the runtime int
      // is the same.
      kernelSize: kernelOrdinal as unknown as PP.KernelSize,
      blur: thickness > 1,
      xRay: false,
    });
    if (selection.length) {
      outline.selection.set(selection as unknown as import("three").Object3D[]);
    }
    slot.webgl.addEffect(outline);
    return () => {
      try {
        outline.dispose();
      } catch (err) {
        log.debug("pp outline dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp outline failed", { err: errToObject(err) });
    return null;
  }
}

export default outlineEffect;
