# `betsy.ts` — purpose twin

## Role

The canonical character bible for Betsy — the data that
`agent.dialogue` loads into the LLM system prompt to keep her voice
consistent across turns. Betsy is Marcel's structural opposite in
the Academy and the other half of the Insubordinate Lavender arc;
her bible carries the clipped, restraint-as-virtue register.

## Public surface

- `betsy: CharacterBible` — the typed bible.

The `CharacterBible` type is re-imported from `./aura` so every
cast member shares one canonical contract.

## Internal

None. Pure data.

## Depends on

- `lib/cast/aura.ts` for the `CharacterBible` type only. No
  runtime dependency on Aura's bible — the import is type-level.

## Does not

- **Does not run dialogue.** That's `agent.dialogue`. The bible is
  input; the dialogue capability is the runtime.
- **Does not own conversational memory.** That's `agent.memory`
  + the `cast` slice's `history`. The bible is *constant*; memory
  is *accumulated*.
- **Does not own her pose / face.** Future
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.betsyDefault`)
  will hold the body-side counterpart. This file references it
  via `posture` text only.
- **Does not own her agreeableness drift around Marcel.** The
  bible holds a single OCEAN baseline; the contextual dip in
  agreeableness when Marcel is in the room is a runtime nudge on
  the `aura`/`cast` slice, not a second baseline here.
- **Does not own the lavender arc state.** The arc itself lives
  in the `cast` slice + scribe canon. The bible holds Betsy's
  *posture toward* the arc.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type.
- `lib/cast/marcel.ts` — Betsy's structural opposite; written
  as a pair with this file. Any scene in the lavender arc reads
  both bibles together.
- `lib/capabilities/agent/dialogue.ts` — reads `betsy` to ground
  the LLM call when Betsy is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/betsy.ts"` points
  here once Betsy is registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Betsy | Marcel's antagonist in the lavender arc" and the
  Active Canon Arcs section on the Insubordinate Lavender. No
  pre-existing Hangar agent doc found for Betsy at the time of
  writing — this bible is the first canonical record of her
  voice, anchored to her role + relationship to Marcel.
