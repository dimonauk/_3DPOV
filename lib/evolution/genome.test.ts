/**
 * lib/evolution/genome.test.ts — Smoke tests for the typed genome model.
 *
 * Covers the contract a chamber UI relies on:
 *   - mutate(g, rate, rng) produces a different genome (when rate > 0)
 *     and never throws.
 *   - crossover(a, a, rng) returns a genome whose numeric gene values
 *     equal a's — blending any value with itself is a no-op, regardless
 *     of the alpha.
 *   - The 28-gene Hangar core + 8 canon-extension entries are all
 *     reachable through GENE_NAMES and have ranges in GENE_RANGES.
 *   - One smoke test of the engine to make sure mutate + crossover +
 *     fitness + selection compose without throwing.
 *
 * All tests run in the node env (no DOM needed).
 */

import { describe, expect, it } from "vitest";

import {
  GENE_NAMES,
  GENE_RANGES,
  cloneGenome,
  crossover,
  defaultFitness,
  denormalise,
  evolve,
  makeTournament,
  mutateGenome,
  seededRng,
  type Gene,
  type Genome,
} from "./index";

function makeNumericGenome(seqId: string, fill: number): Genome {
  const genes: Gene<unknown>[] = GENE_NAMES.map((name) => ({
    id: name,
    kind: "form",
    value: fill,
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

describe("mutateGenome", () => {
  it("produces a genome that differs from the parent at rate=1", () => {
    const rng = seededRng(42);
    const parent = makeNumericGenome("p0", 0.5);
    const child = mutateGenome(parent, 1.0, rng);

    const parentValues = parent.genes.map((g) => g.value);
    const childValues = child.genes.map((g) => g.value);
    // At rate=1 every numeric gene mutates; at least one value must
    // have moved off 0.5.
    const anyChanged = childValues.some((v, i) => v !== parentValues[i]);
    expect(anyChanged).toBe(true);
  });

  it("records the parent in parentIds and bumps the sequence id", () => {
    const rng = seededRng(7);
    const parent = makeNumericGenome("alpha", 0.2);
    const child = mutateGenome(parent, 0.5, rng);
    expect(child.parentIds).toContain("alpha");
    expect(child.sequenceId).not.toBe("alpha");
  });

  it("clips numeric gene values into [0..1]", () => {
    const rng = seededRng(123);
    // Start at the boundary so Gaussian noise tries to push out.
    const parent = makeNumericGenome("edge", 0.99);
    const child = mutateGenome(parent, 1.0, rng);
    for (const gene of child.genes) {
      if (typeof gene.value === "number") {
        expect(gene.value).toBeGreaterThanOrEqual(0);
        expect(gene.value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never throws on rate=0 (no-op mutation)", () => {
    const rng = seededRng(0);
    const parent = makeNumericGenome("p0", 0.5);
    expect(() => mutateGenome(parent, 0, rng)).not.toThrow();
  });
});

describe("crossover", () => {
  it("breed of A + A equals A on every numeric gene value", () => {
    // Blending x with x at any alpha returns x. This is the cheapest
    // sanity check on the crossover operator.
    const rng = seededRng(99);
    const a = makeNumericGenome("a0", 0.42);
    const child = crossover(a, a, rng);
    expect(child.genes.length).toBe(a.genes.length);
    for (let i = 0; i < a.genes.length; i++) {
      const aGene = a.genes[i]!;
      const childGene = child.genes[i]!;
      expect(childGene.id).toBe(aGene.id);
      // Numeric blend of v*(1-α) + v*α = v exactly.
      expect(childGene.value).toBe(aGene.value);
    }
  });

  it("records both parent ids and bumps generation", () => {
    const rng = seededRng(1);
    const a = makeNumericGenome("a0", 0.3);
    const b = makeNumericGenome("b0", 0.7);
    const child = crossover(a, b, rng);
    expect(child.parentIds).toEqual(["a0", "b0"]);
    expect(child.generation).toBe(Math.max(a.generation, b.generation) + 1);
  });

  it("numeric blend of A and B lands between the two values", () => {
    const rng = seededRng(11);
    const a = makeNumericGenome("a0", 0.2);
    const b = makeNumericGenome("b0", 0.8);
    const child = crossover(a, b, rng);
    for (const gene of child.genes) {
      if (typeof gene.value === "number") {
        expect(gene.value).toBeGreaterThanOrEqual(0.2);
        expect(gene.value).toBeLessThanOrEqual(0.8);
      }
    }
  });
});

describe("cloneGenome", () => {
  it("returns a structurally equal but distinct array reference", () => {
    const g = makeNumericGenome("a0", 0.5);
    const c = cloneGenome(g);
    expect(c).not.toBe(g);
    expect(c.genes).not.toBe(g.genes);
    expect(c.genes.length).toBe(g.genes.length);
    expect(c.sequenceId).toBe(g.sequenceId);
  });
});

describe("GENE_NAMES / GENE_RANGES coverage", () => {
  it("every gene name has a matching range", () => {
    for (const name of GENE_NAMES) {
      const range = GENE_RANGES[name];
      expect(range).toBeDefined();
      expect(range[0]).toBeLessThanOrEqual(range[1]);
    }
  });

  it("includes the Blender-canon extension fields", () => {
    // Spot-check the canon-extension fields documented in the
    // sculpture-genome-evolution skill.
    expect(GENE_NAMES).toContain("angle_spread");
    expect(GENE_NAMES).toContain("length_decay");
    expect(GENE_NAMES).toContain("branch_n");
    expect(GENE_NAMES).toContain("gem_count");
    expect(GENE_NAMES).toContain("gem_radius");
    expect(GENE_NAMES).toContain("gem_hue");
    expect(GENE_NAMES).toContain("hue_drift");
    expect(GENE_NAMES).toContain("bevel_depth");
  });

  it("denormalise clamps inputs and maps to the configured range", () => {
    const [lo, hi] = GENE_RANGES.scale;
    expect(denormalise("scale", 0)).toBe(lo);
    expect(denormalise("scale", 1)).toBe(hi);
    expect(denormalise("scale", -2)).toBe(lo);
    expect(denormalise("scale", 5)).toBe(hi);
  });
});

describe("engine smoke", () => {
  it("evolves a small population without throwing", () => {
    const initial = [
      makeNumericGenome("seed-a", 0.3),
      makeNumericGenome("seed-b", 0.5),
      makeNumericGenome("seed-c", 0.7),
      makeNumericGenome("seed-d", 0.4),
      makeNumericGenome("seed-e", 0.6),
      makeNumericGenome("seed-f", 0.5),
    ];
    const result = evolve<Genome>({
      initial,
      crossover,
      mutate: (g, rng) => mutateGenome(g, 0.3, rng),
      fitness: defaultFitness(initial),
      select: makeTournament<Genome>(3),
      generations: 3,
      populationSize: 6,
      seed: 1234,
    });
    expect(result.finalPopulation.length).toBe(6);
    expect(result.history.length).toBe(4); // gen 0 + 3 generations
    expect(result.bestFitness).toBeGreaterThanOrEqual(0);
    expect(result.bestFitness).toBeLessThanOrEqual(1);
  });

  it("is deterministic given a fixed seed", () => {
    const initial = [
      makeNumericGenome("a", 0.5),
      makeNumericGenome("b", 0.6),
      makeNumericGenome("c", 0.4),
      makeNumericGenome("d", 0.5),
    ];
    const opts = {
      initial,
      crossover,
      mutate: (g: Genome, rng: () => number) => mutateGenome(g, 0.3, rng),
      fitness: defaultFitness(initial),
      select: makeTournament<Genome>(3),
      generations: 2,
      populationSize: 4,
      seed: 7,
    };
    const a = evolve<Genome>(opts);
    const b = evolve<Genome>(opts);
    expect(a.bestFitness).toBe(b.bestFitness);
    expect(a.history.map((h) => h.bestFitness)).toEqual(
      b.history.map((h) => h.bestFitness),
    );
  });
});
