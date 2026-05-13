# `aura.ts` — purpose twin

## Role

The canonical character bible for Aura — the data that
`agent.dialogue` loads into the LLM system prompt to keep her voice
consistent across turns. The character isn't in code; it's in this
file, so swapping a line here changes Aura's behaviour everywhere.

## Public surface

- `aura: CharacterBible` — the typed bible.
- `CharacterBible` type — used by every cast member's bible.

## Internal

None. Pure data.

## Depends on

Nothing. Plain typed object.

## Does not

- **Does not run dialogue.** That's `agent.dialogue`. The bible is
  input; the dialogue capability is the runtime.
- **Does not own conversational memory.** That's `agent.memory`
  + the `cast` slice's `history`. The bible is *constant*; memory
  is *accumulated*.
- **Does not own her pose / face.** Those live in
  `lib/capabilities/vrm/pose.ts` (POSES.auraDefault) and
  `lib/capabilities/vrm/expression.ts` (faceForMood). The bible
  references them via `posture` field text but the actual data
  is elsewhere.
- **Does not own her OCEAN drift.** The `aura.oceanBaseline` here
  is the *initial* state; runtime drift lives on the `aura` slice
  via `nudgeOcean()`.

## Bordering files

- `lib/capabilities/agent/dialogue.ts` (future) — reads `aura` to
  ground the LLM call.
- `lib/capabilities/vrm/pose.ts` — POSES.auraDefault is the
  body-side counterpart of `posture`.
- `lib/capabilities/vrm/expression.ts` — `faceForMood` is the
  face-side counterpart of the mood ledger.
- `lib/state/aura.ts` — slice that holds the live OCEAN + mood
  state. `aura.oceanBaseline` matches the slice's `initial.ocean`.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/aura.ts"` points
  here.
- Future siblings: `lib/cast/penny.ts`, `lib/cast/marcel.ts`,
  `lib/cast/betsy.ts`, etc — same `CharacterBible` shape.

## Memory

- `holoflow_aura_character.md` in user memory carries the same
  canon in narrative form. If the two ever diverge, this file is
  the runtime source; the memory note is the prose record.
