// GLB export + watertight check.
//
// Watertight test: dedupe vertices spatially, count how many triangles
// share each edge. Every edge in a closed manifold mesh is used by
// exactly 2 faces.
//
// Non-watertight outputs are still printable on SLA, but the slicer may
// bridge holes unpredictably. Surface the boundary count so the operator
// knows whether to round-trip through Blender for a manual seal.

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export type MeshReport = {
  vertexCount: number;
  triangleCount: number;
  uniqueVertexCount: number;
  watertight: boolean;
  boundaryEdgeCount: number;
  nonManifoldEdgeCount: number;
};

export function analyseMesh(geometry: THREE.BufferGeometry): MeshReport {
  const pos = geometry.getAttribute("position");
  const vertexCount = pos.count;
  const triangleCount = vertexCount / 3;

  const { vertexMap, dedupCount } = dedupeVertices(pos);

  const edges = new Map<string, number>();
  for (let i = 0; i < vertexCount; i += 3) {
    const a = vertexMap[i + 0];
    const b = vertexMap[i + 1];
    const c = vertexMap[i + 2];
    bumpEdge(edges, a, b);
    bumpEdge(edges, b, c);
    bumpEdge(edges, c, a);
  }

  let boundary = 0;
  let nonManifold = 0;
  edges.forEach((count) => {
    if (count === 1) boundary++;
    else if (count > 2) nonManifold++;
  });

  return {
    vertexCount,
    triangleCount,
    uniqueVertexCount: dedupCount,
    watertight: boundary === 0 && nonManifold === 0,
    boundaryEdgeCount: boundary,
    nonManifoldEdgeCount: nonManifold,
  };
}

function bumpEdge(map: Map<string, number>, a: number, b: number) {
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function dedupeVertices(
  pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
): { vertexMap: Int32Array; dedupCount: number } {
  const count = pos.count;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    if (x < min[0]) min[0] = x;
    if (x > max[0]) max[0] = x;
    if (y < min[1]) min[1] = y;
    if (y > max[1]) max[1] = y;
    if (z < min[2]) min[2] = z;
    if (z > max[2]) max[2] = z;
  }
  const extent = Math.max(
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
    1e-6,
  );
  const scale = 1e6 / extent;

  const map = new Map<string, number>();
  const vertexMap = new Int32Array(count);
  let next = 0;
  for (let i = 0; i < count; i++) {
    const x = Math.round(pos.getX(i) * scale);
    const y = Math.round(pos.getY(i) * scale);
    const z = Math.round(pos.getZ(i) * scale);
    const key = `${x},${y},${z}`;
    let idx = map.get(key);
    if (idx === undefined) {
      idx = next++;
      map.set(key, idx);
    }
    vertexMap[i] = idx;
  }
  return { vertexMap, dedupCount: next };
}

export async function exportGlb(
  geometry: THREE.BufferGeometry,
  _name: string,
  options?: { material?: THREE.Material; binary?: boolean; scaleMm?: number },
): Promise<Uint8Array> {
  const material =
    options?.material ?? new THREE.MeshStandardMaterial({ color: 0xff66cc });
  const mesh = new THREE.Mesh(geometry, material);
  if (options?.scaleMm) {
    // Scale to mm units; downstream slicers default to mm.
    mesh.scale.setScalar(options.scaleMm);
  }
  const scene = new THREE.Scene();
  scene.add(mesh);

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(new Uint8Array(result));
        else resolve(new TextEncoder().encode(JSON.stringify(result)));
      },
      (error) => reject(error),
      { binary: options?.binary ?? true },
    );
  });
}
