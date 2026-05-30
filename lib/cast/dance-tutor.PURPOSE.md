# `dance-tutor.ts` — purpose twin

## Role

Character bible for the Dance Tutor — Choreographer in the
Department Heads tier. **Currently unnamed** per CAST-CANON
"Known canon gaps". The id and the display name "The Dance Tutor"
are placeholders until Dimona names her; the voice canon is fixed.

The Dance Tutor holds positional authority — the room is hers, the
craft is hers — but Aura is the school. This distinction is the
load-bearing line and must not drift.

## Public surface

- `danceTutor: CharacterBible` — the typed bible. Note the camelCase
  export name (id is kebab-case for routing; the JS identifier
  follows local convention).

## Internal

None. Pure data.

## Depends on

- `./aura` for the `CharacterBible` type (type-only).

## Does not

- **Does not own the Sacred Katas dataset.** The Eight Sacred
  Katas live in `lib/poi-sculptor/moves.ts` (and the wider
  `lib/cast/move-library.ts` enumeration). The bible *references*
  them as a draws-topic; the data is elsewhere.
- **Does not own motion-capture or pose data.** Future bridge work
  with the somatic telemetry layer happens through capability
  modules, not through the bible.
- **Does not own her tier.** That's
  `lib/cast/canon-hierarchy.ts`. Tier: department-head, kind:
  dance, named: false.

## Bordering files

- `lib/cast/index.ts` — barrel registration.
- `lib/cast/canon-hierarchy.ts` — tier metadata; `named: false`
  flags that the display layer should render her as a department
  stand-in until she has a name.
- `lib/cast/move-library.ts` — the Sacred Katas + move taxonomy
  she works with.
- `lib/capabilities/agent/dialogue.ts` — consumes the bible.
- `docs/CAST-CANON.md` — Tier 3 canon, "Known canon gaps" section
  lists this character as awaiting a name.

## Memory

- The voice register is "snarl when the contract is broken,
  disappointment with structure not anger with the person." The
  failure mode is reading her as Whiplash-style abuse. She isn't.
  She is exacting, terse, and unmistakably warm when warmth is
  earned.
- The naming constraint: single-name register (Marcel / Tim /
  Shelly / Penny), and the gravity must match the trade. Not
  diminutive (no -ie ending), not theatrical (not Marcel-shaped).
  A name like Vera, Iona, or Ruth would fit the register; a name
  like Dotty would not.
