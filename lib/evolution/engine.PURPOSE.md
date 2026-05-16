# `engine.ts` — purpose twin

## What this is

The breeding loop, plain and simple. Hand it a starting population,
two operators (mutate and crossover), a fitness function, and a
selector for parents — it runs N generations and gives you back the
best subject plus the full final population and a per-generation
history. Generic over its subject type: a `Genome` is the studio's
primary use, but anything typed works (parameter vectors, numbers,
test-only shapes). One seed in, one walk out — the same seed
replays the same evolution.

## Role

The generational walk. Composes mutate / crossover / fitness /
select into one synchronous, reproducible loop. Generic over the
subject type — `Genome` is the studio's primary use, but the engine
runs on anything typed.

## Public surface

- `EvolveOptions<T>` — every callback and knob the engine needs.
- `EvolutionResult<T>` — `{ best, bestFitness, finalPopulation,
  history }`.
- `GenerationSnapshot` — one per generation: `{ generation,
  bestFitness, avgFitness }`.
- `evolve<T>(options)` — the entry point.
- `seededRng` — re-exported from `lib/algorithms/_base.ts` so
  callers building wildcard factories or custom operators share the
  same seeded source.

## Internal

- `clampElites(requested, populationSize)` — defaults to ~10% of the
  population, clamped to [0, populationSize - 1].
- `snapshot(generation, population, fitness)` — scores once and
  returns the per-generation summary.

## Depends on

- `lib/algorithms/_base.ts` — for `seededRng`.
- `./fitness` — for the `FitnessFunction<T>` type only.
- `./selection` — for the `SelectionOperator<T>` type only.

## Does not

- **Does not import `./genome`.** The engine is generic. The studio
  binds it to `Genome` at the call site; a test or a tooling script
  can bind it to any typed subject (numbers, parameter vectors,
  whatever).
- **Does not run asynchronously.** Synchronous so the studio's
  evolution UI can step generations under direct control and so the
  whole run is reproducible from one seed. A worker wrapper at
  `lib/evolution/worker/` can offload it later without changing the
  surface.
- **Does not persist anything.** History stays in memory and ships
  in the result; archival is a downstream concern (the S15 archive
  station).
- **Does not call back per subject.** Generation-level callbacks
  only; a per-subject hook would couple the engine to UI cadence.
  Callers that need fine-grain progress run shorter `generations`
  in a loop.
- **Does not enforce population schema.** Fitness, mutate, and
  crossover all see the same `T`; the engine never inspects fields.
  Type safety lives at the call site.

## Bordering files

- `genome.ts` — the studio's typed subject + its mutate/crossover.
- `fitness.ts` — the scoring contract.
- `selection.ts` — the parent-pick contract.
- `index.ts` — re-exports the public surface from all four engine
  files plus the existing `stations.ts` catalogue.
- Ported from `evolve_population` in
  `D:\The_Hangar\python-services\genome\operators.py`. The
  elite-bred-wildcard split is preserved; the Python `temperature`
  and `llm_bias` knobs are absent here — temperature lives in the
  caller's `mutate`, bias lives in the caller's `crossover`.
