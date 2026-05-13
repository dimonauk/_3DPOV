/**
 * lib/algorithms/gear.ts — Involute gear-tooth extrusion.
 *
 * Ported from D:\The_Hangar\Dolly_OS\src\systems\jewel-array\geometry\
 * algorithms\algo_13_Gear.ts. An epicyclic gear: outer / pitch / root
 * / hub radii, N teeth, bevelled extrusion.
 */

import * as THREE from "three";
import {
  type CommonParams,
  type GeneratedMesh,
  attrsOf,
  normalise,
  seededRng,
} from "./_base";

export type GearParams = CommonParams;

export function defaultParams(): GearParams {
  return { seed: 555, complexity: 0.5, scale: 1.0, density: 0.7 };
}

export function generateGeometry(p: GearParams): THREE.BufferGeometry {
  const rng = seededRng(p.seed);
  const teeth = Math.floor(8 + p.complexity * 16);
  const outerR = 0.45 * p.scale;
  const pitchR = outerR * 0.82;
  const rootR = outerR * 0.68;
  const hubR = outerR * 0.25;
  const depth = 0.12 * p.scale;
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.35) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.65) / teeth) * Math.PI * 2;
    const a3 = ((i + 1) / teeth) * Math.PI * 2;
    if (i === 0) shape.moveTo(rootR * Math.cos(a0), rootR * Math.sin(a0));
    shape.lineTo(pitchR * Math.cos(a0), pitchR * Math.sin(a0));
    shape.lineTo(outerR * Math.cos(a1), outerR * Math.sin(a1));
    shape.lineTo(outerR * Math.cos(a2), outerR * Math.sin(a2));
    shape.lineTo(pitchR * Math.cos(a3), pitchR * Math.sin(a3));
    shape.lineTo(rootR * Math.cos(a3), rootR * Math.sin(a3));
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, hubR, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const spokes = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < spokes; i++) {
    const sa = (i / spokes) * Math.PI * 2;
    const sp = new THREE.Path();
    sp.absellipse(
      Math.cos(sa) * pitchR * 0.5,
      Math.sin(sa) * pitchR * 0.5,
      0.06 * p.scale,
      0.025 * p.scale,
      0,
      Math.PI * 2,
      false,
      sa,
    );
    shape.holes.push(sp);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.015 * p.scale,
    bevelThickness: 0.015 * p.scale,
    bevelSegments: 2,
  });
  return normalise(geo, p.scale);
}

export function generate(p: GearParams): GeneratedMesh {
  return attrsOf(generateGeometry(p));
}
