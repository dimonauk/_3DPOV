/**
 * lib/algorithms/diatom-hex.ts — Diatom-shell hexagonal pore plate.
 *
 * Ported in the spirit of D:\The_Hangar\Dolly_OS\src\systems\jewel-array\
 * geometry\algorithms\algo_30_DiatomHex.ts. The Hangar version assembled
 * the shell from torus + cylinder primitives per pore; the brief reads
 * it as a thin hex-lattice plate, so we build each cell as a single
 * extruded hexagonal Shape with a concentric hex Path hole — every
 * "pore" is a real perforation through the plate.
 *
 * Visually: a coin-shaped fragment of diatom frustule — concentric
 * hexagonal pore field bounded by a circular outer rim.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  mergeAll,
  normalise,
  seededRng,
} from "./_base";

export type DiatomHexParams = CommonParams;

export function defaultParams(): DiatomHexParams {
  return { seed: 3030, complexity: 0.5, scale: 1.0, density: 0.7 };
}

/** Pointy-top hexagon vertices around (cx, cy) at radius r. */
function hexPoints(cx: number, cy: number, r: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}

function hexCell(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  depth: number,
): THREE.BufferGeometry {
  const outer = hexPoints(cx, cy, outerR);
  const shape = new THREE.Shape(outer);
  const inner = hexPoints(cx, cy, innerR);
  const hole = new THREE.Path();
  const first = inner[0];
  if (first) hole.moveTo(first.x, first.y);
  for (let i = 1; i < inner.length; i++) {
    const p = inner[i];
    if (p) hole.lineTo(p.x, p.y);
  }
  hole.closePath();
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}

export function generateGeometry(p: DiatomHexParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const rings = 3 + Math.floor(p.complexity * 3);
  const density = p.density ?? 0.7;
  // outerR is the cell's circumradius; the lattice spacing is
  // outerR * sqrt(3) horizontally, outerR * 1.5 vertically — the
  // standard pointy-top hex offset grid.
  const outerR = 0.07 * p.scale;
  // density modulates the wall thickness: higher density = thinner
  // wall (larger inner hex), denser-looking pore field.
  const innerR = outerR * (0.55 + density * 0.3);
  const depth = 0.05 * p.scale;
  const hexW = outerR * Math.sqrt(3);
  const hexH = outerR * 1.5;
  const outerCutoff = (rings + 0.2) * hexW * 0.5;

  const geos: THREE.BufferGeometry[] = [];

  for (let row = -rings; row <= rings; row++) {
    const xOffset = row % 2 === 0 ? 0 : hexW * 0.5;
    for (let col = -rings; col <= rings; col++) {
      const cx = col * hexW + xOffset;
      const cy = row * hexH;
      if (Math.sqrt(cx * cx + cy * cy) > outerCutoff) continue;
      // 5% sporadic missing cells gives the lattice an organic
      // (rather than purely crystalline) read.
      if (rng() < 0.05) continue;
      geos.push(hexCell(cx, cy, outerR, innerR, depth));
    }
  }

  // Outer rim: a torus traces the lattice boundary so the silhouette
  // reads as a coin rather than a ragged hex cloud.
  const rimR = outerCutoff * 0.95;
  const rim = new THREE.TorusGeometry(rimR, depth * 0.5, 8, 64);
  geos.push(rim);

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: DiatomHexParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
