/**
 * lib/math/easing.ts &mdash; Easing catalogue (Penner equations + CSS spec).
 * Twin: lib/math/easing.PURPOSE.md.
 *
 * Ported and extended from
 * `D:\The_Hangar\python-services\morphing_engine.py` (EasingLibrary). Every
 * function takes t in [0, 1] and returns the eased value in roughly the
 * same range &mdash; elastic and back deliberately overshoot. The shape of
 * the curves matches the CSS Easing specification and Robert Penner&rsquo;s
 * 2001 equations; the original Python used numpy, here Math replaces it.
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

export function easeInQuint(t: number): number {
  return t ** 5;
}

export function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5;
}

export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t ** 5 : 1 - 16 * (1 - t) ** 5;
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

// Exponential ----------------------------------------------------------

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

// Circular -------------------------------------------------------------

export function easeInCirc(t: number): number {
  return 1 - Math.sqrt(1 - t * t);
}

export function easeOutCirc(t: number): number {
  return Math.sqrt(1 - (t - 1) * (t - 1));
}

export function easeInOutCirc(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2;
}

// Back (overshoot) -----------------------------------------------------

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
    (Math.pow(2 * t - 2, 2) * ((BACK_S2 + 1) * (t * 2 - 2) + BACK_S2) + 2) / 2
  );
}

// Elastic (oscillating) ------------------------------------------------

const ELASTIC_C4 = (2 * Math.PI) / 3;
const ELASTIC_C5 = (2 * Math.PI) / 4.5;

export function easeInElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ELASTIC_C4);
}

export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ELASTIC_C4) + 1;
}

export function easeInOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) /
        2 +
        1;
}

// Bounce ---------------------------------------------------------------

const BOUNCE_N1 = 7.5625;
const BOUNCE_D1 = 2.75;

export function easeOutBounce(t: number): number {
  if (t < 1 / BOUNCE_D1) {
    return BOUNCE_N1 * t * t;
  }
  if (t < 2 / BOUNCE_D1) {
    const tt = t - 1.5 / BOUNCE_D1;
    return BOUNCE_N1 * tt * tt + 0.75;
  }
  if (t < 2.5 / BOUNCE_D1) {
    const tt = t - 2.25 / BOUNCE_D1;
    return BOUNCE_N1 * tt * tt + 0.9375;
  }
  const tt = t - 2.625 / BOUNCE_D1;
  return BOUNCE_N1 * tt * tt + 0.984375;
}

export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t);
}

export function easeInOutBounce(t: number): number {
  return t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;
}

/** Half-sine bump from the Python source (peaks at 1 mid-way, ends at 0). */
export function bounce(t: number): number {
  return Math.abs(Math.sin(t * Math.PI));
}

// Utility blends -------------------------------------------------------

/** Linear blend: a when t=0, b when t=1. */
export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothstep: cubic Hermite interpolation between edge0 and edge1.
 * Returns 0 below edge0, 1 above edge1, smooth ramp in between.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Registry -------------------------------------------------------------

/** Headless easing signature: input t in [0, 1], output ~ [0, 1]. */
export type Easing = (t: number) => number;
/** Back-compat alias for callers that already import EasingFunction. */
export type EasingFunction = Easing;

/** Canonical name &rarr; function table; the single source of truth. */
export const easings = {
  linear,
  easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic,
  easeInQuart, easeOutQuart, easeInOutQuart,
  easeInQuint, easeOutQuint, easeInOutQuint,
  easeInSine, easeOutSine, easeInOutSine,
  easeInExpo, easeOutExpo, easeInOutExpo,
  easeInCirc, easeOutCirc, easeInOutCirc,
  easeInBack, easeOutBack, easeInOutBack,
  easeInElastic, easeOutElastic, easeInOutElastic,
  easeInBounce, easeOutBounce, easeInOutBounce,
} as const satisfies Record<string, Easing>;

/** Literal-union of every canonical curve name in the catalogue. */
export type EasingName = keyof typeof easings;

/** Lookup by canonical name. */
export function byName(name: EasingName): Easing {
  return easings[name];
}

/**
 * Loose-string registry that mirrors the canonical table and adds
 * Python-side aliases (`ease_in`, `ease_in_out`, `bounce`, &hellip;) so
 * legacy JSON sequences continue to resolve.
 */
export const easingRegistry: Record<string, Easing> = {
  ...easings,
  ease_in: easeInQuad,
  ease_out: easeOutQuad,
  ease_in_out: easeInOutCubic,
  bounce,
  elastic: easeInElastic,
  back: easeInBack,
};

/** Loose-string lookup with linear as the safe fallback. */
export function getEasing(name: string): Easing {
  return easingRegistry[name] ?? linear;
}
