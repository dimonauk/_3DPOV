"use client";
/**
 * hooks/useAnimationLoop.ts
 *
 * Lightweight RAF loop — no Three.js dependency. Use when you need
 * a frame loop for Canvas2D, custom WebGL, or any time-based animation.
 *
 * Usage:
 *   useAnimationLoop((t, dt) => {
 *     ctx.clearRect(0, 0, W, H);
 *     // draw with t (elapsed seconds) and dt (delta seconds)
 *   });
 */

import { useEffect, useRef } from "react";

export function useAnimationLoop(
  onFrame: (t: number, dt: number) => void,
  /** Set false to pause the loop */
  active = true,
) {
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    if (!active) return;
    let start = performance.now();
    let prev  = start;
    let rafId = 0;
    function loop() {
      rafId = requestAnimationFrame(loop);
      const now = performance.now();
      cbRef.current((now - start) / 1000, (now - prev) / 1000);
      prev = now;
    }
    loop();
    return () => cancelAnimationFrame(rafId);
  }, [active]);
}
