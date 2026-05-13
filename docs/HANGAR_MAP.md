# The Hangar — Coverage Map

_Maintained from 2026-05-13. Update with every migration wave._

The fourth survey of `D:\The_Hangar\` against `D:\.github\_3DPOV\`. The three prior surveys had a lens (narrative for `HANGAR_RECONCILIATION.md`, technical for `HANGAR_TECHNICAL_SURVEY.md`, commercial for `COMMERCE_ROADMAP.md`); the `BACKWARDS_DESIGN.md` is the /play curriculum spine. This one has a different lens: **coverage**. What's been migrated, what's left, what's deliberately skipped. The map is a living tracking document — every subsequent migration wave updates it.

Read-only across `D:\The_Hangar\` and `D:\.github\_3DPOV\`; the only file written is this one.

---

## 1. How to read this map

### Coverage status legend (canonical labels)

| Symbol | Status | Meaning |
|---|---|---|
| ✅ | MIGRATED | Landed on site; reference target file/route named |
| 🔄 | IN PROGRESS | Wave 2 agent currently working on it (in flight as of writing) |
| 📋 | QUEUED | Known, planned, assigned to a named wave |
| ⏳ | SURVEYED | Identified in a prior survey, not yet planned |
| ❓ | NEW | Found in this walk, decision pending |
| 🚫 | SKIP | Deliberate skip; reason in notes |
| 🔒 | PRIVATE | Internal-only; won't migrate per privacy/dignity rules |

### Cross-references to prior surveys

- `BACKWARDS_DESIGN.md` — /play curriculum prerequisites; the 12-level proof spine.
- `HANGAR_RECONCILIATION.md` — narrative + canon survey. Classes A (harvest), B (extend), C (reconcile), with §5–9 dedicated systems sections. **The first lens.**
- `HANGAR_TECHNICAL_SURVEY.md` — maths, mesh, geometry, algorithm catalogue. Classes T-A (new), T-B (extend), T-C (interactive), T-D (saleable), plus the 37-row maths catalogue. **The technical lens.**
- `COMMERCE_ROADMAP.md` — commerce surfaces, customer matrix, twenty saleable candidates, the workshop-side admin. **The commerce lens.**
- `MINED.md` — Hangar→site provenance log for what's already landed (Rookery, holofoil hypercube, Google OAuth, etc.).

Where this map references one of those surveys, the convention is "see `HANGAR_RECONCILIATION.md` §3 for the trans-led framing rationale."

---

## 2. Quick summary

A walk through `D:\The_Hangar\` recursively to one level deep + drill-down into the substantial directories. Counts are approximate (the Hangar is a living workspace; numbers drift as Dimona breathes).

| Metric | Count |
|---|---|
| Top-level entries at `D:\The_Hangar\` (dirs + files) | **~140** (about 75 dirs, 65 loose files at root) |
| Substantial directories (>10 files of substance) walked one level deeper | **~25** |
| Hangar pipelines named in `PIPELINES.md` | **7** (Alpha–Eta + smoke-test) |
| Hangar always-on services named in `HEARTBEAT.md` | **7** (aura_soul, mqtt, ollama, comfyui, soundscape, blender mcp, evolution loop) |
| MCP servers in `Servers/` | **~60 files** (`*_mcp.py`) |
| Apps in `apps/` | **49** directories |
| Prototypes in `apps/prototypes/` | **73** directories |
| Skills in `.agent/skills/` | **~1,471 directories** (vast; mostly tool-couplings, not voice material) |
| Studio-authored skills in `skills/` | **~140 directories** (Hangar-specific) |
| Articles on site | **34** (`components/articles/entries/*.tsx`) |
| Tutorials on site | **7** |
| Journal entries on site | **8** |
| Site lib data files | `loop.ts`, `play.ts`, `stack.ts`, `curriculum.ts`, `chrono-protocol.ts`, `journal.tsx`, `tutorials.tsx`, `writing.tsx`, `services.ts` + 13 sub-libs |
| Site asset catalogues at `lib/assets/` | `algorithms.ts`, `brushes.ts`, `flow-arts.ts`, `genomes.ts`, `meshes.ts` |
| Site routes | `/`, `/about`, `/aerial`, `/articles`, `/atelier`, `/bezel`, `/bureau`, `/chrono-protocol`, `/coming-soon`, `/contact`, `/journal`, `/learn`, `/photographs`, `/play`, `/policies`, `/practice`, `/product`, `/rookery`, `/search`, `/services`, `/signin`, `/sphere`, `/stack`, `/the-loop`, `/tutorials`, `/visualiser`, `/watch` (≈27 surfaces) |

### Status totals (entries cross-referenced in this map)

| Status | Count (approx) | Where |
|---|---:|---|
| ✅ MIGRATED | ~28 | Articles, lib data, visualisers, atelier algorithms (20/30), python-services that landed |
| 🔄 IN PROGRESS | ~5 | Wave 2: `app/atelier/algorithms/*` route, `app/atelier/evolution/*` route, `lib/evolution/*` (empty dir created) |
| 📋 QUEUED | ~22 | MINED.md queue + the 27 Class A pieces + commerce Wave |
| ⏳ SURVEYED | ~50 | The bench-only systems named in surveys but not yet planned |
| ❓ NEW | ~12 | Items this walk found that aren't in any prior survey |
| 🚫 SKIP / 🔒 PRIVATE | ~30 | Charming Academy lore, ZIPs, _legacy/, _archive/, business intel |

---

## 3. Top-level directory map

Every directory at the root of `D:\The_Hangar\`. Where relevant, the site target is named. Where the substance has been mined, the path on the site is given.

| Hangar path | Summary (≤50 chars) | Approx weight | Status | Site target / notes |
|---|---|---|---|---|
| `.FullName/` | Stub directory, unused | tiny | 🚫 SKIP | Empty placeholder. |
| `.agent/` | Bootstrap + huge agent skills tree | ~1,500 skill dirs | 🔒 PRIVATE | Most are tool-couplings (see `HANGAR_RECONCILIATION.md` §10). A handful (`waveguide-jewelry`, `holoflow-photo-to-sculpture-chain`, `holoflow-mesh-studio-tabs`) are publishable summaries — those map to Class A items, not to the directory itself. |
| `.agent_backup/` | Snapshot of `.agent/` | large | 🚫 SKIP | Duplicate. |
| `.claude/` | Claude harness state | small | 🔒 PRIVATE | Permissions + settings. |
| `.claude esting_history/` | Blender history file (mis-named "esting") | small | 🚫 SKIP | Blender autosave residue. |
| `.claw/` | Claw (Aura) hook harness | small | 🔒 PRIVATE | `pre_tool_use.ps1`, `post_tool_use.ps1`, settings. Operational. |
| `.cloudbot/` | Cloud agent config | small | 🔒 PRIVATE | Old agent runtime. |
| `.git/` | Git metadata | medium | n/a | — |
| `.github/` | GH workflows | small | 🚫 SKIP | Internal CI. |
| `.infrastructure/` | Cluster infra: builders, blender_addons, mosquitto, nginx, sam2, services, scripts | very large | 🔒 PRIVATE | Sub-dirs include `agent_configs/`, `cloud-compute-plane/`, `mosquitto/`, `nginx/`, `obs-plugins/`, `phygital-foundry/`, `production/`, `pipeline/`, `nursery_core/`, `lego-hub-cockpit/`. Operational; not voice material. |
| `.lorenz attractor in cyan_history/` | Blender history of attractor build | small | 🚫 SKIP | Sketch residue. |
| `.obsidian_vault/` | The studio's Obsidian PKM | medium | ⏳ SURVEYED | Contains `Knowledge Base/MORPHING_MATHEMATICS.md` (the keystone for the morphing article, Class A #9); `evolution_simulator_doc.md`; `AURA_NEO_LONDON_Game_Design_Philosophy.md`; `ISOMORPHIC_3D_WORKFLOW_RESEARCH.md`; `VRM_VIABILITY_ASSESSMENT.md`. Daily Notes + Templates + Agent Logs are private. The math doc maps to Class A #9 ⏳. |
| `.procedural_ambient_waveguide_evolution_history/` | Blender history | small | 🚫 SKIP | Sketch residue. |
| `.pytest_cache/`, `.ruff_cache/`, `.turbo/`, `.venv/`, `.vscode/`, `.tmp/`, `.qodo/`, `.roo/`, `.stitch/` | Tool caches | small | 🚫 SKIP | All transient. |
| `.strange claude first exprssion_history/` | Blender autosave | small | 🚫 SKIP | Sketch residue. |
| `Azure_Kinect_py/` | Kinect bridges + body tracking | 6 files | ⏳ SURVEYED | `aura_bridge.py`, `bodytracking.py`, `Poi)Trails_Live.py`, `leap_trails_live.py`, `pointcloud.py`. Pipeline Beta's capture leg. The trail-capture article (Class T-A #16, "Capturing a poi trail") would draw from these. No site equivalent for live body input. |
| `Data/` | Raw datasets | medium | 🔒 PRIVATE | Capture data; not publishable. |
| `Dolly_OS/` | The shell — Vite/React/three.js | very large | 🔒 PRIVATE | The fortress (port 5266). See §4.2 deep map. **Most of it stays in the Hangar**; specific systems (evolution, jewel-array, Aura, holoflow-mesh-studio) are mined onto the site as articles/data/visualisers, not as code imports. |
| `Lattice_Setup/` | MQTT/Mosquitto config (one `dist/`) | tiny | 🔒 PRIVATE | Operational lattice. |
| `Productions/` | Episodes + scenes + scheduler.log | small | 🔒 PRIVATE | Narrative-engine output state. The published narrative goes through articles, not through this directory. |
| `References_DO_NOT_EDIT_OR_CHANGE/` | Read-only canon + heritage | very large (~80+ files) | 🔒 PRIVATE | Explicit naming convention. `BRAIDED_VISION.md`, `DOLLYS_VISION.md`, `OCEAN_CLOTHING_SYSTEM.md`, the 100+ `kaomoji_*.json` files, the .tsx component snapshots. Studied + re-implemented; **never imported directly**. |
| `Servers/` | MCP servers — 60+ `*_mcp.py` files | very large | 🔒 PRIVATE | See §4.7. The MCP swarm. Each `*_mcp.py` is an operational tool. `aura_gateway.py`, `aura_soul.py`, `crew_mcp.py`, `gossip_mcp.py`, `lore_mcp.py`, `mind_palace_mcp.py`, `panopticon_mcp.py`, `sharp_mcp.py`, `sieve_mcp.py` etc. **None of these migrate to the site** — they are the bench's nervous system. |
| `Vtuber/` | VRM avatars + VTuber stack | very large (2GB+) | 🔒 PRIVATE | `Dimona.vrm`, `Dimonauk.vrm`, `DimonaukHair.vrm` + 30+ VTuber tool dirs (3tene, Luppet, VMagicMirror, VSeeFace, VNyan, Beat Saber etc.). The personal VRM stack — not publishable. The Aura body article (Class A #6 ⏳) will reference one VRM, not migrate the whole archive. |
| `_archive/` | The old Hangar Vault | very large | 🔒 PRIVATE | Contains `_archive/The_Hangar_Vault/portfolio-profile.json` — the canonical brand record (mined for `SESSION_SUMMARY_2026-04-13.md`). Also `Holo_Vault/` with protocol docs. Source for studio-pillar pricing (`Heritage Documentation £750/day`, `VR Consulting £500–650/day`, `Parametric Manufacturing £200–2,000/installation`). Read once, mined; the directory itself stays private. |
| `_intake_logs/` | Ingest logs | small | 🔒 PRIVATE | Operational. |
| `_legacy/` | Old code | medium | 🚫 SKIP | Migration discard. |
| `_upstream/` | Vendored upstream | medium | 🚫 SKIP | Mostly dependencies. |
| `agents/` | `hangar-plugin/` | small | 🔒 PRIVATE | Plugin entry. |
| `apps/` | 49 app directories | very large | mixed | See §4.1 deep map. Highest-density extraction target. |
| `assets/` | Studio asset library | medium | ⏳ SURVEYED | Will hold reference imagery, textures, sound. The site has its own `public/assets/` populated from select Hangar work. |
| `aura-upgraded-but-brokken-main/` | The "brokken" Aura | medium | 🔒 PRIVATE | Explicitly named "brokken" in `MIGRATION_FROM_AURA_BROKKEN.md`. **Source-of-truth for what NOT to repeat.** Holds `HOLOFLOW_STUDIO_MANIFESTO.md` (the brand manifesto, 300 lines — mined into `SESSION_SUMMARY_2026-04-13.md`). Repo itself stays private. |
| `boot/` | Boot scripts + state | small | 🔒 PRIVATE | `BOOT_UNIFIED.ps1` reads from here. Operational. |
| `brain/` | Orchestrator state (`89a686be-…/` UUID) | small | 🔒 PRIVATE | LangGraph/agent state. |
| `claude_cade_source/` | Claude code source dump | medium | 🚫 SKIP | Upstream code copy. |
| `concepts/` | 11 Gemini sample apps + zips | medium | 🚫 SKIP | Gemini SDK demos (audio-orb, gembooth, gemini-elegant-chat, imagen, maps-planner, promptdj-midi, veo-studio, video-to-learning-app). External demos; not studio work. |
| `config/` | Configs + shards/ + playbooks | small | 🔒 PRIVATE | `claude_desktop_config.json`, `extract-ui-pattern.workflow.json`, `sears-trawl-example.playbook.json`, `void_princess_symphony_pipeline.json`. Operational. |
| `console/` | Console UI for the Hangar (Node) | medium | 🔒 PRIVATE | A live operations console. |
| `docs/` | Hangar internal docs (separate from `.obsidian_vault`) | medium | 🔒 PRIVATE | Internal documentation register. |
| `drone_show/` | Skybrush server + studio-blender | medium | 📋 QUEUED | Aerial light-show choreography. **Skybrush is an external service** the studio orchestrates, not a migratable asset. Article direction: `/articles/the-drone-show-architecture` (one paragraph in `the-fleet` already; the deeper piece would name Skybrush). External dependency means 📋 at best. |
| `python-services/` | FastAPI backends — 60+ python files | very large | mixed | See §4.10. **Some have landed on site** (`morphing_engine.py`, `genome.py`, `fitness.py`, `caustic_optimizer.py`, `fresnel_generator.py`, `grin_generator.py`, `generators.py`, `choreography_engine.js` are all now mirrored at `D:/.github/_3DPOV/python-services/`). Most of the rest (`aura_voiceprint_service.py`, `chatterbox_service.py`, `dollyos_memory_service.py`, `dollyos_narrative_cluster.py`, `panopticon_service.py`, `vision_segmenter.py`, `whisper_service.py`, `tts_server.py`, `f5_tts_server.py`) stay private as operational backends. |
| `python_envs/` | Python virtualenvs | very large | 🚫 SKIP | Disk artefacts. |
| `queues/` | Job queues + results/ | small | 🔒 PRIVATE | `batch_jobs.json`, `results/`. Operational. |
| `references/` | External reference libraries (chromium, crewAI, mediapipe, three-vrm, etc) | very large | 🚫 SKIP | Vendored research. **Read, never imported**. The site's stack pieces (`/stack`) name the libraries here at the level of "these are the studio's dependencies"; the directory itself is not migrated. |
| `sam2/` | SAM2 model snapshot | very large | 🚫 SKIP | Model weights. |
| `scripts/` | Operational scripts (blender_pipelines, etc) | medium | 🔒 PRIVATE | Pipeline runner scripts. See `PIPELINES.md` for the 7 named pipelines that run from `D:\The_Hangar\scripts\blender_pipelines\pipeline_*.py`. |
| `services/` | Cross-Hangar service registry | medium | 🔒 PRIVATE | Service definitions. `service.json` at root references this. |
| `skills/` | Studio-authored skills (~140 dirs) | very large | 🔒 PRIVATE | See §4.11. **All Blender plugin skills (60+), all DollyOS skills, all production skills.** Some skills have publishable summaries (already mapped in Class A secondary tier). |
| `swarm-memory/` | Vector memory store | medium | 🔒 PRIVATE | Qdrant snapshots. |
| `swift_node_setup/` | Swift (laptop) bootstrap | small | 🔒 PRIVATE | Cluster setup. Tailscale `100.71.193.101`. |
| `swift_sync/` | Cross-node sync | small | 🔒 PRIVATE | Tailscale rsync helpers. |
| `tooling/` | `depot_tools/` only | small | 🚫 SKIP | Chromium depot_tools. **Distinct from `tools/`**: this is the Google-provided chromium-build helper; `tools/` is the studio-authored bench tooling. Resolution recommendation: rename to `_external_tooling/` or fold into `references/`. |
| `tools/` | Studio bench tooling — 22 dirs | very large | ⏳ SURVEYED | See §4.5. `AutoSeg-SAM2`, `Image-to-Pixel`, `InstantMesh`, `Unique3D`, `azure-kinect-py`, `lightpainting-forge-backend`, `lithophane`, `mesh-to-sdf`, `mesh-voxelization`, `nii2mesh`, `rembg-desktop`, `softxels`, `voxel2mesh`, `webgpu-marching-cubes`, `vmagicmirror`, `audio-reactive-led-strip`, `aubio-beat-osc`, `astro-stacker`, `pixeldetector`, `pixelorama-kcentroid`, `blender-mcp-legacy`. **Each tool is a vendor + the studio's wrapper.** The Hangar-authored bridges (`leap-bridge`, `ndi-bridge` mentioned in user memory) live elsewhere — `leap-bridge` is in `apps/`, `ndi-bridge` reference under user memory. |
| `training/` | `master_identity/` | small | 🔒 PRIVATE | LoRA/fine-tuning identity. |
| `wiki/` | Internal wiki: README + infrastructure/ + pipelines/ + skill_tree/ | small | 🔒 PRIVATE | Operational wiki. Mostly outdated by Obsidian vault. |
| `waveguide/` | Standalone waveguide toolkit + outputs/ | small | ⏳ SURVEYED | `waveguide_toolkit.py` + `install_waveguide_deps.bat`. The standalone version of the waveguide pipeline; live source lives elsewhere (in `apps/waveguide-forge/`). |
| `workflows/` | ComfyUI/pipeline workflows | small | 🔒 PRIVATE | `holoflow_photo_to_sprite.json` — the photo→sprite ComfyUI graph. **Triggers the Holoflow Loop**; runs from `engines/comfyui/`. |
| `workspace/` | 12 sub-workspaces incl. antigravity, charming-academy (parallel copy), drl-sim, generative-nexus, hunyuan3d-2.1, light-printer, mesen2, open-brush, three, touchdesigner | very large | 🔒 PRIVATE | Each sub-workspace is an experimental sandbox. `aura-pwa-fragments/`, `charming-legacy/` are duplicates of work elsewhere. **Workspace = scratch space; the `apps/` directory is the canonical place for things.** |
| `writeups/` | Studio writeups | tiny | ✅ MIGRATED | `2026-05-12-nine-seconds-to-printable.md` — already on the site as `articles/nine-seconds-prompt-to-printable.tsx`. Going forward, every Hangar writeup that ships as a site article should be linked here for provenance. |
| `xrblocks_playground/` | Google XRBlocks experimental playground | very large | ⏳ SURVEYED | Google's open-source WebXR component library. The `MINED.md` queue lists "WebXR foundation" from `packages/webxr-vr` + `xrblocks_playground` → `lib/xr/` + `app/portal/`. Pending until the Rookery has a VR room (Class A — Rookery VR, queued). |

### Loose root-level files (the non-directory entries)

| File | Type | Status | Notes |
|---|---|---|---|
| `2x4biomimeticarray.blend`, `4x4arraybiomimetic.blend`, `array 4x4 of objects.blend*` (autosave variants), `claude esting.blend`, `claude learning 2.blend*`, `strange claude first exprssion.blend`, `test 2.blend*` (multiple autosaves), `procedural_ambient_waveguide_evolution.blend*` | Blender files | 🚫 SKIP | Sketch + autosave residue. Some (the biomimetic arrays) are the sources for the published wall-array imagery but the binaries don't migrate. |
| `AGENTS.md` | Hangar agent constitution | 🔒 PRIVATE | "Nanny" tone + PTC + Hangar Registry. **Internal agent doc.** |
| `BOOT_UNIFIED.ps1`, `BOOT_UNIFIED_patch.ps1` | Boot scripts | 🔒 PRIVATE | The `start-the-system` entry point — load `hangar-launcher` skill. |
| `CLAUDE.md` | Project notes for Claude harness | 🔒 PRIVATE | DollyOS port (5266), AuraVTuber plan, install pattern. |
| `CODE_EXPLORATION_2026-04-14.md`, `CODE_EXPLORATION_PART2_2026-04-14.md` | Code archaeology pass | 🔒 PRIVATE | Internal session log. |
| `GEMINI.md` | Developer track for Gemini agent | 🔒 PRIVATE | Mirrors AGENTS.md. |
| `HANGAR.md` | **Master reference** for the project — Future London canon, students/mentors/peers, departments, the crystal-shell rule | 🔒 PRIVATE | The full architectural North Star. **Read by every session.** Source of much that the site's narrative articles reach for. Stays private. |
| `HEARTBEAT.md` | Always-on services state | 🔒 PRIVATE | See §5. Aura_soul + MQTT + Ollama + ComfyUI + soundscape + Blender MCP + evolution loop. |
| `LIVE_LOG.md`, `SESSION_SUMMARY_2026-04-13.md` | Session logs | 🔒 PRIVATE | Operational state. |
| `PIPELINES.md` | The 7 canonical production pipelines | 🔒 PRIVATE → ⏳ partial | See §4 below for the inventory. **The pipelines themselves stay private** (they orchestrate physical/digital ops); some of the *outputs* surface as articles. |
| `README.md` | Hangar overview | 🔒 PRIVATE | Internal landing. |
| `STATUS.ps1`, `START_EVERYTHING_LEGACY.ps1`, `STOP_EVERYTHING.ps1`, `START_MCP_LATTICE.bat`, `SYNC_TO_STICK.ps1`, `LAUNCH_DOLLYOS.bat`, `register_aura_gateway.ps1`, `register_hangar_autostart.ps1`, `register_task_admin.bat`, `resize_cave.ps1` | Boot + ops scripts | 🔒 PRIVATE | Operational. |
| `UNIVERSAL_AGENT_PROTOCOL.md` | Agent contract | 🔒 PRIVATE | Internal protocol. |
| `_patch_aura_intro.py`, `_patch_chatpanel.py`, `_recent_files.py`, `_verify_chat.py`, `_verify_patch.py` | One-off patches | 🚫 SKIP | Migration helpers. |
| `animate_awesome.py`, `build_sculpture.py`, `check_deps.py`, `query_blender_addons.py`, `split_thumbs.py`, `test_blender_ping.py`, `test_bsdf.py`, `test_loop_end_to_end.py`, `trigger_comfy.py` | Bench Python scripts | 🔒 PRIVATE | One-off bench scripts. `build_sculpture.py` is referenced from PIPELINES.md Pipeline Delta. |
| `b2.txt`, `pc2.txt`–`pc7.txt`, `pf1.txt`–`pf4.txt`, `poi_b64.txt`, `poi_fresh_b64.txt`, `poi_cross_top.png`, `sculpture_v1*.png`, `sculpture_sm.b64`, `thumb_gen_*.b64`, `thumbs_b64.json`, `thumbs_sm.json`, `waveguide_preview.png`, `turntable.gif` | Working captures | 🚫 SKIP | Workbench scratch. |
| `Kitchen and more tileset [16x16].zip`, `Serene_Village_revamped_v1.9.zip`, `Serene_Village_v1.2.zip` | Bundled pixel tilesets | 🚫 SKIP | Asset sources for pixel-art work. |
| `agent-town-main.zip`, `claude-code-source-build-master.zip`, `claw-code-main.zip`, `comfy_shunt.zip` (1.9GB), `swift_launch.zip`, `test-5-main.zip`, `Vtuber.7z` (3GB), `Azure_Kinect_py.7z` | Vendored ZIPs | 🚫 SKIP | Source bundles. Working copies are in unzipped directories. |
| `claude-code-source-build-master.zip` | Upstream Claude Code source | 🚫 SKIP | — |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`, `tsconfig.tsbuildinfo`, `turbo.json`, `requirements.txt`, `.env`, `.env.example`, `.env.shapeways.example`, `service.json` | Monorepo manifests | 🔒 PRIVATE | The Hangar Turborepo configuration. **The site has its own**; nothing migrates. |
| `runpod_void_setup.ipynb` | RunPod setup notebook | 🔒 PRIVATE | For the LongCat-AudioDiT remote backend referenced in `HANGAR_RECONCILIATION.md` §8. |
| `tri_table_correct.ts` | Marching-cubes table (loose) | ✅ MIGRATED in principle | The 256-entry triangle lookup; site has it at `apps/lightpainting-forge/src/mc-tables.ts` *(in the Hangar)* + migrated derivative at `lib/visualiser/marching-cubes-math.ts` on the site. |

---

## 4. Substantial directory deep maps

### 4.1 `apps/` — the 49 apps

The single highest-density extraction target. Three of these (`poi-sculptor`, `neo-london-chrono-protocol`, `holoflow-mesh-studio`) carry the majority of the site's harvestable substance via their docs + source. Coverage status:

| App | What's in it | Status | Site coverage |
|---|---|---|---|
| `360-studio/` | 360° image viewer prototype | 📋 QUEUED | MINED.md queue — destined for `components/media/sphere-viewer.tsx`. Site has `/sphere` route stub. |
| `App/` | Top-level app skeleton | 🚫 SKIP | Empty entry. |
| `Light_Weiver/` | LightWeiver Studio (port 5219) | 🔒 PRIVATE | Operational satellite app. |
| `REGISTRY.md` | App registry manifest | 🔒 PRIVATE | Internal manifest. |
| `_archive/` | Archived apps | 🚫 SKIP | — |
| `agent-town/` | Agent-town demo | 🔒 PRIVATE | Internal. |
| `aura-pwa/` | Aura PWA shell | 🔒 PRIVATE | Earlier Aura incarnation. |
| `aura-vrm/` | **The Aura VRM standalone app** (Section 8 of `HANGAR_RECONCILIATION.md`) | ⏳ SURVEYED | `ARCHITECTURE_AURA.md`, store slices (vrm/chat/voice/transcription/external/wardrobe/idleLife/kinect/motionCapture/soul/webcam/functionCalling), Kokoro TTS, LongCat-AudioDiT remote, 300ms orientation loop, lipSync analyser. Maps to Class A #6 ("articles/aura-the-body") — top-three priority. MINED.md has "Aura companion → embedded VRM in a corner of the site" queued. |
| `charming-academy/` | The Academy app (port TBD) | 🔒 PRIVATE | See `SESSION_SUMMARY_2026-04-13.md` §5 — the deportment/agent/cohort/Little-Sister-Protocol app. Private per `HANGAR_RECONCILIATION.md` §10 (self-taught invariant). |
| `claw-code-main/` | Claw harness source | 🔒 PRIVATE | Vendored. |
| `claw-empire/` | The Academy learning env (named in `HANGAR.md`) | 🔒 PRIVATE | "Never successfully booted" per `HANGAR.md`. Internal. |
| `clothing-reverse-engineer/` | 2D-catalog → 3D garment | ⏳ SURVEYED | `HANGAR_RECONCILIATION.md` §2 secondary tier — could become `/articles/2D-to-3D-the-catalog` if academy framing stripped. Currently 🚫 because of academy entanglement. |
| `comfy-layered-ai-ui/` | ComfyUI layered UI | 🔒 PRIVATE | Internal Comfy harness. |
| `console/` | Console app | 🔒 PRIVATE | — |
| `core-dashboard/` | Studio dashboard | 🔒 PRIVATE | — |
| `dashboard/` | Another dashboard | 🔒 PRIVATE | Duplicate / parallel. **Three dashboard apps exist** (`core-dashboard`, `dashboard`, `unified-dashboard`, `revenue-dashboard`, `hangar-dashboard`) — naming drift; not migrated. |
| `discord-bot/` | Discord bot | 🔒 PRIVATE | The Rookery v0 took the auth-gating pattern from here, per MINED.md. |
| `experiments/` | Active experiments | 🔒 PRIVATE | Scratch. |
| `gemini-co-drawing/` | Gemini co-drawing demo | 🚫 SKIP | External demo. |
| `goose-ui-digest-graph/`, `goose-ui-monorepo/` | Goose UI experiments | 🔒 PRIVATE | Internal UI lab. |
| `hangar-dashboard/` | Hangar ops dashboard | 🔒 PRIVATE | Operations panel; not migrated. |
| `hanger-agency/` | Agency-side dashboard | 🔒 PRIVATE | — |
| `holoflow-mesh-studio/` | **The mesh/fabrication app** (Section 5 of `HANGAR_RECONCILIATION.md`) | ⏳ SURVEYED | `APP_ARCHITECTURE.md` is the master geometry blueprint — Genesis channels (8), GeoDict contract, 28-gene schema (delegated to `python-services/genome.py`), HoloFlow_Loop_Orchestrator (the missing wire), the Sieve VLM, the Oracle gate, provenance JSON. Maps to Class A #11 (Sieve+Oracle), #12 (provenance), #7 (Evolution Suite), #8 (eight kingdoms), #10 (the alphabet). Five separate articles cover this app; the app itself stays private. |
| `lattice-browser/` | Neo-London lattice viewer | 🔒 PRIVATE | Iframe-able into Dolly_OS. |
| `leap-bridge/` | Ultraleap → WebSocket bridge | ⏳ SURVEYED | `tools/leap-bridge/server.py` ws://localhost:6969 (per user memory + `HANGAR_RECONCILIATION.md` §8). Used by Pipeline Beta + Pipeline Delta. Class T-A #16 ("Capturing a poi trail") and Class A #6 (Aura body) both reference. |
| `lightpainting-forge/` | **The 2D→3D pipeline app** | ⏳ SURVEYED | Class T-A #9, #10 from technical survey. Production source for the "Nine seconds prompt to printable" article (✅ MIGRATED at `articles/nine-seconds-prompt-to-printable`). Code itself stays in Hangar; algorithms are extracted to `lib/visualiser/marching-cubes-math.ts` ✅ + `lib/algorithms/*.ts` ✅ partial. |
| `linkedin-ghostwriter/` | LinkedIn auto-writer | 🚫 SKIP | Marketing tool; not voice material. |
| `local-chat-vrm/` | VRM chat reference | 🔒 PRIVATE | Per HANGAR.md: "Mine for components (emotion, lip sync)." Slated for retirement (see SESSION_SUMMARY §5). |
| `penny-kernel/` | Penny desk agent | 🔒 PRIVATE | Penny is named in HANGAR.md as a mentor. The kernel is operational. |
| `pixel-academy/` | Academy learning env | 🔒 PRIVATE | Slated for retirement into `charming-academy`. |
| `pixel-agents-local/` | Local agent tooling | 🔒 PRIVATE | — |
| `portfolio/` | Portfolio app | 📋 QUEUED | MINED.md queue — "Portfolio layout patterns → new `/portal` or `/work` surface." |
| `production/` | Production app(s) | 🔒 PRIVATE | Operational. |
| `prototypes/` | **73 prototypes** | mixed | See §4.4. The prototype catalogue includes the Hangar's most extractable substance — `poi-sculptor/`, `neo-london-chrono-protocol/`, `shape-of-it/`, `360-camera-to-ue5-gaussian-splatting-guide/`, `flowarts-academy-vr/`, `aura-terminal/`, `aura-webgpu/`, `dollyos-sandbox/`, `noclip-website/`, `quest-3-120hz-protocol/`, `webgpu-gaussian-splatting/`, and many more. |
| `remotion/` | Remotion video render | 🔒 PRIVATE | Internal video pipeline. |
| `revenue-dashboard/` | Revenue dashboard | 🔒 PRIVATE | Commerce-internal. |
| `sculpture-gallery/` | **3D mesh viewer prototype** | 📋 QUEUED | MINED.md queue — "upgrade `components/product/glb-viewer.tsx`." 6 TypeScript files including `marching.ts`, `mc-tables.ts`, `voxels.ts`, `npy.ts`, `exportGlb.ts`. Companion to the `poi-sculptor` reduction. |
| `see-through/` | See-through visualiser | 🔒 PRIVATE | — |
| `silk-brush-canvas/` | Silk-brush canvas component | 🔒 PRIVATE | The "silkbrush" components in Dolly_OS reference this. |
| `sprite-designer/` | Sprite designer | 🔒 PRIVATE | Pixel-art tool. |
| `stitch-mcp/` | Stitch MCP integration | 🔒 PRIVATE | — |
| `sub-teen-wardrobe/` | Junior-Miss wardrobe app | 🔒 PRIVATE | Per `HANGAR_RECONCILIATION.md` §10 — explicitly named private. No publishable thread. Skip entirely. |
| `swarm-bridge-ui/` | Swarm bridge UI | 🔒 PRIVATE | — |
| `unified-chat-demo-react/` | Chat demo | 🔒 PRIVATE | — |
| `unified-dashboard/` | Another dashboard | 🔒 PRIVATE | Duplicate. |
| `unified-tui/` | Terminal UI | 🔒 PRIVATE | — |
| `vr-sculpting-demo/` | VR sculpting | 🔒 PRIVATE | Slated for retirement into `holoflow-mesh-studio` (per SESSION_SUMMARY §4). |
| `waveguide-forge/` | **The waveguide-design app** | ⏳ SURVEYED | TS + GLSL — `caustic.glsl.ts` (raymarched), `webgpu-photonmap.ts` (TSL forward photon-map), `sdf-loader.ts`. Class T-A #17 ("The second caustic engine"). Pending an article + maybe a `/visualiser/gyroid` route (Class T-C #3). |

### 4.2 `Dolly_OS/` — the shell

Port 5266 (per `CLAUDE.md`) / 5173 (per `HANGAR.md`). Vite + React 19 + Three.js r183 WebGPU/TSL. **The crystal.** Everything else in The Hangar is a shard.

```
Dolly_OS/
├── src/
│   ├── components/
│   │   ├── AuraVRM.tsx                     ⏳ Class A #6
│   │   ├── evolution/                      ⏳ Class A #7 (the 14 stations S0–S19)
│   │   ├── aura/, aura-vrm-parts/, aura_vtuber/  ⏳ Class A #6
│   │   ├── waveguide/                      ⏳ Class A #17 (the waveguide forge)
│   │   ├── silkbrush/                      🔒 PRIVATE
│   │   └── studio/AuraPlanReview.tsx       🔒 PRIVATE
│   ├── lib/
│   │   ├── evolution/                      ⏳ Class A #7, #8, #10
│   │   │   ├── evolution-engine.ts + sub-engine
│   │   │   ├── kingdoms/index.ts (8 KINGDOMS)
│   │   │   ├── builders/, growth-patterns/
│   │   │   ├── genome-store.ts, genome-types.ts, genome-defaults.ts
│   │   │   ├── FitnessScorer.ts, MarchingCubesService.ts, SpecimenRenderer.ts
│   │   │   ├── LumiDualService.ts, ancestryToOptics.ts
│   │   │   └── evolution.worker.ts
│   │   ├── AudioLipSync.ts                 ⏳ Class A #6 (the 5-vowel formant analyser)
│   │   ├── vrmBlendShapeController.ts      ⏳ Class A #6
│   │   └── VRMAnimation/                   ⏳
│   ├── systems/
│   │   ├── jewel-array/                    ⏳ Class A #4 (the atelier) — THE highest-priority extract
│   │   │   ├── JewelArrayApp.tsx
│   │   │   ├── geometry/algorithms/        32 algorithms; 20 ✅ MIGRATED to `lib/algorithms/`
│   │   │   ├── geometry/{GeometryEngine, GeometryRegistry, BailInjector}.ts
│   │   │   ├── scoring/AestheticScorer.ts  ⏳ Class T-A #12
│   │   │   ├── taxonomy/{FamilyTaxonomy, RootConcepts, TaxonomyEngine}.ts
│   │   │   └── workers/
│   │   └── nanny/voiceStore.ts             ⏳
│   ├── lib/aura/                           ✅ Site has `lib/aura/gemini.ts` + `prompts.ts`
│   └── api/                                Internal Vite routes
├── public/
│   ├── docs/The_Charming_Academy/  ~40 chapters  🔒 PRIVATE (the deportment academy)
│   ├── shape.html                          ⏳ Class T-C #3 (`/visualiser/gyroid`)
│   └── ...
├── docs/
│   └── academy/                            🔒 PRIVATE
├── python-services/                        Mirror of root python-services (some)
├── services/                               Internal MCP shims
├── skills/                                 DollyOS-specific skills (subset of root skills/)
├── convex/                                 Convex backend (live)
├── projects/                               Subprojects
├── scripts/                                Internal Vite/Hangar scripts
└── (extensive operational logs)
```

**The 14 evolution stations** (per `HANGAR_RECONCILIATION.md` §5) — S0 PerformanceGateway, S2 Crossbreeding, S4 FitnessArena, S5 FreeformLab, S6 MegalithForge, S6 NarrativeLab, S7 VaultExplorer, S10 WaveguideOptics, S12 MorphogeneticCrucible, S14 LiveInstallation, S15 GenomeArchive, S17 HoloFlow_Hub, S18 MosaicWall, S19 MorphoGardener + EvolutionHub, EvolutionCanvas, EvolutionSuitePage. **All 14 are ⏳ SURVEYED**; the article "Inside the Evolution Suite" (Class A #7) is the workshop-tour summary, not a code migration.

**Resolution recommendation for the parallel Aura VRM stacks**: `apps/aura-vrm/` (the standalone) and `Dolly_OS/src/components/AuraVRM.tsx + aura_vtuber/ + aura/ + aura-vrm-parts/` (the shell-integrated). Per `SESSION_SUMMARY_2026-04-13.md` §5 "Component authority table": **VRM viewer is the aura-vrm version; emotion controller + lip sync = local-chat-vrm version; LLM service = aura-vrm version; 67 VRMA animations = aura-vrm canonical.** Both are public-grade. **The site article should reference the canonical authority per-component, not pick one app as the canonical app.**

### 4.3 `Azure_Kinect_py/`

Six files: `aura_bridge.py`, `bodytracking.py`, `Poi)Trails_Live.py` (typo + capital), `leap_trails_live.py`, `pointcloud.py`, plus a `Azure_Kinect_py.7z` archive.

| File | Function | Status | Site equivalent |
|---|---|---|---|
| `aura_bridge.py` | Live Kinect → Aura VRM avatar bridge (skeletal injection over WebSocket) | ⏳ SURVEYED | Site has `lib/aura/gemini.ts` for video frame analysis but **no live body input** pipeline. |
| `bodytracking.py` | Azure Kinect Body Tracking SDK wrapper | ⏳ SURVEYED | No site equivalent. |
| `Poi)Trails_Live.py` | Live poi-trail capture from Kinect + IMU + render | ⏳ SURVEYED | Class T-A #16 covers this in tutorial form. |
| `leap_trails_live.py` | Live Leap Motion poi-trail capture | ⏳ SURVEYED | Class T-A #16. |
| `pointcloud.py` | Kinect depth → point cloud | ⏳ SURVEYED | No site equivalent. |

All five feed Pipeline Beta (Avatar Somatic Bridge) and Pipeline Delta (Fabrication Chain) per `PIPELINES.md`. **Body input → site is ⏳ SURVEYED**. The Pipeline Beta would land as a `/tutorials/capturing-a-poi-trail` (Class T-A #16) but **the live capture itself stays bench-side** — it depends on hardware (Kinect, Leap) and a daemon process.

### 4.4 `apps/prototypes/` — 73 prototypes

The single largest mining surface. Walking is selective; the high-value ones first.

| Prototype | What it is | Status | Site coverage |
|---|---|---|---|
| `360-camera-to-ue5-gaussian-splatting-guide/` | 360→UE5 Gaussian splat pipeline guide | ⏳ SURVEYED | Class A secondary tier — `/tutorials/360-to-splat` queued. Referenced from `articles/neo-london-chrono-protocol` and `/play/neo-london`. |
| `360-studio/` | 360 image viewer (twin to `apps/360-studio/`) | 📋 QUEUED | MINED.md queue. |
| `3d-cosplay-marketplace/` | Cosplay marketplace concept | 🚫 SKIP | Off-thesis. |
| `AcademyFloorManager/` | Floor-manager for the academy | 🔒 PRIVATE | Academy-internal. |
| `Portable360ToolKit/` | 360° asset toolkit | ⏳ SURVEYED | Possibly extracts to a bureau-side tool. |
| `agency-os-demo/`, `agent-demo/`, `agent-starter-react/`, `agentoffice-reid/` | Agent demos | 🔒 PRIVATE | Internal. |
| `ai-quilting-designer/` | Quilt designer | 🔒 PRIVATE | — |
| `ai-robotics-sim/` | Robotics sim | 🔒 PRIVATE | — |
| `ai-video-repurposing-workflow/` | Video repurposer | 🚫 SKIP | Marketing tool. |
| `appjack/` | Iframe wrapper for ComfyUI etc | 🔒 PRIVATE | Tim's department (per HANGAR.md). |
| `apps-new/` | Skeleton for new apps | 🚫 SKIP | Scaffolding. |
| `archviz-studio-pro/` | Architecture viz | 🔒 PRIVATE | — |
| `arrayflow-dataops/` | Data ops | 🔒 PRIVATE | — |
| `aura/`, `aura-scene/`, `aura-terminal/`, `aura-webgpu/` | Aura prototype variants | 🔒 PRIVATE | All earlier Aura incarnations. Slated for absorption into `apps/aura-vrm` + Dolly_OS. |
| `bandwidthhero/` | Bandwidth optimizer | 🚫 SKIP | Off-thesis. |
| `blender-mcp-react/`, `blender_mcp.py`, `blender_scribe.py`, `launch_blender_scribe.bat`, `run_dev.bat` | Blender MCP control surface | 🔒 PRIVATE | Operational. |
| `clothing-reverse-engineer/` | 2D→3D garment (parallel to `apps/clothing-reverse-engineer/`) | ⏳ SURVEYED | Same status. |
| `collabvr-studio/` | Multi-user VR | 📋 QUEUED | MINED.md "Multi-user VR" queue. |
| `cost_dashboard/`, `dollhouse-1/`, `dollhousegithub/`, `dolly-guide-generation/`, `dolly-portfolio/`, `dolly-protocol-generator/` | Dolly-line internal apps | 🔒 PRIVATE | Internal tooling. |
| `dollyos-sandbox/` | DollyOS sandbox prototypes (synthwave aesthetic, biomimetic array, VRM voice app) | ⏳ SURVEYED | Per `dollyos-sandbox-prototypes` skill. The synthwave-on-grey aesthetic is partly mirrored in the site's `holofoil-hypercube.tsx`. |
| `fabric-calculator/` | Fabric calc | 🔒 PRIVATE | — |
| `flowarts-academy-vr/` | The Dance Tutor app (per HANGAR.md) | ⏳ SURVEYED | High-priority port per HANGAR.md. The site article-equivalent doesn't exist — the prototype's content is the curriculum-ladder material. |
| `flowarts-next/` | Next.js flow-arts site | ⏳ SURVEYED | Possibly an earlier holoflow site. |
| `frames/` | Frame manager | 🚫 SKIP | — |
| `goose-ui-digest-graph/`, `goose-ui-monorepo/` | Goose UI (duplicate of root `apps/`) | 🚫 SKIP | Duplicate. |
| `homelab-designer/` | Homelab designer | 🚫 SKIP | Off-thesis. |
| `light-dancer-ai-blueprint-tutorial/` | Light-dancer tutorial | ⏳ SURVEYED | Possibly a `/tutorials` candidate. |
| `mini-apps/` | Small apps | 🔒 PRIVATE | — |
| `modal-lattice-resolution-v2/` | Modal lattice | 🔒 PRIVATE | — |
| `my_tui_project/` | TUI project | 🚫 SKIP | — |
| `neo-london-chrono-protocol/` | **The runner game prototype** | ✅ MIGRATED | Site has `articles/neo-london-chrono-protocol.tsx` ✅ + `lib/chrono-protocol/{dialogue, scoring, state, zones}.ts` ✅ + `/chrono-protocol` route ✅. **Live coverage** of constants, zones, modes, AURA/YOW/PURP voice spec. Class B #5 reconciliations resolved. |
| `newapp/` | New app scaffold | 🚫 SKIP | — |
| `noclip-website/` | Noclip-style website | 🔒 PRIVATE | — |
| `poi-sculptor/` | **The poi-sculptor app + docs** | ⏳ SURVEYED | The single largest reference-extraction target. 16 markdown docs in `docs/` + ~60 source files. Mined for `articles/{the-convergence, how-the-studio-breeds-sculptures, the-living-stage, jewellery-the-same-trace-wearable, why-the-pendant-glows-from-the-inside, colour-without-pigment, lineage-marey-to-now}` ✅. **9 of 14 docs still partially/unmined.** Class A #1, #2, #3, #5, #13, #15 derive from this directory. |
| `privategpt-unified/` | Private GPT | 🔒 PRIVATE | — |
| `prompt-foundry/` | Prompt engineering | 🔒 PRIVATE | — |
| `prototype-main/` | Generic | 🚫 SKIP | — |
| `quest-3-120hz-protocol/` | Quest 3 120Hz mode protocol | ⏳ SURVEYED | Likely a sidebar in `vr-pov-controllers-the-product` (the bezel article). |
| `sapient-unreal/` | Unreal-side AI | 🔒 PRIVATE | — |
| `screenshot-studio/` | Screenshot tooling | 🚫 SKIP | Internal. |
| `sewing-cost-calculator/` | Sewing cost calc | 🔒 PRIVATE | — |
| `shape-of-it/`, `shape-scene/` | "Shape of It" sculpture (the WebGPU/TSL centrepiece) | ⏳ SURVEYED | Site has `/sphere` route stub. The full Shape-of-It piece is a future Physics-dept showpiece — see `shape-of-it` skill at `D:\The_Hangar\skills\shape-of-it\`. Currently 📋 QUEUED for `/visualiser/gyroid` per Class T-C #3. |
| `studio-network-advisor/` | Network advisor (Marcel's dept per HANGAR.md) | 🔒 PRIVATE | Internal. |
| `temporalstory-engine/` | Temporal story engine | 🔒 PRIVATE | — |
| `threadlogic-ai-pattern-prototyper/` | Thread-Logic (Logistician dept per HANGAR.md) | 🔒 PRIVATE | Internal. |
| `throughline-mission-control/` | Throughline (Shelly's dept per HANGAR.md) | 🔒 PRIVATE | Internal. |
| `unified-chat-demo/` | Chat demo | 🚫 SKIP | — |
| `videoforge-ai/` | Video forge | 🔒 PRIVATE | — |
| `waveguide_dash/` | Waveguide dashboard | 🔒 PRIVATE | — |
| `web/` | Web prototype | 🚫 SKIP | — |
| `webgpu-gaussian-splatting/` | WebGPU GS viewer (port 5262) | 📋 QUEUED | MINED.md queue (WebXR foundation). Used by `/play/neo-london`. |
| `websocket-relay-server/`, `websocket-relay-server-client/` | WS relay | 🔒 PRIVATE | Operational. |
| `wiggle-ui/` | UI experiments | 🚫 SKIP | — |

**Headline**: of the 73 prototypes, the **highest-value extracts** are `poi-sculptor/` (the docs goldmine), `neo-london-chrono-protocol/` (already migrated), `360-camera-to-ue5-gaussian-splatting-guide/` (queued), `flowarts-academy-vr/` (surveyed). Everything else is either internal tooling, an earlier incarnation, or off-thesis.

### 4.5 `tools/` — 22 studio bench tooling vendors

Each entry is the vendor's own source + the studio's wrapper/integration.

| Tool | Vendor | What for | Status | Site coverage |
|---|---|---|---|---|
| `AutoSeg-SAM2/` | Meta + studio wrappers | Auto-segmentation (SAM2) | ⏳ SURVEYED | Powers the 9-second pipeline; Class T-A #9 ("photograph-to-voxel-field") names it. Article ✅. |
| `Image-to-Pixel/` | Pixel-art converter | Image → pixel art | 🚫 SKIP | Pixel-art workflow tool. |
| `InstantMesh/` | TripoSR-class single-image-to-mesh | Image → mesh | ⏳ SURVEYED | Referenced in `from-photograph-to-object`. Backbone tool. |
| `Unique3D/` | Better mesh from image | Image → mesh | ⏳ SURVEYED | Alternative to InstantMesh. |
| `ai-scripts/` | Studio's AI scripts | Misc | 🔒 PRIVATE | — |
| `astro-stacker/` | Astro stacking | Long-exposure stacking | ⏳ SURVEYED | Possibly relevant to long-exposure tutorial. |
| `aubio-beat-osc/` | Aubio beat → OSC | Audio analysis | ⏳ SURVEYED | Class T-A #14 (the librosa music piece) covers this. |
| `audio-reactive-led-strip/` | Audio→LED | Live performance LED control | ⏳ SURVEYED | Bench tool for installations. |
| `azure-kinect-py/` | Kinect wrappers (duplicate of root `Azure_Kinect_py/`) | Kinect | 🚫 SKIP | Duplicate. |
| `blender-mcp-legacy/` | Earlier Blender MCP | — | 🚫 SKIP | Superseded. |
| `image-to-stl/` | Image→STL | — | ⏳ SURVEYED | — |
| `lightpainting-forge-backend/` | The 2D→3D backend (Depth-Anything-V2 ONNX + SAM2) | depth + segmentation | ⏳ SURVEYED | Class T-A #9, #10. Article ✅. |
| `lithophane/` | Lithophane generator | — | 🚫 SKIP | Off-thesis. |
| `mesh-to-sdf/` | Mesh → SDF | Voxel pipeline | ⏳ SURVEYED | — |
| `mesh-voxelization/` | Voxelisation | — | ⏳ SURVEYED | — |
| `nii2mesh/` | NIfTI medical mesh | — | 🚫 SKIP | Off-thesis. |
| `pixeldetector/`, `pixelorama-kcentroid/` | Pixel-art helpers | — | 🚫 SKIP | Pixel workflow. |
| `python-scripts/` | Misc Python scripts | — | 🔒 PRIVATE | — |
| `rembg-desktop/` | Background remover | — | 🚫 SKIP | Off-thesis. |
| `softxels/` | Soft voxels | Voxel display | ⏳ SURVEYED | — |
| `vmagicmirror/` | VMagicMirror (face tracking) | VTuber face tracking | 🔒 PRIVATE | The Vtuber stack uses this. |
| `voxel2mesh/` | Voxel→mesh | — | ⏳ SURVEYED | — |
| `webgpu-marching-cubes/` | WebGPU MC | High-perf marching cubes | ⏳ SURVEYED | Class T-A #10 + alternative to the CPU MC in `lightpainting-forge/src/marching.ts`. **The site's marching-cubes visualiser (`/visualiser/marching-cubes`) is the in-voice version.** |

### 4.6 `drone_show/`

```
drone_show/
├── skybrush-server/      External: Skybrush drone-show server
└── studio-blender/       Studio's Blender control rig for Skybrush
```

📋 QUEUED. The aerial work that articles like `the-fleet-four-airframes` and `first-light` reference. **Skybrush is an external service**; the studio orchestrates it but doesn't migrate it. The site mentions the drone-show capability in the fleet article; a deeper "the choreography rig that programs the swarm" article is queued in Wave 3.

### 4.7 `Servers/` — the MCP swarm (~60 files)

The Hangar's nervous system. Each `*_mcp.py` is an MCP server exposing one capability. **None migrate to the site.** The site interacts with the bench through the *outputs* (articles, data, certificates), not through the MCP layer.

A representative slice (full list above):

| MCP server | Capability | Maps to (site-side) |
|---|---|---|
| `aura_gateway.py`, `aura_soul.py`, `aura_voice.py`, `aura_state_publisher.py`, `aura_soul_pre_academy_bridge.py` | Aura nervous system | The narrator on the chrono-protocol article + future `/articles/aura-the-body` ⏳ |
| `art_engine_mcp.py` | Art generation control | — (operational) |
| `blender_mcp_sse.py`, `blender_remote_mcp.py` | Blender remote control | — (the pipeline runner) |
| `chrome_devtools_mcp.py` | Chrome devtools | — |
| `comfy_mcp.py`, `comfy_mcp_swift.py` | ComfyUI control | — (the 9-second pipeline's runner) |
| `consciousness_mcp.py`, `enforcer_mcp.py`, `gateway_mcp.py`, `gossip_mcp.py`, `habituation_mcp.py`, `mannerism_engine.py`, `maturation_bridge_mcp.py`, `mind_palace_mcp.py`, `panopticon_mcp.py` | Academy-side coaching/governance | 🔒 PRIVATE (academy framing) |
| `crew_mcp.py` | Multi-agent crew orchestration | — |
| `curriculum_mcp.py` | Curriculum routing | Future `/learn` integration (📋 QUEUED) |
| `gaze_mcp.py`, `hand_tracking_mcp.py` | Gesture input | Pipeline Beta capture leg |
| `lore_mcp.py` | Lore + canon RAG | The bench-side reader of `References_DO_NOT_EDIT_OR_CHANGE/` |
| `physics_mcp.py` | Physics simulation gateway | Indirectly powers waveguide articles |
| `radioplay_mcp.py`, `radioplay_scripts.json` | Radio-play generator | Pipeline Gamma's audio-only render |
| `sharp_mcp.py` | SHARP CCTV/360 pipeline | `docs/SHARP_PIPELINE.md` on the site; pipeline 📋 |
| `sieve_mcp.py` | VLM aesthetic auditor | Class A #11 (the Sieve+Oracle article) ⏳ |
| `tts_mcp.py` | TTS gateway | The voice piece of the Aura article |
| `vision_mcp.py`, `vision_perception_mcp.py`, `sound_perception_mcp.py` | Perception | The Aura body article's "what Aura sees/hears" section ⏳ |

### 4.8 `Lattice_Setup/` + `swift_node_setup/` + `swift_sync/`

The cluster substrate. **Sovereign-PC (Chonky, RTX 3080 Ti, Tailscale 100.122.69.49)** + **Swift (laptop, RTX 3070, 100.71.193.101)** + **Aya (handheld, 100.101.39.97)**. Lattice = the MQTT/Mosquitto bus that connects them. All 🔒 PRIVATE; **operational infrastructure, not material the site touches.**

### 4.9 `wiki/` + `references/` + `References_DO_NOT_EDIT_OR_CHANGE/`

Three reference surfaces with different roles:

| Directory | Role | Status |
|---|---|---|
| `wiki/` | Internal procedural wiki — README + `infrastructure/`, `pipelines/`, `skill_tree/` | 🔒 PRIVATE |
| `references/` | Vendored external libraries — `chromium-stable/`, `crewAI/`, `litellm/`, `mediapipe/`, `pydantic-ai/`, `react-three-fiber/`, `three-vrm/`, `TTS/`, `OpenVoice/`, `RealtimeSTT/`, `voidmesh/`, `webgpu-skill/`, `aituber-kit/`, `chroma/`, `WebGPUReconstruct/`, etc. | 🚫 SKIP (vendored) |
| `References_DO_NOT_EDIT_OR_CHANGE/` | **The canonical vision documents** + ~80 component snapshots + 100+ kaomoji JSON files + RAG/voice service stubs. `BRAIDED_VISION.md`, `DOLLYS_VISION.md`, `ACADEMY_COHORT.md`, `OCEAN_CLOTHING_SYSTEM.md`, `VRM_GENERATION.md`, `AR_INTEGRATION.md`, `MERGE_ANALYSIS.md`, `DOLLYS_ACADEMY_WIKI.md`, `ROBOT_MATERIAL_SCIENCE.md`, `Aesthetic_Throughline/`, etc. | 🔒 PRIVATE — the name says it. **Read; never modify; never import.** |

The studio's voice canon stays in private memory at `C:\Users\dimon\.claude\projects\d--The-Hanger-Outer-Shell\memory\holoflow_voice_library.md` (per the auto-memory header).

### 4.10 `python-services/` — the FastAPI backends

Of the ~60 files at root, the ones **already mirrored on the site** at `D:/.github/_3DPOV/python-services/`:

| Hangar file | Site mirror | Status |
|---|---|---|
| `morphing_engine.py` | `python-services/morphing_engine.py` | ✅ MIGRATED |
| `genome.py` | `python-services/genome.py` | ✅ MIGRATED |
| `fitness.py` | `python-services/fitness.py` | ✅ MIGRATED |
| `caustic_optimizer.py` | `python-services/caustic_optimizer.py` | ✅ MIGRATED |
| `fresnel_generator.py` | `python-services/fresnel_generator.py` | ✅ MIGRATED |
| `grin_generator.py` | `python-services/grin_generator.py` | ✅ MIGRATED |
| `generators.py` | `python-services/generators.py` | ✅ MIGRATED |
| `choreography_engine.js` (note: JS, not Python) | `python-services/choreography_engine.py` (renamed/reimplemented) | ✅ MIGRATED |
| `gyroid_waveguide_geonodes.py` | — | ⏳ SURVEYED (Class T-A #11 ⏳) |

**Still bench-only** (the live backends):

| File | Function | Status |
|---|---|---|
| `api_gateway.py`, `api_server.py`, `app.py` | FastAPI gateways | 🔒 PRIVATE |
| `aura_voiceprint_service.py`, `chatterbox_service.py`, `tts_server.py`, `f5_tts_server.py`, `piper_service.py`, `whisper_service.py` | Voice services | 🔒 PRIVATE |
| `boot.py`, `capture_service.py`, `core_cortex_stack.py` | Boot + capture | 🔒 PRIVATE |
| `chatterbox_tts_server/` | Chatterbox TTS subserver | 🔒 PRIVATE |
| `cloud_local_router.py` | Cloud/local router | 🔒 PRIVATE |
| `data_refinery.py`, `discovery.py`, `firebase_setup_automation.py` | Data services | 🔒 PRIVATE |
| `debug_museum.py`, `demo_*.py`, `deploy_city.py` | Demos | 🚫 SKIP |
| `distributed_knowledge_network.py`, `dollyos_memory_service.py`, `dollyos_narrative_cluster.py` | Memory + narrative clustering | Pipeline Gamma's narrative-clustering step. The output (sitcom scripts) might one day publish; the engine stays private. |
| `engine_forge.py`, `holoflow/`, `HoloFlowOrchestrator.py` | HoloFlow orchestrator | The "missing wire" from SESSION_SUMMARY §4. Operational. |
| `genome/` | Genome service module | The authoritative source-of-truth for the 28-gene schema (the TS side consumes via `/genome/schema` per `HANGAR_RECONCILIATION.md` §5). |
| `architects_manual.py`, `artist_portal.py`, `artist_showroom.py`, `aquarium_routes.py`, `city_architect.py`, `city_manager.py` | Studio-side services | 🔒 PRIVATE |
| `blender_stage_baker.py` | Blender stage baker | 🔒 PRIVATE |
| `CLICKR_V1_1.py` | Clicker (input?) | 🔒 PRIVATE |
| `database.py`, `classifier.py`, `config.py` | Plumbing | 🔒 PRIVATE |
| `film_crew.py`, `fling_communications.py` | Production services | 🔒 PRIVATE |
| `full_loop_test.py` | E2E test | 🚫 SKIP |
| `functions/` | Cloud Functions analog | 🔒 PRIVATE |
| `global_theme_manager.py` | Theme manager | 🔒 PRIVATE |
| `hardware_integration.py` | Hardware HAL | 🔒 PRIVATE |

### 4.11 `skills/` — the studio's authored skills

Different from the global `.agent/skills/` (1,471 dirs of mostly-vendor tool-couplings). The `skills/` directory contains ~140 studio-authored skills, organised by domain. Highlights:

| Skill cluster | Examples | Status |
|---|---|---|
| **Blender plugin skills (60+)** | `blender-plugin-alicelg`, `blender-plugin-amaranth`, `blender-plugin-btracer`, `blender-plugin-bool-tool`, `blender-plugin-curve-fitting`, `blender-plugin-fractal-family`, `blender-plugin-geo-nodes-guide`, `blender-plugin-marching-cubes`, `blender-plugin-print3d`, `blender-plugin-tissue`, `blender-plugin-vrm`, `blender-plugin-zen-utils`, etc. | 🔒 PRIVATE | Tool-couplings; operational. |
| **DollyOS skills** | `dolly-os`, `dolly-os-slot-in`, `dolly-os-ui-blueprint`, `dolly-os-vite-fixes`, `dollyos-boot`, `dollyos-crystal-architecture`, `dollyos-error-recovery`, `dollyos-migration-pattern`, `dollyos-module-stage`, `dollyos-mqtt-hardware`, `dollyos-skills-index`, `dollyos-startup`, `dollyos-telemetry`, `dollyos-twin`, `dollyos-void` | 🔒 PRIVATE | Shell-internal. |
| **Hangar skills** | `hangar-aesthetic`, `hangar-app-registry`, `hangar-architecture`, `hangar-launcher`, `hangar-mcp-lattice` | 🔒 PRIVATE | Bench-internal. |
| **Holoflow skills (publishable summaries)** | `holoflow-aesthetic`, `holoflow-blender-sculptor`, `holoflow-email`, `holoflow-gap-audit`, `holoflow-holding-page`, `holoflow-princess-voice`, `holoflow-website` | 🔒 PRIVATE (skill metadata); summaries can publish | The brand-aesthetic-skill informs `holofoil-hypercube.tsx` ✅. Other skills are operational. |
| **Pipeline skills** | `blender-pipeline-executor`, `blender-pipelines`, `marched-mesh-generation`, `neo-london-pipeline`, `neo-london-infrastructure`, `poi-earring-blender`, `poi-earring-pipeline`, `poi-sculptor-project`, `wall-art-evolution`, `wall-art-patterns`, `wall-art-pipeline`, `waveguide-physics` | 🔒 PRIVATE | Operational pipelines. Some have publishable summaries that maps to Class A and Class T-A items. |
| **Process skills** | `creating-skills`, `skill-backup-protocol`, `skill-detector`, `skill-maintenance`, `success-to-skill-protocol`, `teaching-dimona` | 🔒 PRIVATE | Process-internal. |
| **Misc skills** | `canvas-to-webgpu-merge`, `cyberpunk-docuar-styling`, `design-system-applier`, `earring-genome-seeder`, `finger-sweep-geometry`, `finishing-school-protocol`, `gemini-handoff`, `kinect-leap-capture`, `landing-first-client`, `local-ai-pwa`, `ollama-private-gpt`, `shape-of-it`, `spellpunk-tron-visual`, `threejs-viewer-workflow`, `tsc-diagnostic-fix`, `volumetric-void`, `vrm-agent`, `webgpu-tsl-sculpting`, `webrtc-streaming` | mostly 🔒 PRIVATE | Some (the technical ones) have publishable summaries. |

**Resolution**: There is no clean migration of "skills" to the site — skills are agent-side, not reader-side. What ships are *the artefacts the skills produce*: articles, data tables, visualisers.

### 4.12 `xrblocks_playground/`

Google's open-source WebXR component library (forked into the Hangar). Source for the queued `/portal` route + the multi-user-VR Rookery plan (per MINED.md). Status: 📋 QUEUED. The Wave-4 work that lights up the Rookery VR room reads from here.

### 4.13 `queues/` + `workflows/`

| Directory | Contents | Status |
|---|---|---|
| `queues/` | `batch_jobs.json` + `results/` | 🔒 PRIVATE — operational job queue |
| `workflows/` | `holoflow_photo_to_sprite.json` | 🔒 PRIVATE — the ComfyUI workflow that triggers Holoflow Loop |

### 4.14 `waveguide/`

`waveguide_toolkit.py` + `install_waveguide_deps.bat` + `outputs/`. The **standalone** waveguide toolkit; the live version lives in `apps/waveguide-forge/`. ⏳ SURVEYED — duplication should resolve.

---

## 5. Pipeline inventory (from `PIPELINES.md`)

Seven canonical pipelines + smoke test. Pipelines are the bench's orchestration spine; what the site shows is the *output*, not the runner.

| # | Pipeline | Goal | Hangar script | Articles / site surfaces it produces | Status |
|---|---|---|---|---|---|
| α | **Alpha: Genetic Waveguide** | Evolutionary production of optically-fit printable sculptures | `scripts/blender_pipelines/` + Dolly_OS `evolution-engine.ts` + `python-services/genome.py` | `articles/how-the-studio-breeds-sculptures` ✅ + Class A #7 (Evolution Suite) ⏳ + Class A #8 (kingdoms) ⏳ + Class A #10 (alphabet) ⏳ + Class A #11 (Sieve+Oracle) ⏳ + Class T-A #12 (printability) ⏳ + Class T-A #20 (GA operators) ⏳ | ⏳ partially MIGRATED; **6 more articles** planned downstream |
| β | **Beta: Avatar Somatic Bridge** | Live performance tracking → virtual void / physical | `Azure_Kinect_py/*` + `apps/leap-bridge/` + Dolly_OS `AuraVRM.tsx` + `python-services/finger_sweep.py` | Class A #6 (Aura body) ⏳ + Class T-A #16 (capturing poi trail) ⏳ + the future `/articles/the-cold-eye` for Aura's reading of the world ⏳ | ⏳ SURVEYED — depends on hardware; pipeline stays bench-side, articles harvest from it |
| γ | **Gamma: Narrative Sitcom** | Ambient capture → screenplay/radioplay | `python-services/capture_service.py` + `dollyos_narrative_cluster.py` + `radioplay_mcp.py` | Output content (episodes) might one day publish; **the runner stays private (academy framing)**. | 🔒 PRIVATE (the academy-narrative side); 🚫 the runner won't migrate; specific *outputs* may publish individually |
| δ | **Delta: Fabrication Chain** | Leap hand-gesture → printable 3MF in one MCP call | `scripts/blender_pipelines/pipeline_01_fabrication_chain.py` | The Holoflow Loop closure — fits `articles/from-photograph-to-object` (tutorial) ✅ + Class A #5 (five sculpture typologies) ⏳ + Class T-A #11 (Blender 5.0.1 SDF Grid) ⏳ | ⏳ SURVEYED; the runner depends on Blender + Leap + Tissue + btracer + CurveFitting + ThreeMF — **all bench dependencies**; articles harvest the *concept*, not the runner |
| ε | **Epsilon: Aura Energy Trails** | Aura's OCEAN/FFT state → strange-attractor GLB | `scripts/blender_pipelines/pipeline_02_aura_attractors.py` | The attractor families (Clifford, Thomas, Lorenz, Dequan Li) per Aura quadrant. Currently 🚫 not on site; possibly an `/articles/aura-as-attractor` extension to Class A #6. | ❓ NEW — not in any prior survey as a discrete piece |
| ζ | **Zeta: Hunyuan Text-to-Print** | Natural-language sculpture description → validated 3MF | `scripts/blender_pipelines/pipeline_03_hunyuan_to_print.py` | The nine-second pipeline article ✅ + the future `/tutorials/prompt-to-print` is a queued companion. | ✅ partially MIGRATED via `nine-seconds-prompt-to-printable` |
| η | **Eta: Looking Glass Quilt** | Blender scene → 48-view quilt → Portrait | `scripts/blender_pipelines/pipeline_04_looking_glass_quilt.py` | Looking Glass volumetric trail quilts (COMMERCE_ROADMAP candidate #12 — saleable product) ⏳ | 📋 QUEUED — depends on AliceLG operator namespace (open item) |
| 00 | **Smoke Test** | Discover Blender operator names | `scripts/blender_pipelines/pipeline_00_smoke_test.py` | n/a | 🔒 PRIVATE |

### Operational notes from `PIPELINES.md`

- **Node affinity**: Physics/MoCap on Chonky (3080 Ti). Telemetry/Lattice on Mathematician.
- **Every pipeline ends with PowerSave or Git Push** for state sync.
- **Fail-fast gates**: genome heuristics run before expensive Blender materialisations.

---

## 6. Service / orchestration inventory (from `HEARTBEAT.md`)

The always-on services. The site never connects directly; it learns about them indirectly through articles + stack page.

| Service | Port | What it is | Site coverage |
|---|---|---|---|
| `aura_soul` | ws://localhost:8770 | The Aura soul server (orientation + thought) | ⏳ Class A #6 names it once architecturally; not connected from site |
| `mqtt broker` | localhost:1883 | The lattice bus (Mosquitto) | ⏳ Class A #6 + `dollyos-mqtt-hardware` skill metadata; not surfaced |
| `ollama` | localhost:11434 | Local LLM inference (Qwen 2.5 14B Q4_K_M canonical) | ✅ named in `articles/how-the-studio-breeds-sculptures` ("Qwen 2.5 14B at Q4_K_M quantisation, ~10GB VRAM"); also `articles/nine-seconds-prompt-to-printable` |
| `comfyui` | localhost:8188 (per skill metadata) | Generative engine | ✅ named in `articles/nine-seconds-prompt-to-printable`; the Holoflow Loop runs through it |
| `soundscape engine` | unknown | Ambient audio engine | ❓ NEW — not on site. Mentioned in HEARTBEAT.md but not in any survey. **Open item.** |
| `blender mcp` | localhost:9876 | Blender remote control plane | ⏳ named in `articles/nine-seconds-prompt-to-printable` ("the bench"); not named architecturally |
| `evolution loop` | unknown | The morphogenetic daemon | ⏳ named in `articles/how-the-studio-breeds-sculptures`; runs Dolly_OS evolution-engine.ts |

### Additional always-on services (not in HEARTBEAT but operational)

| Service | Where | Status |
|---|---|---|
| Qdrant | system service (per HANGAR.md) | ⏳ named architecturally in `MINED.md` Rookery brick; site uses Firestore not Qdrant |
| CosyVoice 2 | WSL (per HANGAR.md) | 🔒 PRIVATE; Aura article mentions Kokoro + LongCat instead — see Class C #2 reconciliation |
| Aura gateway | port 8043 + 8044 (per LIVE_LOG.md) | 🔒 PRIVATE |
| DollyOS Shell | port 5266 | 🔒 PRIVATE |
| LightWeiver Studio | port 5219 | 🔒 PRIVATE |
| WebGPU Gaussian Splatting | port 5262 | 📋 QUEUED for `/play/neo-london` |

---

## 7. Hangar artefacts at the file level

Notable files at root that aren't directories. Status + site mapping.

| File | Type | Status | Site coverage / notes |
|---|---|---|---|
| `PIPELINES.md` | 119 lines, 7 pipelines | 🔒 PRIVATE | See §5 above. **The pipelines run on the bench**; outputs surface as articles. |
| `HEARTBEAT.md` | Service liveness | 🔒 PRIVATE | See §6 above. Operational. |
| `HANGAR.md` | 242-line master reference (Future London canon, 6 students, 22 mentors, 5 peers, 6 departments, the crystal-shell rule) | 🔒 PRIVATE | The North Star. Many site articles draw concepts from here but **never quote it directly** (per `HANGAR_RECONCILIATION.md` §10 self-taught invariant). |
| `AGENTS.md` | The Hangar Agent Constitution | 🔒 PRIVATE | Internal contract. |
| `CLAUDE.md` | Claude harness instructions | 🔒 PRIVATE | Internal. |
| `GEMINI.md` | Gemini agent instructions | 🔒 PRIVATE | Internal. |
| `LIVE_LOG.md` | Live ops log | 🔒 PRIVATE | Internal. |
| `SESSION_SUMMARY_2026-04-13.md` | Session record (the great consolidation: Mesh Studio + Charming Academy split) | 🔒 PRIVATE | Mined for app architecture. |
| `CODE_EXPLORATION_2026-04-14.md`, `CODE_EXPLORATION_PART2_2026-04-14.md` | Code archaeology | 🔒 PRIVATE | Internal. |
| `README.md` | Project README | 🔒 PRIVATE | Internal landing. |
| `UNIVERSAL_AGENT_PROTOCOL.md` | Agent protocol | 🔒 PRIVATE | Internal. |
| `BOOT_UNIFIED.ps1`, `START_*.ps1/bat`, `STOP_*.ps1`, `SYNC_TO_STICK.ps1`, `STATUS.ps1`, `LAUNCH_DOLLYOS.bat`, `register_*.ps1/bat` | Boot + ops | 🔒 PRIVATE | Operational scripts. |
| `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `tsconfig.*.json`, `pnpm-lock.yaml` | Monorepo config | 🔒 PRIVATE | The Hangar Turborepo. |
| `.env`, `.env.example`, `.env.shapeways.example` | Env templates | 🔒 PRIVATE | Operational. Shapeways = the future fulfilment partner (COMMERCE_ROADMAP candidate #9 implicit). |
| `service.json` | Service definitions | 🔒 PRIVATE | — |
| `tri_table_correct.ts` | Marching-cubes triangle table (loose at root) | ✅ MIGRATED to `lib/visualiser/marching-cubes-math.ts` | Class T-A #10. |
| `build_sculpture.py`, `animate_awesome.py`, `trigger_comfy.py`, `test_*.py`, etc. | One-off scripts | 🔒 PRIVATE | Bench scratch. |

---

## 8. Site coverage cross-reference

What's on the site, mapped to its Hangar source.

### 8.1 Articles already shipped (34 entries at `components/articles/entries/`)

| Article | Hangar source | Status |
|---|---|---|
| `art-as-door-five-layers.tsx` | `poi-sculptor/docs/PROJECT_MANIFESTO.md` §III | ✅ |
| `aura-the-body.tsx` | Multiple — `apps/aura-vrm/`, Dolly_OS `AuraVRM.tsx`, `AudioLipSync.ts`, `vrmBlendShapeController.ts` | ✅ (Class A #6 shipped) |
| `belt-printed-wall-reliefs.tsx` | Hangar belt-printer tooling + `wall_art/art_engine.py` | ✅ |
| `colour-without-pigment.tsx` | `PHYSICS_AND_OPTICS.md` §VI | ✅ |
| `from-picasso-forward.tsx` | (Studio voice; no specific Hangar source) | ✅ |
| `how-the-studio-breeds-sculptures.tsx` | `EVOLUTION_ENGINE.md` + Dolly_OS evolution-engine.ts | ✅ |
| `jewellery-the-same-trace-wearable.tsx` | Hangar jewel-array + waveguide-jewelry skill | ✅ |
| `kindred-practices.tsx` | `COMPETITIVE_LANDSCAPE.md` | ✅ |
| `lineage-marey-to-now.tsx` | `CONVERGENCE_ARCHITECTURE.md` §III | ✅ |
| `london-360-walking.tsx` | `apps/prototypes/360-camera-to-ue5-gaussian-splatting-guide/` | ✅ |
| `morphing-things-together.tsx` | `python-services/morphing_engine.py` + `.obsidian_vault/Knowledge Base/MORPHING_MATHEMATICS.md` + Dolly_OS `vrmBlendShapeController.ts` + evolution `mutation.ts` | ✅ (Class A #9 shipped) |
| `neo-london-chrono-protocol.tsx` | `apps/prototypes/neo-london-chrono-protocol/` (full prototype) | ✅ |
| `nine-seconds-prompt-to-printable.tsx` | `apps/lightpainting-forge/` + `tools/lightpainting-forge-backend/` | ✅ |
| `on-the-shoulders-of-open-source.tsx` | (Studio voice; references all of `references/`) | ✅ |
| `sellotape-and-tilt-brush.tsx` | (Studio voice; the bezel origin) | ✅ |
| `spiral-cognition.tsx` | `METHODOLOGY.md` §I | ✅ |
| `the-bench.tsx` | (Studio voice) | ✅ |
| `the-convergence.tsx` | `CONVERGENCE_ARCHITECTURE.md` (Class A #1 shipped) | ✅ |
| `the-eight-kingdoms.tsx` | Dolly_OS `lib/evolution/kingdoms/index.ts` (Class A #8 shipped) | ✅ |
| `the-familiar.tsx` | (Studio voice — Aura's introduction) | ✅ |
| `the-fleet-five-airframes.tsx` | (Studio voice + drone_show context + DJI Mini 5 Pro section) | ✅ Class C #1 reconciliation closed |
| `the-jewellery-algorithms.tsx` | Dolly_OS `jewel-array/geometry/algorithms/` (Class A #4 + Class T-A #13 shipped as one) | ✅ |
| `the-living-stage.tsx` | `THE_LIVING_STAGE.md` | ✅ |
| `the-practice-in-eight-threads.tsx` | `lib/play.ts` + studio canon (BACKWARDS_DESIGN gap #12 closed) | ✅ |
| `the-right-paper-for-a-light-painting.tsx` | (Studio voice + calibrating tutorial) | ✅ |
| `ungrounded.tsx` | (Studio voice; aerial → 360 → 3D) | ✅ |
| `vr-as-psychological-system.tsx` | (Studio voice) | ✅ |
| `vr-pov-controllers-the-product.tsx` | `firmware/drone_pov/` + Hangar bezel build | ✅ |
| `wall-arrays-geometry-of-rooms.tsx` | `wall_art/art_engine.py` + Hangar 2x4/4x4 .blend arrays | ✅ |
| `what-the-studio-wont-do.tsx` | (Studio voice) | ✅ |
| `where-the-studio-has-lived.tsx` | (Studio voice) | ✅ |
| `why-i-build-modular.tsx` | (Studio voice; the trunk piece) | ✅ |
| `why-i-build-my-own-rigs.tsx` | (Studio voice; the trunk piece) | ✅ |
| `why-the-pendant-glows-from-the-inside.tsx` | `PHYSICS_AND_OPTICS.md` §III–IV + jewelry skill | ✅ |
| `the-convergence.tsx` (Class A #1 ⇒ shipped) | already shipped | ✅ |

### 8.2 Lib data + math (the typed exposures)

| File | Hangar source | Status |
|---|---|---|
| `lib/loop.ts` | (Studio canon) | ✅ |
| `lib/play.ts` | (Studio canon — the 12-level curriculum) | ✅ |
| `lib/stack.ts` | (Studio canon + Hangar dependency list) | ✅ |
| `lib/curriculum.ts` | (Studio canon — the 7 ladders) | ✅ |
| `lib/chrono-protocol/{dialogue, scoring, state, zones}.ts` | `apps/prototypes/neo-london-chrono-protocol/{constants.ts, types.ts, services/geminiService.ts}` | ✅ |
| `lib/chrono-protocol.ts` | (Re-export) | ✅ |
| `lib/algorithms/*.ts` (20 of 30) | Dolly_OS `jewel-array/geometry/algorithms/algo_*.ts` | 🔄 IN PROGRESS — 20 of 30 shipped (auxetic, celtic-knot, fermat-spiral, gear, geodesic-spines, gyroid, interlace, lsystem, mon, non-euclidean, ribbon-helix, sigil, skull-sdf, spiral, step-fret, swept-sinuous, tensegrity, torus-knot, wing-venation, _base). **Missing: 10** — DLA, Voronoi, Reaction-Diffusion, PCB-Trace, Penrose-Tiling, Clash-Compositor, Wigner-Seitz, Spinodal, Enneper, Diatom-Hex, LSystem-Tube, Auxetic-Corrugation. |
| `lib/math/{easing, gestures, laban}.ts` | `python-services/morphing_engine.py` + `CONVERGENCE_ARCHITECTURE.md` §II + `THE_LIVING_STAGE.md` | ✅ |
| `lib/visualiser/{laban-math, marching-cubes-math, tir-math, state}.ts` | `PHYSICS_AND_OPTICS.md` + `lightpainting-forge/src/marching.ts` + `THE_LIVING_STAGE.md` | ✅ |
| `lib/evolution/` (empty) | Dolly_OS `lib/evolution/*` | 🔄 IN PROGRESS — directory created, Wave 2 agent in flight |
| `lib/aura/{gemini, prompts}.ts` | `apps/prototypes/neo-london-chrono-protocol/services/geminiService.ts` SYSTEM_INSTRUCTION | ✅ |
| `lib/neo-london/{types, zones}.ts` | `apps/prototypes/neo-london-chrono-protocol/types.ts` + `constants.ts` | ✅ |
| `lib/rookery/{client, emails, mailer, tiers, types}.ts` | Schema invented; auth-pattern from `discord-bot` + `charming-academy`; Stripe stubs pending | ✅ (v0) |
| `lib/assets/{algorithms, brushes, flow-arts, genomes, meshes}.ts` | Dolly_OS atelier + jewel-array taxonomy | ✅ |
| `lib/firebase/client.ts` | `D:\The_Hangar\packages\firebase-client\src\index.ts` | ✅ |
| `lib/shopify/`, `lib/shopify-policies.ts` | (Site-only; no Hangar source) | ✅ |
| `lib/services.ts`, `lib/three-d.ts`, `lib/graph.ts`, `lib/constants.ts`, `lib/utils.ts`, `lib/type-guards.ts`, `lib/writing.tsx`, `lib/journal.tsx`, `lib/tutorials.tsx`, `lib/articles.tsx`, `lib/shell/state.ts`, `lib/play/state.ts` | (Site-only or thin re-exports) | ✅ |

### 8.3 Routes

| Route | Hangar source / role | Status |
|---|---|---|
| `/`, `/about`, `/policies/*`, `/signin`, `/coming-soon`, `/error`, `/sitemap`, `/robots`, `/contact` | Site-only | ✅ |
| `/aerial` | Hangar `drone_show/` + the fleet | ✅ (scaffold; pricing proposed) |
| `/articles`, `/journal`, `/tutorials`, `/articles/[slug]` | Site-generated | ✅ |
| `/atelier`, `/atelier/algorithms/*`, `/atelier/evolution/*` | Dolly_OS jewel-array + evolution suite | 🔄 IN PROGRESS — `atelier/page.tsx` ✅, `atelier/algorithms/*` empty, `atelier/evolution/*` empty (Wave 2 in flight) |
| `/bezel` | `firmware/drone_pov/` | ✅ (scaffold; preorder interest list) |
| `/bureau` | Hangar print-bureau | ✅ (scaffold) |
| `/chrono-protocol` | `apps/prototypes/neo-london-chrono-protocol/` | ✅ |
| `/learn` | Studio canon + `lib/curriculum.ts` | ✅ |
| `/photographs`, `/product/[handle]`, `/search`, `/search/[collection]` | Shopify Storefront (admin unseeded) | ✅ (code path); ⏳ (admin) |
| `/play`, `/play/[level]`, `/play/neo-london`, `/play/neo-london/zone/[slug]` | Studio canon + chrono-protocol prototype | ✅ (Trail level live; rest preview) |
| `/practice` | Studio canon | ✅ |
| `/rookery`, `/rookery/[id]`, `/rookery/about`, `/rookery/new`, `/rookery/tiers` | Hangar `discord-bot` + `charming-academy` patterns | ✅ (v0; no Stripe gate yet) |
| `/services` | Studio canon (commerce roadmap candidates) | ⏳ |
| `/sphere` | Hangar `apps/360-studio` | ⏳ (stub) |
| `/stack` | (Site-only; references Hangar `references/`) | ✅ |
| `/the-loop` | Studio canon | ✅ |
| `/visualiser`, `/visualiser/laban-dial`, `/visualiser/marching-cubes`, `/visualiser/total-internal-reflection` | Class T-C #1, #5, #9 from technical survey | ✅ MIGRATED — three of the top-five visualisers shipped |
| `/watch` | `lib/aura/gemini.ts` + Aura voice canon | ✅ (Gemini-backed; free during prototype window) |
| `/api/{aura, contact, newsletter, play, rookery, revalidate}` | Site backends | ✅ (mostly stubs/scaffolds) |

### 8.4 Site `public/assets/`

| Asset dir | Hangar source | Status |
|---|---|---|
| `assets/audio/` | (Bench audio outputs) | ⏳ |
| `assets/brushes/textures/` | (Holoflow brush textures) | ✅ |
| `assets/flow-arts/{biomimetic-atlas, biomimetic-cross-sections}.json` | `apps/prototypes/poi-sculptor/biomimetic-atlas.html` + `volumetric-cross-sections.json` | ✅ |
| `assets/genomes/catalogue.json` | Dolly_OS genome-store | ✅ |
| `assets/meshes/{biomimetic, jewellery, sculpture}/` | Dolly_OS jewel-array thumbnails + biomimetic builders | ✅ |
| `assets/thumbnails/` | (Bench renders) | ⏳ |

---

## 9. Open items (not yet covered) — ranked

The top 10 by priority for the next migration wave. Each item names the Class from a prior survey (or 🆕 if newly found) for traceability.

| # | Open item | Lens | Priority | Reason |
|---|---|---|---|---|
| 1 | **Finish the missing atelier algorithms** (PCB-Trace, Clash-Compositor, Wigner-Seitz, Spinodal, Enneper, Diatom-Hex, LSystem-Tube, Auxetic-Corrugation) | tech (Class T-A #13) | High | Wave 3 in progress. DLA + Voronoi + Reaction-Diffusion + Penrose-Tiling ported (23/30 done). 7 to go. |
| 2 | **Wire `lib/evolution/*`** (the empty directory) — port `evolution-engine`, `breeding`, `fitness`, `mutation`, `kingdoms`, `genome-store` from Dolly_OS as typed read-only data + a static visualisation route | tech + narrative (Class A #7, #8, #10) | High | Wave 2 in flight; `app/atelier/evolution/*` is the surfacing target. |
| 3 | **The Aura body article** (`articles/aura-the-body`) | narrative (Class A #6) | DONE | Reconciled against capability registry: voice-provider canon (three-paths-one-surface), VRM file (`nanny.vrm`), lipsync chain (audio.tts → audio.visemes → vrm.expressions.blend), head-tracking priority chain, particle library, motion.idle. Cross-links to /capabilities and /demo/aura-talks. |
| 4 | **The fleet count reconciliation** (4 → 5 airframes) | narrative (Class C #1) | DONE | Article renamed `the-fleet-five-airframes`; DJI Mini 5 Pro added as fifth; 15+ cross-refs updated. |
| 5 | **Shopify admin seeding** | commerce (COMMERCE_ROADMAP §2 item 1) | High | One afternoon. Photograph editions live the same day. Highest revenue-per-hour unlock. |
| 6 | **The Eight Kingdoms** (`articles/the-eight-kingdoms`) | narrative (Class A #8) | Medium-high | Article shipped per `components/articles/entries/the-eight-kingdoms.tsx` — verify substance matches the Dolly_OS `kingdoms/index.ts` source-of-truth. |
| 7 | **The Sieve + The Oracle article** (`articles/the-sieve-and-the-oracle`) | narrative (Class A #11) | Medium | Two-step quality system. Maps to commerce trust-building. |
| 8 | **Provenance JSON article** (`articles/provenance-as-discipline`) | narrative (Class A #12) | Medium | Important for commerce credibility (the editions ledger / COA from COMMERCE_ROADMAP §5 item 4). |
| 9 | **The Caustic Disc / first product** (`articles/the-caustic-disc`) | narrative (Class A #13) + commerce (candidate #10 implicit) | Medium | The proof-of-concept piece. Pairs with the bezel as a "what the bench actually makes." |
| 10 | **360 → splat tutorial** (`tutorials/360-to-splat`) | narrative (Class A secondary tier) | Medium | Bridge piece between aerial work and `/play/neo-london`. Companion to `articles/london-360-walking` ✅. |

### Secondary open items (priority ranks 11-20)

11. **The two remaining top-five visualisers**: `/visualiser/gyroid` (Class T-C #3) + `/visualiser/caustic-projector` (Class T-C #8). The first three (TIR, marching cubes, Laban dial) are ✅; the gyroid one is highest-value-next because the studio uses gyroids in five places.
12. **The bezel firmware/kit productisation** (COMMERCE_ROADMAP candidate #7, paid download). Repo + license decision.
13. **The Stripe wire-up** — Rookery subscription gate is the cleanest landing (recurring; data typed; auth ready).
14. **Day-3/Day-7 Rookery onboarding email scheduling** (Vercel Cron + Firestore queue).
15. **Customer accounts** — order history + download locker + COA vault (COMMERCE_ROADMAP §2 item 5).
16. **The Convergence Audio Pipeline tutorial** (`tutorials/song-to-sculpture`, Class A #15).
17. **The Five Sculpture Typologies article** (`articles/the-five-shells`, Class A #5).
18. **The 28-gene alphabet article** (`articles/the-alphabet`, Class A #10) — companion to `how-the-studio-breeds-sculptures`.
19. **Critical-angle technical piece** (Class T-A #1, the 41.8° number).
20. **The Inside-the-Evolution-Suite workshop tour** (Class A #7) — the 14-station UI as workshop content.

---

## 10. Private / skip list — explicit

Items the studio has deliberately decided not to migrate, with reasons.

### Won't migrate — privacy + dignity

| What | Where | Reason |
|---|---|---|
| **The Charming Academy lore** | `Dolly_OS/public/docs/The_Charming_Academy/` (~40 chapters) + `Dolly_OS/docs/academy/` | Teacher/pupil/nanny/governess framing for what is operationally an internal coaching agent. **Contradicts the public self-taught invariant.** Per `HANGAR_RECONCILIATION.md` §10. **Exceptions** (single threads that could reframe with all academy framing stripped): `28_Visual_Generation_Patterns.md` (ComfyUI prompting), `34_Wall_Art_Engine_3D_Fabrication.md` (already covered by `belt-printed-wall-reliefs` ✅), `35_Sears_Archive_Technical_Implementation.md` (2D→3D garment reconstruction), `ACADEMY_SOUNDSCAPE_GENERATION.md` (procedural ambient audio). |
| **Sub-teen / Junior-Miss / Wardrobe** surfaces | `apps/sub-teen-wardrobe/`, `References_DO_NOT_EDIT_OR_CHANGE/WARDROBE_ARCHIVE_JUNIOR_MISS.md`, the academy wardrobe chapters | The directory naming convention (`References_DO_NOT_EDIT_OR_CHANGE/`) confirms private. **No publishable thread.** Skip entirely. |
| **Aura v9 Charm School Edition imagery + cast profiles** | `Dolly_OS/docs/academy/persona_evolution_gallery.md`, Marcel Fontaine, Theodore, Penny Draper, Agent Baby, the Sears matriarch profiles | Private. The site's Aura is the calm/regal narrator; the academy's Aura is the deportment-coaching agent. **Keep the surfaces distinct.** |
| **`aura-upgraded-but-brokken-main/`** | The whole repo | **Explicitly named "brokken"** in `MIGRATION_FROM_AURA_BROKKEN.md`. Source-of-truth for what NOT to repeat. |
| **The Charming Academy app** | `apps/charming-academy/` | Per `SESSION_SUMMARY_2026-04-13.md` §5 — the deportment/coaching app. Private per the self-taught invariant. |

### Won't migrate — operational, not voice material

| What | Where | Reason |
|---|---|---|
| **The MCP swarm** (`Servers/*_mcp.py`) | ~60 files | Operational; the bench's nervous system. Site interacts with the bench through *outputs* (articles, certificates), not through MCP. |
| **Session logs, boot scripts, registry files** | `HANGAR.md`, `PIPELINES.md`, `CLAUDE.md`, `AGENTS.md`, `BOOT_UNIFIED.ps1`, `HEARTBEAT.md`, `LIVE_LOG.md`, `SESSION_SUMMARY_*`, `INTERNALISATION_MANIFEST.md`, `MIGRATION_FROM_AURA_BROKKEN.md` | Operational state; not voice material. The map references them; they don't migrate. |
| **Infrastructure trees** | `.infrastructure/`, `Lattice_Setup/`, `swift_node_setup/`, `swift_sync/`, `boot/`, `services/`, `Servers/` | Cluster substrate. Not for the public. |
| **All ZIPs at root** | `agent-town-main.zip`, `claude-code-source-build-master.zip`, `claw-code-main.zip`, `comfy_shunt.zip` (1.9GB), `swift_launch.zip`, `test-5-main.zip`, `Vtuber.7z` (3GB), `Azure_Kinect_py.7z` | Dev archives. Working copies are the unzipped directories. |
| **`.venv/`, `python_envs/`, `sam2/`, `node_modules/` (wherever)** | — | Disk artefacts. |
| **`_legacy/`, `_archive/`, `_intake_logs/`, `_upstream/`, `claude_cade_source/`** | — | Migration discard / vendored upstream / intake logs. |

### Won't migrate — depends on external service (📋 at best)

| What | External dependency | Why 📋 not ✅ |
|---|---|---|
| **Skybrush server / Studio Blender** (`drone_show/`) | Skybrush is a separately-running server | The studio orchestrates it; the migrating thing is the orchestration article, not the server |
| **ComfyUI workflows** (`workflows/holoflow_photo_to_sprite.json`) | ComfyUI is a separately-running engine on `localhost:8188` | The workflow is bench-state |
| **Blender pipelines** (`scripts/blender_pipelines/pipeline_*.py`) | Blender + 60+ addons running on the bench | The pipelines are bench-state; outputs surface as articles |
| **MCP servers** (`Servers/`) | Each MCP is its own daemon | Bench-state |
| **The 300ms orientation loop / aura_soul** | Live daemon at `ws://localhost:8770` | Bench-state; the article describes it once and moves on |

### Business-private (kept off the site)

| What | Where | Reason |
|---|---|---|
| Revenue targets, weekly throughput math, gross margin breakdown | `BUSINESS_PLAN.md` | Commercial intel |
| Threat assessment, opportunity map | `COMPETITIVE_LANDSCAPE.md` §XV–XVI | Commercial intel |
| Per-client commission state | `Productions/` + future commission queues | Customer-private |
| Cluster IPs (Tailscale addresses) | `CLAUDE.md` + `swift_node_setup/` | Network-private |

---

## 11. Duplications + open architecture questions

The walk found duplications and ambiguities that should resolve in future waves.

| Duplication | Locations | Recommended resolution |
|---|---|---|
| **`tools/` vs `tooling/`** | `tools/` = 22 studio bench tooling vendors + studio wrappers; `tooling/` = `depot_tools/` only (Google's chromium-build helper) | Rename `tooling/` → `_external_tooling/` (lead underscore = "vendored, don't touch") or fold into `references/`. |
| **Two parallel Aura VRM stacks** | `apps/aura-vrm/` (the standalone app, port 3011, store-centric) + `Dolly_OS/src/components/{AuraVRM, aura_vtuber, aura, aura-vrm-parts}/` (the shell-integrated version, with `AudioLipSync.ts`, `vrmBlendShapeController.ts`) | Per `SESSION_SUMMARY_2026-04-13.md` §5, the **per-component authority is split**: VRM viewer = aura-vrm; emotion controller + lip sync = local-chat-vrm; LLM service = aura-vrm; VRMA animations = aura-vrm canonical. The Aura article should reference the canonical authority per-component. |
| **Five dashboard apps** | `core-dashboard/`, `dashboard/`, `unified-dashboard/`, `revenue-dashboard/`, `hangar-dashboard/` | Naming drift. None migrate. Worth a one-line note in `apps/REGISTRY.md` about which is current. |
| **Three "academy" surfaces** | `apps/charming-academy/`, `apps/prototypes/AcademyFloorManager/`, `Dolly_OS/public/docs/The_Charming_Academy/`, `workspace/charming-academy/`, `workspace/charming-legacy/` | All 🔒. The canonical app is `apps/charming-academy/` (per SESSION_SUMMARY §5). Others are predecessors. |
| **Two Aura sources of truth for voice** | `apps/aura-vrm/ARCHITECTURE_AURA.md` names Kokoro + LongCat-AudioDiT; user memory names ElevenLabs | Per `HANGAR_RECONCILIATION.md` §10 reconciliation #4: **two backends** (Kokoro local + LongCat remote). ElevenLabs is aspirational. **Stay conservative until user clarifies.** |
| **Two waveguide pipelines** | `apps/waveguide-forge/` (production) + `waveguide/waveguide_toolkit.py` (standalone) | Standalone is the older copy. **Canon is `apps/waveguide-forge/`.** |
| **Two Azure Kinect dirs** | `Azure_Kinect_py/` at root + `tools/azure-kinect-py/` | Same source. **Canon is root `Azure_Kinect_py/`.** |
| **Soundscape engine** (in `HEARTBEAT.md` but nowhere else) | — | ❓ NEW — not in any survey. **Open item**: name the engine or remove the entry. |
| **Pipeline Epsilon (Aura Energy Trails)** | `scripts/blender_pipelines/pipeline_02_aura_attractors.py` | ❓ NEW — not named as a discrete article candidate in prior surveys. Could be a sidebar in Class A #6 (Aura body) or its own piece. |

---

## 12. Newly found items (this walk only)

Items neither the surveys nor the user have already named.

| Item | Where | Significance |
|---|---|---|
| **Pipeline Epsilon — Aura Energy Trails** | `PIPELINES.md` §68–80 + `pipeline_02_aura_attractors.py` | Maps Aura's OCEAN/FFT state to four named strange attractors (Clifford / Thomas / Lorenz / Dequan Li) by quadrant. Outputs a GLB to `C:/temp/aura_trail.glb`. Aura has a *visualisable somatic state*. Could be a sidebar in `articles/aura-the-body` ⏳ or its own piece. |
| **Pipeline Eta — Looking Glass Quilt** | `PIPELINES.md` §100–111 + `pipeline_04_looking_glass_quilt.py` | The 48-view quilt rendering rig. **AliceLG operator namespace is unconfirmed** (open item in `PIPELINES.md`); needs `pipeline_00_smoke_test.py` first. This maps to COMMERCE_ROADMAP candidate #12 (Looking Glass volumetric trail quilts as a saleable product). |
| **`config/void_princess_symphony_pipeline.json`** | — | A pipeline name not in any survey. Likely orchestrates the academy-side music/scene narrative. 🔒 PRIVATE per the academy framing. |
| **`config/sears-trawl-example.playbook.json`** | — | A Sears-archive trawl playbook. Per `HANGAR_RECONCILIATION.md` §10, the Sears framing stays private. |
| **`agents/hangar-plugin/`** | — | A plugin entry for Hangar tooling. Operational. |
| **`workspace/antigravity/`** | — | An "antigravity" workspace. The `antigravity-design-expert` + `antigravity-collaboration` + `antigravity-workflows` skills exist. Unclear what production this serves; possibly the Neo London AntiGravity work that the `blender-pipelines` skill mentions. 🔒 PRIVATE. |
| **`workspace/touchdesigner/`** | — | A TouchDesigner workspace. Installation/AV work. 🔒 PRIVATE. |
| **`workspace/hunyuan3d-2.1/`** | — | The Hunyuan3D-2.1 server install. Powers Pipeline Zeta (text-to-print). |
| **`References_DO_NOT_EDIT_OR_CHANGE/wall_art/art_engine.py`** | — | The "HoloFlow SHARP VR Pipeline" engine. Per `SESSION_SUMMARY_2026-04-13.md` §1 the brand identity was located here. The site's `belt-printed-wall-reliefs` ✅ + future wall-arrays product line route through this. |
| **`References_DO_NOT_EDIT_OR_CHANGE/aituber-kit/`** | — | An aituber-kit reference for the Aura VRM stack. Vendored. |
| **`References_DO_NOT_EDIT_OR_CHANGE/manuswebsite/`** | — | A "Manus website" reference. Unclear; needs investigation. |
| **100+ kaomoji JSON files** at `References_DO_NOT_EDIT_OR_CHANGE/kaomoji_*.json` | — | The kaomoji palette per emotion. **Aura's text-mode emote vocabulary.** Could be a delightful sidebar in the Aura article — "Aura has 100+ emotional kaomoji palettes" — but the file collection itself stays private. |

---

## 13. Honesty constraints applied

Per the brief, three discipline rules apply throughout:

1. **Coverage is about substance, not name.** A Hangar entity that's *mentioned* on the site without its implementation surfaced is ⏳ SURVEYED, not ✅ MIGRATED. Example: Aura is *named* in the chrono-protocol article but the implementation depth (300ms orientation loop, 5-vowel formant analyser, dual TTS backends) only lands as ✅ when `articles/aura-the-body` exists with that substance.
2. **Duplications are named, not hidden.** Five dashboards. Two Aura stacks. Two waveguide pipelines. The map names them and recommends resolutions.
3. **Academy + DollyOS academy docs stay 🔒.** Per `HANGAR_RECONCILIATION.md` §10 + prior survey calls. The exception list (`28_Visual_Generation_Patterns.md`, etc.) is the *only* thread out — and only with academy framing fully stripped.
4. **External-service-dependent capabilities are 📋 at best.** Skybrush, Blender + addons, ComfyUI, MCP daemons, RunPod (LongCat) — these are orchestration capabilities the studio uses, not migratable assets. Articles describe them once.

---

## 14. Update log

Append a row per migration wave.

| Date | Wave | What got reflagged | By |
|---|---|---|---|
| 2026-05-13 | Wave 1 + 2 baseline | Initial map. ✅ 28 entries (articles + lib data + visualisers + 20/30 algorithms). 🔄 5 in-flight (lib/evolution dir, app/atelier/algorithms route, app/atelier/evolution route, 10 missing algorithms, atelier evolution route). | Coverage agent |
| _next entry_ | | | |

---

## 15. Pointers for future map maintainers

- **This file is the only output of the Coverage lens.** Every other survey writes to its own file; the map references all four.
- **Update on every wave.** When a Class A piece ships, change ⏳ → ✅ and name the target route/article. When a Class T-A interactive ships, the same.
- **Update on every new Hangar find.** If a new prototype appears in `apps/prototypes/`, add a row. If `HEARTBEAT.md` gains a new service, name it.
- **Be specific in row notes.** "Some algorithms" is useless. "20 of 30 jewel-array algorithms migrated to `lib/algorithms/*.ts`; 10 outstanding (DLA, Voronoi, RD, PCB-Trace, Penrose-Tiling, Clash-Compositor, Wigner-Seitz, Spinodal, Enneper, Diatom-Hex, LSystem-Tube, Auxetic-Corrugation)" is useful.
- **Honour the 🔒.** When in doubt, leave private. The self-taught invariant + the trans-led framing + the dignity rules are non-negotiable.
- **Trust the prior surveys.** Don't re-derive what `HANGAR_RECONCILIATION.md` already names. Link to them.
- **The site is where the bench breathes outward.** What's in The Hangar is real; what's on the site is *available*. Coverage is the closing of that gap, one wave at a time.

— end of map —
