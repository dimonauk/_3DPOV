/**
 * app/atelier/prism-lattice/scene-geometry.ts
 *
 * Pure geometry math for the lattice: subdivide an icosahedron into a
 * geodesic sphere, walk its triangle index to a de-duplicated edge
 * list, and pack everything the GPU side needs into flat Float32Arrays
 * — one row per strut (edge) and one row per joint (vertex).
 *
 * Only imports plain `three` (Vector3, IcosahedronGeometry), not
 * `three/webgpu` — this module never touches a browser global at
 * import time and would be safe to unit-test or import from SSR code,
 * even though in practice it only gets pulled in via scene.ts's
 * dynamic import chain.
 */

import * as THREE from "three";

export type LatticeParams = {
  /** Sphere radius the icosahedron is inscribed in. */
  radius: number;
  /** Subdivision frequency — 0 is the bare 20-face icosahedron, 1 gives 80 faces / 120 edges, 2 gives 320 faces / 480 edges. */
  detail: number;
  /** Base strut radius, in the same units as `radius`. */
  barRadius: number;
  /** Deterministic seed for the per-strut/per-joint shimmer phase. */
  seed?: number;
};

export type LatticeInstanceData = {
  edgeCount: number;
  /** Edge midpoint, object space. edgeCount * 3 floats. */
  mid: Float32Array;
  /** Normalised strut axis. edgeCount * 3 floats. */
  dir: Float32Array;
  /** First basis vector perpendicular to `dir`. edgeCount * 3 floats. */
  right: Float32Array;
  /** Second basis vector, `dir` × `right`. edgeCount * 3 floats. */
  up: Float32Array;
  /** Half the strut's rest length. edgeCount floats. */
  halfLen: Float32Array;
  /** Base cross-section radius (before the growth pulse). edgeCount floats. */
  barRadius: Float32Array;
  /** Random 0..1 phase, decorrelates each strut's pulse. edgeCount floats. */
  phase: Float32Array;
  /** Spatial hue parameter derived from the strut's position on the sphere. edgeCount floats. */
  wave: Float32Array;

  jointCount: number;
  /** Vertex position, object space. jointCount * 3 floats. */
  jointPos: Float32Array;
  jointPhase: Float32Array;
  jointWave: Float32Array;
};

/** Small deterministic PRNG so a given seed always lays out the same shimmer pattern. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Spatial hue seed for a point on the sphere — a north/south band mixed with a swirl around the vertical axis. */
function waveFor(p: THREE.Vector3, radius: number): number {
  const lat = p.y / radius; // -1..1
  const lon = Math.atan2(p.z, p.x) / (Math.PI * 2); // -0.5..0.5
  return lat * 0.6 + lon * 1.4;
}

/** Any unit vector perpendicular to `dir`, picked deterministically. */
function perpBasis(dir: THREE.Vector3): {
  right: THREE.Vector3;
  up: THREE.Vector3;
} {
  const helper =
    Math.abs(dir.y) < 0.99
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
  const right = new THREE.Vector3().crossVectors(helper, dir).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  return { right, up };
}

/**
 * Subdivide an icosahedron, extract its unique vertices + edges, and
 * pack the per-strut / per-joint instance data the TSL material reads
 * on the GPU. Every strut's transform lives entirely in this data —
 * the InstancedMesh itself never gets a per-instance matrix.
 */
export function buildLatticeInstanceData(
  params: LatticeParams,
): LatticeInstanceData {
  const rng = mulberry32(params.seed ?? 1);
  const geo = new THREE.IcosahedronGeometry(params.radius, params.detail);
  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  const index = geo.getIndex();
  const triIndices = index
    ? Array.from(index.array)
    : Array.from({ length: posAttr.count }, (_, i) => i);

  // Icosahedron subdivision leaves duplicate positions at shared
  // triangle corners — collapse them to one vertex id per unique point.
  const uniqueVertices: THREE.Vector3[] = [];
  const idByKey = new Map<string, number>();
  const idByRawIndex = new Int32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    let id = idByKey.get(key);
    if (id === undefined) {
      id = uniqueVertices.length;
      idByKey.set(key, id);
      uniqueVertices.push(v);
    }
    idByRawIndex[i] = id;
  }

  const edgeKeys = new Set<string>();
  const edges: Array<[number, number]> = [];
  for (let t = 0; t < triIndices.length; t += 3) {
    const tri = [
      idByRawIndex[triIndices[t]!]!,
      idByRawIndex[triIndices[t + 1]!]!,
      idByRawIndex[triIndices[t + 2]!]!,
    ];
    for (let e = 0; e < 3; e++) {
      const a = tri[e]!;
      const b = tri[(e + 1) % 3]!;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push(a < b ? [a, b] : [b, a]);
    }
  }
  geo.dispose();

  const edgeCount = edges.length;
  const mid = new Float32Array(edgeCount * 3);
  const dir = new Float32Array(edgeCount * 3);
  const right = new Float32Array(edgeCount * 3);
  const up = new Float32Array(edgeCount * 3);
  const halfLen = new Float32Array(edgeCount);
  const barRadius = new Float32Array(edgeCount);
  const phase = new Float32Array(edgeCount);
  const wave = new Float32Array(edgeCount);

  const tmpMid = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();
  for (let i = 0; i < edgeCount; i++) {
    const [ai, bi] = edges[i]!;
    const a = uniqueVertices[ai]!;
    const b = uniqueVertices[bi]!;
    tmpMid.addVectors(a, b).multiplyScalar(0.5);
    tmpDir.subVectors(b, a);
    const len = tmpDir.length();
    tmpDir.normalize();
    const { right: r, up: u } = perpBasis(tmpDir);

    mid.set([tmpMid.x, tmpMid.y, tmpMid.z], i * 3);
    dir.set([tmpDir.x, tmpDir.y, tmpDir.z], i * 3);
    right.set([r.x, r.y, r.z], i * 3);
    up.set([u.x, u.y, u.z], i * 3);
    halfLen[i] = len * 0.5;
    barRadius[i] = params.barRadius;
    phase[i] = rng();
    wave[i] = waveFor(tmpMid, params.radius);
  }

  const jointCount = uniqueVertices.length;
  const jointPos = new Float32Array(jointCount * 3);
  const jointPhase = new Float32Array(jointCount);
  const jointWave = new Float32Array(jointCount);
  for (let i = 0; i < jointCount; i++) {
    const v = uniqueVertices[i]!;
    jointPos.set([v.x, v.y, v.z], i * 3);
    jointPhase[i] = rng();
    jointWave[i] = waveFor(v, params.radius);
  }

  return {
    edgeCount,
    mid,
    dir,
    right,
    up,
    halfLen,
    barRadius,
    phase,
    wave,
    jointCount,
    jointPos,
    jointPhase,
    jointWave,
  };
}
