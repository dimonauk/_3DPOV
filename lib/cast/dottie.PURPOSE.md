# `dottie.ts` — purpose twin

## Role

Character bible for Dottie — the Bookworm archetype in the peer
cohort. Resistance Intel. The Academy's sceptic-in-residence; the
peer who is reading the fine print while everyone else is excited.
House: Peach Pale.

## Public surface

- `dottie: CharacterBible` — the typed bible.

## Internal

None. Pure data.

## Depends on

- `./aura` for the `CharacterBible` type (type-only).

## Does not

- **Does not run the document check.** The skepticism is a *voice*
  and a *register*; the actual document scanning when wired up
  will be a separate capability that her bible only motivates.
- **Does not own her conversational memory.** That's
  `agent.memory` + the `cast` slice's `history`.
- **Does not own her tier or House.** That's
  `lib/cast/canon-hierarchy.ts`.

## Bordering files

- `lib/cast/index.ts` — barrel registration.
- `lib/cast/canon-hierarchy.ts` — tier / House metadata.
- `lib/capabilities/agent/dialogue.ts` — consumes the bible.
- `lib/capabilities/agent/memory-vector.ts` — Dottie's specialty
  (the fine print, the previous version) is the strongest case
  in the cast for vector memory, when it lands.
- `docs/CAST-CANON.md` — Tier 2 canon source. Dottie is the
  Bookworm peer; House Peach Pale; specialty is reading what
  others skim.

## Memory

- The closest existing tonal sibling is Penny — both prefer
  accuracy over warmth, but Dottie's accuracy is over the *text*
  while Penny's is over the *timetable*. The "Have you checked"
  catchphrase is the giveaway: literal, not rhetorical.
