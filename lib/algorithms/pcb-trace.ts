/**
 * lib/algorithms/pcb-trace.ts — Printed-circuit-board trace routing.
 *
 * Ported in the spirit of D:\The_Hangar\Dolly_OS\src\systems\jewel-array\
 * geometry\algorithms\algo_12_PCBTrace.ts. The brief asks for random
 * node scatter on a 2D grid, Manhattan (right-angle) routing between
 * neighbours, and via-ring cylinders at every corner — everything
 * sits in a thin extruded ground-plane frame so the board reads as a
 * physical artefact rather than a stencil.
 *
 * Visually: a retrofuturist circuit board fragment in miniature —
 * pads, traces, and vias on a thin substrate.
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

export type PCBTraceParams = CommonParams;

export function defaultParams(): PCBTraceParams {
  return { seed: 1212, complexity: 0.5, scale: 1.0, density: 0.5 };
}

type Node = { row: number; col: number };

/** Scatter nodes on the grid; ~45% occupancy rises with `density`. */
function scatterNodes(
  rows: number,
  cols: number,
  rng: () => number,
  density: number,
): Node[] {
  const nodes: Node[] = [];
  const threshold = 0.35 + density * 0.35;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() < threshold) nodes.push({ row: r, col: c });
    }
  }
  return nodes;
}

/** Build the ground-plane frame (a rectangle with a rectangular hole). */
function buildFrame(
  width: number,
  height: number,
  margin: number,
  depth: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-width / 2 + margin, -height / 2 + margin);
  hole.lineTo(width / 2 - margin, -height / 2 + margin);
  hole.lineTo(width / 2 - margin, height / 2 - margin);
  hole.lineTo(-width / 2 + margin, height / 2 - margin);
  hole.closePath();
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, {
    depth: depth * 0.4,
    bevelEnabled: false,
  });
}

export function generateGeometry(p: PCBTraceParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const rows = 5 + Math.floor(p.complexity * 7);
  const cols = 5 + Math.floor(p.complexity * 7);
  const density = p.density ?? 0.5;
  const traceW = 0.022 * p.scale * (0.3 + density * 0.9);
  const depth = 0.06 * p.scale;
  const viaR = traceW * 2.0;
  const viaH = depth * 1.6;
  const cellSz = (p.scale * 0.82) / Math.max(rows, cols);
  const traceZ = depth * 0.5;
  const geos: THREE.BufferGeometry[] = [];

  const gpW = cols * cellSz;
  const gpH = rows * cellSz;
  geos.push(buildFrame(gpW, gpH, traceW * 2.5, depth));

  const nodes = scatterNodes(rows, cols, rng, density);

  const toWorld = (n: Node): THREE.Vector3 =>
    new THREE.Vector3(
      (n.col - cols / 2 + 0.5) * cellSz,
      (n.row - rows / 2 + 0.5) * cellSz,
      traceZ,
    );

  // Pad pucks at every node so a route ending alone still reads.
  for (const n of nodes) {
    const pad = new THREE.CylinderGeometry(viaR * 0.9, viaR * 0.9, viaH * 0.7, 8);
    const w = toWorld(n);
    pad.rotateX(Math.PI / 2);
    pad.translate(w.x, w.y, 0);
    geos.push(pad);
  }

  // Route each consecutive node pair with a right-angle (Manhattan)
  // path. Coin-flip selects which axis bends first so the board
  // visually fills both halves of the L.
  for (let i = 0; i < nodes.length - 1; i++) {
    if (rng() > 0.65) continue;
    const a = nodes[i];
    const b = nodes[i + 1];
    if (!a || !b) continue;
    const aw = toWorld(a);
    const bw = toWorld(b);
    if (aw.distanceTo(bw) < cellSz * 0.5) continue;
    const horizFirst = rng() > 0.5;
    const corner = new THREE.Vector3(
      horizFirst ? bw.x : aw.x,
      horizFirst ? aw.y : bw.y,
      traceZ,
    );
    geos.push(
      new THREE.TubeGeometry(new THREE.LineCurve3(aw, corner), 1, traceW, 4, false),
    );
    geos.push(
      new THREE.TubeGeometry(new THREE.LineCurve3(corner, bw), 1, traceW, 4, false),
    );
    // Via ring at the corner.
    const via = new THREE.CylinderGeometry(viaR, viaR, viaH, 8);
    via.rotateX(Math.PI / 2);
    via.translate(corner.x, corner.y, 0);
    geos.push(via);
  }

  return normalise(mergeAll(geos), p.scale);
}

export function generate(p: PCBTraceParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
