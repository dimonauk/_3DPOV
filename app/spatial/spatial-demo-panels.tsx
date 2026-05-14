"use client";

/**
 * app/spatial/spatial-demo-panels.tsx — Presentational sub-views for the
 * 2D→3D demo: ResultPanel (depth/left/right thumbnails), IdlePanel (probe
 * gate), UnsupportedPanel (no-WebGPU explainer). State + lifecycle lives
 * in the parent.
 */

import { useEffect, useRef } from "react";

import type { DepthSupport } from "./spatial-demo-pipeline";

export function ResultPanel({
  label,
  canvas,
  hint,
}: {
  label: string;
  canvas: HTMLCanvasElement;
  hint?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerHTML = "";
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.display = "block";
    node.appendChild(canvas);
  }, [canvas]);
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-950 p-2">
      <div className="flex items-baseline justify-between text-[10px]">
        <span className="chrome-label">{label}</span>
        {hint && <span className="font-mono text-chrome-500">{hint}</span>}
      </div>
      <div ref={ref} className="mt-2" />
    </div>
  );
}

export function IdlePanel({ onProbe }: { onProbe: () => void }) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-center">
      <h2 className="text-2xl text-chrome-100">Feature-detect first</h2>
      <p className="mt-3 max-w-xl mx-auto text-sm text-chrome-300">
        The 2D&rarr;3D pipeline downloads a 50&thinsp;MB depth model to your
        phone. The studio doesn&rsquo;t want to run that download for devices
        where the model can&rsquo;t run usefully (iOS Safari &le; 25 without
        WebGPU). Tap below to check support on this device.
      </p>
      <button
        type="button"
        onClick={onProbe}
        className="mt-6 rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 hover:border-pink-200"
      >
        check device support &rarr;
      </button>
    </div>
  );
}

export function UnsupportedPanel({
  support,
  probing,
}: {
  support: DepthSupport | null;
  probing: boolean;
}) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-sm text-chrome-300">
      <h2 className="text-xl text-chrome-100">
        {probing ? "Checking…" : "Not recommended on this device"}
      </h2>
      {support && (
        <p className="mt-3 max-w-xl">
          WebGPU: {support.webgpu ? "yes" : "no"} &middot; WebGL:{" "}
          {support.webgl ? "yes" : "no"} &middot; recommended backend:{" "}
          <span className="font-mono">{support.recommendedBackend}</span>
          {support.reason && (
            <span>
              <br />
              <span className="text-chrome-400">{support.reason}</span>
            </span>
          )}
        </p>
      )}
      <p className="mt-4 text-chrome-400">
        You can still commission a SHARP conversion via the studio&rsquo;s
        GPU &mdash; same input, higher quality, requires the bench. Use{" "}
        <span className="font-mono text-chrome-200">/contact</span> with
        subject &ldquo;SHARP commission&rdquo;.
      </p>
    </div>
  );
}
