/**
 * lib/capabilities/motion/idle.ts — Capability `motion.idle`: breath + blink + micro-shift modulation over a baseline pose.
 *
 * One-line role: keep Aura's held stance *alive* — slow breath cycle, periodic blink, micro hip-shift.
 * Full purpose in idle.PURPOSE.md.
 *
 * The capability writes only to `vrm.idleOffsets` (pose) and `vrm.expressions` (blink).
 * It never overwrites the baseline `vrm.poses` — that stays owned by `vrm.bones.pose`.
 */

import { vrmStore, type Euler, type PoseVector, type VRMHandleId } from "lib/state/vrm";
import { auraStore } from "lib/state/aura";

type LoopHandle = {
  raf: number;
  startedAt: number;
  nextBlinkAt: number;
};

const loops = new Map<VRMHandleId, LoopHandle>();

const TAU = Math.PI * 2;

/**
 * Per-mood modulation gain. Multiplied into breath + micro-shift amplitudes.
 * - "neutral" / "focused" — minimal modulation, statuesque.
 * - "playful" / "delighted" — bigger amplitude, more obvious motion.
 * - "agitated" — fastest cycle, largest micro-shifts.
 * - "tender" — slow, smaller — soft.
 */
function moodGain(mood: string): { amp: number; rate: number } {
  switch (mood) {
    case "focused":
      return { amp: 0.6, rate: 0.8 };
    case "playful":
      return { amp: 1.3, rate: 1.1 };
    case "delighted":
      return { amp: 1.25, rate: 1.0 };
    case "alert":
      return { amp: 1.15, rate: 1.15 };
    case "agitated":
      return { amp: 1.5, rate: 1.4 };
    case "tender":
      return { amp: 0.75, rate: 0.7 };
    default:
      return { amp: 1.0, rate: 1.0 };
  }
}

function computeBreathOffset(t: number, amp: number, rate: number): PoseVector {
  // 4-second breath cycle at neutral; scaled by mood rate.
  const cycle = (t * rate) / 4000;
  const phase = Math.sin(cycle * TAU);
  const chestPitch = phase * 0.015 * amp;
  const spinePitch = phase * 0.010 * amp;
  const neckPitch = phase * 0.005 * amp;
  return {
    chest: [chestPitch, 0, 0] as Euler,
    spine: [spinePitch, 0, 0] as Euler,
    neck: [neckPitch, 0, 0] as Euler,
  };
}

function computeMicroShift(t: number, amp: number): PoseVector {
  // Slow random-walk-ish sinusoid layered on the hips.
  const slow = Math.sin((t / 9000) * TAU);
  const slower = Math.sin((t / 13000) * TAU + 1.2);
  return {
    hips: [0, slower * 0.008 * amp, slow * 0.006 * amp] as Euler,
  };
}

function scheduleNextBlink(now: number): number {
  // Random blink every 3–8 seconds.
  return now + 3000 + Math.random() * 5000;
}

function setBlink(id: VRMHandleId, weight: number): void {
  const state = vrmStore.getState();
  const current = state.expressions[id] ?? {};
  state.setExpressions(id, {
    ...current,
    blink: weight,
  });
}

/**
 * Start the idle modulation loop for a VRM handle. Idempotent — calling
 * twice on the same id is a no-op (the existing loop continues).
 */
export function startIdle(id: VRMHandleId): void {
  if (loops.has(id)) return;
  const startedAt = performance.now();
  const handle: LoopHandle = {
    raf: 0,
    startedAt,
    nextBlinkAt: scheduleNextBlink(startedAt),
  };

  const tick = () => {
    const now = performance.now();
    const t = now - handle.startedAt;
    const mood = auraStore.getState().mood;
    const { amp, rate } = moodGain(mood);

    const offset: PoseVector = {
      ...computeBreathOffset(t, amp, rate),
      ...computeMicroShift(t, amp),
    };
    vrmStore.getState().setIdleOffset(id, offset);

    if (now >= handle.nextBlinkAt) {
      setBlink(id, 1.0);
      window.setTimeout(() => setBlink(id, 0.0), 120);
      handle.nextBlinkAt = scheduleNextBlink(now);
    }

    handle.raf = window.requestAnimationFrame(tick);
  };

  handle.raf = window.requestAnimationFrame(tick);
  loops.set(id, handle);
}

/** Stop the idle loop for a handle. Clears the offset back to zero. */
export function stopIdle(id: VRMHandleId): void {
  const handle = loops.get(id);
  if (!handle) return;
  window.cancelAnimationFrame(handle.raf);
  loops.delete(id);
  vrmStore.getState().clearIdleOffset(id);
}

/** Whether idle is currently running for a handle. */
export function isIdleRunning(id: VRMHandleId): boolean {
  return loops.has(id);
}
