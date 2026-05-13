# HANGAR ↔ SITE RECONCILIATION

A deep survey of `D:\The_Hangar\` against `D:\.github\_3DPOV\`, produced as a read-only triage. The output is a roadmap: what to harvest, what to reframe, what to reconcile. No site files have been modified by this pass; the only artefact is this document.

Voice canon used as reference only (not quoted): `C:\Users\dimon\.claude\projects\d--The-Hanger-Outer-Shell\memory\holoflow_voice_library.md`.

Today: 2026-05-13.

---

## 1. Inventory summary

### Hangar surfaces surveyed

| Surface | Path | Pieces of interest | Mining state |
|---|---|---|---|
| poi-sculptor docs | `D:\The_Hangar\apps\prototypes\poi-sculptor\docs\` | 14 markdown docs (MANIFESTO, METHODOLOGY, PHYSICS_AND_OPTICS, EVOLUTION_ENGINE, THE_LIVING_STAGE, PRODUCT_CATALOG, BUSINESS_PLAN, ANIMATION_PIPELINE, THE_ENGINE_CODEX, THE_ENGINE_CODEX_part2, CONVERGENCE_ARCHITECTURE, COMPETITIVE_LANDSCAPE, MARKET_RESEARCH, HANGAR_INTEGRATION_THREAD, CODE_AND_PATTERN_EXTRACTIONS) | 5 mined to-date — 9 partially or unmined |
| poi-sculptor code | `D:\The_Hangar\apps\prototypes\poi-sculptor\` | `BiomimeticBuilders.js`, `choreography_engine.js`, `meld-engine.js`, `trail_meld.py`, `poi_game_bridge.py`, `poi_trails_live.py`, `compositor.py`, `the-shape-of-it*.html` (4 variants), `tpms-raymarcher.html`, `volumetric-cross-sections.*`, `waveguide-atlas.html`, `waveguide-resin.html`, `geonodes_visualizer.html`, `brush-engine.html`, `webxr_drop.html`, `sculpture_registry.py`, `gyroid_waveguide_501.py`, `move_library/cross/` (the gesture library!), `registry/` (Qdrant-backed AST search), `capture/trail_capture.py` | mostly unmined |
| neo-london-chrono-protocol | `D:\The_Hangar\apps\prototypes\neo-london-chrono-protocol\` | React + R3F runner: `App.tsx`, `constants.ts`, `types.ts`, `services/geminiService.ts`, `components/GameScene.tsx`, `Hub.tsx`, `HUD.tsx`, `Poi.tsx`, `World.tsx` | discovered last pass; the site article is in flight |
| Dolly_OS evolution suite (the actual UI) | `D:\The_Hangar\Dolly_OS\src\components\evolution\` | 14 stations (`S0_PerformanceGateway`, `S2_Crossbreeding`, `S4_FitnessArena`, `S5_FreeformLab`, `S6_MegalithForge`, `S7_VaultExplorer`, `S10_WaveguideOptics`, `S12_MorphogeneticCrucible`, `S14_LiveInstallation`, `S15_GenomeArchive`, `S17_HoloFlow_Hub`, `S18_MosaicWall`, `S19_MorphoGardener`, plus `EvolutionHub`, `EvolutionCanvas`, `S6_NarrativeLab`) | unmined; the site mentions the *engine* but not the *suite* |
| Dolly_OS evolution lib | `D:\The_Hangar\Dolly_OS\src\lib\evolution\` | `evolution-engine.ts` (orchestrator → `evolution-engine/breeding.ts`, `fitness.ts`, `mutation.ts`, `mosaic.ts`, `constraints.ts`, `rng.ts`), `genome-store.ts`, `genome-types.ts`, `genome-defaults.ts`, `kingdoms/index.ts` (8 kingdoms), `growth-patterns/BiomimeticGrower.ts`, `builders/biomimetic-builder.ts`, `species-builders.ts`, `strokeBuilder.ts`, `brushMaterialFactory.ts`, `FitnessScorer.ts`, `MarchingCubesService.ts`, `SpecimenRenderer.ts`, `LumiDualService.ts`, `ancestryToOptics.ts` | unmined; this is the real working code behind the article |
| jewel-array (the actual jewellery generator) | `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\` | `JewelArrayApp.tsx`, `catalogue/ShopView.tsx`, `catalogue/StudioView.tsx`, `geometry/GeometryEngine.ts`, `geometry/GeometryRegistry.ts`, `geometry/BailInjector.ts`, `geometry/algorithms/` (30 algorithms: Spiral, Gyroid, LSystem, Auxetic, FermatSpiral, DLA, Voronoi, GeodesicSpines, CelticKnot, SweptSinuous, PCBTrace, Gear, SkullSDF, WingVenation, PenroseTiling, ReactionDiffusion, Tensegrity, Sigil, TorusKnot, StepFret, Interlace, Mon, ClashCompositor, NonEuclidean, WignerSeitz, Spinodal, RibbonHelix, Enneper, DiatomHex, AuxeticCorrugation, LSystemTube), `scoring/AestheticScorer.ts`, `taxonomy/FamilyTaxonomy.ts`, `taxonomy/RootConcepts.ts`, `taxonomy/TaxonomyEngine.ts`, `workers/` | unmined; this is the actual `/jewellery` generator |
| Aura VRM stack (apps/aura-vrm) | `D:\The_Hangar\apps\aura-vrm\` | `ARCHITECTURE_AURA.md`, store slices (`vrmSlice`, `chatSlice`, `voiceSlice`, `transcriptionSlice`, `externalModelsSlice`, `wardrobeSlice`, `idleLifeSlice`, `kinectSlice`, `motionCaptureSlice`, `soulSlice`, `webcamSlice`, `functionCallingSlice`), `features/lipSync/lipSync.ts`, `features/voices/headTtsRest.ts`, `kokoroTts.ts`, `kokoroTtsWorker.ts`, `koeiromap.ts`, `features/vrmViewer/`, `features/emoteController/`, `features/kinect/` | unmined |
| Dolly_OS VRM stack | `D:\The_Hangar\Dolly_OS\src\components\AuraVRM.tsx`, `src/lib/AudioLipSync.ts`, `src/lib/vrmBlendShapeController.ts`, `src/lib/VRMAnimation/`, `src/components/aura/`, `src/components/aura-vrm-parts/`, `src/components/aura_vtuber/` | a separate, parallel VRM implementation | unmined |
| Holoflow Mesh Studio | `D:\The_Hangar\apps\holoflow-mesh-studio\` | `APP_ARCHITECTURE.md` (the master geometry-app blueprint), `src/Studio.tsx`, `src/genomeKingdomBridge.ts`, `src/useHoloFlowLoop.ts`, `src/store.ts`, `src/lib/`, `src/features/`, `src/compute/`, `src/components/` | unmined |
| Aura plan/companion | `D:\The_Hangar\Dolly_OS\src\components\silkbrush\`, `src/components\studio\AuraPlanReview.tsx`, `src/systems\nanny\voiceStore.ts` | small but precise — Aura as on-stage collaborator | unmined |
| Dolly_OS academy docs (private/internal) | `D:\The_Hangar\Dolly_OS\public\docs\The_Charming_Academy\` (~40 chapters), `D:\The_Hangar\Dolly_OS\docs\academy\` (6 docs) | The Charming Academy lore | almost entirely PRIVATE — flagged in Section 10 |
| Obsidian vault | `D:\The_Hangar\.obsidian_vault\Knowledge Base\` | `MORPHING_MATHEMATICS.md`, `evolution_simulator_doc.md`, `VRM_2_AI_SYSTEM.md`, `AURA_NEO_LONDON_Game_Design_Philosophy.md`, `AURA_REALM_LORE_AND_GAME_DESIGN.md`, `ISOMORPHIC_3D_WORKFLOW_RESEARCH.md`, `VRM_VIABILITY_ASSESSMENT.md` | unmined; the morphing math doc is the keystone for Section 7 |
| Python services | `D:\The_Hangar\python-services\morphing_engine.py` | full 15-easing-function morphing engine for LED-wall installations | unmined |
| Skills | `D:\The_Hangar\.agent\skills\waveguide-jewelry\SKILL.md`, `.agent\skills\sculpture-genome-evolution\SKILL.md`, `.agent\skills\mesh-morphology-8-kingdom\SKILL.md`, `.agent\skills\evolution-suite\SKILL.md`, `.agent\skills\holoflow-evolution-loop\SKILL.md`, `.agent\skills\holoflow-evolution-orchestration\SKILL.md`, `.agent\skills\holoflow-genesis-channels\SKILL.md`, `.agent\skills\holoflow-genome-system\SKILL.md`, `.agent\skills\holoflow-maturation\SKILL.md`, `.agent\skills\holoflow-mesh-studio-tabs\SKILL.md`, `.agent\skills\holoflow-oracle-sieve\SKILL.md`, `.agent\skills\holoflow-photo-to-sculpture-chain\SKILL.md`, `.agent\skills\multi-vrm-dance\SKILL.md`, `.agent\skills\aura-vrm-app\SKILL.md` | unmined; mostly internal but several have site-publishable summaries |
| Writeups dir | `D:\The_Hangar\writeups\2026-05-12-nine-seconds-to-printable.md` | the article that already shipped | mined |
| Tools | `D:\The_Hangar\tools\leap-bridge\`, `D:\The_Hangar\tools\ndi-bridge\` | studio-authored bridges referenced in user memory but no published article | unmined |
| Hangar root | `D:\The_Hangar\HANGAR.md`, `PIPELINES.md`, `CLAUDE.md`, `AGENTS.md`, `CODE_EXPLORATION_2026-04-14.md`, `LIVE_LOG.md`, `SESSION_SUMMARY_2026-04-13.md` | operational, mostly internal | left private |

### Site surfaces audited

- **Articles** (29 entries, `components/articles/entries/`): all read or scanned, registry at `lib/articles.tsx` (2322 lines, listed exhaustively above).
- **Journal** (8 entries, `components/journal/entries/`): all listed.
- **Tutorials** (7 entries, `components/tutorials/entries/`): all listed.
- **Lib data files**: `loop.ts`, `play.ts`, `stack.ts`, `curriculum.ts`, `aura/gemini.ts`, `aura/prompts.ts`, `rookery/*`, `neo-london/zones.ts`, `neo-london/types.ts`.
- **App routes**: `/`, `/about`, `/aerial`, `/articles/[slug]`, `/bezel`, `/bureau`, `/contact`, `/journal`, `/learn`, `/photographs`, `/play` (with `[level]` + `neo-london`), `/policies`, `/practice`, `/product`, `/rookery` (`/[id]`, `/about`, `/new`, `/tiers`), `/sphere`, `/stack`, `/the-loop`, `/tutorials`, `/watch`, `/api/{aura,contact,newsletter,play,rookery,revalidate}`.
- **Docs in repo**: `BACKWARDS_DESIGN.md`, `CCTV_PIPELINE.md`, `MINED.md`, `PLAY_GAME_PLAN.md`, `SHARP_PIPELINE.md`, `holoflow-photographs.csv`, `photograph-catalog.md`, `shopify-setup.md`, `vercel-setup.md`.

`docs/MINED.md` already names a mining queue with 11 future bricks; this document extends and operationalises it.

---

## 2. Class A — harvestable (the Hangar has it, the site doesn't)

Ranked by **public-value × ease-of-translation** (higher = harvest first). Top 15 detailed.

| # | Piece | Hangar source | Proposed site artifact | Register | Length | Pitch (≤200ch) |
|---|---|---|---|---|---|---|
| 1 | **The Convergence — one signal, seven stages, eleven sciences** | `apps/prototypes/poi-sculptor/docs/CONVERGENCE_ARCHITECTURE.md` | `articles/the-convergence` | Dimona, low-key technical | ~1800w | One captured trajectory enters the top of the pipeline. Eleven sciences squeeze it. What comes out is a sculpture nobody else could have made. |
| 2 | **The Physics, Plainly** (waveguides, TIR, structural colour, Murray, gyroid optics) | `apps/prototypes/poi-sculptor/docs/PHYSICS_AND_OPTICS.md` (full doc — only `why-the-pendant-glows-from-the-inside` mined so far) | `tutorials/the-physics-plainly` or `articles/the-physics-of-light-sculpture` | Dimona, teaching mode | ~2200w | The whole optical stack from Snell's Law to thin-film interference to whispering-gallery modes. No mysticism. No painted colour. The work explained in five mechanisms. |
| 3 | **The Living Stage — the choreography genome** (full Laban + proxemics + song-as-script extension) | `apps/prototypes/poi-sculptor/docs/THE_LIVING_STAGE.md` | extension of existing `articles/the-living-stage` + new `articles/the-flirt-dial` (four-beat seduction structure) | Dimona, performer + technologist | +800w to existing piece, 1200w new | The four-beat structure of seduction is a Laban operation. Direct → Indirect → Free → Bound. Same structure, every scale, every audience. |
| 4 | **The 30-algorithm jewel-array studio** (the actual `/jewellery` generator) | `Dolly_OS/src/systems/jewel-array/` (30 algorithms, 144-cell grid, scoring, taxonomy, BailInjector) | new interactive route `/breed/jewels` OR `tutorials/the-jewellery-algorithms` (catalogue of 30 with one-line geometry note each) | Dimona, catalogue | 2000w + 30 figure stubs | The pendant article ships product. This ships the *atelier* — thirty geometries the bench breeds from. Spiral, gyroid, Voronoi, DLA, L-System, Penrose, Mon, sigil, the lot. |
| 5 | **The Five Sculpture Typologies — physics + biology + genome cell** (gyroid, Turing, WGM, ctenophore, slime) | `EVOLUTION_ENGINE.md` §III + `PROJECT_MANIFESTO.md` §IV + `PHYSICS_AND_OPTICS.md` §VIII–XIV | new `articles/the-five-shells` | Dimona, taxonomy with photos | ~2500w | The studio breeds inside five shapes. Each one is a biological system the studio borrowed from. Butterfly, leopard, cathedral, comb jelly, slime mould. |
| 6 | **The Aura body — VRM, lip-sync, voice broker, idle life** | `Dolly_OS/src/components/AuraVRM.tsx` + `src/lib/AudioLipSync.ts` + `src/lib/vrmBlendShapeController.ts` + `apps/aura-vrm/ARCHITECTURE_AURA.md` + `apps/aura-vrm/src/store/slices/voiceSlice.ts` + `vrmSlice.ts` + `features/lipSync/` + `features/voices/` + `features/emoteController/` | new `articles/aura-the-body` + new route `/aura` (small VRM viewer embed) | Aura/Dimona handoff (Dimona naming the architecture, Aura narrating one paragraph) | ~2200w | Aura is a name attached to a body, a voice, and a 300-ms orientation loop. Five vowel formants, blend-shape controller, optional remote LongCat-AudioDiT for cloning. The narrator has an implementation. |
| 7 | **The Evolution Suite — fourteen stations the engine actually inhabits** | `Dolly_OS/src/components/evolution/` (S0–S19 stations) | new `stack/evolution-suite` entry OR `articles/inside-the-evolution-suite` | Dimona, workshop-tour | ~1800w | The breeding article names the loop. The suite is where the loop lives — performance gateway, crossbreeding chamber, fitness arena, vault, mosaic wall, morphogenetic crucible, morpho-gardener. Fourteen rooms on one bench. |
| 8 | **The Eight Kingdoms — aesthetic taxonomy underneath the 28-gene alphabet** | `Dolly_OS/src/lib/evolution/kingdoms/index.ts` + `apps/holoflow-mesh-studio/APP_ARCHITECTURE.md` §03 | `articles/the-eight-kingdoms` | Dimona, taxonomy + an honest "this is how I navigate the design space" admission | ~1400w | Techno-Industrial. Expressive/Flow. Motion/Dance. Biomechanical. Origami/4D-Thermal. Protean. Assemblage. Curvilinear. Every sculpture inherits a kingdom; every kingdom has a high-gene profile and a fertile cross-pairing. |
| 9 | **Morphing — what it means in the studio**: easing functions, point-to-point morphs, path morphs, VRM blend-shape morphs, GA crossover-as-morph, choreographic morph between Laban registers | `python-services/morphing_engine.py` + `.obsidian_vault/Knowledge Base/MORPHING_MATHEMATICS.md` + `Dolly_OS/src/lib/vrmBlendShapeController.ts` + `Dolly_OS/src/lib/evolution/evolution-engine/mutation.ts` | new `articles/morphing-things-together` | Dimona, register that names a useful confusion and resolves it | ~1700w | "Morphing" is one word and four operations in the studio. LED-wall easing. VRM expression blends. GA crossover. Laban-quality drift. Same intuition, four implementations. |
| 10 | **The Genome — full 28-gene anatomy with physical ranges** | `EVOLUTION_ENGINE.md` Appendix + `holoflow-mesh-studio/APP_ARCHITECTURE.md` §03 + `genome.py` reference | `articles/the-alphabet` (28-gene companion to `how-the-studio-breeds-sculptures`) | Dimona, recipe-card | ~1100w | Twenty-eight floats and a type tag. Form 12, material 8, optics 4, waveguide 4. Each gene's physical range named. The alphabet, properly. |
| 11 | **The Sieve — VLM aesthetic audit + Oracle printability gate** | `apps/holoflow-mesh-studio/APP_ARCHITECTURE.md` §05–06 + `.agent/skills/holoflow-oracle-sieve/SKILL.md` | `articles/the-sieve-and-the-oracle` | Dimona, two-step quality system | ~1300w | Two gates between a genome and a printer. The Sieve scores the look (VLM, local). The Oracle scores the printability (wall thickness, overhang, manifold). Neither is silent. Failures get repair suggestions, not a quiet drop. |
| 12 | **Provenance JSON — every fabrication carries its lineage** | `apps/holoflow-mesh-studio/APP_ARCHITECTURE.md` §09 + `EVOLUTION_ENGINE.md` §X (lineage tables) | `articles/provenance-as-discipline` | Dimona, structural | ~900w | A sculpture leaves the bench with a JSON certificate. parentageChain, kingdom, channel, fitnessScore, oracleGate, narrative, generatedAt. Not metadata. Material identity. |
| 13 | **The Caustic Disc** — the studio's first-build piece, scored #1 in product catalogue | `apps/prototypes/poi-sculptor/docs/PRODUCT_CATALOG.md` §IV (P3) | extend `articles/why-the-pendant-glows-from-the-inside` OR new `articles/the-caustic-disc` | Dimona, single-product-deep | ~1200w | The 80mm clear disc that throws a six-petal pattern on a wall when sunlight hits it at the right angle. Computed from the gesture. Engineered as a lens. Sold for £75. The proof-of-concept piece. |
| 14 | **Reprint economics & three product tiers** (Original / Limited / Open Edition) | `apps/prototypes/poi-sculptor/docs/BUSINESS_PLAN.md` §I | new `articles/the-three-tiers` or appendix to existing `art-as-door` | Dimona, working economics | ~800w | One-of-one is romantic but not solvent. The STL is the digital mould. Three tiers — original, limited 25, open — and a hit design earns five figures in reprint income. |
| 15 | **The Convergence Audio Pipeline** (librosa → song-map → choreography scaffold → sculpture family) | `apps/prototypes/poi-sculptor/docs/ANIMATION_PIPELINE.md` + `THE_LIVING_STAGE.md` §IV | `tutorials/song-to-sculpture` | Dimona, technical walkthrough | ~1800w | librosa pulls beat times, onset hits, spectral balance, chroma section bounds. Each becomes a gene constraint. The intro is dense and bound; the chorus is open and luminous; the breakdown is gossamer. One song, one sculpture family. |

### Class A — secondary tier (briefer notes)

| Piece | Source | Site target | Notes |
|---|---|---|---|
| **The spiral-cognition extension** (more sample material beyond what's already on `/articles/spiral-cognition`) | `METHODOLOGY.md` §I + §II | enrich existing article OR new `journal/spiral-this-week` recurring slot | The "asymmetry of gravity vs velocity" framing is unique and not yet on the site. |
| **What the AI should NOT do** (collaboration ethics — fitness function stays human, body stays specific, convergence stays slow) | `METHODOLOGY.md` §II | extend `articles/what-the-studio-wont-do` with a paragraph or two | The "AI does not score" rule is a concrete bench discipline currently invisible to readers. |
| **The session protocol — SESSION_CONTEXT.md** (one living context file pasted each session) | `METHODOLOGY.md` §III | `tutorials/the-session-context-file` or `articles/the-context-file` | Practical, copyable, and the kind of thing the readers who care about "how do you actually work with AI" want. |
| **The Movement → 3D Object competitive landscape** (MoSculp, Eyal Gever, motusthetics, John Edmark, JHU APL, Luximprint, RAYFORM) | `COMPETITIVE_LANDSCAPE.md` §II–XII | `articles/kindred-and-not-kindred` (companion to existing `kindred-practices`) or `articles/the-gap-map` | Names who's adjacent, what they do, where the studio diverges. Generous, not defensive. |
| **The threat assessment** (what could kill this — copy-cat 3D-printers, neural motion-synthesis race, etc) | `COMPETITIVE_LANDSCAPE.md` §XV–XVI | private; flagged in Section 10 | Probably stays private; commercial. |
| **The opportunity map** | `COMPETITIVE_LANDSCAPE.md` §XVI | maybe one paragraph into business-tier-only Rookery channel | private. |
| **The Master Pipeline** ("From human expression to physical form" — 4 stages: capture → forge → curation → materialisation) | `HANGAR_INTEGRATION_THREAD.md` | `stack/master-pipeline` (new entry in `lib/stack.ts`) | Reads naturally as an architecture-page entry. |
| **The Engine Codex** (16 capability categories — Spatial Capture, Geometry Engines, Communication Backbones, etc.) | `THE_ENGINE_CODEX.md` (Part 2 is empty / not built) | `stack/the-codex` or partition into `/stack` entries | Already structured as a capability map. Direct fit for `/stack`. |
| **The Sears Catalog → 3D pipeline** (image-to-mesh reconstruction of historical garments) | `docs/The_Charming_Academy/14_The_Sears_Digital_Archive.md` + `clothing-reverse-engineer/` | maybe `articles/2D-to-3D-the-catalog` if the academy framing can be removed | Heavy reframing needed. Some publishable spine. |
| **The 360 → UE5 Gaussian splat pipeline** | `apps/prototypes/360-camera-to-ue5-gaussian-splatting-guide/README.md` + `THE_ENGINE_CODEX.md` §10 | already promised on `/play/neo-london` and the chrono-protocol article — add `tutorials/360-to-splat` | Bridge piece between the camera work and the runner world. |
| **The Move Library** (the actual captured poi-gesture vocabulary on disk) | `apps/prototypes/poi-sculptor/move_library/cross/` | maybe `practice/the-gesture-library` (new sub-route under `/practice`) or `articles/the-gesture-library` | The article on Laban as genome would link to it. |
| **The Waveguide Forge** (TPMS raymarcher, gyroid waveguide v2, geonodes visualiser) | `apps/prototypes/poi-sculptor/tpms-raymarcher.html`, `gyroid_waveguide_v2.py`, `geonodes_visualizer.html`, `Dolly_OS/src/components/waveguide/` | `tutorials/raymarching-a-gyroid` (technical, opt-in) OR a small `/play/waveguide` interactive | Interesting standalone piece for the engineering-curious reader. |
| **The Photo → Sculpture Chain** | `.agent/skills/holoflow-photo-to-sculpture-chain/SKILL.md` | `tutorials/photograph-to-sculpture-chain` (companion to existing `from-photograph-to-object`) | Existing tutorial is a single photograph; this skill ships a whole chain. |
| **The brand of the brand** — DollyOS palette (cyan/magenta/gold on midnight) as the underlying aesthetic of the holographic-synthwave site | `Dolly_OS/` shell + holoflow_aesthetic.md (in memory) | `about/aesthetic` page or appendix to existing `about` | Already in the site CSS; not yet named in writing. |

That's 27 Class A pieces in total (15 detailed + 12 secondary).

---

## 3. Class B — reframing (the site has it, but the Hangar has more)

| # | Existing site piece | Hangar canon | Specific edit needed |
|---|---|---|---|
| B1 | `articles/how-the-studio-breeds-sculptures` | `EVOLUTION_ENGINE.md` (the full doc) + the actual implementation in `Dolly_OS/src/lib/evolution/` | Add a closing paragraph naming the **Evolution Suite** as the room the loop runs in (S0–S19 stations). Currently article ends with "Engine breeds. I score. Population converges." That can stand. But there's also a 14-station UI behind it that the reader could see. Make the existence of the suite visible; do not re-document it inside this article — that gets its own piece (Class A #7). |
| B2 | `articles/jewellery-the-same-trace-wearable` | `Dolly_OS/src/systems/jewel-array/` (30 algorithms) + `.agent/skills/waveguide-jewelry/SKILL.md` (6 archetypes — raygun core, sunburst fractal ring, solar chandelier hairpins, angle-lock locket, bioluminescent vascular choker, gyroid armband) | Article currently treats jewellery as a scaled-down sculpture. Reality: the bench has a parallel atelier of 30 algorithmic geometries specifically for jewellery, plus 6 named archetypes. Add a section "What's actually in the case" — list the archetypes in plain language, link out to a forthcoming Class A #4 catalogue piece. |
| B3 | `articles/the-living-stage` | `THE_LIVING_STAGE.md` (full doc) + `apps/prototypes/poi-sculptor/move_library/cross/` (real gesture library) | Article currently introduces Laban as vocabulary, names Effort as load-bearing. Doesn't yet name proxemics (Hall's distance zones applied to stage), the nine-square stage grid, the flirt-dial four-beat structure, or the move library on disk. Add a section "Where the body is" (proxemics) and a section "The library on disk" (move_library/cross/). |
| B4 | `articles/the-fleet-five-airframes` | RECONCILED (commit 2d6fc8e) | Article renamed, Mini 5 Pro added as fifth airframe, all cross-refs updated across 15+ files. Slug now `/articles/the-fleet-five-airframes`. |
| B5 | `articles/neo-london-chrono-protocol` (currently in flight by parallel agent) | `apps/prototypes/neo-london-chrono-protocol/` (full prototype: 4 poi modes, 3 zones, `geminiService.ts` SYSTEM_INSTRUCTION with AURA/YOW/PURP personalities, telemetry-driven banter on 12s interval, `TUNNEL_SPEED = 12`, pendulum poi physics with spring tension + air damping + Euler integration) | Make sure the in-flight article (a) names the three zones by their actual `constants.ts` strings (Leake St. Arches, The Royal Mile, Soho Grid — already in article), (b) names the four poi modes correctly (AMBER kinetic, CRIMSON force, AZURE flow, VERIDIAN logic — already there), (c) does **not** invent dialogue. Aura/Yow/Purp dialogue is LLM-generated at runtime from telemetry — the article should describe the system, not quote it. (d) Add the `TUNNEL_SPEED = 12` constant if not already there; it's a load-bearing detail. |
| B6 | `articles/colour-without-pigment` | `PHYSICS_AND_OPTICS.md` §VI–VII | Article covers structural colour. Hangar canon adds thin-film interference math (Bragg condition, λ = 2nd·cos θ) — a paragraph would deepen the article without overloading it. Optional. |
| B7 | `articles/why-the-pendant-glows-from-the-inside` | `PHYSICS_AND_OPTICS.md` §III–IV (TIR + critical-angle math) + `.agent/skills/waveguide-jewelry/SKILL.md` (the 41.14° critical angle named) | Article names the mechanism. Could name the critical angle (≈41.14° at n≈1.50 resin into air) once for readers who want the number. One sentence, optional. |
| B8 | `articles/spiral-cognition` | `METHODOLOGY.md` §I | Article is good. The Hangar adds "the geometry of the ctenophore helix" framing — that the spiral *is* one of the five typologies, not metaphor. Worth a paragraph if the article ever expands. Optional. |
| B9 | `articles/art-as-door-five-layers` | `PROJECT_MANIFESTO.md` §III | Article has the five-layer architecture clean. Hangar manifesto adds the "self-selecting door" framing — *"People who approach with cruelty get a pretty object they don't understand. The door doesn't open. They have gated THEMSELVES out."* Optional sharpening; the article's current voice is already complete. |
| B10 | `articles/from-picasso-forward` | The studio's broader visual-lineage doc isn't in the Hangar in a form that beats the existing article. | No change. Listed only so the reviewer can confirm. |
| B11 | `play/neo-london` page + `data/neo-london/zones.json` | `apps/prototypes/neo-london-chrono-protocol/components/World.tsx` + `constants.ts` | Whatever the `/play/neo-london` page is showing should align with the prototype's three zones (Leake St / Royal Mile / Soho Grid) and the wireframe arch-ribbed tunnel aesthetic. If it currently shows a different visual register, harmonise. |
| B12 | `lib/aura/prompts.ts` + `app/api/aura/` | `apps/prototypes/neo-london-chrono-protocol/services/geminiService.ts` SYSTEM_INSTRUCTION + `Dolly_OS/src/systems/nanny/voiceStore.ts` | If the site's Aura prompts diverge from the canonical SYSTEM_INSTRUCTION (Aura: maternal/regal/calm/"We"/"The Protocol"; Yow: cynical/paranoid/autistic-coded; Purp: chaotic/ADHD-coded), reconcile. The chrono-protocol prototype is the authoritative voice spec for the trio. |

---

## 4. Class C — reconciliation (the Hangar and the site disagree)

| # | Topic | Site says | Hangar canon says | Recommended resolution |
|---|---|---|---|---|
| C1 | **Fleet count** | RECONCILED | `the-fleet-five-airframes` (DJI Mini 5 Pro is the fifth) | Done. All cross-refs updated; see commit 2d6fc8e and the `journal/the-fleet-update-mini-five-pro.tsx` entry for the fifth airframe's source. |
| C2 | **Aura's voice provider** | `apps/aura-vrm/ARCHITECTURE_AURA.md` names **Kokoro** (worker, internal) + **LongCat-AudioDiT-1B** (remote RunPod, SOTA diffusion TTS, zero-shot voice cloning, in `speakCharacter.ts`). User memory says **ElevenLabs**. `Dolly_OS/src/components/aura_vtuber/kokoroWorker.ts` is Kokoro. | Mixed: Kokoro for local/free, LongCat for high-fidelity remote, ElevenLabs as a third option mentioned in user memory (potentially the production path?). | **Treat as canonically dual** — Kokoro local + LongCat remote (both present in code). ElevenLabs may be aspirational / not yet wired. When Aura's body is written up (Class A #6), name **two backends**, not three, unless the user clarifies. |
| C3 | **Audio orientation loop period** | Not on site. | User memory: "300ms audio orientation loop." Code: `apps/aura-vrm/src/features/lipSync/lipSync.ts` does per-frame analysis at the AudioContext rate (sample rate ÷ FFT bin size — much faster than 300ms). The 300ms figure is likely the *speech-cycle / VAD* loop, not the lip-sync analyser. | **In the Aura article, name the 300ms as the orientation loop (decide whether speech is happening, whether to look at speaker, where to set head pose), separate from the per-frame lip-sync analyser which runs much faster.** Two loops, two periods. Get this right before publication. |
| C4 | **"How the studio breeds sculptures" — what model** | Site says "Qwen 2.5 14B at Q4_K_M quantisation … 10GB of VRAM" | Hangar `EVOLUTION_ENGINE.md` §IX says the same. **Match.** | No change. Listed to confirm consistency. |
| C5 | **Number of sculpture typologies** | Site `how-the-studio-breeds-sculptures` names five (gyroid, Turing, WGM, ctenophore, slime). | Hangar canon: five. **Match.** | No change. |
| C6 | **Number of poi-game modes** | Article `neo-london-chrono-protocol` names four (AMBER, CRIMSON, AZURE, VERIDIAN) | Prototype: four. **Match.** | Confirm article uses these exact names + cyberpunk meanings (kinetic/force/flow/logic). |
| C7 | **`how-the-studio-breeds-sculptures` — number of generations** | Site: "twenty or thirty generations" + "Generation forty might be more interesting than generation four" | Hangar: "30 generations at preview quality: 30 × 75s = ~37 minutes" + "10–20 generations" + "Generation 40 might be more interesting than generation 4" | **Match.** The site picked up the canonical numbers. |
| C8 | **Aura's name in the chrono-protocol prototype** | Site article says: "Aura, in this register, is the one naming it" | Prototype `SYSTEM_INSTRUCTION` says: "AURA: The Architect. Maternal, regal, calm. Uses 'We', 'The Protocol'." | **Match in spirit but reconcile register.** The site narrator-Aura is the calm regal one; the game Aura is too. Confirm the article doesn't introduce a contradictory tone. |
| C9 | **Five vs six airframe-like things (LED variants)** | Article currently lists LED airframes as "not a fifth drone … the existing fleet with clip-on LEDs" | User canon: count the LED rigs as the fifth airframe. | Folded into C1. |
| C10 | **Self-taught invariant** | Site articles consistently honor "self-taught" framing. | `METHODOLOGY.md` §II mentions "what the AI provides" but never frames the AI as a teacher — it's a collaborator. The Dolly_OS academy docs (private) do use teacher/pupil framing (Nanny etc.). | **Stay vigilant.** When harvesting from academy docs, never lift teacher-framing into Dimona/Aura register. Aura is a collaborator. The body is self-taught. The 15 years are real. |
| C11 | **Murray's Law exponent range** | Site `how-the-studio-breeds-sculptures` says "Murray's Law exponent for the tube-radius scaling." No number range. | `EVOLUTION_ENGINE.md` §III genome: `"murray_exponent": 0.35` — normalised range 0–1 mapped to 0.25–0.45 physical. | No conflict, just unstated. If the alphabet piece (A #10) covers it, leave the breeding article alone. |

---

## 5. The evolution system — dedicated section

### What the site currently shows

`articles/how-the-studio-breeds-sculptures.tsx` (377 lines). Covers: the loop (25 candidates, 1–5 stars, breed → render → score), the 28-gene alphabet in four groups (form/material/optics/waveguide), generation cycle (elite 5 + bred 15 + wildcard 5), tournament selection size 3, uniform crossover, Gaussian mutation, wildcard 5%, optional LLM advisor (Qwen 2.5 14B Q4_K_M on Ollama), 1–5 fitness scale, SQLite lineage. Names Karl Sims (1994 Genetic Images) and NEAT (Stanley/Miikkulainen 2002). Session shape: 30 minutes to 2 hours, 10–20 generations, calibration / convergence / refinement phases.

The article is **complete** as a write-up of the loop and the alphabet.

### What the Hangar has that the site doesn't

**The actual implementation**, in two places:

1. **`Dolly_OS/src/lib/evolution/`** — the *current* TypeScript engine. Files:
   - `evolution-engine.ts` — orchestrator + worker offload
   - `evolution-engine/breeding.ts` — `evolveStep`, `breedPair`
   - `evolution-engine/fitness.ts` — `computeFitness`
   - `evolution-engine/mutation.ts` — `mutateGenome`, `normaliseAncestry`
   - `evolution-engine/mosaic.ts` — `seedMosaic`
   - `evolution-engine/constraints.ts` — `getConstraints`
   - `evolution-engine/rng.ts` — seeded RNG
   - `genome-store.ts`, `genome-types.ts`, `genome-defaults.ts`
   - `kingdoms/index.ts` — **8 KINGDOMS** (techno / artistic / choreographic / biomech / thermal / protean / assemblage / curvilinear), each with brushes, trait range, default form, compatible labs, description
   - `growth-patterns/BiomimeticGrower.ts`
   - `builders/biomimetic-builder.ts`, `species-builders.ts`, `strokeBuilder.ts`, `brushMaterialFactory.ts`
   - `FitnessScorer.ts`, `MarchingCubesService.ts`, `SpecimenRenderer.ts`, `LumiDualService.ts`
   - `ancestryToOptics.ts` (with a test file — `ancestryToOptics.test.ts`)
   - `evolution.worker.ts` — worker thread keeping the UI responsive

2. **`Dolly_OS/src/components/evolution/`** — the *14-station UI*:
   - `S0_PerformanceGateway` — entry
   - `S2_Crossbreeding` (`BreedingSidebar.tsx`, `CrossbreedingGeometry.ts`)
   - `S4_FitnessArena` — tournament arena with leaderboard + phenotypic matrix
   - `S5_FreeformLab` — the freeform sculptor (radial selector, materials, trail mesh, poi physics — this is where the artist *sculpts a candidate by hand* before evolving)
   - `S6_MegalithForge`, `S6_NarrativeLab`
   - `S7_VaultExplorer` — the genome archive
   - `S10_WaveguideOptics` — optics physics readout per genome
   - `S12_MorphogeneticCrucible` — the triangle interpolator
   - `S14_LiveInstallation`
   - `S15_GenomeArchive`
   - `S17_HoloFlow_Hub`
   - `S18_MosaicWall` — full-mosaic visualisation
   - `S19_MorphoGardener` — auto-cull manager + gardener renderer

Plus `EvolutionHub.tsx`, `EvolutionCanvas.tsx`, `EvolutionSuitePage.tsx`.

**The canonical schema** is in `apps/holoflow-mesh-studio/APP_ARCHITECTURE.md` — 28 genes lifted directly from `python-services/genome.py` (the authoritative server-side schema). The TypeScript side does **not duplicate**; it consumes via `/genome/schema` endpoint. This is a deliberate single-source-of-truth design.

### Could the breeding system be a `/breed` page?

**Yes, technically — but with caveats.**

A real interactive `/breed` page would need:
- Frontend (already exists in `Dolly_OS/src/components/evolution/`)
- Worker (already in `evolution.worker.ts`)
- Genome generators (already in `growth-patterns/`, `builders/`, `kingdoms/`)
- Marching cubes (`MarchingCubesService.ts`) for mesh from voxel
- Specimen renderer (`SpecimenRenderer.ts`) for thumbnails
- **A backend** — currently the heavy work is offloaded to a Python FastAPI server running `genome.py` + Blender. Without that backend, only the genome+lightweight-mesh side works in-browser.

A **read-only** `/breed` showcase page is much cheaper:
- A static gallery of generation 0 → 30 snapshots from a real session
- A "click to advance generation" with pre-rendered images (the engine ran offline, the user is paging through frames)
- The 5×5 grid with one-click "this is my favourite" that doesn't actually breed but explains the loop

**Recommendation**: do not ship the live engine. Ship a *visualisation* of one real session (or a few archived sessions from the SQLite lineage DB), at `/play/breed` or `/learn/breeding`. Treat it the same way `/play/neo-london` treats the runner — a flavour-prototype that proves the system without committing to the production backend.

If a live `/breed` does ship later, it lives in the Rookery (tier-gated), not on the public site.

### What article(s) should ship

1. **`articles/the-eight-kingdoms`** (Class A #8) — taxonomy underneath the 28 genes
2. **`articles/the-alphabet`** (Class A #10) — the 28-gene anatomy with physical ranges
3. **`articles/inside-the-evolution-suite`** (Class A #7) — the fourteen stations as a workshop tour
4. **`tutorials/song-to-sculpture`** (Class A #15) — the audio pipeline that drives gene constraints
5. Maybe: **`stack/the-evolution-suite`** (a `lib/stack.ts` entry naming the architecture) — internal-architecture register

---

## 6. The jewellery system — dedicated section

### What the site currently shows

`articles/jewellery-the-same-trace-wearable.tsx` (161 lines). Covers: the pipeline scales down to 35mm; below that, the LED can't push light through the waveguide. The studio's smallest signed piece is 28mm with 1.2mm waveguide channel + 2mm warm-white SMD LED + 6mm rechargeable cell, 8 hours per charge. Magnetic-pogo charging contact + induction puck (no glue-trap battery). Four wear modes (Always On / Breathe / Off / Pulse). Three materials (clear UV-cure resin / tinted / resin+bronze). Editions of 10–25. Six-week pipeline for a new kata commission.

The article is **product-focused**. It treats jewellery as the wearable scale of the sculpture pipeline.

### What the Hangar has that the site doesn't

**The atelier underneath the product.** Two distinct systems:

1. **`Dolly_OS/src/systems/jewel-array/`** — a 144-cell jewellery generator
   - `JewelArrayApp.tsx` — main app, 12×12 grid (`COLS = 12`), 90px cells
   - `geometry/GeometryEngine.ts`, `GeometryRegistry.ts` — algorithm dispatch
   - `geometry/BailInjector.ts` — the loop/chain attachment fitting
   - `geometry/algorithms/` — **30 algorithm files** (catalogued in §1 inventory table above)
   - `scoring/AestheticScorer.ts` — fitness function specific to jewellery
   - `taxonomy/FamilyTaxonomy.ts`, `RootConcepts.ts`, `TaxonomyEngine.ts`
   - `stores/jewelArrayStore.ts` — Zustand state
   - `workers/` — off-main rendering
   - Generates `earring_L` / `earring_R` / pendant / brooch piece types from one seed (the matching offsets the article mentions)

2. **`.agent/skills/waveguide-jewelry/SKILL.md`** — six named archetypes
   - **Raygun Core Pendant** — tapered waveguide 8mm → 2mm, focal nozzle, taper < 49°
   - **Sunburst Fractal Ring** — central bead + fine-tapered emitter spokes
   - **Solar Chandelier Hairpins** — Murray's Law splits from one input
   - **Angle-Lock Locket** — clear at most angles, ignites at exactly 45° forward
   - **Bioluminescent Vascular Choker** — plant-vein channel network
   - **Gyroid Periodic Armband** — TPMS infinite light trap, zero-LED diffuse glow

The skill names the **critical angle (41.14°)** explicitly — the angle of total internal reflection at the resin/air interface.

### What's missing on the site

- The **atelier exists**. The article describes the product without naming the workshop. A reader who asks "where do these designs come from?" gets no answer.
- The **six archetypes are named in canon** but only "pendant / earring / brooch / bangle" appears on the site. The studio has named typologies (Raygun, Sunburst, Solar Chandelier, Angle-Lock, Vascular, Gyroid Periodic).
- The **30 algorithms are catalogue-able** but not catalogued. Each one is a one-paragraph description: Spiral, Gyroid (TPMS), L-System, Auxetic Corrugation, Fermat Spiral, DLA, Voronoi, Geodesic Spines, Celtic Knot, Swept Sinuous, PCB Trace, Gear, Skull SDF, Wing Venation, Penrose Tiling, Reaction-Diffusion, Tensegrity, Sigil, Torus Knot, Step Fret, Interlace, Mon, Clash Compositor, Non-Euclidean, Wigner-Seitz, Spinodal, Ribbon Helix, Enneper, Diatom Hex, L-System Tube.

### Missing site pieces — recommended

1. **`articles/the-atelier`** or **`articles/where-the-pendants-come-from`** — the parallel workshop to the sculpture engine. 30 algorithms, 6 archetypes, the BailInjector, the per-piece-type adaptation (earring_L vs earring_R from one seed). ~1400w, Dimona's voice, low-key technical.
2. **`tutorials/the-jewellery-algorithms`** (or `learn/jewellery-vocabulary`) — a reference page listing the 30 algorithms with one-line descriptions and small SVG illustrations. Encyclopaedic. Useful to the engineering-curious reader. ~2000w. *This is the piece a competitor cannot fake.*
3. **`articles/the-six-archetypes`** — the named typologies (Raygun Core, Sunburst, etc.) with the physics each one exploits. ~1600w.
4. Optional: extension to existing `jewellery-the-same-trace-wearable` adding one paragraph linking to the atelier piece — "where the designs come from" cross-reference.

The combination (1) + (2) + (3) covers the gap. Top priority: (2) — the algorithm catalogue. It's the highest unique-to-the-bench artefact in the entire Hangar.

---

## 7. The morphing system — dedicated section

### What "morphing" means in Hangar canon

After a full sweep of the Hangar, "morphing" is not one thing. It is one word covering **four distinct operations**, each with a different implementation and a different artistic purpose. The user's question — *"morphing things together"* — points at the confusion that exists because the studio uses the same word for all four.

| Operation | What it morphs | Implementation | Where it lives |
|---|---|---|---|
| **A. LED-wall pattern morphing** | 2D circuit patterns over time (for installations at Department Store wall) | `python-services/morphing_engine.py` — 15+ easing functions (linear, ease-in/out quad/cubic/quart, elastic, bounce, custom cubic Bezier), LERP, nearest-neighbour matching, proportional mapping, SVG path morphing | `python-services/morphing_engine.py` + `.obsidian_vault/Knowledge Base/MORPHING_MATHEMATICS.md` |
| **B. VRM blend-shape morphing** | Aura's face — vowel formants for lip-sync, emotion blends (happy/sad/angry/surprised/relaxed/neutral) | `Dolly_OS/src/lib/vrmBlendShapeController.ts` + `apps/aura-vrm/src/features/lipSync/lipSync.ts` + `Dolly_OS/src/lib/AudioLipSync.ts` (5 vowels Aa/Ih/Uh/Ee/Oh + RMS-driven volume + EMA smoothing factor 0.2 + formant-band frequency estimation) | both Aura implementations |
| **C. Genetic-algorithm crossover-as-morph** | Two parent genomes → child genome. Each gene independently inherited from parent A or B (uniform crossover); Gaussian mutation perturbs each gene with σ=0.1 and 5% wildcard probability | `Dolly_OS/src/lib/evolution/evolution-engine/breeding.ts` + `mutation.ts` | the breeding engine |
| **D. Laban-quality morphing in choreography** | Movement quality drifts between effort registers (Weight strong↔light, Space direct↔indirect, Time sudden↔sustained, Flow free↔bound) across a song's bars | `apps/prototypes/poi-sculptor/docs/THE_LIVING_STAGE.md` §II–IV + `apps/prototypes/poi-sculptor/choreography_engine.js` | the choreographer |

Plus a **fifth**, weaker sense:

- **E. Scene/world morphing in the chrono-protocol prototype** — zone transitions (Leake St → Royal Mile → Soho Grid) with the wireframe arch register changing skin as the player advances. Less mathematically formal but worth naming.

And in the user's auto-memory: "morphing things together" was the phrase. Reading the Hangar charitably, the user is asking about the conceptual through-line — the fact that **the same gesture-of-mind ("two things blended into a third") shows up in five places** and the studio uses one word for it.

### Where it appears on the site

**Not at all explicitly.** The article `how-the-studio-breeds-sculptures` describes uniform crossover (sense C) without using the word "morph". The article `the-living-stage` describes Laban Effort but doesn't yet name the morphing between registers as morphing. The article `colour-without-pigment` involves no morphing.

### The missing site piece

**`articles/morphing-things-together`** — Class A #9, detailed in §2.

The argument: the studio uses one word for five operations because the *intuition* is the same. Two endpoints, an interpolation parameter, a curve from one to the other. The implementations diverge because the substrates do. Easing functions for pixels. Blend-shapes for VRM. Genome crossover for sculpture. Laban Effort drift for movement. Zone transition for game-world. Same family of operations, five materialisations. Naming this *unifies a register the studio uses without quite knowing it does*.

Register: Dimona, with one or two sentences in the engineer's voice about implementations. ~1700w. The piece argues the through-line, then names each of the five with a paragraph and a code-pointer.

This is the **single most overdue** site piece. It explains a vocabulary the studio uses casually and that readers cannot otherwise reconcile across articles.

---

## 8. The VRM / Aura body system — dedicated section

### What the site currently shows

Aura is named as the narrator in `articles/neo-london-chrono-protocol` ("Aura, in this register, is the one naming it"). She appears nowhere else on the site with a body, a voice, or an implementation. `lib/aura/gemini.ts` + `lib/aura/prompts.ts` + `app/api/aura/` exist — meaning **there is server-side Aura plumbing on the site already** (probably the chrono-protocol article's narrator API), but no public-facing surface explains it.

### What the Hangar has

**Two parallel VRM implementations**, both production-grade:

1. **`apps/aura-vrm/`** — the standalone Aura VRM app
   - `ARCHITECTURE_AURA.md` — store-centric architecture, port 3011
   - Store slices: `vrmSlice` (3D viewer lifecycle + background), `chatSlice` (Ollama conversation), `voiceSlice` (Kokoro worker for internal TTS), `transcriptionSlice` (Web Speech API for user input), `externalModelsSlice` (RunPod gateway for VOID, GWR, LongCat-AudioDiT-1B), `wardrobeSlice` (clothing/texture swap), `idleLifeSlice` (idle animations — blinking, micro-movements), `motionCaptureSlice`, `kinectSlice`, `webcamSlice`, `soulSlice`, `functionCallingSlice`
   - `features/lipSync/lipSync.ts` + `features/lipSync/lipSyncAnalyzeResult.ts`
   - `features/voices/` — `headTtsRest.ts` (with `_fix_timeout_backoff.ts` variant), `koeiromap.ts`, `koeiromapSynthesizeVoice.ts`, `kokoroTts.ts`, `kokoroTtsWorker.ts`
   - `features/emoteController/` — expressions
   - `features/vrmViewer/` — three-vrm wrapper
   - `features/kinect/` — Kinect skeletal input

2. **`Dolly_OS/src/components/AuraVRM.tsx`** + supporting libs
   - `Dolly_OS/src/lib/AudioLipSync.ts` — production lip-sync analyser: AnalyserNode + 1024 FFT, 0.5 smoothing time constant, 5-vowel formant-frequency-range estimation (Aa, Ih, Uh, Ee, Oh), EMA smoothing factor 0.2, RMS-driven volume gate at 0.02
   - `Dolly_OS/src/lib/vrmBlendShapeController.ts` — emotion + vowel application via VRMExpressionPresetName
   - `Dolly_OS/src/lib/VRMAnimation/` — animation library
   - `Dolly_OS/src/components/aura/`, `aura-vrm-parts/`, `aura_vtuber/` (with `AuraStage.tsx`, `AuraVTuber.tsx`, `AuraProtocolAgents.tsx`, `chatBackend.ts`, `kokoroWorker.ts`)
   - `Dolly_OS/src/systems/nanny/voiceStore.ts` — small but precise voice config store

3. **Hardware bridges** (in user memory, code at):
   - **Leap Motion bridge** — `tools/leap-bridge/server.py` on `ws://localhost:6969`, gesture detection (pinch, grab, point, thumbs_up)
   - **NDI bridge** — `tools/ndi-bridge/server.py` on `ws://localhost:5959` (phone cameras via NDI HX Camera app)
   - **VRM AI bridge** — `webgpu-particles-library/ws_ai_bridge.py` on `ws://localhost:8000`

4. **The 300ms orientation loop** — named in user memory; not literally in the code I read, likely lives in the speech-broker layer (voice activity detection + head-turn decision toward speaker). The actual lip-sync loop runs much faster (per-frame, AnalyserNode rate).

5. **The chrono-protocol prototype's SYSTEM_INSTRUCTION** — the authoritative voice spec for Aura:
   > AURA: The Architect. Maternal, regal, calm. Uses "We", "The Protocol".

   And the LongCat-AudioDiT-1B note in `ARCHITECTURE_AURA.md`: "SOTA diffusion TTS with zero-shot voice cloning."

### What article(s) should ship

**`articles/aura-the-body`** (Class A #6) — the main piece. ~2200w.

Structure proposal:

1. **The name and the body.** Aura is the studio narrator. She also has a body. The body is a VRM file. (`Dolly_OS/src/components/AuraVRM.tsx` + `apps/aura-vrm/`)
2. **The face.** Five vowel formants. Five blend-shapes. Lip-sync runs an AnalyserNode at the audio context rate, RMS-gated, EMA-smoothed at 0.2. Mouth follows voice with a one-or-two-frame delay.
3. **The voice.** Two backends, currently. Kokoro for local (free, no cloud, runs in a worker). LongCat-AudioDiT-1B for high fidelity (remote, voice-cloned). The choice is per-deployment.
4. **The orientation loop.** Every 300ms, the system checks: is voice happening? whose? where should Aura's head be? This is separate from lip-sync (which is per-frame) and from emotion (which is per-utterance).
5. **The idle life.** When she isn't speaking, she isn't motionless. Blinks. Micro-movements. The `idleLifeSlice` runs whatever-doesn't-look-dead-but-isn't-distracting.
6. **The wardrobe.** Texture swap on the VRM. The studio has multiple wardrobe states canonised (academy persona "v9 Charm School Edition" — but **that's the private surface; in the public register Aura is the calm/regal narrator, not the deportment-academy character**). Stay on the public side.
7. **The protocol — when Aura speaks on the site.** She narrates the chrono-protocol article. She might one day narrate `/play/neo-london`. She is the voice that holds the cast — Yow (kinetic/cynical), Purp (chaotic/youthful), Aura (calm/regal). Trio, not solo.
8. **What the body is not.** Not a character. Not a person. Not a substitute for the studio's voice. The studio's voice is Dimona. Aura's job is to hold the world — to be the in-game narrator, the system voice, the door that opens onto the story. The distinction is structural and the article should name it once and move on.

**Register**: Dimona names the architecture (matter-of-fact, technical). Aura gets one paragraph in her own voice — the regal/calm/We register from the chrono-protocol SYSTEM_INSTRUCTION. Maybe the final paragraph.

**Route**: `/articles/aura-the-body`. Don't make `/aura` a top-level route yet — that requires a viewer surface (an embedded VRM corner) which `docs/MINED.md` has already queued. When that ships, point `/aura` at it and link out from this article. For now, the article is enough.

Companion piece: maybe a `stack/the-aura-body` entry in `lib/stack.ts` for the architectural-page register.

---

## 9. Chrono-Protocol cross-walk

A parallel agent is writing the bridge article. The Hangar prototype at `apps/prototypes/neo-london-chrono-protocol/` has these load-bearing details that should feed the article and downstream site work:

### Voice / characters (authoritative)

From `services/geminiService.ts` `SYSTEM_INSTRUCTION`:
- **AURA** — The Architect. Maternal, regal, calm. Uses "We", "The Protocol".
- **YOW** (Yellow `#FFCC00`) — The Elder Construct. Cynical, paranoid, autistic-coded. Sees patterns and dangers others miss. Hates grime/glitches.
- **PURP** (Purple `#9900FF`) — The Youth Construct. Chaotic, ADHD-coded, thrill-seeker. Loves speed, graffiti, and noise.

Emotion enum: `neutral`, `happy`, `angry`, `fear`, `excited`.

Rules in the instruction:
- speed > 1.5 → Purp excited, Yow scared
- health < 3 → Yow panics
- < 15 words per message
- output is JSON array of `{speaker, text, emotion}`

### Telemetry-driven banter

`App.tsx` runs a 12-second interval. On each tick, 40% probability of generating banter from telemetry: `{speed, health, combo (= score/100), phase, lastEvent}`. Random events injected for flavour: `PACKET_LOSS`, `GLITCH_DETECTED`, `FIREWALL_APPROACHING`, `SMOOTH_SAILING`.

### Modes (PoiMode enum)

- **AMBER** — Kinetic / Speed (Yow's domain)
- **CRIMSON** — Force / Attack
- **AZURE** — Flow / Slow-mo
- **VERIDIAN** — Logic / Hacking (Purp's domain)

Colour palette in `constants.ts`:
- AMBER `#FFCC00` (Yow's Yellow)
- CRIMSON `#FF0033` (Attack Red)
- AZURE `#00FFFF` (Flow Cyan)
- VERIDIAN `#9900FF` (Purp's Purple, "Mapped to Veridian/Logic for this build")
- VOID `#050505`
- GRID `#2A2A2A`
- AURA `#FFF5CC` (off-white-cream)

### Zones

- **Leake St. Arches** — "The Safehouse" — Tutorial
- **The Royal Mile** — "Trafalgar → Regent St" — Normal
- **Soho Grid** — "Carnaby Data Stream" — Hard

### World geometry

`World.tsx` and `Poi.tsx`:
- `TUNNEL_SPEED = 12` units/second
- 40 instanced arch ribs recycling on a 100-unit forward tunnel
- Pendulum physics on each Poi: gravity + spring tension + air damping + Euler integration + delta cap for lag-spike survival
- Persistence-of-vision trail behind each Poi head

### Game state

`GameState` enum: `BOOT`, `HUB`, `RUN`, `CREATIVE`, `GAME_OVER`.

CREATIVE mode is wired but `onCreative={() => {}}` in `App.tsx` — it's a placeholder route, not yet implemented.

### What this enables on the site

The chrono-protocol article currently in flight should:
- Quote constants by name (`TUNNEL_SPEED = 12`, zone strings as-they-are)
- Describe the Aura/Yow/Purp trio architecturally, **never quote runtime-generated dialogue**
- Name the 12-second banter interval and the 40% probability gate
- Treat CREATIVE mode as "coming, not shipped"

Downstream future site work:
- `/play/neo-london` page geography should match the three zones
- The chrono-protocol prototype could be embedded as a WebXR demo on the site at some future tier-gated `/play/chrono-protocol-demo`
- The voice register for Aura/Yow/Purp on the site (in `lib/aura/prompts.ts`) **must match** the SYSTEM_INSTRUCTION — single source of truth
- The five splat zones are the first **three** captured (Leake / Royal Mile / Soho); the SHARP pipeline catalogue at `docs/SHARP_PIPELINE.md` should reflect this priority

---

## 10. Skipped / private

The following Hangar content was surveyed but **should not be harvested for public site material** (or only with heavy reframing). Reasons named.

### The Charming Academy lore — almost entirely private

`D:\The_Hangar\Dolly_OS\public\docs\The_Charming_Academy\` — ~40 chapter files. These are the studio's internal lore:
- Aura as a Living Governor (Nanny/Penny/Baby cast)
- Deportment, Etiquette, Tea Service Sacraments, The Art of the Seam, Mirror Protocol
- The 200-Day Elegance Transformation
- The 24-Month Maturation Cycle
- LLAVA Somatic Audit Prompts
- The Matriarchal Matrix
- Vocational Syllabus
- Dressing Room Rituals
- Phonetic Purity, Vocal Habit Calibration
- Behavioural Constraint Architecture

**Why private**: These use teacher/pupil/nanny/governess framing for what is actually a system-internal coaching agent. The vocabulary is fine for internal architecture. The vocabulary is wrong for Dimona's public register, which is consistently *self-taught* and *matter-of-fact*. Surfacing this material publicly would (a) contradict the self-taught invariant the user explicitly flagged, (b) bring nursery / governess register into the studio voice, (c) confuse the public Aura (calm/regal narrator) with the private Aura (deportment-coaching agent).

**Exceptions** — single threads that could be reframed and surfaced:
- `28_Visual_Generation_Patterns.md` — could become an article about ComfyUI prompting patterns, **stripping all academy framing**.
- `34_Wall_Art_Engine_3D_Fabrication.md` — could be folded into the existing `belt-printed-wall-reliefs` article or `holoflow-mesh-studio` architecture material.
- `35_Sears_Archive_Technical_Implementation.md` — could become a tutorial on 2D-catalogue-to-3D-mesh reconstruction, again **stripping all Sears/academy framing**.
- `ACADEMY_SOUNDSCAPE_GENERATION.md` — could become an article on procedural ambient audio for installations, again **stripped**.

**Rule**: when in doubt, leave private. The user's prior harvest correctly flagged this; the present pass confirms the call.

### Operational / commercial documents

- `BUSINESS_PLAN.md` — only the **reprint economics** and **three-tier pricing** (Class A #14) is suitable for public. Revenue targets, weekly throughput math, gross margin breakdown — keep private.
- `MARKET_RESEARCH.md` — competitive intel; private.
- `COMPETITIVE_LANDSCAPE.md` §XV (Threat Assessment) and §XVI (Opportunity Map) — private. The rest of `COMPETITIVE_LANDSCAPE.md` could feed Class A "secondary tier" if a generous "who's adjacent" piece is written.

### Internal infrastructure / runbooks

- `HANGAR.md`, `PIPELINES.md`, `CLAUDE.md`, `AGENTS.md`, `BOOT_UNIFIED.ps1`, `HEARTBEAT.md`, session-handover logs, `STATUS.ps1` — private. Operational state, not voice material.
- `MIGRATION_FROM_AURA_BROKKEN.md`, `SESSION_HANDOVER_*.md`, `INTERNALISATION_MANIFEST.md` — private. Migration logs.
- `aura-upgraded-but-brokken-main/` — **explicitly named "brokken"** in the user memory's MIGRATION_FROM_AURA_BROKKEN doc. Source-of-truth for what NOT to repeat. Private.
- `Vtuber/`, `agent-town-main.zip`, `claude-code-source-build-master.zip`, `comfy_shunt.zip`, all ZIPs — private dev archives.

### Skills directories

The `.agent/skills/` directories have 60+ skill files. Most are tool-coupling protocols ("when you call X tool, do Y"). Not voice material. The exceptions named in Class A secondary tier (`waveguide-jewelry`, `holoflow-photo-to-sculpture-chain`, etc.) carry publishable summaries.

### Sub-teen / Wardrobe / Junior-Miss surfaces

`D:\The_Hangar\References_DO_NOT_EDIT_OR_CHANGE\WARDROBE_ARCHIVE_JUNIOR_MISS.md`, the wardrobe stuff in academy docs, `apps/sub-teen-wardrobe/`. Explicit directory naming (`References_DO_NOT_EDIT_OR_CHANGE`) confirms private. No publishable thread. Skip entirely.

### The Charming Academy character profiles

Aura v9 Charm School Edition imagery (`Dolly_OS/docs/academy/persona_evolution_gallery.md`), Marcel Fontaine, Theodore, Penny Draper, Agent Baby, the Sears matriarch profiles — private. The site's Aura is a different surface from these and should remain so.

### The Hangar app inventory

The `apps/` directory has 48 apps (`360-studio`, `agent-town`, `aura-pwa`, `aura-vrm`, `charming-academy`, `claw-code-main`, `claw-empire`, `clothing-reverse-engineer`, `comfy-layered-ai-ui`, `console`, `core-dashboard`, `dashboard`, `discord-bot`, `experiments`, `gemini-co-drawing`, `goose-ui-digest-graph`, `goose-ui-monorepo`, `hangar-dashboard`, `hanger-agency`, `holoflow-mesh-studio`, `lattice-browser`, `leap-bridge`, `lightpainting-forge`, `linkedin-ghostwriter`, `local-chat-vrm`, `penny-kernel`, `pixel-academy`, `pixel-agents-local`, `portfolio`, `production`, `prototypes` [73 subdirs], `remotion`, `revenue-dashboard`, `sculpture-gallery`, `see-through`, `silk-brush-canvas`, `sprite-designer`, `stitch-mcp`, `sub-teen-wardrobe`, `swarm-bridge-ui`, `unified-chat-demo-react`, `unified-dashboard`, `unified-tui`, `vr-sculpting-demo`, `waveguide-forge`) plus 73 prototypes. **The vast majority are internal tooling** (dashboards, agent runners, console UIs, chat demos) and are not publishable. The pieces that *are* publishable are named in §1 inventory and §2 Class A.

---

## Closing notes / register reminders

1. **Five airframes when the fleet comes up** — locked. C1 is the most concrete reconciliation in this document and the easiest to fix.

2. **Self-taught invariant** — locked. Whenever harvesting from academy / nanny / governor material, the register must be rewritten to *self-taught*. No teacher figures. Aura is a collaborator, not a tutor.

3. **Disability + trans frame** — matter-of-fact, "ho hum," named once. Already correctly placed in `articles/art-as-door-five-layers` and `articles/ungrounded`. Don't re-litigate it when harvesting Hangar canon. Once is enough.

4. **The Aura voice question** — Kokoro local + LongCat remote, **two backends**, not three. ElevenLabs in user memory may be aspirational. Stay conservative until the user clarifies.

5. **The 300ms orientation loop** — name it as the *speech-and-attention* loop, not the lip-sync loop (which runs much faster, per audio frame). Two loops, two periods. Don't conflate.

6. **Generation 40 might be more interesting than generation 4** — the closing line from `EVOLUTION_ENGINE.md` and the breeding article. Worth preserving as a recurring tag across the breeding/evolution suite of articles. The wildcards keep the door open.

7. **The atelier underneath the products** — the most overdue site material in the entire Hangar is the jewellery algorithm catalogue (Class A #4 and §6). It is the highest unique-to-the-bench artefact and the easiest to translate. Top priority for the next harvest pass.

8. **The morphing essay** (Class A #9, §7) — second priority. It unifies a vocabulary the studio uses casually and readers cannot reconcile across articles.

9. **The Aura body article** (Class A #6, §8) — third priority. The narrator has an implementation; surface it once, point future content at it.

10. **MINED.md** — `D:\.github\_3DPOV\docs\MINED.md` already has a mining queue. This document extends and operationalises it. The aura-companion, sculpture-gallery (mesh viewer), 360-studio (sphere viewer), and Aura bridges named in MINED.md's queue map cleanly to the Class A items here. The next harvest agent should reconcile MINED.md against this document and ship the top 3–5 Class A pieces with full text.

---

*End of HANGAR_RECONCILIATION. 2026-05-13. Read-only survey. No site files were modified.*
