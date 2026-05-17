"use client";

/**
 * app/atelier/light-weaver/light-weaver/weave-scene.tsx — R3F scene
 * with the luminous head + camera-facing trail ribbon. Reads mouse
 * (or autoplay figure-8) to drive the head; per-frame builds the
 * ribbon strip and ticks shader uniforms.
 *
 * Extracted from light-weaver-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createLogger } from "lib/log";

import { SHADER_LIBRARY, TRAIL_VERT } from "./shaders";
import { TrailRibbon, buildTipGeometry } from "./trail-ribbon";
import type { HeadDriverHandle, ShaderKey, TipKey } from "./types";

const log = createLogger("atelier:light-weaver:scene");

export interface WeaveSceneProps {
  shaderKey: ShaderKey;
  tipKey: TipKey;
  intensity: number;
  baseWidth: number;
  autoplay: boolean;
  clearSignal: number;
  driver: HeadDriverHandle;
}

export function WeaveScene({
  shaderKey,
  tipKey,
  intensity,
  baseWidth,
  autoplay,
  clearSignal,
  driver,
}: WeaveSceneProps) {
  const { camera, scene, mouse, viewport } = useThree();
  const tipRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<TrailRibbon | null>(null);
  const prevHead = useRef(new THREE.Vector3());
  const speedSmooth = useRef(0);

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERT,
      fragmentShader: SHADER_LIBRARY[shaderKey].frag,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uSpeed: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    return m;
    // intensity is read in useFrame from the host; keep the dep on
    // shaderKey only so the material is rebuilt when the shader swaps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shaderKey]);

  // Trail lifecycle — rebuild on shader change.
  useEffect(() => {
    const ribbon = new TrailRibbon(material);
    ribbon.setBaseWidth(baseWidth);
    trailRef.current = ribbon;
    scene.add(ribbon.mesh);
    log.info("trail mounted", { shader: shaderKey });
    return () => {
      scene.remove(ribbon.mesh);
      ribbon.dispose();
      trailRef.current = null;
    };
  }, [material, scene, shaderKey, baseWidth]);

  useEffect(() => {
    trailRef.current?.setBaseWidth(baseWidth);
  }, [baseWidth]);

  // Clear signal from parent (button press).
  useEffect(() => {
    trailRef.current?.clear();
  }, [clearSignal]);

  // Tip geometry — rebuild on tip change.
  const tipGeo = useMemo(() => buildTipGeometry(tipKey), [tipKey]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    let head: THREE.Vector3;

    if (autoplay) {
      // Figure-8 (lemniscate of gerono) — the fundamental weave path.
      const s = t * 0.9;
      head = new THREE.Vector3(
        Math.sin(s) * 1.6,
        Math.sin(s * 2) * 0.8,
        Math.cos(s * 0.6) * 0.4,
      );
    } else {
      // Mouse → world plane at z=0.
      head = new THREE.Vector3(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0,
      );
    }

    // Smoothed speed estimate for shader uSpeed input.
    const inst = head.distanceTo(prevHead.current) / Math.max(dt, 0.001);
    const target = Math.min(1, inst / 8);
    speedSmooth.current = speedSmooth.current * 0.85 + target * 0.15;
    prevHead.current.copy(head);

    driver.position.copy(head);
    driver.speed = speedSmooth.current;

    if (tipRef.current) {
      tipRef.current.position.copy(head);
      tipRef.current.rotation.y = t * 0.8;
      tipRef.current.rotation.x = t * 0.4;
    }
    if (glowRef.current) {
      glowRef.current.position.copy(head);
      const targetScale = 0.35 + speedSmooth.current * 0.5;
      glowRef.current.scale.setScalar(
        glowRef.current.scale.x +
          (targetScale - glowRef.current.scale.x) * 0.15,
      );
    }

    if (trailRef.current) {
      trailRef.current.update(head, speedSmooth.current, camera);
      trailRef.current.tick(t, intensity, speedSmooth.current);
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[2, 3, 4]} intensity={1.2} color={0xffccaa} />
      <pointLight position={[-3, -1, -2]} intensity={0.6} color={0x4488ff} />

      <mesh ref={tipRef} geometry={tipGeo}>
        <meshStandardMaterial
          color={0xffffff}
          emissive={0xffaa44}
          emissiveIntensity={2.2}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={0xffcc88}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
