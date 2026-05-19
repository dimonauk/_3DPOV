# Perfect-World Shopping List — Blender + Unreal 5.6

**Voice:** workshop-Dimona. **Spelling:** British. **Date written:** May 2026. **Scope:** aspirational toolkit for a one-person studio doing WebXR + cel-shaded + low-poly + 3D-print + VR/AR work, written as if budget and weekends were both infinite.

> Coordination note. This is the wish-list. The catalogue of what is **actually wired today** lives in `docs/BLENDER-EXTENSIONS.md` (a separate agent owns it). The 360 / spherical-scan side lives in `docs/RESOURCES-360-SPHERICAL.md`. Don't read this file for what's installed — read it for what we'd buy if a chequebook fell from the sky.

---

## 1. Why this exists

Direction (2026-05-19): *"build a perfect-world shopping list of extensions and plugins for blender and unreal 5.6"*.

This is the studio's shopping list, written as if I walked into a fully-funded workshop bench tomorrow with no constraints. The honest job of a list like this is to draw the line between **kit that would pay back in a week** and **kit that's mostly vanity** — because the most expensive mistake a one-person studio can make is buying the tool everyone on Twitter raves about, opening it three times, and then renewing the subscription for two years out of guilt.

So every entry below is tagged with a tier (Starter / Balanced / Full) and the honest verdict. The Starter tier is the bench you can stand up today for nothing. The Balanced tier is what I'd actually buy if I had a £1,500 budget and a quiet weekend to set it up. The Full tier is what the studio would own if the budget were genuinely infinite.

I've been honest about commercial cost where I could verify it. Anything I couldn't pin to a confirmed source is flagged **UNCONFIRMED** inline — don't quote those at the bank.

---

## 2. Three tiers + total cost estimate

### Starter — £0

Free / open-source only. The bench a one-person WebXR studio can stand up this afternoon. Covers the entire pipeline from modelling through export — Blender + the half-dozen most-loved free add-ons + glTF/VRM export + Unreal itself (which is free until you cross $1M revenue). The honest take: **the Starter bench can ship 90% of the work**. The commercial tools below are for speed, comfort, and the last 10%.

### Balanced — ~£500-£1,500 one-off + ~£150/year recurring

The handful of commercial tools that genuinely pay back fast for this studio's mix of work. Centred on hard-surface modelling acceleration (Hard Ops + Boxcutter), rigging (Auto-Rig Pro), UV packing (Zen UV), retopo (Retopoflow), one render booster (K-Cycles), and an asset library subscription (BlenderKit Full). Plus Cascadeur Indie for animation. No Substance subscription — the open-source painters are now good enough that £25/month is hard to justify for a part-time texturer.

### Full — ~£5,000-£15,000 one-off + ~£1,500/year recurring

Everything. Adds Houdini Indie, Marvelous Designer, Marmoset Toolbag, Substance Painter (perpetual not subscription), 3DCoat, the MACHIN3 stack (MESHmachine + DECALmachine), FLIP Fluids, plus the commercial Unreal stack — Stylized Rendering System, Auto Material, Convai for AI characters, the works. This is what a studio with a small team and paying clients would justify.

Each tier rolls forward — Balanced includes Starter, Full includes Balanced.

---

## 3. BLENDER — the shopping list

Tier key: **S** = Starter (free), **B** = Balanced, **F** = Full.

### 3.1 Modelling accelerators

| Name | Source | Licence | Cost (2026) | Tier | Role |
|---|---|---|---|---|---|
| Hard Ops + Boxcutter Bundle | [superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle](https://superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle) | Commercial, perpetual | ~$38 / £30 lifetime bundle | B | The canonical hard-surface accelerator. Cuts, bevels, booleans without the menu-trawling. Pays for itself in one afternoon. |
| MACHIN3tools | [machin3.gumroad.com/l/MACHIN3tools](https://machin3.gumroad.com/l/MACHIN3tools) | Commercial | $5 Prime / $15 DeusEx | B | Smart workflow utilities — focus, mirror, smart-edit-mode, asset drop. Cheap, ubiquitous, every modeller eventually installs it. |
| MESHmachine | [machin3.io](https://machin3.io) (via Superhive) | Commercial | ~$45 base | F | Non-destructive bevel/chamfer/blend on existing geometry. Fixes the bevels-after-the-fact problem Hard Ops can't. |
| DECALmachine | [machin3.io](https://machin3.io) (via Superhive) | Commercial | ~$55 base | F | Sticker-decal hard-surface detail. Brilliant for sci-fi, mecha, panel-line work. |
| Cablerator | [Superhive](https://superhivemarket.com) (search Cablerator) | Commercial | UNCONFIRMED, ~$25 | F | Cables, hoses, ropes drawn directly in the viewport with physics. Niche but a huge time-saver when needed. |
| Bagapie | [Superhive](https://superhivemarket.com) (search Bagapie) | Commercial | UNCONFIRMED, ~$25 | F | Geometry-Nodes-driven asset library — buildings, props, scatter. |
| Mira Tools | [github.com/mifth/mifthtools](https://github.com/mifth/mifthtools) | Free, GPL | £0 | S | Free curve-based modelling and surface-fitting tools. |

### 3.2 Retopology + topology helpers

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Retopoflow 4 | [superhivemarket.com/products/retopoflow](https://superhivemarket.com/products/retopoflow) | Commercial | ~$86 individual | B | The retopo workhorse. Strips, contours, polypen, all in one mode. The Balanced tier's first big-ticket buy. |
| QuadRemesher | [exoside.com/quadremesher](https://exoside.com/quadremesher) | Commercial | ~$109/yr indie UNCONFIRMED | F | Automatic quad-flow retopo. When you don't have time to do it by hand. |
| Speedretopo | [Superhive](https://superhivemarket.com) (search Speedretopo) | Commercial | UNCONFIRMED, ~$20 | F | Quick contour-strip retopo. Cheaper, less polished than Retopoflow. |
| Built-in Shrinkwrap + Surface Snap | Blender 5.x | GPL | £0 | S | Honestly, this gets you 60% of the way for low-poly work. |

### 3.3 UV unwrapping + packing

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Zen UV | [superhivemarket.com/products/zen-uv](https://superhivemarket.com/products/zen-uv) | Commercial | ~$39 | B | Best-in-class UV editing add-on. Marks, unwraps, transfers, packs. The UV equivalent of Hard Ops. |
| UVPackmaster 4 | [uvpackmaster.com](https://uvpackmaster.com) | Commercial | UNCONFIRMED, ~$70 Pro | F | GPU-accelerated packing. If you're packing 200 islands, this is the buy. |
| UV-Packer (3d-io) | [uv-packer.com/download](https://www.uv-packer.com/download/) | Free | £0 | S | The free packer from 3d-io. Not as fast as Packmaster but genuinely good. Use this first. |
| Smart UV Project (built-in) | Blender 5.x | GPL | £0 | S | The default. Surprisingly serviceable for hard-surface and prop work. |

### 3.4 Texturing + painting

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| BPainter | [bpainter.artbyndee.de](https://bpainter.artbyndee.de/) | Commercial | ~$40 UNCONFIRMED 2026 | F | Layered texture painting inside Blender. The native paint mode is fiddly; BPainter makes it Photoshop-shaped. |
| PBR Painter 3 | [superhivemarket.com/products/pbr-painter](https://superhivemarket.com/products/pbr-painter) | Commercial | UNCONFIRMED, ~$30 | F | Alternative layered painter, more PBR-focused. |
| Built-in Texture Paint | Blender 5.x | GPL | £0 | S | The default. Functional for stylized / cel-shaded work, painful for PBR. |
| Krita (companion) | [krita.org](https://krita.org) | Free, GPL | £0 | S | Best free 2D painter, period. Sits next to Blender for hand-painted textures and concept work. |

### 3.5 PBR + material libraries

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| BlenderKit (Free tier) | [blenderkit.com](https://www.blenderkit.com) | Subscription / free tier | £0 free, $14.90/mo Full | S/B | Integrated browser for assets, materials, HDRIs. Free tier covers a surprising amount; Full plan opens the whole library. |
| Lily Surface Scraper | [github.com/eliemichel/LilySurfaceScraper](https://github.com/eliemichel/LilySurfaceScraper) | Free, MIT | £0 | S | Right-click a Polyhaven/AmbientCG/PolygonTextures URL, get a Cycles/EEVEE material auto-built. Free, magical. |
| Poliigon Blender Bridge | [poliigon.com](https://poliigon.com) | Subscription, varies | UNCONFIRMED | F | If you pay for Poliigon, get the bridge. Otherwise skip — Lily Surface gets you their free tier for nothing. |
| AmbientCG (browser only) | [ambientcg.com](https://ambientcg.com) | CC0 | £0 | S | The CC0 PBR library. Pair with Lily Surface. The single best free texture resource on the internet. |

### 3.6 Sculpting + brush packs

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Built-in Sculpt Mode | Blender 5.x | GPL | £0 | S | Blender's sculpt mode is genuinely good now — multires, dyntopo, voxel remesh. The Starter does fine here. |
| FlippedNormals brush packs | [flippednormals.com](https://flippednormals.com) | Commercial, varies | $20-$50/pack | F | Skin, fabric, hard-surface brush packs. Buy one good pack, not five. |
| Speedsculpt | [Superhive](https://superhivemarket.com) (search Speedsculpt) | Commercial | UNCONFIRMED, ~$25 | F | Block-out sculpting with quick primitive shapes. |

### 3.7 Rigging + animation

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Auto-Rig Pro | [superhivemarket.com/products/auto-rig-pro](https://superhivemarket.com/products/auto-rig-pro) | Commercial | UNCONFIRMED, ~$50 | B | Auto-rig with Unity / Unreal / Godot export presets. Saves days on every character. |
| Rigify (built-in) | Blender 5.x | GPL | £0 | S | The default meta-rig system. Good for first attempts, weaker on export. |
| Wiggle 2 | [github.com/shteeve3d/blender-wiggle-2](https://github.com/shteeve3d/blender-wiggle-2) | Free, GPLv3 | £0 | S | Secondary motion (hair, tails, antennae). Free, brilliant. |
| Jiggle Physics | [extensions.blender.org/add-ons/jiggle-physics/](https://extensions.blender.org/add-ons/jiggle-physics/) | Free, GPLv3 | £0 | S | Naelstrof's verlet-based fork of Wiggle 2 — real-time viewport jiggle. |
| Animation Layers | [Superhive](https://superhivemarket.com) (search Animation Layers) | Commercial | UNCONFIRMED, ~$20 | F | Photoshop-style layers for keyframes. Non-destructive iteration. |
| Stop Motion OBJ | [github.com/neverhood311/Stop-motion-OBJ](https://github.com/neverhood311/Stop-motion-OBJ) | Free, GPLv3 | £0 | S | Import animated mesh sequences (Houdini / Marvelous output) for playback. |
| BlenRig | [github.com/Pepe-School-Land/BlenRig](https://github.com/Pepe-School-Land/BlenRig) | Free, GPL | £0 | S | Free advanced rigging system. Steeper learning curve than Rigify. |

### 3.8 NPR + cel shading

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Goo Engine 4.4 (fork) | [github.com/dillongoostudios/goo-engine](https://github.com/dillongoostudios/goo-engine) | Free, GPL (Patreon for binaries) | £0 (or Patreon tier) | S/B | Blender fork with anime-NPR shader nodes baked into EEVEE. Free source; pre-built binaries on the DillonGoo Patreon. The studio's bread and butter for cel work. |
| MaltShader | [github.com/bnpr/Malt](https://github.com/bnpr/Malt) | Free, GPL | £0 | S | Render engine for stylized work with full custom-pipeline control. Steep but powerful. |
| Built-in Line Art | Blender 5.x | GPL | £0 | S | The contour/line-art modifier. Renders to image planes — works for both stills and animation. |
| Built-in Freestyle | Blender 5.x | GPL | £0 | S | Older line-rendering system. Still useful, slower than Line Art. |

### 3.9 glTF / Three.js / WebXR pipeline

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| glTF Exporter (built-in) | Blender 5.x | GPL | £0 | S | The standard glTF/glb pipeline. Mandatory for everything that ships to WebXR. |
| VRM Add-on | [extensions.blender.org/add-ons/vrm/](https://extensions.blender.org/add-ons/vrm/) | Free, MIT | £0 | S | VRM import/export, MToon shader, VRM humanoid setup. The studio's avatar pipeline lives here. |
| Sketchfab Exporter | [sketchfab.com](https://sketchfab.com) | Free | £0 | S | One-click upload to Sketchfab for portfolio / preview. |
| holoflow_webxr_exporter | (studio internal) | MIT (planned) | £0 | S | The studio's own exporter — automates the glTF + texture-compression + Draco pass for shipping to holoflow.co.uk. |

### 3.10 3D print prep

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| 3D Print Toolbox (built-in) | Blender 5.x | GPL | £0 | S | Wall thickness, manifold checking, export to STL. The default print-prep kit. |
| BoolTool (built-in) | Blender 5.x | GPL | £0 | S | Live boolean modifier stack. |
| MeshLab (companion) | [meshlab.net](https://www.meshlab.net) | Free, GPL | £0 | S | Standalone mesh analyser + repair for printing. Use after Blender for the final clean. |
| PrusaSlicer | [prusa3d.com/prusaslicer](https://www.prusa3d.com/prusaslicer/) | Free, AGPL | £0 | S | The slicer. Not Blender-specific but lives next to it in the workflow. |

### 3.11 Procedural geometry

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Geometry Nodes (built-in) | Blender 5.x | GPL | £0 | S | Blender's procedural system. Free, deep, the studio's default for repeat patterns. |
| Sverchok | [github.com/nortikin/sverchok](https://github.com/nortikin/sverchok) | Free, GPLv3 | £0 | S | Node-based parametric geometry, older than Geo Nodes but still has tricks Geo Nodes lacks. |
| Animation Nodes | [github.com/JacquesLucke/animation_nodes](https://github.com/JacquesLucke/animation_nodes) | Free, GPL | £0 | S | Node-based animation logic. Pre-dates Geo Nodes; still useful for motion-graphics tricks. |
| Tissue | [github.com/alessandro-zomparelli/tissue](https://github.com/alessandro-zomparelli/tissue) | Free, GPL | £0 | S | Tessellation and computational design add-on. The toolkit for crystal-lattice / mesh-from-curves work. |
| Botaniq | [polygoniq.com/botaniq](https://polygoniq.com/botaniq) | Commercial | UNCONFIRMED, ~$60-$200 tiers | F | Tree / vegetation library with built-in wind. Pays back the first time you need a forest. |

### 3.12 Simulation

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Mantaflow (built-in) | Blender 5.x | GPL | £0 | S | Smoke + fluid sim, native. Slow but free. |
| Molecular | [github.com/scorpion81/Blender-Molecular-Script](https://github.com/scorpion81/Blender-Molecular-Script) | Free, GPL | £0 | S | Particle physics for grains, ropes, soft-bodies. |
| FLIP Fluids | [flipfluids.com](https://flipfluids.com/) | Commercial | $89 | F | The serious water/foam/whitewater sim for Blender. Worth it once Mantaflow stops being enough. |
| Easy Cloth | [Superhive](https://superhivemarket.com) (search Easy Cloth) | Commercial | UNCONFIRMED, ~$25 | F | Friendlier UI on top of Blender's cloth sim. |

### 3.13 Lighting + render

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Cycles + EEVEE (built-in) | Blender 5.x | GPL | £0 | S | The defaults. EEVEE Next in 5.x is genuinely competitive for stylized work. |
| K-Cycles | [superhivemarket.com/products/k-cycles](https://superhivemarket.com/products/k-cycles) | Commercial | ~$56 (5-seat) | B | Cycles fork with denoiser improvements and faster GPU paths. Pays back if you're rendering animation. |
| Lily Surface Scraper (see 3.5) | | | | S | Mentioned twice because it's that useful — also grabs HDRIs. |
| Polyhaven HDRIs (browser) | [polyhaven.com](https://polyhaven.com) | CC0 | £0 | S | The free HDRI library. Pair with Lily Surface. |

### 3.14 GIS + reference

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| BlenderGIS | [github.com/domlysz/BlenderGIS](https://github.com/domlysz/BlenderGIS) | Free, GPL | £0 | S | OSM, satellite, DEM import direct into Blender. The studio's go-to for any real-world-place project. |
| BlenderOSM | [prochitecture.com/blender-osm/](https://prochitecture.com/blender-osm/) | Free + paid premium | £0 base / ~$19 premium | S/B | Cleaner OSM importer with building heights. Premium tier adds Google 3D-tile import. |
| Maps Models Importer | [github.com/eliemichel/MapsModelsImporter](https://github.com/eliemichel/MapsModelsImporter) | Free | £0 | S | Pulls Google Maps 3D tiles. Useful for reference; check terms before shipping. |

### 3.15 Asset management

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Asset Browser (built-in) | Blender 5.x | GPL | £0 | S | Blender's native library. Tag-based, fast, surprisingly underused. |
| BlenderKit Full | [blenderkit.com/plans/pricing](https://www.blenderkit.com/plans/pricing/) | Subscription | $14.90/mo or $108/yr | B | The big commercial asset library. Materials + models + HDRIs in one browser. |
| Connecter | [designconnected.com/connecter/](https://www.designconnected.com/connecter/) | Free + paid Pro | £0 base | S | External asset browser that sees Blender / Substance / glTF files. Good for cross-tool studios. |

### 3.16 Synthetic data + ML

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| BlenderProc | [github.com/DLR-RM/BlenderProc](https://github.com/DLR-RM/BlenderProc) | Free, GPLv3 | £0 | S | Generate annotated synthetic image datasets for ML training. Useful for the studio's computer-vision side. |
| Infinigen | [github.com/princeton-vl/infinigen](https://github.com/princeton-vl/infinigen) | Free, BSD | £0 | S | Procedural natural-world generator. Princeton's research toolkit — full landscapes from a single seed. |

### 3.17 Blender — starter / balanced / full sets

**Starter set (£0):** glTF Exporter, VRM Add-on, BlenderGIS, BlenderKit Free, Lily Surface Scraper, Polyhaven, AmbientCG, Wiggle 2, Jiggle Physics, Goo Engine (compile-it-yourself), Built-in Geometry Nodes, Sverchok, Mantaflow, 3D Print Toolbox, BlenRig, Mira Tools, MaltShader, MeshLab, Krita, holoflow_webxr_exporter.

**Balanced set (Starter + ~£500-£1,500):** Add Hard Ops + Boxcutter Bundle (~£30), MACHIN3tools Prime ($5) and DeusEx ($15), Retopoflow 4 (~$86), Zen UV ($39), Auto-Rig Pro (~$50), K-Cycles ($56), BlenderKit Full ($108/yr), Goo Engine pre-built (DillonGoo Patreon tier, ~$5-$10/mo), BlenderOSM Premium (~$19).

**Full set (Balanced + ~£5,000-£15,000):** Add MESHmachine (~$45), DECALmachine (~$55), UVPackmaster Pro (~$70), BPainter (~$40), PBR Painter 3, Cablerator, Bagapie, Speedretopo, QuadRemesher (~$109/yr), FlippedNormals brush packs, Animation Layers, FLIP Fluids ($89), Easy Cloth, Botaniq, Connecter Pro, Poliigon subscription.

---

## 4. UNREAL ENGINE 5.6 — the shopping list

Unreal itself is free until $1M of project revenue. Most plugins live on the **FAB marketplace** (Epic's rebrand of Unreal Marketplace + Sketchfab + Quixel into one storefront, as of 2024). Some live on GitHub direct from the developer.

Tier key as before: **S** = Starter, **B** = Balanced, **F** = Full.

### 4.1 Engine extensions

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Unreal Engine 5.6 | [unrealengine.com](https://www.unrealengine.com/news/unreal-engine-5-6-is-now-available) | Free under $1M revenue | £0 (5% royalty after $1M) | S | The engine itself. 5.6 brings Lumen HWRT perf, Fast Geometry Streaming, in-editor MetaHuman authoring, the new Mocap Manager. |
| Quixel Megascans (bundled) | [quixel.com](https://quixel.com) (now via FAB) | Free with Unreal | £0 for Unreal use | S | Photogrammetry asset library, free to use inside Unreal. Tens of thousands of high-quality scans. |
| MetaHuman | Built into Unreal 5.6 | Epic licence | £0 | S | Photo-real human characters with in-engine authoring as of 5.6. Free. |
| MetaHuman Animator | Built into Unreal 5.6 | Epic licence | £0 | S | iPhone-camera-driven facial mocap into MetaHumans. Genuinely usable. |
| Niagara (built-in) | Unreal 5.6 | Epic licence | £0 | S | VFX/particle system. Free, deep, the canonical Unreal particle tool. |
| Houdini Engine for Unreal | [github.com/sideeffects/HoudiniEngineForUnreal](https://github.com/sideeffects/HoudiniEngineForUnreal) | Free plug-in (requires Houdini licence at home end) | £0 plugin + Houdini cost | S/F | Run Houdini Digital Assets inside the Unreal editor. Free Indie licence available for procedural-asset import; paid Houdini tier needed for full authoring. |

### 4.2 WebXR / spatial output from Unreal

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Pixel Streaming (built-in) | Unreal 5.6 | Epic licence | £0 (server costs separate) | S | Stream a UE5 scene to a browser. The studio's best bet for Unreal-quality on holoflow.co.uk. Costs are GPU hosting, not the plugin. |
| OpenXR plugin (built-in) | Unreal 5.6 | Epic licence | £0 | S | Cross-headset VR/AR API. Quest, Vive, Index, Pico — all via OpenXR. |
| Meta XR SDK | [developer.oculus.com/downloads/](https://developer.oculus.com/downloads/) | Free | £0 | S | Meta-specific Quest extensions on top of OpenXR — hand tracking, passthrough, anchors. |
| Vive Wave / OpenXR | [developer.vive.com](https://developer.vive.com) | Free | £0 | S | HTC's plugin. Only if you target Vive Focus / XR Elite specifically. |
| Apple ARKit plugin | Built into Unreal 5.6 | Epic licence | £0 | S | iOS AR. Free, bundled. |

### 4.3 Modelling + asset import

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Quixel Bridge (FAB integration) | Built into Unreal 5.6 | Epic licence | £0 | S | One-click Megascan import. |
| Datasmith | Built into Unreal 5.6 | Epic licence | £0 | S | CAD / 3ds Max / Rhino / SketchUp import. Free, mandatory for arch-viz pipelines. |
| Auto Material | [Fab](https://www.fab.com) (search Auto Material UE5) | Commercial | UNCONFIRMED, ~$50 | F | Automatic procedural materials with slope/altitude/curvature blending. The arch-viz / landscape buy. |
| glTFRuntime | [github.com/rdeioris/glTFRuntime](https://github.com/rdeioris/glTFRuntime) | Free, MIT | £0 | S | Load glTF files at runtime. Critical bridge for the studio's glTF-first pipeline. |
| USD plugin (built-in) | Unreal 5.6 | Epic licence | £0 | S | OpenUSD support. The future-of-interchange format. |

### 4.4 Lighting + render

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Lumen (built-in) | Unreal 5.6 | Epic licence | £0 | S | Real-time global illumination + reflections. The headline 5.x render feature. **Won't run on the web** — Pixel Streaming or bust. |
| Path Tracing (built-in) | Unreal 5.6 | Epic licence | £0 | S | Reference renderer for stills + cinematics. |
| Cinematic Cameras + Sequencer | Built-in | Epic licence | £0 | S | Camera/track/sequence tool. Free. |

### 4.5 NPR + cel shading on Unreal

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Stylized Rendering System (Cel-Shader) | [fab.com/listings/6129b04e-3859-4a2d-90b3-000958a563d2](https://www.fab.com/listings/6129b04e-3859-4a2d-90b3-000958a563d2) | Commercial | UNCONFIRMED, ~$50 | B | The most-used UE cel-shading pipeline. Drag the SRS actor in, enable custom-depth, ship anime in minutes. |
| Stylized Rendering System for Mobile/VR | [Fab](https://www.fab.com) | Commercial | UNCONFIRMED, ~$50 | F | Mobile/VR-friendly forward-renderer variant — actually relevant for Quest builds. |
| Cel Shader Pro | [fab.com/listings/5e93dcf3-36d1-42bf-9e10-cb529d9f1f78](https://www.fab.com/listings/5e93dcf3-36d1-42bf-9e10-cb529d9f1f78) | Commercial | UNCONFIRMED, ~$25 | F | Modular post-process cel + outline system. Cheaper alternative to SRS. |
| Advanced Cel Shader Essentials | [fab.com/listings/bb5088ae-9c4f-4fdc-a918-69569cc3b5e0](https://www.fab.com/listings/bb5088ae-9c4f-4fdc-a918-69569cc3b5e0) | Commercial | UNCONFIRMED | F | Color-ramp LUT-based cel shader. |
| ToonyColorsPro | [Fab](https://www.fab.com) (search ToonyColorsPro) | Commercial | UNCONFIRMED | F | Long-running stylized shader pack, ported from Unity. |

### 4.6 Animation + rigging

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Control Rig (built-in) | Unreal 5.6 | Epic licence | £0 | S | In-engine rig authoring. 5.6 added physics-driven Control Rig. Significant. |
| Sequencer (built-in) | Unreal 5.6 | Epic licence | £0 | S | Cinematic editor. Free. |
| MetaHuman Animator | Built-in | Epic licence | £0 | S | iPhone facial mocap to MetaHumans. |
| Mocap Manager (built-in 5.6) | Unreal 5.6 | Epic licence | £0 | S | New in 5.6 — end-to-end mocap recording inside the editor. |
| AccuRig | [actorcore.reallusion.com/auto-rig](https://actorcore.reallusion.com/auto-rig) | Free standalone | £0 | S | Reallusion's free auto-rig. Pipes into iClone / Character Creator if you go that way. |
| Cascadeur Indie | [cascadeur.com/plans](https://cascadeur.com/plans) | Commercial | $19/mo or $96/yr (under $100k revenue) | B | Physics-assisted keyframe animation. Rent-to-own — perpetual after one year. Pipes to Unreal via FBX. |

### 4.7 VR / AR plugins

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| OpenXR (built-in) | Unreal 5.6 | Epic licence | £0 | S | Cross-platform XR. The default. |
| Meta XR SDK | [developer.oculus.com](https://developer.oculus.com) | Free | £0 | S | Quest-specific extensions. |
| Vive OpenXR | [developer.vive.com](https://developer.vive.com) | Free | £0 | S | HTC-specific. |
| Apple ARKit (built-in) | Unreal 5.6 | Epic licence | £0 | S | iOS AR. |
| Google ARCore | Built-in plugin | Free | £0 | S | Android AR. |

### 4.8 Audio

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| MetaSounds (built-in) | Unreal 5.6 | Epic licence | £0 | S | Node-based audio synthesis + mixing. Free, brilliant, native. |
| Wwise | [audiokinetic.com](https://www.audiokinetic.com) | Free under $200k revenue | £0 indie | S/B | Industry-standard audio middleware. Free if you stay small. |
| FMOD | [fmod.com](https://www.fmod.com) | Free indie, paid pro | £0 indie | S/B | The alternative. Slightly lighter than Wwise, comparable feature set. |
| Resonance Audio | [resonance-audio.github.io](https://resonance-audio.github.io) | Free, Apache 2.0 | £0 | S | Spatial audio for VR/AR. Pair with OpenXR. |

### 4.9 AI + ML

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| NNE (Neural Network Engine) (built-in) | Unreal 5.6 | Epic licence | £0 | S | Run ONNX models inside Unreal. The platform Epic want you to use for ML now. |
| Convai | [fab.com/listings/ba3145af-d2ef-434a-8bc3-f3fa1dfe7d5c](https://www.fab.com/listings/ba3145af-d2ef-434a-8bc3-f3fa1dfe7d5c) | Free plugin + per-character API costs | £0 plugin / subscription for API | F | Conversational AI NPCs with lip-sync and emotional response. The plugin is free; the cost is the API. |
| Inworld AI | [inworld.ai](https://inworld.ai) | Free plugin + subscription | UNCONFIRMED | F | Alternative AI character platform. Same shape — free plugin, paid backend. |

### 4.10 Performance + profiling

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| Unreal Insights (built-in) | Unreal 5.6 | Epic licence | £0 | S | The profiler. Free, deep, native. |
| Stat Unit (built-in console) | Unreal 5.6 | Epic licence | £0 | S | Quick frame-time breakdown. |
| Compushady plugin | [github.com/rdeioris/Compushady](https://github.com/rdeioris/Compushady) | Free | £0 | S | Compute shader support exposed to Blueprints. For the shader-heavy work. |

### 4.11 Asset stores

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| FAB | [fab.com](https://www.fab.com) | Per-asset, varies | varies | S/B/F | The Epic marketplace. Watch for the four annual sales — most assets hit 50-70% off. |
| Quixel Megascans | Bundled | Free with Unreal | £0 | S | The single biggest asset library on the planet, free to use in Unreal. |
| Epic Game Dev Community | [dev.epicgames.com](https://dev.epicgames.com) | Free tutorials + samples | £0 | S | The official tutorial / sample library. Free, deep, underused. |

### 4.12 Unreal — starter / balanced / full sets

**Starter set (£0):** Unreal Engine 5.6, Quixel Megascans, MetaHuman + Animator, Niagara, Pixel Streaming, OpenXR, Meta XR SDK, Apple ARKit, ARCore, Datasmith, glTFRuntime, USD plugin, Lumen, Path Tracing, Sequencer, Control Rig, Mocap Manager, MetaSounds, Wwise (under $200k), Resonance Audio, NNE, Unreal Insights, AccuRig, Compushady, Houdini Engine plugin (free Indie tier).

**Balanced set (Starter + ~£200-£500):** Add Stylized Rendering System for Mobile/VR (~$50), Cascadeur Indie ($96/yr), three or four FAB asset packs strategically chosen (~$200 total). That's the bench that ships stylized WebXR + Quest builds.

**Full set (Balanced + ~£2,000):** Add Auto Material, Cel Shader Pro, ToonyColorsPro, Advanced Cel Shader Essentials, Convai (plus API costs), Inworld AI, Houdini Indie at the home end ($299/yr), plus the full annual FAB asset budget (~$500-$1,000/yr).

---

## 5. Cross-pipeline tooling (not Blender or Unreal specific)

These don't belong in either column because they sit alongside both.

| Name | Source | Licence | Cost | Tier | Role |
|---|---|---|---|---|---|
| ZBrush | [maxon.net/en/zbrush](https://www.maxon.net/en/zbrush) | Subscription | UNCONFIRMED, ~£35/mo via Maxon One | F | The sculpting standard. Blender sculpt is closing the gap; ZBrush still wins for production sculpting. |
| Substance 3D Painter | [adobe.com/products/substance3d/plans](https://www.adobe.com/products/substance3d/plans.html) | Subscription or perpetual via Steam | $24.99/mo subscription, or $199.99 Steam perpetual | F | The canonical PBR painter. Steam perpetual is the workaround for the Adobe subscription. |
| Marmoset Toolbag 5 | [marmoset.co/shop](https://marmoset.co/shop/) | Subscription or perpetual | $18.99/mo subscription, perpetual UNCONFIRMED | F | Fast PBR baker + real-time viewer. The portfolio render tool. |
| Houdini Indie | [sidefx.com/products/houdini-indie](https://www.sidefx.com/products/houdini-indie/) | Annual subscription | $299/yr (under $100k revenue) | F | Procedural geometry king. Indie tier allows 3 workstations. |
| Marvelous Designer | [marvelousdesigner.com/pricing](https://www.marvelousdesigner.com/pricing) | Subscription only (no perpetual since 2026) | $39/mo Personal / $280/yr | F | Cloth simulation. Genuinely irreplaceable for cloth work — no free alternative comes close. |
| RealityCapture | [capturingreality.com](https://www.capturingreality.com) | Free with Unreal | £0 with Unreal | S | Photogrammetry. Epic acquired it, free since 2024 when used alongside Unreal. |
| 3DCoat / 3DCoatTextura | [pilgway.com/store](https://pilgway.com/store) | Subscription + perpetual | varies | F | Voxel sculpting + retopo + painting in one package. The bargain alternative to ZBrush + Substance. |
| Character Creator 4 + iClone 8 | [reallusion.com](https://www.reallusion.com) | Commercial | UNCONFIRMED, expensive | F | Reallusion's character pipeline. Pairs with AccuRig. |
| VRoid Studio | [vroid.com/en/studio](https://vroid.com/en/studio) | Free | £0 | S | VRM character creation, anime-style. The free path into the VRM ecosystem. |
| Blender (it deserves saying) | [blender.org](https://www.blender.org) | Free, GPLv3 | £0 | S | The hub. Everything else is satellite. |

---

## 6. The honest "skip" list

The hardest part of any shopping list is what's **not** on it. Specifically for this studio's mix of work:

- **Don't subscribe to Substance** — perpetual on Steam is half the price and never expires. If you can stomach a one-off £200, do that. The subscription bleeds £25/mo forever; the perpetual is locked at v6 features but covers anything you need for stylized + low-poly + WebXR work. (Reassess if Adobe lock features behind a future paid version that genuinely matters.)
- **Don't buy any plugin whose last GitHub commit is older than 18 months.** Half the "must-have" plugins on YouTube tutorials are abandoned. Blender 5.x broke many old add-ons; check before you pay.
- **Don't buy Lumen-dependent assets if you ship to WebXR.** Lumen doesn't render on the web. Pixel Streaming is the only bridge — and Pixel Streaming is a hosting cost, not a plugin. Anything tagged "Lumen GI required" on FAB is a dead end for the web side of the studio.
- **Don't buy Megascans add-ons that resell what's already free inside Unreal.** Read the asset description — many FAB packs are repackaged Quixel content with a £50 markup.
- **Don't pay for asset libraries you'll use twice.** BlenderKit Full at £108/yr is fine; a one-off £200 prop pack is almost never worth it for a part-time studio.
- **Don't pay Reallusion subscription prices unless you live in iClone.** Character Creator + iClone are a great pipeline if you're committed; if you dip in twice a year, the Blender + AccuRig + VRoid free stack does 80%.
- **Don't buy a fluid sim plugin until you've burned a weekend on Mantaflow.** FLIP Fluids is genuinely better, but Mantaflow is competent enough that you need to *know* you've outgrown it before spending $89.
- **Don't buy "all-in-one" mega-bundles on Humble or AssetForge.** They look like value; in practice you install three out of forty plugins and the rest gather dust.
- **Don't buy ZBrush if Blender sculpt is doing the job.** Blender 5.x sculpt mode (multires + dyntopo + voxel remesh + the new sculpt brushes) covers the studio's stylized work without a £35/mo Maxon tax.
- **Don't buy a Blender render booster if you're already on a GPU that renders fast enough.** K-Cycles is great; on an RTX 4090 you might not feel the difference for the work the studio actually does.

---

## 7. The 12-month roadmap

If the studio bought one thing every month for a year, alternating Blender and Unreal, this is the order:

**Month 1 — Hard Ops + Boxcutter Bundle (~£30).** Blender. The cheapest, highest-ROI purchase in the entire list. Every modelling session gets faster. No-brainer first buy.

**Month 2 — Cascadeur Indie ($19/mo or $96/yr).** Unreal-side. Physics-assisted keyframe animation gets the studio out of the "VRM avatar stands still" rut. Pipes to both Blender and Unreal via FBX.

**Month 3 — Zen UV ($39).** Blender. The second-most-felt time-saver. UV unwrapping stops being a chore. Especially valuable once Hard Ops models start needing texture work.

**Month 4 — Stylized Rendering System for Mobile/VR (~$50).** Unreal-side. If the studio's running any Unreal-side stylized look, this is the canonical pipeline. The mobile/VR variant matters — it works on Quest, the desktop SRS doesn't always.

**Month 5 — Retopoflow 4 (~$86).** Blender. Once sculpts start happening, retopo is the bottleneck. Retopoflow is the unanimous community pick.

**Month 6 — A strategic FAB pack haul (~$100-$200 during a sale).** Unreal-side. Wait for the Spring or Black Friday FAB Sale and buy three things you've been eyeing — usually pays for itself the first project they're in.

**Month 7 — Auto-Rig Pro (~$50).** Blender. Every VRM and every game-ready character benefits. The export presets to Unreal/Unity/Godot are the killer feature.

**Month 8 — Houdini Indie ($299/yr).** Unreal-side (sort of — Houdini Engine plugs into Unreal, but Houdini itself is the buy). This is the big one. Procedural geometry, simulation, level generation. If the studio is going to do **any** large-scale environment work in the next year, this is the buy. Skip it if you're staying in characters-and-props.

**Month 9 — BlenderKit Full ($108/yr).** Blender. Asset library subscription. Twelve months in, you'll have noticed how much time is spent making throwaway props — this cuts that time to zero.

**Month 10 — Cel Shader Pro or Stylized Rendering System (full version) (~$25-$50).** Unreal-side. By now you'll know whether you're stylizing in Unreal often enough to justify it. If the answer's yes, this is the buy.

**Month 11 — K-Cycles ($56).** Blender. Once you're rendering animation, the GPU paths in K-Cycles start mattering. Optional if you're EEVEE-Next-only.

**Month 12 — Convai (free plugin + API budget, ~$20-$50/mo).** Unreal-side. The studio's narrative work (Aura, Charming Academy, all of it) lands here. Conversational AI NPCs with facial animation. The plugin's free; the cost is the API calls. Budget honestly.

**Total spent in a year:** ~£800-£1,200 one-off + ~£500/yr recurring. That's the Balanced tier delivered, paced.

---

## 8. References

All URLs verified May 2026 unless flagged.

### Blender

- Hard Ops + Boxcutter: [superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle](https://superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle), [masterxeon1001.gumroad.com/l/hopscutter](https://masterxeon1001.gumroad.com/l/hopscutter)
- MACHIN3 (tools, MESHmachine, DECALmachine): [machin3.io](https://machin3.io), [superhivemarket.com/creators/machin3](https://superhivemarket.com/creators/machin3), [machin3.gumroad.com](https://machin3.gumroad.com)
- Retopoflow 4: [superhivemarket.com/products/retopoflow](https://superhivemarket.com/products/retopoflow), [github.com/CGCookie/retopoflow](https://github.com/CGCookie/retopoflow)
- Zen UV: [superhivemarket.com/products/zen-uv](https://superhivemarket.com/products/zen-uv)
- UVPackmaster: [uvpackmaster.com](https://uvpackmaster.com)
- UV-Packer (3d-io free): [uv-packer.com/download](https://www.uv-packer.com/download/)
- BPainter: [bpainter.artbyndee.de](https://bpainter.artbyndee.de/)
- PBR Painter 3: [superhivemarket.com/products/pbr-painter](https://superhivemarket.com/products/pbr-painter)
- BlenderKit: [blenderkit.com/plans/pricing](https://www.blenderkit.com/plans/pricing/)
- Lily Surface Scraper: [github.com/eliemichel/LilySurfaceScraper](https://github.com/eliemichel/LilySurfaceScraper)
- AmbientCG: [ambientcg.com](https://ambientcg.com)
- Polyhaven: [polyhaven.com](https://polyhaven.com)
- Auto-Rig Pro: [superhivemarket.com/products/auto-rig-pro](https://superhivemarket.com/products/auto-rig-pro), [artell.gumroad.com/l/auto-rig-pro](https://artell.gumroad.com/l/auto-rig-pro)
- Wiggle 2: [github.com/shteeve3d/blender-wiggle-2](https://github.com/shteeve3d/blender-wiggle-2)
- Jiggle Physics: [extensions.blender.org/add-ons/jiggle-physics/](https://extensions.blender.org/add-ons/jiggle-physics/)
- Stop Motion OBJ: [github.com/neverhood311/Stop-motion-OBJ](https://github.com/neverhood311/Stop-motion-OBJ)
- BlenRig: [github.com/Pepe-School-Land/BlenRig](https://github.com/Pepe-School-Land/BlenRig)
- Goo Engine: [github.com/dillongoostudios/goo-engine](https://github.com/dillongoostudios/goo-engine)
- MaltShader: [github.com/bnpr/Malt](https://github.com/bnpr/Malt)
- VRM Add-on: [extensions.blender.org/add-ons/vrm/](https://extensions.blender.org/add-ons/vrm/), [github.com/saturday06/VRM-Addon-for-Blender](https://github.com/saturday06/VRM-Addon-for-Blender), [vrm-addon-for-blender.info](https://vrm-addon-for-blender.info/)
- Sverchok: [github.com/nortikin/sverchok](https://github.com/nortikin/sverchok)
- Animation Nodes: [github.com/JacquesLucke/animation_nodes](https://github.com/JacquesLucke/animation_nodes)
- Tissue: [github.com/alessandro-zomparelli/tissue](https://github.com/alessandro-zomparelli/tissue)
- Botaniq: [polygoniq.com/botaniq](https://polygoniq.com/botaniq)
- FLIP Fluids: [flipfluids.com](https://flipfluids.com/), [superhivemarket.com/products/flipfluids](https://superhivemarket.com/products/flipfluids)
- Molecular: [github.com/scorpion81/Blender-Molecular-Script](https://github.com/scorpion81/Blender-Molecular-Script)
- K-Cycles: [superhivemarket.com/products/k-cycles](https://superhivemarket.com/products/k-cycles)
- BlenderGIS: [github.com/domlysz/BlenderGIS](https://github.com/domlysz/BlenderGIS)
- BlenderOSM: [prochitecture.com/blender-osm/](https://prochitecture.com/blender-osm/)
- Maps Models Importer: [github.com/eliemichel/MapsModelsImporter](https://github.com/eliemichel/MapsModelsImporter)
- BlenderProc: [github.com/DLR-RM/BlenderProc](https://github.com/DLR-RM/BlenderProc)
- Infinigen: [github.com/princeton-vl/infinigen](https://github.com/princeton-vl/infinigen)
- Krita: [krita.org](https://krita.org)
- MeshLab: [meshlab.net](https://www.meshlab.net)
- PrusaSlicer: [prusa3d.com/prusaslicer](https://www.prusa3d.com/prusaslicer/)

### Unreal

- Unreal Engine 5.6: [unrealengine.com/news/unreal-engine-5-6-is-now-available](https://www.unrealengine.com/news/unreal-engine-5-6-is-now-available)
- FAB Marketplace: [fab.com](https://www.fab.com)
- Stylized Rendering System: [fab.com/listings/6129b04e-3859-4a2d-90b3-000958a563d2](https://www.fab.com/listings/6129b04e-3859-4a2d-90b3-000958a563d2)
- Stylized Rendering System Mobile/VR: [unrealengine.com/marketplace/en-US/product/stylized-rendering-system-for-mobile-vr-cel-shader](https://www.unrealengine.com/marketplace/en-US/product/stylized-rendering-system-for-mobile-vr-cel-shader)
- Cel Shader Pro: [fab.com/listings/5e93dcf3-36d1-42bf-9e10-cb529d9f1f78](https://www.fab.com/listings/5e93dcf3-36d1-42bf-9e10-cb529d9f1f78)
- Advanced Cel Shader Essentials: [fab.com/listings/bb5088ae-9c4f-4fdc-a918-69569cc3b5e0](https://www.fab.com/listings/bb5088ae-9c4f-4fdc-a918-69569cc3b5e0)
- Houdini Engine for Unreal: [github.com/sideeffects/HoudiniEngineForUnreal](https://github.com/sideeffects/HoudiniEngineForUnreal)
- Convai: [fab.com/listings/ba3145af-d2ef-434a-8bc3-f3fa1dfe7d5c](https://www.fab.com/listings/ba3145af-d2ef-434a-8bc3-f3fa1dfe7d5c), [github.com/Conv-AI/Convai-UnrealEngine-SDK](https://github.com/Conv-AI/Convai-UnrealEngine-SDK)
- glTFRuntime: [github.com/rdeioris/glTFRuntime](https://github.com/rdeioris/glTFRuntime)
- Compushady: [github.com/rdeioris/Compushady](https://github.com/rdeioris/Compushady)
- AccuRig: [actorcore.reallusion.com/auto-rig](https://actorcore.reallusion.com/auto-rig)
- Inworld AI: [inworld.ai](https://inworld.ai)
- Meta XR SDK: [developer.oculus.com/downloads/](https://developer.oculus.com/downloads/)
- Vive OpenXR: [developer.vive.com](https://developer.vive.com)
- Wwise: [audiokinetic.com](https://www.audiokinetic.com)
- FMOD: [fmod.com](https://www.fmod.com)
- Resonance Audio: [resonance-audio.github.io](https://resonance-audio.github.io)

### Cross-pipeline

- Substance 3D pricing: [adobe.com/products/substance3d/plans](https://www.adobe.com/products/substance3d/plans.html)
- Marmoset Toolbag: [marmoset.co/shop](https://marmoset.co/shop/)
- Houdini Indie: [sidefx.com/products/houdini-indie](https://www.sidefx.com/products/houdini-indie/)
- Marvelous Designer: [marvelousdesigner.com/pricing](https://www.marvelousdesigner.com/pricing)
- Cascadeur: [cascadeur.com/plans](https://cascadeur.com/plans)
- 3DCoat: [pilgway.com/store](https://pilgway.com/store), [3dcoat.com/buy](https://3dcoat.com/buy/)
- ZBrush (Maxon): [maxon.net/en/zbrush](https://www.maxon.net/en/zbrush)
- VRoid Studio: [vroid.com/en/studio](https://vroid.com/en/studio)
- RealityCapture: [capturingreality.com](https://www.capturingreality.com)
- Blender: [blender.org](https://www.blender.org)

---

**Last word.** The temptation with a list like this is to read it and start shopping. Don't. Read it, pick the Starter tier, run that bench for a month, then look back at this list and ask "which of these would have saved me actual hours last month?" The answers usually surprise you, and they usually aren't the ones the YouTube reviewers recommend.

Then buy one thing. Then ship something with it. Then buy the next thing.
