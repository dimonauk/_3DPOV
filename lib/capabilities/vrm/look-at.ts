/**
 * lib/capabilities/vrm/look-at.ts — Capability `vrm.lookAt`: head/eye look-target setters writing into the vrm slice.
 *
 * One-line role: write a world-space Vec3 target (or null) for a VRM handle that VRMAvatar's lookAt module reads each frame.
 * Full purpose in look-at.PURPOSE.md.
 */

import { Vector3 } from "three";
import type { VRM } from "@pixiv/three-vrm";
import { vrmStore, type Vec3, type VRMHandleId } from "lib/state/vrm";

/** Write a world-space look-target (or null to clear) for a handle. */
export function setLookTarget(id: VRMHandleId, target: Vec3 | null): void {
  vrmStore.getState().setLookTarget(id, target);
}

/** Sugar: clear the look target for a handle. */
export function clearLookTarget(id: VRMHandleId): void {
  setLookTarget(id, null);
}

/** Sugar: write a target from three separate coordinates. */
export function lookAtPoint(
  id: VRMHandleId,
  x: number,
  y: number,
  z: number,
): void {
  setLookTarget(id, [x, y, z] as Vec3);
}

/**
 * Composition: make `sourceId` look at the head of `targetId`.
 *
 * Reads the target VRM's head world-position from the slice's handle
 * and writes it as the source's `lookTarget`. No-op if the target
 * handle isn't loaded, has no VRM instance, or has no humanoid head
 * bone — all failure modes degrade silently so the call is safe to
 * invoke before either handle has mounted.
 */
export function lookAtHandle(
  sourceId: VRMHandleId,
  targetId: VRMHandleId,
): void {
  try {
    const handle = vrmStore.getState().handles[targetId];
    const vrm = handle?.vrm as VRM | undefined;
    if (!vrm) return;
    const headNode = vrm.humanoid?.getNormalizedBoneNode("head");
    if (!headNode) return;
    const worldPos = headNode.getWorldPosition(new Vector3());
    setLookTarget(sourceId, [worldPos.x, worldPos.y, worldPos.z] as Vec3);
  } catch {
    // Handle access failed (mid-mount, disposed, etc) — degrade silently.
  }
}

/** Read the active look-target for a handle. */
export function getLookTarget(id: VRMHandleId): Vec3 | null | undefined {
  return vrmStore.getState().lookTargets[id];
}
