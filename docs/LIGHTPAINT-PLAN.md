# Lightpaint chamber — project plan

> Status: planning, 2026-05-16. Animated light-painting editor — frame-by-frame light paintings stitched into stop-motion-style animations, with full Photoshop-grade layer + mask + collapse semantics per frame.

## The headline goal

A single chamber that lets the operator import a sequence of long-exposure light-painting captures, edit each frame as a layered composition (mask, erase, recolour, paint synthetic trails on top), play them back as an animation, and export to MP4 / WebM / GIF / PNG-sequence. Sits in `paint-and-draw` alongside `silk-brush`, `light-weaver`, `lightpainting-forge`, `sprite-designer`.

Recommended slug: **`/atelier/lightpaint`**. One chamber, two modes (single-frame / sequence) — the static editor is a one-frame animation.

## Why this specifically

- The operator does **poi performance** — every poi shot on the studio site is a light painting; every kata in the library is a paintable trajectory.
- She has the **capture rigs** — Osmo 360 + DSLRs + the multi-camera POV rig (`rig-simulator` chamber documents it).
- She has the **bench primitives** — SAM2 segmentation, Depth-Anything-V2, light-weaver shaders, kata library, poi-sculptor — but no editor to thread them together for animation.
- Nothing decent ships for editing animated light painting; this is a fresh-air chamber.

## Three sibling chambers, one cluster

| Chamber | Input | Output | Status |
|---|---|---|---|
| `lightpainting-forge` | Single image | 3D volume (marching-cubes light volume) | shipped |
| `lightpaint` (this plan) | Sequence of long-exposures | Layered animation (MP4/GIF/PNG-seq) | proposed |
| `poi-sculptor` | Painted trail | Printable 3D mesh | shipped |

The three share the same upstream primitives (SAM2 / depth / kata library) and the same downstream consumers (print bureau / HoloWalk / poi-duel-game).

## Per-frame layer model

Each frame on the timeline holds its own layer stack — exactly like a Photoshop document, but every frame is its own document:

- **Captured layers** — long-exposures contributing to this frame (1..N stacked, Lighten/Screen/Additive blend)
- **Painted layers** — synthetic trails drawn over, using light-weaver's six shaders (flame / plasma / aurora / mycelium / ink / neon)
- **Adjustment layers** — non-destructive recolour, HSL, levels, curves
- **Mask layer** — what's visible per source layer
- **Reference layer** — kata diagram or sketch pinned to compose against

Standard ops: opacity, blend modes, transform, duplicate, eraser (destructive), mask (non-destructive). **Collapse** merges layers down — flatten a layer stack, flatten a frame, render a sequence — each step irreversible at the storage level but undoable in-session.

## Animation primitives

- **Timeline strip** at bottom, thumbnail per frame, click + drag
- **Onion skin** — N-1 and N+1 ghosts. The single most important animation tool.
- **Loop play / scrub** with variable rate (most light-paint animations run 1-12 fps, not 24)
- **Frame timing** — per-frame hold (1-4 frames typical for stop-motion-style)
- **Interpolation modes** — none (true stop-motion) / linear morph / trail-aware (extract polylines per frame, light-weaver shaders blend between them)
- **Copy-frame-as-layer** — bring frame N-1 in as a layer on N for selective erasing carry-over

## Tech architecture

- **Canvas + brush + mask:** WebGPU TSL on the planned `<FlagDisplay>` primitive. Each frame's current composite renders to a TSL texture.
- **Frame storage:** OPFS (Origin Private File System) — better than IndexedDB for big binary blobs. Originals stay as source of truth; layer ops stored as JSON op-log per frame (Painter's-Algorithm-style) so each frame re-renders from log + originals.
- **Working resolution:** proxy at 1024×1024 (or 2048×1024 landscape) for interactive editing; render at full res for export.
- **Mask + brush primitive:** reuse `sprite-designer`'s engine — same data shape, larger canvas.
- **Export:** WebCodecs API → VideoEncoder (H.264 / H.265 / AV1) for MP4/WebM; canvas-to-GIF; PNG sequence for After Effects / DaVinci import.
- **Onion skin:** two extra textures sampled at low opacity in the main TSL pass.
- **Frame thumbnails:** small WebGL-rendered crops cached in OPFS.

## Multi-modal input (same stack as the 360 plan)

Mouse + touch / cursor / WebXR hand tracking / MediaPipe face + eye + gaze. Cloth physics, brush state, and timeline state all driven by the same input layer. VR mode: walk through the timeline as a horizontal strip, retrace trails by physically moving in space (the actual motion that drew them).

## How it feeds the existing pipelines

- **Print bureau** — selected frames become A2 prints; "frame 7 of [piece name]" is sellable in its own right
- **HoloWalk** — animations re-projected onto the GPS coordinate where they were captured; visitors stand on the spot and see the light painting playing in space
- **Poi-duel game** — extracted 3D trails become animation reference for the game's spell-trail effects
- **Kata library** — each frame can be tagged with its kata move; an animated kata becomes a labelled motion sequence for the kata-to-trail model
- **360 model corpus** — paired (input frame, output frame) data for a temporal style adapter (light-painting-animation style on arbitrary input)
- **Veo** — animations as motion brushes / reference clips for video generation

## Phased build

1. **Sequence import + timeline + scrub + loop play + GIF export.** No layers, just stack-and-display. (~2 days)
2. **Single-layer-per-frame Lighten-blend across multiple input shots, per-shot opacity.** Basic stacking case. (~2 days)
3. **Per-frame layer stack with masks + eraser + opacity + blend modes.** Photoshop-per-frame core. (~4 days)
4. **Onion-skin + frame-timing + collapse-frame.** Animation discipline. (~2 days)
5. **Painted layers** using light-weaver shaders to draw synthetic trails. (~2 days)
6. **MP4/WebM export** via WebCodecs. (~1 day)
7. **Trail extraction + kata tagging.** SAM2 isolation + skeletonisation + kata library binding. (~2 days)
8. **Generative interpolation** between frames using extracted trails (later). Open scope.

**First six bullets = ~2 weeks of build** for a chamber that doesn't exist anywhere else.

## Repo scouting (2026-05-16 GitHub survey)

Classifying every primitive as **fork** (copy + adapt), **vendor** (depend as module), **study** (algorithms only), or **build** (write ourselves).

### Top 3 leverage finds

- [`vanilagy/mediabunny`](https://mediabunny.dev/guide/introduction) — **vendor**. Canonical 2026 path for canvas-frame → MP4/WebM via WebCodecs. Replaces deprecated `mp4-muxer` and `webm-muxer`. Pure TS, tree-shakable, also demuxes.
- [`viliusle/miniPaint`](https://github.com/viliusle/miniPaint) (MIT) — **fork** the layer engine. Only browser raster editor with a real layer model (multi-layer, transparency, merging, flattening, blend modes, masks, erasers, adjustment filters) under a permissive licence. Strip the UI, re-host the compositor inside TSL fragment passes.
- [`bandinopla/three-simplecloth`](https://github.com/bandinopla/three-simplecloth) (MIT) + [three.js `webgpu_compute_cloth` example](https://threejs.org/examples/webgpu_compute_cloth.html) — **vendor**. The `<FlagDisplay>` Verlet cloth primitive, already on three.js + TSL + WebGPU, with sphere colliders + grab interaction. No porting needed.

### Section-by-section

**Layer editor primitives**
- [`viliusle/miniPaint`](https://github.com/viliusle/miniPaint) (MIT) — **fork** as above.
- [`marcello3d/lascaux-sketch`](https://github.com/marcello3d/lascaux-sketch) (Zlib) — **study**. TypeScript + WebGL brush + layer compositor; clean code, ideal study target for the WebGL-side patterns.
- [`drawpile/Drawpile`](https://github.com/drawpile/Drawpile) (GPLv3) — **study only**, algorithms not extractable to JS.
- Polotno / tldraw — **skip**. Vector-first, wrong shape for raster compositing.
- Photopea — **skip**. Proprietary, [confirmed by maintainer](https://github.com/photopea/photopea/issues/8672).

**Animation + onion-skin**
- [`Wicklets/wick-editor`](https://github.com/Wicklets/wick-editor) (GPLv3) — **study**. Best React-friendly timeline+onion-skin reference. Adjustable-range onion-skin already implemented ([issue #139](https://github.com/Wicklets/wick-editor/issues/139)). GPL contamination means study the algorithms and patterns, write our own implementation.
- [`piskelapp/piskel`](https://github.com/piskelapp/piskel) (Apache-2.0) — **study + selective fork**. Simplest pure-JS timeline+onion-skin+GIF reference. Algorithms transferable cleanly.
- [`LibreSprite/LibreSprite`](https://github.com/LibreSprite/LibreSprite) (GPLv2) + [`aseprite/aseprite`](https://github.com/aseprite/aseprite) — **algorithm references only**. Read [Aseprite timeline docs](https://www.aseprite.org/docs/timeline/) + [onion-skin docs](https://www.aseprite.org/docs/onion-skinning/) before designing the timeline UI. Cel = Layer × Frame intersection; onion-skin = N-back/N-forward composite with tint+opacity falloff. Ports to TSL in tens of lines.
- Krita-web — **does not exist**. Stop hoping.

**Long-exposure stacking**
- **build ourselves**. No JS open-source stacker exists. Trivial TSL fragment pass — `max()` / `lighten` blend across N input textures.

**WebGPU cloth physics (for `<FlagDisplay>`)**
- [`bandinopla/three-simplecloth`](https://github.com/bandinopla/three-simplecloth) (MIT) — **vendor**.
- [`ccincotti3/webgpu_cloth_simulator`](https://github.com/ccincotti3/webgpu_cloth_simulator) (MIT) — **study** for higher-fidelity XPBD upgrade later.

**Trail extraction / skeletonisation**
- [`LingDong-/skeletonization-js`](https://github.com/LingDong-/skeletonization-js) (MIT) — **vendor**. GPU-accelerated Zhang-Suen via gpu.js.
- [`LingDong-/skeleton-tracing`](https://github.com/LingDong-/skeleton-tracing) (MIT) — **vendor**. Produces polylines (arrays of (x,y)) from a skeleton. The chain `skeletonization-js → skeleton-tracing` gives us 2D trails from binary masks for free.

**WebCodecs MP4/WebM export**
- [`vanilagy/mediabunny`](https://mediabunny.dev/guide/introduction) — **vendor**. The only path; all alternatives deprecated.

**OPFS storage**
- [`hughfenghen/opfs-tools`](https://www.npmjs.com/package/opfs-tools) (MIT) — **vendor**. High-performance FS-shaped API; right shape for 10-100 MB × 50-frame use.
- [`atox996/opfs-ts`](https://github.com/atox996/opfs-ts) (MIT) — **alternative**. Thinner wrapper if opfs-tools is overkill.

**Light painting specifically**
- All four candidates ([mauricesvay/mobile-lightpainting](https://github.com/mauricesvay/mobile-lightpainting), [positlabs/lightpaintlive](https://github.com/positlabs/lightpaintlive), [BarakChamo/lightPaint](https://github.com/BarakChamo/lightPaint), [achakilum/LUMNart-lightpainting](https://github.com/achakilum/LUMNart-lightpainting)) are toy-scale and dead. **Reference only.** The wedge is genuinely wide open — no decent open-source animated light-painting editor exists in any environment.

**MediaPipe + three.js + TSL**
- [`collidingScopes/threejs-handtracking-101`](https://github.com/collidingScopes/threejs-handtracking-101) — **study**. MediaPipe Hands → three.js (WebGL, not TSL).
- [`craftlinks/three-tsl-webgpu`](https://github.com/craftlinks/three-tsl-webgpu) + [`cmhhelgeson/Threejs_TSL_Tutorials`](https://github.com/cmhhelgeson/Threejs_TSL_Tutorials) — **study**. TSL+WebGPU patterns without MediaPipe.
- **Wire the two halves ourselves**. MediaPipe output is plain landmark JSON; integration is one Zustand store away.

### Build vs fork/vendor summary

| Layer | Approach | Source |
|---|---|---|
| Cloth physics (FlagDisplay) | vendor | three-simplecloth |
| Layer engine | fork | miniPaint (strip UI, rehost in TSL) |
| Timeline + onion-skin UX | build (study Wick + Piskel + Aseprite docs) | algorithms port directly |
| Long-exposure stacking | build | trivial TSL fragment pass |
| Trail extraction (2D) | vendor | skeletonization-js + skeleton-tracing |
| MP4/WebM export | vendor | mediabunny |
| Frame storage | vendor | opfs-tools |
| MediaPipe input layer | build (wire MediaPipe JSON → Zustand store → cloth grab points) | — |

The chamber's MVP becomes ~70% glue, 30% novel code. Most of the heavy lifting already exists under MIT / Apache.

## Open exploration threads

- Camera tethering (interval capture from the browser via a desktop bridge)
- Audio sync for music-paired animations
- 3D multi-perspective light painting (combining multi-camera captures from the POV rig)
- Real-time AR preview (phone-as-light-source, AR overlay shows the painting building as you walk)
- Inverse mode: given a target animation, generate the kata sequence to physically perform it
- Spectral decomposition by colour (red trails / blue trails as separable layers for multi-performer scenes)
- Trail-as-controller (use a captured trail as an animation curve for other parameters)

## Decisions made

- **2026-05-16:** One chamber, two modes — `/atelier/lightpaint` with single-frame and sequence modes, not two separate chambers.
- **2026-05-16:** Storage is OPFS, not IndexedDB. Op-log + originals, not flattened pixel buffers per frame.
- **2026-05-16:** Sibling to `lightpainting-forge` (volume) and `poi-sculptor` (mesh), not a replacement.
