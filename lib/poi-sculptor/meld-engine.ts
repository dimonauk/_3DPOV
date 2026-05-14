/**
 * lib/poi-sculptor/meld-engine.ts
 *
 * Implicit-surface trail melding. Two (or more) poi trail spines are
 * summed as radial potential fields on a 3D grid, then marching cubes
 * extracts the iso-surface. The result is a single organic mesh where
 * the trails fuse — printable, watertight in well-formed cases.
 *
 * Three kernel options:
 *   wyvill   — C² continuous, roundest organic merging (default)
 *   metaball — classic; slightly harder edges
 *   inverse  — trails stay distinct until very close, then snap
 */

import {
  EDGE_TABLE,
  TRI_TABLE,
  EDGE_VERTS,
  CORNER_OFFSETS,
} from "./marching-cubes-tables";
import type { TrailPoint } from "./moves";

export type MeldKernel = "wyvill" | "metaball" | "inverse";

export type MeldOptions = {
  kernel?: MeldKernel;
  radius?: number;
  resolution?: number;
  isoValue?: number;
};

export type MeldResult = {
  positions: Float32Array;
  normals: Float32Array;
  vertexCount: number;
};

type KernelFn = (r: number, R: number) => number;

const kernelWyvill: KernelFn = (r, R) => {
  if (r >= R) return 0;
  const s = (r * r) / (R * R);
  const t = 1 - s;
  return t * t * t;
};

const kernelMetaball: KernelFn = (r, R) => {
  const s = (r * r) / (R * R);
  const t = 1 + s;
  return 1 / (t * t);
};

const kernelInverse: KernelFn = (r, R) => {
  if (r < 0.001) return 1000;
  return (R * R) / (r * r);
};

const KERNELS: Record<MeldKernel, KernelFn> = {
  wyvill: kernelWyvill,
  metaball: kernelMetaball,
  inverse: kernelInverse,
};

function vertexInterp(
  iso: number,
  p1: [number, number, number],
  p2: [number, number, number],
  v1: number,
  v2: number,
): [number, number, number] {
  if (Math.abs(v1 - iso) < 0.00001) return [...p1];
  if (Math.abs(v2 - iso) < 0.00001) return [...p2];
  if (Math.abs(v1 - v2) < 0.00001) return [...p1];
  const mu = (iso - v1) / (v2 - v1);
  return [
    p1[0] + mu * (p2[0] - p1[0]),
    p1[1] + mu * (p2[1] - p1[1]),
    p1[2] + mu * (p2[2] - p1[2]),
  ];
}

type Field = {
  grid: Float32Array;
  res: number;
  min: [number, number, number];
  step: number;
};

function evaluateField(
  spines: TrailPoint[][],
  resolution: number,
  radius: number,
  kernelFn: KernelFn,
): Field {
  const res = resolution;
  let xmin = Infinity, ymin = Infinity, zmin = Infinity;
  let xmax = -Infinity, ymax = -Infinity, zmax = -Infinity;
  for (const spine of spines) {
    for (const p of spine) {
      if (p[0] < xmin) xmin = p[0]; if (p[0] > xmax) xmax = p[0];
      if (p[1] < ymin) ymin = p[1]; if (p[1] > ymax) ymax = p[1];
      if (p[2] < zmin) zmin = p[2]; if (p[2] > zmax) zmax = p[2];
    }
  }

  const pad = radius * 2;
  xmin -= pad; ymin -= pad; zmin -= pad;
  xmax += pad; ymax += pad; zmax += pad;

  const rangeX = xmax - xmin, rangeY = ymax - ymin, rangeZ = zmax - zmin;
  const maxRange = Math.max(rangeX, rangeY, rangeZ);
  const step = maxRange / (res - 1);

  const grid = new Float32Array(res * res * res);

  for (const spine of spines) {
    const skip = Math.max(1, Math.floor(spine.length / 400));
    for (let si = 0; si < spine.length; si += skip) {
      const sp = spine[si]!;
      const ci = Math.floor((sp[0] - xmin) / step);
      const cj = Math.floor((sp[1] - ymin) / step);
      const ck = Math.floor((sp[2] - zmin) / step);
      const cellRadius = Math.ceil(radius / step) + 1;

      for (let di = -cellRadius; di <= cellRadius; di++) {
        const gi = ci + di;
        if (gi < 0 || gi >= res) continue;
        const wx = xmin + gi * step;
        for (let dj = -cellRadius; dj <= cellRadius; dj++) {
          const gj = cj + dj;
          if (gj < 0 || gj >= res) continue;
          const wy = ymin + gj * step;
          for (let dk = -cellRadius; dk <= cellRadius; dk++) {
            const gk = ck + dk;
            if (gk < 0 || gk >= res) continue;
            const wz = zmin + gk * step;
            const dx = wx - sp[0], dy = wy - sp[1], dz = wz - sp[2];
            const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (r < radius * 1.5) {
              const idx = gi * res * res + gj * res + gk;
              grid[idx] = (grid[idx] ?? 0) + kernelFn(r, radius);
            }
          }
        }
      }
    }
  }

  return { grid, res, min: [xmin, ymin, zmin], step };
}

function marchingCubes(field: Field, iso: number): { positions: Float32Array; normals: Float32Array } {
  const { grid, res, min, step } = field;
  const positions: number[] = [];

  const val = (i: number, j: number, k: number): number => {
    if (i < 0 || j < 0 || k < 0 || i >= res || j >= res || k >= res) return 0;
    return grid[i * res * res + j * res + k]!;
  };
  const pos = (i: number, j: number, k: number): [number, number, number] => [
    min[0] + i * step,
    min[1] + j * step,
    min[2] + k * step,
  ];

  for (let i = 0; i < res - 1; i++) {
    for (let j = 0; j < res - 1; j++) {
      for (let k = 0; k < res - 1; k++) {
        const v = [
          val(i, j, k), val(i + 1, j, k), val(i + 1, j + 1, k), val(i, j + 1, k),
          val(i, j, k + 1), val(i + 1, j, k + 1), val(i + 1, j + 1, k + 1), val(i, j + 1, k + 1),
        ];

        let cubeIdx = 0;
        for (let c = 0; c < 8; c++) {
          if (v[c]! >= iso) cubeIdx |= 1 << c;
        }
        const edgeMask = EDGE_TABLE[cubeIdx];
        if (edgeMask === undefined || edgeMask === 0) continue;

        const p = CORNER_OFFSETS.map(([di, dj, dk]) => pos(i + di, j + dj, k + dk));
        const edgeVerts: ([number, number, number] | undefined)[] = new Array(12);
        for (let e = 0; e < 12; e++) {
          if (edgeMask & (1 << e)) {
            const [a, b] = EDGE_VERTS[e]!;
            edgeVerts[e] = vertexInterp(iso, p[a]!, p[b]!, v[a]!, v[b]!);
          }
        }

        const tri = TRI_TABLE[cubeIdx]!;
        for (let t = 0; t < tri.length; t += 3) {
          const a = edgeVerts[tri[t]!], b = edgeVerts[tri[t + 1]!], c = edgeVerts[tri[t + 2]!];
          if (a && b && c) positions.push(...a, ...b, ...c);
        }
      }
    }
  }

  const posArr = new Float32Array(positions);
  const nrmArr = new Float32Array(posArr.length);
  for (let i = 0; i < posArr.length; i += 9) {
    const ax = posArr[i + 3]! - posArr[i]!;
    const ay = posArr[i + 4]! - posArr[i + 1]!;
    const az = posArr[i + 5]! - posArr[i + 2]!;
    const bx = posArr[i + 6]! - posArr[i]!;
    const by = posArr[i + 7]! - posArr[i + 1]!;
    const bz = posArr[i + 8]! - posArr[i + 2]!;
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    const nnx = nx / len, nny = ny / len, nnz = nz / len;
    for (let j = 0; j < 3; j++) {
      nrmArr[i + j * 3] = nnx;
      nrmArr[i + j * 3 + 1] = nny;
      nrmArr[i + j * 3 + 2] = nnz;
    }
  }
  return { positions: posArr, normals: nrmArr };
}

export function meldTrails(
  h0: TrailPoint[],
  h1: TrailPoint[],
  opts: MeldOptions = {},
): MeldResult {
  const resolution = opts.resolution ?? 64;
  const radius = opts.radius ?? 0.18;
  const kernel: MeldKernel = opts.kernel ?? "wyvill";
  const isoValue = opts.isoValue ?? 0.5;
  const kernelFn = KERNELS[kernel];

  const field = evaluateField([h0, h1], resolution, radius, kernelFn);
  const mesh = marchingCubes(field, isoValue);

  return {
    positions: mesh.positions,
    normals: mesh.normals,
    vertexCount: mesh.positions.length / 3,
  };
}

export const KERNEL_OPTIONS: { id: MeldKernel; label: string; desc: string }[] = [
  { id: "wyvill", label: "Wyvill", desc: "C² continuous — roundest, most organic" },
  { id: "metaball", label: "Metaball", desc: "Classic — slightly harder edges" },
  { id: "inverse", label: "Inverse²", desc: "Distinct until close, then snap" },
];
