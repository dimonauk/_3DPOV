/**
 * lib/evolution/genome.ts — Typed genome model for the evolution engine.
 *
 * # Purpose
 * Defines the data side of the sculpture-evolution loop. A `Genome` is
 * an ordered record of typed `Gene` values with provenance (sequence
 * id, kingdom tag, parents, generation). Without this module the
 * fitness, selection, and engine files have nothing to operate on.
 *
 * # Why this shape
 * The Python source (`python-services/genome/`) carries a 28-gene
 * alphabet over the kingdoms in `lib/assets/genomes.ts`. We encode the
 * alphabet here as a typed constant so callers can introspect it, but
 * `Gene<T>` itself stays generic — the engine in `engine.ts` operates
 * on any typed subject, not just sculpture genomes. Pure functions
 * over plain data; no classes, no module-scope mutable state.
 *
 * Ported from D:\The_Hangar\python-services\genome\{constants,models,
 * operators}.py — the Python `Genome` dataclass becomes a TypeScript
 * record, and the `random_genome` / `crossover` / `mutate` helpers
 * become pure functions taking an injected RNG.
 */

import type { SculptureKingdom } from "../assets/genomes";

/** A single typed gene. `kind` is a free string so callers can carry
 * their own taxonomy; the sculpture alphabet uses `GENE_NAMES`. */
export type Gene<T> = {
  readonly id: string;
  readonly kind: string;
  readonly value: T;
};

/** Ordered list of unknown-typed genes with provenance. The order of
 * `genes` is the genome's structural identity — callers must not
 * reorder. */
export type Genome = {
  readonly sequenceId: string;
  readonly kingdom: SculptureKingdom | "unspecified";
  readonly genes: ReadonlyArray<Gene<unknown>>;
  readonly generation: number;
  readonly parentIds: ReadonlyArray<string>;
  readonly parentageChain: ReadonlyArray<string>;
  readonly score?: number;
};

/** The 28-gene alphabet from the Python source. Re-exported so callers
 * (the fitness functions, the studio UIs) can look up gene kinds by
 * symbolic name rather than position. */
export const GENE_NAMES = [
  // Form (12)
  "scale",
  "aspect_ratio",
  "twist",
  "taper",
  "cell_density",
  "wall_thickness",
  "symmetry",
  "noise_amplitude",
  "noise_frequency",
  "verticals",
  "branching",
  "closure",
  // Material (8)
  "ior",
  "transmission",
  "roughness",
  "subsurface",
  "emission",
  "tint_r",
  "tint_g",
  "tint_b",
  // Optics (4)
  "grating_pitch",
  "grating_depth",
  "channel_ratio",
  "escape_density",
  // Waveguide (4)
  "tube_radius",
  "tube_smoothness",
  "network_density",
  "murray_exponent",
  // Canon extension — the Blender-pipeline `SculptureGenome` fields
  // documented in the skill `sculpture-genome-evolution`. Kept at the
  // end of the alphabet so the 28-gene Hangar core above stays the
  // canonical anchor; these are added so a `Genome` can round-trip
  // the Blender lineage without dropping fields. All normalised to
  // [0..1] like every other numeric gene.
  "angle_spread", // branch cone half-angle
  "length_decay", // child / parent length ratio
  "branch_n", // children per Murray node
  "bevel_depth", // tube bevel depth
  "gem_count", // gem distribution count
  "gem_radius", // gem sphere radius
  "gem_hue", // gem HSV hue
  "hue_drift", // accumulated lineage hue drift
] as const;

export type GeneName = (typeof GENE_NAMES)[number];

/** Denormalisation ranges paired with `GENE_NAMES`. Values in
 * `Gene<number>.value` are normalised to [0..1]; callers that need a
 * physical magnitude denormalise through this table. */
export const GENE_RANGES: Readonly<Record<GeneName, readonly [number, number]>> = {
  scale: [30.0, 120.0],
  aspect_ratio: [0.3, 3.0],
  twist: [0.0, 720.0],
  taper: [0.1, 1.0],
  cell_density: [0.1, 0.9],
  wall_thickness: [0.1, 2.0],
  symmetry: [1.0, 8.0],
  noise_amplitude: [0.0, 5.0],
  noise_frequency: [1.0, 20.0],
  verticals: [1.0, 12.0],
  branching: [0.0, 1.0],
  closure: [0.0, 1.0],
  ior: [1.45, 1.65],
  transmission: [0.0, 1.0],
  roughness: [0.001, 0.5],
  subsurface: [0.0, 0.5],
  emission: [0.0, 2.0],
  tint_r: [0.0, 1.0],
  tint_g: [0.0, 1.0],
  tint_b: [0.0, 1.0],
  grating_pitch: [38.0, 500.0],
  grating_depth: [5.0, 50.0],
  channel_ratio: [0.2, 0.8],
  escape_density: [0.05, 0.5],
  tube_radius: [0.5, 3.0],
  tube_smoothness: [0.0, 1.0],
  network_density: [3.0, 20.0],
  murray_exponent: [0.25, 0.45],
  // Canon-extension ranges (Blender-pipeline genome). Physical units
  // mirror the dataclass defaults in the skill canon — angle_spread in
  // radians, length_decay unitless, branch_n integer-rounded by the
  // caller, gem_* matching the Blender script defaults.
  angle_spread: [0.05, 1.2],
  length_decay: [0.3, 0.9],
  branch_n: [1.0, 5.0],
  bevel_depth: [0.0, 0.05],
  gem_count: [0.0, 60.0],
  gem_radius: [0.005, 0.05],
  gem_hue: [0.0, 1.0],
  hue_drift: [0.0, 1.0],
} as const;

/** Look up a numeric gene by symbolic name. Returns `undefined` when
 * the genome carries no gene with that id. */
export function getGene(genome: Genome, id: string): Gene<unknown> | undefined {
  return genome.genes.find((g) => g.id === id);
}

/** Denormalise a [0..1] gene value to its physical range. Mirrors
 * `Genome.denorm` in the Python source. */
export function denormalise(name: GeneName, normalised: number): number {
  const range = GENE_RANGES[name];
  const lo = range[0];
  const hi = range[1];
  const clamped = Math.max(0, Math.min(1, normalised));
  return lo + clamped * (hi - lo);
}

/** Shallow clone of a genome. The `genes` array is copied; individual
 * `Gene<unknown>` records are reused (they are read-only). */
export function cloneGenome(genome: Genome): Genome {
  return {
    sequenceId: genome.sequenceId,
    kingdom: genome.kingdom,
    genes: genome.genes.slice(),
    generation: genome.generation,
    parentIds: genome.parentIds.slice(),
    parentageChain: genome.parentageChain.slice(),
    score: genome.score,
  };
}

/** Gaussian sample using the Box-Muller transform driven by a uniform
 * RNG. Pure; no module-scope state. */
function gauss(rng: () => number, sigma: number): number {
  const u1 = Math.max(1e-12, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
}

/** Mutate a genome at `rate` per gene. Numeric genes get Gaussian
 * noise (sigma = 0.1) clipped to [0..1]; non-numeric genes occasionally
 * re-roll via `rng()` (wildcard). Returns a new genome with the parent
 * id appended to `parentIds`.
 *
 * Mirrors `operators.mutate` in the Python source, without the trait/
 * form/scale_mod side channels — those live on `SculptureGenome` in
 * `lib/assets/genomes.ts`, not on the engine-level `Genome`. */
export function mutateGenome(
  genome: Genome,
  rate: number,
  rng: () => number,
): Genome {
  const sigma = 0.1;
  const wildcardChance = 0.05;
  const mutated: Gene<unknown>[] = genome.genes.map((gene) => {
    if (rng() >= rate) return gene;
    if (typeof gene.value === "number") {
      if (rng() < wildcardChance) {
        return { id: gene.id, kind: gene.kind, value: rng() };
      }
      const next = Math.max(0, Math.min(1, gene.value + gauss(rng, sigma)));
      return { id: gene.id, kind: gene.kind, value: next };
    }
    return gene;
  });
  return {
    sequenceId: `${genome.sequenceId}.m`,
    kingdom: genome.kingdom,
    genes: mutated,
    generation: genome.generation,
    parentIds: [...genome.parentIds, genome.sequenceId],
    parentageChain: [...genome.parentageChain, genome.sequenceId],
  };
}

/** Uniform crossover. Numeric genes are linearly blended on a per-gene
 * alpha drawn from `rng`; non-numeric genes pick one parent's value.
 * The shape of `a.genes` defines the child shape — `b.genes` is
 * indexed by `id`, missing ids fall through to `a`. */
export function crossover(a: Genome, b: Genome, rng: () => number): Genome {
  const bByName = new Map(b.genes.map((g) => [g.id, g] as const));
  const childGenes: Gene<unknown>[] = a.genes.map((geneA) => {
    const geneB = bByName.get(geneA.id);
    if (!geneB) return geneA;
    const alpha = rng();
    if (typeof geneA.value === "number" && typeof geneB.value === "number") {
      return {
        id: geneA.id,
        kind: geneA.kind,
        value: geneA.value * (1 - alpha) + geneB.value * alpha,
      };
    }
    return alpha < 0.5 ? geneA : geneB;
  });
  const kingdom = rng() < 0.5 ? a.kingdom : b.kingdom;
  return {
    sequenceId: `${a.sequenceId}x${b.sequenceId}`,
    kingdom,
    genes: childGenes,
    generation: Math.max(a.generation, b.generation) + 1,
    parentIds: [a.sequenceId, b.sequenceId],
    parentageChain: [...a.parentageChain.slice(-1), a.sequenceId],
  };
}
