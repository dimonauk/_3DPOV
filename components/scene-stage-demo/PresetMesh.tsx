"use client";

/**
 * components/scene-stage-demo/PresetMesh.tsx — Mesh wrapper that
 * loads a TSL preset from lib/xr-scene/tsl-presets and binds the
 * returned material to a child geometry.
 *
 * Async-loading + disposal are the awkward bits a demo page would
 * otherwise have to inline four times — once per preset on stage.
 * The wrapper holds them and keeps the showcase file readable.
 *
 * Conventions:
 *   - The preset is async. Until it resolves the mesh hangs back
 *     with a flat warm-black placeholder, so the layout doesn't
 *     jump when each preset compiles.
 *   - `tick` (foil) is driven from useFrame. Reduced-motion is
 *     respected by the preset itself — buildPreset({ reducedMotion })
 *     drops the tick before it ever returns.
 *   - Disposal on unmount AND on preset-name change. The previous
 *     material's GPU state is released either way.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Material, Mesh } from "three";

import {
  buildPreset,
  type PresetMaterial,
  type PresetName,
} from "lib/xr-scene/tsl-presets";

export type PresetMeshProps = {
  preset: PresetName;
  /** The geometry — a JSX <boxGeometry/>, <icosahedronGeometry/>, etc. */
  children: ReactNode;
  /** Position. */
  position?: [number, number, number];
  /** Optional uniform scale. */
  scale?: number;
  /** Reduce-motion flag from the page's media query. Default false. */
  reducedMotion?: boolean;
  /** Per-frame transform hook — for the spinning icosa / drifting cube.
   *  Receives the mesh and the elapsed time in seconds. */
  onFrame?: (mesh: Mesh, elapsed: number) => void;
};

export function PresetMesh({
  preset,
  children,
  position = [0, 0, 0],
  scale = 1,
  reducedMotion = false,
  onFrame,
}: PresetMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const [resolved, setResolved] = useState<PresetMaterial | null>(null);

  // Load the preset on mount + on name change. The cleanup disposes
  // the previous preset's material before we even attempt the swap.
  useEffect(() => {
    let cancelled = false;
    let local: PresetMaterial | null = null;
    void buildPreset(preset, { reducedMotion }).then((p) => {
      if (cancelled) {
        p.dispose();
        return;
      }
      local = p;
      setResolved(p);
    });
    return () => {
      cancelled = true;
      setResolved(null);
      local?.dispose();
    };
  }, [preset, reducedMotion]);

  // Tick the preset's animated uniforms + the mesh transform together.
  // Both feed off the same elapsed clock so phase + drift stay locked.
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    resolved?.tick?.(elapsed);
    const mesh = meshRef.current;
    if (mesh && onFrame) onFrame(mesh, elapsed);
  });

  // Material adoption: R3F's <primitive> mounts the Material instance
  // directly into the mesh, mirroring how scenes that pre-build their
  // own materials (e.g. lib/type3d/material) get attached.
  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      castShadow
      receiveShadow
    >
      {children}
      {resolved ? (
        <primitive
          object={resolved.material as Material}
          attach="material"
          dispose={null}
        />
      ) : (
        <meshStandardMaterial color="#14111a" roughness={0.85} />
      )}
    </mesh>
  );
}

export default PresetMesh;
