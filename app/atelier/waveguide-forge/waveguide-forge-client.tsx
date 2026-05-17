"use client";

/**
 * app/atelier/waveguide-forge/waveguide-forge-client.tsx
 *
 * Live TPMS / gyroid waveguide designer.
 *
 * Two backends share the same parameter UI:
 *   - GLSL (default) — @react-three/fiber Canvas + ShaderMaterial,
 *     raymarches a parametric gyroid or a loaded sampler3D SDF.
 *   - WebGPU TSL — bare WebGPURenderer (no R3F wrapper because three's
 *     R3F WebGPU surface is still experimental). Forward-traces photons
 *     through the SDF and atomic-splats them onto a photon-map.
 *
 * Orchestrator only. CausticPlane in waveguide-forge/caustic-plane.tsx;
 * WebGPUCanvas in webgpu-canvas.tsx; HDRI generation in use-hdri.ts;
 * right-side panels in control-panels.tsx; Slider in slider.tsx;
 * light types + padding in types.ts. Per ARCHITECTURE.md Rule 1.
 *
 * Ported from D:/The_Hangar/apps/waveguide-forge/src/App.tsx. Vite-only
 * niceties (single full-window canvas, floating HUD overlay) have been
 * adapted to the chamber convention: canvas inside a sized frame, controls
 * inline below.
 */

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { createXRStore, XR } from "@react-three/xr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { ChamberXRBar } from "components/three/ChamberXRBar";
import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

import { type LoadedSdf, loadSdfBin } from "./sdf-loader";
import { CausticPlane } from "./waveguide-forge/caustic-plane";
import { ControlPanels } from "./waveguide-forge/control-panels";
import { DEFAULT_LIGHT, type LightCfg } from "./waveguide-forge/types";
import { useHdri } from "./waveguide-forge/use-hdri";
import { WebGPUCanvas } from "./waveguide-forge/webgpu-canvas";
import { type LightUniform, detectWebGPU } from "./webgpu-photonmap";

const log = createLogger("atelier:waveguide-forge");

// TODO(print-bar): chamber is render-only — no exported mesh artefact
// yet. Wire <PrintBar source={{ kind: "glb", url, label }} /> at the
// bottom once the parametric gyroid → SDF → marching-cubes export
// lands. The SDF voxel grid is already in hand (sdf-loader.ts loads
// `.sdf.bin`); the missing step is the marching-cubes mesh export and
// `pushAtelierOutput` plumbing.

export default function WaveguideForgeClient() {
  useActiveChamber("waveguide-forge");

  const [ior, setIor] = useState(1.5);
  const [density, setDensity] = useState(4);
  const [thickness, setThickness] = useState(1.4);
  const [lights, setLights] = useState<LightCfg[]>([
    {
      origin: [0, 0, 0],
      direction: [-0.1, -1, -0.2],
      coneAngle: 0.08,
      radius: 0.05,
      intensity: 1.0,
    },
  ]);
  const [sdf, setSdf] = useState<LoadedSdf | null>(null);
  const [sdfErr, setSdfErr] = useState<string | null>(null);
  const [useWebGPU, setUseWebGPU] = useState(false);
  const [webgpuAvailable, setWebgpuAvailable] = useState<boolean | null>(null);
  const [webgpuErr, setWebgpuErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stable XR store — recreating it would tear down any live session.
  // The XR wrap only feeds the GLSL backend; the bare WebGPU canvas
  // can't enter WebXR via @react-three/xr.
  const xrStore = useMemo(() => createXRStore(), []);

  const hdri = useHdri();

  useEffect(() => {
    void detectWebGPU().then((s) => setWebgpuAvailable(s.available));
  }, []);

  const onSdfFile = useCallback(async (file: File) => {
    setSdfErr(null);
    try {
      setSdf(await loadSdfBin(file));
    } catch (err) {
      setSdf(null);
      const message = err instanceof Error ? err.message : "failed to load";
      setSdfErr(message);
      log.warn("sdf load failed", { err, name: file.name });
    }
  }, []);

  const updateLight = useCallback((i: number, patch: Partial<LightCfg>) => {
    setLights((cur) => cur.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }, []);
  const addLight = useCallback(() => {
    setLights((cur) =>
      cur.length >= 4 ? cur : [...cur, { ...DEFAULT_LIGHT }],
    );
  }, []);
  const removeLight = useCallback(
    (i: number) => setLights((cur) => cur.filter((_, j) => j !== i)),
    [],
  );

  const lightUniforms = useMemo<LightUniform[]>(
    () =>
      lights.map((l) => ({
        origin: new THREE.Vector3(...l.origin),
        direction: new THREE.Vector3(...l.direction).normalize(),
        coneAngle: l.coneAngle,
        radius: l.radius,
        intensity: l.intensity,
      })),
    [lights],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
        {/* --- Canvas frame ------------------------------------------------ */}
        {useWebGPU && sdf ? (
          <WebGPUCanvas
            sdf={sdf}
            ior={ior}
            lights={lightUniforms}
            onError={(m) => {
              setWebgpuErr(m);
              setUseWebGPU(false);
            }}
          />
        ) : (
          <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
            <div className="absolute right-3 top-3 z-20">
              <ChamberXRBar store={xrStore} />
            </div>
            <Canvas
              className="block h-full w-full"
              camera={{ position: [3, 2.5, 3] }}
            >
              {hdri.hdriUrl ? (
                // Drei's <Environment files=...> loads the equirect,
                // converts to a PMREM, and binds it to scene.environment.
                // `background` also drapes it as scene.background.
                <Environment files={hdri.hdriUrl} background />
              ) : (
                <color attach="background" args={["#0e0e14"]} />
              )}
              <XR store={xrStore}>
                <CausticPlane
                  ior={ior}
                  density={density}
                  thickness={thickness}
                  lights={lights}
                  sdf={sdf}
                />
              </XR>
              <OrbitControls />
            </Canvas>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
              <span>{sdf ? "loaded SDF" : "parametric gyroid"}</span>
              <span className="text-chrome-500">
                GLSL backend &middot; WebGL2
                {hdri.hdriUrl && " · HDRI on"}
              </span>
            </div>
          </div>
        )}

        {/* --- Controls ---------------------------------------------------- */}
        <ControlPanels
          hdriPrompt={hdri.hdriPrompt}
          setHdriPrompt={hdri.setHdriPrompt}
          hdriUrl={hdri.hdriUrl}
          setHdriUrl={hdri.setHdriUrl}
          hdriBusy={hdri.hdriBusy}
          hdriErr={hdri.hdriErr}
          onGenerateHdri={() => void hdri.onGenerateHdri()}
          fileInputRef={fileInputRef}
          onSdfFile={(file) => void onSdfFile(file)}
          sdf={sdf}
          sdfErr={sdfErr}
          ior={ior}
          setIor={setIor}
          density={density}
          setDensity={setDensity}
          thickness={thickness}
          setThickness={setThickness}
          lights={lights}
          addLight={addLight}
          removeLight={removeLight}
          updateLight={updateLight}
          useWebGPU={useWebGPU}
          setUseWebGPU={setUseWebGPU}
          webgpuAvailable={webgpuAvailable}
          webgpuErr={webgpuErr}
          setWebgpuErr={setWebgpuErr}
        />
      </div>
    </div>
  );
}
