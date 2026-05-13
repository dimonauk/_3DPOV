/**
 * lib/visualiser/morphing-math.ts &mdash; Animation-config + sequencing layer.
 * Twin: lib/visualiser/morphing-math.PURPOSE.md.
 *
 * Ported from D:\The_Hangar\python-services\morphing_engine.py
 * (MorphingEngine + AnimationConfig). The Hangar source is a 450-line
 * class that owns easing, interpolation, frame generation, SVG render
 * and disk I/O. Here the headless maths is lifted out: easing lives in
 * lib/math/easing.ts, IO and rendering live in components that consume
 * this module. Everything below is a pure function over numbers.
 */

import {
  byName,
  type Easing,
  type EasingName,
  mix,
} from "../math/easing";

// Config --------------------------------------------------------------

/** Loop behaviour for a single MorphingConfig played past its duration. */
export type MorphingLoop = "none" | "loop" | "ping-pong";

/**
 * One leg of a morph. Duration is in milliseconds; easing is a canonical
 * EasingName resolved through lib/math/easing.ts. fromValue / toValue are
 * scalars &mdash; the caller picks the substrate (a stroke width, an LED
 * brightness, a node x-coordinate, an SDF blend parameter) and runs one
 * MorphingConfig per channel.
 */
export type MorphingConfig = {
  duration: number;
  easing: EasingName;
  fromValue: number;
  toValue: number;
  /** Optional repeat behaviour past the duration. Defaults to "none". */
  loop?: MorphingLoop | boolean;
};

/** Default-construct a config; useful as a starting point for callers. */
export function defaultConfig(): MorphingConfig {
  return {
    duration: 2000,
    easing: "easeInOutCubic",
    fromValue: 0,
    toValue: 1,
    loop: "none",
  };
}

// Time normalisation --------------------------------------------------

/** Coerce the `loop` field into its canonical form. */
function normaliseLoop(loop: MorphingConfig["loop"]): MorphingLoop {
  if (loop === true) return "loop";
  if (loop === false || loop === undefined) return "none";
  return loop;
}

/**
 * Convert elapsed milliseconds into a [0, 1] normalised time, respecting
 * the loop mode. "none" clamps past 1; "loop" wraps; "ping-pong" mirrors
 * every other cycle. Zero-duration configs collapse to t=1 (the morph is
 * already over).
 */
export function normalisedTime(config: MorphingConfig, tMs: number): number {
  const duration = config.duration;
  if (!(duration > 0)) return 1;
  const mode = normaliseLoop(config.loop);
  if (mode === "none") {
    if (tMs <= 0) return 0;
    if (tMs >= duration) return 1;
    return tMs / duration;
  }
  if (mode === "loop") {
    const wrapped = ((tMs % duration) + duration) % duration;
    return wrapped / duration;
  }
  // ping-pong: full cycle is 2*duration, second half plays in reverse.
  const cycle = duration * 2;
  const wrapped = ((tMs % cycle) + cycle) % cycle;
  return wrapped <= duration
    ? wrapped / duration
    : 1 - (wrapped - duration) / duration;
}

// Sampling ------------------------------------------------------------

/**
 * Sample the morph at parameter `tMs` (milliseconds since the morph
 * started). Returns the interpolated scalar, with easing applied to the
 * normalised time before the linear blend. This is the lerp(a, b, ease(t))
 * shape from the Python source's morph_patterns().
 */
export function sampleAt(config: MorphingConfig, tMs: number): number {
  const t = normalisedTime(config, tMs);
  const eased = byName(config.easing)(t);
  return mix(config.fromValue, config.toValue, eased);
}

/**
 * Sample the morph from its EASED parameter directly &mdash; useful when
 * the caller has already wrangled t (e.g.&nbsp;a frame index out of a
 * pre-computed table). No clamping; the caller owns range.
 */
export function sampleAtEased(config: MorphingConfig, eased: number): number {
  return mix(config.fromValue, config.toValue, eased);
}

// Sequencing ----------------------------------------------------------

/** A sequence of morphs played back-to-back along a shared timeline. */
export type MorphingSequence = ReadonlyArray<MorphingConfig>;

/** Total duration of a sequence, in milliseconds. */
export function sequenceDuration(seq: MorphingSequence): number {
  let total = 0;
  for (const leg of seq) total += Math.max(0, leg.duration);
  return total;
}

/**
 * Find the leg active at `tMs` and the time within that leg. Returns null
 * when the sequence is empty or tMs lies past its end (no looping &mdash;
 * loop semantics belong on the individual leg, not the sequence).
 */
export function legAt(
  seq: MorphingSequence,
  tMs: number,
): { index: number; leg: MorphingConfig; tLocal: number } | null {
  if (seq.length === 0 || tMs < 0) return null;
  let cursor = 0;
  for (let i = 0; i < seq.length; i++) {
    const leg = seq[i];
    if (!leg) continue;
    const dur = Math.max(0, leg.duration);
    if (tMs < cursor + dur) {
      return { index: i, leg, tLocal: tMs - cursor };
    }
    cursor += dur;
  }
  // Past the end: pin to the last leg's final value so renderers can rest.
  const last = seq[seq.length - 1];
  if (!last) return null;
  return {
    index: seq.length - 1,
    leg: last,
    tLocal: Math.max(0, last.duration),
  };
}

/** Sample a whole sequence at `tMs`. Empty sequences return 0. */
export function sampleSequence(seq: MorphingSequence, tMs: number): number {
  const at = legAt(seq, tMs);
  if (!at) return 0;
  return sampleAt(at.leg, at.tLocal);
}

/**
 * Generate `frameCount` samples evenly spaced across the sequence (or
 * across one leg, when passed a MorphingConfig). Matches the
 * generate_sequence() shape from the Python source: useful for SVG /
 * LED-frame exports.
 */
export function sampleFrames(
  target: MorphingConfig | MorphingSequence,
  frameCount: number,
): number[] {
  if (frameCount <= 0) return [];
  const seq: MorphingSequence = Array.isArray(target)
    ? target
    : [target as MorphingConfig];
  const total = sequenceDuration(seq);
  const out: number[] = new Array(frameCount);
  const denom = Math.max(1, frameCount - 1);
  for (let i = 0; i < frameCount; i++) {
    const tMs = (i / denom) * total;
    out[i] = sampleSequence(seq, tMs);
  }
  return out;
}

// Blend helpers -------------------------------------------------------

/**
 * Half-cosine interpolation, the smooth-but-not-eased blend used in the
 * Hangar's choreography engine to mix two streams without resorting to a
 * full easing curve. Equivalent to easeInOutSine but kept here under a
 * familiar name for callers porting from the Python.
 */
export function cosineLerp(a: number, b: number, t: number): number {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const k = (1 - Math.cos(clamped * Math.PI)) / 2;
  return a + (b - a) * k;
}

/**
 * Mix two easing curves by weight w in [0, 1]: w=0 returns curveA,
 * w=1 returns curveB, intermediates blend pointwise. Lets callers
 * crossfade between, say, ease-in-quad early in an arc and elastic-out
 * late, without needing a new named curve for every combination.
 */
export function mixCurves(a: Easing, b: Easing, w: number): Easing {
  const clamped = w < 0 ? 0 : w > 1 ? 1 : w;
  return (t: number) => mix(a(t), b(t), clamped);
}

/** Resolve an EasingName into a curve (re-exported for convenience). */
export function curve(name: EasingName): Easing {
  return byName(name);
}
