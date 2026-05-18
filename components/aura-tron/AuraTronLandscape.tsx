"use client";

/**
 * components/aura-tron/AuraTronLandscape.tsx
 *
 * Standalone port of the DollyOS AuraTron landscape. The original lived
 * inside the Aura R3F scene at
 * `D:\The_Hangar\Dolly_OS\src\components\void\AuraTronLandscape.tsx` and
 * imported its constants/shaders/geometry from a sibling folder; this version
 * pulls everything from `lib/aura-tron`, accepts a `mood` prop instead of
 * reading the global Aura store, and feeds the mood through as a wire-tint
 * uniform. No Aura, no VRM bones, no LLM coupling.
 *
 * GPU does all height work — the CPU writes two floats per frame and the
 * mood-tint vec3 only when the mood prop changes.
 */
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { buildFaceGeo, buildParticleGeo, buildWireGeo } from "lib/aura-tron/geometry";
import {
  DEFAULT_MOOD,
  getMoodPalette,
  landscapeTime,
  type Mood,
} from "lib/aura-tron/terrain";
import {
  FRAG,
  PARTICLE_FRAG,
  PARTICLE_VERT,
  VERT,
  WIRE_FRAG,
  WIRE_VERT,
} from "lib/aura-tron/shaders";

const PARTICLE_COUNT = 180;

type Props = {
  mood?: Mood;
  /** 0..1 — how strongly to bias the wires toward the mood tint. */
  tintAmount?: number;
};

export function AuraTronLandscape({ mood = DEFAULT_MOOD, tintAmount = 0.55 }: Props) {
  const timeRef = useRef({ t: 0, slowT: 0 });

  const particleGeo = useMemo(() => buildParticleGeo(PARTICLE_COUNT), []);
  const faceGeo = useMemo(() => buildFaceGeo(), []);
  const wireGeo = useMemo(() => buildWireGeo(), []);

  const faceMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        uniforms: {
          uTime: { value: 0 },
          uSlowT: { value: 0 },
        },
      }),
    [],
  );

  const wireMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WIRE_VERT,
        fragmentShader: WIRE_FRAG,
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        depthTest: true,
        uniforms: {
          uTime: { value: 0 },
          uSlowT: { value: 0 },
          uTint: { value: new THREE.Vector3(1, 0.62, 0.32) },
          uTintAmount: { value: tintAmount },
        },
      }),
    // tintAmount intentionally omitted — updated by effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const particleMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        uniforms: {
          uTime: { value: 0 },
          uSlowT: { value: 0 },
          uTint: { value: new THREE.Vector3(1, 0.62, 0.32) },
          uTintAmount: { value: tintAmount },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Push mood + tintAmount into the wire/particle uniforms whenever they change.
  useEffect(() => {
    const palette = getMoodPalette(mood);
    const tintVec = wireMat.uniforms["uTint"]?.value as THREE.Vector3 | undefined;
    tintVec?.set(palette.tint[0], palette.tint[1], palette.tint[2]);
    const wireAmount = wireMat.uniforms["uTintAmount"];
    if (wireAmount) wireAmount.value = tintAmount;
    const partTint = particleMat.uniforms["uTint"]?.value as THREE.Vector3 | undefined;
    partTint?.set(palette.tint[0], palette.tint[1], palette.tint[2]);
    const partAmount = particleMat.uniforms["uTintAmount"];
    if (partAmount) partAmount.value = tintAmount;
  }, [mood, tintAmount, wireMat, particleMat]);

  // Per-frame: two float writes, propagated to three materials.
  useFrame((_, delta) => {
    timeRef.current.t += delta;
    timeRef.current.slowT += delta * 0.12;
    landscapeTime.slowT = timeRef.current.slowT;

    const setTime = (mat: THREE.ShaderMaterial) => {
      const ut = mat.uniforms["uTime"];
      const us = mat.uniforms["uSlowT"];
      if (ut) ut.value = timeRef.current.t;
      if (us) us.value = timeRef.current.slowT;
    };
    setTime(faceMat);
    setTime(wireMat);
    setTime(particleMat);
  });

  // Dispose buffers on unmount.
  useEffect(() => {
    return () => {
      faceGeo.dispose();
      wireGeo.dispose();
      particleGeo.dispose();
      faceMat.dispose();
      wireMat.dispose();
      particleMat.dispose();
    };
  }, [faceGeo, wireGeo, particleGeo, faceMat, wireMat, particleMat]);

  return (
    <group>
      <mesh geometry={faceGeo} material={faceMat} renderOrder={0} frustumCulled={false} />
      <lineSegments
        geometry={wireGeo}
        material={wireMat}
        renderOrder={1}
        frustumCulled={false}
      />
      <points
        geometry={particleGeo}
        material={particleMat}
        renderOrder={2}
        frustumCulled={false}
      />
    </group>
  );
}

export default AuraTronLandscape;
