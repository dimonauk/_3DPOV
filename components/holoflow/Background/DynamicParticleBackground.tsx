/**
 * DynamicParticleBackground — drifting particle field with vignette.
 *
 * Ported from the #hc canvas in the holoflow-landing-v2 HTML. About
 * 220 lavender/gold particles drifting with subtle parallax, plus the
 * radial vignette overlay so display type stays legible.
 *
 * Performance:
 *   - One canvas, fullscreen, fixed-positioned behind everything
 *   - requestAnimationFrame, throttled to 60 fps
 *   - Particle count scales down on small screens
 *   - Pauses when document is hidden (saves battery)
 *   - Honors prefers-reduced-motion (renders one frame, then stops)
 */

"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: "lavender" | "gold" | "teal";
};

const PALETTE: Record<Particle["hue"], string> = {
  lavender: "rgba(180, 144, 255, 0.5)",
  gold: "rgba(232, 201, 122, 0.4)",
  teal: "rgba(125, 232, 208, 0.32)",
};

export function DynamicParticleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(220, (w * h) / 8500));
      particles = new Array(count).fill(0).map(() => spawn(w, h));
    };

    const HUE: readonly Particle["hue"][] = ["lavender", "lavender", "gold", "teal"] as const;
    const spawn = (w: number, h: number): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 0.5 + Math.random() * 1.4,
      hue: HUE[Math.floor(Math.random() * HUE.length)] ?? "lavender",
    });

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      // Radial vignette so text floating above reads cleanly.
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h));
      grad.addColorStop(0, "rgba(12, 10, 18, 0.0)");
      grad.addColorStop(0.85, "rgba(12, 10, 18, 0.6)");
      grad.addColorStop(1, "rgba(12, 10, 18, 0.92)");
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.beginPath();
        ctx.fillStyle = PALETTE[p.hue];
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };

    const loop = () => {
      if (!running) return;
      draw();
      if (!prefersReducedMotion) raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!prefersReducedMotion) {
        running = true;
        loop();
      }
    };

    resize();
    loop();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
