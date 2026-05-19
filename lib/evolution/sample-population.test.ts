/**
 * lib/evolution/sample-population.test.ts — Pedigree integrity tests.
 *
 * Asserts the demo seed pool is large enough, every parent reference
 * resolves inside the returned list, generation numbers grow downwards
 * along parent edges, and the seed produces stable output.
 */

import { describe, expect, it } from "vitest";

import {
  indexBySequenceId,
  pickEgo,
  sampleEvolutionPopulation,
} from "./sample-population";

describe("sampleEvolutionPopulation", () => {
  it("returns at least 30 genomes for a given seed", () => {
    const pop = sampleEvolutionPopulation(2026);
    expect(pop.length).toBeGreaterThanOrEqual(30);
    expect(pop.length).toBeLessThanOrEqual(40);
  });

  it("every parentId references a sequenceId in the result", () => {
    const pop = sampleEvolutionPopulation(2026);
    const ids = new Set(pop.map((g) => g.sequenceId));
    for (const g of pop) {
      for (const pid of g.parentIds) {
        expect(ids.has(pid)).toBe(true);
      }
    }
  });

  it("parent generations are strictly less than child generations", () => {
    const pop = sampleEvolutionPopulation(2026);
    const byId = indexBySequenceId(pop);
    for (const g of pop) {
      for (const pid of g.parentIds) {
        const parent = byId.get(pid);
        expect(parent).toBeDefined();
        if (!parent) continue;
        expect(parent.generation).toBeLessThan(g.generation);
      }
    }
  });

  it("same seed produces the same population (deterministic)", () => {
    const a = sampleEvolutionPopulation(123);
    const b = sampleEvolutionPopulation(123);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      const ai = a[i];
      const bi = b[i];
      expect(ai?.sequenceId).toBe(bi?.sequenceId);
      expect(ai?.kingdom).toBe(bi?.kingdom);
      expect(ai?.generation).toBe(bi?.generation);
    }
  });

  it("pickEgo returns a high-generation genome", () => {
    const pop = sampleEvolutionPopulation(2026);
    const ego = pickEgo(pop);
    const maxGen = pop.reduce((m, g) => Math.max(m, g.generation), 0);
    expect(ego.generation).toBe(maxGen);
  });
});
