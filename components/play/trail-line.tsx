"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * TrailLine — the load-bearing render primitive for the studio's draw
 * page. Takes an array of 3D points and a colour, returns an
 * additive-blended line in chrome-cyan (or whichever colour is
 * passed). Geometry is allocated once at the max vertex count and the
 * buffer's `drawRange` is updated as the trail grows, so the GPU is
 * never asked to re-upload geometry while the body is moving.
 *
 * The R3F intrinsic `<line>` collides with SVG's `<line>` element in
 * TypeScript's JSX namespace, so we construct the `THREE.Line` by hand
 * and mount it with `<primitive />`. The composition is the same; the
 * type situation is just cleaner.
 *
 * Kept deliberately small: any future drawing surface in the site
 * (kata playback, Rookery trail viewer, the eventual phone-gyro pass)
 * is meant to compose this rather than re-implement it.
 */

export type TrailLineProps = {
  /** Ordered points along the trail. */
  points: THREE.Vector3[];
  /** Hex string, defaults to chrome-cyan per the holofoil palette. */
  color?: string;
  /** Hard ceiling on vertices. The scene caller drops the oldest. */
  maxVertices?: number;
  /** Line opacity, additive-blended. */
  opacity?: number;
};

export function TrailLine({
  points,
  color = "#00f3ff",
  maxVertices = 2000,
  opacity = 0.9,
}: TrailLineProps) {
  const { object, positions, material } = useMemo(() => {
    const positions = new Float32Array(maxVertices * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    geometry.setDrawRange(0, 0);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const object = new THREE.Line(geometry, material);
    return { object, positions, material };
  }, [maxVertices, color, opacity]);

  useEffect(() => {
    return () => {
      object.geometry.dispose();
      material.dispose();
    };
  }, [object, material]);

  useEffect(() => {
    const geometry = object.geometry;
    const count = Math.min(points.length, maxVertices);
    for (let i = 0; i < count; i++) {
      const p = points[i]!;
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
    geometry.setDrawRange(0, count);
    geometry.computeBoundingSphere();
  }, [points, positions, object, maxVertices]);

  return <primitive object={object} />;
}
