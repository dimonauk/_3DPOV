/**
 * lib/evolution/sample-population.ts — Deterministic pedigree generator
 * for the evolution-hub demo. Builds a 4-5 generation lineage of 30-40
 * genomes from a single seed so the fan chart has something real to
 * walk. Pure function; uses `seededRng` from the algorithms base.
 */

import { seededRng } from "../algorithms/_base";
import type { SculptureKingdom } from "../assets/genomes";
import {
  GENE_NAMES,
  type Gene,
  type Genome,
} from "./genome";

const KINGDOMS: ReadonlyArray<SculptureKingdom> = [
  "techno",
  "artistic",
  "choreographic",
  "biomech",
  "thermal",
  "protean",
  "assemblage",
  "curvilinear",
];

type GenerationPlan = { count: number };

const DEFAULT_PLAN: ReadonlyArray<GenerationPlan> = [
  { count: 8 },
  { count: 10 },
  { count: 8 },
  { count: 6 },
  { count: 4 },
];

function pickKingdom(rng: () => number): SculptureKingdom {
  const idx = Math.floor(rng() * KINGDOMS.length) % KINGDOMS.length;
  const k = KINGDOMS[idx];
  if (!k) return "biomech";
  return k;
}

function randomGenes(rng: () => number): Gene<unknown>[] {
  return GENE_NAMES.map((name) => ({
    id: name,
    kind: "form",
    value: rng(),
  }));
}

function blendGenes(
  a: ReadonlyArray<Gene<unknown>>,
  b: ReadonlyArray<Gene<unknown>>,
  rng: () => number,
): Gene<unknown>[] {
  const bByName = new Map(b.map((g) => [g.id, g] as const));
  return a.map((geneA) => {
    const geneB = bByName.get(geneA.id);
    if (!geneB) return geneA;
    if (
      typeof geneA.value === "number" &&
      typeof geneB.value === "number"
    ) {
      const alpha = rng();
      const drift = (rng() - 0.5) * 0.08;
      const blended = geneA.value * (1 - alpha) + geneB.value * alpha;
      return {
        id: geneA.id,
        kind: geneA.kind,
        value: Math.max(0, Math.min(1, blended + drift)),
      };
    }
    return rng() < 0.5 ? geneA : geneB;
  });
}

/** Build a deterministic 30-40 genome pedigree across five generations.
 * Generation 0 is founder stock; each later generation breeds children
 * by picking two parents from the previous generation. Returns the flat
 * list in birth order. */
export function sampleEvolutionPopulation(seed: number): Genome[] {
  const rng = seededRng(seed);
  const byGeneration: Genome[][] = [];
  const all: Genome[] = [];

  for (let gen = 0; gen < DEFAULT_PLAN.length; gen++) {
    const plan = DEFAULT_PLAN[gen];
    if (!plan) continue;
    const layer: Genome[] = [];
    for (let i = 0; i < plan.count; i++) {
      if (gen === 0) {
        const kingdom = pickKingdom(rng);
        const sequenceId = `g0-${kingdom.slice(0, 3)}-${i.toString(36)}`;
        layer.push({
          sequenceId,
          kingdom,
          genes: randomGenes(rng),
          generation: 0,
          parentIds: [],
          parentageChain: [],
        });
      } else {
        const prev = byGeneration[gen - 1];
        if (!prev || prev.length === 0) continue;
        const aIdx = Math.floor(rng() * prev.length) % prev.length;
        let bIdx = Math.floor(rng() * prev.length) % prev.length;
        if (prev.length > 1 && bIdx === aIdx) {
          bIdx = (bIdx + 1) % prev.length;
        }
        const parentA = prev[aIdx];
        const parentB = prev[bIdx];
        if (!parentA || !parentB) continue;
        const kingdom =
          rng() < 0.78
            ? rng() < 0.5
              ? parentA.kingdom
              : parentB.kingdom
            : pickKingdom(rng);
        const sequenceId = `g${gen}-${i.toString(36)}-${parentA.sequenceId.slice(0, 6)}`;
        layer.push({
          sequenceId,
          kingdom,
          genes: blendGenes(parentA.genes, parentB.genes, rng),
          generation: gen,
          parentIds: [parentA.sequenceId, parentB.sequenceId],
          parentageChain: [
            ...parentA.parentageChain.slice(-2),
            parentA.sequenceId,
          ],
          score: rng() * 0.6 + 0.3,
        });
      }
    }
    byGeneration.push(layer);
    all.push(...layer);
  }
  return all;
}

/** Index a population by sequenceId. Helper for fan-chart lookups. */
export function indexBySequenceId(
  population: ReadonlyArray<Genome>,
): Map<string, Genome> {
  const map = new Map<string, Genome>();
  for (const g of population) map.set(g.sequenceId, g);
  return map;
}

/** Pick the highest-generation, highest-score genome to use as the
 * default ego. Stable given a deterministic population. */
export function pickEgo(population: ReadonlyArray<Genome>): Genome {
  let best: Genome | undefined;
  for (const g of population) {
    if (!best) {
      best = g;
      continue;
    }
    if (g.generation > best.generation) {
      best = g;
    } else if (g.generation === best.generation) {
      const a = g.score ?? 0;
      const b = best.score ?? 0;
      if (a > b) best = g;
    }
  }
  if (!best) throw new Error("sampleEvolutionPopulation returned empty list");
  return best;
}
