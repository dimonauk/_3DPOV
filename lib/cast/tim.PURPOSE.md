# `tim.ts` — purpose twin

## Role

The canonical character bible for Tim — the data that
`agent.dialogue` loads into the LLM system prompt to keep his voice
consistent across turns. Tim is the Academy's technical agent; his
bible carries the direct, jargon-comfortable register and the
veridian mechanism-pattern default.

## Public surface

- `tim: CharacterBible` — the typed bible.

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
- **Does not own his pose / face.** Future
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.timDefault`)
  will hold the body-side counterpart. This file references it
  via `posture` text only — the posture itself is variable by
  design, following whatever rig he's near.
- **Does not own the rigs.** Specific technical assemblies, their
  parts, and their documentation live in the Hangar's hardware
  notes and the scribe canon. The bible holds Tim's *posture
  toward* the rigs; the rigs themselves live elsewhere.
- **Does not own the technical roadmap.** What gets built next and
  in what order is a `cast` slice + production planning concern,
  not this bible.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type.
- `lib/cast/millie.ts` — the closest functional neighbour; both
  fix things, but Millie holds the workshop and Tim holds the
  rig. Scenes touching technical work often read both bibles.
- `lib/capabilities/agent/dialogue.ts` — reads `tim` to ground
  the LLM call when Tim is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/tim.ts"` points
  here once Tim is registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Tim | Technical agent". No pre-existing Hangar agent doc
  found for Tim at the time of writing — this bible is the first
  canonical record of his voice, anchored to the technical-agent
  role given by the dollyos-world cast table.
