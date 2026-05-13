"use client";

/**
 * components/visualiser/reaction-diffusion-shell.tsx — Gray-Scott RD live visualiser.
 *
 * One-line role: simulate Gray-Scott on a 128×128 grid, render with Canvas2D, expose F/k controls + presets.
 * Full purpose in reaction-diffusion-shell.PURPOSE.md.
 */

import { useEffect, useMemo, useRef, useState } from "react";

const N = 128;
const DU = 1.0;
const DV = 0.5;
const DT = 1.0;

type Preset = { label: string; F: number; k: number; note: string };

const PRESETS: readonly Preset[] = [
  { label: "leopard", F: 0.055, k: 0.062, note: "default spots" },
  { label: "mitosis", F: 0.0367, k: 0.0649, note: "cells split" },
  { label: "coral", F: 0.0545, k: 0.062, note: "pulsing growth" },
  { label: "solitons", F: 0.03, k: 0.062, note: "stable blobs" },
  { label: "spirals", F: 0.014, k: 0.054, note: "rotating waves" },
];

function seed(u: Float32Array, v: Float32Array): void {
  u.fill(1);
  v.fill(0);
  const cx = N / 2;
  const cy = N / 2;
  const r = 8;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        u[y * N + x] = 0.5;
        v[y * N + x] = 0.25;
      }
    }
  }
}

function step(
  u: Float32Array,
  v: Float32Array,
  un: Float32Array,
  vn: Float32Array,
  F: number,
  k: number,
): void {
  for (let y = 0; y < N; y++) {
    const yp = (y + 1) % N;
    const ym = (y - 1 + N) % N;
    for (let x = 0; x < N; x++) {
      const xp = (x + 1) % N;
      const xm = (x - 1 + N) % N;
      const i = y * N + x;
      const uVal = u[i] ?? 1;
      const vVal = v[i] ?? 0;
      const lapU =
        (u[y * N + xp] ?? 1) +
        (u[y * N + xm] ?? 1) +
        (u[yp * N + x] ?? 1) +
        (u[ym * N + x] ?? 1) -
        4 * uVal;
      const lapV =
        (v[y * N + xp] ?? 0) +
        (v[y * N + xm] ?? 0) +
        (v[yp * N + x] ?? 0) +
        (v[ym * N + x] ?? 0) -
        4 * vVal;
      const reaction = uVal * vVal * vVal;
      un[i] = uVal + DT * (DU * lapU - reaction + F * (1 - uVal));
      vn[i] = vVal + DT * (DV * lapV + reaction - (F + k) * vVal);
    }
  }
}

function paint(ctx: CanvasRenderingContext2D, v: Float32Array): void {
  const img = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const val = Math.max(0, Math.min(1, v[i] ?? 0));
    const r = Math.round(20 + val * 235);
    const g = Math.round(10 + val * 90);
    const b = Math.round(40 + val * 195);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export default function ReactionDiffusionShell() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buffersRef = useRef<{ u: Float32Array; v: Float32Array; un: Float32Array; vn: Float32Array } | null>(null);
  const [F, setF] = useState(0.055);
  const [k, setK] = useState(0.062);
  const [running, setRunning] = useState(true);
  const [generation, setGeneration] = useState(0);

  const buffers = useMemo(() => {
    const u = new Float32Array(N * N);
    const v = new Float32Array(N * N);
    seed(u, v);
    return { u, v, un: new Float32Array(N * N), vn: new Float32Array(N * N) };
  }, []);

  useEffect(() => {
    buffersRef.current = buffers;
  }, [buffers]);

  useEffect(() => {
    if (generation > 0) {
      const b = buffersRef.current;
      if (b) seed(b.u, b.v);
    }
  }, [generation]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const canvas = canvasRef.current;
      const b = buffersRef.current;
      if (!canvas || !b) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (running) {
        step(b.u, b.v, b.un, b.vn, F, k);
        [b.u, b.un] = [b.un, b.u];
        [b.v, b.vn] = [b.vn, b.v];
      }
      paint(ctx, b.v);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [F, k, running]);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={N}
        height={N}
        className="mx-auto h-[420px] w-[420px] border border-warm-black-800 [image-rendering:pixelated]"
      />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="chrome-label mr-1">preset</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setF(p.F);
              setK(p.k);
              setGeneration((g) => g + 1);
            }}
            className="rounded-sm border border-warm-black-800 px-3 py-1 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            title={p.note}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="ml-2 rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-1 text-pink-100 hover:border-pink-200"
        >
          {running ? "pause" : "run"}
        </button>
        <button
          type="button"
          onClick={() => setGeneration((g) => g + 1)}
          className="rounded-sm border border-warm-black-800 px-3 py-1 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        >
          reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-chrome-300">
          <span className="font-mono">F (feed) = {F.toFixed(4)}</span>
          <input
            type="range"
            min={0.01}
            max={0.08}
            step={0.0005}
            value={F}
            onChange={(e) => setF(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-chrome-300">
          <span className="font-mono">k (kill) = {k.toFixed(4)}</span>
          <input
            type="range"
            min={0.04}
            max={0.075}
            step={0.0005}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
