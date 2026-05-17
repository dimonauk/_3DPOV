"use client";

/**
 * app/atelier/modal-lattice/modal-lattice-client.tsx
 *
 * Lattice deformer in R3F. A base mesh (sphere / torus / icosa) is
 * captured at rest. A 3D grid of control points (counts U x V x W)
 * is laid over its bounding box; each rest-space vertex is mapped to
 * normalised lattice coordinates (u,v,w in [0,1]^3). At render time
 * the deformed vertex is the tensor-product interpolation of the
 * control points at (u,v,w), using one of four kernels — the four
 * Blender exposes: linear, b-spline (uniform cubic, smoothed),
 * cardinal (interpolating, tension), catmull-rom (interpolating,
 * tangent-continuous).
 *
 * Math note: cardinal + catmull-rom are interpolating (the deformed
 * surface passes through unperturbed control points), b-spline is
 * approximating (it smooths through them). Linear is straight
 * trilinear. All four implemented as separable 1D kernels evaluated
 * along U, V, W axes.
 *
 * Orchestrator only. Types + kernel/shape registries in
 * modal-lattice/types.ts; kernel weights in kernels.ts; lattice
 * build + deform in lattice.ts; mesh factories in shape-factory.ts;
 * R3F scene + ResizeBump in lattice-scene.tsx; Slider/Stat helpers
 * in sub-controls.tsx. Per ARCHITECTURE.md Rule 1.
 *
 * Original concept: Yann Terrer (Tyo-79)'s Blender modal-lattice-
 * resolution-v2 addon. Same affordances, web register.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useState } from "react";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

import { LatticeScene, ResizeBump } from "./modal-lattice/lattice-scene";
import { Slider, Stat, clampDim } from "./modal-lattice/sub-controls";
import {
  INITIAL_DIMS,
  KERNELS,
  type Kernel,
  type LatticeDims,
  SHAPES,
  type Shape,
} from "./modal-lattice/types";

const log = createLogger("atelier:modal-lattice");

// TODO(print-bar): chamber is render-only — the deformed mesh lives
// only as a live R3F buffer that mutates each frame. Wire <PrintBar
// source={{ kind: "glb", url, label }} /> at the bottom once a "freeze
// + export GLB" affordance lands. The current frame's positions buffer
// is already in hand (`liveVerts` inside LatticeScene); the missing
// step is freezing, indexing, GLTFExporter, and `pushAtelierOutput`
// plumbing.

export default function ModalLatticeClient() {
  useActiveChamber("modal-lattice");

  const [dims, setDims] = useState<LatticeDims>(INITIAL_DIMS);
  const [kernel, setKernel] = useState<Kernel>("catmull");
  const [shape, setShape] = useState<Shape>("sphere");
  const [amplitude, setAmplitude] = useState(0.6);
  const [animate, setAnimate] = useState(true);

  const setU = useCallback(
    (n: number) => setDims((d) => ({ ...d, u: clampDim(n) })),
    [],
  );
  const setV = useCallback(
    (n: number) => setDims((d) => ({ ...d, v: clampDim(n) })),
    [],
  );
  const setW = useCallback(
    (n: number) => setDims((d) => ({ ...d, w: clampDim(n) })),
    [],
  );

  const onReset = useCallback(() => {
    setDims(INITIAL_DIMS);
    setKernel("catmull");
    setAmplitude(0.6);
    log.info("reset to defaults");
  }, []);

  // Keyboard shortcuts mirroring the Blender modal operator:
  //   Ctrl+L linear, B b-spline, C cardinal, R catmull-rom,
  //   Numpad 1..9 set all dims to N (cap at 8 here),
  //   Numpad 0 reset to 2x2x2.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      )
        return;
      if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        setKernel("linear");
        e.preventDefault();
        return;
      }
      if (e.key === "b" || e.key === "B") setKernel("bspline");
      else if (e.key === "c" || e.key === "C") setKernel("cardinal");
      else if (e.key === "r" || e.key === "R") setKernel("catmull");
      else if (e.key >= "0" && e.key <= "9") {
        const n = Number(e.key);
        if (n === 0) setDims({ u: 2, v: 2, w: 2 });
        else setDims({ u: clampDim(n), v: clampDim(n), w: clampDim(n) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 font-mono text-xs text-chrome-200 md:grid-cols-4">
        <Stat label="control points" value={dims.u * dims.v * dims.w} />
        <Stat label="kernel" value={kernel} />
        <Stat label="shape" value={shape} />
        <Stat label="amplitude" value={amplitude.toFixed(2)} />
      </section>

      <div className="aspect-[16/10] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [1.6, 1.1, 1.9], fov: 42 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <ResizeBump />
            <color attach="background" args={["#0a0d12"]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[3, 4, 2]} intensity={0.9} />
            <directionalLight
              position={[-2, -1, -3]}
              intensity={0.35}
              color="#a8c8ff"
            />
            <LatticeScene
              dims={dims}
              kernel={kernel}
              shape={shape}
              amplitude={amplitude}
              animate={animate}
            />
            <OrbitControls enablePan={false} minDistance={1.2} maxDistance={6} />
          </Suspense>
        </Canvas>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Slider
          label={`U · ${dims.u}`}
          min={1}
          max={8}
          step={1}
          value={dims.u}
          onChange={setU}
        />
        <Slider
          label={`V · ${dims.v}`}
          min={1}
          max={8}
          step={1}
          value={dims.v}
          onChange={setV}
        />
        <Slider
          label={`W · ${dims.w}`}
          min={1}
          max={8}
          step={1}
          value={dims.w}
          onChange={setW}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Slider
          label={`amplitude · ${amplitude.toFixed(2)}`}
          min={0}
          max={1}
          step={0.02}
          value={amplitude}
          onChange={setAmplitude}
        />
        <label className="flex items-center gap-3 self-end font-mono text-xs uppercase tracking-[0.2em] text-chrome-300">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
            className="accent-pink-200"
          />
          animate lattice
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">
          Interpolation kernel
        </span>
        <div className="flex flex-wrap gap-2">
          {KERNELS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKernel(k.id)}
              title={k.hint}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                kernel === k.id
                  ? "border-pink-200 bg-pink-200/15 text-pink-100"
                  : "border-warm-black-700 bg-warm-black-950 text-chrome-300 hover:border-pink-200/50"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">Base shape</span>
        <div className="flex flex-wrap gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShape(s.id)}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                shape === s.id
                  ? "border-pink-200 bg-pink-200/15 text-pink-100"
                  : "border-warm-black-700 bg-warm-black-950 text-chrome-300 hover:border-pink-200/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onReset}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          reset to 4 · 4 · 4 · catmull
        </button>
        <p className="text-xs text-chrome-400">
          keys: ctrl+L linear · B b-spline · C cardinal · R catmull · 0
          resets to 2·2·2 · 1–8 sets all axes
        </p>
      </section>
    </div>
  );
}
