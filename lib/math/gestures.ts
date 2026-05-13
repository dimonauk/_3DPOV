/**
 * lib/math/gestures.ts — Gesture-trajectory primitives.
 *
 * Tools for analysing 2D / 3D trajectories: signed angular velocity,
 * curvature, arc-length, low-pass FFT-magnitude (smoothed), and
 * uniform resampling. These are the math behind the kata-classifier
 * and behind the trail-meld engine; they sit in TypeScript so the
 * browser can do gesture analysis in real time.
 *
 * The Python originals live at
 *   D:\The_Hangar\apps\prototypes\poi-sculptor\capture\trail_capture.py
 *   D:\The_Hangar\apps\prototypes\poi-sculptor\meld-engine.js
 * These ports are pure functions; semantically identical, no
 * numpy / pandas dependency.
 */

export type Point2 = { x: number; y: number };
export type Point3 = { x: number; y: number; z: number };

// Arc-length ---------------------------------------------------------

export function arcLength2(points: Point2[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]!.x - points[i - 1]!.x;
    const dy = points[i]!.y - points[i - 1]!.y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

export function arcLength3(points: Point3[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]!.x - points[i - 1]!.x;
    const dy = points[i]!.y - points[i - 1]!.y;
    const dz = points[i]!.z - points[i - 1]!.z;
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return total;
}

// Curvature ----------------------------------------------------------

/**
 * Discrete signed curvature at each interior point of a 2D trail.
 * Positive = left turn, negative = right turn. Endpoints have
 * curvature 0 (no neighbour on one side).
 */
export function curvature2(points: Point2[]): number[] {
  const out: number[] = new Array(points.length).fill(0);
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const c = points[i + 1]!;
    const ax = b.x - a.x;
    const ay = b.y - a.y;
    const bx = c.x - b.x;
    const by = c.y - b.y;
    const cross = ax * by - ay * bx;
    const dotLen = Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by);
    out[i] = dotLen > 0 ? cross / dotLen : 0;
  }
  return out;
}

// Angular velocity ----------------------------------------------------

/**
 * Angular velocity around a centre point. Returns radians per frame
 * (multiply by sample rate to convert to rad/s).
 */
export function angularVelocity2(
  points: Point2[],
  centre: Point2 = { x: 0, y: 0 },
): number[] {
  const out: number[] = [];
  let prevAngle: number | null = null;
  for (const p of points) {
    const angle = Math.atan2(p.y - centre.y, p.x - centre.x);
    if (prevAngle === null) {
      out.push(0);
    } else {
      let delta = angle - prevAngle;
      // unwrap to (-pi, pi]
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta <= -Math.PI) delta += 2 * Math.PI;
      out.push(delta);
    }
    prevAngle = angle;
  }
  return out;
}

// Uniform resampling --------------------------------------------------

/**
 * Resample a 2D trail to N points equally spaced along its arc.
 * Useful for shape comparison: two trails sampled at the same N
 * points can be compared directly.
 */
export function resample2(points: Point2[], n: number): Point2[] {
  if (points.length < 2 || n < 2) return points.slice();
  const total = arcLength2(points);
  const step = total / (n - 1);
  const out: Point2[] = [points[0]!];
  let acc = 0;
  let i = 1;
  let prev = points[0]!;
  while (out.length < n && i < points.length) {
    const next = points[i]!;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const seg = Math.sqrt(dx * dx + dy * dy);
    if (acc + seg >= step) {
      const t = (step - acc) / seg;
      const px = prev.x + dx * t;
      const py = prev.y + dy * t;
      out.push({ x: px, y: py });
      prev = { x: px, y: py };
      acc = 0;
    } else {
      acc += seg;
      prev = next;
      i++;
    }
  }
  while (out.length < n) out.push(points[points.length - 1]!);
  return out;
}

// Smoothing ----------------------------------------------------------

/**
 * Simple moving-average low-pass on a 1D signal. Window size in
 * samples; w = 1 is a no-op.
 */
export function smoothMA(signal: number[], w: number): number[] {
  if (w <= 1) return signal.slice();
  const half = Math.floor(w / 2);
  const out = new Array(signal.length).fill(0);
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = -half; j <= half; j++) {
      const k = i + j;
      if (k >= 0 && k < signal.length) {
        sum += signal[k]!;
        count++;
      }
    }
    out[i] = sum / count;
  }
  return out;
}
