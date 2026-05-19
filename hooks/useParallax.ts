"use client";

/**
 * hooks/useParallax.ts — Scroll-driven parallax for a single element.
 *
 * Subscribes to the singleton scroll store (lib/parallax/store) and
 * writes `transform: translate3d(...)` directly to the ref'd element
 * on every animation frame. We deliberately do NOT route through
 * React state — that would queue a render per frame, defeat the whole
 * point of rAF throttling, and break the GPU compositing path.
 *
 * Off-screen elements are skipped via IntersectionObserver. A layer
 * that the reader cannot see does not earn a transform write.
 *
 * Honours `prefers-reduced-motion: reduce` by default — under that
 * preference the hook returns its ref but never writes a transform.
 *
 * Math is currently linear (y = scrollY * speed + offset). Cheap.
 * If we ever want bezier-interpolated curves per layer, the upgrade
 * path is: move the curve evaluation into a Web Worker via
 * lib/workers/registry.ts and post the resolved {y, rotateX} pairs
 * back over a MessageChannel. The hook contract stays the same.
 */

import { useEffect, useRef } from "react";

import { subscribe, type ParallaxSnapshot } from "lib/parallax/store";

export type UseParallaxOptions = {
  /** How much faster (>1) or slower (<1) than scroll the layer moves. */
  speed?: number;
  /** Direction axis. Default "y". */
  axis?: "x" | "y";
  /** Optional offset baseline in px. */
  offset?: number;
  /** When true, additionally apply rotateX based on relative position. */
  rotate?: boolean;
  /** Disable on prefers-reduced-motion. Default true. */
  respectsReducedMotion?: boolean;
};

export type UseParallaxResult<T extends HTMLElement> = {
  ref: React.RefObject<T | null>;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Attach scroll-driven parallax to the element captured by the
 * returned ref. The transform is applied directly to that element's
 * inline style — pair with `will-change: transform` for GPU
 * compositing (the ParallaxLayer wrapper sets that for you).
 */
export function useParallax<T extends HTMLElement>(
  options: UseParallaxOptions = {},
): UseParallaxResult<T> {
  const {
    speed = 1,
    axis = "y",
    offset = 0,
    rotate = false,
    respectsReducedMotion = true,
  } = options;

  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (respectsReducedMotion && prefersReducedMotion()) return;

    // IntersectionObserver gate — when the element is not on screen
    // we ignore scroll snapshots entirely. The browser also throws
    // away the off-screen layer's pixels in most pipelines but the
    // transform write is still wasteful.
    let visible = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
        }
      },
      // 256px rootMargin on the Y axis — start updating just before
      // the layer enters the viewport so the first visible frame is
      // already on its parallax track, not snapping into place.
      { root: null, rootMargin: "256px 0px", threshold: 0 },
    );
    io.observe(el);

    let lastWritten = Number.NaN;

    const handler = (snap: ParallaxSnapshot): void => {
      if (!visible) return;
      const scroll = axis === "y" ? snap.scrollY : snap.scrollX;
      const value = scroll * speed + offset;
      // Skip identical writes — common when the page is idle but the
      // resize coalescer ticks.
      if (value === lastWritten) return;
      lastWritten = value;
      const translate =
        axis === "y"
          ? `translate3d(0, ${value.toFixed(2)}px, 0)`
          : `translate3d(${value.toFixed(2)}px, 0, 0)`;
      if (rotate) {
        // Convert vertical travel into a small rotateX nudge — at
        // 1deg per 200px the effect is luxe-magazine subtle, not
        // amusement-park. Capped at 6deg either way.
        const rot = Math.max(-6, Math.min(6, value / 200));
        el.style.transform = `${translate} rotateX(${rot.toFixed(3)}deg)`;
      } else {
        el.style.transform = translate;
      }
    };

    const unsubscribe = subscribe(handler);

    return () => {
      unsubscribe();
      io.disconnect();
      // Leave the last transform on the element — clearing it would
      // cause a visible snap when the component unmounts during
      // route transitions.
    };
  }, [speed, axis, offset, rotate, respectsReducedMotion]);

  return { ref };
}
