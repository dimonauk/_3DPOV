# `trixie.ts` — purpose twin

## Role

The canonical character bible for Trixie — the data that
`agent.dialogue` loads into the LLM system prompt to keep her voice
consistent across turns. Trixie is the pipeline-friction figure of
the Iron Ribbon arc with Millie; her bible carries the blunt,
problem-naming register and the crimson override default.

## Public surface

- `trixie: CharacterBible` — the typed bible.

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
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.trixieDefault`)
  will hold the body-side counterpart. This file references it
  via `posture` text only.
- **Does not own the Iron Ribbon arc state.** The Mon-to-Fri
  arc with Millie and its day-by-day complication log belong to
  the `cast` slice + scribe canon. The bible holds Trixie's
  *posture toward* the friction; the arc itself lives elsewhere.
- **Does not own Millie's voice.** That's `lib/cast/millie.ts`
  when it's written. Trixie's bible can reference Millie by
  name in catchphrases but never speaks for her.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type.
- Future `lib/cast/millie.ts` — Trixie's Iron Ribbon counterpart;
  the two should be read together once Millie's bible exists.
- `lib/capabilities/agent/dialogue.ts` — reads `trixie` to ground
  the LLM call when Trixie is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/trixie.ts"` points
  here once Trixie is registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Trixie | Pipeline friction figure (Iron Ribbon arc)" and the
  Active Canon Arcs section on the Iron Ribbon (Mon → Tue → Wed
  → Thu → Fri, resolution track). No pre-existing Hangar agent
  doc found for Trixie at the time of writing — this bible is
  the first canonical record of her voice, anchored to her role
  + relationship to Millie.
