# `genome.ts` — purpose twin

## Role

Defines the typed genome model that the evolution engine operates
over. Carries the 28-gene alphabet from the Hangar Python source as
a typed constant, plus pure helpers for cloning, mutation, and
crossover. The data side of the evolution loop.

## Public surface

- `Gene<T>` — typed gene with `id`, `kind`, `value`. Read-only.
- `Genome` — ordered list of `Gene<unknown>` with `sequenceId`,
  `kingdom`, `generation`, `parentIds`, `parentageChain`, optional
  `score`. Read-only.
- `GENE_NAMES` — 28-entry `as const` tuple (form / material / optics /
  waveguide).
- `GeneName` — literal-union derived from `GENE_NAMES`.
- `GENE_RANGES` — per-name `[lo, hi]` denormalisation ranges.
- `getGene(genome, id)` — single lookup.
- `denormalise(name, normalised)` — map [0..1] to physical range.
- `cloneGenome(genome)` — shallow clone (genes array copied).
- `mutateGenome(genome, rate, rng)` — Gaussian mutation, sigma 0.1,
  with a 5% per-gene wildcard re-roll.
- `crossover(a, b, rng)` — uniform crossover on numeric genes,
  parent-pick on non-numeric.

## Internal

- `gauss(rng, sigma)` — Box-Muller transform. Not exported; helper
  for `mutateGenome`.

## Depends on

- `lib/assets/genomes.ts` — re-uses the `SculptureKingdom` literal-
  union so the engine's `Genome` shares a vocabulary with the
  catalogue. No runtime data import.

## Does not

- **Does not own state.** Pure functions only. The RNG is injected
  by the caller; module-scope state would break the seeded engine
  contract.
- **Does not bind to `SculptureGenome` from `lib/assets/genomes.ts`.**
  The catalogue's `geneVector` carries a different schema (mm-units,
  string traits) and a different gene set per kingdom; the engine's
  `Genome` is the normalised [0..1] vector the breeder needs. A
  future `lib/evolution/adapters/` can map between them.
- **Does not enforce the 28-gene alphabet.** `Genome.genes` is
  generic; `GENE_NAMES` is a vocabulary callers may use, not a
  schema the type enforces. The engine in `engine.ts` operates on
  any typed subject.
- **Does not carry trait / form / scale_mod / spiral_mod.** Those
  Phase-3 side channels from the Python source belong on the
  application-level `SculptureGenome`, not on the engine's `Genome`.
- **Does not validate.** No `validate()` method; if a caller hands a
  malformed genome to the engine, the engine fails fast at the
  operator boundary.

## Bordering files

- `fitness.ts` — scoring lives there; reads `genome.score` but does
  not assign it (the engine does).
- `selection.ts` — operates on populations of `Genome`.
- `engine.ts` — composes mutate / crossover / fitness / select into a
  generational loop.
- `lib/assets/genomes.ts` — the catalogue's `SculptureGenome` is the
  *application-level* shape; the engine's `Genome` here is the
  *runtime* shape.
- Ported from `D:\The_Hangar\python-services\genome\{constants,
  models, operators}.py`.
