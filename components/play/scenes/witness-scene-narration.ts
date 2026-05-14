/**
 * components/play/scenes/witness-scene-narration.ts — Cold-eye narration core.
 *
 * Pure deterministic logic for the Witness level: geometric heuristics over a
 * captured drawing trail (arc length, curvature spikes, speed envelope,
 * self-intersection, dominant compass direction), plus the candidate-picker
 * that maps those heuristics to Aura-register observations colour-coded by
 * chrono mode. No React, no Three.js types except Vector3 read access.
 */

import type { Vector3 } from "three";

export const MAX_TRAIL_VERTICES = 2000;
export const TRAIL_PLANE_DISTANCE = 1;
export const NARRATION_INTERVAL_MS = 1100;
export const MIN_VERTICES_FOR_SUMMARY = 40;

export type ChronoSlug =
  | "amber"
  | "azure"
  | "amethyst"
  | "crimson"
  | "veridian";

export type Observation = {
  /** The observation text, Aura register. */
  text: string;
  /** Which chrono mode the observation reads as. */
  mode: ChronoSlug;
  /** Monotonic timestamp this observation was generated. */
  t: number;
};

export type TrailWithTime = {
  points: Vector3[];
  times: number[];
};

export type Heuristics = {
  arcLength: number;
  netTranslation: number;
  turnCount: number;
  meanSpeed: number;
  minSpeed: number;
  maxSpeed: number;
  selfIntersects: boolean;
  dominantDirection: string;
  vertexCount: number;
  durationS: number;
};

export function compassFromVector(dx: number, dy: number): string {
  const angle = Math.atan2(dy, dx);
  const deg = (angle * 180) / Math.PI;
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return "no settled direction";
  if (deg >= -22.5 && deg < 22.5) return "rightward";
  if (deg >= 22.5 && deg < 67.5) return "up and to the right";
  if (deg >= 67.5 && deg < 112.5) return "upward";
  if (deg >= 112.5 && deg < 157.5) return "up and to the left";
  if (deg >= -67.5 && deg < -22.5) return "down and to the right";
  if (deg >= -112.5 && deg < -67.5) return "downward";
  if (deg >= -157.5 && deg < -112.5) return "down and to the left";
  return "leftward";
}

export function computeHeuristics(trail: TrailWithTime): Heuristics {
  const { points, times } = trail;
  if (points.length < 2) {
    return {
      arcLength: 0,
      netTranslation: 0,
      turnCount: 0,
      meanSpeed: 0,
      minSpeed: 0,
      maxSpeed: 0,
      selfIntersects: false,
      dominantDirection: "no settled direction",
      vertexCount: points.length,
      durationS: 0,
    };
  }
  let arcLength = 0;
  let turnCount = 0;
  const speeds: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const step = Math.sqrt(dx * dx + dy * dy + dz * dz);
    arcLength += step;
    const dt = Math.max(1e-3, (times[i]! - times[i - 1]!) / 1000);
    speeds.push(step / dt);
  }
  for (let i = 2; i < points.length; i++) {
    const a = points[i - 2]!;
    const b = points[i - 1]!;
    const c = points[i]!;
    const ax = b.x - a.x,
      ay = b.y - a.y;
    const bx = c.x - b.x,
      by = c.y - b.y;
    const na = Math.hypot(ax, ay) || 1e-6;
    const nb = Math.hypot(bx, by) || 1e-6;
    const dot = (ax * bx + ay * by) / (na * nb);
    if (dot < 0.85) turnCount++;
  }
  const net = points[points.length - 1]!.clone().sub(points[0]!);
  const netTranslation = net.length();
  const meanSpeed =
    speeds.reduce((s, v) => s + v, 0) / Math.max(1, speeds.length);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const selfIntersects = arcLength > netTranslation * 3 && points.length > 100;
  const durationS = Math.max(
    0,
    (times[times.length - 1]! - times[0]!) / 1000,
  );
  return {
    arcLength,
    netTranslation,
    turnCount,
    meanSpeed,
    minSpeed,
    maxSpeed,
    selfIntersects,
    dominantDirection: compassFromVector(net.x, net.y),
    vertexCount: points.length,
    durationS,
  };
}

/**
 * Decide which observation to emit, based on the most recent
 * heuristics + a "what has Aura already said" set to avoid repetition.
 */
export function pickObservation(
  h: Heuristics,
  alreadySaid: Set<string>,
  elapsedS: number,
): Observation | null {
  type Candidate = { text: string; mode: ChronoSlug; priority: number };
  const candidates: Candidate[] = [];

  if (elapsedS < 1.2) {
    candidates.push({
      text: `A trail beginning. The line moves ${h.dominantDirection}.`,
      mode: "azure",
      priority: 1,
    });
  }
  if (h.turnCount >= 1 && h.turnCount < 4) {
    candidates.push({
      text: "The line turns &mdash; sharper than the segment before it.",
      mode: "amethyst",
      priority: 2,
    });
  }
  if (h.turnCount >= 4 && h.turnCount < 10) {
    candidates.push({
      text: "Several turns now. The line is not committing to one direction.",
      mode: "amethyst",
      priority: 3,
    });
  }
  if (h.turnCount >= 10) {
    candidates.push({
      text: "The line is restless. Many turns. Whatever pattern is here, it is hard to name.",
      mode: "amethyst",
      priority: 3,
    });
  }
  if (h.minSpeed < 0.05 && h.vertexCount > 30) {
    candidates.push({
      text: "The hand slowed. The line is breathing.",
      mode: "azure",
      priority: 2,
    });
  }
  if (h.maxSpeed > 2 && h.meanSpeed > 1) {
    candidates.push({
      text: "The line is moving with speed. The trail comes out kinetic.",
      mode: "amber",
      priority: 2,
    });
  }
  if (h.selfIntersects) {
    candidates.push({
      text: "A return. The line has met its own past.",
      mode: "veridian",
      priority: 4,
    });
  }
  if (
    h.netTranslation > 0.5 &&
    h.arcLength / Math.max(1e-3, h.netTranslation) < 1.4 &&
    h.vertexCount > 60
  ) {
    candidates.push({
      text: `The line travels far in one direction, mostly ${h.dominantDirection}.`,
      mode: "veridian",
      priority: 3,
    });
  }
  if (h.arcLength > 1 && h.maxSpeed - h.minSpeed > 2 && h.vertexCount > 80) {
    candidates.push({
      text: "The pace breaks. The line was steady, then it shoved.",
      mode: "crimson",
      priority: 3,
    });
  }
  if (h.turnCount > 0 && h.vertexCount > 150) {
    candidates.push({
      text: "Pattern, perhaps. The same turn appears again.",
      mode: "veridian",
      priority: 3,
    });
  }

  const fresh = candidates.filter((c) => !alreadySaid.has(c.text));
  if (fresh.length === 0) return null;
  fresh.sort((a, b) => b.priority - a.priority);
  const top = fresh[0]!;
  return { text: top.text, mode: top.mode, t: performance.now() };
}

export function summaryFor(h: Heuristics): string {
  if (h.vertexCount < MIN_VERTICES_FOR_SUMMARY) {
    return "The trail is too short to say anything settled. Draw a little more.";
  }
  const shape = h.selfIntersects
    ? "a knotted figure"
    : h.turnCount >= 4
      ? "a winding line"
      : h.turnCount >= 1
        ? "a curving line"
        : "a straight line";
  const pace =
    h.meanSpeed > 1.5
      ? "quickly"
      : h.meanSpeed > 0.6
        ? "at a moderate pace"
        : "slowly";
  return `What I saw: ${shape}, drawn ${pace}, with ${h.turnCount} turn${
    h.turnCount === 1 ? "" : "s"
  } over ${h.vertexCount} samples.`;
}
