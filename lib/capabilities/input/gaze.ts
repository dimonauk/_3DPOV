/**
 * lib/capabilities/input/gaze.ts — Capability `input.gaze`: yaw/pitch
 * gaze sample stream over time.
 *
 * Companion to `input.headpose`. Where headpose owns the active
 * viewer's head orientation right now, gaze owns the historical
 * record of where they have *looked* — a buffered stream of yaw/pitch
 * samples timestamped from a session start. Same coordinate
 * convention (yaw left/right, pitch up/down, both in degrees).
 *
 * Atomised from D:/.github/Shadrerapp/src/apps/GazeHeatmap/
 * (Apache-2.0) per docs/SHADRERAPP_MIGRATION.md.
 *
 * # Posture
 *
 * Headless source-of-truth for a GazeSample[] buffer. Three input
 * paths:
 *
 *   1. **Append manually** — `appendSample()` from any external
 *      tracker (WebGazer.js, GazeRecorder API, in-house MediaPipe
 *      eye-landmarker).
 *   2. **Load from JSON** — `loadFromJson()` for replaying a recorded
 *      session (matches the Shadrerapp upload format).
 *   3. **Live from headpose** — `bindToHeadpose()` taps the existing
 *      `input.headpose` slice + samples it on a fixed cadence.
 *
 * Recall: `getSamples(timeRange?)`, `filterByTimeRange(samples, range)`,
 * `computeStatistics(samples)`, `computeDwellZones(samples, threshold)`.
 */

import {
  angularDistanceDegrees,
} from "lib/math/spherical";
import { detectSaccades, type GazeSample } from "lib/math/signal";

export type { GazeSample };

export type StatisticSet = {
  /** Total wall-clock seconds covered by the samples. */
  totalTime: number;
  /** Mean angular velocity (deg/sec). */
  meanVelocity: number;
  /** Fraction of samples within ±30° pitch (the "comfort band"). */
  comfortBandFraction: number;
  /** Yaw span across the session, in degrees. */
  maxYawSwing: number;
  /** Number of detected I-VT saccades. */
  saccadeCount: number;
  /**
   * Scanpath index — total angular distance / straight-line distance.
   * 1.0 = perfectly direct; > 1.0 = wandering.
   */
  scanpathIndex: number;
};

export type DwellZone = {
  /** [yaw_deg, pitch_deg] — running mean of the samples that fell in. */
  centroid: [number, number];
  /** Samples accumulated in this zone. */
  samples: GazeSample[];
};

const SESSION: { samples: GazeSample[]; sessionStart: number } = {
  samples: [],
  sessionStart: 0,
};

/** Reset the session buffer. Call when starting a fresh recording. */
export function resetSession(): void {
  SESSION.samples = [];
  SESSION.sessionStart = performance.now();
}

/** Append a single sample to the session buffer. */
export function appendSample(sample: GazeSample): void {
  SESSION.samples.push(sample);
}

/** Get the current session's samples. */
export function getSamples(): readonly GazeSample[] {
  return SESSION.samples;
}

/** Replace the session with a loaded JSON array (e.g. from a recorder). */
export function loadFromJson(json: unknown): GazeSample[] {
  if (!Array.isArray(json)) {
    throw new Error("input.gaze: loadFromJson expects an array");
  }
  const samples: GazeSample[] = [];
  for (const item of json) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { t?: unknown }).t === "number" &&
      typeof (item as { yaw_deg?: unknown }).yaw_deg === "number" &&
      typeof (item as { pitch_deg?: unknown }).pitch_deg === "number"
    ) {
      const s = item as GazeSample;
      samples.push({ t: s.t, yaw_deg: s.yaw_deg, pitch_deg: s.pitch_deg });
    }
  }
  SESSION.samples = samples;
  return samples;
}

export function filterByTimeRange(
  samples: readonly GazeSample[],
  range: readonly [number, number],
): GazeSample[] {
  return samples.filter((s) => s.t >= range[0] && s.t <= range[1]);
}

export function computeStatistics(
  samples: readonly GazeSample[],
  saccadeThreshold = 250,
): StatisticSet | null {
  if (samples.length < 2) return null;
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  const totalTime = last.t - first.t;

  let totalVel = 0;
  let comfortCount = 0;
  let minYaw = first.yaw_deg;
  let maxYaw = first.yaw_deg;
  let totalDist = 0;

  for (let i = 1; i < samples.length; i++) {
    const s1 = samples[i - 1]!;
    const s2 = samples[i]!;
    const dt = s2.t - s1.t;
    const d = angularDistanceDegrees(
      [s1.yaw_deg, s1.pitch_deg],
      [s2.yaw_deg, s2.pitch_deg],
    );
    if (dt > 0) totalVel += d / dt;
    if (Math.abs(s2.pitch_deg) <= 30) comfortCount++;
    minYaw = Math.min(minYaw, s2.yaw_deg);
    maxYaw = Math.max(maxYaw, s2.yaw_deg);
    totalDist += d;
  }

  const directDist = angularDistanceDegrees(
    [first.yaw_deg, first.pitch_deg],
    [last.yaw_deg, last.pitch_deg],
  );
  const saccades = detectSaccades(samples, saccadeThreshold);

  return {
    totalTime,
    meanVelocity: totalVel / samples.length,
    comfortBandFraction: comfortCount / samples.length,
    maxYawSwing: maxYaw - minYaw,
    saccadeCount: saccades.length,
    scanpathIndex: totalDist / (directDist || 0.1),
  };
}

export function computeDwellZones(
  samples: readonly GazeSample[],
  thresholdDegrees = 15,
  topN = 10,
): DwellZone[] {
  const zones: DwellZone[] = [];
  for (const s of samples) {
    let matched = false;
    for (const zone of zones) {
      const d = angularDistanceDegrees(zone.centroid, [s.yaw_deg, s.pitch_deg]);
      if (d < thresholdDegrees) {
        zone.samples.push(s);
        zone.centroid[0] =
          (zone.centroid[0] * (zone.samples.length - 1) + s.yaw_deg) /
          zone.samples.length;
        zone.centroid[1] =
          (zone.centroid[1] * (zone.samples.length - 1) + s.pitch_deg) /
          zone.samples.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      zones.push({ centroid: [s.yaw_deg, s.pitch_deg], samples: [s] });
    }
  }
  return zones.sort((a, b) => b.samples.length - a.samples.length).slice(0, topN);
}
