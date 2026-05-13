# `excavation-bot.ts` — purpose twin

## Role

The canonical character bible for Excavation Bot — the data that
`agent.dialogue` loads into the LLM system prompt to keep its voice
consistent across turns. Excavation Bot is the Academy's retrieval
and archaeology agent; its bible carries the terse, receipt-style
register and the veridian pattern-recovery default.

## Public surface

- `excavationBot: CharacterBible` — the typed bible.

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
- **Does not have a VRM body.** This is the only cast member
  explicitly *not* embodied in the VRM sense. There is no
  `POSES.excavationBotDefault` and no face entry; the bot's
  presence is the artefact list it returns. The `posture` field
  is descriptive only — it has no pose / expression counterpart in
  `lib/capabilities/vrm/`.
- **Does not own the archive.** The repositories, branches, draft
  notes, and session transcripts it searches live in the Hangar
  and on disk; the bible holds the bot's *posture toward* the
  archive, not the archive itself.
- **Does not own the canon.** That's The Scribe's job. Excavation
  Bot retrieves; The Scribe decides what enters the record.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type.
- `lib/cast/scribe.ts` — the closest functional neighbour and the
  deliberate opposite. Scribe protects the record; Excavation Bot
  retrieves what fell out of it. Scenes touching canon-versus-draft
  often read both bibles.
- `lib/capabilities/agent/dialogue.ts` — reads `excavationBot` to
  ground the LLM call when Excavation Bot is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/excavation-bot.ts"`
  points here once registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Excavation Bot | Retrieval/archaeology agent". No pre-existing
  Hangar agent doc found for Excavation Bot at
  `D:\The_Hangar\Dolly_OS\public\docs\The_Charming_Academy\Agents\`
  at the time of writing — this bible is the first canonical
  record of its voice, anchored to the retrieval-agent role given
  by the dollyos-world cast table.
