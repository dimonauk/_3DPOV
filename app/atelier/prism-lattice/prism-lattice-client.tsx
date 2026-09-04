"use client";

/**
 * app/atelier/prism-lattice/prism-lattice-client.tsx
 *
 * React surface for Prism Lattice. Owns the canvas ref, the
 * PrismLatticeScene instance lifecycle, the WebGPU support gate, and
 * the control strip (hue sweep, pulse speed/depth, brightness, spin,
 * density). The scene module is dynamic-imported so PPR pre-render of
 * this page doesn't crash on a top-level reference to `self` from
 * three/webgpu.
 *
 * Reference fix: app/atelier/shape-of-it/shape-of-it-client.tsx.
 */

import { useEffect, useRef, useState } from "react";

import { createLogger, errToObject } from "lib/log";

import {
  DEFAULT_CONTROLS,
  type LatticeControls,
  type LatticeDensity,
  type PrismLatticeScene,
  type SceneStats,
} from "./scene";

const log = createLogger("atelier:prism-lattice");

export default function PrismLatticeClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<PrismLatticeScene | null>(null);
  const [supported, setSupported] = useState<"probing" | "yes" | "no">(
    "probing",
  );
  const [controls, setControlsState] =
    useState<LatticeControls>(DEFAULT_CONTROLS);
  const [stats, setStats] = useState<SceneStats>({
    fps: 0,
    struts: 0,
    joints: 0,
  });

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
        const { PrismLatticeScene } = await import("./scene");
        const scene = await PrismLatticeScene.create(canvas);
        if (cancelled) {
          scene.dispose();
          return;
        }
        sceneRef.current = scene;
        scene.setStatsCallback((s) => setStats(s));
        scene.start();
        setSupported("yes");
      } catch (err) {
        log.error("init failed", { err: errToObject(err) });
        if (!cancelled) setSupported("no");
      }
    })();
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (supported !== "yes") return;
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      sceneRef.current?.resize(canvas);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [supported]);

  const updateControls = (next: Partial<LatticeControls>) => {
    setControlsState((c) => ({ ...c, ...next }));
    sceneRef.current?.setControls(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-grab active:cursor-grabbing"
          aria-label="Prism Lattice — a rotating geodesic sphere of glowing acrylic struts, cycling through the spectrum"
        />
      </div>

      {supported === "probing" && (
        <div className="font-mono text-xs text-chrome-400">
          probing WebGPU support…
        </div>
      )}
      {supported === "no" && <UnsupportedPanel />}

      <StatsBar supported={supported} stats={stats} />
      <ControlsPanel controls={controls} onChange={updateControls} />
    </div>
  );
}

function StatsBar({
  supported,
  stats,
}: {
  supported: "probing" | "yes" | "no";
  stats: SceneStats;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 font-mono text-xs text-chrome-200">
      <div>
        <div className="text-chrome-500">renderer</div>
        <div className="text-chrome-100">
          {supported === "yes"
            ? "WebGPU + TSL"
            : supported === "no"
              ? "n/a"
              : "…"}
        </div>
      </div>
      <div>
        <div className="text-chrome-500">fps</div>
        <div className="text-chrome-100">{stats.fps > 0 ? stats.fps : "—"}</div>
      </div>
      <div>
        <div className="text-chrome-500">struts / joints</div>
        <div className="text-chrome-100">
          {stats.struts || "—"} / {stats.joints || "—"}
        </div>
      </div>
    </div>
  );
}

function ControlsPanel({
  controls,
  onChange,
}: {
  controls: LatticeControls;
  onChange: (next: Partial<LatticeControls>) => void;
}) {
  return (
    <section className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5">
      <div className="chrome-label text-chrome-300">Controls</div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Slider
          label="Spectrum sweep"
          value={controls.hueSpeed}
          min={0}
          max={0.3}
          step={0.005}
          onChange={(v) => onChange({ hueSpeed: v })}
        />
        <Slider
          label="Pulse speed"
          value={controls.pulseSpeed}
          min={0.05}
          max={2}
          step={0.01}
          onChange={(v) => onChange({ pulseSpeed: v })}
        />
        <Slider
          label="Pulse depth"
          value={controls.pulseDepth}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onChange({ pulseDepth: v })}
        />
        <Slider
          label="Brightness"
          value={controls.brightness}
          min={0.3}
          max={2}
          step={0.01}
          onChange={(v) => onChange({ brightness: v })}
        />
        <Slider
          label="Spin speed"
          value={controls.spinSpeed}
          min={0}
          max={0.4}
          step={0.005}
          onChange={(v) => onChange({ spinSpeed: v })}
        />
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[0.7rem] text-chrome-400">
            Density
          </label>
          <div className="flex gap-2">
            {([1, 2] as LatticeDensity[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ density: d })}
                className={`rounded-sm border px-3 py-1 font-mono text-xs ${
                  controls.density === d
                    ? "border-pink-200 text-pink-100"
                    : "border-warm-black-700 text-chrome-300 hover:border-pink-200/40"
                }`}
              >
                {d === 1 ? "80 faces" : "320 faces"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 font-mono text-[0.7rem] text-chrome-400">
      <span>
        {label} <span className="text-chrome-200">{value.toFixed(3)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-pink-300"
      />
    </label>
  );
}

function UnsupportedPanel() {
  return (
    <div className="rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
      <div className="chrome-label">WebGPU not available</div>
      <p className="mt-2">
        Prism Lattice is rendered with Three.js TSL on WebGPU. The browser
        doesn&rsquo;t expose{" "}
        <code className="ml-1 font-mono">navigator.gpu</code>. Try Chrome 113+,
        Edge, or Safari 18+ on a recent device.
      </p>
    </div>
  );
}
