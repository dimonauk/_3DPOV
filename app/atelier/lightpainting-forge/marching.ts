// Compact marching-cubes implementation.
// Pure TS, no GPU. Adequate for the chamber scaffold; the WebGPU
// `lib/webgpu-marching-cubes/` runner is the path forward once the
// chamber needs live re-meshing per frame.

import type { Field } from "./field";
import {
  TRI_TABLE,
  EDGE_TABLE,
  CORNER_OFFSETS,
  EDGE_CORNERS,
} from "./mc-tables";

export function marchingCubes(
  field: Field,
  iso: number,
): { positions: Float32Array; normals: Float32Array } {
  const { data, res } = field;
  const verts: number[] = [];

  const sample = (x: number, y: number, z: number) =>
    data[z * res * res + y * res + x];

  for (let z = 0; z < res - 1; z++) {
    for (let y = 0; y < res - 1; y++) {
      for (let x = 0; x < res - 1; x++) {
        let cubeIndex = 0;
        const corners: number[] = new Array(8);
        for (let i = 0; i < 8; i++) {
          const [ox, oy, oz] = CORNER_OFFSETS[i];
          corners[i] = sample(x + ox, y + oy, z + oz);
          if (corners[i] < iso) cubeIndex |= 1 << i;
        }
        const edgeMask = EDGE_TABLE[cubeIndex];
        if (edgeMask === 0) continue;

        const edgeVerts: number[][] = new Array(12);
        for (let e = 0; e < 12; e++) {
          if ((edgeMask & (1 << e)) === 0) continue;
          const [a, b] = EDGE_CORNERS[e];
          const va = corners[a];
          const vb = corners[b];
          const t = (iso - va) / (vb - va);
          const [ax, ay, az] = CORNER_OFFSETS[a];
          const [bx, by, bz] = CORNER_OFFSETS[b];
          edgeVerts[e] = [
            x + ax + t * (bx - ax),
            y + ay + t * (by - ay),
            z + az + t * (bz - az),
          ];
        }

        const tris = TRI_TABLE[cubeIndex];
        for (let i = 0; tris[i] !== -1; i += 3) {
          verts.push(...edgeVerts[tris[i]]);
          verts.push(...edgeVerts[tris[i + 1]]);
          verts.push(...edgeVerts[tris[i + 2]]);
        }
      }
    }
  }

  const positions = new Float32Array(verts);
  // Centre + normalize to +/- 1.
  const half = res / 2;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 0] = (positions[i + 0] - half) / half;
    positions[i + 1] = (positions[i + 1] - half) / half;
    positions[i + 2] = (positions[i + 2] - half) / half;
  }

  const normals = computeFlatNormals(positions);
  return { positions, normals };
}

function computeFlatNormals(positions: Float32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i + 3] - positions[i + 0];
    const ay = positions[i + 4] - positions[i + 1];
    const az = positions[i + 5] - positions[i + 2];
    const bx = positions[i + 6] - positions[i + 0];
    const by = positions[i + 7] - positions[i + 1];
    const bz = positions[i + 8] - positions[i + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;
    for (let j = 0; j < 3; j++) {
      normals[i + j * 3 + 0] = nx / len;
      normals[i + j * 3 + 1] = ny / len;
      normals[i + j * 3 + 2] = nz / len;
    }
  }
  return normals;
}
