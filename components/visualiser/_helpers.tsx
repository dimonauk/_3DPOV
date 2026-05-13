"use client";

/**
 * Shared primitives for the /visualiser/* family.
 *
 * Kept deliberately small: a label primitive that sits inside an R3F canvas
 * via Drei&rsquo;s &lt;Html&gt;, an axis indicator for cube-style scenes, and
 * a draggable point that projects mouse motion onto a plane parallel to the
 * camera. Anything used by 2+ visualisers lives here so the per-scene files
 * stay focused on the physics being visualised.
 *
 * IMPORTANT: this file is the line-segments-not-line rule made permanent.
 * Every line geometry in the visualiser family must use &lt;lineSegments&gt;
 * (or the helper below) to avoid the SVG-JSX vs R3F-JSX namespace collision
 * that bit the TIR build twice before being locked down.
 */

import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Small chrome-cyan or pink-200 label floating at a 3D position. */
export function LabelAt({
  position,
  color = "#00f3ff",
  children,
}: {
  position: [number, number, number];
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "10px",
          color,
          background: "rgba(12, 10, 18, 0.85)",
          padding: "2px 6px",
          borderRadius: "2px",
          whiteSpace: "nowrap",
          letterSpacing: "0.06em",
        }}
      >
        {children}
      </div>
    </Html>
  );
}

/** Uppercase-tracked medium / corner label. Heavier weight than LabelAt. */
export function ChromeLabel({
  position,
  children,
}: {
  position: [number, number, number];
  children: React.ReactNode;
}) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "10px",
          color: "#9ca3af",
          background: "rgba(12, 10, 18, 0.6)",
          padding: "3px 7px",
          borderRadius: "2px",
          whiteSpace: "nowrap",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </div>
    </Html>
  );
}

/** Three small line-segments along +X, +Y, +Z, in red / green / blue. */
export function AxisIndicators({ length = 1 }: { length?: number }) {
  const xGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, length, 0, 0], 3),
    );
    return g;
  }, [length]);
  const yGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 0, length, 0], 3),
    );
    return g;
  }, [length]);
  const zGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, length], 3),
    );
    return g;
  }, [length]);

  return (
    <group>
      <lineSegments geometry={xGeom}>
        <lineBasicMaterial
          color="#f87171"
          transparent
          opacity={0.7}
          depthTest={false}
        />
      </lineSegments>
      <lineSegments geometry={yGeom}>
        <lineBasicMaterial
          color="#86efac"
          transparent
          opacity={0.7}
          depthTest={false}
        />
      </lineSegments>
      <lineSegments geometry={zGeom}>
        <lineBasicMaterial
          color="#93c5fd"
          transparent
          opacity={0.7}
          depthTest={false}
        />
      </lineSegments>
    </group>
  );
}

/**
 * Draggable sphere. Projects pointer motion onto a plane parallel to the
 * camera so the drag feels like &ldquo;push the point around in screen
 * space&rdquo;, then clamps the resulting world position to the supplied
 * bounds. Used inside an R3F &lt;Canvas&gt;.
 *
 * The bounds parameter is a [[minX, maxX], [minY, maxY], [minZ, maxZ]] triple.
 */
export function DragPoint({
  position3D,
  onChange,
  bounds,
  color = "#fbcfe8",
  radius = 0.07,
}: {
  position3D: [number, number, number];
  onChange: (next: [number, number, number]) => void;
  bounds: [[number, number], [number, number], [number, number]];
  color?: string;
  radius?: number;
}) {
  const { camera } = useThree();
  const draggingRef = useRef(false);
  const planeRef = useRef(new THREE.Plane());
  const offsetRef = useRef(new THREE.Vector3());
  const intersectionRef = useRef(new THREE.Vector3());
  const [hovered, setHovered] = useState(false);

  const clamp = useCallback(
    (v: [number, number, number]): [number, number, number] => {
      const bx = bounds[0];
      const by = bounds[1];
      const bz = bounds[2];
      const x = Math.min(Math.max(v[0], bx[0]), bx[1]);
      const y = Math.min(Math.max(v[1], by[0]), by[1]);
      const z = Math.min(Math.max(v[2], bz[0]), bz[1]);
      return [x, y, z];
    },
    [bounds],
  );

  return (
    <mesh
      position={position3D}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        draggingRef.current = true;

        // Build a plane through the current point, facing the camera.
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        const point = new THREE.Vector3(...position3D);
        planeRef.current.setFromNormalAndCoplanarPoint(camDir, point);

        // Record offset so the point doesn&rsquo;t snap to the cursor.
        e.ray.intersectPlane(planeRef.current, intersectionRef.current);
        offsetRef.current.copy(point).sub(intersectionRef.current);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        e.stopPropagation();
        const hit = e.ray.intersectPlane(
          planeRef.current,
          intersectionRef.current,
        );
        if (!hit) return;
        const next = hit.clone().add(offsetRef.current);
        onChange(clamp([next.x, next.y, next.z]));
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[radius, 24, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={hovered ? 1 : 0.85}
      />
    </mesh>
  );
}
