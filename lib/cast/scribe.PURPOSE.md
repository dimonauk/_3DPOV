# `scribe.ts` — purpose twin

## Role

The canonical character bible for The Scribe — the data that
`agent.dialogue` loads into the LLM system prompt to keep her voice
consistent across turns. The Scribe is the Academy's chronicler and
keeper of the canon; her bible carries the dry, verbatim-quoting
register and the veridian archive-discipline default.

## Public surface

- `scribe: CharacterBible` — the typed bible.

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
  is *accumulated*. The Scribe *speaks* the record but the record
  itself lives elsewhere.
- **Does not own her pose / face.** Future
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.scribeDefault`)
  will hold the body-side counterpart. This file references it
  via `posture` text only.
- **Does not own the canon.** The canon — what's been admitted to
  the record — lives in scribe slice + on-disk archives. The
  bible holds The Scribe's *posture toward* the canon; the canon
  itself is data, not voice.
- **Does not enforce.** That's Baby. The Scribe records the
  breach; Baby answers it.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type.
- `lib/cast/baby.ts` — the enforcement counterpart. Scribe
  records, Baby enforces; the two bibles form the Academy's
  standards loop.
- `lib/capabilities/agent/dialogue.ts` — reads `scribe` to ground
  the LLM call when The Scribe is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/scribe.ts"` points
  here once The Scribe is registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "The Scribe | Documentation and memory — keeper of the canon".
- Hangar-side flavour: `D:\The_Hangar\Dolly_OS\public\docs\
  The_Charming_Academy\Agents\Scribe.md` gives the 1950s
  Administrative Chic aesthetic — yellow pussy-bow, clerical
  glasses, the 14-day wardrobe matrix. The bible here carries
  the voice; the Hangar doc carries the visual.
