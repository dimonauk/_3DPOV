/**
 * lib/tracking/sources/pointer-fallback.ts — Mouse-as-head fallback.
 *
 * Always available. Maps pointermove events into the unified
 * ViewerPose space, with the mouse standing in for where the
 * viewer is looking. Z is held at a neutral 0.4 — far enough
 * forward that parallax responds, close enough that it feels
 * "at the screen". No rotation channels.
 *
 * This is the bottom of the fallback chain: every other tracker
 * runs out of headroom, the pointer is always there.
 */

import { registerTracker } from "../registry";
import type {
  TrackingTracker,
  ViewerPose,
  ViewerPoseHandler,
} from "../types";

const NEUTRAL_Z = 0.4;

function createPointerTracker(): TrackingTracker {
  const handlers = new Set<ViewerPoseHandler>();
  let started = false;

  function broadcast(x: number, y: number): void {
    const pose: ViewerPose = {
      x,
      y,
      z: NEUTRAL_Z,
      timestamp: performance.now(),
      source: "pointer",
    };
    for (const h of Array.from(handlers)) {
      try {
        h(pose);
      } catch {
        // ignore — handlers own their errors
      }
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (typeof window === "undefined") return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = (event.clientX / w) * 2 - 1;
    // Flip Y so +1 = top of screen, matching the convention
    // documented on ViewerPose.
    const ny = -((event.clientY / h) * 2 - 1);
    broadcast(nx, ny);
  }

  return {
    source: "pointer",
    available: async () => typeof window !== "undefined",
    init: async () => {
      // Nothing to allocate; the pointer is part of the window.
    },
    start: async () => {
      if (started) return;
      if (typeof window === "undefined") return;
      started = true;
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      // Emit one neutral pose so subscribers see something
      // immediately rather than waiting for the first mouse move.
      broadcast(0, 0);
    },
    stop: async () => {
      if (!started) return;
      started = false;
      if (typeof window === "undefined") return;
      window.removeEventListener("pointermove", onPointerMove);
    },
    onPose: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}

registerTracker("pointer", createPointerTracker);
