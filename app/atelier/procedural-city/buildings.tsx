"use client";

/**
 * app/atelier/procedural-city/buildings.tsx
 *
 * One InstancedMesh per building cohort (residential / commercial /
 * office). Per-instance height + tint baked into the matrix and
 * instanceColor attributes inside a useLayoutEffect so the GPU sees
 * a single draw call per cohort regardless of grid size.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Cell } from "lib/procedural-city/generator";

const BOX = new THREE.BoxGeometry(1, 1, 1);
// Translate the geometry so its base sits on y=0 and the cube extends
// upward. Cheaper than per-instance position offsets.
BOX.translate(0, 0.5, 0);

type Props = {
  cells: readonly Cell[];
  cellSize?: number;
  fill?: number;
};

export function Buildings({ cells, cellSize = 1, fill = 0.8 }: Props) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const count = cells.length;

  // Stable scratch objects, allocated once per cohort.
  const scratch = useMemo(
    () => ({ object: new THREE.Object3D(), color: new THREE.Color() }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell) continue;
      scratch.object.position.set(cell.x * cellSize, 0, cell.z * cellSize);
      scratch.object.scale.set(cellSize * fill, cell.height, cellSize * fill);
      scratch.object.updateMatrix();
      mesh.setMatrixAt(i, scratch.object.matrix);
      scratch.color.set(cell.color);
      mesh.setColorAt(i, scratch.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells, cellSize, fill, scratch]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[BOX, undefined, count]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial vertexColors roughness={0.85} metalness={0.05} />
    </instancedMesh>
  );
}
