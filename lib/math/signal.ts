/**
 * lib/math/signal.ts — Generic signal-processing helpers used across
 * gaze analysis, audio envelopes, and motion smoothing.
 *
 * Lifted from D:/.github/Shadrerapp/src/libs/math-utils.ts
 * `SignalMath` (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md.
 * Atomised into named function exports.
 */

import { angularDistanceDegrees } from "./spherical";

/**
 * Moving-average smoother. Output length matches input. The window is
 * trailing-only at the head (no zero-padding needed — fewer samples
 * just yield a smaller window average).
 */
export function movingAverage(data: readonly number[], windowSize: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
      sum += data[j]!;
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

export type GazeSample = {
  /** Time in seconds since capture start. */
  t: number;
  yaw_deg: number;
  pitch_deg: number;
};

export type SaccadeEvent = {
  start: number;
  end: number;
  /** Peak angular velocity during the saccade, in deg/s. */
  velocity: number;
};

/**
 * Velocity-Threshold Fixation Detection (I-VT). Returns the subset of
 * consecutive sample pairs whose angular velocity exceeds the
 * threshold — a standard low-fidelity saccade detector. Threshold
 * defaults to 300 deg/s, the canonical I-VT cut for adults.
 */
export function detectSaccades(
  samples: readonly GazeSample[],
  velocityThreshold = 300,
): SaccadeEvent[] {
  const saccades: SaccadeEvent[] = [];
  for (let i = 1; i < samples.length; i++) {
    const s1 = samples[i - 1]!;
    const s2 = samples[i]!;
    const dt = s2.t - s1.t;
    if (dt <= 0) continue;

    const v =
      angularDistanceDegrees(
        [s1.yaw_deg, s1.pitch_deg],
        [s2.yaw_deg, s2.pitch_deg],
      ) / dt;
    if (v > velocityThreshold) {
      saccades.push({ start: s1.t, end: s2.t, velocity: v });
    }
  }
  return saccades;
}
