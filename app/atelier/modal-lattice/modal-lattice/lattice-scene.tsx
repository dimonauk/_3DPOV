"use client";

/**
 * app/atelier/modal-lattice/modal-lattice/lattice-scene.tsx — R3F
 * scene that renders the deformed mesh + lattice wireframe + control
 * points. Animates the lattice via a per-control-point phase-offset
 * sinusoid; mutates the position buffer in place each useFrame tick.
 *
 * Also exports ResizeBump — a sibling that forces R3F to re-resize
 * the WebGL canvas on parent layout changes.
 *
 * Extracted from modal-lattice-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { deform } from "./lattice";
import { makeRestLattice } from "./lattice";
import { makeShape, shapeToLatticeSpace } from "./shape-factory";
import type { Kernel, LatticeDims, Shape } from "./types";

export type SceneProps = {
  dims: LatticeDims;
  kernel: Kernel;
  shape: Shape;
  amplitude: number;
  animate: boolean;
};

export function LatticeScene({
  dims,
  kernel,
  shape,
  amplitude,
  animate,
}: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Base geometry + lattice-space coordinates (rebuilt when shape changes).
  const baseData = useMemo(() => {
    const geom = makeShape(shape);
    const { rest, uvw } = shapeToLatticeSpace(geom);
    return { geom, rest, uvw };
  }, [shape]);

  // Rest lattice positions (rebuilt when dims change).
  const restLat = useMemo(() => makeRestLattice(dims), [dims]);

  // Deformed lattice positions — animated, mutated in-place.
  const liveLat = useMemo(() => new Float32Array(restLat.length), [restLat]);

  // Output buffer reused across frames.
  const liveVerts = useMemo(
    () => new Float32Array(baseData.rest.length),
    [baseData.rest.length],
  );

  // Lattice wireframe — edges along each axis between adjacent control
  // points. Recomputed when dims change.
  const wireIndices = useMemo(() => {
    const { u, v, w } = dims;
    const idx = (i: number, j: number, k: number) => (k * v + j) * u + i;
    const segs: number[] = [];
    for (let k = 0; k < w; k++) {
      for (let j = 0; j < v; j++) {
        for (let i = 0; i < u - 1; i++) {
          segs.push(idx(i, j, k), idx(i + 1, j, k));
        }
      }
    }
    for (let k = 0; k < w; k++) {
      for (let i = 0; i < u; i++) {
        for (let j = 0; j < v - 1; j++) {
          segs.push(idx(i, j, k), idx(i, j + 1, k));
        }
      }
    }
    for (let j = 0; j < v; j++) {
      for (let i = 0; i < u; i++) {
        for (let k = 0; k < w - 1; k++) {
          segs.push(idx(i, j, k), idx(i, j, k + 1));
        }
      }
    }
    return new Uint16Array(segs);
  }, [dims]);

  // Set initial geometry on the mesh once per shape change.
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.geometry.dispose();
    const cloned = baseData.geom.clone();
    meshRef.current.geometry = cloned;
    return () => {
      cloned.dispose();
    };
  }, [baseData.geom]);

  // Cleanup the source geometry when the component unmounts or shape
  // swaps. (The clone above is owned by the mesh; this is the source.)
  useEffect(() => {
    return () => {
      baseData.geom.dispose();
    };
  }, [baseData.geom]);

  useFrame(({ clock }) => {
    const t = animate ? clock.getElapsedTime() : 0;

    // Animate the lattice: every control point gets a per-position phase
    // offset, displaced by a small sinusoid scaled by `amplitude`. When
    // amplitude is zero this collapses to the rest lattice.
    for (let i = 0; i < restLat.length; i += 3) {
      const rx = restLat[i] as number;
      const ry = restLat[i + 1] as number;
      const rz = restLat[i + 2] as number;
      const phase = rx * 3.1 + ry * 2.7 + rz * 4.3;
      const k = amplitude;
      liveLat[i] = rx + k * Math.sin(t * 0.9 + phase) * 0.4;
      liveLat[i + 1] = ry + k * Math.sin(t * 1.1 + phase * 1.3) * 0.4;
      liveLat[i + 2] = rz + k * Math.sin(t * 0.7 + phase * 0.7) * 0.4;
    }

    // Deform mesh verts.
    deform(baseData.uvw, liveLat, dims, kernel, liveVerts);

    if (meshRef.current) {
      const attr = meshRef.current.geometry.attributes.position;
      if (attr) {
        (attr.array as Float32Array).set(liveVerts);
        attr.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
      }
    }

    // Update wireframe lattice + control-point cloud.
    if (wireRef.current) {
      const attr = wireRef.current.geometry.attributes.position;
      if (attr) {
        (attr.array as Float32Array).set(liveLat);
        attr.needsUpdate = true;
      }
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position;
      if (attr) {
        (attr.array as Float32Array).set(liveLat);
        attr.needsUpdate = true;
      }
    }
  });

  // Geometry buffers for wireframe + points (recreated when dims change).
  const wireGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(restLat.length), 3),
    );
    g.setIndex(new THREE.BufferAttribute(wireIndices, 1));
    return g;
  }, [restLat.length, wireIndices]);

  const pointsGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(restLat.length), 3),
    );
    return g;
  }, [restLat.length]);

  useEffect(() => {
    return () => {
      wireGeom.dispose();
      pointsGeom.dispose();
    };
  }, [wireGeom, pointsGeom]);

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#f0a8c8"
          metalness={0.35}
          roughness={0.28}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          flatShading={false}
        />
      </mesh>

      <lineSegments ref={wireRef} geometry={wireGeom}>
        <lineBasicMaterial
          color="#00ccff"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </lineSegments>

      <points ref={pointsRef} geometry={pointsGeom}>
        <pointsMaterial
          color="#00ccff"
          size={0.025}
          sizeAttenuation
          transparent
          opacity={0.85}
        />
      </points>
    </group>
  );
}

export function ResizeBump() {
  // Force R3F to re-resize on parent layout changes.
  const { gl, size } = useThree();
  useEffect(() => {
    gl.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    gl.setSize(size.width, size.height, false);
  }, [gl, size.width, size.height]);
  return null;
}
