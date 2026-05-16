"use client";

/**
 * components/stage/StageAvatar.tsx — VRM character with a Stage transform.
 *
 * Thin wrapper around the existing components/three/VRMAvatar.tsx.
 * Position / rotation come from the room's AvatarSpec. Loading +
 * slice subscription stay in VRMAvatar so the rest of the studio
 * (vrm.bones.pose, audio.visemes -> vrm.expressions.blend, motion.idle)
 * keeps working untouched.
 */

import { VRMAvatar } from "components/three/VRMAvatar";

import type { AvatarSpec } from "lib/stage/types";

export function StageAvatar({ spec }: { spec: AvatarSpec | undefined }) {
  if (!spec) return null;
  return (
    <group
      position={spec.position ?? [0, 0, 0]}
      rotation={spec.rotation ?? [0, Math.PI, 0]}
    >
      <VRMAvatar url={spec.url} id={spec.id} />
    </group>
  );
}
