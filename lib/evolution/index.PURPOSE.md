# `index.ts` — purpose twin

## What this is

One import path for the whole evolution library. Re-exports the
engine, the genome model, the fitness axes, the selection
operators, and the 14-station catalogue. Lets a caller do
`import { evolve, mutateGenome, defaultFitness } from "lib/evolution"`
without knowing which sub-file each symbol came from.

## Role

Public surface of the evolution library. Re-exports the engine's
types and functions plus the 14-station catalogue so callers
(`/atelier/evolution`, `/run evolve.*`, the future capability
bricks) have one import path.

## Public surface

Re-exports from `./genome`, `./fitness`, `./selection`, `./engine`,
and `./stations`. See each twin for the per-file surface.

Highlights, by use-case:

- Build a population: `Genome`, `Gene`, `GENE_NAMES`, `GENE_RANGES`,
  `denormalise`, `cloneGenome`.
- Breed: `crossover`, `mutateGenome`.
- Score: `defaultFitness`, `compose`, `scoreOptical`,
  `scoreCoherence`, `scoreNovelty`, `scoreComplexity`,
  `scorePrintability`.
- Select: `tournament`, `topK`, `roulette`, `makeTournament`.
- Run: `evolve`, `EvolveOptions`, `EvolutionResult`,
  `GenerationSnapshot`, `seededRng`.
- Map onto the studio: `evolutionStations`, `getStation`,
  `stationKindColours`.

## Internal

Nothing. This file is a re-export-only barrel.

## Depends on

- `./genome`
- `./fitness`
- `./selection`
- `./engine`
- `./stations`

## Does not

- **Does not declare any new type or function.** Every symbol is
  re-exported. Adding logic here would split the public surface
  across two files and break the "one source of truth per export"
  contract.
- **Does not register a capability.** Evolution is library code; if
  a verb of it (`evolve.run`, `evolve.score`) ever becomes a
  capability, that capability lives at
  `lib/capabilities/evolve/<verb>.ts` and imports from this barrel.
- **Does not lazily load.** Trees-shake-able; importers pay only for
  what they reach.

## Bordering files

- `genome.ts`, `fitness.ts`, `selection.ts`, `engine.ts`,
  `stations.ts` — the five sources of truth this file re-exports.
- `lib/assets/genomes.ts` — the application-level
  `SculptureGenome` catalogue; a separate concern. The two genome
  shapes are intentionally distinct (see `genome.PURPOSE.md`
  "Does not").
- Future `lib/capabilities/evolve/` — when a verb of evolution
  graduates to a capability, this barrel is its lone dependency.
