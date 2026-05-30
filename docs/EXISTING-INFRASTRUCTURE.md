# Existing agent infrastructure — site-side integration map

**Updated 2026-05-19** after the canon-port migration wave 2.

The Holoflow website (`_3DPOV`, deployed to Vercel) is now the
canonical home of all agent work. This document maps the
infrastructure so future sessions can find what they need without
re-deriving it.

## The split — site vs. DollyOS

| Surface | Repo | Runtime | When to touch |
|---|---|---|---|
| **Website** | `_3DPOV/` | Next.js 15.6 on Vercel | All production agent work. Public face. |
| **DollyOS** | `apps/production/dolly-os/` | Vite + React, local | Cluster-side workflow tools. Stays on Chonky/Swift. |
| **Hangar root** | `D:\The_Hangar\` | n/a | Skills, scripts, ML services, the wider studio. |

After 2026-05-19, **website-side is canonical for agent infrastructure**.
DollyOS-side is left in place for cluster-internal workflows but
gets no new agent features.

## Runtime layers on the site

### 1. Cast — the voice layer

- `lib/cast/<id>.ts` — 16 typed `CharacterBible`s. Voice,
  posture, refusals, draws, catchphrases, forbidden phrases,
  OCEAN baseline.
- `lib/cast/canon-hierarchy.ts` — parallel registry for
  tier / House colour / named-status / head-kind. Keyed by
  `CastMemberId`.
- `lib/cast/index.ts` — barrel: `bibles` record, `getBible`,
  `listBibles`, `listCastIds`.
- `lib/cast/move-library.ts` — poi move catalogue (not voice).

### 2. Capabilities — the function layer

Pure-functional, registered in `lib/capabilities/index.ts`,
lazy-loaded. Composed by UIs and other capabilities.

| Capability | Role |
|---|---|
| `agent.dialogue` | One LLM turn per call. Reads bible, calls gateway, writes turn through `cast` slice. |
| `agent.banter` | Multi-character live banter. ~3-line exchanges driven by telemetry. |
| `agent.memory` | In-memory Jaccard retrieval over `cast.history`. |
| `agent.memory-vector` | Persistent Firestore vector memory. Gemini text-embedding-004. |
| `agent.cast-roster` | **NEW 2026-05-19.** Tier-filterable discovery over bibles + canon-hierarchy. |
| `agent.dialogue-ollama` | Ollama variant. Local cluster path. |
| `agent.dialogue-webgpu` | WebGPU on-device variant. |

### 3. State — the slice layer

- `lib/state/agent.ts` — current turn-state (idle / user-speaking /
  agent-thinking / agent-speaking / interrupted), active speaker,
  intents queue.
- `lib/state/cast.ts` — per-cast-member history. Where turns
  scroll into.
- `lib/state/aura.ts` — Aura-specific state (mode, OCEAN drift).
- `lib/state/audio.ts` — STT / TTS / viseme streams.

### 4. LLM gateway — the dispatch layer

- `lib/llm/gateway.ts` — Vercel AI Gateway client. Model strings
  like `anthropic/claude-sonnet-4-7`, `zai/glm-4.5-air`,
  `openai/gpt-4o-mini`. Single endpoint. Falls back to direct
  provider env keys if no gateway key is set.
- `lib/aura/gemini.ts` — Gemini-specific path (the dialogue
  capability still uses Gemini as baseline for `responseSchema`
  support).

### 5. Crew runtime — the (future) orchestration layer

- `lib/agents/crew-schema.json` — JSON Schema for crew-shaped
  multi-agent orchestration. Borrowed from CrewAI / Swarm /
  Anthropic / LangGraph; no framework dependency.
- `lib/agents/convergence-crew.example.json` — reference instance.
- **No crew runner exists yet.** When it lands, it'll be
  `agent.crew-run`, registered in `lib/capabilities/index.ts`,
  consuming `lib/cast/` bibles via a `toCrewAgent()` exporter.
  Architectural recommendation in `.claude/skills/aura-swarm-orchestration/SKILL.md`.

## Reference layer — `.claude/skills/`

63 markdown skills. `.vercelignore`'d. Available to any Claude
session checking out the repo. See `.claude/skills/README.md` for
the full index.

## What was NOT ported, and why

- **The DollyOS Zustand capability layer** (`useFacetStack`,
  `useVenueRegister`, `useApparatusDuality`, `useCastEnsemble`,
  `useAgentRuntime` at `apps/production/dolly-os/src/stores/`)
  was deliberately not ported. The website already has a more
  appropriate pattern: pure-functional capabilities registered in
  `lib/capabilities/` + state in `lib/state/` slices + bibles in
  `lib/cast/`. The DollyOS pattern was framework-mismatched for
  Next.js + Vercel (assumed localhost Ollama, in-process Zustand
  stores). It stays in place for DollyOS-internal work.
- **PunkNanny SQLite memory** stays in DollyOS — the website uses
  `idb-keyval` (already in DollyOS as `agentMemory.ts`) on the
  client and Firestore vector memory on the server, both already
  registered.
- **Anthropic / OpenAI SDKs** were not added. The Vercel AI
  Gateway is the dispatch path; bare `fetch` is sufficient.
- **Generic orchestration patterns** (tdd-orchestrator,
  react-pipeline-orchestration, social-orchestrator, etc.) were not
  ported as skills — they're not Holoflow-specific.

## When to add a new agent capability

1. Decide its capability id: `agent.<verb>`.
2. Create `lib/capabilities/agent/<verb>.ts` + `<verb>.PURPOSE.md`.
3. Register it in `lib/capabilities/index.ts` with a lazy `load`.
4. Add the literal to the `CapabilityId` union in
   `lib/capabilities/_base.ts`.
5. Log in `docs/AGENT-COORDINATION.md` before doing it.
6. If the new capability needs state, add a slice in `lib/state/`
   (or extend an existing one); never own state inside the
   capability.

## When to add a new cast member

1. Create `lib/cast/<id>.ts` + `<id>.PURPOSE.md` matching the
   `CharacterBible` shape.
2. Add the id to `CastMemberId` union in `lib/cast/index.ts`,
   add the import + bibles-record entry.
3. Add a `HIERARCHY` entry to `lib/cast/canon-hierarchy.ts`.
4. Update `docs/CAST-CANON.md` to reflect the new state.
5. Log in `docs/AGENT-COORDINATION.md`.

If you forget step 3, `agent.cast-roster` will throw at first
lookup — that's the safety net.
