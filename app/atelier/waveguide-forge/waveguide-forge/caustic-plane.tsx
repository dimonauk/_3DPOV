"use client";

/**
 * app/atelier/waveguide-forge/waveguide-forge/caustic-plane.tsx —
 * R3F mesh that raymarches a parametric gyroid (or a loaded
 * sampler3D SDF) through a ShaderMaterial. Uniforms are mutated in
 * place each frame so React doesn't churn.
 *
 * Extracted from waveguide-forge-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { fragmentShader, vertexShader } from "../caustic-shaders";
import type { LoadedSdf } from "../sdf-loader";

import { type LightCfg, padLights } from "./types";

export function CausticPlane({
  ior,
  density,
  thickness,
  lights,
  sdf,
}: {
  ior: number;
  density: number;
  thickness: number;
  lights: LightCfg[];
  sdf: LoadedSdf | null;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1024, 1024) },
      uTime: { value: 0 },
      uIor: { value: ior },
      uDensity: { value: density },
      uThickness: { value: thickness },
      uLightCount: { value: lights.length },
      uLights: { value: padLights(lights) },
      uHasSdf: { value: !!sdf },
      uSdf: { value: sdf?.texture ?? new THREE.Data3DTexture() },
      uSdfMin: {
        value: new THREE.Vector3(...(sdf?.boundsMin ?? [-1, -1, -1])),
      },
      uSdfMax: {
        value: new THREE.Vector3(...(sdf?.boundsMax ?? [1, 1, 1])),
      },
    }),
    // The uniforms object is mutated each frame in useFrame; we don't
    // want React rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((_, dt) => {
    if (!matRef.current) return;
    uniforms.uTime.value += dt;
    uniforms.uIor.value = ior;
    uniforms.uDensity.value = density;
    uniforms.uThickness.value = thickness;
    uniforms.uLightCount.value = lights.length;
    uniforms.uLights.value = padLights(lights);
    uniforms.uHasSdf.value = !!sdf;
    if (sdf) {
      uniforms.uSdf.value = sdf.texture;
      uniforms.uSdfMin.value.set(...sdf.boundsMin);
      uniforms.uSdfMax.value.set(...sdf.boundsMax);
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[6, 6]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        glslVersion={THREE.GLSL3}
      />
    </mesh>
  );
}
