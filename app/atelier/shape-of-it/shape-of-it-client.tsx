"use client";

/**
 * app/atelier/shape-of-it/shape-of-it-client.tsx
 *
 * React surface for The Shape of It. Owns the canvas ref, the
 * ShapeOfItScene instance lifecycle, the WebGPU support gate, and the
 * lightweight stats readout. The scene module is dynamic-imported so
 * PPR pre-render of this page doesn't crash on a top-level reference
 * to `self` from three/webgpu.
 *
 * Reference fix: app/atelier/rig-simulator/rig-simulator-client.tsx
 * and app/atelier/poi-sculptor/poi-sculptor-client.tsx.
 */

import { useEffect, useRef, useState } from "react";

import { CHAMBERS } from "lib/shape-of-it/chambers";
import { THREADS } from "lib/shape-of-it/threads";
import { KNOW_NODES, LIFE_NODES } from "lib/shape-of-it/labyrinth";

import type { SceneStats, ShapeOfItScene } from "./scene";

// TODO(print-bar): chamber is render-only — the WebGPU TSL scene is a
// kinetic memorial of the studio's working history, not a printable
// artefact. No mesh export, and no obvious one to add (the threads /
// chambers / labyrinth nodes are signed-distance walks, not solid
// geometry). PrintBar wiring is skipped here pending a "freeze a
// chamber as a sculpture" affordance — not on the roadmap.

export default function ShapeOfItClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<ShapeOfItScene | null>(null);
  const [supported, setSupported] = useState<"probing" | "yes" | "no">(
    "probing",
  );
  const [stats, setStats] = useState<SceneStats>({
    fps: 0,
    threads: 0,
    chambers: 0,
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
        const { ShapeOfItScene } = await import("./scene");
        const scene = await ShapeOfItScene.create(canvas);
        if (cancelled) {
          scene.dispose();
          return;
        }
        sceneRef.current = scene;
        scene.setStatsCallback((s) => setStats(s));
        scene.start();
        setSupported("yes");
      } catch (err) {
        console.error("[shape-of-it] init failed", err);
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

  return (
    <div className="flex flex-col gap-6">
      <StatsBar supported={supported} stats={stats} />

      <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-grab active:cursor-grabbing"
          aria-label="The Shape of It — animated sculpture of the studio's working history"
        />
      </div>

      {supported === "probing" && (
        <div className="font-mono text-xs text-chrome-400">
          probing WebGPU support…
        </div>
      )}
      {supported === "no" && <UnsupportedPanel />}

      <Legend />
      <ChamberIndex />
      <LabyrinthIndex />
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
    <div className="grid grid-cols-4 gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 font-mono text-xs text-chrome-200">
      <div>
        <div className="text-chrome-500">renderer</div>
        <div className="text-chrome-100">
          {supported === "yes" ? "WebGPU + TSL" : supported === "no" ? "n/a" : "…"}
        </div>
      </div>
      <div>
        <div className="text-chrome-500">fps</div>
        <div className="text-chrome-100">{stats.fps > 0 ? stats.fps : "—"}</div>
      </div>
      <div>
        <div className="text-chrome-500">threads</div>
        <div className="text-chrome-100">{THREADS.length}</div>
      </div>
      <div>
        <div className="text-chrome-500">chambers</div>
        <div className="text-chrome-100">{CHAMBERS.length}</div>
      </div>
    </div>
  );
}

function UnsupportedPanel() {
  return (
    <div className="rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
      <div className="chrome-label">WebGPU not available</div>
      <p className="mt-2">
        The Shape of It is rendered with Three.js TSL on WebGPU. The
        browser doesn&rsquo;t expose
        <code className="ml-1 font-mono">navigator.gpu</code>. Try
        Chrome 113+, Edge, or Safari 18+ on a recent device.
      </p>
    </div>
  );
}

function Legend() {
  return (
    <section className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5">
      <div className="chrome-label text-chrome-300">Six brushes</div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs text-chrome-300 md:grid-cols-3">
        {THREADS.map((th) => {
          const hex = rgbToHex(th.col);
          return (
            <li key={th.name} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2 w-4 rounded-sm"
                style={{
                  backgroundColor: hex,
                  boxShadow: `0 0 6px ${hex}`,
                }}
              />
              <span>{th.name.toLowerCase()}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ChamberIndex() {
  return (
    <section className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5">
      <div className="chrome-label text-chrome-300">Nine chambers</div>
      <ol className="mt-3 space-y-1.5 font-mono text-xs text-chrome-300">
        {CHAMBERS.map((ch) => {
          const hex = `#${ch.hex.toString(16).padStart(6, "0")}`;
          return (
            <li key={ch.id} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: hex }}
              />
              <span className="text-chrome-100">{ch.name}</span>
              <span className="text-chrome-500">— {ch.sub}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function LabyrinthIndex() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5">
        <div className="chrome-label text-chrome-300">
          Knowledge labyrinth — {KNOW_NODES.length} nodes
        </div>
        <ul className="mt-3 space-y-1 font-mono text-[0.7rem] text-chrome-400">
          {KNOW_NODES.map((n) => (
            <li key={n.id} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: rgbToHex(n.col) }}
              />
              <span className="text-chrome-200">{n.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5">
        <div className="chrome-label text-chrome-300">
          Life labyrinth — {LIFE_NODES.length} nodes
        </div>
        <ul className="mt-3 space-y-1 font-mono text-[0.7rem] text-chrome-400">
          {LIFE_NODES.map((n) => (
            <li key={n.id} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: rgbToHex(n.col) }}
              />
              <span className="text-chrome-200">{n.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function rgbToHex(rgb: readonly [number, number, number]): string {
  const r = Math.round(Math.max(0, Math.min(1, rgb[0])) * 255);
  const g = Math.round(Math.max(0, Math.min(1, rgb[1])) * 255);
  const b = Math.round(Math.max(0, Math.min(1, rgb[2])) * 255);
  return `#${[r, g, b]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}
