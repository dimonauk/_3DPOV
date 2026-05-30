# Courses — Media Hydration Plan

What I need to capture, draw, film, and model to turn the
seven (eight, soon) curriculum ladders at `/learn` into something
that actually *teaches* a reader, rather than a wall of prose with
the occasional Wikipedia link.

The studio's position: every 3D demo model that lives inside a
tutorial becomes a **purchasable print-farm SKU** on this same
website. The course is the marketing; the model is the
catalogue entry. Bureau handles fulfilment. That changes the
specification — a "demo torus" written for a Blender tutorial
must also be a tidy, watertight, printable, post-process-tolerant
object that someone would actually pay £24 to put on a shelf.

This document is the shot list, the diagram brief, the modelling
brief, and the SKU manifest, all in one. Work top-down; the
ladders with the highest reader value-per-shot land first.

---

## 0. Cross-cutting media (write once, use everywhere)

The site already runs a `HeroPlate` component (see
`components/writing/hero-plate.tsx`) and falls back to a
chrome-sheen gradient when an entry has no `heroImage`. Every new
tutorial should ship with a hero so the ladder reads richly even
in the index card.

| Asset | Purpose | Where it lives | Format / size | Done? |
|---|---|---|---|---|
| Studio identity plate (chrome / dark) | Site-wide fallback | `public/assets/identity/` | 2400×1260 JPEG | yes |
| Per-tutorial hero plate | Top of `/tutorials/[slug]` | `public/tutorials/<slug>/hero.jpg` | 2400×1260 JPEG, < 300 KB | **needs new folder convention — see §11** |
| Per-tutorial OG card | Open Graph share image | `public/tutorials/<slug>/og.jpg` | 1200×630 JPEG, < 200 KB | new |
| Per-tutorial small thumbnail | Index card grid | `public/tutorials/<slug>/thumb.jpg` | 800×500 JPEG, < 80 KB | new |
| Studio chrome label PNG | Section dividers in long tutorials | `public/assets/labels/` | SVG preferred | optional |

Capture rule: every hero shot is a **single exposure**.
Composites are not used. This is part of the studio's editioning
ethic; it also keeps the catalogue defensible against any future
"is this AI?" challenge.

---

## 1. Photography ladder — `/learn` rung 1

### 1.1 Camera fundamentals (manual exposure) — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Diagram | The exposure triangle (aperture / shutter / ISO) | Three-circle Venn. SVG. The studio version should NOT use stops-as-coloured-rectangles; use ISO 12232 stop notation. |
| Diagram | Depth of field as a function of aperture | Lens cross-section + plane-of-focus illustration |
| Diagram | Reciprocity — how the stops trade | Number line per axis, ticked at full stops |
| Photo | A camera in manual mode — top-down on the bench, hands frame | Single exposure, studio bench, warm overhead |
| Photo | The same scene at f/2.8 vs f/8 vs f/16 | Three-up grid showing depth-of-field shift |
| Photo | The same scene at 1/250 vs 1/15 vs 30s | Three-up grid showing motion smear |
| Photo | Same scene at ISO 100 vs 1600 vs 12800 | Three-up grid showing noise |
| Video clip | 20-second loop: dial spin from f/22 → f/1.4 with focal-plane viewer | Optional. Better than a still for understanding. |
| 3D model | **None.** Pure photography rung. | — |

Existing asset to reuse: any frame from
`E:\Media\Images\Immersive\1_equirectangular\` after SAM thumbnail
pass — the `_thumbnail.jpg` sibling is the right shape for
illustrative grids when the demonstration doesn't need
photo-archival quality.

### 1.2 Your First Long-Exposure Light Painting — exists

What it still needs:

| Type | Asset | Notes |
|---|---|---|
| Photo | The first-exposure milestone — a single sparkler kata at 15s | Use one of the studio's earliest field captures, not a new one |
| Diagram | Camera placement, distance to subject, fall-off | Plan-view sketch |
| Video clip | The shutter-open kata, real-time | 20-second handheld; for the kinaesthetic |

### 1.3 Calibrating the Canon imagePROGRAF PRO-1100 — exists

What it still needs:

| Type | Asset | Notes |
|---|---|---|
| Photo | The printer at the bureau, top-down | Single exposure |
| Photo | An A4 test strip beside its target | Side-by-side, colourimetrically matched white |
| Diagram | The soft-proof workflow as a flowchart | Monitor → ICC → proof view → A4 → A2 → cure |
| Photo | Stack of finished, signed prints | Optional — provenance shot |
| Video clip | The printer running, ten seconds, head moving | For the texture |

### 1.4 From Photograph to 3D Object — exists

| Type | Asset | Notes |
|---|---|---|
| 3D model | The teaching exemplar — a small voxelised gesture | **PRINTABLE SKU.** ~80mm, SLA, ~£18-£24 retail. The reader sees it; the reader can buy it. |
| Diagram | Voxel grid → marching cubes → mesh, side by side | Already partially covered in marching cubes visualiser |
| Photo | The exemplar object, printed, on a 50mm-grid mat | Provenance shot |
| Photo | The acrylic rod insertion step | Two photos: before and after |
| Video clip | The cure step — UV chamber rotating | 10 seconds |

---

## 2. Poi ladder — `/learn` rung 2

### 2.1 Sock poi to three-beat weave — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Photo | A pair of sock poi on the bench | Single exposure |
| Diagram | The plane diagram — wall plane vs wheel plane vs split-time | Two-circle overlap, classic poi geometry |
| Diagram | The three-beat weave, ticked at each beat position | Eight-frame strip across the figure |
| Video clip | Forward spin, slow, hand only | 10 seconds |
| Video clip | Three-beat weave, slow, from front | 20 seconds |
| Video clip | Three-beat weave, full speed, eyes closed | 15 seconds — the kinaesthetic milestone |
| Photo | The "first knot" — when you fail | Honest |
| 3D model | **None directly.** A printable poi tether clip could anchor a §X cross-link. | Optional; logs in for Section 11. |

### 2.2 Spinning Fire Poi Safely — exists

What it still needs:

| Type | Asset | Notes |
|---|---|---|
| Photo | The kit laid out on a damp tarp before light-up | Singular shot of the discipline |
| Photo | The light-up itself, from a safe distance | 15s exposure if shot |
| Diagram | Safe site setup — fuel can position, spotter angle, exit path | Plan-view, dimensioned |
| Video clip | A full lit kata, mid-distance | 60 seconds; the field-recording register |

---

## 3. POV LED rigs ladder — `/learn` rung 3

### 3.1 Your First Addressable LED — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Photo | A WS2812 strip on a breadboard, illuminated | Single exposure |
| Diagram | The wiring — power, data, ground, level shifter | SVG schematic, drawn rather than KiCad-exported |
| Diagram | Pixel timing — the WS2812 NRZ protocol | Annotated waveform, 800kHz |
| Diagram | Why 3.3V data doesn't reliably drive a 5V strip | Two-trace eye-diagram sketch |
| Photo | A 74AHCT125 in its through-hole DIP, on the bench | Macro |
| Video clip | The first "blink" — single pixel cycling colours | 15 seconds, table-top |
| 3D model | **PRINTABLE SKU.** A through-hole prototype tray — 100×60mm, M3 mounting holes, slot for a Teensy + breadboard. | Sells for ~£14. Demonstrates the studio's "the bench has a shape" philosophy. |

### 3.2 Building a POV LED Rig — exists

What it still needs:

| Type | Asset | Notes |
|---|---|---|
| Photo | A finished studio rig, top-down on bench | Single exposure |
| Photo | The chassis CAD, exploded view | Rendered from OpenSCAD |
| Diagram | Mechanical balance — moment-of-inertia explained | Annotated free-body sketch |
| Diagram | Hall-sensor timing — magnet position, sense window | One full revolution, ticked |
| Video clip | The rig swinging in a dark room, shutter open | 10s captured in real-time alongside |
| 3D model | **PRINTABLE SKU.** The chassis itself — sold as a printed-and-shipped chassis ready for the reader to populate. ~£60. Bureau handles. |
| 3D model | **PRINTABLE SKU.** A clip-on POV bezel for Quest 3 / Steam Frame controllers (cross-links to /articles/vr-pov-controllers-the-product). ~£45-£60. |

### 3.3 Programming Frames for a POV Rig — exists

| Type | Asset | Notes |
|---|---|---|
| Diagram | Cartesian image → polar (angle, radius) mapping | Side-by-side grids |
| Diagram | Gamma — linear → display, as a curve | Standard 2.2 ramp |
| Photo | A test pattern photographed off the rig | The "did it work?" moment |
| Video clip | The same test pattern animated in software, then the same pattern photographed off the rig, side by side | The bridge between abstract and physical |

---

## 4. Drones ladder — `/learn` rung 4

### 4.1 Your First FPV Drone Flight — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Diagram | UK CAA op-id flowchart — when you need one, when you don't | Decision tree, dated 2026 |
| Diagram | The four flight modes — angle, horizon, acro, manual | Stick-input → drone-response per mode |
| Diagram | An empty field, marked safe — exit paths, line-of-sight, no-fly margin | Plan-view |
| Photo | A beginner drone (Tinyhawk-class) on the launchpad | Single exposure |
| Photo | The controller and goggles, top-down on a picnic blanket | Field register |
| Video clip | First hover, real-time from a third-person camera | 30 seconds |
| Video clip | First orbit, both POV and third-person | Split-screen, 30 seconds |
| 3D model | **PRINTABLE SKU.** A drone-toolkit case (250×180mm, foam-lined) with cutouts for the Tinyhawk + controller. ~£35. |

### 4.2 Capturing 360 with the Avata — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Photo | The Avata with the 360 module attached, on the bench | Single exposure |
| Diagram | Dual-fisheye → equirectangular projection | Two-circle → flat-rect, with ray tracing |
| Diagram | Mission plan for a cinewhoop fly-through — top-down with annotated waypoints | The studio's planning register |
| Video clip | A short 360 fly-through, served as MP4 with embedded `<iframe>` viewer | 30 seconds; this is the showcase |
| Photo | One frame extracted from the 360, as still equirect | Provenance shot |
| 3D model | **PRINTABLE SKU.** A 360 mounting harness for the Avata. ~£28. |

### 4.3 Aerial — the studio's fleet — exists

| Type | Asset | Notes |
|---|---|---|
| Photo | Five-airframe family portrait, top-down | Single exposure, already partially shot — see /aerial page |
| Diagram | Pipeline — capture → DaVinci → web delivery | Flowchart |

---

## 5. Fabrication ladder — `/learn` rung 5

### 5.1 Your First SLA Print — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Photo | A small resin printer on the bench (Saturn 4, Mars 5, etc.) | Single exposure |
| Photo | A successful test cube, off the build plate | Provenance |
| Diagram | The SLA cure cycle — layer time, lift, retract, expose | Annotated timing graph |
| Diagram | Anatomy of a print — supports, raft, plate-adhesion zone | Cut-away sketch |
| Diagram | The cure chain — wash → dry → UV cure → finish | Flowchart |
| Video clip | A layer exposing, top-down through the vat | 15 seconds, careful UV-safe shot |
| Video clip | The first lift, slow | 10 seconds |
| 3D model | **PRINTABLE SKU.** The test cube file itself — a 30mm SKU with intentional features (boss, overhang, hole, bridge) for diagnosis. ~£8. The diagnostic object is also the catalogue object. |

### 5.2 From Photograph to 3D Object — covered in §1.4

### 5.3 Lighting a Waveguide Object — exists

| Type | Asset | Notes |
|---|---|---|
| Photo | A finished waveguide piece in studio light, then in dark with LED active | Two single exposures, paired |
| Diagram | LED → coupling → light guide → scattering, optical path | Annotated cross-section |
| Diagram | CRI vs lumens trade-off — why CRI matters for waveguides | Two-axis comparison |
| Video clip | The same piece in five different modes (steady, pulse, breathe, chase, off) | 30 seconds total |
| 3D model | **PRINTABLE SKU.** A small waveguide-ready resin sculpture, ~£35, includes the channel for a 3mm acrylic rod (sold separately or in a kit). |

### 5.4 Belt-printed Wall Reliefs — exists as article

| Type | Asset | Notes |
|---|---|---|
| Photo | The CR-30 belt mid-print, dragon-scale relief emerging | Single exposure |
| Photo | A finished relief, wall-mounted, 1m long | Single exposure |
| Diagram | The belt-print geometry — angle, layer-line direction, length-vs-width | Annotated isometric |
| Video clip | Belt advance + extrusion, real-time | 30 seconds |
| 3D model | **PRINTABLE SKU.** A 200mm dragon-scale relief tile. ~£40 for a single tile, or sold in 4/8/16-piece arrays. The catalogue's flagship belt-print product. |

---

## 6. Local AI ladder — `/learn` rung 6

### 6.1 Your First Local AI Image Generation — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Screenshot | ComfyUI's default text-to-image graph, annotated | PNG with overlay arrows + labels |
| Screenshot | The model-selection dialog, with the right SDXL checkpoint chosen | PNG |
| Diagram | Sampler step count → image quality, as a curve | Empirical; from the studio's own runs |
| Diagram | Local AI vs API — privacy, latency, cost | Three-axis comparison |
| Photo | The bench — GPU lit up, the workstation tower visible | Single exposure |
| Video clip | A full generation playing out in ComfyUI, sped up 4× | 20 seconds |
| 3D model | **None** for this rung directly. Cross-links to §6.3. |

### 6.2 SAM2 Segmentation — new tutorial

Note: this tutorial is paired with the SAM batch job that just ran
against `E:\Media\Images\Immersive\`. Use the outputs as
illustrations — they're already the studio's own work.

| Type | Asset | Notes |
|---|---|---|
| Screenshot | A SAM2 mask overlaid on a studio photograph | Use one of the 26k `_sam/<stem>/preview.png` outputs |
| Screenshot | The masks.npz unpacked — array shape, dtype | Terminal capture |
| Diagram | Click → embedding → mask pipeline | Three-stage diagram |
| Diagram | Why SAM2 vs SAM1 — small/large checkpoint trade-off, on the same image | Side-by-side |
| Video clip | Click-and-segment in real-time | 15 seconds |
| 3D model | **None** for this rung directly. |

### 6.3 Nine Seconds from Prompt to Printable — exists as article

| Type | Asset | Notes |
|---|---|---|
| Screenshot | The orchestrator's terminal output, nine seconds total | Single still |
| Photo | The printed result — held in hand, single exposure | Provenance |
| Diagram | The pipeline — prompt → SDXL → SAM2 → marching cubes → STL | Five-stage flow |
| Video clip | The actual nine seconds, screen capture + bench cutaway | 30 seconds (sped + real-time mix) |
| 3D model | **PRINTABLE SKU.** The "Nine Seconds Demo Object" — every reader generates one variant; the studio prints the canonical-prompt version. Each generation is editioned at /edition/<seed>. ~£20. |

---

## 7. Immersive ladder — `/learn` rung 7

### 7.1 Your First WebXR Scene — new tutorial

| Type | Asset | Notes |
|---|---|---|
| Screenshot | A minimal Three.js scene in the browser, with controllers visible | PNG |
| Screenshot | The same scene in Quest 3 browser, taken via cast | PNG |
| Diagram | The WebXR rendering loop — render → submit → present | Per-frame |
| Diagram | Controller input mapping — buttons, triggers, axes | Pad diagram |
| Video clip | The reader's first controller wave, mirrored on a flat-screen | 20 seconds |
| 3D model | **PRINTABLE SKU.** A clip-on Quest 3 controller dock for a desk — holds both controllers vertically. ~£18. |

### 7.2 VR as a Psychological System — exists as article

| Type | Asset | Notes |
|---|---|---|
| Diagram | The four psychological pillars (presence, embodiment, attention, telepresence) | Four-quadrant |
| Diagram | Slater's Place Illusion + Plausibility Illusion, illustrated | Two-axis |

### 7.3 VR POV Controllers — exists as article

| Type | Asset | Notes |
|---|---|---|
| Photo | The bezel attached to a Quest 3 controller | Single exposure |
| Photo | Same bezel, lit, in a dark room | The marketing shot |
| Diagram | Tracking volume of the bezel within Quest 3's inside-out FOV | Top-down |
| 3D model | **PRINTABLE SKU.** The bezel itself. The flagship hardware product. ~£60. |

### 7.4 Sellotape and Tilt Brush — exists as article

| Type | Asset | Notes |
|---|---|---|
| Photo | The original prototype, recovered from a box | If still exists — provenance shot |
| Diagram | The 2010 prototype's coordinate frame vs Tilt Brush's | Side-by-side |

---

## 8. Proposed eighth ladder — Blender (gap)

The site already has thirty-plus Blender tutorials. There is no
ladder. This needs to land before any new Blender pieces are
written; the existing tutorials should be slotted in.

Proposed rungs:

1. **Your First Blender Scene** — new. Default cube, viewport
   navigation, save the file, render.
2. **Modelling with Geometry Nodes** — slot in
   `blender-tutorial-geo-nodes-low-poly-terrain` and friends.
3. **Shading: Cel, Toon, and Cohesive Worlds** — slot in
   `blender-tutorial-eevee-toon-cel-shader`, the cohesive-VRM
   article.
4. **Rigging and Animation** — slot in armature-weight-paint,
   shape-keys-morph-targets, nla-action-clips-vrm.
5. **Tooling — Add-ons and MCP** — slot in the eight add-on
   tutorials + four MCP demos.
6. **Blender to Site Asset Pipeline** — already exists.

Media for the new "Your First Blender Scene" rung:

| Type | Asset | Notes |
|---|---|---|
| Screenshot | The Blender splash, the default cube, the file menu, the save dialog | Five PNGs |
| Diagram | The viewport navigation map — middle-click, scroll, shift+middle | Annotated controller diagram |
| Diagram | The four editor panes most-used + their hotkeys | Cheat-sheet card |
| Video clip | A complete render-cube-export-cycle, sped up | 60 seconds |
| 3D model | **PRINTABLE SKU.** The Blender cube itself — 50mm aluminium-finish resin print. Tongue-in-cheek; sells anyway. ~£12. |

---

## 9. The 3D-model → print-farm SKU pipeline

Every 3D model listed above as a **PRINTABLE SKU** follows the
same path:

1. **Model.** Modelled to the bureau's tolerances:
   minimum wall thickness 1.2mm SLA / 1.6mm FDM, no overhangs
   greater than 45° unsupported, watertight (no holes, no
   non-manifold edges, no self-intersections), oriented for the
   most-natural print direction.
2. **Provenance sidecar.** Written via
   `D:\The_Hangar\scripts\biggo-sidecar.ps1` — schema
   `course_sku_v1`, with the tutorial slug, the SKU price band,
   the bureau ID, the print farm, and the materials list.
3. **Catalogue entry.** Lands at `/bureau/courses/<slug>` as
   a `BureauItem`; bureau cart already supports
   tutorial-cross-linked items.
4. **Reader path.** Each tutorial gets a small kit-block at the
   bottom: "The object you just learned to make is available
   from the bureau." Single CTA. No upsell stack.
5. **Provenance on shipped object.** Every printed-and-shipped
   piece carries the editioning sidecar in the QR code printed on
   the box flap. The reader who bought the object gets the same
   `course_sku_v1` JSON that the studio holds.

### SKU catalogue summary

| SKU | Tutorial | Material | Size | Price band | Status |
|---|---|---|---|---|---|
| `cse-photo-exemplar` | From Photograph to 3D Object | SLA resin | 80mm | £18-£24 | model exists, needs catalogue entry |
| `cse-tray-prototype` | Your First Addressable LED | FDM PLA | 100×60mm | £14 | needs model |
| `cse-rig-chassis` | Building a POV LED Rig | FDM ASA | 280mm long | £60 | model exists |
| `cse-bezel-quest3` | VR POV Controllers | SLA resin | 70mm | £45-£60 | model exists |
| `cse-drone-case` | Your First FPV Drone Flight | FDM PLA | 250×180mm | £35 | needs model |
| `cse-avata-mount` | Capturing 360 with the Avata | SLA resin | 90mm | £28 | needs model |
| `cse-test-cube` | Your First SLA Print | SLA resin | 30mm | £8 | needs model |
| `cse-waveguide-mini` | Lighting a Waveguide Object | SLA resin + acrylic rod | 100mm | £35 | model exists |
| `cse-belt-relief` | Belt-printed Wall Reliefs | FDM PETG | 200mm tile | £40 single / arrays | model exists |
| `cse-nine-seconds-canonical` | Nine Seconds Prompt to Printable | SLA resin | varies | £20 | model exists |
| `cse-controller-dock` | Your First WebXR Scene | FDM PLA | 120mm | £18 | needs model |
| `cse-blender-cube` | Your First Blender Scene | SLA resin, aluminium finish | 50mm | £12 | needs model |

Eleven new SKUs, of which seven need modelling, four exist.
The seven new models are the most-efficient single batch of
modelling work — each unlocks both a tutorial AND a catalogue
listing.

---

## 10. Capture priority — what to film, shoot, draw first

Sorted by reader-value × unlock-multiplier. Each item below
unlocks at least one ladder rung; some unlock several.

1. **Bench shots — the studio at work, top-down.** Hero plate
   material for half the tutorials. One afternoon of careful
   single-exposures unlocks ~12 hero slots.
2. **Diagrams: exposure triangle, WS2812 wiring, SLA cure cycle,
   marching cubes.** These are reused across multiple tutorials.
   Drawn once; cited everywhere.
3. **Bezel-attached-to-Quest 3 photograph.** Flagship product
   shot; unlocks VR POV Controllers, the WebXR rung, and the
   bureau hero card.
4. **The "first generation" screen capture for ComfyUI.** Anchors
   two rungs of the AI ladder.
5. **A 30-second 360 fly-through.** Anchors the Avata rung and
   the /aerial page. Bonus: the same MP4 powers the spatial page
   demo.
6. **The dragon-scale belt-print, fresh off the printer.** Anchors
   the fabrication ladder and the belt-printed-wall-reliefs
   article. Honest "this is what 200mm looks like off the belt."
7. **One full kata, photographed.** Anchors the poi ladder and
   half the journal.

After those seven, everything else is per-tutorial detail work.

---

## 11. Filing convention

Per-tutorial media goes into:

```
public/tutorials/<slug>/
  hero.jpg              # 2400×1260, < 300 KB
  og.jpg                # 1200×630, < 200 KB
  thumb.jpg             # 800×500, < 80 KB
  diagrams/             # SVG preferred, PNG fallback
    01-<short-name>.svg
    02-<short-name>.svg
  shots/                # supporting photographs
    01-<short-name>.jpg
  clips/                # video clips, MP4 H.264 at 1080p
    01-<short-name>.mp4
  models/               # 3D demo models, glb + STL
    <sku-slug>.glb
    <sku-slug>.stl
```

The dynamic tutorial page (`app/tutorials/[slug]/page.tsx`)
already reads `entry.heroImage`. The other media slots will need
small additions to the entry shape — proposal pending in
`docs/ARTICLES_REGISTRY_SPLIT.md` follow-up.

---

## 12. What I am NOT building media for in this pass

- The forty-odd existing Blender add-on / geometry-node / cel-shader
  tutorials. Those carry their own embedded media or screenshots.
  When the Blender ladder lands they'll be slotted in as-is.
- The emulator tutorials (six of them). Same reasoning — they
  carry their own captures.
- The article entries. Articles are essays; they get one hero and
  no further media. The ladder rungs that point at articles
  inherit the article's hero.
- The journal entries. Journal is field-record register; new
  hero is appropriate only when a journal piece is newly
  published. Past entries keep their existing plates.

---

## 13. The honest summary for people who skimmed

- Seven ladders exist; one more (Blender) needs adding.
- Nine ground-level tutorials are missing prose. The prose is
  in flight (see `docs/COURSES_WRITING_PLAN.md` — to land
  alongside this one).
- Forty-odd media items are needed to hydrate them.
- Eleven of those items are 3D models. Seven need new
  modelling work; four already exist in the studio archive.
- Every 3D model doubles as a print-farm SKU.
- The shot priority is: bench shots, reusable diagrams, the
  flagship product photographs.
- Filing convention is `public/tutorials/<slug>/{hero,og,thumb,
  diagrams,shots,clips,models}/`.

Now I am going to model the test cube and the prototype tray.
