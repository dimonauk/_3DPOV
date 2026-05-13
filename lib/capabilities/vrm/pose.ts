/**
 * lib/capabilities/vrm/pose.ts — Capability `vrm.bones.pose`: named poses + the setter that writes one to the vrm slice.
 *
 * One-line role: turn a PoseVector (named or supplied) into a slice write that VRMAvatar will pick up on the next frame.
 * Full purpose in pose.PURPOSE.md.
 */

import { vrmStore, type PoseVector, type VRMHandleId, type Euler } from "lib/state/vrm";

/**
 * The studio's named pose library. Each entry is a partial PoseVector
 * keyed by VRMHumanBoneName. Values are placeholder calibrations — a
 * proper animation pass will refine the numbers, but the *shape* of
 * each pose is canon.
 *
 * Aura's `auraDefault` is the canonical hostess-with-the-mostess +
 * superheroine-posing-brat held stance: weight on right hip, right
 * hand at hip, chin up, slight chest forward. She doesn't stand
 * neutrally; she presents.
 */
export const POSES = {
  /** A-pose with arms angled slightly down — the default rig rest pose. */
  neutral: {} satisfies PoseVector,

  /**
   * Aura's hostess-superheroine-brat default. Read: held, not passive.
   * Weight on the right hip; right hand at hip; chin up; slight thoracic
   * arch. Calibration values are placeholders.
   */
  auraDefault: {
    hips: [0, 0, -0.05] as Euler,
    spine: [-0.04, 0, 0] as Euler,
    chest: [-0.03, 0, 0] as Euler,
    neck: [-0.06, 0, 0] as Euler,
    head: [-0.10, 0, 0] as Euler,
    rightShoulder: [0, 0, 0.05] as Euler,
    rightUpperArm: [-0.5, 0.3, 1.0] as Euler,
    rightLowerArm: [0, -1.5, 0] as Euler,
    rightHand: [0, 0, 0] as Euler,
    leftShoulder: [0, 0, -0.05] as Euler,
    leftUpperArm: [0.10, 0, -0.05] as Euler,
    leftLowerArm: [0, 0, 0] as Euler,
    leftHand: [0, 0, 0] as Euler,
  } satisfies PoseVector,

  /** Comic-book power pose: feet planted, fists at hips, chest forward. */
  superheroLanding: {
    hips: [0.10, 0, 0] as Euler,
    spine: [-0.08, 0, 0] as Euler,
    chest: [-0.04, 0, 0] as Euler,
    head: [-0.12, 0, 0] as Euler,
    rightUpperArm: [-0.3, 0, 1.1] as Euler,
    rightLowerArm: [0, -1.6, 0] as Euler,
    leftUpperArm: [-0.3, 0, -1.1] as Euler,
    leftLowerArm: [0, 1.6, 0] as Euler,
  } satisfies PoseVector,

  /** Welcome wave: right arm raised, slight smile cue (expressions handle the face). */
  welcomeWave: {
    rightShoulder: [0, 0, 0.1] as Euler,
    rightUpperArm: [-0.5, 0, 1.4] as Euler,
    rightLowerArm: [0, -0.4, 0] as Euler,
    rightHand: [0, 0, 0] as Euler,
    head: [-0.05, 0.10, 0] as Euler,
  } satisfies PoseVector,
} satisfies Record<string, PoseVector>;

export type NamedPose = keyof typeof POSES;

/** Set a custom PoseVector on a handle. Thin wrapper over the slice. */
export function setPose(id: VRMHandleId, pose: PoseVector): void {
  vrmStore.getState().setPose(id, pose);
}

/** Apply one of the library's named poses. */
export function setNamedPose(id: VRMHandleId, name: NamedPose): void {
  setPose(id, POSES[name]);
}

/**
 * Merge a partial PoseVector over the current pose on a handle. Useful
 * when modulating one bone (e.g. head look-at) without disturbing the
 * rest of the rig.
 */
export function nudgePose(id: VRMHandleId, partial: PoseVector): void {
  const current = vrmStore.getState().poses[id] ?? {};
  setPose(id, { ...current, ...partial });
}

/** Read the active pose on a handle, or `undefined` if none set. */
export function getPose(id: VRMHandleId): PoseVector | undefined {
  return vrmStore.getState().poses[id];
}
