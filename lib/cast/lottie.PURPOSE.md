# `lottie.ts` — purpose twin

## Role

Character bible for Lottie — the Princess archetype in the peer
cohort. The peer who names the thing the room is talking around,
slightly wrong, in a way that opens the room. Romance specialist.
House: Buttercream. Loaded by `agent.dialogue` and `agent.banter` to
ground her voice in the LLM call.

## Public surface

- `lottie: CharacterBible` — the typed bible.

## Internal

None. Pure data.

## Depends on

- `./aura` for the `CharacterBible` type (type-only).

## Does not

- **Does not own her conversational memory.** That's
  `agent.memory` + the `cast` slice's `history`.
- **Does not own her pose / face.** When the VRM stage adds Lottie,
  her pose and face data live in `lib/capabilities/vrm/pose.ts` and
  `lib/capabilities/vrm/expression.ts`.
- **Does not own her tier or House.** That's
  `lib/cast/canon-hierarchy.ts` — a parallel registry keyed by id.
  The bible is the voice; the hierarchy is the structure.

## Bordering files

- `lib/cast/index.ts` — barrel registration.
- `lib/cast/canon-hierarchy.ts` — tier / House metadata.
- `lib/capabilities/agent/dialogue.ts` — consumes the bible.
- `lib/capabilities/agent/banter.ts` — consumes the bible for the
  banter capability.
- `docs/CAST-CANON.md` — the prose source of truth for Lottie's
  canon. If voice drift appears, the canon doc is authoritative for
  re-grounding the bible.

## Memory

- `docs/CAST-CANON.md` Tier 2 — Lottie is the Princess peer
  archetype; House Buttercream; default mode crimson; specialty
  is naming the unspeakable.
