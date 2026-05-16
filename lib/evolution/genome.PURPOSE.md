# `genome.ts` — purpose twin

## What this is

The DNA model the breeding engine works on. A `Genome` is a small
record of named genes (numbers between 0 and 1) plus its family
tree — who its parents were, which generation it belongs to, what
sculpture kingdom it claims. The two pure operators in this file —
`mutateGenome` (jitter every gene a little) and `crossover` (blend
two parents into a child) — are the only ways the engine ever
makes a new genome. Everything stays serialisable so a population
can be stored, walked, replayed, and shown on a card without
needing the renderer.

## Role

Defines the typed genome model that the evolution engine operates
over. Carries the 28-gene alphabet from the Hangar Python source as
a typed constant, plus a small canon extension that adds the
Blender-pipeline fields (angle_spread, length_decay, branch_n,
bevel_depth, gem_count, gem_radius, gem_hue, hue_drift) so a
`Genome` can round-trip the lineage documented in the
`sculpture-genome-evolution` skill. Pure helpers for cloning,
mutation, and crossover live here too. The data side of the
evolution loop.

## Public surface

- `Gene<T>` — typed gene with `id`, `kind`, `value`. Read-only.
- `Genome` — ordered list of `Gene<unknown>` with `sequenceId`,
  `kingdom`, `generation`, `parentIds`, `parentageChain`, optional
  `score`. Read-only.
- `GENE_NAMES` — 28-entry Hangar core (form / material / optics /
  waveguide) plus 8 canon-extension entries
  (`angle_spread`, `length_decay`, `branch_n`, `bevel_depth`,
  `gem_count`, `gem_radius`, `gem_hue`, `hue_drift`). Exported as a
  single `as const` tuple.
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
