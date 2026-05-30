# `cast-roster.ts` — purpose twin

## Role

The `agent.cast-roster` capability — joins the bibles registry
(`lib/cast/`) with the canon hierarchy (`lib/cast/canon-hierarchy.ts`)
into a single tier-filterable surface. UIs and orchestrators that
need "give me the inner circle" or "give me a department head by
kind" import from here; the per-call dialogue path stays direct.

## Public surface

- `RosterMember` — joined shape: id + bible + hierarchy entry.
- `getMember(id)` — single lookup. Throws if either registry is
  missing the id (registration-mismatch alarm).
- `listRoster()` — all members in tier order.
- `rosterByTier(tier)` — filter by tier.
- `rosterCanon14()` — only the canon-14 (excludes website-only
  extras like excavation-bot, scribe).
- `rosterNamed()` — only named members (excludes NAME TBD heads).
- `rosterStats()` — counts for debug panels.
- `assertRosterConsistent()` — integrity check; returns a string
  description of any mismatch, or null on success.

## Internal

- `tierOrder(tier)` — local helper for sort order.

## Depends on

- `lib/cast` (the barrel — bibles, getBible, listCastIds, types).
- `lib/cast/canon-hierarchy` (the parallel registry).

## Does not

- **Does not run dialogue.** The roster is a discovery surface;
  `agent.dialogue` runs the LLM turn given a bible.
- **Does not own runtime state.** No history, no turn-state, no
  active speaker — those live in `lib/state/agent.ts` and
  `lib/state/cast.ts`. The roster is a pure read over two
  registries.
- **Does not enforce tier-aware routing.** If we want
  "inner-circle calls go to Anthropic, peers go to the local
  model", that logic lives in the dialogue capability or a
  router on top of it — this file only exposes the tier so other
  code can decide.

## Bordering files

- `lib/cast/index.ts` — bibles barrel.
- `lib/cast/canon-hierarchy.ts` — tier / House / named registry.
- `lib/capabilities/agent/dialogue.ts` — the per-call path that
  consumes one bible by id.
- `lib/capabilities/index.ts` — the registry where this
  capability is registered (so `/capabilities` lists it).
- `app/api/aura/agent/route.ts` and siblings — likely consumers
  once cast-aware endpoints land.
- `docs/CAST-CANON.md` — the prose source of truth for who's in
  which tier.

## Memory

- The `assertRosterConsistent()` function is the safety net.
  Every new bible MUST be added to both `lib/cast/index.ts`
  (CastMemberId union + bibles record) and
  `lib/cast/canon-hierarchy.ts` (HIERARCHY record). If either is
  forgotten, `getMember()` throws at first use. Running
  `assertRosterConsistent()` in a test or at boot in dev surfaces
  the mismatch before it ships.
- The capability ID is `agent.cast-roster` — under the `agent`
  kind, alongside `agent.dialogue`, `agent.banter`,
  `agent.memory`. Naming follows the
  `<kind>.<verb-or-noun>` convention from
  `lib/capabilities/_base.ts`.
