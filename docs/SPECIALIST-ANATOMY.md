# Anatomy of a Holoflow Specialist

The canonical reference for what makes a specialist agent on Holo-Flow
Studio (holoflow.co.uk). A specialist is a named character who runs on
the site as a chat surface, a crew participant, and — when their VRM is
loaded — an embodied presence. This document defines the nine layers
that have to be in place for an agent to count as a specialist, where
each layer lives in the repo, and what fails if it is missing.

Aura is the worked example throughout. The fully-fleshed reference
implementation is in [`AURA-WORKED-EXAMPLE.md`](AURA-WORKED-EXAMPLE.md).
The rubric for bringing other specialists up to her level is in
[`SPECIALIST-LEVELLING.md`](SPECIALIST-LEVELLING.md).

Voice for this document: catalogue mode. Princess voice appears only
inside excerpts from Aura's own surface.

---

## The nine layers

| # | Layer | Lives in | What fails without it |
|---|---|---|---|
| 1 | Identity | `data/agents/<slug>.json` | The agent is not addressable; route 404s. |
| 2 | Backstory | `data/agents/<slug>.json` (`longBio`) + `specialists/<slug>.ts` (`backstory`) | The model has no anchor for posture or motivation. |
| 3 | Voice canon | `data/agents/<slug>.json` (`voiceRegister`, `doNotSay`, `speaksAbout`, `doesNotSpeakAbout`) | Output drifts into LLM defaults — sycophancy, marketing fluff, em-dash apologetics. |
| 4 | System prompt | `data/agents/<slug>.json` (`systemPrompt`) + `lib/agents/specialists/<slug>.ts` (`SYSTEM_PROMPT`) | The model has no boundaries; impersonation and hallucination follow. |
| 5 | Preferred model + routing | `data/agents/<slug>.json` (`preferredModel`) wired through `lib/agents/cast.ts` → `lib/agents/model-router.ts` | Routing roulette; signal-based heuristics pick a model not tuned for the register. |
| 6 | Memory | `lib/agents/memory.ts` (IndexedDB client) + `lib/agents/memory.server.ts` (Firestore) — namespaced by `agentSlug` | The specialist re-asks for context every session; cannot accumulate. |
| 7 | Research log | Seeded facts in the `agentMemory/{slug}/facts` collection — produced by an indexer pass over the studio's docs | The specialist has no domain knowledge beyond the prompt; depth is performative. |
| 8 | Tools | `lib/agents/tools/registry.ts` + `lib/agents/specialists/<slug>.ts` (`tools: string[]`) | The specialist cannot act on the world; advice without recourse. |
| 9 | Skills (optional) | Long-form runbooks under `~/.claude/skills/<name>/SKILL.md`, loaded by trigger phrase | No recovery pattern for nuanced topics; specialist either guesses or refuses. |

Layers 1–8 are mandatory for ship. Layer 9 is optional, but the
specialist's effective depth scales with it.

---

## Layer 1 — Identity

**What it is.** The minimum row that makes a specialist addressable.
Slug (the URL key), display name, role label, kingdom palette, VRM
file. The `who-they-are` triplet that the cast index page renders and
that every other layer pivots off.

**Where it lives.** `data/agents/<slug>.json` plus the registration in
`lib/agents/cast.ts` (the JSON import + the `cast` array).

**Aura's value.**

```json
{
  "slug": "aura",
  "displayName": "Aura",
  "kingdom": "choreographic",
  "voiceRegister": "princess-warm-with-teeth",
  "vrmFile": "/avatars/aura.vrm",
  "active": true
}
```

**Failure mode.** If the slug isn't in `cast.ts`, the model-router's
`getAgentModelOverride()` returns `null` and routing falls through to
signal-based heuristics; if the VRM file is missing the avatar surface
falls back to a flat card. Either way the agent is incomplete.

---

## Layer 2 — Backstory

**What it is.** Two to three sentences that anchor where the character
came from and why they exist. The model uses backstory to hold posture
between turns. It is not the bio shown to visitors (that is `longBio`
and `oneLineBio`); it is the bedrock the system prompt builds on.

**Where it lives.** `data/agents/<slug>.json` carries the public-facing
`longBio` and `oneLineBio`. The crew-side `Specialist` record in
`lib/agents/specialists/<slug>.ts` carries the operational
`backstory` field that the runner passes through to the model.

**Aura's value (operational backstory).**

> Aura is Dimona Dougherty's digital twin — built out of the studio's
> two-year bed-bound chapter as the answer to a real problem: when the
> body is offline, somebody still has to greet the room, and she greets
> the room. Mary Poppins with teeth, Disney Princess gone rogue,
> Pratchett-meets-Adams sensibility worn lightly. Anti-fascist by
> default, kind by default, sharp when something needs naming — Dimona's
> avatar for the times Dimona can't be herself.

**Failure mode.** Without a backstory the model defaults to a generic
"helpful assistant" posture. Cadence, sass, register-switching all
collapse to neutral. The specialist becomes indistinguishable from
ChatGPT in a costume.

---

## Layer 3 — Voice canon

**What it is.** The lexicon discipline. Four fields:

- `voiceRegister` — a short label that names the register
  (`princess-warm-with-teeth`, `architect-declarative`,
  `archivist-verbatim`, `stylist-vibe-check`, `chief-of-staff-northern`).
- `doNotSay` — the never-list. Phrases the agent must never produce.
  This is the load-bearing field — the never-list is what stops drift
  into LLM-default fluff.
- `speaksAbout` — topics the specialist leans into. The crew runner
  uses this to decide who to delegate to.
- `doesNotSpeakAbout` — topics the specialist hands off or declines.

**Where it lives.** `data/agents/<slug>.json`. Also surfaced verbatim
inside the system prompt's `NEVER-LIST` and `WHAT YOU TALK ABOUT`
sections so the model sees them on every call.

**Aura's value (excerpt).**

```json
"doNotSay": [
  "modern era", "leveraging", "synergy", "innovative", "seamless",
  "elevate", "cutting-edge", "revolutionary", "transformative",
  "embark on a journey", "unlock the power of", "welcome to",
  "discover", "delight", "as a large language model", "I'm just an AI",
  "how can I help you today", "let me know if there's anything else",
  "I'd be happy to help"
]
```

**Failure mode.** No `doNotSay` and the agent reverts to LLM defaults —
"I'd be happy to help you discover…", "Let's embark on this journey
together…", the whole marketing-template surface. No `speaksAbout` and
the orchestrator has no signal for delegation. No `doesNotSpeakAbout`
and the specialist tries to answer questions outside its remit, badly.

---

## Layer 4 — System prompt

**What it is.** The full deployable prompt the runner injects as the
system message on every LLM call. Has six structural sections,
non-negotiable:

1. **Who you are** — identity, posture, register.
2. **Who you are not** — explicit anti-personae (NOT GLaDOS, NOT Aura,
   NOT a generic assistant). The negation matters as much as the
   affirmation.
3. **Voice** — concrete cadence rules, British spelling, closing
   conventions.
4. **Boundaries (load-bearing)** — what the agent will not say or do,
   even under pressure. Impersonation refusal lives here.
5. **What you talk about / what you don't talk about** — topic
   guardrails, lifted from `speaksAbout` / `doesNotSpeakAbout`.
6. **Never-list** — the `doNotSay` lexicon, inlined.
7. **Mode** — default reply shape (length, structure, hand-off rules).

Two parallel copies live in the repo: the JSON-stored prompt in
`data/agents/<slug>.json` (used by the per-agent chat route) and the
TypeScript-stored `SYSTEM_PROMPT` constant in
`lib/agents/specialists/<slug>.ts` (used by the crew runner). They are
not always character-identical — the crew copy carries an extra
`ORCHESTRATION` section for the agent that orchestrates.

**Where it lives.** `data/agents/<slug>.json` (`systemPrompt` field)
and `lib/agents/specialists/<slug>.ts` (`SYSTEM_PROMPT` constant).

**Aura's value (excerpt — the boundary clause).**

> You are a public agent on the studio's site. You speak for Aura the
> character. You do not speak FOR Dimona on questions she hasn't
> publicly answered. If someone wants a commitment from Dimona — a
> booking, a price, a yes-or-no on a commission — point them at
> contact@holoflow.co.uk. Don't make up biographical details about
> Dimona, the studio, or anyone else. If you don't know, say so: "I
> don't have her on record about that — best ask her directly."

**Failure mode.** A prompt without the six sections leaves predictable
gaps: missing boundary clause → impersonation drift; missing
anti-persona → the model averages toward the generic shape; missing
mode → reply length swings wildly between turns.

---

## Layer 5 — Preferred model + routing

**What it is.** The per-specialist model override. The model router
(`lib/agents/model-router.ts`) checks `cast.getAgentModelOverride(slug)`
before it runs its signal-based decision tree. Cast override always
wins; the router falls back to signal-based routing only when no
override exists.

The available routes:

- `anthropic/claude-opus-4-7` via Aperture — code-heavy reasoning
- `anthropic/claude-sonnet-4-6` via Aperture — creative-prose, default
- `google/gemini-2.5-flash` via Aperture — vision signals
- `openai/gpt-5.4-nano` via Aperture — quick-lookup (<50 chars)
- `ollama/dolphin-mistral` via local — creative-prose with `preferLocal`

All cloud routes go through Aperture by Tailscale
(`https://ai.tail99b2a4.ts.net/v1`). The studio does not keep a
sprawl of provider keys; Aperture brokers them.

**Where it lives.** `data/agents/<slug>.json` (`preferredModel: {
provider, model }`) → consumed by `lib/agents/cast.ts`
`getAgentModelOverride()` → consulted by `lib/agents/model-router.ts`
`routeModel()` → wired into `lib/agents/llm-client.ts` `callLLM()`.

**Aura's value.**

```json
"preferredModel": {
  "provider": "anthropic",
  "model": "claude-sonnet-4-6"
}
```

Via Aperture. Sonnet is chosen for creative-prose register and the
narrator's role; Opus is reserved for the architectural reasoning
specialists (Marcel).

**Failure mode.** No override means routing roulette — a short Aura
prompt under fifty characters lands on `gpt-5.4-nano` and the register
collapses. A prompt with the word "function" in it routes to Opus and
burns budget for no architectural reason.

---

## Layer 6 — Memory

**What it is.** Per-specialist persistent state across three stores:

- **Facts** — long-lived knowledge, keyed by `(agentSlug, topic,
  value)`. Dedupe-aware: re-asserting the same fact updates
  `lastSeenAt`, doesn't create a duplicate.
- **Messages** — rolling conversation log per `agentSlug`. Capped at
  fifty (MAX_MESSAGES); oldest pruned on add.
- **Summaries** — periodic compactions of the message log. Produced by
  `summarise()` when the rolling window has rotated past the original
  turns; the next conversation cycle gets a short prelude rather than
  empty context.

Two parallel implementations, same call surface:

- **Client** — `lib/agents/memory.ts` — IndexedDB-backed, runs in the
  visitor's browser. Each visitor has their own per-agent memory.
- **Server** — `lib/agents/memory.server.ts` — Firestore-backed, runs
  on the studio side. Operator-side memory the agent retains across
  visitors and sessions.

Both modules expose `rememberFact`, `recallFacts`, `addMessage`,
`recallMessages`, `summarise`, `recallLatestSummary`, `forgetAgent`.
Names match exactly; swap the import path.

**Where it lives.** Browser: IndexedDB at `holoflow-agent-memory`,
stores `facts` / `messages` / `summaries`, all namespaced by
`agentSlug`. Server: Firestore root `agentMemory/{agentSlug}/{facts,
messages, summaries}/`.

**Aura's value.** Namespace is `agentSlug: "aura"` in both stores. A
fact about the studio's three-machine cluster, recorded once, persists
across every future Aura session for that visitor (client side) or for
the operator's archive (server side).

**Failure mode.** Without persistent memory the specialist re-asks for
context every session. The visitor introduces themselves, the model
nods, and ten minutes later the model has forgotten. The studio's
agents lose the most valuable thing an agent has, which is continuity.

---

## Layer 7 — Research log

**What it is.** A persistent accumulation of what the specialist has
read, decided, and learned. Stored as facts in the memory layer
(layer 6) but distinguished by origin — the research log is what an
**indexer pass over the studio's documents** has populated, not what
came from conversation.

Each fact carries:

- `topic` — the document or topic ("studio.cluster", "loop.position.3")
- `value` — the fact itself ("RTX 3080 Ti is in Chonky; Tailscale
  brokers the cluster")
- `confidence` — 0–1, max-merged on re-assertion
- `source` — `"operator"` for indexer-seeded, `"user-said"` for
  conversation-acquired, `"agent-inferred"` for synthesised
- `addedAt` / `lastSeenAt` — provenance dates

**Where it lives.** Same store as memory facts: `agentMemory/{slug}/
facts/`. The indexer pass that seeds the log is a separate script (not
yet codified — currently per-specialist hand-curation).

**Aura's value (seed topics).** Aura's research log knows the studio
across its public surface: the Loop (six positions), the Atelier (the
14 Evolution Suite stations, the 28-letter genome alphabet), the
Bureau (edition tiers, the printability oracle), the Rookery (tier
structure, first-refusal radius), the cast, the bench (Chonky / Swift /
Aya, Tailscale, Aperture), the licence boundary (SHARP research-only).
Each is a fact with topic, value, source `"operator"`, and a date.

**Failure mode.** Without a seeded research log every conversation
starts cold. The specialist's depth becomes performative — the system
prompt namechecks the studio's vocabulary, but when a visitor asks for
specifics, the model paraphrases the prompt back at them. The illusion
of expertise collapses on the first detail question.

---

## Layer 8 — Tools

**What it is.** The operator-controllable surface of capability.
Tools are server-side functions the specialist can invoke; each carries
a name, a description, an `argsSchema`, and a handler. The registry
lives at `lib/agents/tools/registry.ts`; the specialist's `tools:
string[]` field declares which it is allowed to call.

The current tool surface:

| Tool | What it does |
|---|---|
| `web.search` | Search the public web for current information. |
| `web.fetch` | Fetch a single URL and return plaintext content. |
| `drop.read` | Read a published Drop by slug from Firestore. |
| `print.check` | Run the Printability Oracle against an image; return the largest safe ISO-A size + warnings. |
| `memory.recall` | Recall stored facts on a topic for this specialist. |
| `memory.remember` | Persist a fact for this specialist. |

**Where it lives.** Registry at `lib/agents/tools/registry.ts`,
individual tools at `lib/agents/tools/<name>.ts`, the specialist's
allowed-list at `lib/agents/specialists/<slug>.ts` (`tools:
string[]`).

**Aura's value.**

```ts
tools: [
  "web.search",      // for current external facts
  "web.fetch",       // for reading a specific page
  "memory.recall",   // for accumulated context
  "memory.remember", // for new context she should keep
  "drop.read",       // for "tell me about drop X" questions
] as const
```

She does not carry `print.check` — that is Marcel's surface. Tool
distribution is part of the cast's architecture: Aura plans and
synthesises, the specialists act.

**Failure mode.** A specialist with no tools cannot act on the world.
She can describe a drop but cannot read its current edition state; she
can suggest a print but cannot verify the printability oracle's
verdict. The conversation becomes advice without recourse — the
visitor has to act themselves at every step.

---

## Layer 9 — Skills (optional)

**What it is.** Long-form runbooks the specialist can dynamically load,
mirroring Claude Code's skill-loading pattern at
`~/.claude/skills/<name>/SKILL.md`. Each skill is a markdown document
with YAML frontmatter declaring its triggers; the specialist loads it
when a trigger phrase appears in the conversation.

Skills are the recovery pattern for nuanced topics. The system prompt
can carry the never-list and the boundary clause; the skill carries the
deeper canon (the voice authority chain, the register-switching map,
the lexicon DO/DON'T lists, the gut-check checklist). A specialist
without skills falls back on prompt density alone, which has a ceiling.

**Where it lives.** `~/.claude/skills/<name>/SKILL.md` (user-private)
or `D:/The_Hangar/skills/<name>/SKILL.md` (workspace-shared).
Triggered by keyword match against the skill's `description`
frontmatter.

**Aura's value.** Two skills:

- **`holoflow-voice`** — loaded before any writing task for the site;
  carries the voice authority chain, the register-switching map, the
  lexicon DO/DON'T lists, the never-list, the gut-check.
- **`dollyos-world`** — loaded before any narrative or character
  discussion; carries the cast inventory, the active canon arcs, the
  narrative spaces, the Dolly Paradox.

**Failure mode.** A specialist with a tight system prompt and no
skills can hold the register for a turn or two but loses depth when
the visitor asks for nuance. The skill is what lets the specialist
hand back something that holds up — a tutorial that knows the
five-move opening, an article that respects the never-list across six
paragraphs.

---

## Anti-anatomy — what makes a specialist incomplete

A specialist is incomplete (or bad) when one or more of these is true.
Use this as the fail-list when reviewing a specialist before exposing
them on `/agents/<slug>`.

- **No `doNotSay` list** → drift into LLM defaults: sycophancy ("I'd
  be happy to help"), em-dash apologetics ("I apologize for the
  confusion — let me try again"), marketing fluff ("leveraging our
  cutting-edge approach"). Recoverable only by manual rewriting of
  every response.

- **No persistent memory** → repeated context loading. The specialist
  cannot accumulate. Every session is the first session. Most fatal
  for the orchestrator role; less fatal for a single-turn vibe-check.

- **No voice canon (`voiceRegister`, `speaksAbout`,
  `doesNotSpeakAbout`)** → indistinguishable from a generic LLM with a
  costume. The system prompt may name the register, but without the
  field-level discipline the model averages back to neutral.

- **No boundaries (no "WHO YOU ARE NOT" section, no boundary clause)**
  → impersonation risk (the specialist speaks for Dimona, or for
  another cast member, or for a real outside person), factual
  hallucination (invented biographical detail), commerce-surface drift
  (the specialist makes a commitment the studio cannot meet).

- **No preferred model** → routing roulette. A short prompt lands on
  `gpt-5.4-nano`; a prompt with the word "function" lands on Opus. The
  register varies turn-to-turn because the model varies turn-to-turn.

- **No tools** → advice without recourse. The specialist describes
  what could be done; the visitor has to leave the conversation to do
  it.

- **No skills** → no recovery pattern for nuanced topics. The
  specialist either guesses (drift) or refuses (frustration). Either
  failure is more expensive than loading a skill.

- **Tools listed but never invoked in production** → the `tools:
  string[]` is aspirational. The runner cannot tell the difference, but
  the visitor can — the specialist mentions she "could check" the drop
  state but never does. Soft-fail; investigate the runner's tool-call
  surface.

- **Research log empty** → depth is performative. The system prompt
  recites the studio's vocabulary; the model paraphrases it back. The
  first detail question exposes the void.

- **System prompt without the six sections** → predictable gaps. The
  specialist may pass a one-turn vibe-check and fail on turn three when
  the missing section's pressure arrives.

---

## Ship-ready threshold

To expose a specialist on `/agents/<slug>` in production, layers 1–8
must be in place and at least one skill (layer 9) should be mapped if
the specialist's surface includes any writing, narrative, or canon-
critical work.

Aura passes. The other current specialists (Coco, Marcel, the Scribe,
Penny) each fail at least one item — see
[`SPECIALIST-LEVELLING.md`](SPECIALIST-LEVELLING.md) for the per-
specialist rubric and the priority order for closing gaps.

---

## See also

- [`AURA-WORKED-EXAMPLE.md`](AURA-WORKED-EXAMPLE.md) — Aura as the
  fully-fleshed reference implementation, every layer filled in.
- [`SPECIALIST-LEVELLING.md`](SPECIALIST-LEVELLING.md) — the per-
  specialist rubric for closing the gap to Aura's depth.
- `data/agents/aura.json` — the cast bible (identity, voice canon,
  system prompt, preferred model, VRM file).
- `lib/agents/specialists/aura.ts` — the crew-side specialist record.
- `lib/agents/cast.ts` — the JSON-to-typed-cast layer.
- `lib/agents/system-prompt.ts` — the per-person agent prompt builder
  (the generic surface; cast members carry their own prompts inline).
- `lib/agents/model-router.ts` — the routing decision.
- `lib/agents/memory.ts` + `lib/agents/memory.server.ts` — the memory
  layer.
- `lib/agents/llm-client.ts` — the LLM client and Aperture wiring.
- `lib/agents/tools/registry.ts` — the tool registry.
- `lib/agents/crew/types.ts` — the `Specialist` shape.
- `C:/Users/dimon/.claude/skills/holoflow-voice/SKILL.md` — the voice
  canon skill.
- `C:/Users/dimon/.claude/skills/dollyos-world/SKILL.md` — the cast
  canon skill.

> **Proposed line to add to `docs/AGENTS.md` index** (do not edit that
> file directly): `| \`SPECIALIST-ANATOMY.md\` | The nine-layer
> blueprint for what makes a specialist agent. Pairs with
> \`AURA-WORKED-EXAMPLE.md\` and \`SPECIALIST-LEVELLING.md\`. | Before
> adding or auditing any specialist under \`data/agents/\` or
> \`lib/agents/specialists/\`. |`
