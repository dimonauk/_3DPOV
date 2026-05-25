"use client";

/**
 * components/type3d/mesh-scene/use-viewer-pose-tracking.ts
 *
 * Subscribes to the unified viewer-pose stream from `lib/tracking`
 * (Kinect → Ultraleap → MediaPipe-face → MediaPipe-hand → pointer
 * fallback chain). Returns the latest sample clamped to the
 * provider's expected ranges, or null when no tracker is running.
 *
 * Dynamic-imports `lib/tracking` so pages that never mount a
 * provider don't pay for the registry bundle, and pages that do
 * don't fail at SSR time.
 *
 * Own concern: input tracking. Doesn't know about scenes, cameras
 * or renderers. Returns a primitive state shape the orchestrator
 * passes into the render loop.
 */

import { useEffect, useState } from "react";

import { clamp } from "./renderer-build";
import type { ViewerPose } from "./types";

export function useViewerPoseTracking(enabled: boolean): ViewerPose | null {
  const [viewerPose, setViewerPose] = useState<ViewerPose | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const tracking = await import("lib/tracking");
        if (cancelled) return;
        unsubscribe = tracking.subscribe((pose) => {
          setViewerPose({
            x: clamp(pose.x, -1, 1),
            y: clamp(pose.y, -1, 1),
            z: clamp(pose.z, 0, 1),
          });
        });
      } catch (err) {
        // Tracking registry not present — the scene just stays
        // camera-static. Debug-level only because the expected
        // dev-time state is "no tracker started yet".
        console.debug(
          "[MeshSceneProvider] tracking registry not available; camera stays static:",
          err,
        );
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [enabled]);

  return viewerPose;
}
