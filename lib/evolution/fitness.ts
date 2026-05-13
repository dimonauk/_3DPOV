/**
 * lib/evolution/fitness.ts — Typed fitness scoring for the evolution engine.
 *
 * # Purpose
 * Encodes the scoring side of the breeder loop. A `FitnessFunction<T>`
 * scores any typed subject in [0..1]; `compose` weights multiple
 * functions into one. The named helpers (`scoreOptical`,
 * `scoreCoherence`, `scoreNovelty`, `scoreComplexity`,
 * `scorePrintability`) port the gene-only axes from the Hangar
 * Python source so the engine has working defaults when no mesh is
 * available.
 *
 * # Why this shape
 * The Python source scores in [0..5] and weights five axes; the
 * studio's TS engine normalises everything to [0..1] so `compose` is
 * a clean weighted sum. The mesh-dependent paths from
 * `score_printability` and `score_complexity` are stubbed with a
 * 0.5 TODO — the engine cares about the gene-only axes for the
 * generative loop; mesh-aware re-scoring belongs to a downstream
 * mesh-fitness module that imports `three`.
 *
 * Ported from D:\The_Hangar\python-services\fitness.py — the gene-
 * heuristic branches survive verbatim, the trimesh branches return
 * 0.5 with a marked TODO.
 */

import type { Genome, GeneName } from "./genome";
import { denormalise, getGene } from "./genome";

/** A pure scoring function. Must return a finite number in [0..1]. */
export type FitnessFunction<T> = (subject: T) => number;

/** Weighted entry for `compose`. */
export type WeightedFitness<T> = {
  fn: FitnessFunction<T>;
  weight: number;
};

/** Sum-of-weighted-scores composition. Weights are normalised so the
 * output stays in [0..1] regardless of caller input. Returns 0 when
 * the weight total is zero. */
export function compose<T>(entries: ReadonlyArray<WeightedFitness<T>>): FitnessFunction<T> {
  const total = entries.reduce((s, e) => s + Math.max(0, e.weight), 0);
  if (total <= 0) return () => 0;
  return (subject: T) => {
    let acc = 0;
    for (const { fn, weight } of entries) {
      const w = Math.max(0, weight);
      if (w === 0) continue;
      const v = fn(subject);
      const clamped = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
      acc += (clamped * w) / total;
    }
    return Math.max(0, Math.min(1, acc));
  };
}

/** Default axis weights, matching `AXIS_WEIGHTS` in the Python source. */
export const AXIS_WEIGHTS = {
  printability: 0.25,
  optical: 0.25,
  complexity: 0.2,
  coherence: 0.15,
  novelty: 0.15,
} as const;

/** Read a numeric gene by name; returns the fallback when the gene is
 * absent or non-numeric. */
function numGene(genome: Genome, name: string, fallback: number): number {
  const g = getGene(genome, name);
  if (!g) return fallback;
  return typeof g.value === "number" ? g.value : fallback;
}

/**
 * Optical-potential scoring. Ports `score_optical` from fitness.py —
 * rewards high IOR, transmission, useful grating pitch, and tight
 * waveguide tubes. Returns [0..1].
 */
export function scoreOptical(genome: Genome): number {
  const ior = denormalise("ior", numGene(genome, "ior", 0.5));
  const trans = numGene(genome, "transmission", 0.5);
  const emission = numGene(genome, "emission", 0.0);
  const gratingPitch = denormalise("grating_pitch", numGene(genome, "grating_pitch", 0.5));
  const tubeR = denormalise("tube_radius", numGene(genome, "tube_radius", 0.5));

  let score = 0;
  score += ((ior - 1.45) / 0.2) * 2.0; // 0-2
  score += trans * 1.5;
  score += Math.min(emission * 0.3, 0.5);
  if (gratingPitch >= 50 && gratingPitch <= 200) score += 1.0;
  else if (gratingPitch > 200 && gratingPitch <= 400) score += 0.5;
  if (tubeR < 1.5) score += 0.5;
  return Math.max(0, Math.min(1, score / 5.0));
}

/**
 * Coherence scoring. Ports `score_coherence` — penalises contradictory
 * gene combinations and rewards reinforcing pairs. Kingdom-specific
 * rules from `TYPE_CONSTRAINTS` apply through the `kingdom` field.
 * Returns [0..1].
 */
export function scoreCoherence(genome: Genome): number {
  const trans = numGene(genome, "transmission", 0.5);
  const emission = numGene(genome, "emission", 0.0);
  const wallThickness = numGene(genome, "wall_thickness", 0.5);
  const symmetry = numGene(genome, "symmetry", 0.5);
  const twist = numGene(genome, "twist", 0.5);
  const noiseAmp = numGene(genome, "noise_amplitude", 0.5);
  const ior = numGene(genome, "ior", 0.5);
  const tubeSmoothness = numGene(genome, "tube_smoothness", 0.5);

  let score = 5.0;
  if (trans < 0.2 && emission > 0.7) score -= 1.0;
  // Kingdom mapping: legacy "slime" → "protean" in this codebase.
  if (genome.kingdom === "protean" && wallThickness < 0.2) score -= 0.8;
  if (genome.kingdom === "biomech" && symmetry < 0.2) score -= 0.5;
  if (genome.kingdom === "choreographic" && twist < 0.2) score -= 0.3;
  if (noiseAmp > 0.7 && wallThickness < 0.25) score -= 0.7;
  if (trans > 0.6 && ior > 0.6) score += 0.3;
  if (tubeSmoothness > 0.5 && genome.kingdom === "protean") score += 0.2;
  return Math.max(0, Math.min(1, score / 5.0));
}

/**
 * Novelty scoring. Ports `score_novelty` — Euclidean distance from the
 * population's per-gene mean, normalised. A high score means the
 * genome is unusual. Closure over `population` is the legal way to
 * give a `FitnessFunction<Genome>` the population context.
 */
export function scoreNovelty(genome: Genome, population: ReadonlyArray<Genome>): number {
  const others = population.filter((g) => g.sequenceId !== genome.sequenceId);
  if (others.length === 0) return 0.5;
  const names = genome.genes.map((g) => g.id);
  if (names.length === 0) return 0.5;
  const mean = new Array<number>(names.length).fill(0);
  for (const g of others) {
    for (let i = 0; i < names.length; i++) {
      const name = names[i] ?? "";
      mean[i] = (mean[i] ?? 0) + numGene(g, name, 0.5);
    }
  }
  let sq = 0;
  for (let i = 0; i < names.length; i++) {
    const m = (mean[i] ?? 0) / others.length;
    const v = numGene(genome, names[i] ?? "", 0.5);
    sq += (v - m) * (v - m);
  }
  const dist = Math.sqrt(sq) / Math.sqrt(names.length);
  // Python: dist * 12.5 mapped to [0..5]. Here we want [0..1] → dist*2.5.
  return Math.max(0, Math.min(1, dist * 2.5));
}

/** Gene-diversity heuristic. Standard deviation of the numeric gene
 * vector, scaled to [0..1]. Used as a cheap proxy for visual interest
 * when no mesh is available. */
export function scoreComplexity(genome: Genome): number {
  const numeric = genome.genes
    .map((g) => g.value)
    .filter((v): v is number => typeof v === "number");
  if (numeric.length === 0) return 0;
  const mean = numeric.reduce((s, v) => s + v, 0) / numeric.length;
  const variance = numeric.reduce((s, v) => s + (v - mean) * (v - mean), 0) / numeric.length;
  const sd = Math.sqrt(variance);
  return Math.max(0, Math.min(1, sd * 3.0));
}

/** Gene-only printability heuristic. The full Python check evaluates a
 * mesh for watertightness, overhangs, bed size, and degenerate faces;
 * none of those are available without a mesh, so this stub uses
 * coherence × 0.6 + 0.4 as a cheap proxy. TODO: a mesh-aware sibling
 * `lib/evolution/fitness/printability.ts` should land when the engine
 * starts consuming Three.js geometry. */
export function scorePrintability(genome: Genome): number {
  // TODO: mesh-aware version pending — see PURPOSE doc.
  return Math.max(0, Math.min(1, scoreCoherence(genome) * 0.6 + 0.4));
}

/** Convenience: the five-axis weighted total exactly as the Python
 * source computes it, returning [0..1]. The closure is so the result
 * is a clean `FitnessFunction<Genome>`. */
export function defaultFitness(population: ReadonlyArray<Genome>): FitnessFunction<Genome> {
  return (g: Genome) => {
    const printability = scorePrintability(g);
    const optical = scoreOptical(g);
    const complexity = scoreComplexity(g);
    const coherence = scoreCoherence(g);
    const novelty = scoreNovelty(g, population);
    return Math.max(
      0,
      Math.min(
        1,
        printability * AXIS_WEIGHTS.printability +
          optical * AXIS_WEIGHTS.optical +
          complexity * AXIS_WEIGHTS.complexity +
          coherence * AXIS_WEIGHTS.coherence +
          novelty * AXIS_WEIGHTS.novelty,
      ),
    );
  };
}

/** Helper for callers that want to validate a gene name at compile
 * time before constructing a custom fitness function. Re-exports the
 * literal-union from `genome.ts` for ergonomics. */
export type { GeneName };
