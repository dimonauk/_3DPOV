"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";

// CursorReticle — a small crosshair + circle that trails the cursor,
// smoothed by a one-pole lag filter. The signifier the eye reads as
// "the system is tracking my gaze" — pass-through AR pipelines put a
// near-identical reticle on the user's focus point.
//
// Client-only. rAF-throttled, never blocks interaction, hides on
// touch devices (no hover means no cursor), and freezes still under
// `prefers-reduced-motion`.

export type CursorReticleProps = {
  /** Restrict the reticle to inside this element. If absent, follows
   *  the cursor across the whole viewport. */
  containerRef?: RefObject<HTMLElement | null>;
  /** Visual diameter, px. Default 28. */
  size?: number;
  /** Smoothing factor 0..1. Higher = snappier. Default 0.18. */
  lerp?: number;
  /** Extra classes on the root element. */
  className?: string;
};

export function CursorReticle({
  containerRef,
  size = 28,
  lerp = 0.18,
  className,
}: CursorReticleProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Target = the actual cursor position (updated synchronously on
  // pointermove). Current = the smoothed position we paint, updated on
  // each rAF tick. The lag is what makes the reticle feel like an
  // optical tracker rather than a mouse cursor.
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const visible = useRef(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Touch / no-hover devices have no cursor to track. Bail.
    const noHover = window.matchMedia("(hover: none)").matches;
    if (noHover) {
      root.style.display = "none";
      return;
    }

    // Reduced-motion users get a static reticle pinned to the centre
    // of the container — the chrome is still present (preserves the
    // composition) but it doesn't lurch around the screen.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    const targetEl: HTMLElement | Window = containerRef?.current ?? window;
    const isWindow = targetEl === window;

    function getCenter() {
      if (isWindow) {
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      }
      const el = targetEl as HTMLElement;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    // Initialise on the centre so the first frame doesn't snap from
    // (0,0) when the cursor enters the region.
    const c = getCenter();
    target.current = { ...c };
    current.current = { ...c };

    if (reduced) {
      // Paint once at the centre and skip the rAF loop entirely.
      root.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) translate(-50%, -50%)`;
      root.style.opacity = "0.55";
      return;
    }

    function onMove(e: PointerEvent | MouseEvent) {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible.current) {
        visible.current = true;
        if (root) root.style.opacity = "0.9";
      }
    }

    function onLeave() {
      visible.current = false;
      if (root) root.style.opacity = "0";
    }

    // For container-bound reticles we listen on the container; the
    // viewport-wide variant listens on window. enter/leave handlers
    // fade the reticle in/out so it doesn't sit at the last cursor
    // position when the pointer wanders off.
    if (isWindow) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave, { passive: true });
    } else {
      const el = targetEl as HTMLElement;
      el.addEventListener("pointermove", onMove as EventListener, {
        passive: true,
      });
      el.addEventListener("pointerleave", onLeave as EventListener, {
        passive: true,
      });
    }

    function tick() {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * lerp;
      current.current.y += dy * lerp;
      if (root) {
        root.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      if (isWindow) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerleave", onLeave);
      } else {
        const el = targetEl as HTMLElement;
        el.removeEventListener("pointermove", onMove as EventListener);
        el.removeEventListener("pointerleave", onLeave as EventListener);
      }
    };
  }, [containerRef, lerp]);

  const style: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: size,
    height: size,
    pointerEvents: "none",
    zIndex: 50,
    opacity: 0,
    transition: "opacity 220ms ease-out",
    willChange: "transform",
    mixBlendMode: "screen",
  };

  // SVG draws the circle + crosshair as a single paint. Stroke is in
  // the studio pink, sub-pixel hairline.
  return (
    <div
      aria-hidden
      ref={rootRef}
      className={className}
      style={style}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        style={{ display: "block" }}
      >
        <circle
          cx="14"
          cy="14"
          r="10"
          stroke="var(--color-pink-200)"
          strokeWidth="0.75"
          opacity="0.85"
        />
        <line
          x1="14"
          y1="0"
          x2="14"
          y2="6"
          stroke="var(--color-pink-200)"
          strokeWidth="0.75"
        />
        <line
          x1="14"
          y1="22"
          x2="14"
          y2="28"
          stroke="var(--color-pink-200)"
          strokeWidth="0.75"
        />
        <line
          x1="0"
          y1="14"
          x2="6"
          y2="14"
          stroke="var(--color-pink-200)"
          strokeWidth="0.75"
        />
        <line
          x1="22"
          y1="14"
          x2="28"
          y2="14"
          stroke="var(--color-pink-200)"
          strokeWidth="0.75"
        />
        <circle
          cx="14"
          cy="14"
          r="1.2"
          fill="var(--color-pink-200)"
        />
      </svg>
    </div>
  );
}

export default CursorReticle;
