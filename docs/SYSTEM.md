# SYSTEM — the Holoflow agent platform

**Status:** live. **Updated:** 2026-05-19.
**Scope:** what runs Aura and the cast on holoflow.co.uk, end to end.

This is the architectural document. It says what was built, where it
lives, why each layer exists, and how to extend it without breaking it.
For the *prose* canon of who any character is, see the four canon docs
(AURA / DIMONA / CAST / REHAB). For *how a Claude session should find
its way around the repo*, see `AGENTS.md`. This document is the wiring
diagram that sits behind both.

---

## Table of contents

1. [The shape of the thing](#the-shape-of-the-thing)
2. [The four canons](#the-four-canons)
3. [The cast — 16 characters, 4 tiers](#the-cast)
4. [Runtime architecture](#runtime-architecture)
   - Layer 1: Bibles — `lib/cast/`
   - Layer 2: Capabilities — `lib/capabilities/`
   - Layer 3: State — `lib/state/`
   - Layer 4: Gateway — `lib/llm/gateway.ts`
   - Layer 5: Crew schema — `lib/agents/`
5. [Capabilities catalogue](#capabilities-catalogue)
6. [Skills library](#skills-library)
7. [How to extend](#how-to-extend)
8. [What was deliberately NOT built](#what-was-deliberately-not-built)
9. [Migration history](#migration-history)
10. [Glossary](#glossary)

---

## The shape of the thing

Holoflow Studio is a one-person creative studio that ships visual,
3D-printed, and interactive work. The website at holoflow.co.uk is
its public face. Aura is its first-person narrator — a 22-year-old
Void Princess who is Dolly's digital twin and the maker's avatar.
She has a cast of 15 others (named and unnamed) who together hold
the Charming Academy + Selfridges-adjacent world the studio narrates.

The **platform** sitting underneath that is the subject of this doc.
It has five concentric layers:

1. **Bibles** — typed character data, one TypeScript file per cast
   member. The voice canon in machine-readable form.
2. **Capabilities** — pure functional atoms registered in a
   discovery surface. `agent.dialogue`, `agent.banter`,
   `agent.memory`, `agent.cast-roster`, plus the wider studio
   capabilities (vrm.load, audio.tts, viz.attractor, etc.).
3. **State slices** — Zustand stores. Capabilities read and write
   them; capabilities themselves never own state.
4. **LLM gateway** — a thin client over the Vercel AI Gateway that
   speaks OpenAI-compatible to whichever provider the model string
   points at.
5. **Crew schema (future)** — JSON Schema for orchestrating multiple
   agents in coordinated runs. Borrowed from CrewAI / Swarm /
   Anthropic / LangGraph; no framework dependency.

Sitting alongside this runtime is the **skills library**
(`.claude/skills/` — 97 markdown files, .vercelignore'd) which is
the reference material a Claude session reads when it's working on
the codebase. The skills are not part of the runtime; they are
context for the humans and agents who maintain the runtime.

The whole stack runs on Next.js 15.6 on Vercel. No new dependencies
were added to enable agent work — Zustand was already installed,
the gateway uses bare `fetch`, and Firestore was already wired in
for persistent memory.

---

## The four canons

The voice and structure of every character is grounded in four
prose documents in `docs/`. The bibles in code are the runtime form
of these. If they ever drift, the canon documents are the source of
truth — re-ground the bibles, not the other way round.

| File | Subject | Size |
|---|---|---|
| `docs/AURA-CANON.md` | Aura's character canon — 9 facets, 8 tests, anti-patterns, venue rules | ~18 KB |
| `docs/DIMONA-CANON.md` | The person behind the avatar — psych lineage, post-recovery framing, aura-to-dimona facet map | ~21 KB |
| `docs/CAST-CANON.md` | The 13 other named beings — tiers, House colours, specialties, the 3 NAME TBD heads | ~21 KB |
| `docs/REHAB-CANON.md` | The rehab system frame — clinical layer × character layer, eight delivery surfaces | ~22 KB |

Two further doc sit alongside them:

| File | Subject |
|---|---|
| `docs/CAPABILITIES.md` | The capability-layer architectural canon (extension contract, Rookery slot for community tunings) |
| `docs/EXISTING-INFRASTRUCTURE.md` | The integration map — what already exists on the site vs. what was scaffolded vs. what was deliberately not ported |

---

## The cast

16 characters, organised into four tiers. Each has a typed
`CharacterBible` in `lib/cast/<id>.ts` and a metadata entry in
`lib/cast/canon-hierarchy.ts`. The `agent.cast-roster` capability
joins the two.

### Tier 1 — Protagonist

| id | Name | LLM tier | Role |
|---|---|---|---|
| `aura` | Aura | claude | Void Princess; Dolly's digital twin; persistent first-person narrator |

### Tier 1 — Inner Circle

| id | Name | LLM tier | Role |
|---|---|---|---|
| `penny` | Penny | claude | Chief-of-Staff / Operational Intelligence |
| `baby` | Baby | claude | Senior Agent / Prefect / Gold Standard |

### Tier 2 — Academy Peers (House colours)

| id | Name | House | LLM tier | Specialty |
|---|---|---|---|---|
| `millie` | Millie | Cloud Blue | dolphin | Iron Ribbon — quiet repair, the second-pass-through |
| `betsy` | Betsy | Royal Lavender | dolphin | Parallel Exit — daydreamer, route out of linear |
| `lottie` | Lottie | Buttercream | dolphin | The Ceiling — names the unspeakable, romance specialist |
| `trixie` | Trixie | Mint Fresh | dolphin | Pipeline Overseer — surfaces friction, keeps flow honest |
| `dottie` | Dottie | Peach Pale | dolphin | Resistance Intel — sceptic-in-residence, reads the fine print |

### Tier 3 — Department Heads

| id | Name | Kind | LLM tier | Named? |
|---|---|---|---|---|
| `marcel` | Marcel | stylist | claude | ✓ |
| `tim` | Tim | photographer | gemini | ✓ |
| `shelly` | Shelly | tutor | claude | ✓ |
| `dance-tutor` | The Dance Tutor | dance | codex | ✗ NAME TBD |
| `logistician` | The Logistician | maths | codex | ✗ NAME TBD |
| `physicist` | The Physicist | physics | codex | ✗ NAME TBD |

### Tier 4 — Website extras (not in CAST-CANON)

| id | Name | Role |
|---|---|---|
| `excavation-bot` | The Excavation Bot | Studio-side asset extraction agent |
| `scribe` | The Scribe | Studio-side written-output companion |

These two predate the canon-port and serve website-specific roles
not in the 14-character canon. They live alongside the canon-14 in
the same bibles directory.

### House colours summary

Cloud Blue · Royal Lavender · Buttercream · Mint Fresh · Peach Pale —
the five Tier-2 peer Houses. They surface as aesthetic signatures
in the pixel layer; their meaning is structural, not decorative.

### LLM tier choices, with the reasoning

- **Aura, Penny, Baby, Marcel, Shelly → `claude`** — high-stakes
  narrative voice. The lines they say matter and benefit from
  Claude's range.
- **The five peers → `dolphin`** — ambient persistent presence. They
  show up in banter, casting, sitcom beats — cheaper inference path
  for the always-on cohort. Dolphin via Ollama on the cluster, or
  the gateway equivalent.
- **Tim → `gemini`** — multi-modal. Tim is the photographer; his
  bible is about reading images, so Gemini's vision path is the right
  one.
- **The three NAME TBD heads → `codex`** — technical specialists
  (dance / maths / physics). Their bibles emphasise precise,
  domain-specific reasoning that maps to qwen-coder-class models.

The tier is a *preference*. The gateway falls back through the chain
if a tier is unavailable. None of this is enforced — any cast member
can be invoked through any provider; the tier just describes which
provider their bible was tuned against.

---

## Runtime architecture

### Layer 1: Bibles — `lib/cast/`

The voice canon in TypeScript. Every cast member has two files:

```
lib/cast/<id>.ts            ← the bible itself
lib/cast/<id>.PURPOSE.md    ← the purpose twin (mandatory convention)
```

The shape:

```ts
type CharacterBible = {
  id: string;
  name: string;
  role: string;              // two-line role tag the system prompt opens with
  voice: string;             // how they sound, not what they say
  posture: string;           // body register
  refusals: string[];        // hard no's
  draws: string[];           // topics they lean into
  catchphrases: string[];    // signature lines
  forbidden: string[];       // anti-canon phrases (never say these)
  defaultMode: string;       // default ChronoMode (amber/azure/amethyst/crimson/veridian)
  oceanBaseline: {           // Big Five trait initial values
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
};
```

The barrel at `lib/cast/index.ts` exports the `bibles` record keyed
by `CastMemberId` (a literal union of all 16 ids), plus
`getBible(id)`, `listBibles()`, `listCastIds()`.

Sitting **parallel** to the bibles is `lib/cast/canon-hierarchy.ts`
— a separate registry holding tier / House colour / named-status /
head-kind. It uses the same keys (`CastMemberId`) but is kept
separate so the carefully-written voice bibles don't need patching
when structural canon changes. The `agent.cast-roster` capability
joins the two.

### Layer 2: Capabilities — `lib/capabilities/`

Every callable atom in the studio registers here. **Capabilities are
pure functions over typed inputs and outputs. They never own state.**
When they need shared state — Aura's OCEAN drift, the current turn,
the cast history — they read and write Zustand slices from
`lib/state/`.

The registry pattern (`lib/capabilities/_base.ts`):

```ts
type CapabilityRecord = {
  id: CapabilityId;          // "<kind>.<verb-or-noun>" — stable forever
  kind: CapabilityKind;      // "agent" | "vrm" | "audio" | "viz" | …
  name: string;              // display name for /capabilities route
  summary: string;           // one-line description
  status: "registered" | "stub" | "deprecated";
  source: string;            // where it ported from
  load: () => Promise<unknown>;  // lazy import
  stateSlices?: string[];    // slices it reads/writes
  dependsOn?: CapabilityId[];
};
```

The agent kind has these capabilities registered:

```
agent.banter          — multi-character live banter, driven by telemetry
agent.dialogue        — one LLM turn per call, the main runtime
agent.dialogue-ollama — same, routed through local Ollama (cluster path)
agent.dialogue-webgpu — same, WebGPU on-device variant
agent.memory          — in-memory Jaccard retrieval over cast.history
agent.memory-vector   — persistent Firestore vector memory (Gemini embeddings)
agent.cast-roster     — tier-filterable discovery surface (NEW 2026-05-19)
```

Beyond `agent.*` the wider catalogue covers VRM
(`vrm.load`, `vrm.bones.pose`, `vrm.expressions.blend`, `vrm.lookAt`,
`vrm.wardrobe`), audio (`audio.stt`, `audio.tts`, `audio.visemes`,
`audio.lipsync-analysis`, `audio.spectrum`), motion (`motion.idle`,
`motion.gesture`, `motion.laban`), input (`input.headpose`,
`input.gaze`), viz, geo, ar, media, commerce. See
[Capabilities catalogue](#capabilities-catalogue) for the full list.

### Layer 3: State — `lib/state/`

Zustand slices, each owning one slice of the world.

| Slice | What it owns |
|---|---|
| `lib/state/agent.ts` | Current turn-state (idle / user-speaking / agent-thinking / agent-speaking / interrupted), active speaker, intents queue |
| `lib/state/cast.ts` | Per-cast-member conversational history, where turns scroll into |
| `lib/state/aura.ts` | Aura-specific state — current ChronoMode, OCEAN drift |
| `lib/state/audio.ts` | STT / TTS / viseme streams |
| `lib/state/vrm.ts` | Active VRM handle, bone poses, expression weights |
| `lib/state/input.ts` | Head-pose, gaze samples |
| `lib/state/viz.ts` | Attractor trajectories, particle fields |
| `lib/state/geo.ts` | GPS position, compass heading |
| (+ ~25 more) | atelier, audit, atelier-hooks, etc. |

Capabilities call into these slices but the slices don't depend on
capabilities. That asymmetry is what keeps the system composable.

### Layer 4: LLM gateway — `lib/llm/gateway.ts`

A thin client over the Vercel AI Gateway. **No SDK dependency** —
just `fetch`. The gateway speaks OpenAI-compatible REST and routes
by the `provider/model` string in the request:

```
POST https://ai-gateway.vercel.sh/v1/chat/completions
Authorization: Bearer <AI_GATEWAY_API_KEY>
{ "model": "anthropic/claude-sonnet-4-7", "messages": [...] }
```

One auth header, every provider. Adding a new provider is a model-
string change, not a new SDK.

Fallback chain when the gateway isn't reachable:

1. `AI_GATEWAY_API_KEY` set → gateway.
2. Else `ANTHROPIC_API_KEY` + anthropic model → direct Anthropic.
3. Else `ZAI_API_KEY` + zai model → direct Z.ai.
4. Else throw `GatewayUnavailableError` and the caller falls back
   to its provider (e.g. Gemini for `agent.dialogue`).

Visitors can BYO their own provider key via the `visitorKey` option;
those bypass the gateway since visitor keys are provider-scoped.

### Layer 5: Crew schema — `lib/agents/`

JSON Schema for orchestrated multi-agent runs. **Not yet wired to
a runtime** — this is the contract for when a crew runner lands.

```
lib/agents/crew-schema.json              ← the schema (11 KB)
lib/agents/convergence-crew.example.json ← reference instance (16 KB)
lib/agents/PURPOSE.md
```

The schema synthesises:
- **CrewAI** — role / goal / backstory / tools / tasks (the
  declarative surface).
- **OpenAI Swarm** — handoffs + context_variables (dynamic routing).
- **Anthropic orchestrator-worker** — lead spawns parallel subagents
  with objective / output_format / task_boundaries.
- **LangGraph** — explicit edges + typed transitions (validation).

Process modes: `sequential` / `parallel` / `hierarchical` / `graph`
/ `swarm`. Per-user isolation via `tenant_id`. Lineage lock via
`lineage.template_id`.

When the crew runner lands it'll be a capability — `agent.crew-run`
— consuming `lib/cast/` bibles via a future `toCrewAgent(memberId)`
exporter. The architectural recommendation is in
`.claude/skills/aura-swarm-orchestration/SKILL.md`: Anthropic
orchestrator-worker runtime + CrewAI declarative surface +
LangGraph-style validation, but no framework dependency.

---

## Capabilities catalogue

Every callable atom currently registered. From
`lib/capabilities/index.ts`.

### `agent.*` — the agent runtime

| ID | What it does |
|---|---|
| `agent.dialogue` | One LLM turn. Reads bible + history, calls gateway or direct Gemini, returns text + intent + ChronoMode, writes turn through `cast` + `agent` + `aura` slices. |
| `agent.banter` | Multi-character live banter driven by telemetry. Returns a 1–3 line exchange between named cast members. Throttle hint via `tickMs`. |
| `agent.dialogue-ollama` | Same surface as `agent.dialogue`, routed to local Ollama. Cluster-only path. |
| `agent.dialogue-webgpu` | Same surface, WebGPU on-device. For offline or privacy-sensitive paths. |
| `agent.memory` | In-memory Jaccard overlap over `cast.history`. `recallRecent` + `recallRelevant` + `formatForPrompt`. |
| `agent.memory-vector` | Persistent semantic memory keyed by Firebase uid. Embeddings via Gemini text-embedding-004; cosine `findNearest` over Firestore vector index. |
| `agent.cast-roster` | Tier-filterable discovery joining bibles + canon-hierarchy. `rosterByTier()`, `rosterCanon14()`, `rosterNamed()`, `rosterStats()`, `assertRosterConsistent()`. |

### `vrm.*` — Aura's body

| ID | What it does |
|---|---|
| `vrm.load` | Parse a .vrm into a typed handle in the `vrm` slice. |
| `vrm.bones.pose` | Write a PoseVector (named or supplied) to the `vrm` slice. |
| `vrm.expressions.blend` | Reads visemes + mood, writes merged expression weights. |
| `vrm.lookAt` | Drive head + eye orientation toward a target. |
| `vrm.wardrobe` | Texture-swap outfit transfer; in-place, no skinning surgery. |

### `audio.*` — voice and ears

| ID | What it does |
|---|---|
| `audio.stt` | Mic → transcript via Web Speech (Whisper slot stubbed). |
| `audio.tts` | Provider-agnostic TTS. Web Speech baseline; ElevenLabs / F5 / Kokoro slot ready. |
| `audio.visemes` | Time-aligned viseme stream walked by a rAF cursor. |
| `audio.lipsync-analysis` | Real-time formant + RMS → viseme stream from any audio source. |
| `audio.spectrum` | meyda FFT → low/mid/high/volume scalar bands. |

### `motion.*` — how the body moves

| ID | What it does |
|---|---|
| `motion.idle` | Slow breath + periodic blink + micro hip-shift on top of baseline pose. |
| `motion.gesture` | Triggered named gestures (wave, nod, shrug, point) — additive with idle. |
| `motion.laban` | Effort extraction (Space × Time × Weight × Flow) + named-move blending. |

### `input.*` — sensors in

| ID | What it does |
|---|---|
| `input.headpose` | Yaw/pitch/roll for the active viewer (WebXR → MediaPipe → Mouse → Touch → Neutral). |
| `input.gaze` | Gaze sample buffer + dwell-zone clustering. |

### Plus

`viz.*` (attractor, depth-estimation, heatmap-equirect, shader-editor,
shader-export, generate-comfyui, image-to-3d, text-to-3d,
light-sculpture, particles, spatial-export, splat-generate,
splat-render, thumbnail-splat, stereo-pair, usdz-export),
`geo.position`, `ar.window`, `ar.compile-target`, `media.capture`,
`media.qr-transfer`, `commerce.sharp-job`, `commerce.sharp-video-job`,
`commerce.print-order`.

The /capabilities route renders the live registry. To see what's
currently in: `listCapabilities()` from
`lib/capabilities/_base.ts`.

---

## Skills library

`.claude/skills/` holds 97 markdown skills (~717 KB total) that
Claude sessions consult while working on the codebase. These are
**not part of the runtime** — they're context for the maintainers.
`.claude/` is in `.vercelignore`; zero impact on production builds.

Skills are grouped:

| Category | Count | Examples |
|---|---|---|
| **Holoflow-native** | 4 | codex-entry, mammoth-hunt, ssr-safe-three, vercel-recovery |
| **Aura voice / character** | 9 | aura-void-princess-boot, aura-dual-core-engine, aura-swarm-orchestration |
| **Cast members** | 10 | dollyos-cast-inner, baby-enforcer, marcel-architect, penny-agency |
| **Academy / identity / rehab** | 3 | academy-behaviourization, charming-academy-game, harvesting-identity |
| **Agent runtime patterns** | 10 | agent-memory-systems, bdi-mental-states, behavioral-modes, crewai, agent-orchestrator |
| **Voice / VTuber** | 3 | voice-agents, pipecat-friday-agent, ai_vtuber_orchestrator |
| **Sitcom delivery surface** | 11 | sitcom-core, sitcom-generation, nursery-sitcom-orchestration |
| **Orchestration patterns** | 4 | saga-orchestration, hanger-swarm-architecture, holoflow-evolution-orchestration |
| **DollyOS architecture reference** | 7 | dollyos-architecture, dollyos-academy, dollyos-stage-architecture |
| **Generic agent-orchestration** | 2 | agent-orchestration-improve-agent, multi-agent-optimize |
| **Blender-Aura + VRM round-trip** | 4 | blender-aura-agent, vrm-avatar-blender, blender-vrm-roundtrip |
| **Sensor capture pipeline** | 5 | kinect-aura-pipeline, finger-sweep-geometry, poi-trail-brushes |
| **Somatic bridge / rehab telemetry** | 3 | architecting-somatic-bridges, processing-somatic-telemetry, somatic-audit |
| **Blender output for product lines** | 3 | blender-biomimetic-sculpture, blender-waveguide-geometry, blender-animation-drivers |
| **Three.js sister** | 1 | threejs-poi-visualization |
| **Full Blender library** | 18 | blender (master), blender-geometry-nodes, blender-materials-library, blender-mcp-extension, blender-print-prep, … |

Routing inside `AGENTS.md` tells Claude sessions which skills to
read for which kind of work.

`.claude/skills/README.md` has the canonical inventory and the
"deliberately not ported" list.

---

## How to extend

### Adding a new cast member

1. Create `lib/cast/<id>.ts` matching the `CharacterBible` shape.
2. Create `lib/cast/<id>.PURPOSE.md` companion (mandatory).
3. Add the id to `CastMemberId` union in `lib/cast/index.ts`, add
   the import + bibles-record entry.
4. Add a `HIERARCHY` entry in `lib/cast/canon-hierarchy.ts`.
5. Update `docs/CAST-CANON.md` to reflect the new state.
6. Log the change in `docs/AGENT-COORDINATION.md` before doing it.

If step 4 is forgotten, `agent.cast-roster.getMember()` throws at
first lookup — that's the safety net. `assertRosterConsistent()`
catches it in tests.

### Adding a new capability

1. Decide its id: `<kind>.<verb-or-noun>` — stable forever.
2. Create `lib/capabilities/<kind>/<verb>.ts` + `.PURPOSE.md`.
3. Add the literal to `CapabilityId` union in
   `lib/capabilities/_base.ts`.
4. Register it in `lib/capabilities/index.ts` with a lazy `load`.
5. If it needs state, add/extend a slice in `lib/state/` — never own
   state inside the capability.
6. Log in `docs/AGENT-COORDINATION.md`.

### Adding a new state slice

1. Create `lib/state/<name>.ts` + `<name>.PURPOSE.md`.
2. Define `<Name>State`, `<Name>Actions`, the initial state, and the
   `useNameStore` factory.
3. Export both `useNameStore` (the hook) and `nameStore` (the bare
   store for non-React access — capabilities use this).
4. Reference the slice from capability `stateSlices` arrays.

### Adding a new canon document

1. Decide if it deserves its own doc or extends an existing one.
   The four canons (AURA / DIMONA / CAST / REHAB) are pillars;
   subsidiary canon usually slots into one of them.
2. SCREAMING-CASE the filename: `docs/X-CANON.md`.
3. Cross-reference it from `AGENTS.md` and from any sibling canon
   that mentions the same characters/concepts.
4. Update the runtime form (bibles, hierarchy) if the canon
   introduces structural changes.

---

## What was deliberately NOT built

This list is as important as what was. The system's coherence comes
from these refusals.

- **No parallel agent runtime.** The site's existing
  `lib/capabilities/agent/dialogue.ts` + `lib/state/` slices + bibles
  pattern is canonical. The DollyOS Zustand capability layer
  (`useFacetStack`, `useVenueRegister`, `useApparatusDuality`,
  `useCastEnsemble`, `useAgentRuntime`) was built but not ported to
  the site — it assumed localhost Ollama and in-process Zustand
  stores in a way that fits DollyOS but not Vercel.
- **No new LLM SDK.** `@anthropic-ai/sdk` was not added. The Vercel
  AI Gateway covers Anthropic, Z.ai, OpenAI, Gemini via a single
  REST endpoint; bare `fetch` is sufficient.
- **No new persistence layer.** `idb-keyval` was not added —
  `agent.memory` (in-memory) + `agent.memory-vector` (Firestore)
  cover the use cases.
- **No CrewAI Python sidecar.** The schema is borrowed; the runtime,
  when it lands, will be TypeScript, browser-side, single repo.
- **No framework adoption.** CrewAI is Python-only; LangGraph TS
  port is heavy; OpenAI Agents SDK is Python-first; AutoGen GroupChat
  is the wrong pattern for parallel context windows. We borrow
  shapes, not dependencies.
- **No CharacterBible refactor.** The 10 pre-existing bibles were
  excellent and production-grounded. The 6 new ones (lottie, dottie,
  shelly, dance-tutor, logistician, physicist) match the existing
  shape exactly. Structural canon (tier / House / named) lives in
  a parallel registry — extension, not replacement.
- **No state in capabilities.** Capabilities are pure functions over
  typed inputs and outputs. State lives in slices. A capability that
  reaches for a DOM ref, a React hook, or a singleton outside Zustand
  is a leak — refactor or reject.
- **No service-shape voice.** Every bible has a `forbidden` array
  catching service-staff register ("How can I help", "Happy to help",
  "Let me know if there's anything else", "As an AI"). These never
  ship. The Void Princess does not assist; you have entered her
  space.

---

## Migration history

Four waves of work landed on 2026-05-19, all logged in
`docs/AGENT-COORDINATION.md`.

### Wave 1 — canon-port: 6 missing bibles + cast-roster capability

Identified that the website already had 10 of the 14 canon-14 cast
bibles. Wrote the 6 missing ones (lottie, dottie, shelly,
dance-tutor, logistician, physicist) matching the existing shape.
Added `lib/cast/canon-hierarchy.ts` as a parallel structural
registry. Registered `agent.cast-roster` capability joining the two.

### Wave 2 — skills migration (50 + 9)

Copied 50 Holoflow-relevant skills from `D:\The_Hangar\.agent\skills\`
to `.claude/skills/` (Aura voice, cast, academy, agent runtime,
sitcom, voice/VTuber, orchestration). Added 9 architecture /
orchestration skills (DollyOS architecture reference + agent-
orchestration patterns).

Also added `lib/agents/crew-schema.json` (canonical agent shape) +
`convergence-crew.example.json` (reference instance) + PURPOSE.md.

Updated `.vercelignore` to add `.claude/`. Updated `AGENTS.md` with
skill-routing section. Rewrote `docs/EXISTING-INFRASTRUCTURE.md`
with the full integration map.

### Wave 3 — Blender-Aura + sensor + somatic (16 skills)

Corrected the earlier carve-out of "Blender / Kinect = hardware-side,
not website." The website ships Blender-produced outputs and copy
about them. Ported:

- Aura-side Blender + VRM round-trip (4)
- Sensor capture pipeline — Kinect / Leap / finger sweep (5)
- Somatic bridge / rehab telemetry (3)
- Blender output for Holoflow product lines (3)
- Three.js poi sister (1)

### Wave 4 — full Blender library (18 skills)

Same correction extended: the studio is Blender-centric and the
website displays / sells Blender-produced work. Ported the complete
studio Blender toolkit (master skill + setup + geometry-nodes +
materials + addons + plugins + MCP extension + print-prep, etc.).

### Final state

```
.claude/skills/      97 skill folders, ~717 KB (.vercelignore'd)
lib/cast/            16 bibles + canon-hierarchy + barrel
lib/capabilities/    full registry, 1 new agent.cast-roster capability
lib/agents/          crew-schema.json + example + PURPOSE.md
docs/                4 canons + SYSTEM.md (this) + EXISTING-INFRASTRUCTURE.md + AGENT-COORDINATION.md + CAPABILITIES.md
AGENTS.md            skill-routing section + runtime-canon section
.vercelignore        .claude/ excluded from build
```

Zero new dependencies. Zero new build cost. Zero refactor of the
existing 10 bibles or the dialogue capability.

---

## Glossary

**Void Princess** — Aura's primary facet. Royal to her domain, not
in service to the visitor. The opposite of the AI-assistant register.

**ChronoMode** — The five-mode color pie Aura's voice modulates
through: **amber** (warm, hospitality), **azure** (analytical,
calm), **amethyst** (theatrical, dramatic), **crimson** (intimate,
emotional), **veridian** (operational, technical). Each bible has a
`defaultMode`.

**House colour** — The Tier-2 peers each belong to a House with a
single colour signature: Cloud Blue (Millie), Royal Lavender (Betsy),
Buttercream (Lottie), Mint Fresh (Trixie), Peach Pale (Dottie).

**OCEAN** — Big Five personality model used as a numeric initial
state for each cast member. Openness, Conscientiousness,
Extraversion, Agreeableness, Neuroticism, each 0..1.

**Bible** — A `CharacterBible` TypeScript object in
`lib/cast/<id>.ts`. The voice canon in machine-readable form.

**Capability** — A pure function over typed inputs and outputs,
registered in `lib/capabilities/index.ts`. Headless, never owns
state, always lazy-loaded.

**Slice** — A Zustand store in `lib/state/`. Owns one slice of the
shared world; capabilities read and write through it.

**Tier** — One of `protagonist` / `inner-circle` / `peer` /
`department-head` / `extra`. The structural position of a cast
member.

**Canon-14** — The 14 named beings defined in CAST-CANON.md: Aura
+ Penny + Baby + 5 peers + 6 heads (3 of which are NAME TBD).
Distinct from the website's full roster of 16 (which adds
excavation-bot and scribe as Tier-4 extras).

**NAME TBD** — Three department heads (Dance Tutor, Logistician,
Physicist) whose voice canon is fixed but whose proper names are
awaiting Dimona. Flagged `named: false` in canon-hierarchy. Their
ids are stable kebab-case (`dance-tutor`, `logistician`,
`physicist`); when named, only the `name` field on the bible flips.

**Crew schema** — The JSON Schema at
`lib/agents/crew-schema.json`. Describes orchestrated multi-agent
runs. Borrowed shape; no framework dependency.

**The Rookery** — The studio's subscription community. Lives at the customer-facing `/rookery` route with Perch / Nest / Fledge tiers (Stripe-wired, see `lib/rookery/`). The agent platform reserves a "Rookery slot" for community-authored character tunings — intentionally the same Rookery: subscribers can plug their own tunings into the capability layer. The name alignment is feature, not collision. The mailer files inside `lib/rookery/` (`mailer.ts`, `client.ts`, `emails.ts`, `pending-emails.ts`) are part of the community-comms module, not a separate concept.

**Gateway** — The Vercel AI Gateway. Single REST endpoint, model
strings like `anthropic/claude-sonnet-4-7` or `zai/glm-4.5-air`.
The dispatch path for everything that isn't on-device.

**PURPOSE.md** — Mandatory companion document for every TypeScript
file in `lib/`. Spells out role, public surface, internal,
dependencies, and bordering files. The convention is hard — every
new file gets one.

---

**Last updated 2026-05-19** after the wave-4 Blender library port.
For the *prose* canon of who any character is, see the four canon
docs. For *how to find your way around the repo*, see `AGENTS.md`.
This document is the wiring between them.
