# `pipelines.ts` — purpose twin

## Role

The molecule registry. `lib/capabilities/index.ts` lists atoms;
this file lists *named compositions of atoms* — the things the
studio actually wants users + collaborators to think of as
features. Lipsync, mood face, held stance, Pipeline Epsilon, look
back, ten-shell parallax, dialogue loop.

A pipeline is a named ordered chain of capability stages with a
human-readable note per stage and the set of slices the chain
touches. Status tells you whether the chain is `registered`
(every stage real, demo or surface live), `stub` (some stages
still stubbed), or `speculative` (architectural sketch, not yet
demonstrable).

## Public surface

- `pipelines: Pipeline[]` — the catalogue.
- `getPipeline(id)` — single lookup.
- `listPipelines()` — iterate.
- Types: `Pipeline`, `PipelineStage`.

## Internal

Pure typed data. No runtime logic.

## Depends on

- `lib/capabilities/_base` — `CapabilityId` literal-union for
  stage references. A pipeline that names a non-existent
  capability fails to type-check.

## Does not

- **Does not invoke capabilities.** This file is documentation
  + discovery. The `/run <pipeline-id>` terminal command will be
  the invoker when it lands.
- **Does not own pipeline state.** A running pipeline's state
  lives in the slices the stages touch. The pipeline catalogue
  is *static* — it names compositions; running them is the
  caller's concern.
- **Does not enforce stage ordering at runtime.** Order is
  documentation. Actual execution order is whatever the caller
  invokes.

## Plug surface

- **State plugs:** none directly; each stage's slice plugs are
  documented per-stage.
- **Type plugs:** none (no exported functions take args yet).
- **Dependency plugs:** none.

## Bordering files

- `lib/capabilities/index.ts` — atoms.
- `lib/capabilities/_base.ts` — `CapabilityId` type.
- `app/pipelines/page.tsx` — the discovery route that renders
  this catalogue.
- Future `lib/capabilities/runner.ts` — invoke a pipeline by id.
- Future `components/shell/bottom-terminal.tsx`'s `/run` command —
  consumer.

## How this closes the architecture

Before this file, the registry was an alphabet without spelling.
Atoms existed but the meaningful combinations were implicit.
Listing the molecules makes the studio's *intent* visible: these
are the seven (so far) named features the substrate produces.
When the cast grows (Penny, Marcel, Betsy, etc.), new pipelines
will name their distinct compositions (e.g., Marcel + Betsy's
lavender-dispute pipeline that crosses agent.dialogue and a
shared scene-state slice).
