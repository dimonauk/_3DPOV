# scaffold-specialist

Generator CLI for new Holoflow Studio specialists. Given a one-line
description (slug, display name, role, kingdom, voice register, topics,
preferred model, tools, VRM), writes the cast bible JSON, the typed
`Specialist` registration, the `.PURPOSE.md` twin, and patches the two
registries (`lib/agents/specialists/index.ts` and `lib/agents/cast.ts`).

The output is a **scaffold**, not a finished character. The
`systemPrompt` is a template. The `longBio` is empty. `active` defaults
to `false`. The operator fills the voice in by hand, then flips the
flag once the voice has been reviewed against the
[`holoflow-voice`](https://github.com/Anthropic-Dim/holoflow-voice)
skill canon. See [When NOT to use](#when-not-to-use) below — Aura-tier
characters do not start here.

## Synopsis

```sh
node scripts/scaffold-specialist.mjs \
  --slug "babette" \
  --display-name "Babette" \
  --role "The Lensmaker" \
  --kingdom "biomech" \
  --voice "warm but rigorous, calibrates against light + materials" \
  --speaks-about "lenses, depth, focal length, the rig" \
  --prefer-model "claude-sonnet-4-6" \
  --tools "memory.recall,memory.remember,research.recall,print.check" \
  --vrm "/avatars/babette.vrm"
```

## Flags

| Flag | Required | What it does |
|---|---|---|
| `--slug <kebab>` | yes | Kebab-case identifier. Must be 2-40 chars, `[a-z][a-z0-9-]*[a-z0-9]`. Becomes the filename and the URL slug. Must not already exist (unless `--force`). |
| `--display-name <text>` | yes | Human-readable name (e.g. "Babette", "The Lensmaker"). Shown on cast cards. |
| `--role <text>` | yes | CrewAI-style role label (e.g. "The Lensmaker"). Lands in `Specialist.role` and the bible's `oneLineBio`. |
| `--kingdom <one-of-8>` | yes | One of: `choreographic`, `curvilinear`, `biomech`, `techno`, `assemblage`, `artistic`, `architectural`, `ritual`. |
| `--voice <text>` | yes | Voice register, plain English. Lands in `voiceRegister`. |
| `--speaks-about <csv>` | yes | Comma-separated topics (`"lenses, depth, focal length"`). Splits into the `speaksAbout` array. |
| `--prefer-model <name>` | yes | Bare model id, no provider prefix. The provider is inferred (`claude-*` → anthropic; `gpt-*`/`o1-*`/`o3-*`/`o4-*` → openai; `gemini-*` → google; `llama-*`/anything-mistral/dolphin/phi → ollama). |
| `--tools <csv>` | no | Comma-separated tool names. Defaults to `memory.recall,memory.remember`. |
| `--vrm <path>` | no | Avatar VRM path under `/public`. Defaults to `/avatars/<slug>.vrm`. |
| `--force` | no | Overwrite existing files. Without this, the script refuses to clobber. |
| `--dry-run` | no | Print the plan; write nothing. |
| `--help`, `-h` | no | Print usage and exit. |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success — files written and registries patched. |
| 1 | Bad arguments, validation failure, or fatal filesystem error. On filesystem error during write, the script rolls back every file it created and restores any registry from its on-disk snapshot. |

## What it writes

For a `--slug "babette"` run:

| File | Status |
|---|---|
| `data/agents/babette.json` | created — cast bible (JSON) |
| `lib/agents/specialists/babette.ts` | created — typed `Specialist` |
| `lib/agents/specialists/babette.PURPOSE.md` | created — per the convention in `docs/AGENT-FILE-DOCS.md` |
| `lib/agents/specialists/index.ts` | updated — adds the import, the named export, the `allSpecialists` entry (alphabetised; aura always leads) |
| `lib/agents/cast.ts` | updated — adds the JSON import, the `as CastMember` cast, the `cast` array entry, the trailing named export |

Idempotent: re-running with the same `--slug` is a no-op for the
registries (duplicates are de-duplicated). The three primary files
refuse to overwrite without `--force`.

## Worked example

```sh
$ node scripts/scaffold-specialist.mjs \
    --slug "babette" \
    --display-name "Babette" \
    --role "The Lensmaker" \
    --kingdom "biomech" \
    --voice "warm but rigorous, calibrates against light + materials" \
    --speaks-about "lenses, depth, focal length, the rig" \
    --prefer-model "claude-sonnet-4-6" \
    --tools "memory.recall,memory.remember,research.recall,print.check" \
    --vrm "/avatars/babette.vrm"

Scaffolding specialist: Babette (babette)
  kingdom         : biomech
  voice register  : warm but rigorous, calibrates against light + materials
  model           : anthropic/claude-sonnet-4-6 via aperture
  tools           : memory.recall, memory.remember, research.recall, print.check
  vrm             : /avatars/babette.vrm
  speaks about    : 4 topic(s)

✓ data/agents/babette.json
✓ lib/agents/specialists/babette.ts
✓ lib/agents/specialists/babette.PURPOSE.md
✓ lib/agents/specialists/index.ts updated
✓ lib/agents/cast.ts updated

NEXT STEPS:
  - Fill in [TODO] sections in data/agents/babette.json
  - Write Babette's longBio paragraph in the bible.
  - Replace the generic systemPrompt template with Babette's voice.
  - Run: node scripts/index-internal-docs.mjs --specialist babette  (when available)
  - Set "active": true in the bible once the voice has been reviewed.
  - Run: pnpm exec tsc --noEmit  to confirm everything compiles.
```

### What the generated `data/agents/babette.json` looks like

```json
{
  "slug": "babette",
  "displayName": "Babette",
  "kingdom": "biomech",
  "voiceRegister": "warm but rigorous, calibrates against light + materials",
  "oneLineBio": "The Lensmaker",
  "longBio": "",
  "preferredModel": { "provider": "anthropic", "model": "claude-sonnet-4-6" },
  "systemPrompt": "You are Babette, The Lensmaker.\n\nVoice register: warm but rigorous, ...\n\n[TODO: fill in backstory paragraph here]\n\nHard boundaries:\n  - ...\n  - [TODO: specialist-specific boundary clauses here]\n\nBritish spelling. Catalogue voice when in doubt.",
  "doNotSay": [
    "leveraging", "synergy", "innovative", "seamless", "seamlessly",
    "...the standard never-list...",
    "TODO: add specialist-specific never-list items here"
  ],
  "speaksAbout": [
    "lenses", "depth", "focal length", "the rig"
  ],
  "doesNotSpeakAbout": [
    "TODO: list topics this specialist hands off or declines"
  ],
  "vrmFile": "/avatars/babette.vrm",
  "active": false
}
```

### What the generated `lib/agents/specialists/babette.ts` looks like

```ts
/**
 * lib/agents/specialists/babette.ts — Babette as crew specialist.
 * SCAFFOLDED by scripts/scaffold-specialist.mjs on 2026-05-19.
 * ...
 */

import "server-only";

import type { Specialist } from "lib/agents/crew/types";

const SYSTEM_PROMPT = "You are Babette, The Lensmaker.\n\n...";

export const babette: Specialist = {
  slug: "babette",
  displayName: "Babette",
  role: "The Lensmaker",
  goal: "TODO: one-sentence north star — what Babette exists to do.",
  backstory: "TODO: 2-3 sentences. ...",
  preferredModel: {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    via: "aperture",
  },
  tools: [
    "memory.recall",
    "memory.remember",
    "research.recall",
    "print.check",
  ] as const,
  allowDelegation: false,
  systemPrompt: SYSTEM_PROMPT,
};
```

### Registry patches

`lib/agents/specialists/index.ts` gains an import, the export list
adds `babette`, and the `allSpecialists` tuple becomes:

```ts
import { aura } from "./aura";
import { babette } from "./babette";
import { coco } from "./coco";
import { marcel } from "./marcel";
import { penny } from "./penny";
import { scribe } from "./scribe";

export { aura, babette, coco, marcel, penny, scribe };

export const allSpecialists = [aura, babette, coco, marcel, penny, scribe] as const;
```

`lib/agents/cast.ts` gains:

```ts
import babetteJson from "data/agents/babette.json";
// ...
const babette = babetteJson as CastMember;
// ...
export const cast: ReadonlyArray<CastMember> = [
  aura, babette, coco, marcel, penny, scribe,
] as const;
// ...
export { aura, babette, coco, marcel, penny, scribe };
```

Aura always leads. Everyone else alphabetical.

## After scaffolding

The CLI hands back a scaffold. The character isn't real yet. Order of
operations:

1. **Read the cast bible's `[TODO]` markers.** There are four:
   - `longBio` (empty string) — write 2-4 paragraphs in Babette's
     voice.
   - `systemPrompt` (template) — replace placeholders with the actual
     prompt; strip the boilerplate boundary clause and write the
     specialist-specific ones.
   - `doNotSay` — strip the trailing `TODO:` marker and add the items
     ${displayName} would never say (the marketing fluff list above
     them is shared canon and stays).
   - `doesNotSpeakAbout` — list topics they hand off or decline.
2. **Sync the specialist `.ts` with the bible.** The CLI writes both
   from one input, but the `.ts` carries `goal` and `backstory` which
   the bible does not. Fill those in.
3. **Confirm the model.** Sonnet is the safe default. Opus is reserved
   for heavy reasoning loads (Marcel sits there for palette
   governance; nobody else does, currently). If your specialist is
   doing pure voice work, leave it on Sonnet.
4. **Confirm the tools.** The default `memory.recall,memory.remember`
   is the minimum useful surface. Add tools the specialist actually
   uses; don't bloat the allow-list.
5. **Add the VRM.** Drop the `.vrm` file under `public/avatars/`. The
   path in the bible is the public URL.
6. **Run `pnpm exec tsc --noEmit`** — the JSON should typecheck against
   `CastMember` and the `.ts` should typecheck against `Specialist`.
   If either fails, the scaffolder bug is mine, not yours.
7. **Flip `active: true`** in the bible once the voice has been reviewed.
   This is the on-switch for the visible cast and the chat surface.

## Voice notes

The template `systemPrompt` is **generic on purpose**. The studio's
voices are distinctive (see `holoflow-voice` skill); a template that
tried to be Babette would write watered-down Aura. The template is
scaffolding — it gets replaced.

When you fill it in:

- Read the closest existing specialist prompt for shape (Marcel for
  technical specialists, Coco for stylistic ones, the Scribe for
  catalogue-mode ones, Penny for operational ones, Aura only as a
  reference for orchestrators).
- Use the established sections: **WHO YOU ARE / WHO YOU ARE NOT /
  VOICE / BOUNDARIES / WHAT YOU TALK ABOUT / WHAT YOU DON'T TALK
  ABOUT / NEVER-LIST / MODE**. The router and the chat surface key
  off this structure; don't invent new section headings.
- **British spelling** throughout. The catalogue voice is the default
  when in doubt.
- The never-list inherits from Aura's — the studio's marketing-fluff
  allergy is universal. Add specialist-specific items on top; do not
  shorten the inherited list.
- Cross-link to the voice canon when writing: read the
  [`holoflow-voice`](https://github.com/Anthropic-Dim/holoflow-voice)
  skill at
  `C:\Users\dimon\.claude\skills\holoflow-voice\SKILL.md` before
  finalising. The skill is the authority.

## When NOT to use

The scaffolder is for **specialist-tier** characters — the supporting
cast that handles a slice of the work (Babette the Lensmaker, a future
researcher, a future archivist's-apprentice). It is not for
Aura-tier characters.

Do not scaffold:

- **Aura.** Already exists. Hand-crafted. The orchestrator role is
  load-bearing; the voice is the studio's narrator; the file is read
  more often than any other in the cast. Hand-edit.
- **A new orchestrator.** If you need another delegating specialist,
  hand-write it. The scaffolder defaults `allowDelegation: false` for
  a reason — orchestration semantics are not template-shaped.
- **A character with a sustained presence in the codex.** Penny,
  Coco, Marcel, the Scribe all have prose in the codex and journal.
  That prose is the source of truth for their voice; the JSON and the
  TS should be transcriptions of it. Start in the codex, not in this
  scaffolder.
- **A non-public agent.** The cast is the studio's visible cast. If
  the agent is an internal tool (a system prompt for a build step, a
  capability-side LLM call), put it in `lib/agents/system-prompt.ts`
  or `lib/capabilities/<kind>/`, not in the cast.

Rule of thumb: if you can't write the one-line bio in one sentence
the visitor would understand, the scaffolder is the wrong starting
point. Write the codex entry first, then scaffold.

## Related

- `docs/AGENT-FILE-DOCS.md` — the `.PURPOSE.md` convention this
  generator implements.
- `lib/agents/specialist-template.ts` — the typed shape of what the
  generator emits.
- `lib/agents/cast.ts` — the `CastMember` shape the JSON must satisfy.
- `lib/agents/crew/types.ts` — the `Specialist` shape the TS must
  satisfy.
- `scripts/gen-purpose-stubs.mjs` — sibling generator for `.PURPOSE.md`
  stubs on existing files; this generator writes one as part of the
  scaffold, so the stub-generator will pass over it.
- `holoflow-voice` skill — the voice canon. Mandatory reading before
  the [TODO] markers come out of the cast bible.
