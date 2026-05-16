"use client";

/**
 * app/atelier/isosurface/isosurface-client.tsx
 *
 * Live WebGPU marching-cubes chamber. The runner module is dynamic-
 * imported so PPR pre-render of this route doesn't try to evaluate
 * raw-WebGPU code in a Node environment, and so the chamber gracefully
 * degrades on browsers that don't expose `navigator.gpu`. The compute
 * + render pipelines live in `lib/webgpu-marching-cubes/`; this
 * component owns the canvas, the controls, the orbit-camera input,
 * and the rAF loop.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";
import type { IsosurfaceRunner } from "lib/webgpu-marching-cubes/runner";

const log = createLogger("atelier:isosurface");

type Support = "probing" | "yes" | "no";

type Shape = "sphere" | "torus" | "gyroid";

const SHAPES: ReadonlyArray<{ id: Shape; label: string; hint: string }> = [
  { id: "sphere", label: "Sphere", hint: "The starting point. A unit sphere of radius 0.7." },
  { id: "torus", label: "Torus", hint: "Ring of major radius 0.6, minor radius 0.22." },
  { id: "gyroid", label: "Gyroid", hint: "Triply-periodic. The studio's waveguide surface." },
];

const RESOLUTIONS: ReadonlyArray<32 | 64 | 128> = [32, 64, 128];

type Stats = {
  triCount: number;
  vertexCount: number;
  generationMs: number;
  resolution: number;
  capacityHit: boolean;
};

export default function IsosurfaceClient() {
  useActiveChamber("isosurface");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runnerRef = useRef<IsosurfaceRunner | null>(null);
  const rafRef = useRef<number | null>(null);

  const [supported, setSupported] = useState<Support>("probing");
  const [shape, setShape] = useState<Shape>("gyroid");
  const [threshold, setThreshold] = useState(0);
  const [resolution, setResolution] = useState<32 | 64 | 128>(64);
  const [stats, setStats] = useState<Stats>({
    triCount: 0,
    vertexCount: 0,
    generationMs: 0,
    resolution: 64,
    capacityHit: false,
  });

  // Convert (single-pick shape, threshold) into runner params. Single-
  // pick is the V1 UI; the underlying runner supports continuous
  // blending, so a later revision can expose mix sliders here.
  const params = useMemo(
    () => ({
      resolution,
      threshold,
      wSphere: shape === "sphere" ? 1 : 0,
      wTorus: shape === "torus" ? 1 : 0,
      wGyroid: shape === "gyroid" ? 1 : 0,
    }),
    [shape, threshold, resolution],
  );

  // --- Mount / unmount the runner -----------------------------------------
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("gpu" in navigator)) {
      setSupported("no");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Size the drawing buffer to the canvas's CSS box × DPR so the
        // visitor isn't looking at upscaled blocky pixels on a Retina
        // screen.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);

        const { IsosurfaceRunner } = await import(
          "lib/webgpu-marching-cubes/runner"
        );
        const runner = await IsosurfaceRunner.create(canvas);
        if (cancelled) {
          runner.destroy();
          return;
        }
        runnerRef.current = runner;
        runner.setParams(params);
        setSupported("yes");

        const loop = async () => {
          if (cancelled) return;
          try {
            await runner.frame();
            setStats(runner.getStats());
          } catch (err) {
            log.error("frame error", { err });
          }
          rafRef.current = requestAnimationFrame(() => {
            void loop();
          });
        };
        rafRef.current = requestAnimationFrame(() => {
          void loop();
        });
      } catch (err) {
        log.error("init failed", { err });
        if (!cancelled) setSupported("no");
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      runnerRef.current?.destroy();
      runnerRef.current = null;
    };
    // Mount-once: params drives a separate effect that calls
    // runner.setParams(); this effect owns the GPU device lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Push parameter changes through (debounced) -------------------------
  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner || supported !== "yes") return;
    const handle = window.setTimeout(() => {
      runner.setParams(params);
    }, 60);
    return () => window.clearTimeout(handle);
  }, [params, supported]);

  // --- Resize handler -----------------------------------------------------
  useEffect(() => {
    if (supported !== "yes") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(Math.floor(rect.width * dpr), 1);
      const h = Math.max(Math.floor(rect.height * dpr), 1);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [supported]);

  // --- Orbit camera input -------------------------------------------------
  const draggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const last = lastPosRef.current;
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    runnerRef.current?.orbit(-dx * 0.008, -dy * 0.008);
  }, []);
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    lastPosRef.current = null;
    try {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      /* the browser may have already released it */
    }
  }, []);
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 1 / 1.08;
    runnerRef.current?.zoom(factor);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
        <CanvasFrame
          canvasRef={canvasRef}
          supported={supported}
          stats={stats}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        />

        <Controls
          shape={shape}
          threshold={threshold}
          resolution={resolution}
          stats={stats}
          supported={supported}
          onShape={setShape}
          onThreshold={setThreshold}
          onResolution={setResolution}
        />
      </div>

      {supported === "no" && <UnsupportedPanel />}
      {supported === "probing" && (
        <div className="font-mono text-xs text-chrome-400">
          probing WebGPU support&hellip;
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function CanvasFrame({
  canvasRef,
  supported,
  stats,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  supported: Support;
  stats: Stats;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
}) {
  return (
    <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        aria-label="Isosurface — drag to orbit, scroll to zoom"
      />
      {supported === "yes" && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
          <span>
            {stats.triCount.toLocaleString()} tri &middot; {stats.generationMs.toFixed(1)} ms gen
          </span>
          <span className="text-chrome-500">
            {stats.resolution}&times;{stats.resolution}&times;{stats.resolution} &middot; WebGPU only
          </span>
        </div>
      )}
      {stats.capacityHit && supported === "yes" && (
        <div className="absolute right-2 top-2 rounded-sm border border-rose-300/40 bg-warm-black-950/85 px-2 py-1 font-mono text-[0.65rem] text-rose-200">
          vertex buffer full &mdash; lower the threshold
        </div>
      )}
    </div>
  );
}

function Controls({
  shape,
  threshold,
  resolution,
  stats,
  supported,
  onShape,
  onThreshold,
  onResolution,
}: {
  shape: Shape;
  threshold: number;
  resolution: 32 | 64 | 128;
  stats: Stats;
  supported: Support;
  onShape: (s: Shape) => void;
  onThreshold: (v: number) => void;
  onResolution: (r: 32 | 64 | 128) => void;
}) {
  const disabled = supported !== "yes";
  return (
    <div className="flex flex-col gap-5 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 font-mono text-xs text-chrome-200">
      <div>
        <div className="chrome-label text-chrome-400">Field</div>
        <div className="mt-2 flex flex-col gap-1.5">
          {SHAPES.map((s) => (
            <label
              key={s.id}
              className={`flex items-baseline gap-2 rounded-sm border px-2 py-1.5 ${
                shape === s.id
                  ? "border-pink-200/60 bg-warm-black-950/50 text-chrome-100"
                  : "border-warm-black-800 bg-transparent text-chrome-300 hover:border-warm-black-700"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="iso-shape"
                value={s.id}
                checked={shape === s.id}
                disabled={disabled}
                onChange={() => onShape(s.id)}
                className="accent-pink-200"
              />
              <span>{s.label}</span>
              <span className="ml-auto text-[0.6rem] text-chrome-500">
                {s.id}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[0.65rem] text-chrome-500">
          {SHAPES.find((s) => s.id === shape)?.hint}
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="chrome-label text-chrome-400">Threshold</span>
          <span className="text-chrome-100">{threshold.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={threshold}
          disabled={disabled}
          onChange={(e) => onThreshold(parseFloat(e.target.value))}
          className="mt-2 w-full accent-pink-200"
        />
        <p className="mt-1 text-[0.65rem] text-chrome-500">
          The isosurface level. The mesh is the place where the field
          equals this number.
        </p>
      </div>

      <div>
        <div className="chrome-label text-chrome-400">Resolution</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {RESOLUTIONS.map((r) => (
            <button
              key={r}
              type="button"
              disabled={disabled}
              onClick={() => onResolution(r)}
              className={`rounded-sm border px-2 py-1.5 ${
                resolution === r
                  ? "border-pink-200/60 bg-warm-black-950/50 text-chrome-100"
                  : "border-warm-black-800 text-chrome-300 hover:border-warm-black-700"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              {r}
              <sup className="ml-0.5 text-[0.55rem] text-chrome-500">3</sup>
            </button>
          ))}
        </div>
        <p className="mt-1 text-[0.65rem] text-chrome-500">
          Grid cells per axis. 128 is the heavy option &mdash; about
          2&nbsp;million cells.
        </p>
      </div>

      <div className="rounded-sm border border-warm-black-800 bg-warm-black-950/50 p-3">
        <div className="chrome-label text-chrome-400">Stats</div>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-[0.7rem]">
          <dt className="text-chrome-500">triangles</dt>
          <dd className="text-right text-chrome-100">
            {stats.triCount.toLocaleString()}
          </dd>
          <dt className="text-chrome-500">vertices</dt>
          <dd className="text-right text-chrome-100">
            {stats.vertexCount.toLocaleString()}
          </dd>
          <dt className="text-chrome-500">gen time</dt>
          <dd className="text-right text-chrome-100">
            {stats.generationMs.toFixed(1)} ms
          </dd>
          <dt className="text-chrome-500">grid</dt>
          <dd className="text-right text-chrome-100">
            {stats.resolution}&sup3;
          </dd>
        </dl>
      </div>

      <p className="text-[0.65rem] text-chrome-500">
        Drag inside the canvas to orbit; scroll to zoom. The mesh
        regenerates whenever a control changes.
      </p>
    </div>
  );
}

function UnsupportedPanel() {
  return (
    <div className="rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
      <div className="chrome-label">WebGPU not available</div>
      <p className="mt-2">
        This chamber runs marching cubes directly on the GPU through
        the raw WebGPU API. The browser doesn&rsquo;t expose
        <code className="ml-1 font-mono">navigator.gpu</code>. Try
        Chrome 113+, Edge, Firefox 141+, or Safari Tech Preview on a
        recent device.
      </p>
    </div>
  );
}
