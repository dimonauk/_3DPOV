/**
 * lib/evolution/engine.ts — Generic evolutionary loop.
 *
 * # Purpose
 * Composes a typed subject `T`, a mutation operator, a crossover
 * operator, a fitness function, and a selection operator into a
 * synchronous, reproducible generational walk. Returns the best
 * subject, the final population, and a per-generation history.
 *
 * # Why this shape
 * Pure, generic, no `Genome` import in the signature — the engine
 * runs on any typed subject. Reproducibility comes from a single
 * `seed` that drives the `seededRng` from `lib/algorithms/_base.ts`;
 * mutation and crossover receive the same RNG so the entire run
 * replays from one number. Synchronous because the studio's
 * evolution UI wants to step generations under user control, not
 * fire-and-forget.
 *
 * Ported from D:\The_Hangar\python-services\genome\operators.py
 * `evolve_population` — the elite/bred/wildcard split generalised
 * over a typed subject. The "wildcard" slot becomes optional via
 * the `wildcardFactory` option.
 */

import { seededRng } from "../algorithms/_base";
import type { FitnessFunction } from "./fitness";
import type { SelectionOperator } from "./selection";

/** Per-generation summary. Pushed once per generation step. */
export type GenerationSnapshot = {
  generation: number;
  bestFitness: number;
  avgFitness: number;
};

/** Engine result. The full final population is returned so a caller
 * can inspect, persist, or seed a follow-up run. */
export type EvolutionResult<T> = {
  best: T;
  bestFitness: number;
  finalPopulation: T[];
  history: GenerationSnapshot[];
};

/** All options the engine needs. Every callback receives the RNG so
 * the whole walk is deterministic given a fixed `seed`. */
export type EvolveOptions<T> = {
  /** Starting population. Length defines `populationSize` when that
   * field is omitted. */
  initial: ReadonlyArray<T>;
  /** Crossover operator. Required — the engine always breeds. */
  crossover: (a: T, b: T, rng: () => number) => T;
  /** Mutation operator. Applied to every bred child. */
  mutate: (subject: T, rng: () => number) => T;
  /** Fitness function. Pure; called many times per generation. */
  fitness: FitnessFunction<T>;
  /** Selection operator. See `selection.ts`. */
  select: SelectionOperator<T>;
  /** Number of generations to run. Must be a non-negative integer. */
  generations: number;
  /** Target population size. Defaults to `initial.length`. */
  populationSize?: number;
  /** Elite preservation count per generation. Defaults to ~10% of
   * population, minimum 1, maximum `populationSize - 1`. */
  eliteCount?: number;
  /** Wildcard slots per generation, filled by `wildcardFactory`.
   * Defaults to 0. */
  wildcardCount?: number;
  /** Builder for wildcard subjects (random newcomers). Required when
   * `wildcardCount > 0`. */
  wildcardFactory?: (rng: () => number) => T;
  /** Seed for the engine's RNG. Same seed → same run. Defaults to 0. */
  seed?: number;
};

/** The main entry point. Pure (no I/O, no module-scope state); the
 * only randomness is `seededRng(seed)`. */
export function evolve<T>(options: EvolveOptions<T>): EvolutionResult<T> {
  const {
    initial,
    crossover,
    mutate,
    fitness,
    select,
    generations,
    populationSize = initial.length,
    eliteCount,
    wildcardCount = 0,
    wildcardFactory,
    seed = 0,
  } = options;

  if (populationSize <= 0 || initial.length === 0) {
    throw new Error("evolve: population must be non-empty");
  }
  if (generations < 0 || !Number.isFinite(generations)) {
    throw new Error("evolve: generations must be a non-negative integer");
  }
  if (wildcardCount > 0 && !wildcardFactory) {
    throw new Error("evolve: wildcardFactory required when wildcardCount > 0");
  }

  const rng = seededRng(seed);

  // Initial population: pad or truncate to `populationSize`.
  let population: T[] = initial.slice(0, populationSize);
  while (population.length < populationSize) {
    const next = initial[population.length % initial.length];
    if (next === undefined) break;
    population.push(next);
  }

  const elites = clampElites(eliteCount, populationSize);
  const history: GenerationSnapshot[] = [];

  history.push(snapshot(0, population, fitness));

  for (let gen = 1; gen <= generations; gen++) {
    const eliteSurvivors = select(population, elites, fitness, rng);
    const breedTarget = populationSize - eliteSurvivors.length - wildcardCount;
    const bred: T[] = [];
    if (breedTarget > 0) {
      // Two independent picks per child so parents are sampled
      // separately — matches `evolve_population` in the Python source.
      const parentsA = select(population, breedTarget, fitness, rng);
      const parentsB = select(population, breedTarget, fitness, rng);
      for (let i = 0; i < breedTarget; i++) {
        const a = parentsA[i];
        const b = parentsB[i];
        if (a === undefined || b === undefined) break;
        const child = crossover(a, b, rng);
        bred.push(mutate(child, rng));
      }
    }
    const wildcards: T[] = [];
    if (wildcardCount > 0 && wildcardFactory) {
      for (let i = 0; i < wildcardCount; i++) {
        wildcards.push(wildcardFactory(rng));
      }
    }
    population = [...eliteSurvivors, ...bred, ...wildcards];
    while (population.length < populationSize && wildcardFactory) {
      population.push(wildcardFactory(rng));
    }
    history.push(snapshot(gen, population, fitness));
  }

  let best: T = population[0] as T;
  let bestScore = -Infinity;
  for (const subject of population) {
    const score = fitness(subject);
    if (score > bestScore) {
      bestScore = score;
      best = subject;
    }
  }
  return {
    best,
    bestFitness: Math.max(0, bestScore),
    finalPopulation: population,
    history,
  };
}

/** Clamp the elite count into [1, populationSize - 1] with a default
 * of `ceil(populationSize / 10)`. Private to the engine. */
function clampElites(requested: number | undefined, populationSize: number): number {
  if (requested === undefined) {
    return Math.max(1, Math.min(populationSize - 1, Math.ceil(populationSize / 10)));
  }
  return Math.max(0, Math.min(populationSize - 1, Math.floor(requested)));
}

/** Score the population once and return a generation snapshot. */
function snapshot<T>(
  generation: number,
  population: ReadonlyArray<T>,
  fitness: FitnessFunction<T>,
): GenerationSnapshot {
  if (population.length === 0) {
    return { generation, bestFitness: 0, avgFitness: 0 };
  }
  let best = -Infinity;
  let sum = 0;
  for (const subject of population) {
    const score = fitness(subject);
    if (score > best) best = score;
    sum += score;
  }
  return {
    generation,
    bestFitness: best === -Infinity ? 0 : best,
    avgFitness: sum / population.length,
  };
}

/** Re-export `seededRng` so engine callers can construct their own
 * RNG (for wildcard factories, custom mutate ops, ad-hoc reuse) from
 * the same seed without an extra import path. */
export { seededRng };
