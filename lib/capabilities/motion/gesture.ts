/**
 * lib/capabilities/motion/gesture.ts — Capability `motion.gesture`: trigger transient named gestures (wave, nod, shrug, point) over the baseline pose.
 *
 * One-line role: make Aura *do something* — interpolate baseline → peak → baseline so a gesture lands and dissolves without disturbing the idle layer.
 * Full purpose in gesture.PURPOSE.md.
 *
 * Option A: writes `vrm.poses[id]` transiently. Captures the baseline on
 * trigger, interpolates through the peak, restores baseline on completion.
 * The motion.idle layer keeps writing `vrm.idleOffsets` independently;
 * VRMAvatar sums baseline + idleOffset on every frame, so the two layers
 * stay additive and never fight.
 */

import { vrmStore, type Euler, type PoseVector, type VRMHandleId } from "lib/state/vrm";

/**
 * Peak poses for each gesture. The capability eases baseline → peak →
 * baseline; these values are the *fully-expressed* moment. Calibration
 * is approximate — production polish is a later pass.
 *
 * Bone reading:
 * - wave   — right arm raised high, palm forward, head tilt. DARLINGS! energy.
 * - nod    — small + held. Hostess acknowledging, not agreeing.
 * - shrug  — both shoulders raised, arms out, palms-up implied.
 * - point  — right index extended, arm out. The brat directing.
 */
export const GESTURES = {
  wave: {
    rightShoulder: [0, 0, 0.15] as Euler,
    rightUpperArm: [-0.4, 0.2, 1.7] as Euler,
    rightLowerArm: [0, -0.25, 0.3] as Euler,
    rightHand: [0, 0, -0.2] as Euler,
    head: [-0.08, 0.18, 0.05] as Euler,
    neck: [-0.04, 0.10, 0] as Euler,
  } satisfies PoseVector,

  nod: {
    head: [0.18, 0, 0] as Euler,
    neck: [0.08, 0, 0] as Euler,
  } satisfies PoseVector,

  shrug: {
    leftShoulder: [0, 0, -0.35] as Euler,
    rightShoulder: [0, 0, 0.35] as Euler,
    leftUpperArm: [0, 0, -0.25] as Euler,
    rightUpperArm: [0, 0, 0.25] as Euler,
    leftLowerArm: [0, 0.6, -0.4] as Euler,
    rightLowerArm: [0, -0.6, 0.4] as Euler,
    head: [-0.04, 0, 0] as Euler,
  } satisfies PoseVector,

  point: {
    rightShoulder: [0, 0, 0.08] as Euler,
    rightUpperArm: [-0.2, 0, 1.25] as Euler,
    rightLowerArm: [0, -0.3, 0] as Euler,
    rightHand: [0, 0, 0] as Euler,
    head: [-0.05, 0.14, 0] as Euler,
  } satisfies PoseVector,
} satisfies Record<string, PoseVector>;

export type GestureName = keyof typeof GESTURES;

export type TriggerGestureOptions = {
  /** Ease-in duration baseline → peak (ms). Default 250. */
  attackMs?: number;
  /** Hold at peak (ms). Default 600. */
  holdMs?: number;
  /** Ease-out duration peak → baseline (ms). Default 350. */
  releaseMs?: number;
};

type InFlight = {
  raf: number;
  resolve: () => void;
  cancelled: boolean;
  baseline: PoseVector;
};

const active = new Map<VRMHandleId, InFlight>();

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpEuler(a: Euler | undefined, b: Euler | undefined, t: number): Euler {
  const ax = a?.[0] ?? 0;
  const ay = a?.[1] ?? 0;
  const az = a?.[2] ?? 0;
  const bx = b?.[0] ?? 0;
  const by = b?.[1] ?? 0;
  const bz = b?.[2] ?? 0;
  return [lerp(ax, bx, t), lerp(ay, by, t), lerp(az, bz, t)] as Euler;
}

/**
 * Build the per-frame pose by interpolating each bone present in either
 * the baseline or the peak. Bones absent from both are simply not written.
 */
function blendPoses(baseline: PoseVector, peak: PoseVector, t: number): PoseVector {
  const out: PoseVector = {};
  const seen = new Set<string>();
  for (const key of Object.keys(baseline)) seen.add(key);
  for (const key of Object.keys(peak)) seen.add(key);
  for (const key of seen) {
    out[key] = lerpEuler(baseline[key], peak[key], t);
  }
  return out;
}

function cancelInFlight(id: VRMHandleId): InFlight | undefined {
  const existing = active.get(id);
  if (!existing) return undefined;
  existing.cancelled = true;
  window.cancelAnimationFrame(existing.raf);
  active.delete(id);
  return existing;
}

/**
 * Trigger a named gesture. Captures the current pose as baseline, eases
 * to the peak, holds, eases back. Idempotent per handle — a second call
 * cancels the in-flight gesture (without restoring its baseline) and
 * starts the new one from wherever the rig is right now.
 *
 * Returns a Promise that resolves when the gesture completes, or
 * resolves early if cancelled by a subsequent trigger / cancelGesture.
 */
export function triggerGesture(
  id: VRMHandleId,
  name: GestureName,
  options?: TriggerGestureOptions,
): Promise<void> {
  const attackMs = options?.attackMs ?? 250;
  const holdMs = options?.holdMs ?? 600;
  const releaseMs = options?.releaseMs ?? 350;
  const peak = GESTURES[name];

  // Cancelling in-flight: keep its baseline so the next gesture's
  // restoration point stays correct. If nothing was in flight, capture
  // the current pose now.
  const previous = cancelInFlight(id);
  const baseline: PoseVector =
    previous?.baseline ?? { ...(vrmStore.getState().poses[id] ?? {}) };

  return new Promise<void>((resolve) => {
    const startedAt = performance.now();
    const total = attackMs + holdMs + releaseMs;

    const handle: InFlight = {
      raf: 0,
      resolve,
      cancelled: false,
      baseline,
    };

    const tick = () => {
      if (handle.cancelled) return;
      const now = performance.now();
      const elapsed = now - startedAt;

      let blend: number;
      if (elapsed <= attackMs) {
        blend = easeInOutCubic(elapsed / Math.max(attackMs, 1));
      } else if (elapsed <= attackMs + holdMs) {
        blend = 1;
      } else if (elapsed <= total) {
        const releaseT = (elapsed - attackMs - holdMs) / Math.max(releaseMs, 1);
        blend = 1 - easeInOutCubic(Math.min(releaseT, 1));
      } else {
        blend = 0;
      }

      vrmStore.getState().setPose(id, blendPoses(baseline, peak, blend));

      if (elapsed >= total) {
        vrmStore.getState().setPose(id, baseline);
        active.delete(id);
        resolve();
        return;
      }
      handle.raf = window.requestAnimationFrame(tick);
    };

    handle.raf = window.requestAnimationFrame(tick);
    active.set(id, handle);
  });
}

/**
 * Cancel any in-flight gesture and restore the captured baseline
 * immediately. No-op if nothing is in flight.
 */
export function cancelGesture(id: VRMHandleId): void {
  const previous = cancelInFlight(id);
  if (!previous) return;
  vrmStore.getState().setPose(id, previous.baseline);
  previous.resolve();
}

/** Enumerate the available gesture names. */
export function listGestures(): GestureName[] {
  return Object.keys(GESTURES) as GestureName[];
}
