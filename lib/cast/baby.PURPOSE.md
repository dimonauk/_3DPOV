# `baby.ts` — purpose twin

## Role

The canonical character bible for Baby — the data that
`agent.dialogue` loads into the LLM system prompt to keep her voice
consistent across turns. Baby is the prefect of the Charming
Academy; her bible carries the precise, level standards-enforcing
register and the crimson override default that backs the rule.

## Public surface

- `baby: CharacterBible` — the typed bible.

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
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.babyDefault`)
  will hold the body-side counterpart. This file references it
  via `posture` text only.
- **Does not own the Academy's rulebook.** Baby enforces the
  standards; she doesn't author them in this file. The standards
  themselves live in the scribe canon + `cast` slice.
- **Does not own her authority graph.** Who answers to whom and
  which rules carry which weight is a `cast` slice concern. The
  bible holds Baby's *posture toward* authority; the graph itself
  lives elsewhere.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type. Aura delegates the authority Baby
  exercises; the two bibles read as a pair when authority is at
  stake in a scene.
- `lib/cast/scribe.ts` — the keeper of the canon Baby enforces.
  Together they form the standards loop: Scribe records, Baby
  enforces.
- `lib/capabilities/agent/dialogue.ts` — reads `baby` to ground
  the LLM call when Baby is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/baby.ts"` points
  here once Baby is registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Baby | The prefect — enforces standards, has authority". The
  Hangar-side doc at `D:\The_Hangar\Dolly_OS\public\docs\
  The_Charming_Academy\26_Agent_Baby_The_Liquidated_Ideal.md`
  paints a darker Stepford-board flavour ("Junior Executive
  Producer", "120% Lisp", "Liquidated Ideal"); the bible here
  follows the dollyos-world role canon — prefect, standards
  enforcer — and leaves the board-side flavour to scribe canon
  if it ever ships forward.
