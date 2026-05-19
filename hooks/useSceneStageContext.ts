"use client";

/**
 * hooks/useSceneStageContext.ts — Scene-level control surface.
 *
 * The SceneStage component sits a context provider around its
 * children so scene content can read the current view mode (2d / vr
 * / ar), the ambient-field toggle state, the tracking source pill,
 * and the toolbar's "user requested camera reset" pulse — without
 * threading props through every R3F mesh wrapper.
 *
 * Consumers:
 *   - `useSceneStageMode()` → `"2d" | "vr" | "ar"` reactive
 *   - `useSceneStageAmbient()` → `{ enabled, toggle }`
 *   - `useSceneStage()` → full value when a component needs more
 *
 * The provider itself lives in components/xr-scene/SceneStage. The
 * hook + context split lets unit tests render scene content with
 * any value combination without dragging the whole canvas in.
 */

import { createContext, useContext } from "react";

export type SceneStageMode = "2d" | "vr" | "ar";

export type SceneStageContextValue = {
  /** Currently-active view mode. */
  mode: SceneStageMode;
  /** True when the ambient field has been requested. The actual
   *  AmbientField mount lives in the SceneStage component — this is
   *  the source of truth that drives it. */
  ambient: boolean;
  /** Toggle ambient on/off. No-op when the stage's `ambient` prop
   *  was passed `false` (the toolbar hides the control in that case). */
  setAmbient: (next: boolean) => void;
  /** Whether the WebGPU renderer is in use. False = WebGL2 fallback. */
  isWebGPU: boolean;
  /** Renderer + XR capability. Read-only — fixed at mount time. */
  isXRCapable: boolean;
  /** Operator-readable label for the active tracking source. Null
   *  when no tracker has resolved yet. */
  trackingLabel: string | null;
  /** Bump this counter to ask the camera rig to recentre. */
  recenterTick: number;
  /** Increment recenterTick. */
  requestRecenter: () => void;
};

export const SceneStageContext =
  createContext<SceneStageContextValue | null>(null);

/**
 * Full context read. Returns null when called outside a SceneStage
 * provider — components that can render outside one (e.g. a mesh
 * used in both Stage + SceneStage) should branch on that.
 */
export function useSceneStage(): SceneStageContextValue | null {
  return useContext(SceneStageContext);
}

/** Mode-only convenience. Defaults to "2d" outside a provider. */
export function useSceneStageMode(): SceneStageMode {
  const ctx = useContext(SceneStageContext);
  return ctx?.mode ?? "2d";
}

/**
 * Ambient-toggle convenience. Outside a provider the toggle is a
 * no-op so child components can call it without conditional guards.
 */
export function useSceneStageAmbient(): {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
} {
  const ctx = useContext(SceneStageContext);
  if (!ctx) {
    return { enabled: false, setEnabled: () => undefined };
  }
  return { enabled: ctx.ambient, setEnabled: ctx.setAmbient };
}
