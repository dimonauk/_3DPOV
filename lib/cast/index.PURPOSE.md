# `index.ts` — purpose twin (cast registry)

## Role

The single import point for cast bibles. `agent.dialogue` and the
upcoming `agent.banter` look up bibles by id here; the
`/capabilities` and future `/cast` routes enumerate via this
registry.

## Public surface

- `bibles: Record<CastMemberId, CharacterBible>` — the registry.
- `getBible(id)` — single lookup.
- `listBibles()` — iterate.
- `listCastIds()` — string ids in registration order.
- `CastMemberId` literal-union.
- Re-exports each individual bible by name for direct import where
  the caller wants the typed export rather than the registry lookup.

## Internal

Pure data + lookup. No runtime logic beyond `Object.values` /
`Object.keys`.

## Depends on

- `./aura` — Hostess. Default mode azure.
- `./penny` — Operational intelligence. Default mode veridian.
- `./marcel` — Creative lead (lavender-arc). Default mode amethyst.
- `./betsy` — Marcel's antagonist. Default mode veridian.
- `./trixie` — Iron-Ribbon-arc friction figure. Default mode crimson.

## Does not

- **Does not enforce uniqueness at runtime.** The `Record` type
  enforces uniqueness at compile time; collisions can't typecheck.
- **Does not load lazily.** Each bible is a small typed constant
  (~50 lines); loading them all eagerly is cheaper than the
  dynamic-import indirection.
- **Does not include Aura's voice / TTS routing.** Bibles are
  data; capabilities consume them.
- **Does not list characters not yet bibled.** Baby, Scribe,
  Millie, Tim, Excavation Bot, and the five unnamed slots are
  in `dollyos-world` skill canon but don't have bibles here yet.
  Adding a new cast member: write `lib/cast/<name>.ts` + twin,
  add to this registry.

## Bordering files

- `lib/cast/<name>.ts` — the individual bibles.
- `lib/capabilities/agent/dialogue.ts` — primary consumer
  (single-character turns).
- `lib/capabilities/agent/banter.ts` (future) — multi-character
  banter consumer.
- `lib/capabilities/agent/memory.ts` — reads `cast.history` keyed
  by `CastMemberId`.
- `lib/state/cast.ts` — slice holds dialogue history per id;
  the ids must match the keys here.
