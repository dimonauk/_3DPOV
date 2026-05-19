"use client";

/**
 * hooks/useTiltParallax.ts — Mouse-driven tilt + translate parallax.
 *
 * Tracks the pointer position over a container (or the window) and
 * applies a perspective rotate + small translate to the ref'd element
 * so it appears to tilt towards the cursor. Smoothed via a spring
 * (current + velocity) so the motion settles rather than snapping.
 *
 * Same separation of concerns as useParallax: writes inline transform
 * directly, no React state per frame. Owns its own rAF loop because
 * pointermove fires on its own cadence and we want to keep advancing
 * the spring even when the pointer is still (so the rest-position
 * settles smoothly).
 *
 * Reduced-motion: respected — under `prefers-reduced-motion: reduce`
 * the hook is a no-op.
 */

import { useEffect, useRef } from "react";

export type UseTiltParallaxOptions = {
  /** Tilt magnitude in degrees per 1.0 pointer offset. Default 6. */
  maxTilt?: number;
  /** Translate magnitude in px per 1.0 pointer offset. Default 4. */
  maxTranslate?: number;
  /** Spring stiffness — higher = snappier. Default 0.15. */
  stiffness?: number;
  /** Spring damping. Higher = more drag. Default 0.7. */
  damping?: number;
  /**
   * Container ref. The pointer's position is read relative to this
   * element's bounding rect; if omitted, the window is used and the
   * pointer is normalised against viewport dimensions.
   */
  pointerContainerRef?: React.RefObject<HTMLElement | null>;
  /** Disable on prefers-reduced-motion. Default true. */
  respectsReducedMotion?: boolean;
};

export type UseTiltParallaxResult<T extends HTMLElement> = {
  ref: React.RefObject<T | null>;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTiltParallax<T extends HTMLElement>(
  options: UseTiltParallaxOptions = {},
): UseTiltParallaxResult<T> {
  const {
    maxTilt = 6,
    maxTranslate = 4,
    stiffness = 0.15,
    damping = 0.7,
    pointerContainerRef,
    respectsReducedMotion = true,
  } = options;

  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (respectsReducedMotion && prefersReducedMotion()) return;

    // Target offsets in normalised space (-1..1 on each axis). The
    // spring chases these.
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let rafId = 0;
    let alive = true;
    let pointerInside = false;

    const container: HTMLElement | Window =
      pointerContainerRef?.current ?? window;

    const computeNormalised = (
      clientX: number,
      clientY: number,
    ): { x: number; y: number } => {
      if (container instanceof Window) {
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        return {
          x: (clientX / w) * 2 - 1,
          y: (clientY / h) * 2 - 1,
        };
      }
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: ((clientY - rect.top) / rect.height) * 2 - 1,
      };
    };

    const onPointerMove = (event: PointerEvent): void => {
      pointerInside = true;
      const { x, y } = computeNormalised(event.clientX, event.clientY);
      targetX = Math.max(-1, Math.min(1, x));
      targetY = Math.max(-1, Math.min(1, y));
    };

    const onPointerLeave = (): void => {
      pointerInside = false;
      // Snap target back to rest — spring will glide currentX/Y home.
      targetX = 0;
      targetY = 0;
    };

    const step = (): void => {
      if (!alive) return;
      // Standard spring: a = -k*(x - target) - c*v, v += a, x += v.
      const ax = -stiffness * (currentX - targetX) - damping * velocityX;
      const ay = -stiffness * (currentY - targetY) - damping * velocityY;
      velocityX += ax;
      velocityY += ay;
      currentX += velocityX;
      currentY += velocityY;

      // rotateX is inverted relative to pointer Y so the surface tilts
      // TOWARDS the cursor (cursor at top → top edge lifts).
      const rx = -currentY * maxTilt;
      const ry = currentX * maxTilt;
      const tx = currentX * maxTranslate;
      const ty = currentY * maxTranslate;

      el.style.transform =
        `perspective(800px) rotateX(${rx.toFixed(3)}deg) ` +
        `rotateY(${ry.toFixed(3)}deg) ` +
        `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;

      // Keep the loop alive while the spring is still settling OR
      // while the pointer is inside. Once both are at rest within
      // a small epsilon, pause the loop so we burn no CPU.
      const settled =
        Math.abs(velocityX) < 0.0005 &&
        Math.abs(velocityY) < 0.0005 &&
        Math.abs(currentX - targetX) < 0.0005 &&
        Math.abs(currentY - targetY) < 0.0005;
      if (!settled || pointerInside) {
        rafId = window.requestAnimationFrame(step);
      } else {
        rafId = 0;
      }
    };

    const ensureLoop = (): void => {
      if (rafId === 0 && alive) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    const wakeHandler = (event: PointerEvent): void => {
      onPointerMove(event);
      ensureLoop();
    };

    // Cast to EventTarget — Window and HTMLElement both satisfy it
    // but TS narrows away the shared addEventListener overloads.
    const target = container as unknown as EventTarget;
    target.addEventListener("pointermove", wakeHandler as EventListener, {
      passive: true,
    });
    target.addEventListener("pointerleave", onPointerLeave as EventListener);

    el.style.willChange = "transform";

    return () => {
      alive = false;
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      target.removeEventListener("pointermove", wakeHandler as EventListener);
      target.removeEventListener(
        "pointerleave",
        onPointerLeave as EventListener,
      );
    };
  }, [
    maxTilt,
    maxTranslate,
    stiffness,
    damping,
    pointerContainerRef,
    respectsReducedMotion,
  ]);

  return { ref };
}
