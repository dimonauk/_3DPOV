/**
 * lib/capabilities/viz/attractor.ts — Capability `viz.attractor`: 4-engine strange-attractor field.
 *
 * One-line role: iterate Clifford / Thomas / Lorenz / Dequan-Li trajectories to a Float32Array; map Aura's mood to engine + params.
 * Full purpose in attractor.PURPOSE.md.
 *
 * Pipeline Epsilon's body. v0.1 is CPU-iterated (fast enough for 50k
 * points); v0.2 lifts to WebGPU TSL behind the same generate() surface.
 *
 * Box 3 lift: shader math + parameter sets drawn from merrypranxter's
 * `strange_attractors` (MIT) and the canonical attractor literature.
 * Re-typed to our shape; original demo scaffolding stripped per
 * docs/MIGRATION_PRINCIPLES.md.
 */

import { vizStore, type AttractorEngine, type AttractorParams } from "lib/state/viz";
import { auraStore, type AuraMood } from "lib/state/aura";

const TWO_THIRDS = 2 / 3;

const ENGINE_DEFAULTS: Record<AttractorEngine, Record<string, number>> = {
  clifford: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
  thomas: { b: 0.208186, dt: 0.05 },
  lorenz: { sigma: 10, rho: 28, beta: 8 * TWO_THIRDS, dt: 0.01 },
  "dequan-li": { a: 40, c: 11 / 6, d: 0.16, eps: 0.65, k: 55, f: 20, dt: 0.001 },
};

type Step = (x: number, y: number, z: number, p: Record<string, number>) => readonly [number, number, number];

function stepClifford(x: number, y: number, _z: number, p: Record<string, number>): readonly [number, number, number] {
  const a = p.a ?? 0;
  const b = p.b ?? 0;
  const c = p.c ?? 0;
  const d = p.d ?? 0;
  return [Math.sin(a * y) + c * Math.cos(a * x), Math.sin(b * x) + d * Math.cos(b * y), 0];
}

function stepThomas(x: number, y: number, z: number, p: Record<string, number>): readonly [number, number, number] {
  const b = p.b ?? 0.208186;
  const dt = p.dt ?? 0.05;
  return [
    x + dt * (Math.sin(y) - b * x),
    y + dt * (Math.sin(z) - b * y),
    z + dt * (Math.sin(x) - b * z),
  ];
}

function stepLorenz(x: number, y: number, z: number, p: Record<string, number>): readonly [number, number, number] {
  const s = p.sigma ?? 10;
  const r = p.rho ?? 28;
  const b = p.beta ?? 8 * TWO_THIRDS;
  const dt = p.dt ?? 0.01;
  return [
    x + dt * s * (y - x),
    y + dt * (x * (r - z) - y),
    z + dt * (x * y - b * z),
  ];
}

function stepDequanLi(x: number, y: number, z: number, p: Record<string, number>): readonly [number, number, number] {
  const a = p.a ?? 40;
  const c = p.c ?? 11 / 6;
  const d = p.d ?? 0.16;
  const eps = p.eps ?? 0.65;
  const k = p.k ?? 55;
  const f = p.f ?? 20;
  const dt = p.dt ?? 0.001;
  return [
    x + dt * (a * (y - x) + d * x * z),
    y + dt * (k * x + f * y - x * z),
    z + dt * (c * z + x * y - eps * x * x),
  ];
}

const STEPS: Record<AttractorEngine, Step> = {
  clifford: stepClifford,
  thomas: stepThomas,
  lorenz: stepLorenz,
  "dequan-li": stepDequanLi,
};

const SEED_STATE: Record<AttractorEngine, readonly [number, number, number]> = {
  clifford: [0.1, 0.0, 0.0],
  thomas: [1.0, 1.0, 1.0],
  lorenz: [0.1, 0.0, 0.0],
  "dequan-li": [0.349, 0.0, -0.16],
};

export type GenerateOptions = {
  /** Number of trajectory points. Default reads from viz.attractor.particleCount. */
  count?: number;
  /** Override params merged onto engine defaults. */
  params?: Record<string, number>;
};

export type GenerateResult = {
  engine: AttractorEngine;
  positions: Float32Array;
  params: Record<string, number>;
  count: number;
};

/**
 * Generate a `count`-point trajectory of the named engine. Pure: no
 * slice writes, no rAF loop. Caller decides what to do with the
 * positions (render to BufferGeometry, export GLB, etc).
 */
export function generateAttractor(
  engine: AttractorEngine,
  options: GenerateOptions = {},
): GenerateResult {
  const baseParams = ENGINE_DEFAULTS[engine] ?? {};
  const params = { ...baseParams, ...options.params };
  const count = options.count ?? vizStore.getState().attractor.particleCount;
  const positions = new Float32Array(count * 3);
  const step = STEPS[engine];
  const seed = SEED_STATE[engine];
  let x = seed[0];
  let y = seed[1];
  let z = seed[2];
  for (let i = 0; i < count; i++) {
    const next = step(x, y, z, params);
    x = next[0];
    y = next[1];
    z = next[2];
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return { engine, positions, params, count };
}

/**
 * Pick an engine for a given mood. Pipeline Epsilon canon mapping:
 * - neutral / focused → lorenz (stable, iconic)
 * - playful → clifford (planar butterfly)
 * - delighted / tender → thomas (smooth, soft)
 * - alert / agitated → dequan-li (most chaotic)
 */
export function engineFromMood(mood: AuraMood): AttractorEngine {
  switch (mood) {
    case "playful":
      return "clifford";
    case "delighted":
    case "tender":
      return "thomas";
    case "alert":
    case "agitated":
      return "dequan-li";
    case "neutral":
    case "focused":
    default:
      return "lorenz";
  }
}

/**
 * Read aura.mood and write the corresponding engine to viz.attractor.
 * No regeneration of positions — that's caller responsibility (a
 * component re-runs generateAttractor when it sees the engine change).
 */
export function applyMoodToSlice(): void {
  const mood = auraStore.getState().mood;
  const engine = engineFromMood(mood);
  vizStore.getState().setAttractorEngine(engine);
}

/** Convenience: regenerate + return positions for the engine currently in the viz slice. */
export function regenerateFromSlice(options: GenerateOptions = {}): GenerateResult {
  const { engine } = vizStore.getState().attractor;
  return generateAttractor(engine, options);
}

export function listEngines(): AttractorEngine[] {
  return Object.keys(STEPS) as AttractorEngine[];
}

export function defaultsForEngine(engine: AttractorEngine): Record<string, number> {
  return { ...ENGINE_DEFAULTS[engine] };
}

export type { AttractorEngine, AttractorParams };
