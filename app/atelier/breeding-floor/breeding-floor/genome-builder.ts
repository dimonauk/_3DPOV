/**
 * app/atelier/breeding-floor/breeding-floor/genome-builder.ts —
 * Pure helpers for seeding the initial population and reading
 * tint genes off a genome for the placeholder thumbnail.
 *
 * Extracted from breeding-floor-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import {
  GENE_NAMES,
  type Gene,
  type Genome,
  seededRng,
} from "lib/evolution";

import { POPULATION_SIZE, type ChamberGenome } from "./types";

export function buildSeedGenome(seqId: string, rng: () => number): Genome {
  const genes: Gene<unknown>[] = GENE_NAMES.map((name) => ({
    id: name,
    kind: "form",
    value: rng(),
  }));
  return {
    sequenceId: seqId,
    kingdom: "biomech",
    genes,
    generation: 0,
    parentIds: [],
    parentageChain: [],
  };
}

export function withUid(g: Genome): ChamberGenome {
  return {
    ...g,
    uid:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${g.sequenceId}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function buildInitialPopulation(seed: number): ChamberGenome[] {
  const rng = seededRng(seed);
  const out: ChamberGenome[] = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    const g = buildSeedGenome(`gen0-${i}`, rng);
    out.push(withUid(g));
  }
  return out;
}

function geneValue(g: Genome, name: string, fallback: number): number {
  const found = g.genes.find((x) => x.id === name);
  if (!found) return fallback;
  return typeof found.value === "number" ? found.value : fallback;
}

export function genomeToColour(g: Genome): string {
  // Pull the tint genes directly; they're already [0..1]. We HSV-drift
  // by the genome's hue_drift so two genomes with identical tint genes
  // still diverge as the lineage walks.
  const r = Math.round(geneValue(g, "tint_r", 0.5) * 255);
  const gg = Math.round(geneValue(g, "tint_g", 0.5) * 255);
  const b = Math.round(geneValue(g, "tint_b", 0.5) * 255);
  return `rgb(${r}, ${gg}, ${b})`;
}
