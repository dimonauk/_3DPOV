# Learning Toys, Animations, and Outside Sources

The Holoflow courses are not walls of text. Each rung in each
ladder is hydrated with:

- **An interactive toy** the reader can play with in-browser at
  exactly the point that toy clarifies the concept.
- **Animations** (SVG, CSS, Lottie, or Three.js) for any concept
  where the time-axis matters.
- **Outside-source links** — the canonical reference for every
  named concept, so the reader who wants to go deeper has the
  right next door to open.

This document catalogues what already exists, what needs
building, and what external links land where.

The studio already has the muscle: six visualisers at
`/visualiser/*`, the atelier with `rig-simulator`,
`shader-station`, `gaze-heatmap`, and a stack of physics + maths
docs at `docs/PHYSICS-*.md` and `docs/MATH-*.md`. The work below
is mostly *placement* — which existing toy lands in which rung —
plus a finite list of new toys.

---

## The toy catalogue (existing + planned)

### Already shipping

| Toy | Route | What it shows | Best placement |
|---|---|---|---|
| Marching cubes visualiser | `/visualiser/marching-cubes` | Voxel grid → smooth surface, live | Fabrication R3, AI pipeline R3 |
| Reaction-diffusion | `/visualiser/reaction-diffusion` | TPMS / gyroid pattern generation | Fabrication R4 (lattices), Jewellery R3 |
| Strange attractor | `/visualiser/strange-attractor` | Lorenz / Aizawa systems | Curiosity hook for AI / generative rungs |
| Total internal reflection | `/visualiser/total-internal-reflection` | The angle at which light stays trapped in a waveguide | Fabrication R3 (waveguides), Photography R2 |
| Caustic projector | `/visualiser/caustic-projector` | Lens shape → caustic pattern on a surface | Photography R3, sculpture rungs |
| Laban dial | `/visualiser/laban-dial` | Movement notation for poi / fire / kata | Poi R1, Poi R2, performance rungs |
| Rig simulator | `/atelier/rig-simulator` | Build a POV rig in-browser before the bench | POV R2 — the central toy of that ladder |
| Shader station | `/atelier/shader-station` | Live shader playground | Blender R3, immersive shading rungs |
| Gaze heatmap | `/atelier/gaze-heatmap` | Where viewers actually look | Photography R5, composition rungs |
| Marching cubes — also a sculpture-gallery embed | `/sculpture-gallery` | Reader's own voxelisation result | Photography R4 capstone |

### Needs building — by ladder

The new toys are listed below per ladder. They're all
implementable inside the existing `/atelier/*` or `/visualiser/*`
conventions. The same Tailwind tokens, the same chrome-on-warm-black
identity, the same Three.js / React Three Fiber harness already in
use.

---

## Photography ladder — toys + animations + links

### Rung 1 — Camera fundamentals (manual exposure)

**Toy to build.** `/atelier/exposure-triangle`.

Three sliders: aperture (f-stop), shutter (seconds), ISO. As the
reader moves a slider, the on-screen sample image shifts
accordingly — depth of field changes with aperture, motion smear
changes with shutter, noise grain changes with ISO. The reader
plays with it until the trade-offs are visceral.

Three preset buttons for famous photographic situations: "studio
portrait", "moving subject at dusk", "the light-painted gesture
at 15s." Each preset locks two sliders and asks the reader to
pick the third — the testing-effect lever from
[LEARNING_PSYCHOLOGY.md](./LEARNING_PSYCHOLOGY.md).

**Animations.**
- Stop-doubling animation: a number line where stops double, with
  arrows showing reciprocity.
- f-stop diagram: aperture iris closing and opening, animated SVG.

**Outside-source links.**
- [Cambridge in Colour — Camera Exposure](https://www.cambridgeincolour.com/tutorials/camera-exposure.htm)
- [Wikipedia — Exposure value](https://en.wikipedia.org/wiki/Exposure_value)
- [Wikipedia — Reciprocity (photography)](https://en.wikipedia.org/wiki/Reciprocity_(photography))
- [Sean Tucker — long-exposure ethics](https://www.youtube.com/@seantuckerphoto) (the studio agrees with the line he draws around composites)

### Rung 2 — Your first long-exposure light painting (exists)

**Toy.** Reuse `/atelier/exposure-triangle` from R1, with light-painting preset locked.

**Toy to add.** `/atelier/exposure-stacker`. NOT actually stacking
— it's a teaching tool that shows the reader what a stacked
exposure WOULD look like, so they understand visually why the
studio refuses to do it. The lever is identity-based motivation
(LEARNING_PSYCHOLOGY.md lever 4): "you are the kind of
photographer who does it in one frame."

**Animations.**
- The shutter opening over 15 seconds with a kata being walked
  in front. SVG, played alongside the timer.

**Outside-source links.**
- [Picto Light Painting Tutorials](https://lightpaintingtutorials.com/)
- [Light Painting World Alliance](https://lpwalliance.com/)
- [Cambridge in Colour — Long Exposure](https://www.cambridgeincolour.com/tutorials/long-exposure-photography.htm)
- [Stopping down — DPReview glossary](https://www.dpreview.com/glossary/exposure/stopping-down)

### Rung 3 — Calibrating the Canon imagePROGRAF PRO-1100 (exists)

**Toy to build.** `/atelier/colour-soft-proof`.

A side-by-side that shows the same image rendered with the
monitor's default profile vs the paper's ICC profile (the latter
simulating how it'll come off the PRO-1100 on Hahnemühle
Photo Rag). Toggle the profiles; the colours shift; the reader
sees what soft-proofing is and why it matters.

**Animations.**
- The print head moving across paper, animated SVG.
- The gamut diagram (sRGB vs AdobeRGB vs ProPhoto vs the paper's
  actual gamut) — interactive 3D in LCh space.

**Outside-source links.**
- [Northlight Images — Keith Cooper's calibration writeups](https://www.northlight-images.co.uk/canon-imageprograf-pro-1100/)
- [Hahnemühle paper ICC profiles](https://www.hahnemuehle.com/en/digital-fineart/icc-profiles.html)
- [Argyll CMS — open-source colour management](https://www.argyllcms.com/)
- [Wikipedia — ICC profile](https://en.wikipedia.org/wiki/ICC_profile)

### Rung 4 — From photograph to 3D object (exists)

**Toy.** Reuse `/visualiser/marching-cubes` directly inline.

**Toy to build.** `/atelier/voxelise-your-photo`. Reader drops in
their own photograph; gets a voxelised + marching-cubes mesh
preview. Download STL. Optional: send to bureau for printing.

**Animations.**
- Voxel grid filling, then marching cubes smoothing it.
- The acrylic rod insertion step, animated cross-section.

**Outside-source links.**
- [Paul Bourke — marching cubes notes](http://paulbourke.net/geometry/polygonise/)
- [Wikipedia — Marching cubes](https://en.wikipedia.org/wiki/Marching_cubes)
- [Lorensen & Cline 1987 — the original paper](https://dl.acm.org/doi/10.1145/37402.37422)
- The studio's own [PHYSICS-LIGHT-PAINTING.md](./PHYSICS-LIGHT-PAINTING.md) for the optical context.

---

## Poi ladder — toys + animations + links

### Rung 1 — Sock poi to three-beat weave (to write)

**Toy to build.** `/atelier/poi-geometry`.

A 3D scene with two glowing tethered points (the poi heads)
orbiting the user's hand position. Reader controls phase, plane,
and beat. The scene shows the three-beat weave as a real geometric
trajectory, not just a text description. Slow-motion mode. Pause
at any beat position.

**Toy to reuse.** `/visualiser/laban-dial` for the notation layer.

**Animations.**
- The forward spin: SVG circle with tick marks for each rotation.
- The three-beat weave: side-on view with frame-by-frame ticks.

**Outside-source links.**
- [Home of Poi (HOP) tutorials](https://www.homeofpoi.com/tutorials/)
- [Drex Factor's poi pedagogy](https://www.youtube.com/@DrexFactor)
- [Poi Wisdom](https://poiwisdom.com/)
- [Spinners' Forum — flow arts community](https://www.spinners-forum.com/)
- [Wikipedia — Poi (performance art)](https://en.wikipedia.org/wiki/Poi_(performance_art))

### Rung 2 — Spinning fire poi safely (exists)

**Toy to build.** `/atelier/fire-site-planner`.

Top-down grid. Reader places themselves, their spotter, the fuel
tin, the burn-off pad, the exit path. Toy enforces minimum
distances (UK Health & Safety conventions) and flags violations
with red highlights. Doubles as a memory aid for the kit list.

**Animations.**
- The light-up sequence: SVG of poi entering flame, igniting,
  starting kata.
- Burn-down timeline: minutes-of-burn vs fuel volume.

**Outside-source links.**
- [Home of Poi — fire safety](https://www.homeofpoi.com/lessons/teach/Fire-Poi-Safety)
- [HSE — workplace fire safety (transferable principles)](https://www.hse.gov.uk/toolbox/fire.htm)
- [UK Fire Performers' Public Liability — the FAQ on /codex/insurance]

### Rungs 3-5 — Variation + performance (to write)

Toys: motion-trail recorder using webcam + MediaPipe pose.
Animation: kata-by-kata still photograph timeline.

Outside links: dance notation (Labanotation, Eshkol-Wachman),
movement studies, the original Pina Bausch documentary lineage.

---

## POV LED rigs ladder — toys + animations + links

### Rung 1 — Your first addressable LED (to write)

**Toy to build.** `/atelier/ws2812-timing`.

Live oscilloscope-style trace of the WS2812 NRZ protocol. Reader
clicks "send 0x80, 0x00, 0xFF" and watches the bit pattern
ripple out on a simulated data line. Voltage levels visible.
Reader sees why the 5V level shifter is necessary by toggling
"with shifter / without shifter" — the malformed signal at
3.3V looks wrong on the trace.

**Toy to reuse.** Embed schematic widget from
`/components/diagrams` for the wiring.

**Animations.**
- A single pixel cycling through HSV.
- The data → next-pixel chain animation. Light propagating along
  the strip.

**Outside-source links.**
- [Adafruit NeoPixel Überguide](https://learn.adafruit.com/adafruit-neopixel-uberguide)
- [WS2812 datasheet](https://cdn-shop.adafruit.com/datasheets/WS2812.pdf)
- [FastLED library](https://fastled.io/)
- [SparkFun — Hall-effect sensors](https://learn.sparkfun.com/tutorials/hall-effect-sensors)
- [TI TLC5927 datasheet](https://www.ti.com/lit/ds/symlink/tlc5927.pdf)
- [PJRC Teensy hardware timers](https://www.pjrc.com/teensy/td_pulse.html)

### Rung 2 — Building a POV LED rig (exists)

**Toy.** `/atelier/rig-simulator` is the central toy. Use it.

**Toy to add.** `/atelier/balance-calculator`. Reader inputs
chassis dimensions, LED strip length, battery weight, controller
weight. Toy computes moment of inertia, identifies imbalance,
suggests counterweight position. Concrete-first lever applied:
the maths emerges from the numbers, not the other way around.

**Animations.**
- A poorly-balanced rig wobbling in slow-motion (CSS keyframe).
- The same chassis well-balanced and steady.
- The Hall sensor reading magnet position — one rotation,
  ticked.

**Outside-source links.** Same as R1 list above, plus:
- [Adafruit — Teensy 4.1 product page](https://www.pjrc.com/store/teensy41.html)
- [OpenSCAD documentation](https://openscad.org/documentation.html)
- [The studio's own /articles/why-i-build-my-own-rigs]

### Rung 3 — Programming POV frames (exists)

**Toy to build.** `/atelier/cartesian-to-polar`.

Reader uploads an image. Toy shows it both as a Cartesian grid and
as a polar (angle, radius) re-projection. As they rotate the
"rig", they see how the image maps onto the swept arc. The aha is
visual.

**Animations.**
- The same image at 32 columns vs 100 columns vs 360 columns.
  Density-of-data demonstration.
- Gamma curve: 1.0 vs 2.2 vs 0.5, with sample image.

**Outside-source links.**
- [The studio's own /articles/why-i-build-my-own-rigs]
- [Wikipedia — Polar coordinate system](https://en.wikipedia.org/wiki/Polar_coordinate_system)
- [Charles Poynton — gamma FAQ](http://poynton.ca/notes/colour_and_gamma/GammaFAQ.html)

### Rungs 4-5 — Performance + signature (to write)

Toys: live preview of a poi performance with synthetic rig
overlay. Animations: side-by-side of real photograph with
simulated rig output. Outside links: chronophotography history
(Marey, Muybridge) and the contemporary practitioners listed in
`whoswho-uk-light-painters.tsx`.

---

## Drones ladder — toys + animations + links

### Rung 1 — Your first FPV drone flight (to write)

**Toy to build.** `/atelier/caa-flight-permission`.

Decision tree as widget. Reader inputs: drone weight, where they
want to fly, planned use (recreational / commercial), what's
within 50m. Toy returns: required CAA ops-ID, restrictions, the
specific regulation citation. Updated against current CAA rules.

**Toy to build.** `/atelier/stick-modes`. Two joysticks (left +
right), four mode toggles (1, 2, 3, 4). Reader sees which stick
controls throttle vs yaw vs pitch vs roll. The aha is
"mode 2 vs mode 4 is genuinely different; pick before muscle
memory locks in."

**Animations.**
- The four flight modes (angle, horizon, acro, manual) shown as
  the drone responding to identical stick input.
- Field-safe-zone diagram: line-of-sight cone, no-fly margins.

**Outside-source links.**
- [UK CAA — drones home](https://www.caa.co.uk/drones/)
- [Drone Pilot Academy — FPV intro course](https://www.dronepilotacademy.co.uk/product/fpv-introduction-course/)
- [UAVHub — drone training](https://www.uavhub.com/pages/drone-training-course)
- [Coptrz — GVC training](https://coptrz.com/shop/training/gvc-drone-training-course/)
- [BetaFlight — open-source FPV firmware](https://betaflight.com/)
- [TinyHawk official](https://emax-usa.com/collections/tinyhawk)

### Rung 2 — Capturing 360 with the Avata (to write)

**Toy to build.** `/atelier/fisheye-to-equirect`.

Reader drags a 360 dual-fisheye sample image; toy shows the
equirectangular projection. Reader can rotate the projection
sphere. Aha: equirectangular IS a projection; it's not the
camera's truth.

**Toy to reuse.** `/spatial` and `/visualiser/total-internal-reflection`
for the lens optics layer.

**Animations.**
- Dual-fisheye → equirect, step-by-step.
- Cinewhoop fly-through path animation, top-down annotated.

**Outside-source links.**
- [DJI Avata — official](https://www.dji.com/uk/avata)
- [Insta360 — equirectangular workflow](https://www.insta360.com/learning)
- [The studio's own /aerial page]
- [PTGui — panorama / 360 workflow](https://ptgui.com/)
- [Wikipedia — Equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection)

### Rungs 3-5 — Aerial cinematography + light-painting commission rungs.

Toys: a "shot-planning" canvas where the reader maps a route over
satellite. Animations: per-shot storyboard timeline.

Outside links: Drone Photo Awards, the studio's own /aerial page
showcasing the five-airframe fleet.

---

## Fabrication ladder — toys + animations + links

### Rung 1 — Your first SLA print (to write)

**Toy to build.** `/atelier/sla-exposure-tuner`.

Reader picks: resin type, layer height, light source. Toy returns:
exposure time per layer, lift speed, retract speed, recommended
test cube. Calibrated against the studio's own prints. Aha: this
isn't black magic; the parameters trade off in known ways.

**Toy to reuse.** `/visualiser/marching-cubes` linked from the
voxel-input optional path.

**Animations.**
- A single layer curing under the UV source. Top-down cross-section.
- The lift → retract → expose cycle, timeline.
- The cure chain — wash → dry → UV cure — animated flowchart.

**Outside-source links.**
- [All3DP — Quick start to resin 3D printing](https://all3dp.com/1/sla-resin-3d-printing-guide/)
- [Lychee Slicer documentation](https://mango3d.io/lychee-slicer)
- [Anycubic Photon / Saturn user community forums]
- [The studio's own PHYSICS-MATERIAL-SCIENCE-RESINS.md](./PHYSICS-MATERIAL-SCIENCE-RESINS.md)
- [Formlabs — Resin types and selection](https://formlabs.com/uk/materials/)

### Rung 2 — From photograph to 3D object (exists)

Same toys + links as Photography R4. The two ladders share this
rung intentionally.

### Rung 3 — Lighting a waveguide object (exists)

**Toy.** `/visualiser/total-internal-reflection` is the central
toy. Inline embedded.

**Toy to build.** `/atelier/waveguide-coupler`. Reader picks LED
type (chip, lens, viewing angle) and waveguide rod diameter +
length + material. Toy computes light transmission, scatter
profile, expected scattering intensity along the rod's length.

**Animations.**
- Light entering a rod at the critical angle vs outside it.
  Side-by-side. The first stays trapped; the second escapes.
- The same rod with five LED modes (steady, pulse, breathe,
  chase, off).

**Outside-source links.**
- [The studio's own PHYSICS-WAVEGUIDE-OPTICS.md](./PHYSICS-WAVEGUIDE-OPTICS.md)
- [Hyperphysics — Total internal reflection](http://hyperphysics.phy-astr.gsu.edu/hbase/phyopt/totint.html)
- [Wikipedia — Optical fibre](https://en.wikipedia.org/wiki/Optical_fiber)
- [Edmund Optics — Optical materials](https://www.edmundoptics.com/knowledge-center/application-notes/optics/optical-glass/)

### Rung 4 — Belt-printed wall reliefs (exists as article)

**Toy to build.** `/atelier/belt-print-layout`. Reader designs
their tile pattern; toy computes belt length needed, layer-line
direction, expected print time. Cross-links to bureau for the
printed result.

**Toy to reuse.** `/visualiser/reaction-diffusion` for TPMS-style
lattice patterns.

**Animations.**
- Belt advance + extrusion in real time.
- Single dragon-scale relief growing layer by layer.

**Outside-source links.**
- [Creality CR-30 — official](https://www.creality.com/products/cr-30-3dprintmill-3d-printer)
- [The studio's own /articles/belt-printed-wall-reliefs]
- [Reaction-diffusion — Wikipedia](https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system)

---

## AI pipeline ladder — toys + animations + links

### Rung 1 — Your first local AI image generation (to write)

**Toy to build.** `/atelier/comfyui-viewer`.

Read-only ComfyUI graph viewer. Reader clicks nodes to see what
each one does. Annotated with "this is the prompt", "this is the
sampler", "this is the VAE". Aha: ComfyUI's intimidation comes
from the graph; once labelled, it's obvious.

**Toy to build.** `/atelier/diffusion-steps`. Slider for number of
sampler steps (1-50). Sample image regenerates at each step
count. Reader sees the quality / time trade-off curve directly.

**Animations.**
- The denoising process: noise → image, sampled at each step.
- Embedded video: the studio's own first-generation, real-time.

**Outside-source links.**
- [ComfyUI — official GitHub](https://github.com/comfyanonymous/ComfyUI)
- [Stable Diffusion Art — local install guide](https://stable-diffusion-art.com/)
- [Hugging Face — model card for SDXL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)
- [Civitai — community model library](https://civitai.com/)

### Rung 2 — SAM2 segmentation (to write)

**Toy to build.** `/atelier/sam2-playground`.

Reader uploads an image; clicks anywhere; sees the mask. The
toy is a thin shim over the studio's own SAM2 batch
infrastructure — running locally on the bench when possible,
remote API as fallback. Aha: a single click produces a perfect
cutout. That is genuinely new in 2024 and the reader needs to
feel it.

**Toy to reuse.** `/sculpture-gallery` for browsing the
26k-image batch outputs.

**Animations.**
- Click → embedding → mask, three-stage diagram.
- SAM2 small vs SAM2 large on the same image, side by side.

**Outside-source links.**
- [Meta AI — Segment Anything 2 paper](https://ai.meta.com/research/publications/sam-2-segment-anything-in-images-and-videos/)
- [SAM2 — official GitHub](https://github.com/facebookresearch/sam2)
- [The studio's own scripts/sam2-batch.py — sample log](./../scripts/sam2-batch.py)

### Rung 3 — Nine seconds from prompt to printable (exists)

**Toy.** Reuse `/atelier/comfyui-viewer` and
`/visualiser/marching-cubes`. End-to-end: prompt → image → SAM2
mask → marching cubes → STL.

**Toy to build.** `/atelier/nine-seconds-live`. The whole pipeline
runs in the browser against a remote bench worker (the studio's
own machine via Tailscale Funnel). Reader gets their own
"nine seconds" with their own prompt. The result enters the
catalogue as an editioned SKU.

---

## Immersive ladder — toys + animations + links

### Rung 1 — Your first WebXR scene (to write)

**Toy to build.** `/atelier/first-r3f`. A React Three Fiber
playground embedded inline. Reader edits a JSX snippet; sees the
scene update; can switch to VR by clicking "enter VR" if they
have a headset. The aha is "this is just JSX."

**Toy to reuse.** `/atelier/shader-station` for the shading rung.

**Animations.**
- The WebXR render loop: render → submit → present. Per-frame
  animation.
- Controller input map, animated when the reader presses buttons
  on a connected controller.

**Outside-source links.**
- [Three.js Journey — Bruno Simon's course](https://threejs-journey.com/) (gold standard for Three.js teaching)
- [Three.js documentation](https://threejs.org/docs/)
- [React Three Fiber documentation](https://r3f.docs.pmnd.rs/)
- [WebXR Device API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [immersive-web.github.io — WebXR specs and demos](https://immersive-web.github.io/)

### Rung 2 — VR as a psychological system (exists)

Already an article. Toys: `/atelier/gaze-heatmap` for the attention
material. Animations: presence model diagrams (Slater's PI / PI).
Links: Mel Slater publications, Henrik Ehrsson body-swap
illusions, Daniel Kahneman attention work.

### Rungs 3-5 — VR POV controllers + Tilt Brush + cohesive worlds.

Existing toys: `/atelier/shader-station`. New toys: an embedded
glTF viewer for the bezel STL; a hand-controller pose viewer.

---

## Blender ladder (new) — toys + animations + links

### Rung 1 — Your first Blender scene (to write)

**Toy to build.** `/atelier/blender-cheat-sheet`. Interactive
hotkey reference. Reader hovers over each hotkey; sees a short
GIF of what it does.

**Toy to build.** `/atelier/blender-default-cube`. An inline R3F
scene that mirrors Blender's default cube — same lighting, same
camera position, same shading. Aha: "Three.js can render the same
thing." Bridges the Blender ladder to the Immersive ladder.

**Animations.**
- The Blender splash → file → save → render cycle. SVG
  flowchart, animated.

**Outside-source links.**
- [Blender Manual — official](https://docs.blender.org/manual/en/latest/)
- [Blender Guru Donut tutorial](https://www.youtube.com/playlist?list=PLjEaoINr3zgFX8ZsChQVQsuDSjEqdWMAD)
- [CG Cookie](https://cgcookie.com/)
- [Blender Stack Exchange](https://blender.stackexchange.com/)

### Rungs 2-6 — Geometry nodes / shading / rigging / tooling / pipeline.

Existing tutorials already cover all of these. Toys to add:

- `/atelier/geo-nodes-playground` — an embedded geometry-nodes
  graph viewer (read-only, links to .blend download).
- `/atelier/shader-graph-viewer` — same for shader nodes.
- `/atelier/mixamo-rigging-walkthrough` — animated step-by-step
  retarget.

Outside links per rung: the relevant Blender manual section, the
relevant Blender Guru episode, the relevant CG Cookie module.

---

## Cross-ladder media patterns

Some media types repeat across ladders. Defined once here so the
implementation is consistent.

### Code blocks

All code shipped in tutorials uses the same syntax-highlight theme
(matching the studio's chrome-on-warm-black scheme). Where code is
runnable in-browser (JavaScript, GLSL, Python via Pyodide), it's
rendered with an inline "Run" button.

### Equation rendering

Equations use KaTeX. Standard maths typography. Where an equation
is the heart of a concept (the marching cubes lookup table, the
LED column-to-angle mapping, the diffusion sampler step), it
gets its own dedicated block with a 1-line explanation underneath.

### 3D model embeds

GLB files render via `<model-viewer>` (Google's open-source web
component). Each model carries the same default lighting, the
same camera orbit, the same shadow material — visual coherence
(LEARNING_PSYCHOLOGY.md lever 16).

### Diagram conventions

All diagrams are SVG. Drawn with the studio's palette (chrome,
warm-black, pink-200 accent, occasional pink-400 emphasis). Text
in the diagrams uses the same font stack as the site body.

Re-usable diagram components live at `components/diagrams/` —
add new ones there, not inline in tutorials, so the pattern is
reusable across rungs.

### Video clips

MP4 H.264 1080p. Embedded with `<video controls preload="none"
poster="<thumb.jpg>">`. Long-form videos (over 60 seconds) get
chaptered. Captions are mandatory for clips that contain
spoken instruction; optional for ambient B-roll.

### External-link rendering

Existing convention from the tutorial entries (`underline
underline-offset-4 hover:text-pink-200` + the `↗` arrow). All
external links open in a new tab, `rel="noopener noreferrer"`.

---

## The build queue for new toys

Ranked by reader-value × cross-ladder reach. Top of queue gets
built first.

| # | Toy | Lands in rungs | Build effort |
|---|---|---|---|
| 1 | `/atelier/exposure-triangle` | Photography R1, R2, R5 | 2 days |
| 2 | `/atelier/ws2812-timing` | POV R1, R3 | 2 days |
| 3 | `/atelier/comfyui-viewer` | AI R1, R3 | 2 days |
| 4 | `/atelier/first-r3f` | Immersive R1, Blender R1 | 1 day |
| 5 | `/atelier/sla-exposure-tuner` | Fabrication R1 | 2 days |
| 6 | `/atelier/caa-flight-permission` | Drones R1 | 1 day (data-heavy) |
| 7 | `/atelier/poi-geometry` | Poi R1, R2 | 3 days (3D scene) |
| 8 | `/atelier/cartesian-to-polar` | POV R3 | 1 day |
| 9 | `/atelier/voxelise-your-photo` | Photography R4, Fabrication R2 | 3 days (worker) |
| 10 | `/atelier/sam2-playground` | AI R2 | 2 days (worker) |
| 11 | `/atelier/diffusion-steps` | AI R1 | 2 days |
| 12 | `/atelier/colour-soft-proof` | Photography R3 | 2 days |
| 13 | `/atelier/fisheye-to-equirect` | Drones R2 | 1 day |
| 14 | `/atelier/balance-calculator` | POV R2 | 1 day |
| 15 | `/atelier/blender-cheat-sheet` | Blender R1 | 1 day |
| 16 | `/atelier/waveguide-coupler` | Fabrication R3 | 2 days |
| 17 | `/atelier/exposure-stacker` | Photography R2 | 1 day |
| 18 | `/atelier/stick-modes` | Drones R1 | 1 day |
| 19 | `/atelier/belt-print-layout` | Fabrication R4 | 2 days |
| 20 | `/atelier/nine-seconds-live` | AI R3 capstone | 5 days (bench worker) |
| 21 | `/atelier/blender-default-cube` | Blender R1 | 1 day |
| 22 | `/atelier/geo-nodes-playground` | Blender R2 | 3 days |
| 23 | `/atelier/shader-graph-viewer` | Blender R3 | 2 days |
| 24 | `/atelier/fire-site-planner` | Poi R2 | 1 day |

Twenty-four toys. ~50 build days at one-person-on-the-bench cadence.

The 24 doubles as the studio's interactive-tools shopping list,
sellable as commissions to other practitioners' courses. Build
once, deploy across the studio's surface, also list as
white-label.

---

## The outside-source canon

Per concept-cluster, the canonical link the reader follows when
they want to go deeper than the studio's coverage. Once defined
here, every tutorial cross-links to the same canonical source —
visual coherence + earned trust (lever 16).

| Concept cluster | Canonical outside source |
|---|---|
| Camera fundamentals | Cambridge in Colour |
| Long-exposure photography | LightPaintingTutorials.com + LPWA |
| Colour management | Northlight Images (Keith Cooper) |
| Persistence-of-vision wiring | Adafruit NeoPixel Überguide |
| FastLED firmware | fastled.io |
| Teensy hardware | PJRC documentation |
| UK CAA drone law | caa.co.uk/drones |
| FPV firmware | BetaFlight documentation |
| 360 photography | PTGui documentation + Insta360 Learning |
| Resin 3D printing | All3DP guide |
| Slicing (Lychee) | mango3d.io documentation |
| Stable Diffusion | stable-diffusion-art.com |
| ComfyUI | comfyanonymous GitHub |
| SAM2 | Meta AI publication + facebookresearch/sam2 |
| Three.js | threejs.org docs + Bruno Simon's Three.js Journey |
| WebXR | immersive-web.github.io |
| Blender | docs.blender.org + Blender Guru |
| Geometry nodes | Erindale Woodford + Blender Manual |
| Cell shading | Lightning Boy Studio + CG Cookie |
| Marching cubes | Paul Bourke + Wikipedia + Lorensen-Cline 1987 |
| Reaction-diffusion | Karl Sims + Wikipedia |
| Optical waveguides | The studio's own PHYSICS-WAVEGUIDE-OPTICS.md + Hyperphysics |
| Poi technique | Home of Poi + DrexFactor |
| VR psychology | Mel Slater + Henrik Ehrsson + Daniel Kahneman |

These are the "doors out" the reader can walk through. The
studio's role is to be the first door, not the only one.

---

## Honest closing

Building twenty-four new toys is a meaningful amount of work.
The two-month build queue above is real. The good news: every
toy built unlocks not just one rung but multiple — the toys
are reusable across ladders by design.

The toys also serve a secondary purpose: they're the studio's
interactive showpiece pages, indexable by search engines, linkable
from elsewhere on the web. Each `/atelier/<toy>` page becomes a
SEO foothold AND a credibility marker AND a teaching tool AND a
white-label commercial offering.

Four functions, one build. That's the multiplier.

Now I'm going to start the queue.
