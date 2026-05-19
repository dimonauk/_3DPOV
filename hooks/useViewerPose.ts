"use client";

/**
 * hooks/useViewerPose.ts — React hook over the tracking registry.
 *
 * Subscribes to the unified ViewerPose stream from
 * lib/tracking/registry. Returns the latest pose plus the active
 * source. The hook stores both in React state so consumer
 * components re-render on each new sample — fine for low-frequency
 * UI overlays.
 *
 * High-frequency consumers (the WebGPU parallax shader) should
 * NOT route through this hook. They want lib/tracking/subscribe
 * directly so the transform write skips React's render queue,
 * the same shape useParallax uses with lib/parallax/store.
 *
 * Throttle: the hook coalesces samples to one React state update
 * per animation frame to keep render pressure flat at 30/60fps.
 */

import { useEffect, useState } from "react";

import {
  onActiveSourceChange,
  subscribe,
  type TrackingSource,
  type ViewerPose,
} from "lib/tracking";

export type UseViewerPoseResult = {
  pose: ViewerPose | null;
  source: TrackingSource | null;
};

export function useViewerPose(): UseViewerPoseResult {
  const [pose, setPose] = useState<ViewerPose | null>(null);
  const [source, setSource] = useState<TrackingSource | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let pending: ViewerPose | null = null;
    let rafId = 0;

    const flush = (): void => {
      rafId = 0;
      if (pending) {
        const next = pending;
        pending = null;
        setPose(next);
      }
    };

    const onPose = (next: ViewerPose): void => {
      pending = next;
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(flush);
    };

    const offPose = subscribe(onPose);
    const offSource = onActiveSourceChange(setSource);

    return () => {
      offPose();
      offSource();
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return { pose, source };
}
