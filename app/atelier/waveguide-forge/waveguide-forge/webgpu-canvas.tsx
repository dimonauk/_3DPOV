"use client";

/**
 * app/atelier/waveguide-forge/waveguide-forge/webgpu-canvas.tsx —
 * Bare WebGPURenderer mount that forward-traces photons through the
 * loaded SDF and atomic-splats them onto a photon-map. No R3F
 * wrapper because three's R3F WebGPU surface is still experimental.
 *
 * Extracted from waveguide-forge-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { createLogger } from "lib/log";

import type { LoadedSdf } from "../sdf-loader";
import {
  type LightUniform,
  type PhotonMapScene,
  buildPhotonMapScene,
  createWebGPURenderer,
} from "../webgpu-photonmap";

const log = createLogger("atelier:waveguide-forge:webgpu");

export function WebGPUCanvas({
  sdf,
  ior,
  lights,
  onError,
}: {
  sdf: LoadedSdf;
  ior: number;
  lights: LightUniform[];
  onError?: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "running" | "error">("init");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    type RendererLike = {
      dispose?: () => void;
      setSize: (w: number, h: number, updateStyle: boolean) => void;
    };
    let renderer: RendererLike | null = null;
    let pscene: PhotonMapScene | null = null;
    let rafId = 0;
    let stopped = false;

    (async () => {
      try {
        const r = (await createWebGPURenderer(canvas)) as RendererLike | null;
        if (!r) throw new Error("WebGPU not available");
        renderer = r;
        r.setSize(canvas.clientWidth, canvas.clientHeight, false);
        pscene = await buildPhotonMapScene({
          sdfTexture: sdf.texture,
          sdfMin: new THREE.Vector3(...sdf.boundsMin),
          sdfMax: new THREE.Vector3(...sdf.boundsMax),
          ior,
          lights,
        });
        pscene.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        pscene.camera.updateProjectionMatrix();
        setStatus("running");

        let last = performance.now();
        const tick = async () => {
          if (stopped) return;
          const now = performance.now();
          const dt = (now - last) / 1000;
          last = now;
          pscene!.uIor.value = ior;
          pscene!.packLights(lights);
          await pscene!.step(renderer, dt);
          rafId = requestAnimationFrame(() => {
            void tick();
          });
        };
        void tick();
      } catch (err) {
        log.error("WebGPU init failed", { err });
        setStatus("error");
        onError?.(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      pscene?.dispose();
      renderer?.dispose?.();
    };
    // SDF identity drives recreation; ior/lights are read each tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdf]);

  return (
    <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Waveguide caustic — WebGPU photon-map render"
      />
      {status === "init" && (
        <div className="absolute right-3 top-3 font-mono text-[0.65rem] text-chrome-400">
          initialising WebGPU&hellip;
        </div>
      )}
    </div>
  );
}
