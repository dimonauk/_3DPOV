# Resources — 360° and spherical content across the Hangar

A workshop inventory of every 360° / spherical asset, script, viewer, writeup, and bookmarked OSS piece that lives somewhere under `D:\The_Hangar\` (including DollyOS), with a folding plan for what to bring into the Holoflow Studio site. First pass — catalogue only, no copying. The follow-up pass picks specific assets to land under `public/pano/`.

## Why this exists

Direction (2026-05-19): *"scan the hangar and dolly os for 360 and spherical stuff to fold in"*.

The studio's 360 work has been quietly substantial — splat360 is a full 360-camera-first Gaussian Splat service, the `/edit` route is a browser-native 360 editor, four codex entries and one tutorial already cover the topic — but the supporting prototypes, archived shards, capture utilities, and reference docs are scattered across at least eight directories. This catalogue pulls them into one map so the next round of work (a `/sphere-tour` route, environment maps for the sculpture gallery scenes, the missing codex entries) starts from "I know what I've got" instead of "let me grep again".

What counts: equirectangular photos and video, stitching scripts, spherical viewers, 360-aware AR/VR scenes, cube-map captures, anything explicitly tagged `pano` / `360` / `equirect` / `sphere` / `panorama`. What does **not** count: splats (covered by the splat-walker), regular flat photos, generic 3D meshes.

## What's in the Hangar

### Actual capture assets

Almost none. The Hangar is rich in *tooling* and poor in *captured imagery* — most of Dimona's actual 360 stills live on the camera + Mimo cloud, not on disk. The only 360 captures committed anywhere under `D:\The_Hangar\`:

| Path | Bytes | What | Notes |
| --- | ---: | --- | --- |
| `engines/splat360/test-captures/smoke-test/smoke_equirect.mp4` | 3.5 MB | Equirect MP4 | Synthetic smoke-test, splat360 pipeline fixture |
| `engines/splat360/test-captures/smoke-test/smoke_equirect_v2.mp4` | 11 MB | Equirect MP4 v2 | Same, longer |
| `engines/splat360/test-captures/smoke-test/smoke_frame_001.jpg` | 47 KB | Equirect still | One-frame proof |
| `engines/splat360/test-captures/smoke-test/smoke_lens_a.jpg` | 197 KB | Pre-stitch fisheye, lens A | Path-A fixture |
| `engines/splat360/test-captures/smoke-test/smoke_lens_b.jpg` | 197 KB | Pre-stitch fisheye, lens B | Pair with `_a` |
| `engines/splat360/test-captures/smoke-test/smoke_v2_t{0.5,1.5,2.5}.jpg` | ~130 KB ×3 | Frame grabs from v2 | Three time-indexed stills |

Total committed 360 capture surface: ~15 MB across 8 files. No `.OSV`, `.insv`, `.insp`, `.360`, `.dng`-pair, `.spz` checked in. Drone and 360-camera originals stay on cards + on the bench D:\ outside the repo, which is correct — but means there's nothing in the Hangar today that the studio site could lift as a sample equirect.

### Capture rigs, pipelines, and stitching code

This is where the depth is.

**splat360 engine** — `D:\The_Hangar\engines\splat360\` — a FastAPI service on port 8390 that is a 360-camera-first Gaussian Splat pipeline. Three camera-model paths (fisheye-pair / spherical / cubemap), five SfM backends (COLMAP, GLOMAP, OpenSfM, hloc, AliceVision), four trainers (nerfstudio, Brush, Inria gaussian-splatting, Postshot). The pipeline understands the entire 360-format zoo and emits per-camera adapters.

- `src/splat360/pipeline/cubemap.py` — equirect → 6×pinhole reprojection in pure numpy/cv2. Real maths, well-commented, ~30 ms per 2048-px face on CPU. This is the canonical "if you need to convert equirect to cubemap server-side" implementation in the Hangar.
- `src/splat360/pipeline/camera_model.py` — pure-function decision logic that picks one of three SfM paths from a capture's format.
- `src/splat360/adapters/` — `avata360.py`, `osmo360.py`, `equirect_generic.py`. Format-specific ingest.
- `src/splat360/pipeline/sfm/{colmap,glomap,opensfm,hloc,alicevision}.py` — five SfM wrappers, ~150 LOC each, each probes for its binary on `is_available()`.

**Portable 360 Toolkit** — `D:\Tools\Portable360ToolKit\` — bundled FFmpeg + AliceVision `split360Images` with a PowerShell GUI (`process_frames.ps1`, `start_gui.bat`). Drag-and-drop a 360 video, it extracts frames and splits each equirect into multiple pinhole crops ready for SfM. LGPL (FFmpeg) + MPL-2.0 (AliceVision). Already on disk, ready to wire into the bench-side `/edit` upgrade path when ffmpeg.wasm hits its memory ceiling.

**splat360-deps** — `D:\Tools\splat360-deps\` — COLMAP, GLOMAP, Meshroom, Brush binaries, all Windows x64 builds. These are the SfM/training engines splat360 calls. Not strictly 360 by themselves but mandatory for the pipeline.

**In-site stitching path** — `D:\.github\_3DPOV\lib\studio\stitch.ts` — already-shipped browser-side stitch via `ffmpeg.wasm`. Documents the 800 MB heap pressure ceiling and recommends HoloFlow Desktop above 60 s of 8K OSV. This is the canonical browser path. It already references the `dji-osv-format` skill.

**Server mirror of splat360 in the site** — `D:\.github\_3DPOV\services\splat360\` — a mirror of the engine, deployed alongside the site. Same pipeline code; the site already speaks 360 server-side. The full `services/splat360/docs/` set lives there too (camera-formats.md, 360-editor-feature-matrix.md, holoflow-system-map.md, hosting-platforms-landscape.md) — the maps are already in the repo, just not surfaced.

### Spherical viewers in the Hangar

**DollyOS Cam360GuideApp** — `D:\The_Hangar\Dolly_OS\src\components\library\cam-360-guide\Cam360GuideApp.tsx` (~85 lines). UI-only capture-planner: pick a format (equirect / cubemap / fisheye / little planet), pick a resolution (2K / 4K / 8K equirect), pick a preset location (Hangar Stage / Void Interior / Roof Terrace). No actual capture wired yet; it's the form. Useful as a starting layout for a site-side "plan a 360 shot" tool.

**DollyOS SphereCanvasApp** — `D:\The_Hangar\Dolly_OS\src\apps\SphereCanvasApp.tsx` — a grid-based equirectangular painter. Two-pane: 2:1 equirect canvas on the left with pole-stretch and gaze-comfort overlays, live three.js inside-sphere preview on the right. D_n rotational symmetry + equator mirror. The cleanest in-Hangar example of "paint pixels onto a sphere with the right warnings about pole-stretch". Worker-backed PNG export at 2048×1024.

**DollyOS MandalaGenApp** — `D:\The_Hangar\Dolly_OS\src\apps\MandalaGenApp.tsx` — grammar-driven spherical mandala generator. Stack of parameterised layers (radial bands, N-fold spokes, node rings, great circles, aurora caps, starfields, radial glows), each compiles to a GLSL snippet that sums into the sphere. JSON grammar saves and loads. Exports equirect PNG at 2048×1024 via the same worker. Could lift wholesale into the site as an `/atelier/mandala-sphere` toy.

**DollyOS SphereShaderApp** — `D:\The_Hangar\Dolly_OS\src\apps\SphereShaderApp.tsx` plus `sphere-shader-app-parts/` — direction → shade fragment shader, baked to an equirect via `exportEquirectPNG` (`src/apps/sphere-shader-app-parts/exportEquirect.ts`). Same offscreen-RT + worker encode pattern as MandalaGen. The reference template for "render a fragment shader to a 2048×1024 equirect PNG".

**DollyOS equirect export worker** — `D:\The_Hangar\Dolly_OS\src\workers\equirectExport.worker.ts` (+ `equirectExportClient.ts`). OffscreenCanvas + Y-flip + `convertToBlob` PNG encode. Falls back to main-thread `canvas.toBlob` if the worker can't encode. Drop-in for any site surface that needs to download an equirect.

**aura-pwa ViewerPage** — `D:\The_Hangar\apps\aura-pwa\pages\ViewerPage.tsx` — a Three.js equirect viewer with overlay sphere. Two concentric inverted spheres (radius 500 background + radius 499 overlay), OrbitControls, `EquirectangularReflectionMapping`, additive blending so light-painting overlays glow on top of a background scene. The pattern the site's `EquirectViewer.tsx` already inherits. Useful as a reference if the studio adds a "background + overlay" mode.

### Authoring tooling notes

**DJI format reference** — `D:\The_Hangar\engines\splat360\docs\camera-formats.md`. Full table of every consumer/prosumer 360 camera and what file format it emits — DJI Avata 360 (.OSV), Osmo 360 (.OSV), Antigravity A1, every Insta360 (.insv / .insp), GoPro MAX (.360 EAC), GoPro Fusion, Ricoh Theta family, Kandao QooCam + Obsidian, Garmin VIRB 360, Samsung Gear 360, LG 360 CAM, Nikon KeyMission 360, Pilot Era, HumanEyes Vuze, Z CAM. For each: is it stitched at write-time, where the telemetry lives, which splat360 path it maps to, and adapter status. The single best 360-format reference document in the Hangar. The `dji-osv-format` skill summarises the OSV-specific quirks.

**Competitive matrix** — `D:\The_Hangar\engines\splat360\docs\360-editor-feature-matrix.md`. Five-table feature comparison of DJI Studio, Insta360 Studio, GoPro Quik against the in-browser target. Ingest, stitching, reframing, AI/automation, editing, export, platform. Identifies five concrete gaps where the browser editor wins: universal ingest, splat export, cross-vendor reframing, browser-native, API + CLI. Sketches a v0.1 → v0.2 → milestone-1 scope. This is the strategic argument for `/edit` and would make excellent source material for an article.

**Holoflow system map** — `D:\The_Hangar\engines\splat360\docs\holoflow-system-map.md`. Where each 360 surface ends up in the site. Cross-references the `/edit` route, the splat360 capabilities, the bench-bridge skill, and the HoloFlow Desktop punt-target.

### Writeups + dev notes

Slim. The only standalone writeup in `D:\The_Hangar\writeups\` is `2026-05-12-nine-seconds-to-printable.md` — about the relief/SDXL pipeline, no 360 content. The 360 prose lives inside the splat360 docs above. The `D:\The_Hangar\brain\` and `D:\The_Hangar\concepts\` directories contain nothing 360-related (one Pinterest fashion image with `360` in its hash).

### Archived DollyOS shards (legacy HTML prototypes)

`D:\The_Hangar\Dolly_OS\_archive\shards\` — 624 HTML prototypes from the pre-Crystal era. Six are explicitly 360:

| Shard | KB | What |
| --- | ---: | --- |
| `360_editor.html` | 39 | Layer-based 360 editor with equirect → cubemap export for UE5 (writes 6 PNG faces + README into a zip) |
| `360_gallery.html` | 10 | Pannellum-based gallery — multiple equirect thumbnails, click to open in a Pannellum viewer |
| `360_light_painting_compositor.html` | 26 | Multi-exposure equirect blender — lighten / additive / screen / overlay blend modes, exposure / contrast / saturation, PNG + JPG export |
| `360_viewport_extractor.html` | 20 | Equirect → arbitrary-aspect-ratio crop. Pan around the sphere, lock a viewport, export the flat crop |
| `360-camera-to-ue5-gaussian-splatting-guide.html` | <1 | Shim — the actual six-module guide lives in `apps/prototypes/360-camera-to-ue5-gaussian-splatting-guide/` |
| `360-studio.html` / `360-studio/index.html` | <1 | Shim → empty `apps/360-studio/` skeleton (the "Tim's domain" 360 photography toolkit never materialised — the file at `apps/_archive/apps/360-studio/` is actually a ComfyUI + sewing-pattern app, despite the name) |

`360_gallery.html` is the only Hangar code that actually uses Pannellum (loaded from jsdelivr CDN). It's a working pattern.

### The UE5 + 3DGS interactive guide

`D:\The_Hangar\apps\prototypes\360-camera-to-ue5-gaussian-splatting-guide\App.tsx` — a complete six-module interactive course. Module 0: 3DGS theory. Module 1: data acquisition (camera setup, capture strategy, scene requirements). Module 2: pre-processing. Module 3: image re-projection (equirect to perspective splits via AliceVision `split360Images`). Module 4: 3DGS generation (Reality Capture, COLMAP, OpenSfM, Postshot, Nerfstudio). Module 5: Discord-bot remote-access architecture. Module 6: pipeline-to-product strategy. Comes with prerequisites, completion tracking via localStorage, and a Gemini-API chat widget per module.

This is the most polished standalone 360-pipeline teaching artefact in the Hangar. It maps almost 1:1 onto a multi-page tutorial in the site's `/tutorials` section.

## OSS pieces worth bringing in

Permissive licences only. Proprietary stuff is flagged-not-folded.

### Reach for first

- **[Photo Sphere Viewer](https://github.com/mistic100/Photo-Sphere-Viewer)** — MIT. Modern, plugin-heavy, supports equirect + cubemap + little planet + virtual tour with hotspots, has VR mode via WebXR, gyroscope support, sphere-of-influence markers, animated transitions between scenes. Best fit for a `/sphere-tour` route — it's already a panorama-tour engine. Maintained, TypeScript-friendly.
- **[Pannellum](https://github.com/mpetroff/pannellum)** — MIT. Lightweight (~20 KB gzipped), pure JS, no framework. Already proven in `360_gallery.html`. Good fit if the requirement is "drop a 360 image into a card" and nothing more. Less plugin surface than Photo Sphere Viewer.
- **[Marzipano](https://github.com/google/marzipano)** — Apache-2.0. Google's tile-based multi-resolution sphere viewer. Right answer when the captures are very large (10K+ equirects) and the viewer needs to stream tiles. Heavier API; needs a tile-preprocessing step before publishing.

### Already-in-stack

- **three.js `EquirectangularReflectionMapping`** + `RGBELoader` / `EXRLoader` — already used by `concepts/audio-orb/visual-3d.ts` for HDRI environment lighting and by `aura-pwa/ViewerPage` for the equirect viewer. The site's `EquirectViewer.tsx` is a thin wrapper over this. Free.
- **three.js `PMREMGenerator`** + `fromEquirectangular` — converts an HDR equirect to a pre-filtered cubemap for IBL. Wires into the sculpture gallery scenes whenever a real environment map replaces the studio defaults.
- **`ffmpeg.wasm`** — LGPL/GPL (linked, not bundled). Already in `lib/studio/stitch.ts`. The browser-side path for OSV / INSV / .360 stitching.

### Bench-side, already on disk

- **AliceVision** (MPL-2.0) — full SfM + photogrammetry stack, in `D:\Tools\Portable360ToolKit\bin\` and `D:\Tools\splat360-deps\`.
- **COLMAP + GLOMAP** — BSD-3-Clause and Apache-2.0 respectively. SfM engines.
- **OpenSfM** — BSD-2-Clause. The spherical-SfM engine — accepts equirect input directly without a cubemap reprojection step. Worth highlighting because it's the one SfM tool with native 360 awareness.

### Not foldable — document for reference

- **krpano** — proprietary, per-seat licence. Powerful tour authoring but cannot enter the site. Flag in the codex as the industry reference; do not link as a "use this" tool.
- **PTGui** — proprietary, ~€269 per seat. Already has a codex entry. Same flag.
- **Pano2VR** — proprietary, ~€499. Already has a codex entry.
- **DJI Studio / Insta360 Studio / GoPro Quik / Player** — all proprietary, single-vendor lock-in. The whole point of `/edit` is to make these unnecessary; document them in the competitive-matrix article when it lands but do not depend on them.

### Worth knowing, lower priority

- **[A-Frame `<a-sky>`](https://aframe.io/docs/1.5.0/primitives/a-sky.html)** — MPL-2.0. If the site ever needs a "drop into VR with a 360 background" route, A-Frame ships the entire scene + WebXR plumbing in 200 lines. Heavier than Photo Sphere Viewer for the non-VR case.
- **[hugin](https://hugin.sourceforge.io/)** — GPL-2.0. The OSS Hugin/PTGui equivalent for stitching from per-lens originals. Bench-side only, but useful to document as the free path for users who don't have a one-press 360 camera. The `.pto` project file is the de-facto OSS stitching project format.
- **[exifr](https://github.com/MikeKovarik/exifr)** — MIT, in-browser EXIF + XMP parser. Pulls the `GPano:*` Adobe-standard XMP tags out of an equirect JPEG so the viewer can read FOV / heading / pitch / roll without re-stitching.

## Folding plan

Concrete proposals for what to bring into the site next. None of these copy from the Hangar — they synthesise from the survey above.

1. **A `/sphere-tour` route built on Photo Sphere Viewer** with hotspots between scenes. Reads from a small `data/sphere-tour.json` of scene IDs → equirect URLs + linked hotspots. First content: a six-scene Hangar walkthrough (entrance, stage, bench, fabrication corner, roof, void) once Dimona picks the equirects. The library has VR mode out-of-the-box.

2. **Sculpture-gallery scene environments** — wire `EquirectangularReflectionMapping` into the existing scene mounts in `components/sphere/`, `app/atelier/poi-sculptor/`, and `lib/stage/rooms.ts`. Use Poly Haven HDRIs at 2K (already endorsed in `RESOURCES-AESTHETIC.md`) so the sculptures sit in plausible studio lighting instead of grey ambient. No new dependency.

3. **A `lib/capabilities/viz/equirect-to-cubemap.server.ts` capability** that ports `services/splat360/src/splat360/pipeline/cubemap.py` to TypeScript + sharp (or shells out to the Python service over Tailscale per `holoflow-bench-bridge`). The cubemap is the unlock for IBL pre-filtering, UE5 export, and the SfM cubemap fallback path.

4. **Mandala-sphere atelier toy** — port `MandalaGenApp` from DollyOS into `app/atelier/mandala-sphere/`. The grammar JSON makes it a small, self-contained add. Output is a 2K equirect PNG — fits perfectly under `public/pano/` once the operator saves something good. Uses the existing TSL/three.js stack.

5. **Six-module tutorial: `tutorials/from-360-camera-to-gaussian-splat.tsx`** — port the UE5/3DGS interactive guide from `apps/prototypes/360-camera-to-ue5-gaussian-splatting-guide/` into the site's tutorial section. Existing `from-360-to-splat.tsx` covers the splat360 happy path; this would be the longer, theory-first companion. The prerequisites + completion-tracking UX is a bonus that no other site tutorial has.

6. **Codex gaps to close** — the codex already has `equirectangular-projection`, `kolor-autopano-historical`, `pano2vr-tour-building`, `ptgui-hugin-lightroom-stitching`, `one-press-three-sixty-capture`. Missing entries the survey suggests adding:
   - `cubemap-projection` — the six-face alternative to equirect, with the math from `splat360/pipeline/cubemap.py`
   - `little-planet-projection` — stereographic from-the-bottom 360 framing, ties to the `360_viewport_extractor` shard pattern
   - `dual-fisheye-format` — sets up the OSV / INSV story without diving into vendor lock-in
   - `spherical-image-xmp-gpano` — the Adobe XMP tagging that makes a JPEG "officially" panoramic on Google Photos, Facebook etc.
   - `pannellum-vs-photo-sphere-viewer-vs-marzipano` — workshop comparison, written like an "after using all three"

7. **Article candidate**: port the `360-editor-feature-matrix.md` doc into the journal as a long-form competitive piece. The matrix is already written — needs a voice pass.

8. **A `lib/capabilities/viz/sort-equirect` capability** that wraps the existing `scripts/sort-equirectangulars.mjs`. Lets web surfaces classify a dropped image without spawning the CLI.

## Hangar → site copy candidates

Held back this pass — no captured asset committed in the Hangar today is unambiguously Dimona's own paintbrush-on-the-world. The seven smoke-test files in `engines/splat360/test-captures/smoke-test/` are pipeline fixtures, not creative work. Recommendation: the next pass picks one or two equirect stills from the camera + Mimo cloud (or freshly captured at the Hangar stage), runs them through `scripts/sort-equirectangulars.mjs`, drops them under `public/pano/`. Photo Sphere Viewer's tour scenes need real content; placeholder HDRIs from Poly Haven cover the gallery-lighting need in the meantime.

If the brief shifts to "pull the test fixtures in as a tech-demo", `smoke_equirect_v2.mp4` (11 MB) is at the file-size cap and the others are well under — but none of them illustrate the studio.

## Honest gaps

Things the Hangar does not have that the site might want.

- **Stereo 360 captures** (over-under or side-by-side). The DollyOS Cam360GuideApp doesn't list stereo as a format. The splat360 pipeline doesn't have a stereo adapter. If WebXR-VR 360 with depth ever becomes a milestone, the format work + a capture rig is unowned.
- **High-resolution cubemaps** (16K+ per face). The cubemap pipeline outputs 2048 px faces; nobody has authored an 8K or 16K cubemap. Reach for these the day a desktop-class HoloFlow client lands and the viewer can stream tiles.
- **Tile-streaming converted equirects** (Marzipano DZI-style). Every viewer in the Hangar loads a flat equirect PNG/JPG. For a 16K equirect this is 80 MB+ in the page. No tile-preprocess step exists.
- **Multi-resolution / progressive panoramas.** Same as above — the Hangar always loads full-res.
- **Krpano-class hotspot tour authoring.** Photo Sphere Viewer covers most of this, but the krpano `.xml` tour-config format has no in-Hangar equivalent. If a multi-scene Hangar tour becomes a real product, the JSON schema for hotspot graphs is unowned.
- **Ambisonic / spatial audio overlays on a 360 video.** Flagged as a wedge in the 360-editor matrix but no implementation work has happened anywhere.
- **Live 360 streaming** (RTMP / WHIP from a tethered Insta360 or theta). Out of scope today; flagged because the splat360 service could in principle consume it.
- **AR fiducials inside an equirect** (image-target AR layered on a 360 scene). The `holoflow-ar-targets` skill covers flat-image AR; the 360 ↔ AR pairing is unowned.

## Addendum — finds from the deeper directories

A second pass with a wider net found significant material in `.infrastructure/`, `.obsidian_vault/`, `.merge-staging/`, and `.tmp/` that the first survey missed because those directories are hidden-prefixed. They are still under `D:\The_Hangar\` and still read-only this pass; the catalogue below is an honest "this exists and the next folding pass should look at it".

### The `.merge-staging/_3DPOV/` staging area

`D:\The_Hangar\.merge-staging\_3DPOV\` is a parallel skeleton of the studio repo — a staging area where 360-shaped additions have been drafted but not yet merged into `D:\.github\_3DPOV\`. This is the closest thing the Hangar has to "next planned site changes". Key 360 items waiting to land:

- `components/articles/entries/london-360-walking.tsx` — a complete written article about the trekking-pole + selfie-stick + 360-camera "invisible selfie stick" technique on the South Bank. Workshop voice, finished prose. Ready to ship as an article.
- `sanity/schemas/pano-360.ts` — a `pano360` Sanity document type with the exact shape the studio needs: equirect image, initial yaw/pitch, location (slug/name/lat/lng), captured-at, retired flag, MEDIA_SUBJECTS taxonomy. Drop-in.
- `lib/capabilities/viz/splat-generate-360.ts` + `.PURPOSE.md` — typed capability scoped to spherical-camera sources (Avata 360, Osmo 360, Insta360 X-series, Theta, GoPro Max). Three camera-model strategies (`fisheye-pair`, `equirect`, `cubemap`), single provider `hangar-360` routing to the splat360 service on port 8390. Locked to `commercial-ok` licence — no apple-amlr contamination possible.
- `lib/capabilities/viz/heatmap-equirect.ts` + `.PURPOSE.md` — render an equirectangular heatmap / foveal mask / scanpath from a gaze sample stream. The `input.gaze` → chamber canvas bridge. Three modes (HEATMAP / SCANPATH / FOVEAL), `lib/math/spherical.ts` for yaw/pitch → UV mapping. Consumer: `app/atelier/gaze-heatmap/` (planned).
- `etc/comfyui-workflows/sdxl-360-panorama.json` + `.NOTES.md` — SDXL text-to-image at 4096×2048 for HoloWalk backdrops + AR cards. Adapted from the Hangar's `comfyui/workflows/sdxl_360_panorama.json` to remove a mis-attached Flux LoRA and widen the canvas.
- `etc/comfyui-workflows/flux-equirect-lora-v3.json` + `.NOTES.md` — Flux1-dev FP8 + Equirectangular v3 LoRA. The `dollyos-comfyui-3d` skill flags this as the **best 360 quality path** — use for hero backdrops. 2048×1024 output.
- Mirrored copies of the four already-shipped codex entries (equirectangular-projection, kolor-autopano-historical, pano2vr-tour-building, ptgui-hugin-lightroom-stitching) and the `from-360-to-splat` tutorial, plus `components/studio/EquirectViewer.tsx`. These confirm the staging area tracks the live repo.

The staging area effectively answers half the folding plan above already. The follow-up pass should diff `.merge-staging/_3DPOV/` against `D:\.github\_3DPOV\` and lift the panorama-shaped additions wholesale.

### The Obsidian vault — Knowledge Base notes

`D:\The_Hangar\.obsidian_vault\Knowledge Base\` holds three 360-specific notes Dimona wrote up and stashed:

- `equirectangular-utility.md` — utility for re-projecting equirect → 8 perspective views or 6 cube faces using OpenCV. Documents the SfM-distortion problem and a CLI workflow. Maps onto the `splat360/pipeline/cubemap.py` implementation that already exists; this is the prose that ought to accompany the code.
- `OWL_360_CAMERA_SETUP.md` — guide for the OWL 360 Unreal Engine plugin (real-time 360 equirect rendering in UE5 at RTX-3080-Ti class). Hardware/software prereqs, install, OBS Spout output wiring. Niche but specific.
- `MONO_EYE_360_STREAMING_GUIDE.md` — mono-eye 360 streaming to YouTube. Covers POV vs third-person camera positioning, equirect rendering for YouTube Live, handheld mode. A solid reference for the "stream a 360 view of a live performance" use case.

None of these are in the site today. They are short and stand-alone — perfect raw material for journal posts or codex entries.

### The `.infrastructure/` directory

`D:\The_Hangar\.infrastructure\` is a mixed bag — older client work, research clones, utility scripts. Notable 360 finds:

- `components/pano_viewer.js` — a minimal Three.js panorama viewer class (lon/lat/phi/theta state, container-mounted, framework-free). Useful as a reference for "the absolute minimum" sphere-viewer.
- `clients/Eves-and-Grey/scripts/insta360_mqtt_bridge.py` + `probe_insta360.py` — a working bridge that talks to Insta360 Studio's local HTTP/WebSocket API (`localhost:63945`) over MQTT, plus a probe script that scans for the camera. This is *the* in-repo precedent for talking to an Insta360 Link programmatically. Worth resurrecting if a "live 360 camera control" surface ever lands.
- `clients/Eves-and-Grey/docs/Component_Reference_Expanded.md` + `Future_Expansion_Opportunities.md` + `Strategic_Expansion_Roadmap.md` — client docs that flag 360 capability in context. Lower priority; client-confidential.
- `clients/Eves-and-Grey/scripts/test_data/equirect_drone.png` + `equirect_ground.png` — two real equirect test images. Cannot lift to the site (client work) but they prove the equirect → SfM utility was developed against real data.
- `research/Samsy/threenext/examples/` — the threenext (three.js fork) reference examples include `webgl_panorama_equirectangular.html`, `webgl_panorama_cube.html`, `webgl_panorama_dualfisheye.html`, `webgl_video_panorama_equirectangular.html`, `css3d_panorama.html`, `css3d_panorama_deviceorientation.html`, `webvr_panorama.html` — the canonical Three.js patterns for every flavour of 360 viewer. MIT-licensed reference code. The right place to look for "how does Three.js officially handle dual-fisheye / cube / equirect / video equirect / device-orientation panorama / WebVR panorama".

### Folding plan additions

Updates the plan above:

- **Merge the `.merge-staging/_3DPOV/` 360 additions** — sanity schema, `splat-generate-360` capability, `heatmap-equirect` capability, two ComfyUI workflows, the London 360 walking article. These are pre-drafted, voice-checked, and ready. This is the biggest single unlock in the catalogue.
- **Three new codex / journal entries from the Obsidian notes** — port `OWL_360_CAMERA_SETUP.md`, `MONO_EYE_360_STREAMING_GUIDE.md`, `equirectangular-utility.md` into codex entries (with voice pass). They're standalone, short, and fill obvious gaps.
- **Reference the threenext examples in the codex** — the planned `pannellum-vs-photo-sphere-viewer-vs-marzipano` codex entry should also include "and the bare three.js patterns for each projection — see the official examples at threejs.org/examples". Document the official Three.js patterns as the baseline.

### Updated honest gaps

- Resurrecting `insta360_mqtt_bridge.py` for live 360 camera control is unowned but precedent exists.
- The OWL UE5 plugin path is a strict alternative to the splat360 / browser stack — UE5 captures rendered 360 at RTX speed, which the studio doesn't currently use. Worth flagging as "if a video-render workflow lands, UE5 + OWL is the precedent we already wrote about".
- The threenext `webvr_panorama.html` reference is the simplest WebXR 360 viewer pattern — if a `/vr-tour` ever splits off from `/sphere-tour`, that's the starting template.

## Where this lives

- This doc: `D:\.github\_3DPOV\docs\RESOURCES-360-SPHERICAL.md`
- Sibling: `D:\.github\_3DPOV\docs\RESOURCES-AESTHETIC.md`
- Existing 360 site surface: `D:\.github\_3DPOV\app\edit\`, `D:\.github\_3DPOV\components\studio\`, `D:\.github\_3DPOV\lib\studio\`, `D:\.github\_3DPOV\services\splat360\`, `D:\.github\_3DPOV\scripts\sort-equirectangulars.mjs`
- Source survey root: `D:\The_Hangar\` (read-only this pass)

The next 360 task in flight should reference this catalogue first, decide which folding-plan item lands, and add the new entries to the codex as it goes.
