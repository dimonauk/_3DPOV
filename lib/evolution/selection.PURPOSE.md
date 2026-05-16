# `selection.ts` — purpose twin

## What this is

Three named ways to pick parents from a population of N candidates:
**tournament** (best-of-k random draws — the default), **topK**
(elitist sort + slice — used for keeping the strongest survivors),
and **roulette** (fitness-proportionate). All pure, all RNG-injected
by the engine, all returning a fresh array. The engine never asks
"which parent should breed next?" — it asks the selector.

## Role

Selection operators for the evolution engine. Pure, RNG-injected,
typed. Picks parents (and survivors) from a population for the next
generation.

## Public surface

- `tournament(population, count, fitness, rng, k=3)` — best-of-k
  selection, draws `count` parents.
- `topK(population, count, fitness)` — elitist sort + slice.
- `roulette(population, count, fitness, rng)` — fitness-proportionate
  pick with uniform fallback when the population's total fitness is
  zero.
- `SelectionOperator<T>` — typed alias matching the engine's
  `(population, count, fitness, rng) => T[]` contract.
- `makeTournament(k)` — curry a tournament with a fixed `k` into a
  `SelectionOperator<T>`.

## Internal

- `precompute(population, fitness)` — scores every subject once per
  call so the per-pick inner loop is O(1) on fitness evaluation, not
  O(N).

## Depends on

- `./fitness` — for the `FitnessFunction<T>` type only. No runtime
  data import.

## Does not

- **Does not mutate the population.** All operators take
  `ReadonlyArray<T>` and return a new array. The engine assembles
  the next generation; selection only points at parents.
- **Does not enforce uniqueness.** `roulette` and `tournament` may
  return the same subject twice in one `count` draw. Callers that
  require distinct parents dedup at the boundary; for crossover the
  engine usually wants two independent draws.
- **Does not own the RNG.** The engine passes a seeded function so
  the whole generational walk is reproducible from a single seed.
- **Does not normalise scores.** Operators assume `FitnessFunction`
  already returns [0..1]; `roulette` treats any non-negative
  magnitude as a relative weight.
- **Does not implement stochastic-universal sampling, rank
  selection, or Boltzmann selection.** If the engine ever needs
  those, they're new files at `lib/evolution/selection/`.

## Bordering files

- `fitness.ts` — supplies the `FitnessFunction<T>` shape these
  operators consume.
- `engine.ts` — calls these to pick parents for the next generation.
- Ported from `D:\The_Hangar\python-services\genome\operators.py` —
  `tournament_select` lifts directly; `topK` and `roulette` round
  out the catalogue.
