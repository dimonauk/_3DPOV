"use client";

/**
 * app/atelier/procedural-city/traffic.tsx
 *
 * Per-frame car simulation. Each car picks an x- or z-aligned road
 * cell and walks it, wrapping when it leaves the grid. The motion
 * is intentionally cartoony — there's no path-following or
 * intersection logic. It's a kinetic readout of the road network.
 *
 * The whole flock is one InstancedMesh updated each frame from the
 * cars array, so even a hundred cars cost one draw call.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { Cell } from "lib/procedural-city/generator";
import { CITY_PALETTE } from "lib/procedural-city/palette";

const CAR_GEOM = new THREE.BoxGeometry(0.4, 0.3, 0.8);
CAR_GEOM.translate(0, 0.15, 0);

type Car = {
  x: number;
  z: number;
  axis: "x" | "z";
  speed: number;
};

type Props = {
  roads: readonly Cell[];
  width: number;
  height: number;
  density: number; // 0..1, fraction of cars per road cell
  speed: number; // global speed multiplier
  cellSize?: number;
};

export function Traffic({
  roads,
  width,
  height,
  density,
  speed,
  cellSize = 1,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  const cars = useMemo<Car[]>(() => {
    if (roads.length === 0) return [];
    const target = Math.min(
      120,
      Math.max(0, Math.round(roads.length * density)),
    );
    const out: Car[] = [];
    for (let i = 0; i < target; i++) {
      const road = roads[Math.floor(Math.random() * roads.length)];
      if (!road) continue;
      out.push({
        x: road.x,
        z: road.z,
        axis: Math.random() > 0.5 ? "x" : "z",
        speed: (Math.random() * 0.6 + 0.4) * (Math.random() > 0.5 ? 1 : -1),
      });
    }
    return out;
    // Re-roll only when the road network or density target changes.
  }, [roads, density]);

  const scratch = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const halfW = (width / 2) * cellSize;
    const halfH = (height / 2) * cellSize;
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      if (!car) continue;
      const step = car.speed * speed * delta * 4;
      if (car.axis === "x") {
        car.x += step;
        if (car.x > halfW) car.x = -halfW;
        if (car.x < -halfW) car.x = halfW;
      } else {
        car.z += step;
        if (car.z > halfH) car.z = -halfH;
        if (car.z < -halfH) car.z = halfH;
      }
      scratch.position.set(car.x * cellSize, 0.05, car.z * cellSize);
      scratch.rotation.y = car.axis === "x" ? 0 : Math.PI / 2;
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (cars.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[CAR_GEOM, undefined, cars.length]} castShadow>
      <meshStandardMaterial
        color={CITY_PALETTE.car}
        emissive={CITY_PALETTE.car}
        emissiveIntensity={0.35}
        roughness={0.4}
      />
    </instancedMesh>
  );
}
