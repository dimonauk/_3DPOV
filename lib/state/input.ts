/**
 * lib/state/input.ts — Zustand slice: head pose, gesture events, gamepad/XR controllers.
 *
 * One-line role: shared state-bus for everything that enters from the user's body.
 * Full purpose in input.PURPOSE.md.
 */

import { create } from "zustand";

export type HeadPose = {
  /** Yaw in radians. Negative = look left. */
  yaw: number;
  /** Pitch in radians. Negative = look up. */
  pitch: number;
  /** Roll in radians. Negative = tilt left. */
  roll: number;
};

export type HeadPoseSource =
  | "webxr"
  | "mediapipe"
  | "mouse"
  | "touch"
  | "neutral";

export type GestureName =
  | "pinch"
  | "grab"
  | "point"
  | "thumbs_up"
  | "open_hand";

export type GestureEvent = {
  at: string;
  hand: "left" | "right";
  name: GestureName;
};

export type ControllerHandle = {
  /** "left" | "right" | "head" | "gamepad-N". */
  id: string;
  position: readonly [number, number, number];
  /** Quaternion. */
  rotation: readonly [number, number, number, number];
};

export type InputState = {
  headPose: HeadPose;
  headPoseSource: HeadPoseSource;
  recentGestures: GestureEvent[];
  controllers: Record<string, ControllerHandle>;
};

export type InputActions = {
  setHeadPose: (pose: HeadPose, source: HeadPoseSource) => void;
  pushGesture: (event: GestureEvent) => void;
  upsertController: (handle: ControllerHandle) => void;
  removeController: (id: string) => void;
};

const initial: InputState = {
  headPose: { yaw: 0, pitch: 0, roll: 0 },
  headPoseSource: "neutral",
  recentGestures: [],
  controllers: {},
};

export const useInputStore = create<InputState & InputActions>()((set) => ({
  ...initial,
  setHeadPose: (pose, source) => set({ headPose: pose, headPoseSource: source }),
  pushGesture: (event) =>
    set((s) => ({
      recentGestures: [...s.recentGestures.slice(-19), event],
    })),
  upsertController: (handle) =>
    set((s) => ({ controllers: { ...s.controllers, [handle.id]: handle } })),
  removeController: (id) =>
    set((s) => {
      const next = { ...s.controllers };
      delete next[id];
      return { controllers: next };
    }),
}));

export const inputStore = useInputStore;
