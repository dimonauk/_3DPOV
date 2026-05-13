"use client";

/**
 * components/visualiser/caustic-projector-shell.tsx — Snell's-Law forward caustic visualiser.
 *
 * One-line role: trace 1024 parallel rays through a curved top surface, refract via Snell's Law, paint the per-pixel hit count on the screen below.
 * Full purpose in caustic-projector-shell.PURPOSE.md.
 */

import { useEffect, useRef, useState } from "react";

const N_RAYS = 1024;
const SCREEN_W = 512;
const SURFACE_HEIGHT = 80; // pixels — vertical position of the curve in canvas
const SCREEN_Y = 480; // pixels — where the screen sits in canvas
const N_TOP = 1.0;
const N_BOTTOM_DEFAULT = 1.5;

type SurfaceParams = {
  amplitude: number; // pixels
  wavelength: number; // pixels per cycle
  phase: number;
  ior: number;
};

/** Surface height y at horizontal position x (canvas-pixel coords). */
function surfaceY(x: number, p: SurfaceParams): number {
  return SURFACE_HEIGHT + p.amplitude * Math.sin((2 * Math.PI * x) / p.wavelength + p.phase);
}

/** Surface tangent slope dy/dx at x (small-finite-difference). */
function surfaceSlope(x: number, p: SurfaceParams): number {
  return (p.amplitude * (2 * Math.PI) / p.wavelength) *
    Math.cos((2 * Math.PI * x) / p.wavelength + p.phase);
}

/** Trace one downward ray; return the x position where it hits the screen. */
function traceRay(rayX: number, p: SurfaceParams): number {
  const ySurf = surfaceY(rayX, p);
  const slope = surfaceSlope(rayX, p);
  // Surface normal: (-slope, 1) normalised. Pointing up + along surface.
  const nLen = Math.hypot(slope, 1);
  const nx = -slope / nLen;
  const ny = 1 / nLen;
  // Incident ray is going straight down: direction (0, 1).
  // cos(theta_i) = dot(incident, -normal) = -ny  (since -normal = (slope, -1)/nLen)
  // But easier: angle between incident and normal.
  const cosI = -((0) * (-nx) + (1) * (-ny)); // dot((0,1), (-nx,-ny))
  const eta = N_TOP / p.ior;
  const k = 1 - eta * eta * (1 - cosI * cosI);
  if (k < 0) {
    // Total internal reflection (rare for top-down rays into denser); bail.
    return rayX;
  }
  const cosT = Math.sqrt(k);
  // Refracted direction = eta * I + (eta*cosI - cosT) * N  (N facing into medium 2)
  // N here points DOWN into the medium (away from incident origin): (nx, ny) is the upward normal; the inward normal is (-nx, -ny).
  const Nx = -nx;
  const Ny = -ny;
  const tx = eta * 0 + (eta * cosI - cosT) * Nx;
  const ty = eta * 1 + (eta * cosI - cosT) * Ny;
  // Continue from (rayX, ySurf) with direction (tx, ty) until y = SCREEN_Y.
  const distY = SCREEN_Y - ySurf;
  if (ty <= 0) return rayX;
  const hitX = rayX + (tx / ty) * distY;
  return hitX;
}

function paint(
  ctx: CanvasRenderingContext2D,
  p: SurfaceParams,
  canvasWidth: number,
): void {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, canvasWidth, SCREEN_Y + 20);

  // Surface curve.
  ctx.strokeStyle = "rgba(255, 102, 204, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= canvasWidth; x += 2) {
    const y = surfaceY(x, p);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Screen line.
  ctx.strokeStyle = "rgba(180, 180, 220, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, SCREEN_Y);
  ctx.lineTo(canvasWidth, SCREEN_Y);
  ctx.stroke();

  // Trace rays + accumulate histogram.
  const bins = new Uint16Array(SCREEN_W);
  ctx.strokeStyle = "rgba(255, 102, 204, 0.06)";
  ctx.beginPath();
  for (let i = 0; i < N_RAYS; i++) {
    const rayX = (i / (N_RAYS - 1)) * canvasWidth;
    const hitX = traceRay(rayX, p);
    ctx.moveTo(rayX, 0);
    ctx.lineTo(rayX, surfaceY(rayX, p));
    const binX = Math.floor((hitX / canvasWidth) * SCREEN_W);
    if (binX >= 0 && binX < SCREEN_W) {
      const cur = bins[binX] ?? 0;
      bins[binX] = cur + 1;
    }
  }
  ctx.stroke();

  // Caustic histogram bar.
  let max = 1;
  for (let b = 0; b < SCREEN_W; b++) max = Math.max(max, bins[b] ?? 0);
  const barH = 60;
  for (let b = 0; b < SCREEN_W; b++) {
    const intensity = Math.min(1, ((bins[b] ?? 0) / max) * 1.4);
    const r = Math.round(20 + intensity * 235);
    const g = Math.round(10 + intensity * 102);
    const blue = Math.round(40 + intensity * 164);
    ctx.fillStyle = `rgb(${r}, ${g}, ${blue})`;
    const px = (b / SCREEN_W) * canvasWidth;
    const pw = canvasWidth / SCREEN_W + 0.5;
    ctx.fillRect(px, SCREEN_Y + 2, pw, barH);
  }
}

export default function CausticProjectorShell() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [amplitude, setAmplitude] = useState(28);
  const [wavelength, setWavelength] = useState(140);
  const [ior, setIor] = useState(N_BOTTOM_DEFAULT);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paint(ctx, { amplitude, wavelength, phase, ior }, canvas.width);
  }, [amplitude, wavelength, phase, ior]);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={SCREEN_W}
        height={SCREEN_Y + 80}
        className="mx-auto w-full max-w-[640px] border border-warm-black-800"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-chrome-300">
          <span className="font-mono">amplitude = {amplitude.toFixed(1)} px</span>
          <input
            type="range"
            min={0}
            max={50}
            step={0.5}
            value={amplitude}
            onChange={(e) => setAmplitude(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-chrome-300">
          <span className="font-mono">wavelength = {wavelength.toFixed(0)} px</span>
          <input
            type="range"
            min={60}
            max={300}
            step={2}
            value={wavelength}
            onChange={(e) => setWavelength(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-chrome-300">
          <span className="font-mono">IOR = {ior.toFixed(2)}</span>
          <input
            type="range"
            min={1.01}
            max={1.9}
            step={0.01}
            value={ior}
            onChange={(e) => setIor(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-chrome-300">
          <span className="font-mono">phase = {phase.toFixed(2)} rad</span>
          <input
            type="range"
            min={0}
            max={Math.PI * 2}
            step={0.01}
            value={phase}
            onChange={(e) => setPhase(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
