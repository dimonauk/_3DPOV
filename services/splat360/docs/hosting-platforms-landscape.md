# Splat / 360 / 3D Web Hosting Platforms — Competitive Landscape

Reference for the long-term "build all these features into ourselves"
roadmap. Compiled 2026-05-15. Companion to
[360-editor-feature-matrix.md](./360-editor-feature-matrix.md).

## The thesis

**The categories overlap, but no incumbent does all of it.** Every
platform in this doc picks one slice — splat-only, 360-only, mesh-only,
tour-only, editor-only, capture-only, commerce-only — and locks in.

The wedge is to be the single platform that **absorbs all the slices
into one coherent product**:

- Capture (any camera, any format)
- Edit (browser-native, multi-format)
- Train (splat / mesh / panorama)
- Host (universal)
- View (web + AR + VR)
- Embed (universal)
- Commerce (print-drop-ship + pay-to-download + editioned IP)
- Anchor (geo-located AR; HoloWalk-class outdoor trails)
- Author (no-code 3D for web, Spline-class)

Each row in the build roadmap below replaces one specific incumbent.
The compound moat is owning the workflow end-to-end — no other
platform makes the visitor walk through capture → edit → train →
deliver without leaving an ecosystem boundary.

The competitive read on each incumbent below is therefore not "how do
we beat them at their slice" but "how does the unified platform
**absorb their slice** as a feature."

## I. Splat-first platforms

Specialised for `.ply` / `.splat` / `.ksplat` / `.spz` Gaussian Splat
content. Capture apps + hosts + viewers.

### Capture apps (capture + own viewer + host)

| App | Owner | Cost | Capture method | Format(s) | Notable |
| --- | --- | --- | --- | --- | --- |
| **Scaniverse** | Niantic | Free, iOS+Android | LiDAR + photogrammetry | `.spz` export | **On-device processing.** Niantic VPS integration. Splatmap. |
| **Polycam** | Polycam Inc | Freemium ($8/mo) | LiDAR + photo | PLY export, 15+ formats | Cloud pipeline. Watermark-free embed needs Pro. UE5 integration. |
| **Luma AI** | Luma Labs | Free | Video (any phone) | PLY | **No longer actively developed** for mobile splat capture. |
| **KIRI Engine** | KIRI Innovations | Freemium | Photo + LiDAR + video | OBJ/FBX/STL/GLB/GLTF/USDZ/PLY/XYZ | 3DGS-to-mesh feature with USDZ export. |
| **Postshot** | Jawset | Paid one-time | Desktop trainer (not capture) | PLY | Top perceptual quality. Already in `splat360`. |

### Viewers / hosts (just view + share)

| Service | URL | Cost | Formats | Notes |
| --- | --- | --- | --- | --- |
| **SuperSplat** | superspl.at | Free | PLY, SPLAT, KSPLAT, SPZ, SOG | Browser editor + 1-click publish + share link. **Built on PlayCanvas.** OSS. |
| **Niantic Splat Viewer** | nianticspatial.com/splat-viewer | Free | SPZ | Official Niantic viewer. |
| **splat.host** | splat.host | Free | PLY, SPLAT, SPZ, KSPLAT | Drag-and-drop viewer. |
| **3DGSviewers.com** | 3dgsviewers.com | Free | All major | Viewer + format converter + cloud hosting. |
| **Polyvia3D SPZ viewer** | polyvia3d.com/splat-viewer | Free | SPZ | Private (no upload). |
| **Spark** (Niantic / World Labs) | sparkjs.dev | Free / OSS | Universal | Currently the production leader; OSS Three.js renderer. |

### Strategic read

**Three-tier market:**

- **Capture apps** are vendor-locked (Scaniverse → Niantic, Polycam → cloud account, Luma → Luma cloud). Each owns the data path.
- **SuperSplat** is the only credible **agnostic editor + host + publish** OSS option. Strong moat through PlayCanvas brand + ecosystem.
- **Spark** is winning developer mindshare for embedded viewing.

**Wedges open for us:**

1. **No splat host yet does professional collaboration** (multi-editor, comments, review-and-approve, version history). All three-tier services are single-user.
2. **No splat host commercialises print drop-ship** off splats. They host, they don't monetise. Holoflow's print-bar capability is exactly this.
3. **No splat host integrates with a geo-anchored AR layer** (HoloWalk territory). Niantic VPS + Scaniverse comes closest but only inside Niantic's wall.

## II. 360 video / panorama / virtual tour platforms

Spherical-image / video / tour territory. Mostly pre-splat era.

### Tour-first

| Platform | Pricing | Best for | Notable |
| --- | --- | --- | --- |
| **Matterport** | $99–$309/mo + Pro2 / Pro3 / Axis hardware | Real estate, enterprise digital twins | Industry leader. Hardware lock-in. ANSI Z765 floor plans on Pro tier. |
| **Panoee** | Free + $7/mo Pro | Budget Matterport alternative | "Best overall value" per multiple reviews. |
| **Kuula** | Free w/ branding + $12/mo Pro | Photography, hospitality | Smooth player; "lens flare effects". Unlimited tours on Pro. |
| **CloudPano** | $30–$1k+/mo | Automotive, enterprise sales | Industry-vertical templates. |
| **EyeSpy360** | varies | Live-guided tours | Tour-guide-on-call use case. |
| **iGUIDE** | hardware + sub | Professional floor plans | PLANIX camera + laser rangefinder, ANSI-grade plans. |
| **3DVista** | **One-time $499** | Self-hosted tours | No monthly fee; self-host. Outlier in the subscription market. |
| **Zillow 3D Home** | Free | Real-estate | Locked to Zillow listings ecosystem. |

### Panorama-first (lighter)

| Platform | Pricing | Notes |
| --- | --- | --- |
| **VeeR Experience** | Free | 360 photos + videos + 3D content. VR app. |
| **Marzipano** | Free (OSS-ish tool) | Build offline, self-host. No platform features. |
| **360Cities** | Free + curated | Photographer community + curated catalogue. |
| **Theta360 / Theta+** | Free (Ricoh's) | Theta-only ingest; Ricoh-managed. |
| **YouTube 360 / Vimeo 360** | Free | Mass-distribution but limited 3D-tour features. |

### Strategic read

- **Matterport has the brand**, but the hardware lock-in + subscription burn opens the entire mid-market to alternatives.
- **3DVista's one-time-purchase model** is the anti-Matterport. Profitable niche.
- **No 360 tour platform yet ingests splats** as a primary asset type. The whole category is panorama-tile-based.
- **Tour platforms could be deprecated** by splat-based walkthroughs once delivery bandwidth catches up — splats give 6DoF where panoramas give 3DoF (look-around but not move).

**Wedges open for us:**

1. **360 + splat hybrid tour** — primary navigation by splat (6DoF), fall back to panorama tiles where splats aren't viable. Nobody does this.
2. **HoloWalk-class outdoor trails** — the entire tour-platform market is indoor. Outdoor sculpture + landmark + heritage trails are an underserved sister category.
3. **One-time-purchase pricing in a recurring-revenue market** is the durable differentiator (3DVista proves this works).

## III. 3D model hosting

Mesh / GLB / FBX territory. Larger and older market.

| Platform | Owner | Cost | Notable |
| --- | --- | --- | --- |
| **Sketchfab** | Epic Games (since 2021) | Free + $15+/mo Pro | The category leader for embed + share. Now also accepts splats. |
| **TurboSquid** | Shutterstock | Per-model marketplace | Sketchfab's #1 competitor by traffic. |
| **CGTrader** | CGTrader | Per-model marketplace | #2 competitor; lower commissions than TurboSquid. |
| **Free3D** | — | Free | Asset marketplace. |
| **p3d.in** | independent | Free + $6/mo + $38/mo | Embed viewer + marketplace. Significantly cheaper than Sketchfab. |
| **Vectary** | Vectary | Free + Pro | Browser-based modeller + embed. |
| **SketchUp 3D Warehouse** | Trimble | Free | Architecture / SketchUp asset library. |
| **poly.pizza** | independent | Free | Curated Google Poly archive. |
| **Verge3D** | Soft8Soft | Free hosting (Blender add-on) | Hosting + sharing tied to Verge3D's Blender publishing. |
| **Cesium ion** | Cesium | Free tier + enterprise | Geospatial 3D tiles. Streamed LOD. |

### Strategic read

- **Sketchfab + TurboSquid + CGTrader** lock down ~80% of the mesh-asset distribution market. New entrants struggle.
- **p3d.in's pricing wedge** (10× cheaper than Sketchfab Pro) is the wedge that works.
- **Cesium ion** owns the geospatial 3D tile / streaming LOD market. Splats are starting to land in Cesium too.
- **Splat is the format disruption** — Sketchfab adopted it slowly; native splat-hosts (SuperSplat, Spark) are the cleaner entry.

## IV. Browser-native 3D editors

Tools that let you author 3D directly in a browser, no install.

| Tool | Owner | Cost | Output | Notable |
| --- | --- | --- | --- | --- |
| **Spline** | Spline | Free + $9–$20/mo | React components, iframe embed | Real-time collab + AI text-to-3D. Most-mentioned 2026 winner. |
| **Vectary** | Vectary | Free + Pro | GLTF/USDZ embed | Spline's main competitor. |
| **Womp** | Womp Inc | Free | Web embed | Sculpt-style modelling in browser. |
| **PlayCanvas Editor** | PlayCanvas | Free + Pro | Full WebGL/WebGPU games | Underpins SuperSplat. Game-engine class. |
| **Babylon.js Sandbox** | Microsoft | Free | Babylon-native | Code-first; less designer-friendly than Spline. |
| **Needle Engine** | Needle Tools | Free + paid | WebGPU embed, Unity-based authoring | Unity → web pipeline. Splat support strong. |

### Strategic read

- **Spline owns the no-code 3D-for-web category** in 2026. Hard to dislodge directly.
- **Editors that publish to splats specifically** (rather than mesh) is the underserved niche. SuperSplat is the only credible one.
- **AI-first 3D editing** (text-to-3D + edit in place) is Spline's wedge. Match or skip.

## V. The map — every incumbent owns a slice; nobody owns the whole

```text
              CAPTURE      EDIT         TRAIN       HOST        VIEW        EMBED       COMMERCE    ANCHOR
              ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
 Scaniverse   │   ✓      │ │   —      │ │   ✓     │ │   ✓     │ │   ✓     │ │  partial│ │   —     │ │  partial│
 Polycam      │   ✓      │ │  partial │ │   ✓     │ │   ✓     │ │   ✓     │ │   ✓     │ │   —     │ │   —     │
 Luma AI      │   ✓      │ │   —      │ │   ✓     │ │   ✓     │ │   ✓     │ │   ✓     │ │   —     │ │   —     │
 SuperSplat   │   —      │ │   ✓ light│ │   —     │ │   ✓     │ │   ✓     │ │   ✓     │ │   —     │ │   —     │
 Spark        │   —      │ │   —      │ │   —     │ │   ✓     │ │   ✓     │ │   ✓     │ │   —     │ │   —     │
 DJI Studio   │ via cam  │ │   ✓ 360  │ │   —     │ │   —     │ │ partial │ │   —     │ │   —     │ │   —     │
 Insta360 Std │ via cam  │ │   ✓ 360  │ │   —     │ │  partial│ │ partial │ │  partial│ │   —     │ │   —     │
 Kuula        │   —      │ │   ✓ pano │ │   —     │ │   ✓     │ │   ✓     │ │   ✓     │ │   —     │ │   —     │
 Matterport   │ via cam  │ │   ✓ tour │ │   —     │ │   ✓     │ │   ✓     │ │   ✓     │ │   —     │ │ indoor  │
 3DVista      │   —      │ │   ✓ tour │ │   —     │ │ self    │ │   ✓     │ │   ✓     │ │   —     │ │   —     │
 Sketchfab    │   —      │ │   —      │ │   —     │ │   ✓     │ │   ✓     │ │   ✓     │ │ partial │ │   —     │
 Spline       │   —      │ │   ✓ 3D   │ │   —     │ │   ✓     │ │   ✓     │ │   ✓     │ │   —     │ │   —     │
 KIRI Engine  │   ✓      │ │  partial │ │   ✓     │ │   ✓     │ │   ✓     │ │  partial│ │   —     │ │   —     │
 Niantic VPS  │   —      │ │   —      │ │   —     │ │  spatial│ │   ✓     │ │   ✓     │ │   —     │ │   ✓     │
 ─────────────┼──────────┼─┼──────────┼─┼─────────┼─┼─────────┼─┼─────────┼─┼─────────┼─┼─────────┼─┼─────────┤
 HOLOFLOW     │   ✓ all  │ │   ✓ all  │ │   ✓ all │ │   ✓ all │ │   ✓ all │ │   ✓ all │ │   ✓     │ │   ✓     │
              └──────────┘ └──────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Reading the row.** No incumbent above checks more than four boxes.
Most check two. The unified-platform position — every column ticked —
is genuinely vacant.

The risk isn't competition for any single column. It's losing focus
trying to ship them all at once. Sequencing matters more than feature
count.

## Build-roadmap implications

Ranked by gap-vs-effort:

1. **The web 360 editor** ([360-editor-feature-matrix.md](./360-editor-feature-matrix.md)) — first milestone. **Beats DJI Studio + Insta360 Studio at universality.** ~3-4 weeks for v0.1.

2. **Splat + 360 hybrid tour platform.** Combine the splat360 splat output with a Kuula-style panorama-tile tour for spots that don't justify a full splat. HoloWalk is the obvious first customer of this. ~4-6 weeks for v0.1 after editor.

3. **One-time-purchase pricing tier** for serious creators — anti-subscription play, follows 3DVista's model. Pricing decision, not engineering. Days.

4. **HoloWalk as the productised tour platform.** Outdoor + sculpture + sound + AR + QR — the entire underserved-by-Matterport tier. Already partially built.

5. **Print-drop-ship integrated into the viewer** — nobody does this. The Holoflow print-bar capability already exists; the wedge is wiring it into the splat / 360 / mesh viewer surfaces.

6. **No-code 3D-for-web editor (Spline territory)** — biggest market, hardest entry. Skip for v1.

## The absorption sequence — what to build into ourselves

The unified-platform thesis only works if we ship the columns in an
order that compounds. Each milestone has to leave us with a wider
column-set than the previous one, and each has to unblock the next.

| M | Milestone | Absorbs | Why now |
| --- | --- | --- | --- |
| **M1** | Web 360 editor | DJI Studio, Insta360 Studio, GoPro Quik (Edit column) | We already have ffmpeg + WebGPU + the OSV gotcha; nothing else does the format-agnostic Edit slice. |
| **M2** | Splat host + viewer + share | SuperSplat, splat.host, 3DGSviewers (Host + View + Embed columns) | M1 produces splat-ready captures; we need a place to deliver them. |
| **M3** | Splat editor (clean / crop / hotspots) | SuperSplat editor, KIRI cleanup (extends Edit) | Once people host with us, in-place editing closes the round-trip. |
| **M4** | 360 panorama tour host | Kuula, Panoee, Marzipano (Host + View for panorama tier) | HoloWalk needs lightweight panorama spots between heavy splat spots. |
| **M5** | Outdoor / sculpture trail tour | (no direct competitor) | The HoloWalk-class wedge; underserved tier. |
| **M6** | Splat capture mobile app | Scaniverse, Polycam, Luma (Capture column) | We already scaffolded HoloScan; finish the iPad pass. |
| **M7** | Splat → mesh → USDZ | KIRI Engine (iOS AR Quick Look) | Closes the iOS AR gap that's stalled the AR row otherwise. |
| **M8** | Print-drop-ship commerce in-viewer | TurboSquid / Sketchfab Store (Commerce column) | We already have the print-bar capability; this wires it everywhere. |
| **M9** | Geo-anchored AR | Niantic Lightship VPS (Anchor column) | Decision point: partner with Niantic or build VPS-lite ourselves. |
| **M10** | No-code 3D-for-web editor | Spline | Largest market, hardest entry; only after M1–M9 give us the audience. |

### What we already have on the absorption side

- **Edit (360)** — partial in DJI Studio / Insta360 Studio locally; missing on the web. M1 target.
- **Capture** — HoloScan scaffold is in place at `D:\.github\HoloScan\`. M6 target.
- **Train** — `splat360` engine is live with 5 SfM + 5 trainers. ✓ (the technical heart is done)
- **Host** — Holoflow site lives at `holoflow.co.uk`; needs splat-host surfaces. M2 target.
- **View** — `viz.splat-render` capability and `<SplatViewer>` / `<SplatArLayer>` components are wired.
- **Embed** — capability shape exists; needs the deploy capability to flesh out.
- **Commerce** — print-bar capability is partially built; needs Stripe + C2PA wiring.
- **Anchor** — magic-window AR works for HoloWalk; geo-anchored is the M9 step.

### Sequencing principle

**Each milestone must give the next one its source material.** M1 (web
editor) gives M2 (host) something to host. M2 gives M3 (in-place edit)
existing material to edit. M5 (outdoor trails) gives M6 (mobile
capture) a workflow to feed. By M8 we're charging money. M10 is the
audience-leverage move — only useful once the audience exists.

The trap is shipping M1–M10 in parallel and ending up with nine
half-platforms. Each column finished before the next begins.

## Sources

- [Gaussian splat tools comparison 2026 — The Future 3D](https://www.thefuture3d.com/blog/gaussian-splatting-software-tools-compared-2026)
- [SuperSplat — PlayCanvas](https://superspl.at/)
- [Niantic Spark — sparkjs.dev](https://nianticlabs.com/news/scaniverse4)
- [splat.host viewer](https://splat.host/tools/splat-viewer)
- [3DGSviewers.com (viewer + converter + cloud)](https://www.3dgsviewers.com/)
- [Niantic Splat Viewer](https://www.nianticspatial.com/splat-viewer)
- [Kuula features 2026](https://www.softwareadvice.com/presentation/kuula-profile/)
- [Matterport competitors 2026 — Panoee](https://panoee.com/matterport-alternative/)
- [3DVista — one-time purchase](https://panoee.com/best-virtual-tour-software/)
- [Sketchfab alternatives 2026 — Capterra](https://www.capterra.com/p/178043/Sketchfab-3D-Visualization/alternatives/)
- [p3d.in — cheaper Sketchfab alternative](https://rigorousthemes.com/blog/best-sketchfab-alternatives/)
- [Spline 2026 guide](https://medium.com/@abhinav.dobhal/spline-design-in-2026-the-complete-guide-to-building-immersive-3d-web-experiences-without-code-097f475b3951)
- [Cesium ion features](https://sourceforge.net/software/compare/Cesium-vs-Sketchfab/)
- [Niantic Scaniverse 4 + splatmap](https://nianticlabs.com/news/scaniverse4?hl=en)
- [Polyvia3D SPZ viewer](https://www.polyvia3d.com/splat-viewer/spz)
