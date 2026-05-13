/**
 * app/demo/evolution/evolution-demo-loop.ts — Pure pieces of the evolution demo loop.
 *
 * One-line role: subject type, synthetic fitness, mutation + crossover operators,
 * seed-driven population builders. Kept out of the client component so the
 * `"use client"` file stays under the 300-line cap and the loop is unit-testable.
 *
 * Why this shape:
 *   The client component owns React state and Canvas2D paint; everything pure
 *   lives here. The engine in `lib/evolution/` is the source of truth — this
 *   file is a thin demo-side adaptation that wraps a 28-gene Genome into a
 *   typed subject and supplies the operators the engine asks for.
 */

import {
  GENE_NAMES,
  makeTournament,
  seededRng,
  type FitnessFunction,
  type Gene,
  type GenerationSnapshot,
  type Genome,
  type SelectionOperator,
} from "lib/evolution";

/** Subject the demo evolves. `fitnessHint` is a reserved slot for a cached
 * fitness if a later iteration wants one — the engine itself is generic. */
export type EvolveSubject = { genome: Genome; fitnessHint?: number };

export const POPULATION_SIZE = 24;
export const RUN_BATCH = 50;
export const BATCH_CHUNK = 5;
export const TARGET_VALUE = 0.5;

/** Build a fresh 28-gene genome from a seeded RNG. */
export function makeGenome(rng: () => number, index: number): Genome {
  const genes: Gene<unknown>[] = GENE_NAMES.map((name) => ({
    id: name,
    kind: name,
    value: rng(),
  }));
  return {
    sequenceId: `g${index}`,
    kingdom: "unspecified",
    genes,
    generation: 0,
    parentIds: [],
    parentageChain: [],
  };
}

/** Synthetic fitness: closeness of each gene to TARGET_VALUE.
 * Returns [0..1] where 1 = every gene exactly at the target. */
export const fitness: FitnessFunction<EvolveSubject> = ({ genome }) => {
  let sq = 0;
  let count = 0;
  for (const gene of genome.genes) {
    if (typeof gene.value !== "number") continue;
    const delta = gene.value - TARGET_VALUE;
    sq += delta * delta;
    count++;
  }
  if (count === 0) return 0;
  const rms = Math.sqrt(sq / count);
  // RMS sits in [0..0.5] for genes in [0..1] vs centre 0.5.
  return Math.max(0, Math.min(1, 1 - rms * 2));
};

/** Uniform crossover: each child gene independently picks from a or b. */
export function uniformCrossover(
  a: EvolveSubject,
  b: EvolveSubject,
  rng: () => number,
): EvolveSubject {
  const aGenes = a.genome.genes;
  const bGenes = b.genome.genes;
  const childGenes: Gene<unknown>[] = aGenes.map((gA, i) => {
    const gB = bGenes[i] ?? gA;
    return rng() < 0.5 ? gA : gB;
  });
  return {
    genome: {
      sequenceId: `${a.genome.sequenceId}x${b.genome.sequenceId}`,
      kingdom: "unspecified",
      genes: childGenes,
      generation: Math.max(a.genome.generation, b.genome.generation) + 1,
      parentIds: [a.genome.sequenceId, b.genome.sequenceId],
      parentageChain: [],
    },
  };
}

/** Gaussian noise on one or two genes per individual, clipped to [0..1]. */
export function gaussianMutate(
  subject: EvolveSubject,
  rng: () => number,
): EvolveSubject {
  const genes = subject.genome.genes.slice();
  const mutateCount = rng() < 0.5 ? 1 : 2;
  const sigma = 0.08;
  for (let m = 0; m < mutateCount; m++) {
    const idx = Math.floor(rng() * genes.length);
    const gene = genes[idx];
    if (!gene || typeof gene.value !== "number") continue;
    // Box-Muller.
    const u1 = Math.max(1e-12, rng());
    const u2 = rng();
    const noise =
      Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
    const next = Math.max(0, Math.min(1, gene.value + noise));
    genes[idx] = { id: gene.id, kind: gene.kind, value: next };
  }
  return {
    genome: {
      sequenceId: `${subject.genome.sequenceId}.m`,
      kingdom: "unspecified",
      genes,
      generation: subject.genome.generation,
      parentIds: subject.genome.parentIds,
      parentageChain: subject.genome.parentageChain,
    },
  };
}

/** k=3 tournament selector, typed to the demo's subject. */
export const selectTournament: SelectionOperator<EvolveSubject> =
  makeTournament<EvolveSubject>(3);

/** Build the initial population from a single seed. */
export function buildInitial(seed: number): EvolveSubject[] {
  const rng = seededRng(seed);
  const out: EvolveSubject[] = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    out.push({ genome: makeGenome(rng, i) });
  }
  return out;
}

/** Best individual + best score for a population. */
export function findBest(pop: ReadonlyArray<EvolveSubject>): {
  best: EvolveSubject;
  score: number;
} {
  let best = pop[0] as EvolveSubject;
  let score = -Infinity;
  for (const s of pop) {
    const f = fitness(s);
    if (f > score) {
      score = f;
      best = s;
    }
  }
  return { best, score: score === -Infinity ? 0 : score };
}

/** Generation-0 snapshot for the chart. */
export function initialSnapshot(
  pop: ReadonlyArray<EvolveSubject>,
): GenerationSnapshot {
  let best = -Infinity;
  let sum = 0;
  for (const s of pop) {
    const v = fitness(s);
    if (v > best) best = v;
    sum += v;
  }
  return {
    generation: 0,
    bestFitness: best === -Infinity ? 0 : best,
    avgFitness: pop.length > 0 ? sum / pop.length : 0,
  };
}
