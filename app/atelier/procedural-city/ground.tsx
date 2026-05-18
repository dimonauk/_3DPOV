"use client";

/**
 * app/atelier/procedural-city/ground.tsx
 *
 * Flat ground plane plus two InstancedMesh layers for roads and
 * parks. Both layers lie a hair above ground (y = 0.01) to avoid
 * z-fighting with the ground material.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Cell } from "lib/procedural-city/generator";
import { CITY_PALETTE } from "lib/procedural-city/palette";

// Flat plane oriented Y-up: rotate -90deg around X so the face points
// at the sky. Bakes into the geometry so per-instance rotation isn't
// needed.
const PLANE = new THREE.PlaneGeometry(1, 1);
PLANE.rotateX(-Math.PI / 2);

type Props = {
  roads: readonly Cell[];
  parks: readonly Cell[];
  width: number;
  height: number;
  cellSize?: number;
};

export function Ground({
  roads,
  parks,
  width,
  height,
  cellSize = 1,
}: Props) {
  const groundSize = Math.max(width, height) * cellSize * 1.4;

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color={CITY_PALETTE.ground} roughness={0.95} />
      </mesh>
      <InstancedFlat
        cells={roads}
        cellSize={cellSize}
        color={CITY_PALETTE.road}
        fill={1}
      />
      <InstancedFlat
        cells={parks}
        cellSize={cellSize}
        color={CITY_PALETTE.park}
        fill={0.9}
      />
    </group>
  );
}

function InstancedFlat({
  cells,
  cellSize,
  color,
  fill,
}: {
  cells: readonly Cell[];
  cellSize: number;
  color: string;
  fill: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const count = cells.length;
  const scratch = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell) continue;
      scratch.position.set(cell.x * cellSize, 0.01, cell.z * cellSize);
      scratch.scale.set(cellSize * fill, 1, cellSize * fill);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells, cellSize, fill, scratch]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[PLANE, undefined, count]} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} />
    </instancedMesh>
  );
}
