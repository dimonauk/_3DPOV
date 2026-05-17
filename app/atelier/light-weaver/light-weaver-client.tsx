"use client";

/**
 * app/atelier/light-weaver/light-weaver-client.tsx — Light Weaver chamber.
 *
 * A focused light-trail composer. Mouse drives a luminous head; the head
 * leaves a camera-facing ribbon trail through 3D space, shaded by a
 * selectable trail shader. Optional autoplay describes a figure-8 (the
 * fundamental weave) so the trail draws itself.
 *
 * Orchestrator only. Shaders + SHADER_LIBRARY in
 * light-weaver/shaders.ts; ribbon class + tip geometry in
 * trail-ribbon.ts; R3F scene in weave-scene.tsx; types in types.ts.
 * Per ARCHITECTURE.md Rule 1.
 *
 * Source: apps/Light_Weiver/src/input/TrailShaders.ts — the same shader
 * library used in the bench app, ported to a single chamber here, with
 * the game systems (zones, kata, sisters, agents) stripped out.
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import * as THREE from "three";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

import { SHADER_LIBRARY } from "./light-weaver/shaders";
import {
  TIP_LABELS,
  type HeadDriverHandle,
  type ShaderKey,
  type TipKey,
} from "./light-weaver/types";
import { WeaveScene } from "./light-weaver/weave-scene";

const log = createLogger("atelier:light-weaver");

export default function LightWeaverClient() {
  useActiveChamber("light-weaver");

  const [shaderKey, setShaderKey] = useState<ShaderKey>("flame");
  const [tipKey, setTipKey] = useState<TipKey>("crystal");
  const [intensity, setIntensity] = useState(0.7);
  const [baseWidth, setBaseWidth] = useState(0.05);
  const [autoplay, setAutoplay] = useState(true);
  const [clearSignal, setClearSignal] = useState(0);

  const driverRef = useRef<HeadDriverHandle>({
    position: new THREE.Vector3(),
    speed: 0,
  });
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const onClear = useCallback(() => setClearSignal((c) => c + 1), []);

  const onSnapshot = useCallback(() => {
    const container = canvasContainerRef.current;
    const canvas = container?.querySelector("canvas");
    if (!canvas) {
      log.warn("snapshot: no canvas found");
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        log.warn("snapshot: toBlob returned null");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `light-weaver-${shaderKey}-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      log.info("snapshot saved", { shader: shaderKey, size: blob.size });
    }, "image/png");
  }, [shaderKey]);

  return (
    <div className="flex flex-col gap-8">
      <section
        ref={canvasContainerRef}
        className="relative h-[520px] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-black"
      >
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 55 }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
        >
          <WeaveScene
            shaderKey={shaderKey}
            tipKey={tipKey}
            intensity={intensity}
            baseWidth={baseWidth}
            autoplay={autoplay}
            clearSignal={clearSignal}
            driver={driverRef.current}
          />
        </Canvas>
        <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-400">
          {autoplay ? "autoplay · figure-8" : "mouse drives the head"}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Trail shader</span>
          <select
            value={shaderKey}
            onChange={(e) => setShaderKey(e.target.value as ShaderKey)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-200"
            aria-label="Trail shader"
          >
            {(Object.keys(SHADER_LIBRARY) as ShaderKey[]).map((k) => (
              <option key={k} value={k}>
                {SHADER_LIBRARY[k].label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Tip geometry</span>
          <select
            value={tipKey}
            onChange={(e) => setTipKey(e.target.value as TipKey)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-200"
            aria-label="Tip geometry"
          >
            {(Object.keys(TIP_LABELS) as TipKey[]).map((k) => (
              <option key={k} value={k}>
                {TIP_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Brightness &middot; {Math.round(intensity * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="accent-pink-200"
            aria-label="Brightness"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Trail width &middot; {baseWidth.toFixed(2)}
          </span>
          <input
            type="range"
            min={0.01}
            max={0.2}
            step={0.01}
            value={baseWidth}
            onChange={(e) => setBaseWidth(Number(e.target.value))}
            className="accent-pink-200"
            aria-label="Trail width"
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
            className="accent-pink-200"
            aria-label="Autoplay figure-8"
          />
          <span className="chrome-label text-chrome-400">
            Autoplay figure-8
          </span>
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={onClear}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-chrome-200 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          >
            Clear trail
          </button>
          <button
            type="button"
            onClick={onSnapshot}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Save snapshot
          </button>
        </div>
      </section>

      <section className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6 text-sm text-chrome-300">
        <div className="chrome-label">How to use</div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-chrome-300">
          <li>
            <strong className="text-chrome-100">autoplay on</strong> &mdash; the
            head describes a figure-8 in space; trail draws itself.
          </li>
          <li>
            <strong className="text-chrome-100">autoplay off</strong> &mdash;
            the head follows the mouse cursor in the viewport. Drag wide arcs;
            the trail width responds to speed.
          </li>
          <li>
            <strong className="text-chrome-100">trail shader</strong> &mdash;
            flame, plasma, aurora, mycelium, ink, or neon. Each reads the same
            age / speed / brightness inputs differently.
          </li>
          <li>
            <strong className="text-chrome-100">save snapshot</strong> &mdash;
            PNG of the current frame; the canvas is configured with{" "}
            <code className="font-mono">preserveDrawingBuffer</code> so it
            grabs the live composite.
          </li>
        </ul>
      </section>
    </div>
  );
}
