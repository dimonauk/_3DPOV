# `_base.ts` — purpose twin

## Role

Defines the typed contract every capability in the studio must
reach. Without this file, the registry has no shape and the
genome-everything loop has no common surface.

## Public surface

- `CapabilityKind` — the eight categories a capability belongs to
  (`vrm`, `audio`, `motion`, `agent`, `input`, `viz`, `algo`,
  `shell`, `world`).
- `CapabilityId` — the literal-union of every registered ID; grows
  with each new capability.
- `CapabilityRecord` — the metadata + lazy-loader struct.
- `CapabilityStatus` — `registered` | `stub` | `deprecated`.
- `register(record)` — adds a capability to the in-memory map.
  Throws on duplicate ID.
- `getCapability(id)` — single lookup.
- `listCapabilities()` — iterate all.
- `listByKind(kind)` — filter by category.

## Internal

The `registry` map at module scope is private. Callers go through
`register` / `get` / `list` functions only; the map is not exported.

## Depends on

Nothing. This file is pure type definitions + a private `Map`. The
border between "is the registry working" and "is anything plugged
into it" is here.

## Does not

- **Does not own state.** The registry is a discovery surface, not a
  state slice. Capabilities themselves talk to `lib/state/` slices.
- **Does not type-narrow `load()`'s return.** Each capability's
  module shape is its own concern; callers import the module type
  directly. The registry is for *finding* a capability, not for
  *invoking* it generically.
- **Does not validate ID format.** Naming convention is enforced by
  code review + the literal-union type, not by runtime regex.
- **Does not handle hot-reload.** A duplicate-id throw will surface
  during dev if a module hot-replaces. Intentional — duplicates are
  bugs, not a runtime concern.

## Bordering files

- `index.ts` — the registry index. Imports `register` and populates
  the map. Composition responsibility: index.ts decides who registers.
- `lib/state/*` — slices that capabilities read/write. Capabilities
  declare their `stateSlices` here in metadata; actual wiring is the
  capability module's job.
- `docs/CAPABILITY_REGISTRY_PLAN.md` — the human-readable companion;
  this file is the type-level companion.
- `docs/ARCHITECTURE.md` — the four-rule canon this file implements
  Rule 4 (everything is in the loop).
