"use client";

/**
 * app/atelier/procedural-city/procedural-city-client.tsx
 *
 * Orchestrator. Owns the controls state, regenerates the city grid
 * whenever the inputs change, and mounts the R3F <Canvas>. The
 * scene is plain WebGL (R3F default) — fine for instanced boxes
 * and a dozen materials, no WebGPU init required.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import { Suspense, useCallback, useMemo, useState } from "react";

import { generateCity } from "lib/procedural-city/generator";
import type { LayoutMode } from "lib/procedural-city/palette";
import { getLayoutPreset } from "lib/procedural-city/palette";

import { Buildings } from "./buildings";
import { CityControls, type CityControlsState } from "./controls";
import { Ground } from "./ground";
import { Traffic } from "./traffic";

const INITIAL_STATE: CityControlsState = {
  layout: "downtown",
  size: 36,
  seed: 1729,
  traffic: 0.08,
  speed: 1,
};

export default function ProceduralCityClient() {
  const [state, setState] = useState<CityControlsState>(INITIAL_STATE);

  const city = useMemo(() => {
    const preset = getLayoutPreset(state.layout);
    return generateCity(state.size, state.size, preset, state.seed);
  }, [state.layout, state.size, state.seed]);

  const onLayout = useCallback((id: LayoutMode) => {
    setState((s) => ({ ...s, layout: id }));
  }, []);
  const onSize = useCallback((v: number) => {
    setState((s) => ({ ...s, size: v }));
  }, []);
  const onTraffic = useCallback((v: number) => {
    setState((s) => ({ ...s, traffic: v }));
  }, []);
  const onSpeed = useCallback((v: number) => {
    setState((s) => ({ ...s, speed: v }));
  }, []);
  const onReseed = useCallback(() => {
    setState((s) => ({ ...s, seed: Math.floor(Math.random() * 1_000_000) }));
  }, []);

  const cameraDist = state.size * 0.9;

  const stats = useMemo(
    () => ({
      total: city.cells.length,
      buildings:
        city.residential.length + city.commercial.length + city.offices.length,
      roads: city.roads.length,
      parks: city.parks.length,
    }),
    [city],
  );

  return (
    <div className="flex flex-col gap-6">
      <StatsBar stats={stats} />

      <div className="aspect-[16/10] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: [cameraDist, cameraDist * 0.7, cameraDist],
            fov: 42,
          }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={["#10131a"]} />
            <Sky
              sunPosition={[80, 24, 60]}
              turbidity={6}
              rayleigh={1.4}
              mieCoefficient={0.005}
              mieDirectionalG={0.8}
            />
            <ambientLight intensity={0.45} />
            <directionalLight
              position={[40, 60, 30]}
              intensity={1.1}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-left={-cameraDist}
              shadow-camera-right={cameraDist}
              shadow-camera-top={cameraDist}
              shadow-camera-bottom={-cameraDist}
              shadow-bias={-0.0002}
            />
            <hemisphereLight color="#9ec5ff" groundColor="#3a2f24" intensity={0.35} />

            <Ground
              roads={city.roads}
              parks={city.parks}
              width={city.width}
              height={city.height}
            />
            <Buildings cells={city.residential} />
            <Buildings cells={city.commercial} />
            <Buildings cells={city.offices} />
            <Traffic
              roads={city.roads}
              width={city.width}
              height={city.height}
              density={state.traffic}
              speed={state.speed}
            />

            <OrbitControls
              enablePan
              minDistance={4}
              maxDistance={cameraDist * 2.5}
              maxPolarAngle={Math.PI * 0.48}
            />
          </Suspense>
        </Canvas>
      </div>

      <CityControls
        state={state}
        handlers={{ onLayout, onSize, onTraffic, onSpeed, onReseed }}
      />
    </div>
  );
}

function StatsBar({
  stats,
}: {
  stats: { total: number; buildings: number; roads: number; parks: number };
}) {
  return (
    <div className="grid grid-cols-4 gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 font-mono text-xs text-chrome-200">
      <StatCell label="cells" value={stats.total} />
      <StatCell label="lots" value={stats.buildings} />
      <StatCell label="roads" value={stats.roads} />
      <StatCell label="parks" value={stats.parks} />
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-chrome-500">{label}</div>
      <div className="text-chrome-100">{value.toLocaleString()}</div>
    </div>
  );
}
