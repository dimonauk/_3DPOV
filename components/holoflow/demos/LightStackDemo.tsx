"use client";
/**
 * LightStackDemo.tsx — Canvas2D light painting accumulator.
 * Extracted from holo-flow-studio-v5.html.
 * Stacks randomised shell curves in lighter blend mode — simulates
 * long-exposure poi light painting.
 */
import { useEffect, useRef, useState } from "react";

const COLS = ["#e07060","#f0a090","#c9a84c","#e8c97a","#d060a0","#b39fff"];

export function LightStackDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const W = cv.offsetWidth || 420, H = 220;
    cv.width = W; cv.height = H;
    ctx.fillStyle = "#04040a";
    ctx.fillRect(0, 0, W, H);

    const id = setInterval(() => {
      const cx = W / 2, cy = H / 2;
      const r1 = 40 + Math.random() * 70;
      const r2 = 15 + Math.random() * 30;
      const ph = Math.random() * Math.PI * 2;
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      for (let i = 0; i < 500; i++) {
        const t = (i / 500) * Math.PI * 2 * 6;
        const x = cx + r1 * Math.cos(t) + r2 * Math.cos(2.3 * t + ph);
        const y = cy + (r1 * Math.sin(t) + r2 * Math.sin(1.7 * t + ph)) * 0.65;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COLS[Math.floor(Math.random() * COLS.length)]!;
      ctx.lineWidth   = 0.7;
      ctx.globalAlpha = 0.15;
      ctx.stroke();
      ctx.globalAlpha = 1;
      frameRef.current += 1;
      setFrames(frameRef.current);
    }, 120);

    return () => clearInterval(id);
  }, []);

  const reset = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#04040a";
    ctx.fillRect(0, 0, cv.width, cv.height);
    frameRef.current = 0;
    setFrames(0);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg border border-warm-black-700 bg-black">
        <canvas ref={canvasRef} className="block w-full" style={{ height: 220 }} />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-0.5 font-mono text-[10px]">
          <span className="text-teal-300">LIGHT STACK ACCUMULATOR</span>
          <span className="text-lavender-200">FRAMES: {frames}</span>
          <span className="text-gold-300">BLEND: LIGHTER · LONG-EXPOSURE SIM</span>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1.5 font-mono text-[10px] text-pink-300">
          <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-pink-300" />
          STACKING
        </div>
      </div>
      <button type="button" onClick={reset}
        className="w-fit border border-warm-black-700 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-chrome-500 transition-colors hover:border-warm-black-500 hover:text-chrome-300">
        ↺ Clear stack
      </button>
    </div>
  );
}
