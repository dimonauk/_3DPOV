"use client";

/**
 * components/hangar/CustomCursor.tsx
 *
 * Two-layer custom cursor for the Hangar showcase: an inner dot in
 * the accent colour + an outer ring that lags slightly behind. Mirrors
 * the `#cur` / `#cur2` elements from public/hangar-v2.html.
 *
 * Initial stub — visual fidelity is good enough to ship; refine cursor
 * physics, hover-state colour swaps, and pointer-fine media-query gate
 * in follow-ups.
 */

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on coarse pointer devices (touch screens) — a custom cursor
    // there is just dead weight.
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let raf: number | null = null;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
      }
    };

    const loop = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[8px] w-[8px] rounded-full bg-[var(--acc,#ff3d1f)] mix-blend-multiply"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-[28px] w-[28px] rounded-full border-[0.5px] border-[var(--acc,#ff3d1f)] opacity-45 transition-[width,height,opacity] duration-100"
      />
    </>
  );
}
