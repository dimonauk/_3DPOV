/**
 * lib/state/vrm.ts — Zustand slice: loaded VRM handles, pose targets, expression weights.
 *
 * One-line role: shared state-bus for everything VRM-related.
 * Full purpose in vrm.PURPOSE.md.
 */

import { create } from "zustand";

export type VRMHandleId = string;
export type Euler = readonly [number, number, number];
export type Vec3 = readonly [number, number, number];

/** Opaque VRM reference. The vrm.load capability owns the concrete shape. */
export type VRMHandle = {
  id: VRMHandleId;
  /** @pixiv/three-vrm VRM instance — kept `unknown` so the slice has no three.js dependency. */
  vrm: unknown;
};

export type PoseVector = Record<string, Euler>;
export type ExpressionWeights = Record<string, number>;

export type VRMState = {
  handles: Record<VRMHandleId, VRMHandle>;
  poses: Record<VRMHandleId, PoseVector>;
  /** Additive offsets on top of `poses` — breath, micro-shift, etc. Owned by motion.idle. */
  idleOffsets: Record<VRMHandleId, PoseVector>;
  expressions: Record<VRMHandleId, ExpressionWeights>;
  lookTargets: Record<VRMHandleId, Vec3 | null>;
};

export type VRMActions = {
  addHandle: (handle: VRMHandle) => void;
  removeHandle: (id: VRMHandleId) => void;
  setPose: (id: VRMHandleId, pose: PoseVector) => void;
  setIdleOffset: (id: VRMHandleId, offset: PoseVector) => void;
  clearIdleOffset: (id: VRMHandleId) => void;
  setExpressions: (id: VRMHandleId, weights: ExpressionWeights) => void;
  setLookTarget: (id: VRMHandleId, target: Vec3 | null) => void;
};

const initial: VRMState = {
  handles: {},
  poses: {},
  idleOffsets: {},
  expressions: {},
  lookTargets: {},
};

export const useVRMStore = create<VRMState & VRMActions>()((set) => ({
  ...initial,
  addHandle: (handle) =>
    set((s) => ({ handles: { ...s.handles, [handle.id]: handle } })),
  removeHandle: (id) =>
    set((s) => {
      const next = { ...s.handles };
      delete next[id];
      return { handles: next };
    }),
  setPose: (id, pose) =>
    set((s) => ({ poses: { ...s.poses, [id]: pose } })),
  setIdleOffset: (id, offset) =>
    set((s) => ({ idleOffsets: { ...s.idleOffsets, [id]: offset } })),
  clearIdleOffset: (id) =>
    set((s) => {
      const next = { ...s.idleOffsets };
      delete next[id];
      return { idleOffsets: next };
    }),
  setExpressions: (id, weights) =>
    set((s) => ({ expressions: { ...s.expressions, [id]: weights } })),
  setLookTarget: (id, target) =>
    set((s) => ({ lookTargets: { ...s.lookTargets, [id]: target } })),
}));

/** Headless getter for capabilities that don't run inside React. */
export const vrmStore = useVRMStore;
