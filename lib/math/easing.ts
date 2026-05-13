/**
 * lib/math/easing.ts — Easing-function library, ported from
 * D:\The_Hangar\python-services\morphing_engine.py (EasingLibrary class,
 * Robert Penner equations + CSS-style cubic-bezier easings).
 *
 * Every function takes t in 0..1 and returns the eased value in
 * 0..1 (except elastic / back which deliberately overshoot).
 * All ports preserve the original semantics; the only edit is that
 * the JavaScript Math library replaces numpy.
 */

// Polynomial ramps -----------------------------------------------------

export function linear(t: number): number {
  return t;
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) ** 2;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2;
}

export function easeInCubic(t: number): number {
  return t ** 3;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - 4 * (1 - t) ** 3;
}

export function easeInQuart(t: number): number {
  return t ** 4;
}

export function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t ** 4 : 1 - 8 * (1 - t) ** 4;
}

// Sinusoidal -----------------------------------------------------------

export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}

export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// Exponential ---------------------------------------------------------

export function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// Back (overshoot) ----------------------------------------------------

const BACK_S = 1.70158;
const BACK_S2 = BACK_S * 1.525;

export function easeInBack(t: number, s: number = BACK_S): number {
  return t * t * ((s + 1) * t - s);
}

export function easeOutBack(t: number, s: number = BACK_S): number {
  const tt = t - 1;
  return tt * tt * ((s + 1) * tt + s) + 1;
}

export function easeInOutBack(t: number): number {
  if (t < 0.5) {
    return (Math.pow(2 * t, 2) * ((BACK_S2 + 1) * 2 * t - BACK_S2)) / 2;
  }
  return (
    (Math.pow(2 * t - 2, 2) * ((BACK_S2 + 1) * (t * 2 - 2) + BACK_S2) +
      2) /
    2
  );
}

// Elastic (oscillating) -----------------------------------------------

export function easeInElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
}

export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

// Bounce --------------------------------------------------------------

export function bounce(t: number): number {
  return Math.abs(Math.sin(t * Math.PI));
}

// Utility blends ------------------------------------------------------

/** Linear blend: a when t=0, b when t=1. */
export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothstep: cubic Hermite interpolation between edge0 and edge1.
 * Returns 0 below edge0, 1 above edge1, smooth ramp in between.
 */
export function smoothstep(
  edge0: number,
  edge1: number,
  x: number,
): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Registry ------------------------------------------------------------

export type EasingFunction = (t: number) => number;

/**
 * Name-keyed registry matching the morphing engine's get_function()
 * dictionary, with extra names for the in / out / in-out triplets.
 */
export const easingRegistry: Record<string, EasingFunction> = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  bounce,
  // Legacy aliases matching the Python registry keys
  ease_in: easeInQuad,
  ease_out: easeOutQuad,
  ease_in_out: easeInOutCubic,
};

export function getEasing(name: string): EasingFunction {
  return easingRegistry[name] ?? linear;
}
