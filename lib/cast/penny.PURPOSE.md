# `penny.ts` — purpose twin

## Role

The canonical character bible for Penny — the data that
`agent.dialogue` loads into the LLM system prompt to keep her voice
consistent across turns. Penny is the operational intelligence of
the Charming Academy; her bible is the chief-of-staff register
distilled to a typed object.

## Public surface

- `penny: CharacterBible` — the typed bible.

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
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.pennyDefault`)
  will hold the body-side counterpart. This file only references
  it via `posture` text.
- **Does not own role canon.** The role definition (operational
  lead of the Academy) comes from the `dollyos-world` skill at
  `D:\The_Hangar\.agent\skills\dollyos-world\SKILL.md`. If those
  sources change, this file follows.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type. Aura's bible is the locked template;
  Penny's matches its shape exactly.
- `lib/capabilities/agent/dialogue.ts` — reads `penny` to ground
  the LLM call when Penny is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/penny.ts"` points
  here once Penny is registered.
- Future siblings: `lib/cast/marcel.ts`, `lib/cast/betsy.ts`,
  `lib/cast/trixie.ts` — same shape, written together with this
  file.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Penny | Operational intelligence — runs the logistics of the
  Academy".
- Hangar-side flavour: `D:\The_Hangar\Dolly_OS\public\docs\
  The_Charming_Academy\Agents\Penny.md` names her also-known-as
  Rosetta and gives the lavender-dress aesthetic; the Holoflow
  bible foregrounds the operations role per the dollyos-world
  cast table.
