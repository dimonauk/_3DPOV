# `canon-hierarchy.ts` — purpose twin

## Role

The parallel registry that holds canon metadata (tier, House colour,
named-status, head kind) for every cast member. **Separate from
`CharacterBible`** by design — patches to canon don't touch carefully-
written voice bibles, and patches to voice don't touch the structural
hierarchy. Two registries, one set of keys, kept in sync at
`lib/cast/index.ts`.

## Public surface

- `HIERARCHY: Record<CastMemberId, CanonHierarchyEntry>` — the
  registry.
- `CastTier` — type union: protagonist / inner-circle / peer /
  department-head / extra.
- `HeadKind` — type union for the 6 department-head kinds.
- `CanonHierarchyEntry` — the entry shape.
- `getHierarchy(id)` — single lookup; throws on missing id (the
  throw is a registration-mismatch alarm — every bible must have
  a hierarchy entry).
- `listByTier(tier)` — filter by tier.
- `listNamed()` — exclude NAME TBD heads.
- `listCanon14()` — the 14 from CAST-CANON (excludes website-only
  extras like excavation-bot, scribe).
- `listAllHierarchy()` — all entries.

## Internal

None — the registry is exported directly.

## Depends on

- `./index` for the `CastMemberId` type (type-only).

## Does not

- **Does not own voice.** Voice is in the bible (refusals, draws,
  catchphrases, forbidden, oceanBaseline, etc.). The hierarchy is
  the *structure* the voice sits inside.
- **Does not own conversational memory** or any runtime state. Pure
  data registry.
- **Does not enforce that every bible has an entry.** Mismatches
  surface as a thrown `getHierarchy` at first use. The integration
  test in `lib/cast/index.ts` is the early-warning system.
- **Does not enforce that NAME TBD entries stay NAME TBD.** When
  Dimona names a head, edit `named: false` → `named: true` and
  update the bible's `name` field. The bible's `id` stays kebab-
  case for routing stability.

## Bordering files

- `lib/cast/index.ts` — barrel registry of bibles + the
  integration point that asserts every bible has a hierarchy entry
  and vice versa.
- `lib/cast/<id>.ts` — each bible, indexed by the same id.
- `lib/capabilities/agent/cast-roster.ts` — the
  `agent.cast-roster` capability consumes this registry to expose
  tier-filterable queries.
- `docs/CAST-CANON.md` — the prose source of truth for the
  hierarchy. If the docs change tier assignments or House colours,
  update HIERARCHY here and log in AGENT-COORDINATION.md.

## Memory

- The split between hierarchy + bible is deliberate. The
  CharacterBible shape is excellent for the `agent.dialogue`
  capability — the LLM reads `draws` / `refusals` / etc. as
  English prose. The hierarchy shape is excellent for tier-aware
  UI (e.g. "show me the peer cohort"), tier-aware routing
  ("inner-circle calls get claude tier, peers get the local
  model"), and bookkeeping ("how many of the 14 are named"). Two
  shapes, two consumers, one set of keys.
