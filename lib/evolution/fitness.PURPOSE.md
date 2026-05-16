# `fitness.ts` — purpose twin

## What this is

How the engine decides which genomes are good. Five named scoring
axes (optical, coherence, novelty, complexity, printability), each
returning a number between 0 and 1, plus a `compose` helper that
weights them into one combined score. The default five-axis weighted
total mirrors the Hangar Python source. None of these look at a
mesh — they all read genes only — so a generation can be scored
without leaving the breeding loop.

## Role

The scoring side of the evolution loop. Defines `FitnessFunction<T>`,
the weighted-sum `compose` helper, and the five named gene-only
scoring axes ported from the Hangar Python source.

## Public surface

- `FitnessFunction<T>` — `(subject: T) => number` in [0..1].
- `WeightedFitness<T>` — `{ fn, weight }` for `compose`.
- `compose(entries)` — weight-normalised sum into one
  `FitnessFunction<T>`.
- `AXIS_WEIGHTS` — the five-axis weights matching `fitness.py`.
- `scoreOptical(genome)` — IOR / transmission / grating / tube.
- `scoreCoherence(genome)` — pairwise gene consistency + kingdom
  rules.
- `scoreNovelty(genome, population)` — Euclidean distance from pop
  mean.
- `scoreComplexity(genome)` — gene-vector standard deviation.
- `scorePrintability(genome)` — gene-only stub; see "Does not".
- `defaultFitness(population)` — five-axis weighted total, returns
  `FitnessFunction<Genome>`.

## Internal

- `numGene(genome, name, fallback)` — typed read with fallback for
  missing or non-numeric genes. Not exported.

## Depends on

- `./genome` — for the `Genome` and `GeneName` types and the
  `denormalise` / `getGene` helpers.
- Nothing else. No `three`, no mesh library, no state slices.

## Does not

- **Does not import `trimesh` / `three`.** The Python source's
  mesh-aware `score_printability` and `score_complexity` branches
  are stubbed (printability falls back to a coherence proxy +
  constant; complexity uses gene-vector SD). A mesh-aware sibling
  module belongs at `lib/evolution/fitness/printability.ts` once the
  engine starts consuming geometry.
- **Does not honour `human_score`.** The Python source overrides
  axes with a human rating; in the typed engine that override lives
  one layer up — the caller composes a custom fitness function that
  reads from a `human-ratings` slice. The library here is headless.
- **Does not return [0..5].** Every axis normalises to [0..1] so
  `compose` is a clean weighted average; callers that want the
  Python's 0-5 dial multiply at the boundary.
- **Does not memoise.** Pure functions over read-only data; the
  engine does the population work once per generation.

## Bordering files

- `genome.ts` — supplies the data shape these functions score.
- `engine.ts` — calls `defaultFitness(population)` (or a caller-
  supplied function) once per generation.
- `selection.ts` — consumes a `FitnessFunction<T>` and picks parents.
- Ported from `D:\The_Hangar\python-services\fitness.py` — verbatim
  for the gene branches, stubbed with TODO for the mesh branches.
