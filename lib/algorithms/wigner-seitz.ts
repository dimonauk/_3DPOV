/**
 * lib/algorithms/wigner-seitz.ts — BCC Wigner-Seitz cell lattice.
 *
 * # Purpose
 * Closes the `wigner-seitz` slot (catalogue id 26). A Wigner-Seitz
 * cell on the BCC lattice is the truncated octahedron — the convex
 * polyhedron bounded by perpendicular bisectors to a site's 14
 * nearest neighbours (8 cube-corner + 6 face-centre). We build one
 * canonical truncated octahedron from its known vertex/edge geometry
 * and instantiate it at the 3×3×3 BCC sites of a small block; cell
 * skeletons render as thin tubes.
 *
 * # Why this shape
 * Computing the polyhedron-from-half-spaces clipper from scratch is
 * 300+ lines on its own; the algebraic shape of the BCC Wigner-Seitz
 * cell is well known (truncated octahedron with edge length √2/2 in
 * the conventional cube basis), so we hard-encode the vertex set and
 * the 36-edge incidence list and skip the runtime intersection step.
 * The result is geometrically equivalent.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  mergeAll,
  normalise,
} from "./_base";

export type WignerSeitzParams = CommonParams;

export function defaultParams(): WignerSeitzParams {
  return { seed: 2626, complexity: 0.5, scale: 1.0, density: 0.5 };
}

/**
 * Vertices of the canonical truncated octahedron centred on the
 * origin, scale 1: the 24 permutations of (0, ±1, ±2). Edge length is
 * √2 in this representation; we'll rescale by the lattice param.
 */
function truncatedOctahedronVerts(): THREE.Vector3[] {
  const verts: THREE.Vector3[] = [];
  const ones = [1, -1];
  const twos = [2, -2];
  for (const a of ones) {
    for (const b of twos) {
      verts.push(new THREE.Vector3(0, a, b));
      verts.push(new THREE.Vector3(0, b, a));
      verts.push(new THREE.Vector3(a, 0, b));
      verts.push(new THREE.Vector3(b, 0, a));
      verts.push(new THREE.Vector3(a, b, 0));
      verts.push(new THREE.Vector3(b, a, 0));
    }
  }
  // Dedupe.
  const seen = new Map<string, THREE.Vector3>();
  for (const v of verts) {
    const key = `${v.x}|${v.y}|${v.z}`;
    if (!seen.has(key)) seen.set(key, v);
  }
  return [...seen.values()];
}

/**
 * Edges of the truncated octahedron: every pair of vertices whose
 * Euclidean distance equals the edge length √2 in our scale.
 */
function truncatedOctahedronEdges(
  verts: THREE.Vector3[],
): [number, number][] {
  const edges: [number, number][] = [];
  const target = Math.sqrt(2);
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const a = verts[i];
      const b = verts[j];
      if (!a || !b) continue;
      const d = a.distanceTo(b);
      if (Math.abs(d - target) < 1e-3) edges.push([i, j]);
    }
  }
  return edges;
}

function cellGeometry(
  centre: THREE.Vector3,
  cellScale: number,
  ribW: number,
): THREE.BufferGeometry[] {
  const verts = truncatedOctahedronVerts();
  const edges = truncatedOctahedronEdges(verts);
  const geos: THREE.BufferGeometry[] = [];
  for (const [i, j] of edges) {
    const a = verts[i];
    const b = verts[j];
    if (!a || !b) continue;
    const va = a.clone().multiplyScalar(cellScale).add(centre);
    const vb = b.clone().multiplyScalar(cellScale).add(centre);
    geos.push(
      new THREE.TubeGeometry(
        new THREE.LineCurve3(va, vb),
        1,
        ribW,
        4,
        false,
      ),
    );
  }
  return geos;
}

export function generateGeometry(p: WignerSeitzParams): THREE.BufferGeometry {
  const grid = 2 + Math.floor(p.complexity * 2); // 2 → 4 cells per side.
  const half = (grid - 1) / 2;
  // Conventional BCC cube of side `a`: WS cell vertices are at
  // distance a*√(5)/4 from centre in our (0,1,2) scaling, so pick
  // `cellScale` so the cell radius fits the lattice cube of side a.
  const a = p.scale / Math.max(1, grid);
  const cellScale = a * 0.25; // (0,1,2)-scale fits inside an `a`-cube.
  const ribW = cellScale * 0.06 * (0.5 + (p.density ?? 0.5) * 0.9);

  const geos: THREE.BufferGeometry[] = [];

  // BCC has two sites per conventional cube: corner (0,0,0) and centre
  // (½,½,½). Emit cells at every corner site and every body-centre.
  for (let z = 0; z < grid; z++) {
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const cx = (x - half) * a;
        const cy = (y - half) * a;
        const cz = (z - half) * a;
        const corner = new THREE.Vector3(cx, cy, cz);
        geos.push(...cellGeometry(corner, cellScale, ribW));
        // Body-centre offset by ½ a in all axes.
        const centre = new THREE.Vector3(cx + a * 0.5, cy + a * 0.5, cz + a * 0.5);
        geos.push(...cellGeometry(centre, cellScale, ribW));
      }
    }
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: WignerSeitzParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
