# `evolution-demo-client.tsx` — purpose twin

## Role

The client-side bridge for `/demo/evolution`. Surfaces the typed
evolution engine at `lib/evolution/` end-to-end: builds a 24-genome
population from a user-controlled seed, exposes step / run-50 /
reset controls, plots best-fitness and average-fitness per
generation on Canvas2D, and paints the leading individual's
28 normalised genes as a bar row. Reproducibility is total — the
same seed reproduces the same evolution.

## Public surface

- Default export `EvolutionDemoClient()`. No props — the demo
  owns its full state.

## Subject

- `EvolveSubject = { genome: Genome; fitnessHint?: number }`.
  The engine is generic over `T`; this is the smallest carrier
  that lets the demo run while keeping the door open for a
  mesh-aware sibling type (the `fitnessHint` slot is reserved
  for a cached fitness if a later iteration wants it).

## Loop pieces

- **Population**: 24 genomes built from `seededRng(seed)`,
  each gene independent uniform in [0..1].
- **Fitness**: closeness of each gene to the midpoint of its
  normalised range (0.5). RMS distance mapped to [0..1] via
  `1 - rms * 2`. The synthetic target proves the loop converges.
- **Selection**: `makeTournament<EvolveSubject>(3)` — the
  same operator the python source uses.
- **Crossover**: uniform per gene. Each child gene independently
  picks from parent A or B.
- **Mutation**: Gaussian (Box-Muller, sigma = 0.08) on one or
  two genes per individual, clipped to [0..1].
- **Engine call**: `evolve()` with `generations: 1` per step.
  A persistent RNG ref draws a fresh seed for each `evolve()`
  invocation so consecutive steps are deterministic against
  the user seed but distinct from each other.

## State

- `seed` (number) — controls the entire run.
- `gen` (number) — current generation counter for the readout.
- `population` (`EvolveSubject[]`) — live generation.
- `history` (`GenerationSnapshot[]`) — the chart's data source.
- `running` (boolean) — disables buttons while `run 50` batches.
- `rngRef` — persistent RNG that survives across steps.
- `runCancelRef` — lets `reset` interrupt a batch.

## UI

- Canvas2D chart, pink-on-midnight: bright pink = best, dim
  pink = average. Y axis is normalised [0..1]; X axis is
  generation. Three faint gridlines at 0.25 / 0.5 / 0.75.
- Bar row: 28 pink bars, height = gene value. `title` attribute
  carries `geneId = value` for inspection.
- Buttons: "step 1", "run 50", "reset".
- Seed input (number) — typing a new seed triggers a fresh run.
- Current-generation counter + best-fitness readout above the
  chart.

## Generation throttling

- "run 50" batches the work in chunks of 5 generations, with a
  `requestAnimationFrame` yield between chunks. This keeps the
  UI responsive on populations of 24 while still finishing in
  well under a second on a modern laptop. The batch can be
  cancelled by hitting reset; `runCancelRef.current = true`
  short-circuits the next chunk.

## Depends on

- `lib/evolution` — `evolve`, `seededRng`, plus engine + genome types.
- `./evolution-demo-loop` — the pure pieces of the loop
  (`EvolveSubject`, `fitness`, `uniformCrossover`, `gaussianMutate`,
  `selectTournament`, `buildInitial`, `findBest`,
  `initialSnapshot`, the four sizing constants). The split keeps the
  client component under the 300-line cap and the loop unit-testable.

## Does not

- **Does not modify `lib/evolution/*`.** The demo is a consumer.
- **Does not import three.** The fitness function is gene-only.
- **Does not register a capability.** This is a demo of an
  existing library, not a new brick.
- **Does not own the chart as a reusable component.** The
  Canvas2D paint lives inline. If a second demo needs the same
  chart, lift it into `components/visualiser/` then.
- **Does not own mesh-aware fitness.** That belongs to a later
  sibling under `lib/evolution/fitness/` once the engine starts
  consuming geometry.

## Bordering files

- `app/demo/evolution/page.tsx` — server-component shell.
- `lib/evolution/index.ts` — public surface.
- `lib/evolution/engine.ts` — `evolve()` itself.
- `app/atelier/evolution/page.tsx` — the 14-station map.
- `components/articles/entries/how-the-studio-breeds-sculptures.tsx` —
  prose companion.
