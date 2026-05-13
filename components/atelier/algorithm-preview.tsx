"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { portedAlgorithms, type ParamDescriptor } from "lib/algorithms";
import type { CommonParams } from "lib/algorithms/_base";

type LoadedModule = Awaited<
  ReturnType<(typeof portedAlgorithms)[string]["load"]>
>;

function GeneratedMesh({
  geo,
}: {
  geo: THREE.BufferGeometry;
}) {
  const { scene } = useThree();
  useEffect(() => {
    // ensure nothing leaks if the user navigates away mid-update
    return () => {
      try {
        geo.dispose();
      } catch {
        /* ignore */
      }
    };
  }, [geo, scene]);

  return (
    <mesh geometry={geo} castShadow={false} receiveShadow={false}>
      <meshStandardMaterial
        color="#cfd8dc"
        metalness={0.4}
        roughness={0.35}
        flatShading={false}
      />
    </mesh>
  );
}

/**
 * Live algorithm preview. The Stage centres + lights whatever
 * geometry the ported algorithm emits; sliders below drive the
 * common (seed / complexity / density) knobs.
 */
export default function AlgorithmPreview({
  slug,
  params,
}: {
  slug: string;
  params: ParamDescriptor[];
}) {
  const ported = portedAlgorithms[slug];
  const [mod, setMod] = useState<LoadedModule | null>(null);
  const [defaults, setDefaults] = useState<CommonParams | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ported) return;
    let cancelled = false;
    ported
      .load()
      .then((m) => {
        if (cancelled) return;
        setMod(m);
        const dp = m.defaultParams();
        setDefaults(dp);
        const v: Record<string, number> = {};
        for (const desc of params) {
          const dv = dp[desc.key];
          v[desc.key] = typeof dv === "number" ? dv : desc.default;
        }
        setValues(v);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [ported, params]);

  const geo = useMemo(() => {
    if (!mod || !defaults) return null;
    try {
      const merged: CommonParams = {
        seed: values.seed ?? defaults.seed,
        complexity: values.complexity ?? defaults.complexity,
        scale: defaults.scale,
        density: values.density ?? defaults.density,
      };
      return mod.generateGeometry(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
    // tick forces re-run even when value identity is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod, defaults, values, tick]);

  if (!ported) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas camera={{ position: [1.6, 1.3, 1.6], fov: 35 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Stage
              adjustCamera
              intensity={0.55}
              shadows={false}
              preset="rembrandt"
              environment="city"
            >
              {geo ? <GeneratedMesh geo={geo} /> : null}
            </Stage>
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={1.2}
          />
        </Canvas>
      </div>
      {error ? (
        <div className="rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 text-xs text-chrome-300 sm:grid-cols-2">
        {params.map((desc) => {
          const v = values[desc.key];
          if (v === undefined) return null;
          return (
            <label key={desc.key} className="flex flex-col gap-1">
              <span className="flex justify-between font-mono">
                <span>{desc.label}</span>
                <span className="text-chrome-500">
                  {v.toFixed(desc.step < 1 ? 2 : 0)}
                </span>
              </span>
              <input
                type="range"
                min={desc.min}
                max={desc.max}
                step={desc.step}
                value={v}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [desc.key]: Number(e.target.value),
                  }))
                }
                className="accent-pink-300"
              />
            </label>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setTick((t) => t + 1)}
        className="self-start rounded-sm border border-warm-black-800 px-3 py-1 text-xs text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
      >
        Reroll
      </button>
    </div>
  );
}
