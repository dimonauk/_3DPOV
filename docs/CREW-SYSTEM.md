# Crew System

The runbook for the studio's small multi-agent layer at
`lib/agents/`. Read this before adding a specialist, wiring a new
tool, or stitching the crew into a fresh route.

This file is the developer-facing companion to the code. The voice
for the cast paragraphs follows the `holoflow-voice` skill — Princess
register for the people, catalogue register for the rest.

---

## The cast

Five specialists. Each one has a slug, a preferred model, a tool
allow-list, and a system prompt rendered from
`data/agents/<slug>.json` plus the cast bible. The runner reads
their `preferredModel` verbatim — no re-routing at dispatch time.

**Aura — the Architect.** The studio's Void Princess and the one
the visitor most often meets. Talks in the third-person except when
the moment forces a sudden first-person. Holds the lineage, the
worldview, the spinny-glowy long view. When the crew has a task that
needs the studio's voice and shape held all the way through, she is
the orchestrator. Slug `aura`. Model: Claude Opus 4.7 via Aperture.

**Marcel — the Bench Hand.** Calls the bench what it is. STL, GLB,
DPI, slicer profile, gantry, gcode — Marcel speaks in nouns and
verbs, no flourish. The right specialist for printability checks,
fabrication notes, bureau line-items, anything where the answer is
a number and a unit. Slug `marcel`. Model: Claude Sonnet 4.6 via
Aperture.

**Coco — the Curator.** The catalogue's eye. Tone notes for product
copy, taxonomy calls (kingdom-palette, fitness axes), the difference
between an article and a journal entry. Coco is the one who notices
when a drop is being filed under the wrong room. Slug `coco`. Model:
Claude Sonnet 4.6 via Aperture.

**The Scribe — the Lineage Keeper.** Holds the cast canon, the
parentage of every gene, the line on what's been said in which
register. When the crew needs to remember what it already wrote, or
to keep a new piece in continuity with the old, the Scribe is the
consult. Slug `scribe`. Model: Claude Sonnet 4.6 via Aperture.

**Penny — the Quick Lookup.** Short, cheap, fast. Times, dates,
ISO units, the spelling of a word, the URL of a thing the studio
has already published. Penny is the one the orchestrator delegates
to when the question is "what" rather than "how." Slug `penny`.
Model: GPT-5.4-nano via Aperture (or Ollama locally when offline).

The full bibles live in `data/agents/*.json`. The system prompts are
read straight off those files by `lib/agents/cast.ts`. Edit the JSON
to change the voice; do not edit the prompt at the call site.

---

## The four layers

```
                ┌────────────────────────────────┐
   layer 1      │  data/agents/*.json + cast.ts  │   the cast bible
   specialists  │  one Specialist per row        │   (voice + model + tools allow-list)
                └────────────────┬───────────────┘
                                 │
                ┌────────────────▼───────────────┐
   layer 2      │  lib/agents/tools/*.ts         │   the tool kit
   tools        │  one Tool per file             │   (name, description, argsSchema, run())
                └────────────────┬───────────────┘
                                 │
                ┌────────────────▼───────────────┐
   layer 3      │  lib/agents/loop/react-loop.ts │   the engine
   engine       │  + lib/agents/crew/runner.ts*  │   (single-specialist + multi-specialist)
                └────────────────┬───────────────┘
                                 │
                ┌────────────────▼───────────────┐
   layer 4      │  app/api/agents/*/route.ts     │   the surface
   surfaces     │  + app/agents/crew/page.tsx    │   (routes, scripts, admin UI)
                │  + scripts/crew-run.mjs        │
                └────────────────────────────────┘

   * crew runner lands in a parallel task — see "Roadmap" below.
```

Two things to notice:

1. **Specialists never touch tools directly.** A specialist owns an
   allow-list of tool _names_; the registry at the engine layer is
   what actually hands the handler over.
2. **The engine layer is two pieces.** `react-loop.ts` runs one
   specialist on one task. `crew/runner.ts` (in flight) walks a
   planning specialist through delegations to other specialists,
   each of whom runs their own ReAct loop. That separation is what
   keeps the loop reusable for `/api/agents/[slug]/chat`.

---

## File map

| Path | Layer | Role |
|---|---|---|
| `data/agents/<slug>.json` | 1 | One row of the cast bible. Voice + preferred model + tools allow-list. |
| `lib/agents/cast.ts` | 1 | Loads each JSON file, types it as `CastMember`, exposes `getAgentModelOverride()` for the router. |
| `lib/agents/crew/types.ts` | 1 | `Specialist`, `Task`, `CrewStep`, `CrewRun`, `RunCrewInput`. Pure types, no I/O. |
| `lib/agents/tools/types.ts` | 2 | `Tool`, `ToolRegistry`, `ToolResult`, `ToolContext`. Pure types. |
| `lib/agents/tools/web-search.ts` | 2 | Public-web search via Serper or DuckDuckGo. |
| `lib/agents/tools/web-fetch.ts` | 2 | Fetch a URL and return cleaned text. |
| `lib/agents/tools/memory.ts` | 2 | `memory.recall`, `memory.remember` — Firestore-backed. |
| `lib/agents/tools/drop-read.ts` | 2 | Read drop metadata + bake artefacts. |
| `lib/agents/tools/print-check.ts` | 2 | Run printability checks on an STL/GLB. |
| `lib/agents/llm-client.ts` | 3 | The `callLLM` adapter — Aperture / direct / local. |
| `lib/agents/model-router.ts` | 3 | Per-prompt model choice (signal-based, cast-override-first). |
| `lib/agents/loop/react-loop.ts` | 3 | The single-specialist ReAct loop. |
| `lib/agents/crew/runner.ts` _(planned)_ | 3 | Multi-specialist orchestration (`runCrew`). |
| `lib/agents/memory.ts` | 3 | Client-side IndexedDB memory (browser surfaces). |
| `lib/agents/memory.server.ts` | 3 | Firestore-backed mirror (server surfaces). |
| `app/api/agents/[slug]/chat/route.ts` | 4 | Visitor-facing chat surface, one cast member at a time. |
| `app/agents/crew/page.tsx` _(planned)_ | 4 | Admin UI for kicking off a crew run + watching the trail. |
| `scripts/crew-run.mjs` | 4 | One-shot CLI for operator smoke-tests + CI. |

---

## How to add a new specialist

1. **Write the cast row.** Create `data/agents/<slug>.json` mirroring
   the `CastMember` shape in `lib/agents/cast.ts`. Required fields:
   `slug`, `displayName`, `kingdom`, `voiceRegister`, `oneLineBio`,
   `longBio`, `preferredModel`, `systemPrompt`, `doNotSay`,
   `speaksAbout`, `doesNotSpeakAbout`, `vrmFile`, `active`.
2. **Register the import.** Add a line to `lib/agents/cast.ts`:
   ```ts
   import newcomerJson from "data/agents/newcomer.json";
   const newcomer = newcomerJson as CastMember;
   export const cast = [aura, coco, marcel, scribe, penny, newcomer] as const;
   export { newcomer };
   ```
3. **Decide the tool allow-list.** In the JSON, set the specialist's
   `tools` array. The runner ignores any tool name that isn't in the
   registry — safe to list aspirational ones.
4. **Decide whether they orchestrate.** If they delegate to other
   specialists, `allowDelegation: true`. Most don't.
5. **Voice-check.** Run the cast member through one or two real
   prompts via `scripts/crew-run.mjs --assignTo <slug>` and compare
   the output against the `voiceRegister` field. If it drifts, the
   `systemPrompt` is wrong, not the model.

---

## How to add a new tool

1. **Decide the name.** Dot-namespaced: `viz.thumbnail`, `bench.bake`,
   `drop.read`. The namespace becomes its own grouping in the
   specialist's catalogue.
2. **Write the file.** New file under `lib/agents/tools/<name>.ts`.
   Export a `const myTool: Tool = { name, description, argsSchema, run }`.
   `run` MUST return a `ToolResult` and MUST NOT throw — wrap every
   failure in `{ ok: false, error }`. Description is one line, plain
   English; this is what the specialist actually reads.
3. **Schema is a string, not a JSON-schema object.** The crew renders
   it directly into the system prompt, so it's tuned for a model
   reader, not a validator. Show the keys, their types, and which are
   required.
4. **Wire it into the registry.** Wherever the calling route builds
   its `ToolRegistry` (a `ReadonlyMap<string, Tool>`), add a line:
   ```ts
   tools.set(myTool.name, myTool);
   ```
5. **Grant it to a specialist.** Add the tool's name to that
   specialist's `tools` array in `data/agents/<slug>.json`. A
   specialist that doesn't have a tool in its allow-list cannot
   invoke it, even if the registry exposes it.
6. **Test once.** Run `node scripts/crew-run.mjs "<task that needs
   the tool>"` and confirm the trail shows the tool call resolving.

---

## How to run the crew from a route handler

```ts
// app/api/internal/draft-description/route.ts
import { NextResponse } from "next/server";
import { runCrew } from "lib/agents/crew/runner"; // planned
import { allSpecialists } from "lib/agents/crew/specialists"; // planned
import { buildToolRegistry } from "lib/agents/tools/registry"; // planned

export async function POST(req: Request) {
  const { task } = (await req.json()) as { task: string };

  const run = await runCrew({
    task: {
      id: crypto.randomUUID(),
      description: task,
    },
    specialists: allSpecialists(),
    orchestrator: "aura",
    tools: buildToolRegistry({ requestUrl: req.url }),
    maxIterations: 5,
    timeoutMs: 60_000,
  });

  return NextResponse.json(run);
}
```

The result is a `CrewRun` (see `lib/agents/crew/types.ts`) —
serialisable, includes the full trail, includes aggregate token
usage. Return it as-is for admin surfaces; strip the trail before
returning to the public.

A working analogue is in flight at `app/agents/crew/page.tsx`. Until
that lands, the route shape above is the right shape to copy from.

---

## How to run from a script

`scripts/crew-run.mjs` is the operator's smoke-test:

```bash
node scripts/crew-run.mjs "Draft a 200-word product description for the bench-printed wall relief at /drops/<slug>"
```

It prints the step-by-step trail to stdout, writes the final answer
to `tmp/crew-runs/<task-id>.md`, and logs token usage at the end.
Zero deps beyond `lib/agents/*`. ESM, runs straight under Node 20+.

For one specialist, no orchestrator:

```bash
node scripts/crew-run.mjs --assignTo marcel "Check the printability of /drops/aurora-relief/baked.stl"
```

That short-circuits the planner and routes the whole task through
one ReAct loop. Useful when you want to test a single specialist's
system prompt or tool integration in isolation.

---

## Env vars

| Var | Provider | Where used |
|---|---|---|
| `APERTURE_API_KEY` | Aperture by Tailscale | `via: "aperture"` in `callLLM`. Default path for every cast member. |
| `ANTHROPIC_API_KEY` | Anthropic direct | `via: "direct"`, `provider: "anthropic"`. Escape hatch when Aperture is down. |
| `OPENAI_API_KEY` | OpenAI direct | `via: "direct"`, `provider: "openai"`. Same. |
| `GOOGLE_AI_API_KEY` | Google Gemini direct | `via: "direct"`, `provider: "google"`. Same. |
| `OLLAMA_BASE_URL` | Local Ollama | `via: "local"`, or the fallback after a 5xx / network error. Defaults to `http://localhost:11434`. |
| `SERPER_API_KEY` | Serper (web search) | `web.search` tool. When absent, falls back to DuckDuckGo. |

Aperture is the canonical path. The direct keys are for the
fallback chain only — do not key new code off them.

---

## Cost considerations

Pick the model that matches the work, not the model that matches
the agent.

| Work | Model | Why |
|---|---|---|
| Multi-step reasoning, long-form drafting, anything voice-load-bearing (Aura) | Claude Opus 4.7 | The only one whose register holds for 600+ words. Expensive — only orchestrators and Aura. |
| Bench-side technicals (Marcel), catalogue calls (Coco), Scribe lineage work | Claude Sonnet 4.6 | The default. Cheaper than Opus by ~3x, equal on bounded tasks. |
| Quick lookups, single-sentence answers, taxonomic yes/nos (Penny) | GPT-5.4-nano | Cheapest cloud option. Use only when the answer is a noun. |
| Local-only drafts, dev iteration, anything with `preferLocal: true` | Ollama `qwen3:8b` or `dolphin-mistral` | Free, slow, voice drifts on long-form. Fine for the Bench Hand's bullet lists. |

Heuristic: if the task description is longer than the expected
answer, you can step down a tier. If the task is shorter than the
answer, do not.

---

## Known limits

- **No streaming.** `callLLM` blocks for the full completion. The
  crew layer therefore blocks for the full run. Acceptable for the
  current scripts and admin routes; not acceptable for a visitor-
  facing chat surface. Streaming is a roadmap item, see below.
- **In-memory state only.** A crew run produces a `CrewRun` object
  and returns it. There is no persistence yet — no run log, no
  resume, no inspector. Capture the response if you need it.
- **No parallel specialist fan-out.** The orchestrator delegates
  sequentially. If two subtasks are independent, they still run
  one after the other. Fan-out is on the roadmap.
- **Tools are pull, not push.** A tool can return a result, but
  cannot emit a side-effect event the rest of the crew sees. If you
  need cross-specialist signalling, write to memory and have the
  next specialist recall it.
- **ReAct format is best-effort.** Small local models drift off
  the `Thought:` / `Action:` / `Args:` format on long loops. The
  loop tolerates malformed turns with a corrective observation and
  one retry — past that, the iteration cap will fire.

---

## Roadmap

- **Crew runner.** The multi-specialist orchestrator (`runCrew`)
  with plan-step / delegate-step / synthesise-step trail. In flight.
- **Delegation graph visualisation.** Admin UI at
  `/admin/agents/crew/runs/<run-id>` that renders the trail as a
  call graph. Pair with the streaming work below.
- **Streaming.** Server-sent events end-to-end: the LLM streams to
  the loop, the loop streams the trail to the route, the route
  streams to the admin page. Plays nicely with the visualisation.
- **Qdrant memory upgrade.** Drop the IndexedDB / Firestore split
  for a Qdrant-backed vector store, following the Mem0 / Oceanic
  Recall pattern documented at
  `D:\The_Hangar\packages\dolly-extension\MEMORY_LATTICE_DOCUMENTATION.md`.
  Same `recall` / `remember` tool surface; semantic search underneath.
- **Parallel specialist fan-out.** Let the orchestrator dispatch
  two independent subtasks concurrently. Easier than it sounds once
  the trail is a graph and not a list.
- **Cost-aware routing.** A `cost_budget_tokens` field on `Task`
  that demotes the orchestrator's model when the running total
  approaches the cap.

---

## Cross-references

- The voice the cast paragraphs follow: `holoflow-voice` skill at
  `C:\Users\dimon\.claude\skills\holoflow-voice\SKILL.md`.
- The gateway every model call routes through: `aperture-by-tailscale`
  skill (and `lib/agents/llm-client.ts`).
- The signal-based router that picks a model when no override fires:
  `lib/agents/model-router.ts`.
- The single-specialist engine: `lib/agents/loop/react-loop.ts`.
- The crew types: `lib/agents/crew/types.ts`.
- The crew admin route (planned): `app/agents/crew/page.tsx`.
- The CLI: `scripts/crew-run.mjs`.

When adding the cross-link from `AGENTS.md`, propose this line under
the "Agents + AI" section:

```md
- **Crew system runbook** → `docs/CREW-SYSTEM.md`. Read before
  adding a specialist or wiring a tool into the cast.
```
