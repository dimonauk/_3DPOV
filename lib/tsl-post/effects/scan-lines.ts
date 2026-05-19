/**
 * lib/tsl-post/effects/scan-lines.ts
 *
 * Horizontal CRT-style scanline overlay. The "CRT recovered footage"
 * read used on journal entries about analogue capture, and a cheap
 * way to age a too-clean render.
 *
 * XR-safety: SAFE at low intensity. Scanlines are screen-anchored so
 * they read as a fixed pattern in front of the scene — the eye treats
 * them as a screen artefact and ignores them. Cost is cheap.
 *
 * Reduced motion: density is fixed (not time-modulated) by default.
 */

import { sin, uv as tslUv } from "three/tsl";
import * as PP from "postprocessing";

import { createLogger, errToObject } from "lib/log";

import { __getActiveSlot } from "../composer";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:scan-lines");

const DEFAULT_DENSITY = 1.5;
const DEFAULT_OPACITY = 0.25;

export const scanLinesEffect: TslPostEffect = {
  config: {
    id: "scan-lines",
    name: "Scan lines",
    description: "CRT scanlines overlaid on the rendered frame.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, _scene, _camera, opts) => {
    const density = num(opts, "density", DEFAULT_DENSITY);
    const opacity = num(opts, "opacity", DEFAULT_OPACITY);
    const slot = __getActiveSlot(rawRenderer);
    if (!slot) return () => undefined;
    return tryTsl(slot, density, opacity) ??
      tryPp(slot, density, opacity) ??
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
  density: number,
  opacity: number,
): (() => void) | null {
  if (!slot.webgpu) return null;
  try {
    const lines = sin(tslUv().y.mul(density * 600)).mul(0.5).add(0.5);
    const dark = (lines as unknown as { mul: (n: number) => unknown }).mul(opacity);
    const prev = slot.webgpu.node;
    const next = (prev as unknown as { mul: (n: unknown) => unknown }).mul(
      (dark as unknown as { oneMinus: () => unknown }).oneMinus(),
    );
    slot.webgpu.node = next;
    return () => undefined;
  } catch (err) {
    log.debug("tsl scan-lines failed", { err: errToObject(err) });
    return null;
  }
}

function tryPp(
  slot: ReturnType<typeof __getActiveSlot> & object,
  density: number,
  opacity: number,
): (() => void) | null {
  if (!slot.webgl) return null;
  try {
    const scan = new PP.ScanlineEffect({ density });
    scan.blendMode.opacity.value = opacity;
    slot.webgl.addEffect(scan);
    return () => {
      try {
        scan.dispose();
      } catch (err) {
        log.debug("pp scan-lines dispose threw", { err: errToObject(err) });
      }
    };
  } catch (err) {
    log.debug("pp scan-lines failed", { err: errToObject(err) });
    return null;
  }
}

export default scanLinesEffect;
