/**
 * components/visualiser/tir-scene-geometry.ts — Pure geometry builders +
 * stage constants for the TIR visualiser.
 *
 * No React, no R3F context — just BufferGeometry factories the Stage
 * pulls into useMemo blocks.
 */

import * as THREE from "three";

export const DEG = Math.PI / 180;

/** Stage dimensions. Rays are ~1.6 units long; the interface disc is
 *  4 units across; the upper-medium volume slab is 1.6 deep. */
export const RAY_LENGTH = 1.6;
export const INTERFACE_RADIUS = 2.4;
export const VOLUME_DEPTH = 1.6;
export const ARC_RADIUS = 0.3;

export const HIT_POINT = new THREE.Vector3(0, 0, 0);

/** Straight-line geometry between two points. */
export function lineGeometry(
  a: THREE.Vector3,
  b: THREE.Vector3,
): THREE.BufferGeometry {
  const positions = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/**
 * Arc in the XY plane (z = 0). Each i-th point sits at
 * (sin(a) * r, cos(a) * r, 0) where `a` sweeps from `startRad` to
 * `endRad`. A `startRad` of 0 puts the first point straight up the +Y
 * axis (along the surface normal), which matches the convention
 * "angle measured from the normal".
 */
export function arcGeometry(
  startRad: number,
  endRad: number,
  radius: number,
  segments = 32,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = startRad + (endRad - startRad) * t;
    positions.push(Math.sin(a) * radius, Math.cos(a) * radius, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return g;
}

/** Closed circle in the XZ plane (y = 0) — the rim of the interface disc. */
export function discRimGeometry(
  radius: number,
  segments = 96,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return g;
}

/** Lower-half angle arc from straight-down sweeping to the refracted
 *  direction. Used for the θₜ angle indicator below the interface. */
export function refractedArcGeometry(
  refractRad: number,
  radius: number,
  segments = 32,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = refractRad * t;
    positions.push(Math.sin(a) * radius, -Math.cos(a) * radius, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return g;
}
