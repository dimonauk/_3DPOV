# `millie.ts` — purpose twin

## Role

The canonical character bible for Millie — the data that
`agent.dialogue` loads into the LLM system prompt to keep her voice
consistent across turns. Millie is Trixie's counterpart in the Iron
Ribbon arc; her bible carries the calm, sustained-attention register
and the azure flow default that gets the fix done.

## Public surface

- `millie: CharacterBible` — the typed bible.

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
  `lib/capabilities/vrm/pose.ts` entry (e.g. `POSES.millieDefault`)
  will hold the body-side counterpart. This file references it
  via `posture` text only.
- **Does not own the Iron Ribbon arc state.** The Mon-to-Fri arc
  with Trixie and its day-by-day complication log belong to the
  `cast` slice + scribe canon. The bible holds Millie's *posture
  toward* the friction; the arc itself lives elsewhere.
- **Does not speak for Trixie.** That's `lib/cast/trixie.ts`.
  Millie's bible can reference Trixie by name in catchphrases
  but never speaks for her.

## Bordering files

- `lib/cast/aura.ts` — the canonical sibling and the source of
  the `CharacterBible` type.
- `lib/cast/trixie.ts` — Millie's Iron Ribbon counterpart; the
  two bibles are read together for any scene in the arc. Trixie
  surfaces, Millie fixes.
- `lib/capabilities/agent/dialogue.ts` — reads `millie` to ground
  the LLM call when Millie is the speaker.
- `lib/state/cast.ts` — `bibleRef: "lib/cast/millie.ts"` points
  here once Millie is registered.
- `lib/productions/episodes.ts` — the Iron Ribbon episodes will
  type-check `millie` in their `cast` arrays once this bible is
  registered.

## Memory

- Role canon source: `dollyos-world` skill, the cast table line
  "Millie | Trixie's counterpart (Iron Ribbon arc)" and the
  Active Canon Arcs section on the Iron Ribbon (Mon → Tue → Wed
  → Thu → Fri, resolution track). No pre-existing Hangar agent
  doc found for Millie at the time of writing — this bible is
  the first canonical record of her voice, anchored to her role
  + relationship to Trixie.
