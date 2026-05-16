/**
 * lib/capabilities/inverse-kata/match.ts — Inverse-kata phase A: match a
 * hand-drawn or extracted trail to a sequence of named kata moves.
 *
 * No ML, no model — this is the heuristic decomposition layer that
 * works on day one. It segments a trail at natural curvature
 * boundaries, classifies each segment into the closest Laban Basic
 * Effort by geometric features, then picks the kata in that corner
 * whose duration best matches the segment's implied tempo.
 *
 * # The five features per segment
 *
 * - **Length** — short segments (< 0.3× whole-trail length) bias toward
 *   sudden Laban corners (PUNCH / DAB / FLICK / SLASH).
 * - **Curvature** — sum of absolute angle deltas, normalised by length.
 *   High = indirect (SLASH / FLOAT / WRING / FLICK); low = direct.
 * - **Straightness** — euclidean(start, end) / pathLength. ~1.0 = direct;
 *   << 1.0 = indirect/coiled.
 * - **Self-intersection** — crossings within the segment. Strong WRING
 *   signal.
 * - **Speed implied** — angle-delta peaks / arc length. Sharp turns
 *   imply suddenness.
 *
 * # The eight Laban signatures
 *
 * Each Laban corner has a target feature vector. We compute Euclidean
 * distance from the segment's feature vector to each corner; closest
 * wins. The features are scaled to roughly 0..1 each so the distance
 * is meaningful.
 *
 * # Kata pick within a corner
 *
 * Multiple kata can map to the same Laban corner. Pick the one whose
 * `durationMs` is closest to the segment's implied duration (assuming
 * a default tempo of 8 m/s peak hand-speed). The user can override
 * per-segment in the chamber UI.
 */

import {
  type KataMove,
  type LabanCorner,
  kataMoves,
  labanCorners,
} from "lib/assets/flow-arts";

// ---------- Types ----------

export type Vec2 = [number, number];

export type TrailInput = {
  /** Polyline points in some coordinate system (units don't matter — we
   *  normalise internally). At least 4 points; fewer is rejected. */
  points: Vec2[];
  /** Optional per-point timing in ms from trail start. When absent we
   *  assume uniform spacing and a default tempo. */
  timing?: number[];
};

export type SegmentFeatures = {
  startIdx: number;
  endIdx: number;
  /** Path length in input units. */
  pathLength: number;
  /** Straight-line distance from start to end. */
  euclideanDistance: number;
  /** straightness = euclidean / pathLength, clamped to 1.0 */
  straightness: number;
  /** Mean curvature = sum |angleDelta| / pathLength (radians per unit). */
  meanCurvature: number;
  /** Number of self-crossings within this segment. */
  selfIntersections: number;
  /** Implied duration in ms. Either from timing, or pathLength / defaultSpeed. */
  durationMs: number;
};

export type SegmentMatch = {
  segment: SegmentFeatures;
  /** The Laban Basic Effort the segment is classified as. */
  labanEffort: LabanCorner["name"];
  /** Confidence: 1.0 = exact signature match, 0.0 = wildly off. */
  labanConfidence: number;
  /** Top kata move within that Laban corner. */
  kata: KataMove;
  /** Confidence: how close the segment's duration matches the kata's. */
  kataConfidence: number;
};

export type InverseKataResult = {
  segments: SegmentMatch[];
  /** Total trail duration in ms (sum of segment durations). */
  totalDurationMs: number;
  /** Min of all segment confidences — the weakest link. */
  worstConfidence: number;
  /** Mean across all segments. */
  meanConfidence: number;
  /** Notes the matcher wants to surface (e.g. "trail too short", "high uncertainty"). */
  notes: string[];
};

// ---------- Tunables ----------

/** Default peak hand-speed in metres per second when timing is absent.
 *  Used to convert path-length → implied duration. The kata library's
 *  durationMs were authored at this tempo. */
const DEFAULT_SPEED = 8;

/** Curvature threshold for segmentation: an angle delta > this (radians)
 *  marks a natural segment boundary. ~30° default. */
const SEGMENT_CURVATURE_THRESHOLD = 0.52;

/** Minimum number of points for a valid segment after segmentation. */
const MIN_SEGMENT_POINTS = 3;

// ---------- Laban signatures ----------

/**
 * Each Laban Basic Effort's target feature vector. Order matches the
 * SegmentFeatures fields used in `featureDistance`. Values are
 * heuristic estimates from the Laban canon descriptions in flow-arts.ts.
 *
 * Fields: [straightness, meanCurvature, suddenness, selfIntersectionBias]
 * - straightness: 1 = perfectly direct, 0 = wandering
 * - meanCurvature: 0..1, 0 = straight, 1 = tight spiral
 * - suddenness: 0..1, 0 = sustained, 1 = sudden (short duration, sharp end)
 * - selfIntersectionBias: 0..1, 0 = open, 1 = coiled/orbiting
 */
type LabanSignature = readonly [number, number, number, number];

const LABAN_SIGNATURES: Record<LabanCorner["name"], LabanSignature> = {
  // Direct, strong, sustained, bound — the held push
  PRESS: [0.92, 0.05, 0.15, 0.1],
  // Direct, light, sustained, free — the skating line
  GLIDE: [0.95, 0.05, 0.1, 0.05],
  // Direct, strong, sudden, bound — the strike
  PUNCH: [0.95, 0.05, 0.95, 0.0],
  // Indirect, strong, sudden, free — the sword cut
  SLASH: [0.4, 0.5, 0.85, 0.1],
  // Indirect, light, sustained, free — the dust mote
  FLOAT: [0.3, 0.3, 0.05, 0.3],
  // Indirect, strong, sustained, bound — the grappling pull
  WRING: [0.2, 0.6, 0.1, 0.7],
  // Indirect, light, sudden, free — the spark
  FLICK: [0.5, 0.55, 0.9, 0.1],
  // Direct, light, sudden, bound — the tap
  DAB: [0.9, 0.05, 0.95, 0.0],
};

// ---------- Geometry helpers ----------

function dist(a: Vec2, b: Vec2): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

function pathLengthOf(points: Vec2[], startIdx: number, endIdx: number): number {
  let total = 0;
  for (let i = startIdx + 1; i <= endIdx; i++) {
    total += dist(points[i - 1]!, points[i]!);
  }
  return total;
}

/** Angle (radians, signed) at vertex i between segments (i-1, i) and (i, i+1). */
function angleAt(points: Vec2[], i: number): number {
  if (i <= 0 || i >= points.length - 1) return 0;
  const p = points[i - 1]!;
  const q = points[i]!;
  const r = points[i + 1]!;
  const ax = q[0] - p[0];
  const ay = q[1] - p[1];
  const bx = r[0] - q[0];
  const by = r[1] - q[1];
  const dot = ax * bx + ay * by;
  const cross = ax * by - ay * bx;
  return Math.atan2(cross, dot);
}

/** Count segment-pair crossings within indices [startIdx, endIdx]. */
function countSelfIntersections(
  points: Vec2[],
  startIdx: number,
  endIdx: number,
): number {
  let crossings = 0;
  for (let i = startIdx; i < endIdx - 1; i++) {
    for (let j = i + 2; j < endIdx; j++) {
      if (segmentsIntersect(points[i]!, points[i + 1]!, points[j]!, points[j + 1]!)) {
        crossings++;
      }
    }
  }
  return crossings;
}

function segmentsIntersect(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

function direction(a: Vec2, b: Vec2, c: Vec2): number {
  return (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1]);
}

// ---------- Trail resampling + segmentation ----------

/** Find segment boundary indices at curvature peaks. Always includes
 *  the first and last index. */
function findSegmentBoundaries(points: Vec2[]): number[] {
  const boundaries: number[] = [0];
  for (let i = 1; i < points.length - 1; i++) {
    const angle = Math.abs(angleAt(points, i));
    if (angle >= SEGMENT_CURVATURE_THRESHOLD) {
      // Coalesce nearby boundaries (within 3 points).
      const prev = boundaries[boundaries.length - 1]!;
      if (i - prev >= MIN_SEGMENT_POINTS) {
        boundaries.push(i);
      }
    }
  }
  boundaries.push(points.length - 1);
  return boundaries;
}

function computeSegmentFeatures(
  points: Vec2[],
  startIdx: number,
  endIdx: number,
  timing?: number[],
  trailScale?: number,
): SegmentFeatures {
  const pathLength = pathLengthOf(points, startIdx, endIdx);
  const euclideanDistance = dist(points[startIdx]!, points[endIdx]!);
  const straightness = pathLength > 0 ? Math.min(1, euclideanDistance / pathLength) : 1;
  let curvatureSum = 0;
  for (let i = startIdx + 1; i < endIdx; i++) {
    curvatureSum += Math.abs(angleAt(points, i));
  }
  // Normalise curvature against pathLength (radians per unit distance) →
  // scale to 0..1 by capping at π/unit which is wildly coiled.
  const meanCurvature = pathLength > 0 ? Math.min(1, curvatureSum / pathLength) : 0;
  const selfIntersections = countSelfIntersections(points, startIdx, endIdx);
  let durationMs: number;
  if (timing && timing[endIdx] !== undefined && timing[startIdx] !== undefined) {
    durationMs = timing[endIdx]! - timing[startIdx]!;
  } else {
    // Assume DEFAULT_SPEED m/s if input units are metres; if `trailScale`
    // is supplied, convert. Without scale info we treat input units as
    // metres and accept that the duration is a rough hint.
    const lengthInMetres = pathLength * (trailScale ?? 1);
    durationMs = Math.max(50, (lengthInMetres / DEFAULT_SPEED) * 1000);
  }
  return {
    startIdx,
    endIdx,
    pathLength,
    euclideanDistance,
    straightness,
    meanCurvature,
    selfIntersections,
    durationMs,
  };
}

// ---------- Laban classification ----------

/** Suddenness heuristic: short segments (< 500ms-equivalent) feel sudden;
 *  long segments feel sustained. Maps duration → 0..1. */
function suddennessFromFeatures(feat: SegmentFeatures): number {
  // < 200ms = pure sudden; > 1500ms = pure sustained.
  const d = feat.durationMs;
  if (d <= 200) return 1.0;
  if (d >= 1500) return 0.0;
  return 1 - (d - 200) / 1300;
}

/** Self-intersection bias: any crossing pushes toward WRING/orbit. */
function selfIntersectionBias(feat: SegmentFeatures): number {
  if (feat.selfIntersections === 0) return 0;
  if (feat.selfIntersections >= 3) return 1;
  return feat.selfIntersections / 3;
}

function classifyLaban(feat: SegmentFeatures): {
  effort: LabanCorner["name"];
  confidence: number;
} {
  const segVec: LabanSignature = [
    feat.straightness,
    feat.meanCurvature,
    suddennessFromFeatures(feat),
    selfIntersectionBias(feat),
  ];
  let best: { effort: LabanCorner["name"]; distance: number } | null = null;
  for (const [name, sig] of Object.entries(LABAN_SIGNATURES) as [
    LabanCorner["name"],
    LabanSignature,
  ][]) {
    const d = featureDistance(segVec, sig);
    if (!best || d < best.distance) {
      best = { effort: name, distance: d };
    }
  }
  if (!best) {
    return { effort: "FLOAT", confidence: 0 };
  }
  // Max possible distance in 4D unit space is 2 (sqrt(4)). Convert to
  // confidence: closer = higher confidence.
  const confidence = Math.max(0, 1 - best.distance / 2);
  return { effort: best.effort, confidence };
}

function featureDistance(a: LabanSignature, b: LabanSignature): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// ---------- Kata pick within a Laban corner ----------

function pickKataInCorner(
  effort: LabanCorner["name"],
  segmentDurationMs: number,
): { kata: KataMove; confidence: number } | null {
  const candidates = kataMoves.filter((m) => m.labanEffort === effort);
  if (candidates.length === 0) {
    // No kata in this corner yet. Pick any kata from the closest corner.
    const fallback = kataMoves[0];
    if (!fallback) return null;
    return { kata: fallback, confidence: 0 };
  }
  let best: { kata: KataMove; distance: number } | null = null;
  for (const m of candidates) {
    const d = Math.abs(m.durationMs - segmentDurationMs);
    if (!best || d < best.distance) {
      best = { kata: m, distance: d };
    }
  }
  if (!best) return null;
  // Confidence: how close the duration is, normalised by an "acceptable"
  // tolerance of ±500ms.
  const confidence = Math.max(0, 1 - best.distance / 500);
  return { kata: best.kata, confidence };
}

// ---------- Public API ----------

export function matchKataSequence(
  trail: TrailInput,
  opts: { trailScale?: number } = {},
): InverseKataResult {
  const notes: string[] = [];
  if (trail.points.length < 4) {
    notes.push("Trail has fewer than 4 points — too short to classify.");
    return {
      segments: [],
      totalDurationMs: 0,
      worstConfidence: 0,
      meanConfidence: 0,
      notes,
    };
  }

  const boundaries = findSegmentBoundaries(trail.points);

  const segments: SegmentMatch[] = [];
  for (let b = 0; b < boundaries.length - 1; b++) {
    const startIdx = boundaries[b]!;
    const endIdx = boundaries[b + 1]!;
    if (endIdx - startIdx < MIN_SEGMENT_POINTS - 1) continue;
    const feat = computeSegmentFeatures(
      trail.points,
      startIdx,
      endIdx,
      trail.timing,
      opts.trailScale,
    );
    const laban = classifyLaban(feat);
    const kataPick = pickKataInCorner(laban.effort, feat.durationMs);
    if (!kataPick) continue;
    segments.push({
      segment: feat,
      labanEffort: laban.effort,
      labanConfidence: laban.confidence,
      kata: kataPick.kata,
      kataConfidence: kataPick.confidence,
    });
  }

  if (segments.length === 0) {
    notes.push(
      "Couldn't find any segments with high enough curvature to classify — the trail may be too smooth or too short.",
    );
  }

  const totalDurationMs = segments.reduce(
    (acc, s) => acc + s.segment.durationMs,
    0,
  );
  const confidences = segments.map(
    (s) => Math.min(s.labanConfidence, s.kataConfidence),
  );
  const worstConfidence = confidences.length === 0 ? 0 : Math.min(...confidences);
  const meanConfidence =
    confidences.length === 0
      ? 0
      : confidences.reduce((a, b) => a + b, 0) / confidences.length;

  if (worstConfidence < 0.3) {
    notes.push(
      "At least one segment has very low confidence — the matcher is guessing here. Try the LLM orchestrator (phase B) for ambiguous segments.",
    );
  }

  return {
    segments,
    totalDurationMs,
    worstConfidence,
    meanConfidence,
    notes,
  };
}

/** Human-readable summary line per segment. */
export function summariseSegment(s: SegmentMatch, idx: number): string {
  const ms = Math.round(s.segment.durationMs);
  const corner = labanCorners.find((c) => c.name === s.labanEffort);
  const cornerNotes = corner?.notes ?? "";
  const tail = cornerNotes ? ` (${cornerNotes.split(".")[0]})` : "";
  return `${idx + 1}. ${s.kata.name} · ${s.labanEffort} · ${ms}ms${tail}`;
}
