// Compact marching-cubes implementation — pure TS, no GPU.
//
// Ported from D:/The_Hangar/apps/sculpture-gallery/src/marching.ts.
// Adequate for the gallery workshop at <= 96^3; the WebGPU
// marching-cubes runner in the isosurface chamber is the high-end
// alternative.

import { TRI_TABLE, EDGE_TABLE, CORNER_OFFSETS, EDGE_CORNERS } from "./mc-tables";
import type { Field } from "./voxels";

export function marchingCubes(
  field: Field,
  iso: number,
): { positions: Float32Array; normals: Float32Array } {
  const { data, res } = field;
  const verts: number[] = [];

  const sample = (x: number, y: number, z: number) =>
    data[z * res * res + y * res + x] ?? 0;

  for (let z = 0; z < res - 1; z++) {
    for (let y = 0; y < res - 1; y++) {
      for (let x = 0; x < res - 1; x++) {
        let cubeIndex = 0;
        const corners: number[] = new Array(8);
        for (let i = 0; i < 8; i++) {
          const offset = CORNER_OFFSETS[i]!;
          corners[i] = sample(x + offset[0], y + offset[1], z + offset[2]);
          if ((corners[i] ?? 0) < iso) cubeIndex |= 1 << i;
        }
        const edgeMask = EDGE_TABLE[cubeIndex] ?? 0;
        if (edgeMask === 0) continue;

        const edgeVerts: number[][] = new Array(12);
        for (let e = 0; e < 12; e++) {
          if ((edgeMask & (1 << e)) === 0) continue;
          const corner = EDGE_CORNERS[e]!;
          const a = corner[0];
          const b = corner[1];
          const va = corners[a] ?? 0;
          const vb = corners[b] ?? 0;
          const denom = vb - va || 1e-9;
          const t = (iso - va) / denom;
          const oa = CORNER_OFFSETS[a]!;
          const ob = CORNER_OFFSETS[b]!;
          edgeVerts[e] = [
            x + oa[0] + t * (ob[0] - oa[0]),
            y + oa[1] + t * (ob[1] - oa[1]),
            z + oa[2] + t * (ob[2] - oa[2]),
          ];
        }

        const tris = TRI_TABLE[cubeIndex] ?? [-1];
        for (let i = 0; tris[i] !== -1 && i + 2 < tris.length; i += 3) {
          const a = edgeVerts[tris[i]!];
          const b = edgeVerts[tris[i + 1]!];
          const c = edgeVerts[tris[i + 2]!];
          if (!a || !b || !c) continue;
          verts.push(a[0]!, a[1]!, a[2]!);
          verts.push(b[0]!, b[1]!, b[2]!);
          verts.push(c[0]!, c[1]!, c[2]!);
        }
      }
    }
  }

  const positions = new Float32Array(verts);
  const half = res / 2;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 0] = ((positions[i + 0] ?? 0) - half) / half;
    positions[i + 1] = ((positions[i + 1] ?? 0) - half) / half;
    positions[i + 2] = ((positions[i + 2] ?? 0) - half) / half;
  }

  const normals = computeFlatNormals(positions);
  return { positions, normals };
}

function computeFlatNormals(positions: Float32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 9) {
    const ax = (positions[i + 3] ?? 0) - (positions[i + 0] ?? 0);
    const ay = (positions[i + 4] ?? 0) - (positions[i + 1] ?? 0);
    const az = (positions[i + 5] ?? 0) - (positions[i + 2] ?? 0);
    const bx = (positions[i + 6] ?? 0) - (positions[i + 0] ?? 0);
    const by = (positions[i + 7] ?? 0) - (positions[i + 1] ?? 0);
    const bz = (positions[i + 8] ?? 0) - (positions[i + 2] ?? 0);
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
