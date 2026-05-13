/**
 * lib/evolution/selection.ts — Selection operators for the evolution engine.
 *
 * # Purpose
 * Picks parents (or survivors) from a population given a fitness
 * function. Three strategies — tournament, elitist top-K, fitness-
 * proportionate roulette — covering the operators the Hangar Python
 * source ships and the studio engine needs.
 *
 * # Why this shape
 * Pure functions over read-only arrays, RNG injected by the caller.
 * The engine in `engine.ts` calls these with a seeded RNG so the
 * whole generational walk is reproducible. No state, no
 * side-effects, no class.
 *
 * Ported from D:\The_Hangar\python-services\genome\operators.py —
 * `tournament_select` lifts directly, `topK` is the engine's "elites"
 * step generalised, `roulette` is added for completeness.
 */

import type { FitnessFunction } from "./fitness";

/** Score every subject once and cache by index. The engine's
 * generational loop scores N subjects against any selection
 * operator's inner loop, which would otherwise call fitness K×N
 * times per generation. */
function precompute<T>(
  population: ReadonlyArray<T>,
  fitness: FitnessFunction<T>,
): { subject: T; score: number }[] {
  return population.map((subject) => ({ subject, score: fitness(subject) }));
}

/**
 * K-tournament selection. Draws `k` candidates uniformly at random
 * from the population (with replacement when `k > population.length`)
 * and returns the highest-scoring one. Repeats `count` times.
 *
 * Mirrors `operators.tournament_select` — the default operator the
 * Python engine uses for parent picking inside `evolve_population`.
 */
export function tournament<T>(
  population: ReadonlyArray<T>,
  count: number,
  fitness: FitnessFunction<T>,
  rng: () => number,
  k = 3,
): T[] {
  if (population.length === 0 || count <= 0) return [];
  const scored = precompute(population, fitness);
  const winners: T[] = [];
  for (let i = 0; i < count; i++) {
    let best = scored[Math.floor(rng() * scored.length)];
    if (!best) continue;
    for (let j = 1; j < k; j++) {
      const candidate = scored[Math.floor(rng() * scored.length)];
      if (candidate && candidate.score > best.score) best = candidate;
    }
    winners.push(best.subject);
  }
  return winners;
}

/**
 * Elitist top-K selection. Sorts the population descending by fitness
 * and returns the top `count`. Used as the engine's elite-preservation
 * step before bred + wildcard children fill out the next generation.
 */
export function topK<T>(
  population: ReadonlyArray<T>,
  count: number,
  fitness: FitnessFunction<T>,
): T[] {
  if (population.length === 0 || count <= 0) return [];
  const scored = precompute(population, fitness);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.subject);
}

/**
 * Fitness-proportionate (roulette-wheel) selection. Each subject's
 * pick probability is its score divided by the total score; degenerate
 * zero-total populations fall through to uniform random.
 *
 * Drawn `count` times with replacement — the engine handles dedup if
 * it wants unique parents.
 */
export function roulette<T>(
  population: ReadonlyArray<T>,
  count: number,
  fitness: FitnessFunction<T>,
  rng: () => number,
): T[] {
  if (population.length === 0 || count <= 0) return [];
  const scored = precompute(population, fitness);
  const total = scored.reduce((s, e) => s + Math.max(0, e.score), 0);
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    if (total <= 0) {
      // Uniform fallback when nobody scored.
      const pick = scored[Math.floor(rng() * scored.length)];
      if (pick) out.push(pick.subject);
      continue;
    }
    let target = rng() * total;
    let chosen: T | undefined = undefined;
    for (const { subject, score } of scored) {
      target -= Math.max(0, score);
      if (target <= 0) {
        chosen = subject;
        break;
      }
    }
    if (chosen === undefined) {
      const fallback = scored[scored.length - 1];
      if (fallback) chosen = fallback.subject;
    }
    if (chosen !== undefined) out.push(chosen);
  }
  return out;
}

/** A typed alias for the engine's "give me N parents" contract. The
 * engine accepts any function with this shape so callers can plug in
 * their own selector (rank, stochastic universal, etc) without
 * touching the engine. */
export type SelectionOperator<T> = (
  population: ReadonlyArray<T>,
  count: number,
  fitness: FitnessFunction<T>,
  rng: () => number,
) => T[];

/** Curry a tournament selector with a fixed `k` into a
 * `SelectionOperator<T>` the engine can call. */
export function makeTournament<T>(k: number): SelectionOperator<T> {
  return (population, count, fitness, rng) =>
    tournament(population, count, fitness, rng, k);
}
