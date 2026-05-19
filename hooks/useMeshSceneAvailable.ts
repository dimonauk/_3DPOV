"use client";

/**
 * hooks/useMeshSceneAvailable.ts — gate for the mesh-prose upgrade.
 *
 * Returns `true` only when ALL of these are true:
 *
 *   1. A `MeshSceneProvider` is mounted somewhere above. Without
 *      one, there's no shared scene to register into, so the
 *      mesh path can't run.
 *   2. The device supports WebGL or WebGPU. If neither, painting
 *      anything mesh-shaped is a non-starter.
 *   3. The user hasn't opted out via the `MeshSceneToggle`.
 *      Choice persists in `localStorage` under the key
 *      `holoflow.mesh-scene.opt-out`.
 *   4. `prefers-reduced-motion` is not "reduce". Mesh-prose
 *      shimmers in the foil preset and lerps with the camera —
 *      reduce-motion users get the HTML they asked for.
 *
 * The hook re-evaluates on `storage` events (cross-tab opt-out
 * sync), `prefers-reduced-motion` change events, and on context
 * presence change. It does NOT poll.
 */

import { useEffect, useState } from "react";

import { useMeshScene } from "components/type3d/MeshSceneProvider";

const OPT_OUT_KEY = "holoflow.mesh-scene.opt-out";

export type MeshSceneAvailability = {
  /** True if the layer should upgrade to mesh. */
  available: boolean;
  /** Reason it's not available, useful for debugging. */
  reason:
    | null
    | "no-provider"
    | "no-gfx"
    | "opted-out"
    | "reduced-motion"
    | "ssr";
};

export function useMeshSceneAvailable(): MeshSceneAvailability {
  const scene = useMeshScene();
  const [gfx, setGfx] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState<boolean>(false);
  const [optedOut, setOptedOut] = useState<boolean>(false);

  // Probe WebGL/WebGPU once. The result doesn't change without a
  // page reload, so we don't need an observer.
  useEffect(() => {
    if (typeof window === "undefined") {
      setGfx(false);
      return;
    }
    const nav = navigator as Navigator & { gpu?: unknown };
    if (typeof nav.gpu !== "undefined") {
      setGfx(true);
      return;
    }
    try {
      const probe = document.createElement("canvas");
      const ctx =
        probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl");
      setGfx(Boolean(ctx));
    } catch {
      setGfx(false);
    }
  }, []);

  // Reduced-motion media query.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent): void => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // localStorage opt-out + cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = (): boolean => {
      try {
        return localStorage.getItem(OPT_OUT_KEY) === "1";
      } catch {
        return false;
      }
    };
    setOptedOut(read());
    const onStorage = (e: StorageEvent): void => {
      if (e.key === OPT_OUT_KEY) setOptedOut(read());
    };
    const onCustom = (): void => setOptedOut(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener("holoflow:mesh-scene-toggle", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("holoflow:mesh-scene-toggle", onCustom);
    };
  }, []);

  if (typeof window === "undefined") {
    return { available: false, reason: "ssr" };
  }
  if (!scene) return { available: false, reason: "no-provider" };
  if (gfx === false) return { available: false, reason: "no-gfx" };
  if (gfx === null) return { available: false, reason: null };
  if (reduced) return { available: false, reason: "reduced-motion" };
  if (optedOut) return { available: false, reason: "opted-out" };
  return { available: true, reason: null };
}

/**
 * Programmatic opt-out setter — used by `MeshSceneToggle` and
 * available to anything else that needs to flip the preference
 * (e.g. an a11y panel). Broadcasts a custom event so listeners
 * in the same tab pick up the change without a reload.
 */
export function setMeshSceneOptOut(optOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // localStorage blocked (Safari private etc.) — silently
    // accept the runtime-only change; the toggle will reset
    // on next navigation but that's the cost of the policy.
  }
  window.dispatchEvent(new CustomEvent("holoflow:mesh-scene-toggle"));
}

export function getMeshSceneOptOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export const MESH_SCENE_OPT_OUT_KEY = OPT_OUT_KEY;
