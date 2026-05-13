/**
 * lib/algorithms/_base.ts — Shared helpers for the jewellery-algorithm ports.
 *
 * The Wave-1 catalogue at `lib/assets/algorithms.ts` enumerates the 30
 * algorithms; Wave 2 ports the runnable TypeScript sources here.
 *
 * Each ported algorithm exports:
 *   - a typed `<Slug>Params` record
 *   - `generate(params)` returning `{ positions, indices?, uvs? }` (raw
 *     vertex arrays so the algorithm can be used outside Three.js if
 *     wanted — wasm exporters, glTF writers, etc)
 *   - `generateGeometry(params)` returning a `THREE.BufferGeometry` for
 *     in-browser R3F preview
 *   - `defaultParams()`
 *
 * The shared `seededRng`, `mergeGeometries`, `normalise`, `attrsOf`
 * helpers all live here so the per-algorithm files stay short.
 *
 * Ported from `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\BaseAlgorithm.ts`
 * (the abstract base class) — we drop the class hierarchy and ship
 * plain functions because the algorithms are pure data-in → data-out
 * (no state between calls).
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type GeneratedMesh = {
  positions: Float32Array;
  indices?: Uint32Array;
  uvs?: Float32Array;
  normals?: Float32Array;
};

/** Linear-congruential RNG matching BaseAlgorithm.seededRng. */
export function seededRng(seed: number): () => number {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Merge an array of BufferGeometries into one. Mirrors BaseAlgorithm.merge
 * (filters out empties, ensures normals, falls back to first valid on
 * any merge failure).
 */
export function mergeAll(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geos.length === 0) return new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const valid = geos.filter((g) => g.getAttribute("position"));
  if (valid.length === 0) return new THREE.BoxGeometry(0.1, 0.1, 0.1);
  valid.forEach((g) => {
    if (!g.getAttribute("normal")) g.computeVertexNormals();
  });
  try {
    const m = mergeGeometries(valid, false);
    if (m) {
      m.computeVertexNormals();
      return m;
    }
  } catch {
    /* fall through */
  }
  const first = valid[0];
  if (!first) return new THREE.BoxGeometry(0.1, 0.1, 0.1);
  return first;
}

/** Centre + scale geometry to fit in a target-size bounding box. */
export function normalise(
  geo: THREE.BufferGeometry,
  targetSize = 1.0,
): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (!bb) return geo;
  const size = new THREE.Vector3();
  bb.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const sc = targetSize / maxDim;
    geo.scale(sc, sc, sc);
  }
  geo.computeBoundingBox();
  if (!geo.boundingBox) return geo;
  const centre = new THREE.Vector3();
  geo.boundingBox.getCenter(centre);
  geo.translate(-centre.x, -centre.y, -centre.z);
  return geo;
}

/** Pull positions / indices / uvs out of a BufferGeometry into raw arrays. */
export function attrsOf(geo: THREE.BufferGeometry): GeneratedMesh {
  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  const idxAttr = geo.getIndex();
  const uvAttr = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
  const nrmAttr = geo.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const positions = posAttr
    ? new Float32Array(posAttr.array as ArrayLike<number>)
    : new Float32Array(0);
  const indices = idxAttr
    ? new Uint32Array(idxAttr.array as ArrayLike<number>)
    : undefined;
  const uvs = uvAttr
    ? new Float32Array(uvAttr.array as ArrayLike<number>)
    : undefined;
  const normals = nrmAttr
    ? new Float32Array(nrmAttr.array as ArrayLike<number>)
    : undefined;
  return { positions, indices, uvs, normals };
}

/** Rebuild a BufferGeometry from a GeneratedMesh — the inverse of attrsOf. */
export function geometryOf(mesh: GeneratedMesh): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(mesh.positions, 3));
  if (mesh.indices) {
    geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  }
  if (mesh.uvs) {
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(mesh.uvs, 2));
  }
  if (mesh.normals) {
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(mesh.normals, 3));
  } else {
    geo.computeVertexNormals();
  }
  return geo;
}

/** Shared knobs every algorithm accepts. */
export type CommonParams = {
  seed: number;
  complexity: number; // 0..1
  scale: number; // world units, 1.0 = 25mm cell
  density?: number; // 0..1
};
