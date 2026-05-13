# HANGAR_TECHNICAL_SURVEY — what the bench knows that the site does not yet say

A read-only survey of `D:\The_Hangar\` for everything mathematical, physical, computational, mesh-related, array-related, and research-grounded. The lens throughout: **what could a visitor who is not the studio owner learn from, build from, buy from, or reproduce from this content?**

Sibling agent is running the narrative-and-canon survey in parallel; this one is the technical track only.

Cross-referenced against `D:\.github\_3DPOV\` to flag overlap with what is already on the site.

---

## 0. Inventory summary — what was surveyed

| Surface | Path | Type | Count | Note |
|---|---|---|---:|---|
| Poi Sculptor docs | `D:\The_Hangar\apps\prototypes\poi-sculptor\docs\` | Markdown | 16 | Includes `PHYSICS_AND_OPTICS.md` (827 lines, 17 sections + appendix of 14 key equations), `EVOLUTION_ENGINE.md` (1002 lines), `ANIMATION_PIPELINE.md` (791 lines), `CONVERGENCE_ARCHITECTURE.md` (517 lines), `THE_LIVING_STAGE.md`, `METHODOLOGY.md`, `THE_ENGINE_CODEX.md` parts 1 + 2, `CODE_AND_PATTERN_EXTRACTIONS.md`, `BUSINESS_PLAN.md`, `COMPETITIVE_LANDSCAPE.md`, `MARKET_RESEARCH.md`, `PRODUCT_CATALOG.md`, `HANGAR_INTEGRATION_THREAD.md`, `PROJECT_MANIFESTO.md` |
| Poi Sculptor source | `D:\The_Hangar\apps\prototypes\poi-sculptor\` | Python + JS + HTML | ~60 files | Includes `gyroid_waveguide_501.py` (Blender 5.0.1 SDF Grid pipeline), `gyroid_waveguide_v2.py`, `BiomimeticBuilders.js`, `choreography_engine.js`, `meld-engine.js`, `compositor.py`, `tpms-raymarcher.html`, `the-shape-of-it.html` (+ threaded/cast/threads variants), `volumetric-cross-sections.html`, `biomimetic-atlas.html`, `waveguide-atlas.html`, `geonodes_visualizer.html`, `brush-engine.html`, `leap_trails_live.py`, `poi_trails_live.py`, `array_render.py`, `trail_meld.py`, `finger_sweep.py`, `render_biomimetic.py`, `generate_grouped_biomimetic.py` |
| Lightpainting Forge | `D:\The_Hangar\apps\lightpainting-forge\src\` | TypeScript | 11 | Frontend: `marching.ts`, `mc-tables.ts`, `maskToVoxels.ts`, `maskAndDepthToField.ts`, `depth-client.ts`, `sam2-client.ts`, `SegmentationCanvas.tsx`, `exportGlb.ts`. Pure-TS marching-cubes implementation, mask + monocular-depth → 3D field → mesh. |
| Lightpainting Forge backend | `D:\The_Hangar\tools\lightpainting-forge-backend\` | Python | 2 | `depth.py` (Depth-Anything-V2 ONNX), `server.py`. |
| Waveguide Forge | `D:\The_Hangar\apps\waveguide-forge\src\` | TypeScript + GLSL | 7 | `caustic.glsl.ts` (raymarched caustic shader, 4-light area + gyroid SDF + sampler3D), `webgpu-photonmap.ts` (WebGPU TSL photon-map kernel), `sdf-loader.ts`. |
| Sculpture Gallery | `D:\The_Hangar\apps\sculpture-gallery\src\` | TypeScript | 6 | `marching.ts`, `mc-tables.ts`, `voxels.ts`, `npy.ts`, `exportGlb.ts`, `SculptureSidebar.tsx`. |
| Neo-London Chrono-Protocol | `D:\The_Hangar\apps\prototypes\neo-london-chrono-protocol\` | TypeScript | ~10 | `World.tsx`, `Poi.tsx`, `HUD.tsx`, `GameScene.tsx`, `Hub.tsx`, `constants.ts`, `types.ts`, `services/geminiService.ts`. Tunnel-race/poi-spin game. |
| DollyOS jewel-array | `D:\The_Hangar\Dolly_OS\src\systems\jewel-array\` | TypeScript | ~50 | 32 algorithms in `geometry/algorithms/` (Spiral, Gyroid, L-System, Auxetic, Fermat, DLA, Voronoi, Geodesic, Celtic, Swept, PCB, Gear, SkullSDF, WingVenation, Penrose, ReactionDiffusion, Tensegrity, Sigil, TorusKnot, Step-Fret, Interlace, Mon, NonEuclidean, Wigner-Seitz, Spinodal, RibbonHelix, Enneper, DiatomHex, Clash compositor, etc), plus `AestheticScorer.ts`, `PrintabilityGate.ts`, `WallEnforcer.ts`, `FamilyTaxonomy.ts`. |
| Tools | `D:\The_Hangar\tools\` | Python + assorted | 22 | `AutoSeg-SAM2`, `InstantMesh`, `Unique3D`, `azure-kinect-py`, `mesh-to-sdf`, `mesh-voxelization`, `nii2mesh`, `rembg-desktop`, `softxels`, `voxel2mesh`, `webgpu-marching-cubes`, `audio-reactive-led-strip`, `aubio-beat-osc`, `lithophane`, `image-to-stl`, `astro-stacker`, `pixeldetector`, `pixelorama-kcentroid`, `blender-mcp-legacy`, `vmagicmirror`, `lightpainting-forge-backend`, `Image-to-Pixel`. |
| Leap bridge | `D:\The_Hangar\apps\leap-bridge\` | Python | bindings + examples | `examples/gesture_watcher.py`, `leapc-bindings/`, server scripts. Hand tracking at 27 DOF per hand into the parametric mesh generator. |
| Hangar root | `D:\The_Hangar\` | Mixed | many | Blender array files (`2x4biomimeticarray.blend`, `4x4arraybiomimetic.blend`), `build_sculpture.py`, `animate_awesome.py`, `Azure_Kinect_py/`, MCP swarm directories. |
| Site (cross-reference) | `D:\.github\_3DPOV\` | TS/TSX | 29 articles + 7 tutorials + 8 journal entries + 8 routes (`/play`, `/learn`, `/practice`, `/the-loop`, `/bezel`, `/sphere`, `/stack`, `/bureau`, `/aerial`, `/rookery`, etc.) | `lib/articles.tsx`, `lib/tutorials.tsx`, `lib/curriculum.ts`, `lib/loop.ts`, `lib/three-d.ts`. |

**Headline totals:**
- ~16 markdown technical/architecture documents in `poi-sculptor/docs/` alone.
- ~32 generative geometry algorithms instantiated as TypeScript classes in `jewel-array/geometry/algorithms/`.
- Three independent marching-cubes implementations (pure TS in `lightpainting-forge` and `sculpture-gallery`, WebGPU compute in `tools/webgpu-marching-cubes`, Blender VDB-native in `gyroid_waveguide_501.py`).
- Two independent caustic-lens implementations (raymarched GLSL in `waveguide-forge/src/caustic.glsl.ts` and TSL WebGPU photon-map in `webgpu-photonmap.ts`).
- One complete monocular-depth-to-sculpture pipeline (Depth-Anything-V2 ONNX + mask + voxel field + marching cubes + GLB export).
- One full Blender 5.0.1 native gyroid SDF pipeline using the new Field-to-Grid / SDF-Grid-Boolean / Grid-to-Mesh nodes.

---

## 1. Class T-A — new technical content (Hangar has it; site has nothing)

The site has prose pieces about phenomena. The Hangar has the derivations, the tables, and the code. The pieces below are the gaps where the site says nothing and the Hangar says quite a lot.

| # | Proposed title | Hangar source | Proposed site location | Register | Length | Key content |
|---|---|---|---|---|---:|---|
| 1 | **Critical angle for a resin-air interface (the 41.8° number)** | `PHYSICS_AND_OPTICS.md` §III–IV + Appendix | `/articles/critical-angle-and-the-waveguide` | Maker | 1200w | `θc = arcsin(n₂/n₁)`. For n=1.50 resin → 41.8°. Why this is the design rule for every waveguide channel on the bench. The minimum-bend-radius derivation `R_min ≈ r / (1 − sinθc)` worked through for r = 1 mm. Companion to existing `colour-without-pigment` and `why-the-pendant-glows-from-the-inside`. |
| 2 | **The five sculpture types — what each is doing optically** | `PHYSICS_AND_OPTICS.md` §VI–XI + `CONVERGENCE_ARCHITECTURE.md` §III | `/articles/the-five-sculpture-types` | Maker | 1500w | Gyroid Shell (TIR + scattering colour), Turing-RD (frustrated TIR through surface roughness), WGM Triquetra (guided-wave torus + escape features), Ctenophore (chirped diffraction grating, 38–500 µm pitch), Slime Mould (Physarum-derived Murray's-Law network). One paragraph per type with the governing equation. |
| 3 | **The Gray-Scott reaction-diffusion sculpture pattern** | `PHYSICS_AND_OPTICS.md` §XIII + `CONVERGENCE_ARCHITECTURE.md` §3B + `ANIMATION_PIPELINE.md` | `/articles/the-pattern-the-resin-grows` | Maker | 1200w | The two coupled PDEs, the F/k parameter table (ripples / spots / labyrinth / holes / mitosis), how the studio seeds initial conditions from poi velocity field, the `scipy.ndimage.laplace` implementation, and the optical consequence (rough = bright, smooth = dark). |
| 4 | **Murray's Law and the slime-mould waveguide** | `PHYSICS_AND_OPTICS.md` §XIV + `CONVERGENCE_ARCHITECTURE.md` §3A type 5 | `/articles/branching-by-murrays-law` | Maker | 1100w | `r_parent³ = r_child1³ + r_child2³`. Hagen-Poiseuille flow. Why blood vessels, river deltas, and the waveguide bench all branch the same way. The 20-line Python that turns a Physarum graph into a printable mesh with Murray-correct radii. |
| 5 | **Thin-film interference (and why the studio cannot quite print it yet)** | `PHYSICS_AND_OPTICS.md` §VII | `/articles/thin-film-the-thing-the-bench-cannot-quite-print` | Maker | 900w | `2·n·d·cos(θ) = (m+½)·λ`. The thickness-to-colour table (67 nm = violet, 108 nm = red). The honest-to-the-bone admission: the printer is at 10 µm layer height, this is 0.005 elements at the wavelength scale, so the studio simulates it in Blender's Principled BSDF instead. The Blender code snippet for the Thin Film Thickness input is in `PHYSICS_AND_OPTICS.md` §VII. |
| 6 | **The gyroid is the surface that bees and butterflies and the bench all use** | `PHYSICS_AND_OPTICS.md` §IX + `gyroid_waveguide_501.py` + `algo_02_Gyroid.ts` | `/articles/the-gyroid-three-implementations` | Maker | 1500w | `sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = 0`. Three implementations from the bench: Three.js ParametricGeometry (the `algo_02_Gyroid.ts` version, fast, web-real-time, an approximation), Blender 5.0.1 SDF-Grid-native (`gyroid_waveguide_501.py`, print-grade, with adjustable wall thickness, channel diameter, and curl-noise advection), and the implicit-surface version in `tpms-raymarcher.html` (the raymarcher in the browser, exact). When to reach for which. |
| 7 | **Diffraction at printable scales — what the rainbow on a 38 µm grating actually looks like** | `PHYSICS_AND_OPTICS.md` §VIII | `/articles/diffraction-at-the-bench-limit` | Maker | 1000w | `d·sin(θ_m) = m·λ`. The chirped-grating math (`d(x) = d₀ + α·x`), the angle table at d = 38 µm / 100 µm / 200 µm for violet/green/red. The honest disclaimer: the first-order angle for visible light at the bench's pitch limit is 0.6–1.1°, which is *subtle* — and the design rule (use grazing incidence; orient ridges perpendicular to viewing). |
| 8 | **The moiré shell — twisted bilayer photonic crystal at the room scale** | `PHYSICS_AND_OPTICS.md` §X + `CONVERGENCE_ARCHITECTURE.md` §4C | `/articles/the-moire-shell` | Maker | 1100w | `P_moiré = a / (2·sin(θ/2))`. Two concentric printed shells with hex-hole patterns, inner twisted 1.89° relative to outer, gives a moiré superlattice with 60.8 mm period — a constellation of bright spots that walks around the sculpture as the viewer walks around it. Worked example with a = 2 mm. The "photonic magic angle" is the same maths as twisted bilayer graphene; the studio uses it for art. |
| 9 | **From a long exposure to a 3D field — the actual algorithm** | `lightpainting-forge/src/maskAndDepthToField.ts` + `maskToVoxels.ts` + `depth.py` | `/tutorials/photograph-to-voxel-field` | Maker | 1500w | The mask-alpha into a 3D scalar field, the Depth-Anything-V2 monocular depth pass, the bilinear depth sample, the per-pixel slab profile, the smooth falloff so marching cubes produces rounded boundaries rather than slabs, the `depthConfidence` blend between flat-extrusion and full-depth modes. Companion to existing `from-photograph-to-object` tutorial — that one is the prose, this one is the algorithm. |
| 10 | **Marching cubes from scratch — 100 lines of TypeScript** | `lightpainting-forge/src/marching.ts` + `mc-tables.ts` | `/tutorials/marching-cubes-from-scratch` | Maker | 1400w | The 256-entry triangle lookup table, the 12-edge cube traversal, the iso-surface interpolation (`t = (iso − va) / (vb − va)`), the flat-normal computation. Walks through the studio's actual production code — pure TypeScript, no GPU. Notes when to swap in `softxels` or `webgpu-marching-cubes` for performance. |
| 11 | **The Blender 5.0.1 SDF-Grid pipeline (Field to Grid → SDF Grid Boolean → Grid to Mesh)** | `gyroid_waveguide_501.py` (full 600-line script) | `/tutorials/blender-501-sdf-grid-pipeline` | Maker | 2000w | The "what changed in Blender 5.0.1" piece. Old (4.x): Subdivide → Delete Geometry → Points to Volume → Volume to Mesh → Mesh Boolean. New (5.0.1): Field to Grid → SDF Grid Boolean → Grid to Mesh. Why the new pipeline is order-of-magnitude faster, why advect-grid lets the studio bend a gyroid by curl noise without resampling, and how the Closure Zone wires let a user swap in Schwarz-P or Diamond surfaces by changing one node. |
| 12 | **The fitness function and the printability gate** | `Dolly_OS/src/systems/jewel-array/scoring/AestheticScorer.ts` + `validation/PrintabilityGate.ts` | `/articles/scoring-five-axes` | Maker | 1100w | Five axes — printability, waveguide-readiness, elegance, novelty, wit — each 0–100. Printability is a hard gate (≥ 60 or rejected). Volume range 0.1–15 cm³. Vertex range 100–500k. Density adds to printability. The actual lookup sets the studio uses (`WAVEGUIDE_ROOTS = {2, 9, 16, 26, 29, 30}`). |
| 13 | **The 32 algorithms in the jewel array** | `Dolly_OS/src/systems/jewel-array/geometry/algorithms/*.ts` (32 files) | `/articles/the-algorithm-cabinet` | Maker | 1700w | The full list: Spiral, Gyroid SDF, L-System, Auxetic, Auxetic Corrugation, Fermat Spiral, DLA, Voronoi, L-System Tube, Geodesic Spines, Celtic Knot, Swept Sinuous, PCB Trace, Gear, Skull SDF, Wing Venation, Penrose Tiling, Reaction Diffusion, Tensegrity, Sigil, Torus Knot, Step Fret, Interlace, Mon, Clash Compositor, Non-Euclidean, Wigner-Seitz, Spinodal, Ribbon Helix, Enneper Minimal Surface, Diatom Hex. One line each. Why this is a cabinet, not a menu. |
| 14 | **The librosa analysis the music goes through** | `ANIMATION_PIPELINE.md` §II + `EVOLUTION_ENGINE.md` §VIII | `/articles/the-music-the-sculpture-listens-to` | Maker | 1300w | What gets pulled out of a track: BPM and beat grid, onset envelope, mel-spectrogram, spectral centroid, spectral bandwidth, chromagram, RMS energy, zero-crossing rate, segment boundaries, harmonic/percussive separation. Then the mapping table: spectral centroid → grating pitch (high frequency = fine grating = blue shift), RMS → emission intensity, chroma → LED colour, zero-crossing rate → surface roughness. |
| 15 | **The Laban Effort dial as a four-number genome** | `THE_LIVING_STAGE.md` §II + `CONVERGENCE_ARCHITECTURE.md` §II | `/articles/laban-as-genome` | Maker | 1300w | Weight (strong↔light), Space (direct↔indirect), Time (sudden↔sustained), Flow (free↔bound). Each in [0,1]. The kinematic proxies the studio extracts from the motion data: `W = mean(|a|)/max(|a|)`, `S = displacement/path_length`, `T = std(v)/mean(v)`, `F = 1 − mean(|da/dt|)/max(|da/dt|)`. Why these four numbers are the "flirt dial" of the choreography engine. |
| 16 | **The poi-trail capture pipeline (Leap Motion + Azure Kinect + IMU)** | `poi-sculptor/leap_trails_live.py` + `poi_trails_live.py` + `Azure_Kinect_py/` + `apps/leap-bridge/` | `/tutorials/capturing-a-poi-trail` | Maker | 1400w | Three input modalities the bench supports. Leap Motion via the `leapc_cffi` Python bindings (27 DOF per hand). Azure Kinect for full-body. IMU on the poi head for ground truth. The temporal-smoothing equation `poi_smooth(t) = Σ w_k · poi_raw(t+k)` from `CONVERGENCE_ARCHITECTURE.md` §III. Output: a time-series of {position, velocity, acceleration} that feeds every downstream stage. |
| 17 | **The WebGPU photon-map caustic** | `waveguide-forge/src/webgpu-photonmap.ts` | `/articles/the-second-caustic-engine` | Maker | 1500w | Why the studio has two caustic implementations. The GLSL pixel-back-march (`caustic.glsl.ts`, simple, works on WebGL, ~60fps at 4 lights × 8 samples on a 3080) and the WebGPU TSL forward photon-map (65,536 photons/frame, 512×512 photon map, atomic-add into storage buffer). When to use which. Honest disclosure of the TSL r170→r175 API drift the comments call out. |
| 18 | **The Persistence-of-Vision frame-rate-vs-angular-velocity calculation** | Implied by `programming-pov-frames.tsx` + `building-a-pov-led-rig.tsx` but not derived | `/tutorials/pov-frame-budget` | Maker | 800w | Angular sync, not time sync. For an N-pixel-wide image to land sharp at angular speed ω, the LED column-update rate must be `ω · N / (2π)` updates per revolution. Worked through for a 200-LED strip at typical poi speeds (2 rotations/sec). This is the load-bearing arithmetic behind the existing `why-i-build-my-own-rigs` argument; it currently exists as prose, not as the formula. |
| 19 | **The kinematic extraction (velocity, curvature, Fourier, Laban) from a poi path** | `CONVERGENCE_ARCHITECTURE.md` §II | `/articles/kinematic-extraction` | Maker | 1100w | Speed `v = |d(pos)/dt|`. Angular velocity `ω = v/r`. Curvature `κ = |v × a|/|v|³`. Acceleration `a = d²(pos)/dt²`. Fourier spectrum `F(f) = FFT(v(t))`. Why each derived quantity feeds a different downstream stage (curvature → wall thickness; FFT → grating chirp; petal-tip extrema → Physarum food sources). |
| 20 | **The genetic-algorithm operators (tournament selection, BLX-α crossover, Gaussian mutation, elitism + wildcards)** | `EVOLUTION_ENGINE.md` §V + §XIV + `ANIMATION_PIPELINE.md` §V | Extension to existing `/articles/how-the-studio-breeds-sculptures` | Maker | 1200w | The existing article has the breeding loop in prose. The maths companion: tournament size 3, BLX-α blend `child[i] = p1[i] + α·(p2[i] − p1[i])`, Gaussian mutation with adaptive temperature `σ = σ_base · temperature · gene_sensitivity`, 5-elite + 15-bred + 5-wildcard slot allocation, the LLM-informed crossover bias. |

---

## 2. Class T-B — depth extensions (site has the prose; Hangar has the maths)

The site already has the in-voice prose for these phenomena, but the Hangar has the derivations and numbers. Two options for each: extend the existing piece with a collapsible "the maths" section, or spin a companion `/research/<slug>` piece at a deeper register. Recommendation: **add a `/research` route** so the existing articles stay in voice and the technical depth has a separate home.

| Existing site piece | Hangar depth source | Extension option |
|---|---|---|
| `/articles/colour-without-pigment` | `PHYSICS_AND_OPTICS.md` §VI + structural-colour comparison table (Morpho, Callophrys, Ctenophore, peacock, beetle, opal — feature size + colour produced) | Add the comparison table; add the printer-resolution-budget honest disclaimer (`PHYSICS_AND_OPTICS.md` §XVII: at 19 µm XY the studio is 100× larger than the features that produce true structural colour in nature, so "what the studio CAN produce" = diffraction effects, layered interference simulation, photonic-crystal-approximation gyroid; "what it CANNOT yet" = direct butterfly-wing structural colour) |
| `/articles/why-the-pendant-glows-from-the-inside` | `PHYSICS_AND_OPTICS.md` §III–V (TIR, critical angle, Fresnel, evanescent field) | Add the evanescent-field paragraph (the "near-field leakage at ~one wavelength = ~500 nm beyond the surface is what creates the glow"); add the Fresnel-loss budget for many internal surfaces (`R = ((n₁−n₂)/(n₁+n₂))² = 4%` at normal incidence, compounded across 10 surfaces = 34% loss); add the Brewster angle (33.7° for resin–air) as a future direction with polariser films |
| `/articles/how-the-studio-breeds-sculptures` | `EVOLUTION_ENGINE.md` full doc (1002 lines) | Add the 28-parameter genome (12 form + 8 material + 4 optics + 4 waveguide), the database schema (genomes, scores, lineage, generations, renders, sessions), the Ollama model choice (Qwen 2.5 14B Q4_K_M, why not reasoning models, ~25 tok/s on RTX 3080 Ti), the render-time budget (75s per generation at preview, 5min at quality) |
| `/articles/nine-seconds-prompt-to-printable` | `lightpainting-forge` source code + `tools/lightpainting-forge-backend/` | Add the per-step time budget and the per-step algorithm name. Currently the article gives the overall thesis; the runbook depth is in the source. Step 1 = SAM2 mask (3–4s on the 3080), Step 2 = Depth-Anything-V2 ONNX (~150ms with CUDA EP), Step 3 = `maskAndDepthToField` (sub-second), Step 4 = marching cubes 64³ (sub-second on CPU), Step 5 = GLB export. |
| `/tutorials/from-photograph-to-object` | `lightpainting-forge/src/*.ts` + `gyroid_waveguide_501.py` | Add the actual algorithms used. Currently the tutorial is prose about the chain; the algorithms behind each step are unmentioned (marching cubes from scratch, Blender SDF-Grid pipeline, Murray's-Law channel routing). |
| `/tutorials/programming-pov-frames` | The frame-rate / angular-velocity arithmetic above | Add the worked calculation for the LED-strip update rate at typical poi speeds (T-A #18 above). |
| `/tutorials/building-a-pov-led-rig` | `apps/leap-bridge/` + any rig-firmware code | Possibly augment with the Hall-effect angular-sync wiring detail if the firmware is in the Hangar (search recommended; not located in this pass but Dimona's existing journal entries reference the bench source). |
| `/articles/lineage-marey-to-now` | `CONVERGENCE_ARCHITECTURE.md` §III "every competitor's maths" — the explicit list of which equation comes from which lineage (MoSculp SMPLify, Gever Navier-Stokes, Edmark golden angle, MIT gyroid, Nanoscribe Bragg, Tero/Jones Physarum, RAYFORM Monge-Ampère, JHU APL loss measurement, Karl Sims / NEAT evolution, ChoreoMaster / EDGE choreography) | Add a "the lineage in equations" footnote section — one equation per lineage. The existing piece names the people; the maths companion names the equation each contributed. |
| `/articles/the-living-stage` | `THE_LIVING_STAGE.md` (full doc) + `CONVERGENCE_ARCHITECTURE.md` §6C | The site article is the framing; the Hangar doc has the full Laban genome (Body × Effort × Shape × Space), the proxemic field math (Hall zones: intimate <0.45m, personal 0.45–1.2m, social 1.2–3.6m, public >3.6m), the nine-square stage grid with audience-relationship per zone, and the four-beat flirt sequence (Direct → Indirect → Free → Bound). Worth a deep-version companion. |
| `/articles/why-i-build-my-own-rigs` | Implied; the angular-sync principle is named but not formalised | T-A #18 covers this — promote the arithmetic into the existing article rather than spinning a new one. |
| `/articles/spiral-cognition` | `METHODOLOGY.md` §I — the explicit "spiral cognition" framing, the geometry of the spiral, the ctenophore-as-the-spiral metaphor that is structurally true (not metaphor) | The site piece is the in-voice version; the methodology doc adds the operational protocol (the SESSION_CONTEXT.md three-section template, the "what the AI should NOT do" list, what each session needs to bridge). Could be a workshop/practice article. |

---

## 3. Class T-C — interactive opportunities (the under-leveraged surfaces)

The studio has the maths; the site has the framework; the interactive layer is the missing rung. Each item below is a `/visualiser/<slug>` or `/calculator/<slug>` route where a static article could become a live demo. Implementation sketches assume the site's existing stack: Next.js App Router, React, Three.js (the site already has `lib/three-d.ts` + a `glb-viewer.tsx`), and the existing `holofoil-hypercube.tsx` / `holofoil-dice.tsx` as evidence the studio is already comfortable with three.js in pages.

| # | Concept | Technical complexity | Implementation sketch | Est. build time |
|---|---|---|---|---|
| 1 | **`/visualiser/total-internal-reflection`** — drag the angle of incidence; watch the ray refract or get trapped; the critical angle highlighted at 41.8°; refractive-index slider for air/water/resin/glass/diamond | Low | Pure 2D SVG + a hand-rolled Snell's-law function. No three.js needed. One file. Sliders for n₁ and θ₁. Animated ray. Read-out: refracted ray angle + percentage reflected (Fresnel) + critical-angle indicator. | 2 days |
| 2 | **`/visualiser/diffraction-grating`** — chirped grating pitch slider (38 µm–500 µm); incidence angle slider; wavelength selector (or "white"); output: the first-, second-, third-order diffraction angles as labelled rays, plus the colour band each angle produces under the grating equation | Low–medium | 2D SVG + the grating equation `d·sin(θ_m) = m·λ`. Optional add-on: "white light input" — fan three wavelengths (450, 550, 650 nm) and show the rainbow split angle. | 3 days |
| 3 | **`/visualiser/gyroid`** — interactive gyroid surface in the browser. Sliders for unit-cell size, wall thickness, channel-A vs channel-B tint, LED position. The TSL raymarched version | Medium | The bench already has the raymarcher (`tpms-raymarcher.html` + `algo_02_Gyroid.ts` + `caustic.glsl.ts`). Port the GLSL raymarcher into a React component using the same shader. Use a `<canvas>` + `react-three-fiber` or raw WebGL. Add a slider panel. | 5 days |
| 4 | **`/visualiser/reaction-diffusion`** — Gray-Scott RD running live in the browser. The Pearson parameter map (F vs k) as a draggable point; sliders for diffusion coefficients; canvas runs the simulation; output: the live emergent pattern | Medium | The math is in `PHYSICS_AND_OPTICS.md` §XIII as Python. Port to a WebGPU compute shader (or a fragment-shader ping-pong on WebGL 2 for compatibility). 256×256 grid runs at 60fps on integrated graphics. The parameter map alone is a strong piece — let users see which point in F-k space produces spots vs stripes vs blobs. | 5–7 days |
| 5 | **`/visualiser/marching-cubes-step-through`** — drop a 3D scalar field (or one of three presets: sphere, gyroid, mask-extrusion); step through the marching cubes algorithm voxel-by-voxel; show the 8-corner cube, the 256-entry case lookup, the triangle output | High in pedagogy, low in code | The studio already has the JS implementation in `lightpainting-forge/src/marching.ts`. Wrap the same function in a step controller that pauses after each voxel. Render the active voxel + the cube + the triangle. This is the most pedagogically valuable item on the list — there is no good interactive marching-cubes explainer on the open web. | 7 days |
| 6 | **`/calculator/poi-rig-frame-budget`** — input: LED count, target image resolution, target rotation speed (rev/s); output: required column-update rate (Hz), required Hall-sensor angular resolution, recommended Teensy clock budget | Low | Plain calculator. Spits out the load-bearing arithmetic the existing `programming-pov-frames` tutorial gestures at. Add a "this is the rig the studio uses" panel that pre-fills the numbers from the existing rig family. | 1 day |
| 7 | **`/visualiser/moire-shell`** — two concentric hex-grid shells in three.js; slider for inner-shell rotation (0°–10°); the moiré superlattice appears as bright spots; orbital camera lets the viewer walk around it | Medium | three.js + r3f. Two thinly-walled cylinders with hex-cutout textures; the moiré is real geometric overlap. The interesting reveal: at 1.89° (the photonic magic angle) the superlattice locks; at smaller/larger angles it drifts. The article in T-A #8 sits next to the visualiser. | 5 days |
| 8 | **`/visualiser/caustic-projector`** — draw a 2D shape on a canvas; click "compute lens"; the iterative height-field algorithm runs (the simplified Monge-Ampère from `CONVERGENCE_ARCHITECTURE.md` §4B); rendered output: the lens surface + the projected caustic beneath it | High | The hardest interactive on the list. The math is in `PHYSICS_AND_OPTICS.md` §XII + `CONVERGENCE_ARCHITECTURE.md` §4B. The 500-iteration optimiser runs on the CPU in a web worker. Output: a downloadable STL of the lens. This is the "Proof #1" from `CONVERGENCE_ARCHITECTURE.md` §V — making it interactive on the site IS the proof at room scale. | 10–14 days |
| 9 | **`/visualiser/laban-flirt-dial`** — four sliders (Weight, Space, Time, Flow), 0–1 each; a stick-figure mannequin animates a generic poi gesture with the effort qualities applied; below the figure, a one-line read-out names the perceived quality ("commanding", "tender", "withheld", "open") | Medium–high | The most novel of all the items because nothing like it exists on the public web. The "perceived-intimacy coefficient" formula from `THE_LIVING_STAGE.md` III gives the read-out. The figure animation can be a procedural 2D skeleton or a simple three.js mannequin with the existing VRM stack. This is a recruitment piece — people who see this will book commissions. | 10 days |
| 10 | **`/calculator/sculpture-printability-gate`** — paste an STL (or use a preset); the calculator reports the five-axis score (printability, waveguide, elegance, novelty, wit) using the same logic as `Dolly_OS/src/systems/jewel-array/scoring/AestheticScorer.ts` and the printability gate from `PrintabilityGate.ts` | Medium | The scorer is already TypeScript. Drop the file into the site's `lib/` and wrap with a UI. STL parsing handled by three-stdlib's STLLoader, vertex/face counts trivially extracted, volume computed via the divergence theorem on the mesh. A serious piece of free-tier kit for any other resin sculptor on the web. | 6 days |

**The top five by leverage** (the studio has the maths, the site has the framework, the interactive piece is the missing layer):

1. **`/visualiser/total-internal-reflection`** — fastest to build, highest pedagogical value, pairs directly with two existing articles.
2. **`/visualiser/marching-cubes-step-through`** — there is no good interactive marching-cubes explainer anywhere. The studio writes the best one.
3. **`/visualiser/laban-flirt-dial`** — the recruitment piece. No competitor has this; commissioning conversations open the moment a visitor plays with it.
4. **`/visualiser/reaction-diffusion`** — the Pearson F-k parameter map as a live exploration is genuinely lovely; pairs with future T-A #3.
5. **`/visualiser/caustic-projector`** — the "Proof #1" of the convergence architecture, made public.

---

## 4. Class T-D — saleable / kit content

Honest tagging: not every technical thing on the bench can be commercialised. The ones below are realistic. Price ranges are anchored against comparable indie maker offerings (Tindie, Adafruit, KiCad addons, Houdini HDAs, Blender markets, Patreon course pricing).

| # | What | Form | Audience | Price range | Why it sells |
|---|---|---|---|---|---|
| 1 | **The Bezel-Clip controller family** | Physical kit + the firmware that runs it | VR/light-painting hobbyists who want a third controller for a tracker | £180–£280 per controller, £40 firmware-only download | Already a stated product on the site (`/bezel`). The Hangar contains the working bench. Highest-readiness saleable item. The site's existing `vr-pov-controllers-the-product` article is the sales page. |
| 2 | **POV-LED-Rig firmware as a paid download** | Source code + bench-tested config files + the Teensy bring-up runbook | Anyone trying to build a POV rig and failing in a forum thread (this audience is small but motivated; €40 is "yes, immediately") | £30–£50 one-time, or £80 with the wiring diagram and parts list | The studio already publicly takes the position that commercial rigs are wrong (`why-i-build-my-own-rigs`). The product complement is "if you also want angular sync, here is the firmware." Companion to existing `/tutorials/programming-pov-frames` and `/tutorials/building-a-pov-led-rig`. |
| 3 | **The 28-parameter sculpture genome + the renderer (cloud-hosted)** | Web service: visitor uploads a poi-trail JSON or an audio file, the cloud renders 25 candidates, returns the STLs of the chosen one | Other resin-printer hobbyists who want a unique-to-them sculpture; flow-arts performers who want a "movement-derived object" without learning the pipeline | £18 per generated STL (paid sculpture commission), £45–£90 for a printed-and-shipped piece | The infrastructure is in `EVOLUTION_ENGINE.md`. Run as `/commissions/movement-to-sculpture` on the site. The unique value proposition: the sculpture is your motion. Nobody else can sell this because nobody else has the pipeline. |
| 4 | **A Blender 5.0.1 gyroid-waveguide addon** | `.zip` Blender addon registered to the Blender market | Resin-printing makers, jewellers, architects, anyone using TPMS for engineering | £15–£25 one-time, or £8/month subscription for updates | `gyroid_waveguide_501.py` is already a complete addon-quality script. Wrap it as a panel addon, ship to the Blender market. Companion article on the site. |
| 5 | **A six-rung course: "From a long exposure to a 3D-printed waveguide sculpture"** | Six video tutorials + downloads + Discord access | Long-exposure photographers who want to make their photographs physical; resin-printer hobbyists who want a project | £180–£280 for the full course, or £30 per rung | The curriculum spine is already in `lib/curriculum.ts` (the Photography ladder). The rungs that need filming: long exposure, SAM2 masking, monocular depth, marching cubes, Blender SDF-Grid pipeline, post-cure-and-finishing. Every rung exists technically in the Hangar; they need to be filmed. The "Holoflow Loop course" is the implicit product. |
| 6 | **ICC profiles for the Canon imagePROGRAF PRO-1100 against specific papers** | Set of `.icc` files (Hahnemühle, Canson, Ilford, the studio's curated paper set) | Anyone with a PRO-1100 who is fighting their soft-proof workflow | £8–£20 per profile bundle | The existing `/tutorials/calibrating-the-imageprograf-pro-1100` is the sales page for this. The profiles themselves are bench artefacts; ship as downloads with a one-page colour-target README. |
| 7 | **A "Movement-as-Sculpture" commission product** | Bespoke commission: client sends a poi-trail capture (or visits the bench for a session), receives a one-off resin print with provenance certificate | Light painters, dancers, gift recipients of dancers, collectors | £450–£1500 per piece | The most thoughtful version. The provenance certificate (mentioned in `CONVERGENCE_ARCHITECTURE.md` §IV) is the unique-selling-proposition: the object is provably the movement of one person at one moment. Pair with the `/visualiser/laban-flirt-dial` from T-C #9 as the discovery surface. |
| 8 | **The poi-trail-to-STL pipeline as an open-source release** | GitHub repo with MIT/Apache license + the `lightpainting-forge` + `gyroid_waveguide_501.py` + a Docker-Compose for the SAM2+Depth-Anything backend | Other makers who want to extend the work; signals the studio's seriousness to potential collaborators / institutions | Free + Patreon (£6 / £12 / £25 tiers for support) | The studio's lineage piece (`on-the-shoulders-of-open-source`) is the philosophical alignment for this. Doesn't directly sell but enables every other product on this list. |

**The top three by revenue surface unlocked** (these are the ones where the path from "publish" to "first sale" is shortest):

1. **The Bezel-Clip kit** (#1). Already a stated product; needs the Hangar firmware promoted to a buyable thing.
2. **The "Movement-as-Sculpture" commission** (#7). Highest margin per unit; the only saleable item nobody else can offer; the visualisers from T-C are the discovery funnel.
3. **The six-rung Holoflow Loop course** (#5). Recurring revenue; uses the existing curriculum spine; needs filming, not bench work.

---

## 5. The maths catalogue — every formula or algorithm the studio actually uses

One line per item. Where it lives in the Hangar. Whether it's on the site. Whether it warrants its own page.

| # | Name | Formula / pseudocode | Hangar source | On site? | Page-worthy |
|---|---|---|---|---|---|
| 1 | Snell's Law | `n₁·sin(θ₁) = n₂·sin(θ₂)` | `PHYSICS_AND_OPTICS.md` §IV | No | Yes (T-A #1 covers it as critical-angle, but Snell deserves its own page) |
| 2 | Critical angle (TIR threshold) | `θ_c = arcsin(n₂/n₁)` | `PHYSICS_AND_OPTICS.md` §III | Implied in `why-the-pendant-glows-from-the-inside` | Yes (T-A #1) |
| 3 | Minimum bend radius for waveguide | `R_min ≈ r / (1 − sinθ_c)` | `PHYSICS_AND_OPTICS.md` §III | No | Yes (subsection of T-A #1) |
| 4 | Fresnel normal-incidence reflection | `R = ((n₁ − n₂)/(n₁ + n₂))²` | `PHYSICS_AND_OPTICS.md` §V | No | Yes (subsection of T-B `why-the-pendant-glows-from-the-inside`) |
| 5 | Fresnel general (s- and p-polarisation) | `R_s, R_p` with `cos(θ_i), cos(θ_t)` | `PHYSICS_AND_OPTICS.md` §V | No | Maybe — for `/research/fresnel-equations` |
| 6 | Brewster's angle | `θ_B = arctan(n₂/n₁)` | `PHYSICS_AND_OPTICS.md` §V | No | Maker-curio — sidebar in T-B `why-the-pendant-glows-from-the-inside` |
| 7 | Thin-film constructive interference | `2·n·d·cos(θ) = (m + ½)·λ` | `PHYSICS_AND_OPTICS.md` §VII | No | Yes (T-A #5) |
| 8 | Diffraction grating equation | `d·sin(θ_m) = m·λ` | `PHYSICS_AND_OPTICS.md` §VIII | No | Yes (T-A #7) |
| 9 | Chirped grating | `d(x) = d_0 + α·x` (linear); `d(v) = d_min + (d_max − d_min)·(1 − v/v_max)` (velocity-mapped) | `PHYSICS_AND_OPTICS.md` §VIII | No | Yes (subsection of T-A #7) |
| 10 | Moiré superlattice period | `P = a / (2·sin(θ/2))` | `PHYSICS_AND_OPTICS.md` §X | No | Yes (T-A #8) |
| 11 | Photonic magic angle | 1.89° for hex lattices | `PHYSICS_AND_OPTICS.md` §X | No | Maker-curio inside T-A #8 |
| 12 | WGM resonance condition | `2π·n·R = m·λ` | `PHYSICS_AND_OPTICS.md` §XI | No | Yes — companion to T-A #2 ("five types") |
| 13 | Gyroid implicit surface | `sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = 0` | `PHYSICS_AND_OPTICS.md` §IX, `algo_02_Gyroid.ts`, `gyroid_waveguide_501.py` | No | Yes (T-A #6) |
| 14 | Photonic band gap (gyroid scaling) | `λ_gap ≈ 2·n_eff·a / m` | `PHYSICS_AND_OPTICS.md` §IX | No | Sidebar in T-A #6 |
| 15 | Gray-Scott reaction-diffusion | `∂U/∂t = D_u·∇²U − UV² + F(1−U)` and `∂V/∂t = D_v·∇²V + UV² − (F+k)V` | `PHYSICS_AND_OPTICS.md` §XIII | No | Yes (T-A #3) |
| 16 | Hagen-Poiseuille tube flow | `Q = π·r⁴·ΔP / (8·η·L)` | `PHYSICS_AND_OPTICS.md` §XIV | No | Sidebar in T-A #4 |
| 17 | Murray's Law | `r_parent³ = r_child1³ + r_child2³`; equivalently `r ∝ Q^0.35` | `PHYSICS_AND_OPTICS.md` §XIV, `EVOLUTION_ENGINE.md` III | No | Yes (T-A #4) |
| 18 | Physarum adaptive conductivity | `dD_ij/dt = f(|Q_ij|) − D_ij` (Tero/Jones) | `CONVERGENCE_ARCHITECTURE.md` §3A type 5 | No | Sidebar in T-A #4 |
| 19 | Frenet-Serret swept-surface | `surface(t, φ) = poi_path(t) + r(t)·[cos(φ)·N(t) + sin(φ)·B(t)]` | `CONVERGENCE_ARCHITECTURE.md` §3A type 1 | No | Sidebar in T-A #2 |
| 20 | Phyllotactic spiral (Edmark golden angle) | `θ_n = n · 137.5077°` | `CONVERGENCE_ARCHITECTURE.md` §3A type 2 | No | Worth its own page in `/articles/the-golden-angle-on-the-bench` |
| 21 | Caustic Monge-Ampère (computed caustic lens) | `det(D²h) = f(x,y) / g(T(x,y)) · det(DT)` | `PHYSICS_AND_OPTICS.md` §XII, `CONVERGENCE_ARCHITECTURE.md` §4B | No | Yes (T-C #8 makes this interactive) |
| 22 | Marching cubes | 256-entry triangle lookup + edge interpolation `t = (iso − v_a)/(v_b − v_a)` | `lightpainting-forge/src/marching.ts`, `mc-tables.ts`, `sculpture-gallery/src/marching.ts` | Referenced in `nine-seconds-prompt-to-printable` | Yes (T-A #10 + T-C #5) |
| 23 | Monocular depth sample (Depth-Anything-V2) | Bilinear resample at 518×518 | `tools/lightpainting-forge-backend/depth.py` + `lightpainting-forge/src/maskAndDepthToField.ts` | Implied | Yes (T-A #9) |
| 24 | Mask-to-field with depth-confidence | `z_centre = c · z_depth + (1-c) · z_centre_flat`; `profile = a · (1 − dz / thickness)` | `lightpainting-forge/src/maskAndDepthToField.ts` | No | Yes (T-A #9 covers it) |
| 25 | Tournament selection (size 3) | `argmax(fitness, random.sample(pop, k=3))` | `EVOLUTION_ENGINE.md` V | No | Subsection of T-A #20 |
| 26 | Uniform crossover (gene-wise) | `child[i] = parent_a[i] if rand() < 0.5 else parent_b[i]` | `EVOLUTION_ENGINE.md` V | No | Subsection of T-A #20 |
| 27 | BLX-α crossover | `child[i] = p1[i] + α·(p2[i] − p1[i])` | `ANIMATION_PIPELINE.md` V `_breed` | No | Subsection of T-A #20 |
| 28 | Gaussian mutation with adaptive σ | `gene' = gene + N(0, σ²)`; `σ = σ_base · temperature · gene_sensitivity` | `EVOLUTION_ENGINE.md` V, `ANIMATION_PIPELINE.md` V | No | Subsection of T-A #20 |
| 29 | Laban Effort extraction | W = `mean(|a|)/max(|a|)`; S = `displacement/path_length`; T = `std(v)/mean(v)`; F = `1 − mean(|da/dt|)/max(|da/dt|)` | `CONVERGENCE_ARCHITECTURE.md` §II | No | Yes (T-A #15) |
| 30 | Curvature of a 3D path | `κ(t) = |v × a| / |v|³` | `CONVERGENCE_ARCHITECTURE.md` §II | No | Subsection of T-A #19 |
| 31 | Fourier velocity spectrum | `F(f) = FFT(v(t))` | `CONVERGENCE_ARCHITECTURE.md` §II | No | Subsection of T-A #19 |
| 32 | librosa beat-tracking | `librosa.beat.beat_track(y, sr)` | `ANIMATION_PIPELINE.md` II | No | Yes (T-A #14) |
| 33 | Mel-spectrogram + spectral centroid | `librosa.feature.spectral_centroid` | `ANIMATION_PIPELINE.md` II | No | Subsection of T-A #14 |
| 34 | Recurrence-matrix segment detection | `librosa.segment.agglomerative` | `ANIMATION_PIPELINE.md` II | No | Subsection of T-A #14 |
| 35 | Chroma → LED colour mapping | 12-note × RGB lookup | `ANIMATION_PIPELINE.md` IX | No | Subsection of T-A #14 |
| 36 | Hall-effect angular sync | implicit in rig firmware | Not located in this pass — likely in rig source not surveyed | Implied in `why-i-build-my-own-rigs` | Maybe (T-A #18 covers the maths) |
| 37 | POV column-update rate | `update_rate = ω · N_columns / (2π)` | Derived, not explicit in docs | Implied in `programming-pov-frames` | Yes (T-A #18) |

---

## 6. The meshes catalogue — every mesh-generation pipeline the bench runs

| Pipeline | Input | Output | Implementation | Currently on site? |
|---|---|---|---|---|
| **Marching cubes (CPU, pure TS)** | 3D scalar field (Float32Array of `res³`) + iso threshold | `{positions, normals}` Float32 arrays | `lightpainting-forge/src/marching.ts` (~100 lines) + `mc-tables.ts` (256-entry triangle table) | Mentioned once in `nine-seconds-prompt-to-printable`; not explained |
| **Marching cubes (WebGPU compute)** | 3D scalar field as storage buffer | Indirect-draw vertex stream | `tools/webgpu-marching-cubes/` | No |
| **Marching cubes (Blender VDB native)** | OpenVDB SDF grid | Mesh via "Grid to Mesh" node | `gyroid_waveguide_501.py` (Field→Grid→SDF Boolean→Grid→Mesh chain) | No |
| **Mask → field → mesh (2D photograph to 3D)** | 2D mask alpha image | 3D Float32 field for marching cubes | `lightpainting-forge/src/maskToVoxels.ts` (flat extrusion); upgraded by `maskAndDepthToField.ts` (per-pixel depth) | Referenced in `nine-seconds-prompt-to-printable` and `from-photograph-to-object`; algorithm not shown |
| **Monocular-depth lift** | Single RGB image | Per-pixel depth map (Depth-Anything-V2 small ONNX) | `tools/lightpainting-forge-backend/depth.py` (~150ms with CUDA EP at 518×518) | No |
| **SAM2 segmentation** | Single image + optional clicks | Per-object mask | `tools/AutoSeg-SAM2/`, `tools/lightpainting-forge-backend/server.py` | Referenced in `nine-seconds-prompt-to-printable` |
| **TripoSR single-image to mesh** | Single image | Coarse 3D mesh (cottagey output, fine for sculpture-as-archive) | `tools/InstantMesh/`, `tools/Unique3D/`, and the older TripoSR install referenced in MEMORY.md (Python 3.12, PyMCubes fallback) | Implied |
| **Hunyuan3D image → mesh** | Single image | High-quality mesh in 53s | DollyOS-skill `dollyos-comfyui-3d` referenced; ComfyUI workflow | No |
| **Blender 5.0.1 SDF-Grid gyroid** | Procedural SDF formula + advection field | Manifold mesh ready for SLA | `gyroid_waveguide_501.py` (live sliders for frequency, wall thickness, channel diameter, advection strength) | No |
| **OpenSCAD parametric waveguide channel** | Path along the photograph trace | OpenSCAD-style swept tube → SCAD → STL | Referenced in `/tutorials/from-photograph-to-object` step 4 | Mentioned, not shown |
| **Physarum network → tube mesh** | Set of "food source" points (poi petal tips) | Branching tube network with Murray-correct radii | `CONVERGENCE_ARCHITECTURE.md` §3A type 5 + `PHYSICS_AND_OPTICS.md` §XIV (~20 lines of Python in the doc) | No |
| **L-System branching** | Axiom + rewrite rules | Recursive branching geometry | `Dolly_OS/src/systems/jewel-array/geometry/algorithms/algo_03_LSystem.ts` + `algo_08_LSystemTube.ts` | No |
| **Voronoi tessellation** | Seed-point set | Cell mesh | `algo_07_Voronoi.ts` | No |
| **DLA (diffusion-limited aggregation)** | Seed + growth parameters | Fractal mesh | `algo_06_DLA.ts` | No |
| **Reaction-diffusion surface displacement** | Initial U/V field on mesh UV | Displaced surface | `algo_17_ReactionDiffusion.ts` + `PHYSICS_AND_OPTICS.md` §XIII | No |
| **Auxetic / auxetic corrugation pattern** | Re-entrant unit cell + repetition count | Negative-Poisson-ratio mesh | `algo_04_Auxetic.ts`, `algo_04_AuxeticCorrugation.ts` | No |
| **Tensegrity** | Strut + cable topology | Pre-stressed mesh | `algo_18_Tensegrity.ts` | No |
| **Wing venation pattern** | Vein-pattern parameters | Branching planar mesh | `algo_15_WingVenation.ts` | No |
| **Penrose tiling** | Vertex-set rules | Aperiodic tile mesh | `algo_16_PenroseTiling.ts` | No |
| **Wigner-Seitz cell** | Lattice points | Volumetric cell mesh | `algo_26_WignerSeitz.ts` | No |
| **Spinodal decomposition** | Initial random field + cooling rate | Bicontinuous mesh | `algo_27_Spinodal.ts` | No |
| **Enneper minimal surface** | Parametric u, v | Saddle-mesh | `algo_29_Enneper.ts` | No |
| **TPMS atlas (gyroid + Schwarz-P + Diamond + Lidinoid)** | Family selection + scale | Implicit-surface mesh | `tpms-raymarcher.html` + `waveguide-atlas.html` + `gyroid_waveguide_501.py` (Closure Zone is meant to make swapping trivial) | No |
| **Gaussian splat ingestion** | COLMAP sparse cloud → splat-trained PLY | Renderable 3D from a photograph or a CCTV grab | `tools/SHARP_PIPELINE.md` runbook in `D:\.github\_3DPOV\docs\SHARP_PIPELINE.md` (the studio-facing version), plus implied Apple SHARP local execution | The site doc exists; not a public article yet |
| **Equirectangular → 6 cube-face perspective** | Equirectangular 360 frame | Six perspective images for COLMAP / SfM | `apps/prototypes/360-camera-to-ue5-gaussian-splatting-guide/`, `SHARP_PIPELINE.md` | Site doc exists |
| **VRM blend-shape mesh** | Audio viseme estimate | Animated face mesh | `webgpu-particles-library/apps/07-aura-alive/main.js`, `webgpu-particles-library/ws_ai_bridge.py` (per MEMORY.md) | No |
| **Tip-trail-as-mesh** | Real-time hand/poi tip positions | Live ribbon mesh | `apps/prototypes/poi-sculptor/poi_trails_live.py`, `leap_trails_live.py`, `trail_meld.py`, `finger_sweep.py` | No |

---

## 7. The physics catalogue

| Phenomenon | Governing equation | Studio's use | Hangar location | Site location |
|---|---|---|---|---|
| Total Internal Reflection | `θ_c = arcsin(n₂/n₁)`; for resin → air ≈ 41.8° | Every waveguide channel relies on this; sets the minimum bend radius | `PHYSICS_AND_OPTICS.md` §III | Implied in `why-the-pendant-glows-from-the-inside` |
| Snell's Law refraction | `n₁·sinθ₁ = n₂·sinθ₂` | Every resin-air interface in every sculpture | `PHYSICS_AND_OPTICS.md` §IV | No |
| Fresnel reflection / transmission | `R_s, R_p`; for normal incidence `R = ((n₁−n₂)/(n₁+n₂))²` | Light-budget calculation across many internal surfaces; ~4% per surface compounds | `PHYSICS_AND_OPTICS.md` §V | No |
| Evanescent field | Exponential decay ~1 wavelength | "The glow" — the soft surface luminescence of a waveguide | `PHYSICS_AND_OPTICS.md` §III | Implied |
| Brewster's angle polarisation | `θ_B = arctan(n₂/n₁)` | Future direction: polariser-film over LED, viewing-angle-dependent colour | `PHYSICS_AND_OPTICS.md` §V | No |
| Thin-film interference | `2·n·d·cos(θ) = (m+½)·λ` | Simulated in Blender Principled BSDF; not yet printable | `PHYSICS_AND_OPTICS.md` §VII | No |
| Diffraction (single grating) | `d·sin(θ_m) = m·λ` | Ctenophore-type chirped gratings at 38–500 µm pitch | `PHYSICS_AND_OPTICS.md` §VIII | No |
| Photonic band gap (gyroid PC) | `λ_gap ≈ 2·n_eff·a/m` | Designed at the bench's resolution limit; not yet a true band gap, but the geometry is honest | `PHYSICS_AND_OPTICS.md` §IX | Implied in `colour-without-pigment` |
| Twisted bilayer photonic crystal | `P = a/(2·sin(θ/2))`; magic angle 1.89° | The Moiré Shell — a constellation of bright spots that walks with the viewer | `PHYSICS_AND_OPTICS.md` §X | No |
| Whispering Gallery Mode | `2π·n·R = m·λ` | Triquetra-type torus rings; at macro scale, mostly aesthetic-of-circulation | `PHYSICS_AND_OPTICS.md` §XI | No |
| Caustic envelope (geometric optics) | Monge-Ampère PDE | Caustic lens cap on sculptures projects the poi-path as light on a wall | `PHYSICS_AND_OPTICS.md` §XII, `CONVERGENCE_ARCHITECTURE.md` §4B | No |
| Gray-Scott reaction-diffusion | Two coupled non-linear PDEs (see §5 #15 above) | Surface displacement pattern; chemistry becomes optics | `PHYSICS_AND_OPTICS.md` §XIII | No |
| Hagen-Poiseuille flow | `Q = πr⁴ΔP/(8ηL)` | Physarum simulation conductivity dynamics | `PHYSICS_AND_OPTICS.md` §XIV | No |
| Murray's Law | `r_parent³ = Σ r_child³` | Waveguide network tube radii; biological optimality applied to optics | `PHYSICS_AND_OPTICS.md` §XIV | No |
| Frenet-Serret frame | Tangent/Normal/Binormal triad along a curve | Swept-surface tube generation along a poi path | `CONVERGENCE_ARCHITECTURE.md` §3A type 1 | No |
| Resin material loss | `P(x) = P_LED · η · exp(-α·L)` with `α ≈ 0.3–1.2 cm⁻¹` | Light-budget along sculpture height; informs why tall pieces need wider channels at the top | `CONVERGENCE_ARCHITECTURE.md` §4A | No |
| Persistence of vision | Frame-rate × angular velocity = column resolution | Every POV rig in the studio's fleet; angular sync not time sync | Implied across many `.md` and rig firmware | Article `why-i-build-my-own-rigs` (prose); arithmetic not shown |
| Gaussian splat covariance | 3D anisotropic Gaussian = mean + 3×3 covariance, projected to 2D | The Neo-London map's walkable splats; one image → ~10s reconstruction via Apple SHARP | `D:\.github\_3DPOV\docs\SHARP_PIPELINE.md` | Site doc exists; no public article yet |
| Photogrammetry SfM (COLMAP) | Bundle-adjustment over SIFT correspondences | 360-archive → sparse cloud → splat-training | `THE_ENGINE_CODEX.md` §10 | Site SHARP/CCTV docs |
| Marching cubes (iso-surface extraction) | 256-case lookup over 8-corner sign pattern + edge interpolation | Every voxel-to-mesh step in the studio | `lightpainting-forge/src/marching.ts` + `sculpture-gallery/src/marching.ts` | Mentioned in `nine-seconds-prompt-to-printable`; not explained |
| Monocular depth estimation | Deep network (Depth-Anything-V2 ViT-S) | Lifts a 2D long-exposure into 3D before marching cubes | `tools/lightpainting-forge-backend/depth.py` | No |

---

## 8. The arrays / linear-algebra catalogue

| Tensor / matrix operation | Where used | Studio's specific need |
|---|---|---|
| 3D scalar field `Float32Array(res³)` | `lightpainting-forge`, `sculpture-gallery`, `tpms-raymarcher.html` | The intermediate representation between "a 2D mask + depth" and "a printable mesh." Marching cubes operates on this. |
| 2D mask alpha buffer `Float32Array(res²)` | `maskToVoxels.ts`, `maskAndDepthToField.ts` | Downsample of the SAM2 output. The marching-cubes resolution is ~64³ for preview, ~256³ for print. |
| Depth map `Float32Array(width·height)` + bilinear sampler | `maskAndDepthToField.ts`, `depth.py` | Per-pixel depth Z-position for the 3D lift. Bilinearly resampled because Depth-Anything was trained at 518×518. |
| Mel-spectrogram (128 mel bins × T frames) | `ANIMATION_PIPELINE.md` II | librosa output. Used for segment-boundary detection and emission-strength keyframing. |
| Chromagram (12 pitch classes × T frames) | `ANIMATION_PIPELINE.md` II + IX | The "which note is playing" → LED colour mapping. |
| Recurrence matrix (T × T) | `ANIMATION_PIPELINE.md` II | Self-similarity matrix for verse/chorus detection (agglomerative clustering segments it). |
| 28-parameter genome `Float32Array(28)` per individual | `EVOLUTION_ENGINE.md` III | The sculpture phenotype. Crossover and mutation operate element-wise; the BLX-α blend is a pure vector operation. |
| Fitness scoring vector (5 axes × N population) | `Dolly_OS/src/systems/jewel-array/scoring/AestheticScorer.ts` | Five-axis aesthetic scoring; weighted sum into a total. |
| Laban Effort vector (4 dimensions) | `CONVERGENCE_ARCHITECTURE.md` §II | Single 4-element vector that conditions both the sculpture genome AND the choreography in the diffusion model. |
| Gray-Scott U and V fields (3D) | `PHYSICS_AND_OPTICS.md` §XIII | `scipy.ndimage.laplace` for ∇² on a regular grid; 500–2000 timesteps of explicit Euler. |
| OpenVDB sparse SDF grid | `gyroid_waveguide_501.py` | Blender 5.0.1 SDF-Grid representation. Operations: Field→Grid (evaluate), SDF Grid Boolean (subtract), SDF Grid Mean (smooth), Advect Grid (deform by curl noise), Grid→Mesh (extract). |
| Frenet-Serret frame `{T, N, B}(t)` along a curve | `CONVERGENCE_ARCHITECTURE.md` §3A type 1 | Swept-surface generation: at each parameter `t`, the cross-section circle lives in the N-B plane. |
| Photon-map storage buffer (`atomic<u32>(W × H)`) | `waveguide-forge/src/webgpu-photonmap.ts` | WebGPU TSL compute shader uses atomic-add to splat photon hits; fixed-point `INTENSITY_SHIFT = 1024` for the atomic counter. |
| 3D Gaussian splat (mean μ + covariance Σ) | Implied across the SHARP/CCTV pipeline | Each splat is 3 + 6 + 4 + 3 = 16 floats (position + cov + colour + opacity). Trained per scene; rendered by α-blended elliptical projection. |
| 256-entry MC triangle lookup table | `lightpainting-forge/src/mc-tables.ts` | Constant. The actual array. |
| 12-edge mask `EDGE_TABLE[256]` | `mc-tables.ts` | Companion to the triangle table. |
| VRM blend-shape vector (20–60 dimensions) | DollyOS systems, AuraVRM components | One scalar per blend-shape; sum-of-weighted-deltas applied to the base mesh. |
| Hand-pose skeletal data (27 DOF/hand) | `apps/leap-bridge/` | The Leap Motion output, fed into ParametricMesh generators. |
| Conv-matrix for resin attenuation `exp(-αL)` (per-wavelength) | `CONVERGENCE_ARCHITECTURE.md` §4A | Three scalars (R/G/B) become per-channel intensity at each point along a guided path. |
| Voronoi seed-point set + adjacency | `algo_07_Voronoi.ts` | n × 3 seed positions; Delaunay → Voronoi dual gives the cells. |
| L-System turtle state | `algo_03_LSystem.ts`, `algo_08_LSystemTube.ts` | Position + orientation matrix; rewrite rules applied iteratively. |

---

## 9. Skipped / internal-only — what stays inside the bench

Honest assessment: not every technical artefact belongs on the public site. The items below should stay internal, with reasons.

| Artefact | Why internal-only |
|---|---|
| `D:\The_Hangar\STATUS.ps1`, `BOOT_UNIFIED.ps1`, `START_EVERYTHING_LEGACY.ps1`, `STOP_EVERYTHING.ps1` | The cluster's daily-driver scripts. Personal infrastructure, not a public deliverable. |
| `D:\The_Hangar\HEARTBEAT.md`, `LIVE_LOG.md`, `SESSION_SUMMARY_2026-04-13.md` | Operational logs. No reader value outside the studio. |
| `D:\The_Hangar\AGENTS.md`, `UNIVERSAL_AGENT_PROTOCOL.md` | The MCP swarm protocol. Internal architectural commitment; could become a public piece eventually but not in the next site phase. |
| `D:\The_Hangar\apps\prototypes\poi-sculptor\docs\SESSION_CONTEXT.md`, `METHODOLOGY.md` §III–IV | The personal session protocol with the AI collaborator. Discussed obliquely in `spiral-cognition`; the operational version is personal. |
| `D:\The_Hangar\apps\prototypes\poi-sculptor\docs\BUSINESS_PLAN.md`, `MARKET_RESEARCH.md`, `COMPETITIVE_LANDSCAPE.md` | Commercial planning documents. Some content (the eleven-sciences mapping in `COMPETITIVE_LANDSCAPE.md`) is publishable as research; the financial planning is not. |
| Personal-life context inside `PROJECT_MANIFESTO.md` and the `THE_ENGINE_CODEX_part2.md` references to specific health events | The studio writes well about these in journal pieces but the manifesto register is private. |
| `D:\The_Hangar\agents/`, `D:\The_Hangar\brain/`, all MCP swarm directories | Internal AI plumbing. Mention in `the-familiar` is enough; the runbooks stay private. |
| `D:\The_Hangar\Productions/scheduler.log` | Operational. |
| All `_probe_*.py`, `_smoke_test.py`, `_diag.py`, `_debug_array.py` scripts in `poi-sculptor/` | Bench diagnostics. The skill of writing these is publishable (a tutorial on "how to debug your Blender MCP pipeline") but the scripts themselves are not. |
| `D:\.github\_3DPOV\docs\BACKWARDS_DESIGN.md`, `PLAY_GAME_PLAN.md` | Already private inside the site repo (not rendered). These are the curriculum-spine planning docs; keep them so. |
| The personal data in any captured poi sequence | Captures of the studio owner's body movement are inherently personal. The fact that the sculpture is provably "this person, this moment" is the artistic premise, but the raw data files are not the saleable artefact — the sculpture is. |
| Any specific commission client data | Trivial, but worth saying. |

---

## 10. Synthesis — three patterns worth naming

### Pattern 1: The Hangar has the maths, the site has the prose, the visualisers are the missing rung.

The studio has done the hard work — derived the equations, named the parameter regimes, written the code, run the simulations. The site has the in-voice prose that says "the sculpture glows because of the gyroid." Between those two registers there is an entire layer of *interactive technical illustration* that nobody on the public web is currently competing for. Five visualisers (T-C top 5) would change the site's centre of gravity from "studio diary that links to Wikipedia" to "studio diary that demonstrates its own physics." This is a multiplier effect on every existing article — `colour-without-pigment` becomes immediately more credible when it sits next to a `/visualiser/diffraction-grating`.

### Pattern 2: The eleven-science convergence is the studio's unique IP, and the site does not yet name it.

`CONVERGENCE_ARCHITECTURE.md` is 517 lines arguing that the studio passes a single captured movement through eleven separate equation systems (MoSculp temporal coherence, Edmark golden angle, MIT gyroid, Nervous System Gray-Scott, Tero/Jones Physarum, Nanoscribe Bragg, RAYFORM Monge-Ampère, JHU APL loss measurement, Karl Sims / NEAT evolution, ChoreoMaster / EDGE choreography, Laban / proxemics). Nobody else has this pipeline; nobody else can. The existing `lineage-marey-to-now` article is the public counterpart — but it names the people, not the equations. A footnote section that adds the equation each lineage contributed would convert the article from "thoughtful family tree" to "thoughtful family tree with technical receipts."

### Pattern 3: The saleable surfaces follow the visualisers, not the other way around.

The Bezel-Clip (T-D #1) is already a product; the firmware download (T-D #2) is a small near-term win; the course (T-D #5) is medium-term. But the **largest revenue surface** is the movement-as-sculpture commission (T-D #7), and the only thing standing between it and first sale is the discovery funnel. The Laban-flirt-dial visualiser (T-C #9) plus the gyroid visualiser (T-C #3) plus the caustic projector (T-C #8) are that funnel — they put the studio's actual capability in front of the visitor's hands in two minutes. Build the visualisers, the commissions follow.

---

## 11. Genuine architectural questions surfaced

A handful of bench-level decisions show up across multiple Hangar documents that the site has not yet had to answer. Naming them here in case the user wants to make the calls explicit.

1. **The CCTV / SHARP pipeline assumes one provider's source frames.** The runbook (`D:\.github\_3DPOV\docs\SHARP_PIPELINE.md`) names TfL JamCams + BBC London + "other authorised public sources." The technical work in `CONVERGENCE_ARCHITECTURE.md` and the splat-rendering library is camera-agnostic. The abstraction should be **named** as camera-agnostic from the start (the site copy currently reads as TfL-specific). One-line change in the runbook; bigger framing change in any future article about it.

2. **The gyroid implementation exists in three places** (`tpms-raymarcher.html`, `algo_02_Gyroid.ts`, `gyroid_waveguide_501.py`) and they have drifted in subtle ways — the `algo_02_Gyroid.ts` version is a parametric approximation, the raymarcher is exact, the Blender script is a marching-cubes extraction from an SDF. None of them are wrong; the user is one decision away from naming which is "the canonical studio gyroid" for any given output medium. T-A #6 is the article that names this.

3. **The choreography genome and the sculpture genome use different parameter conventions** (the choreography genome is hierarchical: performance → phrase → gesture levels, with the gesture level embedding the 28 sculpture parameters; the sculpture genome is flat). `EVOLUTION_ENGINE.md` III ends with "see THE_LIVING_STAGE.md for the full schema" but the two schemas have not been unified in code. Either is correct in isolation; both used together is a future architecture question.

4. **The evolution engine's LLM choice (Qwen 2.5 14B Q4_K_M) is justified in `EVOLUTION_ENGINE.md` §IX, but is bench-current as of the doc's date.** Models drift fast. Worth a footnote that the *function* (structured-JSON parameter reasoning, ~20s per generation) matters more than the specific weights file.

5. **The "no human in the scoring loop" path is named in `ANIMATION_PIPELINE.md` §V** (`_compute_fitness`) **and the "human in the scoring loop" path is named in `EVOLUTION_ENGINE.md` §XV.** Both exist in the bench. They are not currently named as alternatives on the site. The `how-the-studio-breeds-sculptures` article describes only the human-scored loop. The automated-fitness path is worth a paragraph because it is the path that *scales* — and the studio's "this is the saleable one" lives upstream of that decision.

6. **The TSL r170 → r175 API drift is called out honestly in `waveguide-forge/src/webgpu-photonmap.ts`.** This is the studio's voice doing the right thing in code comments — public-facing pieces about WebGPU should carry the same disclaimer. The Three.js TSL API is in motion; pieces written today will need version-pinning.

---

*Read-only survey. One file written: this one. Sibling agent has the canon and narrative track.*

*The maths is on the bench. The prose is on the site. The interactive layer is the missing rung. Build that rung.*
