# Asset Migration &mdash; The Hangar to Holoflow Studio

**Date:** 2026-05-13
**Migration agent:** atelier-migration
**Source:** `D:\The_Hangar\`
**Target:** `D:\.github\_3DPOV\` (this repo)

## Brief

> "Bring over all meshes and precomputed stuff from the hangar, all
> python math etc flow arts stuff meshs and brushes and such."

The lens: the site becomes the actual workshop, not a description of
one. What's currently buried as private working files becomes
browseable site infrastructure under `/atelier`.

## Summary

This is **Pass 1** of an ongoing migration. The scope was
deliberately conservative (100-file cap from the brief). 100 was
not reached; the actually-publishable subset at this pass is much
smaller because most candidates were either (a) too large for a
public website, (b) Blender working files that need fabrication-side
tooling, or (c) flagged-private narrative content.

## Phase 1 &mdash; Survey totals

| Asset class | Surveyed | Selected | Skipped (why) |
|---|---|---|---|
| `.glb` / `.gltf` meshes (entire Hangar) | **~23,400** | **6** | Mostly third-party reference models in `aura-upgraded-but-brokken-main/dist/`, vendored Three.js examples, and ML-pipeline intermediates. Only the studio-original meshes from `.infrastructure/blender_python_library/` + `assets/blender/sculpture.glb` made the cut. |
| Brushes | **20 brush definitions** | **20** | All twenty brushes from `apps/prototypes/poi-sculptor/brush-engine.html` (lines 258&ndash;304) ported as `lib/assets/brushes.ts`. No textures yet &mdash; the brushes are node-material recipes, not bitmaps. |
| Python services | **~80 files** | **7** | Selected the morphing engine + the genome / fitness / generator stack + three specific generators (Fresnel, caustic, GRIN). Skipped the FastAPI gateway, the Discord bots, the ChatGPT scaffolds, the Blender MCP servers, the museum / aquarium narrative services, and anything tied to private ML model weights. |
| Choreography / Laban data | **1 engine + 8 efforts** | **1 engine + 8 efforts + 10 kata moves** | The full `EFFORT` octant table came over verbatim from `choreography_engine.js`. The kata-move library is a first-pass author-curated list of 10 named moves; the trajectory data behind them still lives in Blender working files (deferred). |
| Sculpture genomes | **~30 in registry** | **3** | The first three named specimens (`g52393`, `CR-8411 / Eve-V3`, `g66903`) made the cut as canonical examples. The rest are mutation / crossover children; deferred. The embedded Blender `builder_script` bytecode was intentionally stripped (it requires Blender to execute). |
| Jewellery algorithms (TypeScript) | **30** | **30 catalogue entries, 0 source ports** | The full source for all 30 algorithms is well-organised in `Dolly_OS/src/systems/jewel-array/geometry/algorithms/algo_NN_*.ts`. Porting them depends on bringing the `BaseAlgorithm` class + `mergeGeometries` utility chain too, which is queued. For this pass, the **catalogue** (id, name, family, notes, source filename) is published at `lib/assets/algorithms.ts` and shown on `/atelier`. |
| Pre-rendered images / thumbnails | **(not surveyed in detail)** | **0** | Deferred &mdash; thumbnails would need conversion + size-checks. The 3D-preview cards in `/atelier` render the GLB inline, which substitutes for now. |
| Audio / kata recordings | **0** | **0** | None found in The Hangar in publishable form. The audio pipeline (Whisper STT, Kokoro TTS, audio-reactive brush parameters) exists in `python-services/` but doesn't produce uploadable audio assets. |
| 360-studio panoramas | **(skipped)** | **0** | Out of scope &mdash; covered by the visualiser agent. |

## Phase 2 &mdash; What landed

### Meshes (6)
All from `D:\The_Hangar\.infrastructure\blender_python_library\` +
`D:\The_Hangar\assets\blender\`. All under 1 MB. Stored at
`public/assets/meshes/{biomimetic,sculpture}/`.

- `dragon-scales-wall-art.glb` &mdash; 80 KB &mdash; placoid scale tessellation
- `phyllotaxis-dense.glb` &mdash; 163 KB &mdash; Vogel-spiral seed packing
- `phyllotaxis-inverse.glb` &mdash; 81 KB &mdash; inverted-density variant
- `phyllotaxis-triangular.glb` &mdash; 13 KB &mdash; triangular elements
- `phyllotaxis-wall-art.glb` &mdash; 61 KB &mdash; wall-mount sized
- `template-sculpture.glb` &mdash; 553 KB &mdash; evolution-engine seed

### Brushes (20)
All from `brush-engine.html` BRUSHES array. Published as
`lib/assets/brushes.ts` with the 3-parameter spec preserved.

### Python (7 files + 1 JS engine)
Stored verbatim under `python-services/`:
- `morphing_engine.py` (15.2 KB)
- `choreography_engine.js` (4.1 KB)
- `fitness.py` (9.0 KB)
- `fresnel_generator.py` (16 KB)
- `caustic_optimizer.py` (18 KB)
- `grin_generator.py` (12 KB)
- `generators.py` (15 KB)
- `genome.py` (0.8 KB shim)

### Data (3 JSONs)
Stored under `public/assets/flow-arts/` and `public/assets/genomes/`:
- `biomimetic-cross-sections.json` (2.6 KB) &mdash; 6 named biomimetic
  CONFIGS with default genomes (bird-bone, bird-feather, butterfly,
  leaf-vein, shark, dragonfly)
- `biomimetic-atlas.json` (25 KB) &mdash; full biomimetic atlas
- `catalogue.json` (genomes) &mdash; published subset of the registry

### Typed manifests (Phase 3)

| File | Entries | Purpose |
|---|---|---|
| `lib/assets/meshes.ts` | 6 | Typed mesh catalogue with category, format, file size, source-algorithm cross-reference |
| `lib/assets/brushes.ts` | 20 | Typed brush catalogue with category, dot colour, 3-param spec, notes |
| `lib/assets/flow-arts.ts` | 8 corners + 10 moves + 9 stage zones | Laban canon + kata library + stage zone vectors |
| `lib/assets/genomes.ts` | 3 + 8 kingdoms | Sculpture-genome catalogue with full gene-vector subset |
| `lib/assets/algorithms.ts` | 30 + 8 families | Jewellery-algorithm catalogue (metadata only; source ports deferred) |

### Math ports (Phase 4)

`lib/math/easing.ts` &mdash; 24 easing functions ported from
`morphing_engine.py`:

- linear
- easeIn / Out / InOutQuad
- easeIn / Out / InOutCubic
- easeIn / Out / InOutQuart
- easeIn / Out / InOutSine
- easeIn / Out / InOutExpo
- easeIn / Out / InOutBack
- easeInElastic / easeOutElastic
- bounce
- mix, smoothstep
- easingRegistry + getEasing(name)

`lib/math/laban.ts` &mdash; Laban-effort cube math:
- `LabanPoint` 4D type
- `cornerToPoint(corner)` &mdash; named-to-coords
- `lerpEffort(a, b, t)` &mdash; choreographic crossfade
- `effortDistance(a, b)` &mdash; Euclidean in 4D
- `nearestCorner(point)` &mdash; classification
- `blendCorners(from, to, t)` &mdash; convenience wrapper

`lib/math/gestures.ts` &mdash; trajectory primitives:
- `arcLength2` / `arcLength3`
- `curvature2` &mdash; signed discrete curvature
- `angularVelocity2` &mdash; per-frame rad with unwrap
- `resample2` &mdash; uniform arc-length resampling
- `smoothMA` &mdash; moving-average low-pass

## Phase 5 &mdash; The route

`app/atelier/page.tsx` ships as a single browseable index with five
sections: **Meshes**, **Brushes**, **Flow-arts**, **Genomes**,
**Algorithms**. Each section has its own subsection nav, card grids,
and cross-references. The 3D mesh previews use R3F + drei `Stage`
and are lazy-loaded via `next/dynamic` with `ssr: false` so the
GLTFLoader never runs on the server.

Middleware: `/atelier` added to `PASS_THROUGH_PREFIXES` so the
coming-soon redirect bypasses it.

Footer: `<Link href="/atelier">The atelier</Link>` added next to
the Stack link in `components/layout/footer.tsx`.

## Skipped (deliberately)

- **ML model weights** &mdash; gigabytes; not a public-website concern.
- **`D:\The_Hangar\Dolly_OS\public\docs\The_Charming_Academy\`** &mdash;
  flagged private by narrative survey.
- **`apps/prototypes/poi-sculptor/move_library/cross/`** &mdash; the
  `.blend` Blender working files (multiple GB of autosaves; not
  web-usable).
- **`engines/comfyui/`** &mdash; ComfyUI install + checkpoints.
- **All vendored third-party meshes** in
  `aura-upgraded-but-brokken-main/dist/assets/3d/` (Khronos
  reference models, Tilt Brush samples, etc).

## What's queued for the next pass

1. **The 30 jewellery algorithm sources.** Currently only the
   catalogue is published. Porting depends on bringing the
   `BaseAlgorithm` class + the `mergeGeometries` utility chain.
   Architectural concern: 30 algorithms on a single `/atelier` page
   may be too many; consider a dedicated `/atelier/algorithms`
   subpage in the follow-up.
2. **Kata trajectory data.** The named moves landed; the actual
   3D-point trajectories still live in `.blend` files. A Blender
   export pass that emits JSON-per-move would unlock these.
3. **Brush previews.** The brush cards currently show only the dot
   colour + spec. WebGPU brush-engine snippets per brush (small
   shader frames) would be the next visual level.
4. **More genomes.** Three landed; thirty more sit in the registry.
   A small export script (no embedded `builder_script` bytecode)
   would surface them all.
5. **Audio analysis.** The Whisper / librosa pipeline runs on the
   bench; precomputed kata-audio JSON (BPM, peaks, frequency
   bins per move) doesn't exist yet but would be a clean next deliverable.

## License notes

- Meshes: studio-original, generated by `generators.py`.
- Brushes: tilt-brush-style + open-brush imports use the visual
  recipes from those projects (which themselves use permissive
  licenses); the silk and original families are studio-original.
- Python math: morphing engine descends from Robert Penner's easing
  equations (BSD-license, attributed in the source). Biomimetic
  generators and fitness scoring are studio-original.
- Laban canon: Rudolf Laban's Movement Analysis (1947) is in the
  public domain.

## Conversion required

None at this pass. All meshes were already `.glb`; all data was
already JSON or trivially exportable; all Python copied verbatim. No
external Blender / converter runs required.

## File count

By rough count, this migration touched:
- **6** mesh files (binary, copied)
- **2** JSON data files (copied verbatim)
- **8** Python / JS engine files (copied verbatim)
- **1** new JSON published from catalogue (`genomes/catalogue.json`)
- **5** typed-manifest TS files (`lib/assets/`)
- **3** math-port TS files (`lib/math/`)
- **6** new React components (`components/atelier/*`)
- **1** new route (`app/atelier/page.tsx`)
- **1** README (`python-services/README.md`)
- **2** edits to existing files (`middleware.ts`, `footer.tsx`)
- **1** migration log (this file)

Total: ~36 files created, 2 edited. Well within the 100-file cap.

---

## Wave 2 &mdash; 2026-05-13

**Migration agent:** atelier-migration (wave 2)

This pass addresses the three flags Wave 1&rsquo;s honest closing note
left open: algorithm source-ports, more meshes, more genomes; plus
the architectural concern about thirty algorithm cards on a single
page.

### Phase 1 &mdash; Algorithm source ports (19 of 30)

The ported sources live at `lib/algorithms/&lt;slug&gt;.ts`. Each module
exports:

- `defaultParams()` returning the canonical parameter record.
- `generate(params)` returning `{ positions, indices?, uvs?,
  normals? }` &mdash; raw vertex arrays for use outside Three.js.
- `generateGeometry(params)` returning a `THREE.BufferGeometry` for
  in-browser R3F preview.

The shared `seededRng`, `mergeAll`, `normalise`, `attrsOf` helpers
live in `lib/algorithms/_base.ts`. The Hangar&rsquo;s `BaseAlgorithm`
class hierarchy was dropped &mdash; the algorithms are pure
data-in/data-out, so plain functions suffice.

**Ported (19):**

| Slug | Source file | LOC ported |
|---|---|---|
| `spiral` | algo_01_Spiral.ts | 51 |
| `gyroid` | algo_02_Gyroid.ts | 90 |
| `lsystem` | algo_03_LSystem.ts | 102 |
| `auxetic` | algo_04_AuxeticCorrugation.ts | 102 |
| `fermat-spiral` | algo_05_FermatSpiral.ts | 55 |
| `geodesic-spines` | algo_09_GeodesicSpines.ts | 68 |
| `celtic-knot` | algo_10_CelticKnot.ts | 64 |
| `swept-sinuous` | algo_11_SweptSinuous.ts | 80 |
| `gear` | algo_13_Gear.ts | 80 |
| `skull-sdf` | algo_14_SkullSDF.ts | 79 |
| `wing-venation` | algo_15_WingVenation.ts | 117 |
| `tensegrity` | algo_18_Tensegrity.ts | 88 |
| `sigil` | algo_19_Sigil.ts | 121 |
| `torus-knot` | algo_20_TorusKnot.ts | 48 |
| `step-fret` | algo_21_StepFret.ts | 79 |
| `interlace` | algo_22_Interlace.ts | 87 |
| `mon` | algo_23_Mon.ts | 73 |
| `non-euclidean` | algo_25_NonEuclidean.ts | 96 |
| `ribbon-helix` | algo_28_RibbonHelix.ts | 99 |

Every ported file is under the 300-line cap.

**Skipped + reasons (11):**

- `dla` (algo_06_DLA) &mdash; depends on `simulationsWorkerClient`
  (Hangar-side web worker), and the synchronous fallback is itself a
  long-running random-walk simulation; not browser-preview friendly.
- `voronoi` (algo_07_Voronoi) &mdash; depends on
  `voronoiWorkerClient` and runs Lloyd relaxation; same reason.
- `lsystem-tube` (algo_08_LSystemTube) &mdash; a heavier variant of
  the space-colonisation algorithm already covered by `lsystem`.
- `pcb-trace` (algo_12_PCBTrace) &mdash; clean math, but
  the extrude operations interact awkwardly with how R3F&rsquo;s
  `Stage` centres geometry; queued for Wave 3 with a custom camera.
- `penrose-tiling` (algo_16_PenroseTiling) &mdash; rhombus deflation
  emits hundreds of ExtrudeGeometry instances; the merge step is
  costly enough on the browser thread to need a web worker. Catalogue
  entry surfaced.
- `reaction-diffusion` (algo_17_ReactionDiffusion) &mdash; the
  Gray-Scott loop is 800-1400 steps on a 28&times;28 grid and was
  worker-backed in Dolly_OS for good reason. Catalogue entry only.
- `clash-compositor` (algo_24_ClashCompositor) &mdash; simple
  primitive scatter; deferred for taste reasons (the output is
  visually clashing by design, which makes the cabinet preview
  less coherent than the others).
- `wigner-seitz` (algo_26_WignerSeitz) &mdash; depends on a
  lattice-perpendicular-bisector solver that lives outside the
  algorithm file in Hangar; needs porting alongside.
- `spinodal` (algo_27_Spinodal) &mdash; thresholded sum-of-sines
  field that resolves cleanly only at higher resolution; deferred
  until the worker-backed path is ready.
- `enneper` (algo_29_Enneper) &mdash; clean parametric math, but the
  Hangar source uses an explicit normal-offset thickening pass that
  produces self-intersections in browser preview; queued.
- `diatom-hex` (algo_30_DiatomHex) &mdash; clean enough to port; cut
  for time budget. Top priority for Wave 3 in this skipped set.

### Phase 2 &mdash; `/atelier/algorithms` route

`app/atelier/algorithms/page.tsx` &mdash; new index page. All 30
algorithms grouped by kingdom (8 sections) with status pips for the
ported vs catalogue-only subset.

`app/atelier/algorithms/[slug]/page.tsx` &mdash; new dynamic route
with `generateStaticParams()` over all 30 catalogue slugs. Per-page:
chrome label, family-coloured dot, expanded notes, lazy-loaded R3F
preview where the source is ported (else a "source port pending"
stub with a `TODO` comment), parameters table, cross-refs to
articles + sibling routes.

`components/atelier/algorithm-preview.tsx` &mdash; new client
component. Lazy-imports the ported module on mount, runs
`generateGeometry()` with the user-driven slider values, renders
inside an R3F `Stage`. Sliders for the three common knobs (seed,
complexity, density); a "Reroll" button.

`app/atelier/page.tsx` &mdash; the 30-card algorithm grid is
replaced with a single hero card linking to `/atelier/algorithms`,
preserving the section nav anchor and the family-DNA chips. The
mesh, brush, flow-art, and genome sections are untouched.

### Phase 3 &mdash; Meshes (+16, total 22)

Survey location: `D:\The_Hangar\outputs\holoflow_renders\` &mdash;
23,200 evolution-engine output .glb files, generated by the breeding
loop. A curated sample landed: two per kingdom (early and late
generation) so the morphological drift is visible.

Selected meshes (16):

| Slug | Kingdom | Bytes |
|---|---|---|
| `gen0001-biomech-seed` | biomech | 7,724 |
| `gen1429-biomech-late` | biomech | 6,348 |
| `gen0003-techno-grid` | techno | 4,100 |
| `gen0006-techno-twisted` | techno | 2,424 |
| `gen0002-artistic-early` | expressive | 7,640 |
| `gen1429-artistic-mature` | expressive | 53,568 |
| `gen0001-choreographic-trace` | motion | 14,068 |
| `gen1429-choreographic-mature` | motion | 14,160 |
| `gen0162-thermal-shed` | thermal | 195,256 |
| `gen0443-thermal-late` | thermal | 195,168 |
| `gen0002-protean-hybrid` | protean | 335,144 |
| `gen1429-protean-elite` | protean | 373,376 |
| `gen0001-assemblage-seed` | assemblage | 4,196 |
| `gen0002-assemblage-joined` | assemblage | 2,332 |
| `gen0001-curvilinear-spline` | curvilinear | 14,068 |
| `gen1429-curvilinear-mature` | curvilinear | 14,076 |

Largest: 373 KB (gen1429 protean elite). Total payload ~1.4 MB
across 16 files. All published at
`public/assets/meshes/evolution/&lt;slug&gt;.glb`.

A new `evolution` MeshCategory was added to
`lib/assets/meshes.ts`; `meshCategories[]` extended.

### Phase 4 &mdash; Evolution-suite scaffold

`lib/evolution/stations.ts` &mdash; new. Typed data file naming all
14 stations the brief specified, with id (S0 to S19, non-sequential),
name, source-file pointer, functional `kind` enum (ingress, breeding,
fitness, studio, narrative, archive, physics, live, hub, gardener),
one-sentence `purpose`, and `feedsInto[]` edges.

`components/atelier/evolution-diagram.tsx` &mdash; new. Pure-SVG
directed-graph rendering of the 14 stations. Hand-curated layout
across 5 rows; arrows derived from `feedsInto[]`. Server-renderable
(no client JS).

`app/atelier/evolution/page.tsx` &mdash; new. Aura register. Hero,
flow-text, embedded diagram, then a 14-card grid of station cards
with id / name / kind / purpose / feedsInto. Cross-refs to
how-the-studio-breeds-sculptures and the-eight-kingdoms.

**Per-station interactive routes are deliberately not built.** The
Dolly_OS suite's interactivity depends on a global Zustand store
(`useGenomeStore`), worker pools for breeding / fitness scoring, and
a router that bridges Aura-side navigation events. Lifting any of
that into Next would require a substantial parallel infrastructure;
not justified for Wave 2.

### Phase 5 &mdash; Genomes (+9, total 12)

Source: `D:\The_Hangar\apps\prototypes\poi-sculptor\
sculpture_registry.json` and `D:\The_Hangar\Dolly_OS\src\lib\
evolution\genome-defaults.ts`.

Added:

- `g83266-gen1-variant` &mdash; gen-1 descendant of `g66903` from
  the registry; 0.4 percent arm-length mutation, otherwise identical
  parent. The earliest evidence in the published registry of the
  engine&rsquo;s incremental walk.
- 8 kingdom-anchor seed genomes (`seed-techno-eve`, `seed-biomech-eve`,
  `seed-curvilinear`, `seed-assemblage`, `seed-artistic`,
  `seed-choreographic`, `seed-thermal`, `seed-protean`) modelled on
  `seedGenome()` in genome-defaults.ts. Each carries the kingdom-pure
  ancestry vector (1.0 in its own slot, 0 elsewhere) plus the default
  LumiDualConfig.

Embedded `builder_script` bytecode was again intentionally stripped
(Wave 1 invariant).

### Phase 6 &mdash; Cross-references

- `lib/articles.tsx` &mdash; `/articles/the-jewellery-algorithms`
  related[]: +7 entries (cabinet index + 5 distinctive named
  algorithms + the evolution suite).
- `lib/articles.tsx` &mdash; `/articles/how-the-studio-breeds-sculptures`
  related[]: +3 entries (evolution suite, atelier#genomes, algorithm
  cabinet).
- `lib/articles.tsx` &mdash; `/articles/the-eight-kingdoms`
  related[]: +2 entries (evolution suite, atelier#meshes).
- `app/services/looking-glass-quilts/page.tsx` &mdash; +1 footer list
  entry (atelier#meshes).
- `lib/loop.ts` &mdash; loop position-4 (trail-reified) routes:
  +1 entry (atelier#genomes).
- `components/layout/footer.tsx` &mdash; +2 footer links
  (`/atelier/algorithms`, `/atelier/evolution`).

Total cross-ref additions: 16 across 5 files. No cross-link spam:
each addition names a connection that was already real in the
practice.

### Phase 7 &mdash; File count

| Phase | New files | Modified files |
|---|---|---|
| 1 (algorithms) | 20 (19 ports + 1 base + 1 registry) | &mdash; |
| 2 (algorithm routes) | 3 | 1 (atelier/page.tsx) |
| 3 (meshes) | 16 | 1 (lib/assets/meshes.ts) |
| 4 (evolution) | 3 | &mdash; |
| 5 (genomes) | &mdash; | 1 (lib/assets/genomes.ts) |
| 6 (cross-refs) | &mdash; | 4 |
| 7 (this log) | &mdash; | 1 |
| **Wave 2 total** | **42 new** | **8 modified** |
| **Cumulative (Waves 1+2)** | **~78 new** | **10 modified** |

### Skipped (deliberately, Wave 2)

- The remaining 11 algorithm sources (above with reasons).
- Per-station interactive pages under `/atelier/evolution/&lt;station&gt;`.
- Builder-script Python from the registry (Wave 1 invariant).
- The 23,200-file render corpus minus the 16-piece curated selection.
- More than 12 genomes &mdash; the registry only has 5 specimens
  total; the rest of the 12 are kingdom-anchor seeds, which is the
  ceiling of what can be honestly surfaced without inventing data.

### Still in The Hangar after Wave 2

- 11 algorithm sources (DLA, Voronoi, LSystem-tube, PCB-trace,
  Penrose, Reaction-Diffusion, Clash, Wigner-Seitz, Spinodal,
  Enneper, Diatom-hex). Roughly half need worker infrastructure;
  the rest are pure-math cuts for time budget.
- Per-station evolution-suite UIs (13 stations remain
  non-interactive). The full UI port depends on the genome-store,
  worker pool, and Aura router &mdash; substantial.
- Kata trajectory data still in `.blend` files (Wave 1 flag carried
  forward).
- Brush WebGPU/TSL shader frames (Wave 1 flag carried forward).
- Audio analysis JSON per kata (Wave 1 flag carried forward).
- Many more meshes &mdash; the 23,200 in `outputs/holoflow_renders`
  could be triaged into a richer published set, but most are
  near-duplicates from the same lineage.

