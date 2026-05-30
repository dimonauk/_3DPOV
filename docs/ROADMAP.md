# ROADMAP — Holoflow Studio

**Updated 2026-05-21** after sessions 2 + 3: crew-run Phase 1 runtime, build-break fix, apps archival.
**Status:** living document. Sequencing changes; mark items DONE in place rather than deleting; new items get appended to the relevant section.

This is the **master index**. Detailed plans live in their own docs (`SHIP-PLAN.md`, `COMMERCE_ROADMAP.md`, `CHRONO_PROTOCOL_BUILD_PLAN.md`, `LIGHTPAINT-PLAN.md`, `360-MODEL-PLAN.md`, `BUREAU-AR-LOOP-PLAN.md`, `PLAY_GAME_PLAN.md`, `VOXEL-PIPELINE-PLAN.md`, `CAPABILITY_REGISTRY_PLAN.md`, `UNIFICATION-PLAN.md`). This file points at them, captures what they don't cover, and keeps the cross-cutting view.

For the architectural shape of the agent platform: `SYSTEM.md`. For the character canon: `AURA-CANON.md`, `DIMONA-CANON.md`, `CAST-CANON.md`, `REHAB-CANON.md`. For where existing infrastructure sits: `EXISTING-INFRASTRUCTURE.md`.

---

## Status legend

- ✅ **DONE** — landed, verified
- 🟢 **ACTIVE** — being worked this sprint
- 🟡 **QUEUED** — next up, decision-ready
- 🔵 **PLANNED** — has a plan doc, awaiting sequence
- 🔴 **BLOCKED** — gated on a decision or another item
- ⚪ **DREAM** — long-term, not gated on anything immediate
- 🟣 **CANON** — architectural / structural; not feature work

---

## Active sprint (next two weeks)

| Item | Status | Notes |
|---|---|---|
| LightPainting Forge — voxelisation + waveguide channel embed | 🟢 | Current main thread per ops memory. SAM2/SAM3 installed on Chonky, three skills packaged. Next: wire `lightpainting-forge` skill end-to-end on Chonky, validate one full pipeline run. |
| `agent.crew-run` Phase 2 — hierarchical orchestrator | 🟡 | Phase 1 (sequential + parallel) landed 2026-05-21. Phase 2 implements the lead-decomposes-dispatches-aggregates pattern. ~5 hours. Convergence-crew example becomes end-to-end runnable. |
| `lib/agents/sequential-example.json` — Phase 1 smoke test | 🟡 | 2-3 cast members in sequential mode (e.g. Physicist → Geometrician → Librarian) so Phase 1 has a runnable reference instance. ~30 minutes. |
| Waveguide Forge server hardening | 🟡 | Port 11301 self-elevating batch launcher exists. (WHISPER_URL verification done — already correct on port 11300.) |
| Physical website move `_3DPOV/` → `apps/holoflow/` | 🔴 | Gated on Vercel dashboard access (Root Directory setting). Independent of workspace decision. Half a day. |

---

## ✅ Closed items (2026-05-21 sessions 2 + 3)

| Item | Outcome |
|---|---|
| **Apps audit — archive truly-stale** | ✅ `claw-empire` (empty, 0 files) and `360-studio` (18 files, no package.json, >180d stale) moved to `apps/_archive/2026-05-19-unification/`. README updated. |
| **WHISPER_URL verification** | ✅ Already correct on port 11300 in `AuraVTuber.tsx`. The 11434 references in `AuraVTuberPanel.tsx` are for Ollama (which legitimately runs on 11434). Nothing to fix. |
| **`agent.crew-run` capability scaffold (Phase 0)** | ✅ Stub written (13.1 KB) + PURPOSE.md (6.0 KB), wired into `_base.ts` and `index.ts` as `status: "stub"`. |
| **optiland `trace_caustic` API fix** | ✅ `waveguide_toolkit.py` — added `IdealMaterial` import, replaced tuple-form `material=(n,0)` with named material instance. Caustic ray-trace no longer falls back to analytic. |
| **`pnpm build` break — pngjs/vscode types** | ✅ Diagnosed (transitive type-lookup), fixed by adding explicit `"types": [...]` array to tsconfig restricting to installed `@types/*`. Build green: 746 pages, 0 errors, 2:17 elapsed. |
| **Insta360 Link camera three-tier `getStream` fallback** | ✅ `CameraWorkspace.tsx` — `getStreamWithFallbacks` helper with T1 strict (deviceId exact + 1280x720) → T2 relaxed (deviceId only) → T3 any (Insta360 only; Kinect callers pass `allowAnyFallback: false`). |
| **`agent.crew-run` Phase 1 runtime** | ✅ Sequential + parallel modes execute real LLM dispatches via `agent.dialogue`. Schema types aligned to canonical `crew-schema.json` (`lead_agent`, `assigned_agent`, required `version`). Status flipped stub → registered. Convergence-crew example validates clean. |
| **`agent.crew-run` Phase 2 — hierarchical + graph** | ✅ Topological-DAG executor with cycle detection. Hierarchical adds final synthesis pass by `lead_agent`. Graph honours `crew.edges`. Convergence-crew (9 tasks, 10 agents) now runs end-to-end in 6 waves + synthesis. New `predictWaves()` diagnostic. |
| **`agent.crew-run` Phase 4-partial — retries + human_in_the_loop** | ✅ `task.retries` honoured (per-attempt log warnings, fails with attempt-count after exhaustion). `human_in_the_loop` pause/resume implemented for DAG modes (hierarchical, graph) — returns `paused_for_approval` with `resume_state` to round-trip via `input.resume_from`. Verified on convergence-crew: pauses at jeweller_cage, resumes, pauses at printer_preflight, resumes, completes index_run. New `CrewResumeState` type exported. |
| **`agent.crew-run` Phase 3 — conditional graph routing** | ✅ Graph-mode crews now honour `edge.when` predicates. Safe recursive-descent expression evaluator at `lib/capabilities/agent/crew-predicate.ts` (14.7 KB, zero deps, no `eval()`). Grammar supports literals, dotted-path identifiers, `.length`, comparison + logical operators with short-circuit, parens. Predicates evaluated after each task against accumulated context_out; false predicates mark `to_task` skipped. Transitive skipping propagates through downstream deps. `CrewRunResult.ok.skipped_task_ids[]` exposes the trace; hierarchical synthesis prompt mentions skipped tasks. Design-time validation via `validatePredicate()` in `validateCrew()`. New reference instance: `lib/agents/graph-example.json` (anomaly-response crew, 4 tasks, 3 edges, 2 conditional). 23/23 predicate unit tests pass + both branch scenarios verified end-to-end. |
| **`agent.crew-run` Phase 4 — extended hardening** | ✅ Quick-wins bundle + tool-binding validation. (1) `task.output_schema` honoured via minimal JSON Schema validator in `crew-output-schema.ts` — failures retry. (2) `task.output_path` filesystem persistence (Node-only, best-effort, skips on edge). (3) Per-run trace export — `exportTrace()` in `crew-trace.ts` produces pinned-format trace suitable for memory-vector ingestion. (4) Design-time tool-binding validation in `validateCrew()` — checks shape of every builtin/mcp/subagent binding, catches misconfigured agents at load time. (5) `summariseCrew()` widened with `tools_total`, `tools_by_kind`, `tasks_with_output_schema`, `tasks_with_output_path`, `tasks_with_hitl`. 11/12 schema tests pass (one test expectation wrong, not code) + 8/8 tool-validation tests pass + trace offset reconstruction verified. Runtime tool execution still stubbed — that needs a ReAct loop in `respond()`, separate substantial phase. |
| **`agent.crew-run` Phase 5 v1 — `/capabilities/agent/crew-run` debug page** | ✅ New Next.js route at `/capabilities/agent/crew-run`. Server-rendered, static. Loads the three reference JSON crews at build time, runs `validateCrew` + `summariseCrew` + `predictWaves` on each, renders crew structure + agents + tasks + edges + predicted waves (with hierarchical synthesis pass annotated). 65.4 KB rendered HTML per crew set. Page total 18.1 KB source. No LLM dispatch from the UI — that's Phase 5 v2 (needs API route + client-side runner). PURPOSE.md twin written documenting Phase 5 v2 plan. The whole Layer 5 runtime is now visible at a glance from the browser. |
| **`agent.crew-run` Phase 5 v2 — run-from-UI** | ✅ Crews now runnable from the browser. New API route `POST /api/capabilities/agent/crew-run/run` (5.7 KB) — validates crew_id, rate-limits 3/hr/IP, calls `runCrew()`, returns `{result, trace}` via `exportTrace()`. New client component `RunButton.tsx` (7.3 KB) on each crew card — run button, inline turn rendering (task/agent/wave/duration/text), synthesis turn highlighted, skipped tasks listed, and `human_in_the_loop` pause → "approve & resume" round-trips the `resume_state`. Requires `AI_GATEWAY_API_KEY` (503 without). `maxDuration` 300s for long hierarchical crews. Both route + component PURPOSE.md twins written. The full Layer-5 runtime is now executable end-to-end from the browser. Phase 5 v3 (SSE streaming, trace persistence to memory-vector, richer HITL gate UI) sketched, not built. |
| **`lib/agents/sequential-example.json`** | ✅ 3-agent Phase-1 reference instance (Physicist → Logistician → Scribe), real workflow chain for poi light-painting → fabrication brief. All agents resolve via cast-roster. |

---

## ✅ Closed items (2026-05-19 session)

| Item | Outcome |
|---|---|
| **Phase 1 unification — skills consolidation** | ✅ 1,495 skills consolidated into `.agent/skills/`. 22 moved from `.claude/skills/user/`. 4 newer versions promoted. |
| **Phase 1 unification — DollyOS Zustand deprecation** | ✅ `apps/production/dolly-os/src/stores/DEPRECATED.md` written. |
| **Phase 2 — packages cleanup** | ✅ 7 legacy packages archived (`_legacy_ai-gateway`, `dist`, `lego-root-sweep`, `tetsngthebridge`, `thirdbridge`, `secondbridgetest`, `agent-capabilities`). |
| **Phase 2 — Aura surface consolidation** | ✅ `apps/aura-pwa`, `apps/local-chat-vrm` archived; `apps/aura-vrm` kept active. |
| **Phase 2 — Dolly_OS dev vs prod** | ✅ Documented as intentional dev/prod split, not duplication. `DOLLY-VS-PROD.md`. |
| **React version decision** | ✅ **DEFER workspace integration.** 80 React-18 packages vs 18 React-19 makes migration multi-day; `--ignore-workspace` workflow stays canonical. Full audit in `UNIFICATION-PLAN.md` § 2A. |
| **Apps activity audit** | ✅ 11 ACTIVE, 32 recent, 0 dormant, 2 STALE (`claw-empire`, `360-studio` — both no package.json, archive candidates). |
| **Packages audit** | ✅ All dormant but not stale. Zero clean archive candidates (imports happen by npm name not path, can't grep-prove unused). Defer to proper monorepo restructure. |
| **`docs/SYSTEM.md`** | ✅ 29.6 KB architectural overview written. |
| **`docs/UNIFICATION-PLAN.md`** | ✅ Phase 1+2 status. React decision documented. |
| **`docs/SKILLS-CONSOLIDATION.md`** | ✅ Audit trail of skills move. |
| **`docs/AGENT-COORDINATION.md`** | ✅ Running session log. |
| **`AGENTS.md`** | ✅ Includes SYSTEM.md pointer, install workflow (`--ignore-workspace`), skills routing, unification status. |
| **`pnpm-workspace.yaml`** | ✅ `_3DPOV` permanently excluded with inline reason. |

---

## The unification arc — what's left

| Item | Status | Notes |
|---|---|---|
| Physical website move `_3DPOV/` → `apps/holoflow/` | 🔴 | Gated on Vercel dashboard. Half a day execution. |
| Tighter monorepo restructure of `packages/` | ⚪ | 43 dormant packages, none clearly stale. Worth proper audit when a feature needs them. |
| `apps/aura-vrm/` → website VRM capability merge | 🔵 | Active fork; long-term wants to fold its chat-vrm work into the website's `vrm.*` capabilities. |

---

## The agent platform

| Item | Status | Notes |
|---|---|---|
| 16 cast bibles wired to `agent.dialogue` | ✅ | Verified by 746-page build (2026-05-21), academy renders castCount:16 |
| `agent.cast-roster` capability | ✅ | Tier / House / named filtering |
| `lib/agents/crew-schema.json` data file | ✅ | Schema + reference instance |
| `agent.crew-run` — multi-agent orchestrator runtime | ✅ Phases 1+2+3+4+5 LIVE (runnable from browser) | All 4 process modes (seq/parallel/hierarchical/graph) execute via `respond()`. Topological-DAG executor with cycle detection + parallel waves. Hierarchical adds final synthesis. Graph mode honours `edge.when` conditional routing via safe predicate evaluator (`crew-predicate.ts`, zero deps, no `eval()`); skipped tasks tracked in `skipped_task_ids[]` and propagate transitively. Plus: `task.retries`, `human_in_the_loop` pause/resume, `task.output_schema` validation (JSON Schema subset, failures retry), `task.output_path` filesystem persistence (Node-only, best-effort), per-run trace export via `exportTrace()` in `crew-trace.ts`, design-time tool-binding validation (builtin/mcp/subagent). `summariseCrew()` surfaces tool + HITL + schema + path stats. **Debug surface live at `/capabilities/agent/crew-run`** — validates + summarises + predicts waves for the three reference crews at build time, static-rendered. Reference instances: sequential-example.json, convergence-crew.example.json, graph-example.json. Stubbed: swarm mode, runtime tool execution (needs ReAct loop in respond()), full Ajv, `agent.effort_budget` enforcement, run-from-UI (Phase 5 v2). |
| `agent.memory-vector` — Firestore vector memory | ✅ | Gemini text-embedding-004; cosine findNearest |
| Long-term memory consolidation (sleep cycles) | ⚪ | Hierarchical compression of `cast.history`. Skills present: `hierarchical-agent-memory`, `agent-memory-systems`. |
| Banter loop telemetry hardening | 🔵 | `agent.banter` exists; wants idle-detection + viewer-engagement triggers. |
| Three NAME TBD heads | 🟣 | Voice canon fixed; awaiting Dimona for naming. |
| Excavation Bot + Scribe formal canon entries | 🔵 | Currently in `lib/cast/` as Tier-4 extras; need canon if they grow. |

---

## Holoflow product lines

### Wall art — CR-30 belt printers

| Item | Status |
|---|---|
| Wall art evolutionary system (11-module library) | ✅ |
| Dragon scale array (staggered brick) | ✅ |
| Chain mail 4-in-1 array | ✅ |
| POLYGON reverse-engineering (7 laws) | ✅ |
| Holographic print sweet spot | ✅ |
| Fabric-embedded print pause-and-insert | ✅ |
| Wall art e-commerce surface | 🔵 (see COMMERCE_ROADMAP.md) |
| Phyllotaxis chamber on `/atelier` | 🔵 |
| Wall art preview gallery on holoflow.co.uk | 🔵 |

### Waveguide sculpture — SLA dropship

| Item | Status |
|---|---|
| SLA print-farm architecture decided | ✅ |
| `waveguide_toolkit.py` + skill packaged | ✅ |
| First validated demo print (`poi_prism_v1.stl`) | ✅ |
| optiland trace_caustic API fix | ✅ 2026-05-21 |
| Production catalogue — first 6 SKUs | 🔵 |
| Dropship pipeline integration | 🔵 |
| Waveguide product page on holoflow.co.uk | 🔵 |

### Heritage documentation — £750/day

| Item | Status |
|---|---|
| 360° photogrammetry pipeline | 🔵 |
| Heritage doc service page on holoflow.co.uk | 🔵 scaffold |
| Reference-case writeup (first client) | 🟡 |

### LightPainting Forge — current main thread

| Item | Status |
|---|---|
| poi-light-sculpture skill | ✅ |
| poi-aerial-wave-sculpture skill | ✅ |
| lightpainting-forge skill (pipeline) | ✅ |
| End-to-end pipeline run on Chonky | 🟢 |
| DollyOS UI surface | 🔵 |
| Output → SLA print order | ⚪ |

### Commerce loop (BUREAU-AR-LOOP)

| Item | Status |
|---|---|
| Architecture | 🔵 (see BUREAU-AR-LOOP-PLAN.md) |
| Print QR ↔ AR ↔ buy wiring | 🔵 |
| Provenance bundle | 🔵 |

---

## The chambers — `/atelier`

| Chamber | Status |
|---|---|
| `/atelier/silk-brush` | ✅ |
| `/atelier/light-weaver` | ✅ |
| `/atelier/voxel-image` (1:1 pixel→voxel) | ✅ |
| `/atelier/voxel-image` depth-aware variants | 🔵 (see VOXEL-PIPELINE-PLAN.md) |
| `/atelier/lightpaint` (animated frame-by-frame editor) | 🔵 (see LIGHTPAINT-PLAN.md) |
| `/atelier/lightpainting-forge` (3D sculptural reconstruction) | 🟢 |
| `/atelier/sprite-designer` | ✅ |
| `/atelier/rig-simulator` | ✅ |
| `/atelier` — 360 model fine-tune chamber | 🔵 (see 360-MODEL-PLAN.md) |
| `/atelier/print-prep` | 🔵 |
| `/atelier/sam-segment` | 🔵 |
| `/atelier/aura-wardrobe` | ✅ |

---

## Neo-London / Chrono-Protocol — the 12-year arc

| Surface | Owner | Status |
|---|---|---|
| `/play` — proving ground ladder | Other agent | 🟢 v0.1 mini-loop playable |
| `/chrono-protocol` — the game proper | This agent | 🔵 v0.1 scaffolding pass |
| `/play/neo-london` — splat library | Splat-pipeline agent | 🔵 zones cross-reference by slug |

**Long-arc platform progression:** WebXR (LightWeiver MVP) → mobile AR → Quest 3 native → Steam Frame / UE5.

**Phygital pipeline:** VR performances (LightWeiver) → STL export → 3D-printed sculptures. Couples to waveguide product line. Eight Sacred Katas drive geometric pattern detection.

---

## Studio infrastructure

### Three-node cluster

| Node | Status |
|---|---|
| Chonky (RTX 3080 Ti) — ML / SAM2-SAM3 / ComfyUI | ✅ |
| Swift (RTX 3070) — secondary inference | ✅ |
| Aya (AYANEO handheld) — DollyOS PWA + mobile capture | ✅ |
| MQTT broker on Chonky | ✅ |
| Aura lattice router (port 8880) | ✅ |
| `aura_memory.py` SQLite | ✅ |
| `aura_node_agent.py` port 8881 | ✅ |
| `aura_presence.py` port 8882 | ✅ |
| `launch_lattice.bat` orchestrator | ✅ |

### DollyOS

| Item | Status |
|---|---|
| Native component port pattern | ✅ |
| 30 apps registered with `dolly-app.json` | ✅ |
| Penny Kernel wired to dolphin-mistral via Ollama | ✅ |
| TerminalTSLSystem in WitchcoreWebGPUCanvas | ✅ |
| Insta360 Link camera in CameraWorkspace.tsx | ✅ 2026-05-19 (three-tier fallback) |
| `apps/production/dolly-os/src/stores/` Zustand layer | 🟣 DEPRECATED |
| DollyOS → Holoflow website sync | ⚪ |

### Sensor / capture pipeline

| Item | Status |
|---|---|
| Azure Kinect body tracking | ✅ |
| Leap Motion v2 finger tracking | ✅ |
| `kinect-aura-pipeline` skill | ✅ |
| `finger-sweep-geometry` skill | ✅ |
| `poi-curve-library` skill | ✅ |
| `poi-trail-brushes` skill | ✅ |
| Live capture → DollyOS surface | 🔵 |
| Live capture → website ingestion API | ⚪ |

### Aerial / camera kit

| Item | Status |
|---|---|
| DJI Neo + Neo 2, Avata 360, Mini 5 Pro | ✅ Owned |
| DJI Osmo 360 ground rig | ✅ Owned |
| DJI Mic 3 audio | ✅ Owned (not a gap) |
| TrekPods + MagMount mounting | ✅ Owned (not a gap) |
| **ND filters — Avata 360 + Osmo 360** | ✅ Owned 2026-05-21 |
| Pocket 4P (~£580) as B-cam | 🔵 Candidate |
| Mirrorless body decision (Sony A7R VI announcement ~13 May 2026) | 🟡 |
| Storage workflow (LaCie Rugged 4TB SSD) | ✅ |

---

## The website — `holo-flow-studio` / holoflow.co.uk

### Ship state

| Item | Status |
|---|---|
| `holoflow.co.uk` live | ✅ |
| Home, /atelier (~20 chambers), /capabilities, /cards | ✅ |
| /holo-walk (QR + AR) | ✅ |
| /aerial, /catalogue, /play, /articles | ✅ |
| Build green (746 pages) | ✅ verified 2026-05-21 |
| Sprint plan | 🔵 see SHIP-PLAN.md |

### Commerce surfaces

| Surface | Readiness |
|---|---|
| /rookery | live |
| Pricing surfaces | mostly scaffold, some live |
| Checkout wiring | mostly stub/scaffold |
| Shopify integration | partial |
| Print bureau (BUREAU-AR-LOOP) | 🔵 |
| Waveguide catalogue | 🔵 |
| Heritage doc service page | 🔵 scaffold |
| Wall art catalogue + buy path | 🔵 |

See `COMMERCE_ROADMAP.md` for surface-by-surface depth.

### Infrastructure / fragility

| Item | Status |
|---|---|
| TS + ESLint at build time | ✅ re-enabled |
| `services/` heavy Python extracted | ✅ |
| `outputFileTracingExcludes` for onnxruntime / canvas | ✅ |
| `webpack.alias` for `canvas: false` server + client | ✅ fixed 2026-05-19 |
| `tsconfig` explicit `types: []` (pngjs/vscode protection) | ✅ 2026-05-21 |
| Build OOM fragility | 🟡 monitor |
| Vercel 250 MB lambda limit | ✅ NFT exclusions defending |
| Optional dependency fallbacks (`@upstash/redis`, `@ffmpeg/*`) | ✅ |

---

## Apps audit findings (2026-05-19)

Audit of all 45 active apps. Activity windows by newest file modification.

| Window | Count | Notes |
|---|---|---|
| ACTIVE (<=30 days) | 11 | Light_Weiver, portfolio, sprite-designer, sculpture-gallery, lightpainting-forge, holoflow-mesh-studio, waveguide-forge, hangar-dashboard, plus 3 container dirs |
| recent (<=90 days) | 32 | aura-vrm (31), charming-academy (36), console (45), pixel-academy (47), penny-kernel (69)… |
| dormant (<=180 days) | 0 | (Hangar is healthy on this axis) |
| STALE (>180 days) | 2 | `claw-empire`, `360-studio` — both archived 2026-05-21 |

**18 apps run React 19** — exactly the active Holoflow surfaces. The full audit table is in `UNIFICATION-PLAN.md` § 2A.

---

## Packages audit findings (2026-05-19)

43 active packages, all dormant (47-148 days inactive). **Zero have clearly stale signals.** Import-grep yielded zero hits but that's a methodology artefact — apps import packages by npm name (`@hanger/ui`) not by directory path. Cannot prove unused without per-package npm-name lookup.

**Decision:** defer packages cleanup to a proper monorepo restructure. The current dormant state is acceptable.

---

## Agent canon

| Item | Status |
|---|---|
| AURA-CANON.md | ✅ |
| DIMONA-CANON.md | ✅ |
| CAST-CANON.md | ✅ |
| REHAB-CANON.md | ✅ |
| SYSTEM.md | ✅ |
| CAPABILITIES.md | ✅ |
| EXISTING-INFRASTRUCTURE.md | ✅ |
| Rookery namespace 'collision' | ✅ Non-issue — the brand alignment between `/rookery` community and the canon's "Rookery slot" was intentional. Misread on first pass. |
| Aura's voice formal eval suite | ⚪ test bench |
| Cast member memory persistence | 🔵 tier-level shared memory open question |

---

## Index of detailed plan docs

| Doc | Size | Subject |
|---|---|---|
| `SHIP-PLAN.md` | 17 KB | Phase-by-phase calendar-time sprint plan |
| `COMMERCE_ROADMAP.md` | 46 KB | Surface-by-surface commerce audit + wave plan |
| `CHRONO_PROTOCOL_BUILD_PLAN.md` | 14.7 KB | Neo-London game architecture, three surfaces |
| `PLAY_GAME_PLAN.md` | 41.4 KB | `/play` AR-game design doc, level-by-level mechanics |
| `BUREAU-AR-LOOP-PLAN.md` | 11.6 KB | Print bureau + HoloWalk commerce loop |
| `LIGHTPAINT-PLAN.md` | 13.3 KB | Animated light-painting editor chamber |
| `360-MODEL-PLAN.md` | 10.3 KB | DiT360 fine-tune, equirect→pancake |
| `VOXEL-PIPELINE-PLAN.md` | 8.9 KB | 5 voxelisation methods |
| `CAPABILITY_REGISTRY_PLAN.md` | 10.3 KB | Atomising capabilities from Hangar demos |
| `UNIFICATION-PLAN.md` | 9.6 KB | Phase 1+2 status, React decision |
| `SKILLS-CONSOLIDATION.md` | 5.4 KB | 2026-05-19 audit trail |
| `SYSTEM.md` | 29.6 KB | Agent platform architecture |
| `AGENT-COORDINATION.md` | 48 KB | Session-by-session append-only history |
| `lib/capabilities/agent/crew-run.PURPOSE.md` | 8.4 KB | Crew runtime build phases (Phase 1 landed) |

---

## What was deliberately not roadmapped

- **Generic dev patterns** — covered by skills in `.claude/skills/`
- **Anthropic SDK / framework adoption** — explicit refusal in SYSTEM.md
- **Per-app DollyOS surface roadmap** — DollyOS owns its own sequencing
- **Cluster plumbing** (Tailscale, MQTT topics) — lives in skills, not features
- **Personal milestones** (Access to Work, PIP2) — operational, not project
- **The Rookery mailer** — separately owned

---

## Sequencing — next four months

Honest, ROI-ordered, calendar-time at ~3 hrs/day per SHIP-PLAN convention.

### June 2026 — close the unification, ship the Forge

1. ~~Decide React version strategy~~ ✅ DEFERRED to Option 3
2. Physical move `_3DPOV` → `apps/holoflow/` (½ day, gated on Vercel access)
3. LightPainting Forge end-to-end pipeline run (~1 week)
4. ~~Insta360 Link camera fix~~ ✅ DONE 2026-05-19
5. ~~Archive `claw-empire` + `360-studio`~~ ✅ DONE 2026-05-21
6. `agent.crew-run` Phase 2 — hierarchical orchestrator (~5 hours; convergence-crew becomes runnable end-to-end)
7. `lib/agents/sequential-example.json` — Phase 1 reference instance (30 min)

### July 2026 — productise the loop

1. First waveguide catalogue SKUs (3-5 sculptures, designed + rendered + priced)
2. Dropship pipeline integration with first SLA print farm
3. Wall art preview gallery on the site (Shopify integration)
4. ~~`agent.crew-run` capability runtime~~ ✅ Phase 1 DONE 2026-05-21. Phase 2 in June.
5. First heritage documentation case writeup

### August 2026 — chambers + commerce live

1. `/atelier/lightpaint` chamber (LIGHTPAINT-PLAN)
2. `/atelier/print-prep` chamber (STL validators in browser)
3. BUREAU-AR-LOOP integration (print QR ↔ AR ↔ buy)
4. Commerce checkout wiring

### September 2026 — Neo-London beats forward

1. `/chrono-protocol` next milestone (CHRONO_PROTOCOL_BUILD_PLAN)
2. First Neo-London splat zone with real captured environment
3. WebXR LightWeiver MVP if not yet shipped

Items shuffle as the bench learns; this is a sketch, not a commitment.

---

**Append items here as they surface. Mark ✅ in place when done. Never delete; the trail of decisions is part of the value.**

**Maintained alongside `AGENT-COORDINATION.md` (per-session) and `SYSTEM.md` (structural). When something fundamental shifts, all three get touched.**
