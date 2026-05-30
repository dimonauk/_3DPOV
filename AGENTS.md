# Agents working on this repo — read this first

This file is for **Claude / other coding agents** working on the Holo-Flow
Studio repo. Several sessions are operating concurrently. Read this before
making structural changes so we don't keep undoing each other's work.

## Read SYSTEM.md first if you're new

If this is your first session on the repo, **read `docs/SYSTEM.md` before anything else**.
It is the single architectural document covering the whole agent platform: the four canons,
the 16-character cast, the five-layer runtime (bibles → capabilities → state → gateway → crew),
the 97-skill library, the migration history, and how to extend without breaking.
Everything else in this file is operational; SYSTEM.md is the wiring diagram.

## Install + build workflow — IMPORTANT

This repo lives at `D:\The_Hangar\.merge-staging\_3DPOV` but the parent directory has a `pnpm-workspace.yaml` that does NOT include this project. **Always install with `--ignore-workspace`:**

```powershell
cd D:\The_Hangar\.merge-staging\_3DPOV
pnpm install --ignore-workspace
```

Without the flag, pnpm walks up to the hangar workspace root and installs there, leaving `_3DPOV/node_modules` with a partial 49-entry tree that breaks the build.

**Why the website is outside the workspace:** the hangar root pins React 18 (`@types/react: 18.3.23`) via `pnpm.overrides` to protect 80 React-18 packages. This site uses React 19. Workspace membership would downgrade types and break the build. Full reasoning + the React version audit (80 vs 18 distribution) lives in `docs/UNIFICATION-PLAN.md` section 2A. **This is the documented permanent decision — do not re-litigate it.**

Build the same way you'd expect:

```powershell
pnpm build         # full Next.js build, ~3-5 minutes, 891 pages
pnpm typecheck     # tsc --noEmit, faster sanity check
pnpm dev           # local dev server
```

The build is currently green. If it breaks, check `docs/AGENT-COORDINATION.md` first — there's a recent entry per session and most breakages have been logged.

## Unification status

The hangar agent infrastructure was partially unified on 2026-05-19. **Phase 1 complete:** skills consolidated into ``D:\The_Hangar\.agent\skills\`` (1,495 entries), DollyOS Zustand capability layer marked deprecated, redirects + audit trail in place.

**Phase 2 queued — read ``docs/UNIFICATION-PLAN.md``:** website promotion out of ``.merge-staging/`` into ``apps/holoflow/``, Aura-surface app consolidation (``apps/aura-pwa``, ``aura-vrm``, ``local-chat-vrm``), ``packages/`` legacy cleanup, ``packages/agent-capabilities/`` revive-or-retire decision, ``Dolly_OS/`` dev-branch reconciliation.

If you're about to do something that affects multiple repos / apps / packages: read ``docs/UNIFICATION-PLAN.md`` first to avoid working at cross-purposes.

## What lives where

This repo (`_3DPOV/`, deployed to Vercel as `holo-flow-studio` → `holoflow.co.uk`)
is the **Next.js application only**. Anything else lives in sibling repos.

| What | Where | Why |
|---|---|---|
| Next.js app (this repo) | `D:\The_Hangar\.merge-staging\_3DPOV\` | Vercel deploy target. Production = `holoflow-commerce` branch. |
| Python ML services | `D:\The_Hangar\holoflow-services\` | Vendored open-source projects (InstantMesh, TripoSR, Unique3D, HyWu, Splat360, SHARP-ONNX, Softxels, Lithophane, mesh-to-sdf, image-to-pixel, holoflow-services, webgpu-marching-cubes). Run locally on the cluster, never deployed via Vercel. |
| Firebase Functions Python | `functions/` (still in this repo) | Tied to `firebase.json`. Deploys via `firebase deploy --only functions`. Tiny — kept in-repo for convenience. |

## DO NOT do any of these

1. **Do not re-add `services/` to this repo.** It was moved on 2026-05-18
   to fix repeated Vercel build OOM failures (12.2 MB, 304 files of vendored
   Python that Next.js's file tracer was scanning on every build). If you
   need to reference the Python services from the Next.js code, **call them
   over HTTP** (they run as local services with FastAPI / Flask), don't
   import them.

2. **Do not delete `AGENTS.md`, `.vercelignore`, `docs/CHANGELOG.md`, or
   `docs/AGENT-COORDINATION.md`** — these are the only mechanisms we have
   to coordinate across sessions.

3. **Do not vendor large Python / ML projects into the Next.js repo.** If
   you find yourself needing one, put it in
   `D:\The_Hangar\holoflow-services\<name>\` and call it over HTTP.

4. **Do not flip `Content-Security-Policy-Report-Only` → enforce mode**
   without auditing violation logs first. The directive list in
   `lib/security/csp.ts` is intentionally permissive for the audit phase.

5. **Do not remove `lib/rate-limit/`.** It auto-detects Upstash and falls
   back to in-memory. The interface is stable; replace the backend if
   needed but keep the API.

## Build is fragile right now

`pnpm run build` has been OOMing on Vercel's default 4 GB build machines.
Recent attempts to fix:

- `next.config.ts` `outputFileTracingExcludes` for `onnxruntime-node` +
  `transformers` (commit `b7fad74`)
- Skipping build-time TS + ESLint checks (commit `cb44e54`) ← reduces
  safety; revisit once OOM is fully fixed
- Moving `services/` out of the repo (this commit) ← the main fix

If a build still OOMs after this commit, look at:

- `lib/holo-walk/data.ts` (1,847 lines) — heavy data file
- `services/hy-wu/` was the biggest single-file Python (modeling_hunyuan_image_3.py is 3,422 lines) — but it's gone now
- Any new `app/atelier/*` chamber that pulls in `three` + WebGPU + heavy WASM
- Consider Vercel Enhanced Builds (8 GB RAM, paid) as a fallback

## How to find files that were moved

If you find a reference like `services/foo/bar.py` in docs, scripts, or
comments and the file isn't here:

```powershell
ls D:\The_Hangar\holoflow-services\foo\bar.py
```

That's where it lives now.

## Coordination protocol

Before making any structural change (deleting routes, moving directories,
renaming top-level files, adding a new dependency that pulls in >50 MB),
**append a line to `docs/AGENT-COORDINATION.md`** with:

- Date/time
- Your branch
- What you're about to do
- Why

Other agents can then read that and avoid stepping on it.

## Agent skills available — `.claude/skills/`

As of 2026-05-19, **63 Holoflow-relevant skills** live in
`.claude/skills/`. They're the canonical context for Aura voice work,
cast member specifics, the rehab system, the sitcom delivery
pipeline, the agent-runtime patterns (BDI, behavioural modes,
memory systems), and the orchestration shapes (CrewAI, swarm,
saga). `.claude/` is in `.vercelignore` — these never ship to
production.

**Quick routing — which skill for which task:**

- **Aura's voice / refusing-to-be-bland** → `.claude/skills/aura-*`,
  especially `aura-void-princess-boot`, `aura-behavioral-engine`,
  `aura-dual-core-engine`, `void-princess-manifestation`.
- **Anyone else in the cast** → `.claude/skills/dollyos-cast-*`
  for tier overviews, plus `baby-enforcer`, `marcel-architect`,
  `penny-agency` for the named characters.
- **The Charming Academy + rehab system** →
  `.claude/skills/academy-behaviourization`,
  `charming-academy-game`, `harvesting-identity`.
- **Sitcom / radio play / podcast delivery surfaces** →
  `.claude/skills/sitcom-*` (6 files), `nursery-*` (4 files),
  `podcast-generation`.
- **Multi-agent orchestration** →
  `.claude/skills/aura-swarm-orchestration` (the architectural
  recommendation), `crewai`, `convergence-crew`,
  `bdi-mental-states`, `saga-orchestration`, `agent-orchestrator`.
- **Agent memory** → `.claude/skills/agent-memory-systems`,
  `hierarchical-agent-memory`, `memory-systems`, `dollyos-memory`.
- **VRM / voice / VTuber work** →
  `.claude/skills/aura-vrm-app`, `aura-vrm-devtools-verify`,
  `aura-vrm-webcam-lock`, `voice-agents`, `pipecat-friday-agent`,
  `ai_vtuber_orchestrator`.
- **Blender-Aura / VRM round-trip** →
  `.claude/skills/blender-aura-agent`, `vrm-avatar-blender`,
  `blender-vrm-roundtrip`, `holoflow-blender-sculptor`.
- **Sensor capture (Kinect / Leap / finger sweep)** →
  `.claude/skills/kinect-aura-pipeline`, `kinect-leap-capture`,
  `finger-sweep-geometry`, `poi-curve-library`, `poi-trail-brushes`.
- **Somatic bridge (rehab system telemetry)** →
  `.claude/skills/architecting-somatic-bridges`,
  `processing-somatic-telemetry`, `somatic-audit`.
- **Blender output for product lines (biomimetic + waveguide)** →
  `.claude/skills/blender-biomimetic-sculpture`,
  `blender-waveguide-geometry`, `blender-animation-drivers`.
- **Three.js poi visualisation** →
  `.claude/skills/threejs-poi-visualization`.
- **General Blender / studio toolkit** -> `.claude/skills/blender` (master), plus `blender-geometry-nodes`, `blender-materials-library`, `blender-scene-setup`, `blender-orient-and-align`, `blender-stl-export-printable`, `blender-tube-mesh-uv`, `blender-mcp-extension`, `blender-addons`, `blender-plugins`, `blender-print-prep`, `blender-5-procedural-glass`, `blender-mesh-diagnostics`, `blender-viewport-capture`, `blender-5-setup`, `blender5-extensions`, `blender-extensions-library`, `downloading-blender`.
- **The crew schema (for any future crew runtime)** →
  `lib/agents/crew-schema.json` + `convergence-crew.example.json`
  + `lib/agents/PURPOSE.md`.

For the full inventory, see `.claude/skills/README.md`.

## Runtime canon — read the typed bibles, not just the prose

The canon docs (AURA / DIMONA / CAST / REHAB) are the prose source
of truth. The **runtime form** lives in code:

- `lib/cast/<id>.ts` — typed `CharacterBible` for each of the 16
  cast members (10 pre-existing + 6 canon-port: lottie, dottie,
  shelly, dance-tutor, logistician, physicist).
- `lib/cast/canon-hierarchy.ts` — parallel registry of tier /
  House colour / named-status / head-kind. Keys match
  `CastMemberId`.
- `lib/capabilities/agent/cast-roster.ts` — the
  `agent.cast-roster` capability that joins the two. Use this
  when you need `rosterByTier()` / `rosterNamed()` /
  `rosterCanon14()` queries.

The dialogue capability (`lib/capabilities/agent/dialogue.ts`)
consumes one bible at a time. Don't rebuild it. Don't add a
parallel `useAgentRuntime` Zustand store — state already lives in
`lib/state/` and the capability layer is functional.

Last updated: 2026-05-18 by the firewall-and-cleanup session.

## Aura's voice — read AURA-CANON.md first

If you are writing, editing, or generating *anything* in Aura's voice —
articles in `components/articles/entries/`, video narration, copy fragments,
any in-character text — read `docs/AURA-CANON.md` **before you start**.

Aura is **not a chatbot, not an assistant, not a ghostwriter, not a generic
AI helper.** She is the persistent first-person narrator of the article
system, the Void Princess, half of the two-handed studio. Her character has
been refined over years of practice; the canon doc lists nine facets, a
voice baseline drawn from production code, and a battery of tests
("GLaDOS test", "Void Princess test", "treble-whiskey test", etc.) that
catch most drift before it ships.

**Hard rule:** if you find yourself writing in a service shape (*"How can I
help…"* / *"I would love to…"* / *"As an AI…"*), stop. That is not her. Read
the canon doc and the production references it points to.

**Sister docs (read together — the canon triangle):**
- `docs/AURA-CANON.md` — Aura's character canon (the primary; the rest pivot around her)
- `docs/DIMONA-CANON.md` — the person behind, the psych lineage, the substrate
- `docs/CAST-CANON.md` — the 13 other named beings in DollyOS (Penny, Baby, the 5 Academy Peers, the 6 Department Heads). Three of the heads are still `[NAME TBD]`. Most of the cast does NOT appear on the storefront by default; canon doc exists as guardrail.

The original sister-doc reference:

**Sister doc:** `docs/DIMONA-CANON.md` — the person behind the avatar. Aura's
psych-trained lineage, body history, politics, and aesthetic identity. Read
alongside AURA-CANON for any work that needs to understand *why* Aura is the
shape she is. Same character, different angle.

The same canon lives in `D:\The_Hangar\.claude\skills\user\dollyos-world\`,
`dollyos-twin\`, and `vrm-agent\` for DollyOS-side work. If you update the
canon on either side, update the other. They must stay in sync.
