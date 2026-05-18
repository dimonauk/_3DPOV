"use client";

/**
 * components/aura-tron/AuraTronBackground.tsx
 *
 * Mood-tinted parallax background for the AuraTron study. The DollyOS
 * original at
 * `D:\The_Hangar\Dolly_OS\src\components\void\AuraTron\AuraTronBackground.tsx`
 * spawned a dedicated Web Worker that drew an OffscreenCanvas through six
 * scene modules (sky / lace / drips / corners / traces / nodes / HUD), every
 * one of which referenced the Aura store, the VRM rig, or the DollyOS mood
 * vocabulary. Everything below the sky module was DollyOS HUD furniture and
 * has been cut.
 *
 * What survives:
 *   • a horizon gradient that takes the mood palette
 *   • a handful of drifting aurora blooms in screen-space
 *
 * Runs on the main thread inside a regular 2D canvas — no worker, no
 * OffscreenCanvas, no postMessage handshake. The R3F landscape sits in front
 * of it on the same page; this canvas is positioned behind the 3D view.
 */
import { useEffect, useRef } from "react";

import { DEFAULT_MOOD, getMoodPalette, type Mood } from "lib/aura-tron/terrain";

type Props = {
  mood?: Mood;
  className?: string;
};

const AURORA_BLOBS = [
  { x: 0.2, y: 0.28, r: 0.42, ph: 0.0, sp: 0.11, a: 0.22 },
  { x: 0.78, y: 0.22, r: 0.5, ph: 2.8, sp: 0.08, a: 0.18 },
  { x: 0.5, y: 0.18, r: 0.55, ph: 5.1, sp: 0.13, a: 0.2 },
  { x: 0.32, y: 0.4, r: 0.35, ph: 1.4, sp: 0.09, a: 0.14 },
  { x: 0.7, y: 0.36, r: 0.4, ph: 3.7, sp: 0.15, a: 0.12 },
] as const;

export function AuraTronBackground({ mood = DEFAULT_MOOD, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const moodRef = useRef<Mood>(mood);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let t = 0;
    let last = performance.now();

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    const FRAME_BUDGET = 1000 / 30;
    let accum = 0;

    const frame = (now: number) => {
      if (!running) return;
      raf = window.requestAnimationFrame(frame);
      const dt = now - last;
      last = now;
      accum += dt;
      if (accum < FRAME_BUDGET) return;
      accum = accum % FRAME_BUDGET;
      t += dt / 1000;

      const palette = getMoodPalette(moodRef.current);
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      // Horizon gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      const [fr, fg, fb] = palette.bgFar;
      const [nr, ng, nb] = palette.bgNear;
      grad.addColorStop(0, `rgb(${fr},${fg},${fb})`);
      grad.addColorStop(0.55, `rgb(${nr},${ng},${nb})`);
      grad.addColorStop(1, `rgb(${Math.max(0, fr - 4)},${Math.max(0, fg - 4)},${Math.max(0, fb - 4)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Aurora blobs in screen-space
      const [ar, ag, ab] = palette.aurora;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const b of AURORA_BLOBS) {
        const driftX = Math.sin(t * b.sp + b.ph) * 0.12 * W;
        const driftY = Math.cos(t * b.sp * 0.8 + b.ph * 1.3) * 0.06 * H;
        const px = b.x * W + driftX;
        const py = Math.min(b.y * H + driftY, H * 0.62);
        const radius = b.r * Math.max(W, H) * (0.85 + 0.15 * Math.sin(t * b.sp * 0.5 + b.ph));
        const rg = ctx.createRadialGradient(px, py, 0, px, py, radius);
        const ar255 = Math.round(ar * 255);
        const ag255 = Math.round(ag * 255);
        const ab255 = Math.round(ab * 255);
        rg.addColorStop(0, `rgba(${ar255},${ag255},${ab255},${b.a})`);
        rg.addColorStop(0.45, `rgba(${ar255},${ag255},${ab255},${b.a * 0.4})`);
        rg.addColorStop(1, `rgba(${ar255},${ag255},${ab255},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    raf = window.requestAnimationFrame(frame);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-0 h-full w-full"}
    />
  );
}

export default AuraTronBackground;
