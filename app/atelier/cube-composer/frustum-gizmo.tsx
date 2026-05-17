"use client";

/**
 * app/atelier/cube-composer/frustum-gizmo.tsx — Camera frustum that
 * advances along the inlined trajectory inside the cubemap.
 *
 * Extracted from cube-composer-client.tsx. Re-orients the gizmo whenever
 * the active frame changes; slerps toward the target quaternion each
 * useFrame tick so motion stays smooth; auto-advances at one frame
 * per 200ms while `playing` is true.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  type Group,
  MathUtils,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";

import { CUBE_RADIUS, type FrustumProps, TRAJECTORY_DEG } from "./types";

export function FrustumGizmo({ frame, playing, onAdvance }: FrustumProps) {
  const groupRef = useRef<Group>(null);
  const camRef = useRef<PerspectiveCamera>(
    new PerspectiveCamera(90, 1, 0.1, CUBE_RADIUS),
  );

  // Re-orient the gizmo whenever the active frame changes. Stored as
  // a target quaternion so we can lerp toward it for smoothness.
  const targetQ = useMemo(() => {
    const q = new Quaternion();
    const f = TRAJECTORY_DEG[frame];
    if (!f) return q;
    // Three uses radians; trajectory file uses degrees in roll/pitch/yaw.
    // Apply in YXZ order so yaw is "rotate around world up", pitch is
    // "look up/down", roll is "twist". Matches how the equilib lib
    // (used bench-side) consumes its Euler angles.
    const yaw = MathUtils.degToRad(f.yaw);
    const pitch = MathUtils.degToRad(f.pitch);
    const roll = MathUtils.degToRad(f.roll);
    q.setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch);
    const qRoll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll);
    q.multiply(qPitch).multiply(qRoll);
    return q;
  }, [frame]);

  // Smooth frame advance while playing — one frame per 200ms.
  const accumRef = useRef(0);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.quaternion.slerp(targetQ, 0.2);
    }
    if (!playing) return;
    accumRef.current += delta;
    if (accumRef.current >= 0.2) {
      accumRef.current = 0;
      onAdvance();
    }
  });

  return (
    <group ref={groupRef}>
      {/* Camera body: a small cyan box where the lens sits. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.18, 0.14, 0.22]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Frustum cone — a thin pyramid pointing along -Z (the camera
          forward direction). Built from a cone scaled to read as a
          90deg frustum that touches the front face of the cube. */}
      <mesh position={[0, 0, -CUBE_RADIUS / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[CUBE_RADIUS / 1.05, CUBE_RADIUS, 4, 1, true]} />
        <meshBasicMaterial
          color="#67e8f9"
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>
      {/* Reference primitive so React keeps camRef alive (avoids
          unused-import noise; the camera object is meaningful in the
          inspector even if we don't render it). */}
      <primitive object={camRef.current} visible={false} />
    </group>
  );
}
