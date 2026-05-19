/**
 * lib/tsl-materials/internal.ts — Shared loaders for the preset files.
 *
 * Each preset wants the same two surfaces (three for the colour
 * primitives, three/webgpu for the NodeMaterial ctors) and the same
 * graceful fallback when the WebGPU surface is absent. Centralising
 * the lookup here keeps each preset file under the 200-line budget
 * and means there's one place to thread a future migration through.
 *
 * Sync (not async) by design — TSL presets are typically called from
 * scene setup code that already imported `three/webgpu`, so the
 * require() resolution is a hot-cache hit. The presets that need
 * lazier loading wrap their own dynamic import.
 */

import type { PaletteToken } from "./palette";
import { paletteHex } from "./palette";

/**
 * Resolve a NodeMaterial ctor from three/webgpu. Returns null when
 * the runtime doesn't ship a WebGPU build — caller must have its
 * own fallback.
 */
export function loadNodeMaterials(): {
  MeshStandardNodeMaterial?: new (params?: object) => unknown;
  MeshPhysicalNodeMaterial?: new (params?: object) => unknown;
  MeshBasicNodeMaterial?: new (params?: object) => unknown;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require("three/webgpu");
    return m as ReturnType<typeof loadNodeMaterials>;
  } catch {
    return null;
  }
}

/** Resolve the TSL primitive namespace (`color`, `uniform`, etc). */
export function loadTSL(): typeof import("three/tsl") | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("three/tsl") as typeof import("three/tsl");
  } catch {
    return null;
  }
}

/** Resolve the vanilla `three` namespace. Always available. */
export function loadThree(): typeof import("three") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("three") as typeof import("three");
}

/** Convenience: hex int from a palette token. */
export function tokenHex(token: PaletteToken): number {
  return paletteHex[token];
}

/**
 * Reduced-motion probe. Used by animated presets (foil, holographic)
 * to freeze their phase uniform at zero rather than letting it tick.
 * Server-rendered call sites get `false` because there's no window.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tonemap a TSL colour node so an HDR-ish accent stays under 1.0 in
 * XR HDR. Soft Reinhard — colour / (1 + colour) — without an extra
 * pass. The presets that emit > 1.0 colours (holographic, glow)
 * route their final mix through this before returning.
 */
export function reinhardNode(
  tsl: typeof import("three/tsl"),
  node: unknown,
): unknown {
  const n = node as ReturnType<typeof tsl.color>;
  return tsl.div(n, tsl.add(tsl.float(1.0), n));
}
