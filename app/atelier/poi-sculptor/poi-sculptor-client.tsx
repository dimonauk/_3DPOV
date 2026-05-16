"use client";

/**
 * app/atelier/poi-sculptor/poi-sculptor-client.tsx
 *
 * React surface for the Poi Sculptor demo. Owns the canvas ref, the
 * UI state, and the PoiSculptorScene instance lifecycle. The scene
 * core is dynamic-imported so PPR pre-render of this page doesn't
 * crash on a top-level reference to `self` from three/webgpu.
 *
 * Reference fix: app/atelier/rig-simulator/rig-simulator-client.tsx
 * (commit 6d53c32).
 */

import { useCallback, useEffect, useRef, useState } from "react";

import PrintBar from "components/commerce/print-bar";
import { exportGLB, exportSTL } from "lib/poi-sculptor/export";

import { Controls, type ControlsState } from "./controls";
import { PrintDrawer } from "./print-drawer";
import type { PoiSculptorScene, SceneStats } from "./scene";

type LastExport = {
  kind: "stl" | "glb";
  url: string;
  filename: string;
};

const INITIAL_STATE: ControlsState = {
  move: "butterfly",
  materialIdx: 0,
  anchorPath: "static",
  anchorSpeed: 0.3,
  heat: 0.75,
  rim: 0.8,
  pulse: 0.55,
  thick: 1.0,
  curl: 0.65,
  bloom: true,
  film: true,
};

export default function PoiSculptorClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<PoiSculptorScene | null>(null);
  const [supported, setSupported] = useState<"probing" | "yes" | "no">("probing");
  const [state, setState] = useState<ControlsState>(INITIAL_STATE);
  const [stats, setStats] = useState<SceneStats>({
    vertexCount: 0,
    particleCount: 0,
    fps: 0,
  });
  // Most recent export, kept on a stable blob URL so the PrintBar can
  // quote against it. Revoked on replacement + on unmount.
  const [lastExport, setLastExport] = useState<LastExport | null>(null);

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
        const { PoiSculptorScene } = await import("./scene");
        const scene = await PoiSculptorScene.create(canvas);
        if (cancelled) {
          scene.dispose();
          return;
        }
        sceneRef.current = scene;
        scene.setStatsCallback((s) => setStats(s));
        scene.setAnchorSpeed(INITIAL_STATE.anchorSpeed);
        scene.start();
        setSupported("yes");
      } catch (err) {
        console.error("[poi-sculptor] init failed", err);
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

  const onMove = useCallback((id: string) => {
    setState((s) => ({ ...s, move: id }));
    sceneRef.current?.setMove(id);
  }, []);
  const onMaterial = useCallback((idx: number) => {
    setState((s) => ({ ...s, materialIdx: idx }));
    sceneRef.current?.setMaterialIndex(idx);
  }, []);
  const onAnchorPath = useCallback((id: string) => {
    setState((s) => ({ ...s, anchorPath: id }));
    sceneRef.current?.setAnchorPath(id);
  }, []);
  const onAnchorSpeed = useCallback((v: number) => {
    setState((s) => ({ ...s, anchorSpeed: v }));
    sceneRef.current?.setAnchorSpeed(v);
  }, []);
  const onUniform = useCallback(
    (key: "heat" | "rim" | "pulse" | "thick" | "curl", v: number) => {
      setState((s) => ({ ...s, [key]: v }));
      if (key === "curl") return;
      const map = { heat: "uHeat", rim: "uRim", pulse: "uPulse", thick: "uThick" } as const;
      sceneRef.current?.setUniform(map[key], v);
    },
    [],
  );
  const onFx = useCallback((key: "bloom" | "film", v: boolean) => {
    setState((s) => {
      const next = { ...s, [key]: v };
      sceneRef.current?.setFx({ bloom: next.bloom, film: next.film });
      return next;
    });
  }, []);

  const onExportSTL = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    void (async () => {
      const result = await exportSTL(
        scene.getTrailGroup(),
        state.move,
        scene.getCurrentMaterial(),
      );
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      setLastExport((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { kind: "stl", url, filename: result.filename };
      });
    })();
  }, [state.move]);
  const onExportGLB = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    void (async () => {
      const result = await exportGLB(
        scene.getTrailGroup(),
        state.move,
        scene.getCurrentMaterial(),
      );
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      setLastExport((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { kind: "glb", url, filename: result.filename };
      });
    })();
  }, [state.move]);

  // Revoke the last export's blob URL on unmount so the chamber doesn't
  // leak a Blob URL into the browser's URL table.
  useEffect(() => {
    return () => {
      if (lastExport) URL.revokeObjectURL(lastExport.url);
    };
    // Intentionally only on unmount — the replacement inside the export
    // handlers handles mid-life swaps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <StatsBar supported={supported} stats={stats} />

      <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          aria-label="Animated poi sculpture"
        />
      </div>

      {supported === "probing" && (
        <div className="font-mono text-xs text-chrome-400">
          probing WebGPU support…
        </div>
      )}
      {supported === "no" && <UnsupportedPanel />}

      <Controls
        state={state}
        handlers={{ onMove, onMaterial, onAnchorPath, onAnchorSpeed, onUniform, onFx }}
        disabled={supported !== "yes"}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onExportSTL}
          disabled={supported !== "yes"}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 hover:bg-pink-200/20 disabled:opacity-40"
        >
          export STL
        </button>
        <button
          type="button"
          onClick={onExportGLB}
          disabled={supported !== "yes"}
          className="rounded-sm border border-warm-black-700 px-5 py-2 chrome-label text-chrome-300 hover:border-pink-200/60 disabled:opacity-40"
        >
          export GLB
        </button>
      </div>

      {lastExport ? (
        <PrintBar
          source={{
            kind: lastExport.kind,
            url: lastExport.url,
            label: lastExport.filename,
          }}
        />
      ) : null}

      <PrintDrawer />
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
          {supported === "yes" ? "WebGPU" : supported === "no" ? "n/a" : "…"}
        </div>
      </div>
      <div>
        <div className="text-chrome-500">vertices</div>
        <div className="text-chrome-100">
          {stats.vertexCount > 0 ? stats.vertexCount.toLocaleString() : "—"}
        </div>
      </div>
      <div>
        <div className="text-chrome-500">fps</div>
        <div className="text-chrome-100">{stats.fps > 0 ? stats.fps : "—"}</div>
      </div>
    </div>
  );
}

function UnsupportedPanel() {
  return (
    <div className="rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
      <div className="chrome-label">WebGPU not available</div>
      <p className="mt-2">
        This demo uses Three.js TSL + WebGPU for compute particles and an
        emissive trail surface. The browser doesn&rsquo;t expose
        <code className="ml-1 font-mono">navigator.gpu</code>. Try Chrome
        113+ / Edge / Safari 18+ on a recent device.
      </p>
    </div>
  );
}
