# `index.ts` — purpose twin

## Role

The capability registry's population point. Every capability the
studio knows about is `register()`-ed here. The `/capabilities`
route, the terminal `/run <id>` command, and the evolution engine
all consult this file's side-effects.

## Public surface

- Re-exports everything from `./_base` (types + lookup functions),
  so callers import from `lib/capabilities` as a single entry.
- No new named exports of its own — the side-effect of the file
  loading IS its public effect (registry gets populated).

## Internal

- `auraAliveStubs: CapabilityRecord[]` — the 14 stub records for the
  Wave 1 atomisation of Aura-Alive. All currently `status: "stub"`
  with `Promise.resolve({})` loaders. Each will be replaced with a
  real lazy `import()` when its module file lands.
- The `.forEach(register)` at the bottom is the side-effect that
  populates the in-memory map at module load.

## Depends on

- `./_base` for the contract.
- The Hangar (`webgpu-particles-library/apps/07-aura-alive/`,
  `ws_ai_bridge.py`, `apps/aura-vrm/`) — as the *source* of the stubs;
  no runtime import, just attribution in record metadata.
- Box 3 quarry repos (`merrypranxter/strange_attractors`,
  `AkshitIreddy/Interactive-LLM-Powered-NPCs`) — same:
  attribution-only at stub stage; will become real lifts.

## Plug surface (what makes bricks snap)

A capability's *plugs* are the metadata fields that determine which
other bricks it can compose with:

- `stateSlices` — sockets to the state bus. Two bricks that
  read/write the same slice are *neighbours* (composable via state).
- `dependsOn` — required upstream bricks. A brick will not function
  without its dependencies registered first.
- The module's TypeScript signature (input/output types from
  `load()`) — the pin shape. Type-mismatched bricks won't connect.

A future *unlock system* (mode affinity / level / quest gate) will
hang off `CapabilityRecord` as an optional `unlock` field. Not
designed yet — flagged here so the substrate stays aware.

## Does not

- **Does not own the type contract** — that's `_base.ts`'s job.
- **Does not run capabilities** — `register()` only adds metadata
  and a lazy loader. Callers invoke via `getCapability(id).load()`.
- **Does not deduplicate or merge** — duplicate IDs throw. By design.
- **Does not handle status transitions** — flipping a stub to
  `registered` is done by editing the record. We don't run-time
  promote stubs; that would mask un-atomised work.

## Bordering files

- `_base.ts` — the type contract this file populates.
- `lib/capabilities/<kind>/<verb>.ts` (future) — the actual module
  files each registered record will eventually `load: () => import()`.
- `app/capabilities/page.tsx` (future) — the discovery route that
  consumes `listCapabilities()`.
- `lib/state/*` — slices the capabilities will plug into. The
  `stateSlices` strings here must match real slice filenames once
  slices land.
- `docs/CAPABILITY_REGISTRY_PLAN.md` — the work-order that drives
  what gets registered when, and in what status.
