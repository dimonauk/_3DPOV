"use client";

/**
 * components/play/scenes/loop-scene-reified-mesh.tsx — The reified mesh.
 *
 * Renders a Three.js MarchingCubes at MC_RESOLUTION; the trail's vertices
 * are normalised into the field's ±1 cube and stamped as soft Gaussian
 * blobs via `addBall`. The iso-surface comes out as a chrome-cyan chunky
 * mesh — the gesture, as object.
 *
 * The camera orbits autonomously during the Encounter stage so the
 * visitor sees the object from every side without having to drag.
 * OrbitControls is mounted on top in the parent so they can take over.
 */

import { useFrame } from "@react-three/fiber";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const MC_RESOLUTION = 16;
/** Iso-surface threshold; tuned so a typical trail lands ~chunky-but-coherent. */
const MC_ISOLATION = 80;
/** Per-vertex "strength" of the Gaussian stamp into the field. */
const MC_BALL_STRENGTH = 0.35;
/** Per-vertex Gaussian falloff. Lower numbers = fatter blobs. */
const MC_BALL_SUBTRACT = 12;

export function ReifiedMesh({
  points,
  fadeIn,
  orbit,
}: {
  points: THREE.Vector3[];
  /** 0..1, drives mesh opacity over the reify stage. */
  fadeIn: number;
  /** Whether to autoplay the orbit during Encounter. */
  orbit: boolean;
}) {
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#00f3ff"),
      emissive: new THREE.Color("#0a6677"),
      emissiveIntensity: 0.6,
      roughness: 0.35,
      metalness: 0.55,
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  const mc = useMemo(() => {
    const instance = new MarchingCubes(MC_RESOLUTION, material, true, false);
    instance.isolation = MC_ISOLATION;
    instance.enableUvs = false;
    instance.enableColors = false;
    return instance;
  }, [material]);

  useEffect(() => {
    mc.reset();
    if (points.length < 2) return;
    const bb = new THREE.Box3().setFromPoints(points);
    const size = new THREE.Vector3();
    bb.getSize(size);
    const centre = new THREE.Vector3();
    bb.getCenter(centre);
    const maxDim = Math.max(size.x, size.y, size.z, 1e-3);
    const scale = 1.6 / maxDim;
    for (const p of points) {
      const x = (p.x - centre.x) * scale * 0.5 + 0.5;
      const y = (p.y - centre.y) * scale * 0.5 + 0.5;
      const z = (p.z - centre.z) * scale * 0.5 + 0.5;
      const cx = Math.max(0.05, Math.min(0.95, x));
      const cy = Math.max(0.05, Math.min(0.95, y));
      const cz = Math.max(0.05, Math.min(0.95, z));
      mc.addBall(cx, cy, cz, MC_BALL_STRENGTH, MC_BALL_SUBTRACT);
    }
    mc.update();
  }, [points, mc]);

  useEffect(() => {
    material.opacity = Math.max(0, Math.min(0.95, fadeIn));
  }, [fadeIn, material]);

  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!orbit) return;
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.35;
  });

  useEffect(() => {
    return () => {
      material.dispose();
      mc.geometry?.dispose();
    };
  }, [material, mc]);

  return (
    <group ref={ref} scale={[1.4, 1.4, 1.4]}>
      <primitive object={mc} />
    </group>
  );
}
