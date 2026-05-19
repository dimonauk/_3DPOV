/**
 * lib/tsl-post/effects/cel-post.ts
 *
 * Posterise + Sobel edge outline. The cel-shading look used on the
 * low-poly VRM articles — colours quantised into 4 bands, a thin dark
 * outline drawn where the depth/luma gradient is steep.
 *
 * XR-safety: CAVEATED. The Sobel kernel reads neighbouring pixels in
 * screen space; in stereo, the outlines on near objects drift between
 * eyes by a few pixels because of parallax. Most users do not notice
 * but a minority report eye strain. Marked xrSafe `true` because the
 * failure mode is comfort-band rather than dangerous (no vection, no
 * vergence conflict). The UI shows a "CAVEAT" tone.
 */

import { dFdx, dFdy, smoothstep, vec3 } from "three/tsl";
import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:cel-post");

const DEFAULT_BANDS = 4;
const DEFAULT_EDGE = 0.6;

export const celPostEffect: TslPostEffect = {
  config: {
    id: "cel-post",
    name: "Cel post",
    description:
      "Posterise to a handful of bands with a Sobel-edge outline — VRM cel look.",
    xrSafe: true,
    cost: "moderate",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const bands = Math.max(2, Math.round(num(opts, "bands", DEFAULT_BANDS)));
    const edge = num(opts, "edge", DEFAULT_EDGE);

    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, bands, edge) ?? tryPp(slot) ?? (() => undefined);
  },
};

function num(opts: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!opts) return fallback;
  const v = opts[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function tryTsl(
  slot: ReturnType<typeof __getActiveSlot> & object,
  bands: number,
  edge: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const prev = slot.webgpu.node;
    // Posterise: floor(c * bands) / (bands - 1).
    const quant = (prev as unknown as { mul: (n: number) => unknown }).mul(bands);
    const stepped = ((quant as unknown as { floor: () => unknown }).floor() as unknown as {
      div: (n: number) => unknown;
    }).div(bands - 1);

    // Luma + Sobel approximation via dFdx/dFdy on luminance. TSL's
    // node types are erased through the `unknown` casts the rest of
    // this file uses, so the imported helpers need matching loose
    // signatures to take our intermediate nodes.
    const tslDFdx = dFdx as unknown as (n: unknown) => unknown;
    const tslDFdy = dFdy as unknown as (n: unknown) => unknown;
    const tslSmoothstep = smoothstep as unknown as (
      a: number,
      b: number,
      n: unknown,
    ) => { mul: (n: number) => unknown };
    const luma = (prev as unknown as { rgb: { dot: (n: unknown) => unknown } }).rgb.dot(
      vec3(0.299, 0.587, 0.114),
    );
    let outNode: unknown = stepped;
    try {
      const gx = tslDFdx(luma);
      const gy = tslDFdy(luma);
      const sqx = (gx as unknown as { mul: (n: unknown) => unknown }).mul(gx);
      const sqy = (gy as unknown as { mul: (n: unknown) => unknown }).mul(gy);
      const grad = ((sqx as unknown as { add: (n: unknown) => unknown }).add(sqy) as unknown as {
        sqrt: () => unknown;
      }).sqrt();
      const mask = tslSmoothstep(0.02, 0.08, grad).mul(edge);
      outNode = (stepped as unknown as { mul: (n: unknown) => unknown }).mul(
        (mask as unknown as { oneMinus: () => unknown }).oneMinus(),
      );
    } catch (err) {
      // dFdx/dFdy not present on this TSL build — drop the outline and
      // keep the posterise term.
      log.debug("cel-post sobel unavailable", { err: errToObject(err) });
    }

    slot.webgpu.node = outNode;
    return () => undefined;
  } catch (err) {
    log.debug("tsl cel-post failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(slot: ReturnType<typeof __getActiveSlot> & object): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    // No first-class posterise. We approximate with a light scanline.
    const scan = new PP.ScanlineEffect({ density: 0.9 });
    scan.blendMode.opacity.value = 0.18;
    slot.webgl.addEffect(scan);
    return () => {
      try {
        scan.dispose();
      } catch (err) {
        log.debug("pp cel-post dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp cel-post failed", { err: errToObject(err) });
    return null;
  }
}

export default celPostEffect;
