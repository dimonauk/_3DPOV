"use client";

/**
 * components/stage/StageGround.tsx — Floor + contact shadows.
 *
 * "contact" — only contact shadows; the HDRI provides the visible floor.
 * "plane"   — colored floor plane + contact shadows. Default for studio.
 * "none"    — neither. Avatar floats. Use only for Void-style scenes.
 *
 * ContactShadows is Drei's GPU-rendered fake shadow plane. Cheap,
 * always sells the "the avatar is standing on something" gestalt
 * even without true shadow-mapped lighting. Worth its weight every
 * time.
 */

import { ContactShadows } from "@react-three/drei";

import type { GroundSpec } from "lib/stage/types";

export function StageGround({ spec }: { spec: GroundSpec }) {
  if (spec.kind === "none") return null;

  const y = spec.y ?? 0;

  return (
    <>
      {spec.kind === "plane" && (
        <mesh
          position={[0, y - 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            color={spec.color ?? "#1a1a1f"}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      )}
      <ContactShadows
        position={[0, y, 0]}
        opacity={0.55}
        scale={10}
        blur={1.6}
        far={3.2}
        resolution={512}
      />
    </>
  );
}
