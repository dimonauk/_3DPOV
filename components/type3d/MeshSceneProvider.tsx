"use client";

/**
 * components/type3d/MeshSceneProvider.tsx — Shared 3D scene provider.
 *
 * Owns one canvas, one renderer, one scene, one camera, one rAF
 * loop. Every `<MeshProseLayer>` mounted underneath registers its
 * troika Text mesh into the shared scene via `useMeshScene()`.
 *
 * Composition:
 *   ./mesh-scene/types.ts                — public + internal types
 *   ./mesh-scene/renderer-build.ts       — buildRenderer + applyRendererSize
 *   ./mesh-scene/render-frame.ts         — one-frame render pass (pure)
 *   ./mesh-scene/use-viewer-pose-tracking.ts
 *                                        — tracking subscription hook
 *   ./mesh-scene/use-mesh-scene-lifecycle.ts
 *                                        — init / teardown / resize /
 *                                          visibility / rAF / registration
 *   ./mesh-scene/context.ts              — context + useMeshScene hook
 *
 * This file is the thin orchestrator: it wires the two hooks, mounts
 * the canvas, and exposes the context value.
 */

import { useMemo, type ReactNode } from "react";

import { MeshSceneContext } from "./mesh-scene/context";
import type { MeshSceneContextValue } from "./mesh-scene/types";
import { useMeshSceneLifecycle } from "./mesh-scene/use-mesh-scene-lifecycle";
import { useViewerPoseTracking } from "./mesh-scene/use-viewer-pose-tracking";

export type { ViewerPose, MeshSceneContextValue } from "./mesh-scene/types";
export { useMeshScene } from "./mesh-scene/context";

export type MeshSceneProviderProps = {
  children: ReactNode;
  /** When false, the provider mounts but never builds a renderer.
   *  Lets a parent disable the scene without unmounting the tree. */
  enabled?: boolean;
};

export function MeshSceneProvider({
  children,
  enabled = true,
}: MeshSceneProviderProps) {
  const viewerPose = useViewerPoseTracking(enabled);
  const { canvasRef, addGlyphGroup, ready } = useMeshSceneLifecycle(
    enabled,
    viewerPose,
  );

  const value = useMemo<MeshSceneContextValue>(
    () => ({ addGlyphGroup, viewerPose, ready }),
    [addGlyphGroup, viewerPose, ready],
  );

  if (!enabled) {
    return (
      <MeshSceneContext.Provider value={null}>
        {children}
      </MeshSceneContext.Provider>
    );
  }

  return (
    <MeshSceneContext.Provider value={value}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          // Negative z so page chrome paints on top; the canvas
          // shows through where the prose layer has dropped its
          // HTML opacity.
          zIndex: -1,
        }}
      />
      {children}
    </MeshSceneContext.Provider>
  );
}
