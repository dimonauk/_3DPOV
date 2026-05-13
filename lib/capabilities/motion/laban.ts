/**
 * lib/capabilities/motion/laban.ts — Capability `motion.laban`: kinematic effort extraction + named-move blending.
 *
 * One-line role: turn pose samples into Laban Effort coordinates,
 * blend named moves by their Laban signatures, and resolve a move id
 * to a PoseVector when one is on file. Full purpose in laban.PURPOSE.md.
 *
 * Provenance: Hangar `choreography_engine.js` (poi-sculptor) names the
 * eight Basic Efforts; `lib/visualiser/laban-math.ts` implements the
 * cube in [-1..+1]; `lib/cast/move-library.ts` names coordinates in
 * [0..1]. This file is the bridge.
 */

import {
  getMove,
  moveLibrary,
  type LabanCoords,
  type MoveLibraryEntry,
} from "lib/cast/move-library";
import { effortName, type BasicEffortName } from "lib/visualiser/laban-math";
import { GESTURES } from "lib/capabilities/motion/gesture";
import { POSES } from "lib/capabilities/vrm/pose";
import type { Euler, PoseVector } from "lib/state/vrm";

/**
 * Public Laban Effort vector in [0..1]:
 *   space 0=indirect/1=direct · time 0=sustained/1=sudden ·
 *   weight 0=light/1=strong · flow 0=free/1=bound.
 */
export type EffortVector = LabanCoords;

/** The eight named Basic Efforts (re-exported for caller convenience). */
export type BasicEffort = BasicEffortName;

export type AnalysisResult = {
  /** Dominant Laban Effort vector in [0..1]. */
  effort: EffortVector;
  /** The closest named Basic Effort, or null when the point is interior to the cube. */
  basic: BasicEffort | null;
  /** How many samples were considered. */
  sampleCount: number;
  /** Mean inter-sample interval in milliseconds (0 for trivial inputs). */
  meanIntervalMs: number;
};

export type PoseSample = {
  /** Timestamp in milliseconds (any consistent origin). */
  t: number;
  pose: PoseVector;
};

/** Context for moveToPose; reserved for future per-character pose libraries. */
export type MoveToPoseContext = Readonly<{
  /** Optional override for the body-pose lookup (default: POSES). */
  bodyPoses?: Readonly<Record<string, PoseVector>>;
  /** Optional override for the hand-gesture lookup (default: GESTURES). */
  handPoses?: Readonly<Record<string, PoseVector>>;
}>;

// ---------- coordinate-system bridge ----------

/** Convert [0..1] effort to the canonical [-1..+1] Laban math space. */
function effortToSigned(e: EffortVector): {
  space: number;
  time: number;
  weight: number;
  flow: number;
} {
  return {
    space: e.space * 2 - 1,
    time: e.time * 2 - 1,
    weight: e.weight * 2 - 1,
    flow: e.flow * 2 - 1,
  };
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0.5;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function clampEffort(e: EffortVector): EffortVector {
  return {
    space: clamp01(e.space),
    time: clamp01(e.time),
    weight: clamp01(e.weight),
    flow: clamp01(e.flow),
  };
}

// ---------- analyseEffort ----------

function eulerMagnitude(e: Euler | undefined): number {
  if (!e) return 0;
  const [x, y, z] = e;
  return Math.sqrt(x * x + y * y + z * z);
}

function poseDelta(a: PoseVector, b: PoseVector): number {
  const seen = new Set<string>();
  for (const k of Object.keys(a)) seen.add(k);
  for (const k of Object.keys(b)) seen.add(k);
  let total = 0;
  for (const k of seen) {
    const va = a[k];
    const vb = b[k];
    const dx = (vb?.[0] ?? 0) - (va?.[0] ?? 0);
    const dy = (vb?.[1] ?? 0) - (va?.[1] ?? 0);
    const dz = (vb?.[2] ?? 0) - (va?.[2] ?? 0);
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return total;
}

/**
 * Pure-function effort extractor. Kinematic heuristic:
 *   time   ≈ mean angular speed (faster = more sudden)
 *   weight ≈ mean hip+spine+chest magnitude (heavier torso = strong)
 *   flow   ≈ 1 - normalised stddev of per-frame speed (steady = bound)
 *   space  ≈ endpoint distance / total path for the lead hand
 * Refinements (jerk / curvature integrals) plug in here without
 * changing the surface.
 */
export function analyseEffort(samples: ReadonlyArray<PoseSample>): AnalysisResult {
  const n = samples.length;
  if (n < 2) {
    return {
      effort: { space: 0.5, time: 0.5, weight: 0.5, flow: 0.5 },
      basic: null,
      sampleCount: n,
      meanIntervalMs: 0,
    };
  }

  let totalDt = 0;
  let totalDelta = 0;
  let totalTorso = 0;
  const speeds: number[] = [];
  let totalHeadArmPath = 0;
  let firstHand: Euler | undefined;
  let lastHand: Euler | undefined;

  for (let i = 1; i < n; i++) {
    const a = samples[i - 1]!;
    const b = samples[i]!;
    const dt = Math.max(b.t - a.t, 1);
    totalDt += dt;
    const delta = poseDelta(a.pose, b.pose);
    totalDelta += delta;
    speeds.push(delta / dt);

    totalTorso +=
      eulerMagnitude(b.pose.hips) +
      eulerMagnitude(b.pose.spine) +
      eulerMagnitude(b.pose.chest);

    const headA = a.pose.head;
    const headB = b.pose.head;
    if (headA && headB) {
      const dx = headB[0] - headA[0];
      const dy = headB[1] - headA[1];
      const dz = headB[2] - headA[2];
      totalHeadArmPath += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const handBone =
      b.pose.rightHand ?? b.pose.rightLowerArm ?? b.pose.rightUpperArm;
    if (handBone) {
      if (!firstHand) firstHand = handBone;
      lastHand = handBone;
    }
  }

  const meanSpeed = totalDelta / Math.max(totalDt, 1);
  // time: map mean angular speed (rad/ms) into [0..1] with a 0.005 reference.
  const time = clamp01(meanSpeed / 0.005);

  // weight: mean torso involvement against a 0.4 rad reference.
  const weight = clamp01(totalTorso / (n - 1) / 0.4);

  // flow: 1 - normalised stddev of per-frame speed. Steady = bound (1).
  let mean = 0;
  for (const s of speeds) mean += s;
  mean /= speeds.length;
  let variance = 0;
  for (const s of speeds) variance += (s - mean) * (s - mean);
  variance /= speeds.length;
  const stddev = Math.sqrt(variance);
  const flow = clamp01(1 - stddev / Math.max(mean, 1e-6));

  // space: directness of head movement (endpoint distance / total path).
  let space = 0.5;
  if (firstHand && lastHand && totalHeadArmPath > 0) {
    const endpoint = Math.sqrt(
      Math.pow(lastHand[0] - firstHand[0], 2) +
        Math.pow(lastHand[1] - firstHand[1], 2) +
        Math.pow(lastHand[2] - firstHand[2], 2),
    );
    space = clamp01(endpoint / Math.max(totalHeadArmPath, 1e-6));
  }

  const effort: EffortVector = { space, time, weight, flow };
  const signed = effortToSigned(effort);
  // The visualiser's effortName works on (space, time, weight) corners
  // and ignores flow — we feed it the signed triplet via the LabanEffort
  // shape it already accepts.
  const basic = effortName({
    space: signed.space,
    time: signed.time,
    weight: signed.weight,
    flow: signed.flow,
  });

  return {
    effort,
    basic,
    sampleCount: n,
    meanIntervalMs: totalDt / Math.max(n - 1, 1),
  };
}

// ---------- interpolateMoves ----------

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Blend two named moves by Laban coordinates at parameter t. Returns
 * null if either id is unknown. Result is clamped so extrapolation
 * (t outside [0..1]) cannot escape the cube.
 */
export function interpolateMoves(
  fromId: string,
  toId: string,
  t: number,
): EffortVector | null {
  const from = getMove(fromId);
  const to = getMove(toId);
  if (!from || !to) return null;
  return clampEffort({
    space: lerp(from.laban.space, to.laban.space, t),
    time: lerp(from.laban.time, to.laban.time, t),
    weight: lerp(from.laban.weight, to.laban.weight, t),
    flow: lerp(from.laban.flow, to.laban.flow, t),
  });
}

// ---------- moveToPose ----------

/**
 * Resolve a move id to a `PoseVector` when one is on file. Hand kind
 * looks up GESTURES; body kind looks up POSES; poi + transition kinds
 * return null (those are trajectories / phrases, not static poses).
 * `ctx` accepts alternate pose libraries for other characters.
 */
export function moveToPose(
  moveId: string,
  ctx: MoveToPoseContext = {},
): PoseVector | null {
  const move: MoveLibraryEntry | undefined = getMove(moveId);
  if (!move) return null;

  const bodyPoses = ctx.bodyPoses ?? (POSES as unknown as Record<string, PoseVector>);
  const handPoses = ctx.handPoses ?? (GESTURES as unknown as Record<string, PoseVector>);

  if (move.kind === "hand") {
    return handPoses[moveId] ?? null;
  }
  if (move.kind === "body") {
    // Body-kind entries point at POSES keys; "held-presence" → POSES.auraDefault.
    if (moveId === "held-presence") return bodyPoses.auraDefault ?? null;
    return bodyPoses[moveId] ?? null;
  }
  return null;
}

// ---------- catalogue helpers ----------

/** Return every move whose nearest Basic Effort matches the given name. */
export function movesByBasicEffort(name: BasicEffort): MoveLibraryEntry[] {
  return moveLibrary.filter((m) => {
    const signed = effortToSigned(m.laban);
    const nearest = effortName({
      space: signed.space,
      time: signed.time,
      weight: signed.weight,
      flow: signed.flow,
    });
    return nearest === name;
  });
}
