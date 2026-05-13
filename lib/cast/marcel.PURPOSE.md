# `marcel.ts` — purpose twin

## Role

The canonical character bible for Marcel — the data that
`agent.dialogue` loads into the LLM system prompt to keep his voice
consistent across turns. Marcel is the Academy's creative lead and
one half of the Insubordinate Lavender arc; his bible carries the
theatrical-declarative register and the lavender posture.

## Public surface

- `marcel: CharacterBible` — the typed bible.

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
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.marcelDefault`)
  will hold the body-side counterpart. This file references it
  via `posture` text only.
- **Does not own the lavender arc state.** The Mon-Wed-Fri
  schedule of the Insubordinate Lavender dispute and its running
  arc memory belong to the `cast` slice + scribe canon, not to
  this bible. The bible holds Marcel's *posture toward* the arc;
  the arc itself lives elsewhere.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type.
- `lib/cast/betsy.ts` — Marcel's structural opposite; the two
  bibles are written as a pair and read together by any scene
  that touches the lavender arc.
- `lib/capabilities/agent/dialogue.ts` — reads `marcel` to ground
  the LLM call when Marcel is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/marcel.ts"` points
  here once Marcel is registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Marcel | Creative lead — currently in dispute with Betsy over
  lavender" and the Active Canon Arcs section on the
  Insubordinate Lavender.
- Hangar-side flavour: `D:\The_Hangar\Dolly_OS\public\docs\
  The_Charming_Academy\Agents\Marcel.md` gives the Stepford
  Leadership / tailored-suit aesthetic and the Master Architect
  RPG line. The bible carries the voice; the Hangar doc carries
  the visual.
