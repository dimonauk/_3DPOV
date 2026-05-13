/**
 * lib/evolution/index.ts — Public surface of the evolution library.
 *
 * # Purpose
 * One import path for everything the studio needs to drive an
 * evolution run: the typed `Genome` model, the named fitness axes,
 * the selection operators, the generic engine, and the existing
 * 14-station catalogue. Without this file, every caller would have
 * to know which sub-module exports which symbol.
 *
 * # Why this shape
 * Re-exports only — no logic, no defaults assembled here. The
 * library files (`genome.ts`, `fitness.ts`, `selection.ts`,
 * `engine.ts`, `stations.ts`) are the source of truth for their
 * surfaces; this file is purely a discovery convenience.
 */

// Typed genome model + operators on it.
export type {
  Gene,
  Genome,
  GeneName,
} from "./genome";
export {
  GENE_NAMES,
  GENE_RANGES,
  cloneGenome,
  crossover,
  denormalise,
  getGene,
  mutateGenome,
} from "./genome";

// Fitness scoring.
export type {
  FitnessFunction,
  WeightedFitness,
} from "./fitness";
export {
  AXIS_WEIGHTS,
  compose,
  defaultFitness,
  scoreCoherence,
  scoreComplexity,
  scoreNovelty,
  scoreOptical,
  scorePrintability,
} from "./fitness";

// Selection operators.
export type { SelectionOperator } from "./selection";
export {
  makeTournament,
  roulette,
  topK,
  tournament,
} from "./selection";

// The generic engine.
export type {
  EvolutionResult,
  EvolveOptions,
  GenerationSnapshot,
} from "./engine";
export { evolve, seededRng } from "./engine";

// The already-shipped 14-station catalogue.
export type {
  EvolutionStation,
  EvolutionStationKind,
} from "./stations";
export {
  evolutionStations,
  getStation,
  stationKindColours,
} from "./stations";
