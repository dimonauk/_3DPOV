# Blender Extensions — knowledge base

A working catalogue of the Blender add-ons + extensions the studio
either uses, has lined up, has bought, or has deliberately rejected.
Direction (2026-05-19): "index all blender plugins and extension and
build the knowledge base, we have docs already".

This file is the *tooling* side of the Blender pipeline. The asset
side — CC0 model libraries, texture banks, HDRIs, font pools — lives
in `docs/RESOURCES-AESTHETIC.md`. The runtime web stack lives in
`docs/OPEN-SOURCE-STACK.md`. The studio's own export add-on is
documented at `docs/BLENDER-ADDON.md` and lives under
`tools/blender-addon/holoflow_webxr_exporter/`.

Every entry has a licence, a one-line role, and a status. Status uses
the same vocabulary throughout:

- **used** — wired into the studio workflow today.
- **lined-up** — installed on at least one bench, not yet routine.
- **commercial-noted** — paid; flagged so the human can decide,
  not recommended.
- **rejected** — surveyed and excluded, with a reason. See section 8.

Every URL was verified on 2026-05-19. If you find a dead link a
month from now, please update the row and add a note.

## The studio's own

The studio ships one add-on: the **Holoflow WebXR Game Framework
exporter**, at `tools/blender-addon/holoflow_webxr_exporter/`. It
wraps the built-in glTF 2.0 exporter with the canonical settings the
WebXR Game Framework expects (Y-up, Draco level 6, WebP textures,
animation bake at 30 fps, the flat-normals trick for the high-facet
sculpture aesthetic). Read `docs/BLENDER-ADDON.md` for the conventions
it codifies and the install walkthrough in
`tools/blender-addon/README.md`.

If you only install one Blender extension across the whole studio
stack, that's the one.

## The Blender 4.x Extensions Platform

The way Blender add-ons are distributed changed in Blender 4.2 (July
2024). The legacy "bundled add-ons" model — where mesh helpers,
Node Wrangler, LoopTools and the rest shipped inside the Blender
download — has been retired. The replacement is
[extensions.blender.org](https://extensions.blender.org/), an official
community platform run by the Blender Foundation. Two things to
understand:

1. **Most "built-in" add-ons aren't really built-in any more.**
   LoopTools, F2, Bool Tool, Auto Mirror, the 3D Print Toolbox,
   Sapling Tree Gen, Rigify, Node Wrangler — they're still maintained,
   but they ship from extensions.blender.org now rather than the
   Blender installer. Enable them through Edit → Preferences →
   Extensions → Get Extensions, with the online repository switched on.
2. **The platform only hosts GPL-compliant extensions.** Anything sold
   commercially (Hard Ops, Boxcutter, Auto-Rig Pro, UV Packmaster,
   Decal Machine, Photographer 5) lives on Superhive
   (formerly Blender Market) or Gumroad and is installed by hand.

The two things to verify before installing anything from
extensions.blender.org: the **licence** (GPL-2.0 / GPL-3.0 / MIT / 
Apache-2.0 / BSD) and the **last-updated date**. The platform is new
enough that some entries are abandoned ports of older add-ons.

## 1 — Built-in (ships with Blender 4.x or installed from extensions.blender.org)

| Name | Source | Licence | Role | Status |
| --- | --- | --- | --- | --- |
| glTF 2.0 I/O | [github.com/KhronosGroup/glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) | Apache-2.0 | The canonical glTF importer/exporter. Ships inside Blender since 2.80, maintained by Khronos / UX3D / Julien Duroure | used (the studio's add-on wraps it) |
| Decimate modifier | Blender core | GPL | Collapse triangles for budget. "Planar" mode preserves flat facets, which the studio actually wants for the high-facet aesthetic | used |
| Voxel Remesh | Blender core | GPL | Watertight remesh for 3D-print prep. The dragon-scale and waveguide pieces go through this before slicing | used |
| Geometry Nodes | Blender core | GPL | Procedural geometry graph. The studio's belt-pattern variants are built here | used |
| Simulation Nodes | Blender core | GPL | Procedural simulation (Blender 3.6+, hardened in 4.x) | lined-up |
| Boolean modifier + Solidify | Blender core | GPL | Standard hard-surface stack. Used in the wall-relief pipeline | used |
| Freestyle | Blender core | GPL | Edge-line rendering for stills. Still works in 4.x but the Line Art modifier is the modern path | lined-up |
| Line Art Grease Pencil modifier | Blender core | GPL | Real-time NPR line generation. The spiritual successor to Freestyle and LANPR | lined-up |
| Mantaflow (fluid sim) | Blender core | GPL | Liquid + smoke sim. Not in the WebXR loop; useful for stills | lined-up |
| Cycles equirectangular camera | Blender core | Apache-2.0 (Cycles itself) | 360° render path for the spherical content | used |
| VR Scene Inspection | Blender core | GPL | OpenXR-based scene inspection in headset. Useful for sanity-checking scale before WebXR export | used |
| Node Wrangler | [extensions.blender.org/add-ons/node-wrangler](https://extensions.blender.org/add-ons/node-wrangler/) | GPL-2.0 | Shader-graph keyboard shortcuts. Shift-W. Non-negotiable | used |
| LoopTools | [extensions.blender.org/add-ons/looptools](https://extensions.blender.org/add-ons/looptools/) | GPL-2.0 | Loop manipulation — circle, bridge, relax, space, flatten. "Limited support" tag on the platform, still works | used |
| F2 | [extensions.blender.org/add-ons/f2](https://extensions.blender.org/add-ons/f2/) | GPL-2.0 | Smart face creation in Edit Mode. Press F and it does the right thing | used |
| Bool Tool | [extensions.blender.org/add-ons/bool-tool](https://extensions.blender.org/add-ons/bool-tool/) | GPL-2.0 | Ctrl-Shift-B booleans. Lightweight; for anything heavier the studio reaches for Hard Ops if it's installed | used |
| Auto Mirror | [extensions.blender.org/add-ons/auto-mirror](https://extensions.blender.org/add-ons/auto-mirror/) | GPL-2.0 | Cut and mirror in one click. Useful for symmetric sculpture starts | used |
| 3D Print Toolbox | [extensions.blender.org/add-ons/print3d-toolbox](https://extensions.blender.org/add-ons/print3d-toolbox/) | GPL-2.0 | Mesh analysis + cleanup for slicing. Analyse, Cleanup, Edit, Export. The "Make Manifold" button has saved actual print jobs | used (belt printer + resin print prep) |
| Rigify | [extensions.blender.org/add-ons/rigify](https://extensions.blender.org/add-ons/rigify/) | GPL-2.0 | Auto-rigging from meta-rigs. The free Auto-Rig Pro alternative | used |
| Sapling Tree Gen | [extensions.blender.org/add-ons/sapling-tree-gen](https://extensions.blender.org/add-ons/sapling-tree-gen/) | GPL-2.0 | Parametric tree generator. Useful for stylised set dressing | lined-up |

## 2 — Community add-ons (permissive + GPL)

| Name | Source | Licence | Role | Status |
| --- | --- | --- | --- | --- |
| VRM Add-on for Blender | [github.com/saturday06/VRM-Addon-for-Blender](https://github.com/saturday06/VRM-Addon-for-Blender) | MIT or GPL-3.0 (dual) | The canonical VRM 0.x + 1.0 importer/exporter, MToon shader setup, humanoid rig configuration. Supports Blender 2.93 → 5.1 | used (Aura's `nanny.vrm` lives because this exists) |
| BlenderKit | [github.com/BlenderKit/BlenderKit](https://github.com/BlenderKit/BlenderKit) | GPL-2.0 (add-on); asset licences vary | In-Blender asset browser. Free tier has 10k+ models and 10k+ materials; the paid tier expands that. Useful as a *browse-from-bench* tool, not as a source for shipped assets without re-checking each licence | lined-up |
| Mira Tools / MifthTools | [github.com/mifth/mifthtools](https://github.com/mifth/mifthtools) | BSD-3-Clause | Modelling helpers — curve-stretching, deform tools, retopology helpers. The smoothing-along-edge tool is particularly good for the sculpture cleanup pass | used |
| MACHIN3tools | [github.com/machin3io/MACHIN3tools](https://github.com/machin3io/MACHIN3tools) | GPL-2.0+ | Free workflow accelerators from the Hard Ops / Decal Machine author. Pie menus, smart deletes, focus mode. The author's free contribution to the ecosystem | used |
| BlenderGIS | [github.com/domlysz/BlenderGIS](https://github.com/domlysz/BlenderGIS) | GPL-3.0 | GIS data import — shapefiles, GeoTIFF, OSM, SRTM elevation. Used for the aerial-imagery experiments and any "real terrain under a scene" work | lined-up |
| Sverchok | [github.com/nortikin/sverchok](https://github.com/nortikin/sverchok) | GPL-3.0 | Node-based parametric design. 600+ nodes, fields, curves, surfaces, SVG/DXF export. Supports Blender 2.93 → 5.1. The architectural-pattern + waveguide-lattice work runs through this | used |
| Animation Nodes | [github.com/JacquesLucke/animation_nodes](https://github.com/JacquesLucke/animation_nodes) | GPL-3.0 | Node-based motion-graphics scripting. Latest release 2.3 for Blender 4.2 LTS. Still maintained; Geometry Nodes overlaps for static work but Animation Nodes still owns animation-graph + audio-reactive | lined-up |
| Animation Layers (evilmushroom) | [github.com/evilmushroom/Animation-Layers-for-Blender](https://github.com/evilmushroom/Animation-Layers-for-Blender) | GPL | Non-destructive animation layering on top of the NLA editor. The free alternative to the commercial Animation Layers on Superhive | lined-up |
| QuickSnap | [github.com/JulienHeijmans/quicksnap](https://github.com/JulienHeijmans/quicksnap) | GPL | Ctrl-Shift-V vertex/origin snapping, Maya-style. Free; fast on typical scenes, slow on dense meshes | used |
| BlenderProc | [github.com/DLR-RM/BlenderProc](https://github.com/DLR-RM/BlenderProc) | GPL-3.0 | Procedural synthetic-data pipeline. Photoreal rendering, segmentation masks, COCO/BOP annotation. Useful for any "render a thousand variations of this scene" job | lined-up (the CCTV staging path) |
| Goo Engine | [github.com/dillongoostudios/goo-engine](https://github.com/dillongoostudios/goo-engine) | GPL-3.0 (Blender fork) | NPR-focused Blender fork from DillonGoo Studios. Custom Eevee shader nodes + Light Groups. Pre-builds on Patreon; source on GitHub is GPL-free. Worth knowing about for the cel-shading work even if the studio renders most of that in TSL on the web | lined-up |
| Improved Sapling Tree Generator | [github.com/abpy/improved-sapling-tree-generator](https://github.com/abpy/improved-sapling-tree-generator) | GPL-2.0 | Maintained fork of Sapling with bug fixes and new parameters | lined-up |

## 3 — WebXR / glTF / Three.js pipeline

For the asset pipeline ending at `public/models/<scene>/<slug>.glb`.

| Name | Source | Licence | Role | Status |
| --- | --- | --- | --- | --- |
| glTF 2.0 I/O (built-in) | [github.com/KhronosGroup/glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) | Apache-2.0 | The exporter the studio add-on wraps. The `holoflow_webxr_exporter` calls it with the canonical settings; bypassing the studio add-on means re-implementing those settings by hand | used (via the studio add-on) |
| Sketchfab Exporter | [github.com/sketchfab/blender-plugin](https://github.com/sketchfab/blender-plugin) | Apache-2.0 | Direct upload to Sketchfab. Useful for the "send a preview to a client" flow without standing up a Vercel deploy. Latest release 1.6.1 (Dec 2023) — Sketchfab moved to Epic and the plugin's been quiet since, but still works on 4.x | lined-up |
| VRM Add-on for Blender | [github.com/saturday06/VRM-Addon-for-Blender](https://github.com/saturday06/VRM-Addon-for-Blender) | MIT or GPL-3.0 | VRM avatar authoring, MToon shader. The `@pixiv/three-vrm` runtime side picks the file up directly | used (Aura) |
| glTF-Transform CLI | [github.com/donmccurdy/glTF-Transform](https://github.com/donmccurdy/glTF-Transform) | MIT | Post-Blender glTF surgery — weld vertices, prune materials, re-bake compression, swap textures to KTX2. Not a Blender add-on; runs from the bench. Pairs with `gltfpack` from `RESOURCES-AESTHETIC.md` | used |

For Three.js / R3F authoring conventions — naming, axis, scale, the
empties-as-anchors pattern — there's no add-on. The studio's
conventions live in `docs/BLENDER-ADDON.md` ("Canonical glTF export
settings") and are enforced by the studio add-on's validators.

## 4 — 3D-print specific

The studio prints on a belt printer (sculpture-wall reliefs) and on
resin (sculpture-piece + dragon-scale armature + the gyroid
waveguides). The Blender side of that pipeline:

| Name | Source | Licence | Role | Status |
| --- | --- | --- | --- | --- |
| 3D Print Toolbox | [extensions.blender.org/add-ons/print3d-toolbox](https://extensions.blender.org/add-ons/print3d-toolbox/) | GPL-2.0 | Analyse / Cleanup / Edit / Export. The first thing to run on any mesh that's about to head to a slicer. The "Make Manifold" pass handles most non-manifold edges, bad normals, and zero-area faces | used |
| Voxel Remesh modifier | Blender core | GPL | Watertight remesh. The sculpture pieces go through this at a tighter voxel size than the WebXR copy so the surface detail survives the slicer | used |
| Decimate modifier | Blender core | GPL | After remesh, decimate back down to a sane triangle count before slicing. Belt-print reliefs especially benefit from a planar-decimate pass | used |
| Boolean modifier | Blender core | GPL | The cleanup-everything tool. Cut, join, intersect; bake before export | used |
| Solidify modifier | Blender core | GPL | Shell creation for the wall reliefs. The 1.6 mm thickness comes from here | used |
| MACHIN3tools | [github.com/machin3io/MACHIN3tools](https://github.com/machin3io/MACHIN3tools) | GPL-2.0+ | The focus-mode + smart-delete pie menus speed up the print-prep pass. Free | used |

Belt-printer-specific helpers (scripts to convert Z-up scenes into
the belt's tilted coordinate system) live in the Hangar's blender-
pipelines skill rather than as an extension — see the further reading
section.

## 5 — NPR + cel-shading

The studio's stylised look is mostly rendered in TSL on the web side
(see `docs/TSL-MATERIALS.md`). The Blender side of NPR is for
authoring + stills + reference renders:

| Name | Source | Licence | Role | Status |
| --- | --- | --- | --- | --- |
| Line Art Grease Pencil modifier | Blender core | GPL | The modern Freestyle replacement. Real-time line generation from mesh, post-processable as Grease Pencil strokes. Used for line-art reference renders | lined-up |
| Freestyle | Blender core | GPL | The classic edge-line renderer. Still in 4.x, still works, still slow. Reach for it when Line Art doesn't give the exact stroke profile you want | lined-up |
| Goo Engine | [github.com/dillongoostudios/goo-engine](https://github.com/dillongoostudios/goo-engine) | GPL-3.0 | NPR fork of Blender — custom shader nodes, Light Groups, anime-style rendering. Worth knowing about; the studio mostly does cel work in TSL but the fork is a sanity-check reference for "how does this look in Eevee with proper NPR shading" | lined-up |

Hand-painted texture work goes out to Krita
(`docs/OPEN-SOURCE-STACK.md` covers Krita) or Blender's built-in
Texture Paint mode. No dedicated add-on; the brush set + the
Stencil-from-image workflow are enough.

## 6 — 360 / panorama / VR

| Name | Source | Licence | Role | Status |
| --- | --- | --- | --- | --- |
| Cycles equirectangular camera | Blender core | Apache-2.0 (Cycles) | Cycles → Camera → Type: Panoramic → Equirectangular. Used for the 360° plate renders that feed the spherical content | used |
| VR Scene Inspection | Blender core | GPL | OpenXR scene inspection in headset. Useful for "is this scene actually the right size when worn" before WebXR export. The runtime path is `@react-three/xr` on the web side | used |
| Mantaflow (fluid + smoke) | Blender core | GPL | Lined-up for the atmospheric stills, not the WebXR loop | lined-up |

There's a parallel doc covering the 360° asset side at
`docs/RESOURCES-360-SPHERICAL.md` — the *capture* and *runtime*
plate sources. This row is the *authoring* side, in Blender, for
synthetic 360 plates.

## 7 — Procedural geometry + simulation

| Name | Source | Licence | Role | Status |
| --- | --- | --- | --- | --- |
| Geometry Nodes | Blender core | GPL | The core procedural-geometry graph. 4.x version is the production-ready one. The belt-pattern variants + the parametric sculpture armatures live here | used |
| Simulation Nodes | Blender core | GPL | Per-frame simulation on top of Geometry Nodes. Cloth, particles, fluid — all node-graph-driven | lined-up |
| Sverchok | [github.com/nortikin/sverchok](https://github.com/nortikin/sverchok) | GPL-3.0 | The older + more architectural-/CAD-leaning node system. Different tool to Geometry Nodes — fields, curves, surfaces, lattices. The waveguide-lattice work runs through Sverchok because the node library is denser for that kind of maths | used |
| Animation Nodes | [github.com/JacquesLucke/animation_nodes](https://github.com/JacquesLucke/animation_nodes) | GPL-3.0 | Motion-graphics specific node graph. Audio-reactive, time-driven, text-handling | lined-up |
| Bagapie | [extensions.blender.org/add-ons/bagapie](https://extensions.blender.org/add-ons/bagapie/) | GPL/MIT | Scattering + array + parametric generators + ivy generator. Free. Useful when a scene needs background dressing without hand-placing every prop | used |

## Recommended starter set

If I were setting up Blender from scratch tomorrow for Holoflow work,
in install order:

1. **Blender 4.5 LTS or 5.0 stable**, the current installer from
   blender.org. Don't chase the alpha unless you have a reason.
2. **The studio's own** `holoflow_webxr_exporter` from
   `tools/blender-addon/holoflow_webxr_exporter/`. Zip the folder,
   install through Preferences → Add-ons, enable it.
3. From extensions.blender.org with the online repo turned on:
   **Node Wrangler**, **LoopTools**, **F2**, **Bool Tool**,
   **Auto Mirror**, **3D Print Toolbox**, **Rigify**. Five minutes
   total. These restore the "built-in" feeling that older Blender
   installs had.
4. **VRM Add-on for Blender** — install from the GitHub release zip.
   Required if you're going to touch any avatar work.
5. **MACHIN3tools** — install from the GitHub repo. Free, opinionated,
   speeds up everything.
6. **Sverchok** — install from the GitHub release. The first time
   you need parametric or field-based geometry that doesn't fit
   neatly into Geometry Nodes, this is the tool.
7. **glTF-Transform CLI** at the bench — `npx @gltf-transform/cli`.
   No install; runs from the terminal next to gltfpack.

That covers the WebXR-asset pipeline, the print-prep pipeline, the
avatar pipeline, and the parametric-geometry side. The other 50-odd
add-ons on extensions.blender.org are nice to know but the seven
above are the working set.

## The studio's workflow in practice

How the studio currently uses the above on a typical asset
(2026-05-19):

1. **Block-out + modelling** — Blender 4.5 with the starter set
   above. Mira Tools for cleanup passes on the resin sculptures.
   MACHIN3tools pie menus for focus + smart-delete. Sverchok or
   Geometry Nodes for the procedural-pattern work (dragon scale,
   waveguide lattice, belt-relief variants).
2. **Aesthetic pass** — flat shading on every face for the high-
   facet look. Custom split normals where the angle threshold needs
   manual control.
3. **Print prep** — 3D Print Toolbox → Analyse, then Cleanup → Make
   Manifold. Voxel Remesh for watertight sculptures destined for
   resin. Decimate for belt-print reliefs.
4. **WebXR export** — N-panel → Holoflow tab → pick the preset →
   Validate → Export. The studio's add-on wraps the built-in glTF
   exporter with the canonical settings. The file lands at
   `public/models/<scene>/<slug>.glb`.
5. **Post-export polish** (when needed) — glTF-Transform CLI or
   `gltfpack` at the bench. Add a row to
   `lib/sculpture-gallery/catalogue.ts` (or the equivalent runtime
   catalogue), and the gallery picks it up.

The avatar pipeline is similar but starts with the VRM Add-on for
import + MToon shader setup, and exports to `.vrm` for the
`@pixiv/three-vrm` runtime.

## Commercial add-ons (noted, not recommended)

These are the commercial Blender add-ons that come up in every
"essential Blender plugins 2025" listicle. The studio hasn't standardised
on any of them. Flagged so the human can decide — there's a real case
for each, and a real subscription tax for each.

| Name | Source | Approx. price | What it does |
| --- | --- | --- | --- |
| Hard Ops + Boxcutter Bundle | [Superhive](https://superhivemarket.com/products/hard-ops--boxcutter-ultimate-bundle) | ~$90 bundle | Hard-surface modelling + box-cutting workflow. The de-facto standard for hard-surface in Blender. Same author as MACHIN3tools / DECALmachine | 
| Auto-Rig Pro | [Superhive](https://superhivemarket.com/products/auto-rig-pro) | ~$40 | Faster auto-rigging than Rigify. Includes a game-engine retargeter | 
| DECALmachine | [machin3.io/DECALmachine](https://machin3.io/DECALmachine/) | ~$50 | Non-destructive mesh decals + trim sheets. Same author family as Hard Ops | 
| UVPackmaster 4 | [Superhive](https://superhivemarket.com/products/uvpackmaster) | ~$40 individual | GPU-accelerated UV packing. Significantly faster + tighter than Blender's built-in pack | 
| Photographer 5 | [chafouin.gumroad.com](https://chafouin.gumroad.com/l/photographer5) | ~$40 | Physical camera + lighting workflow. ISO, shutter, gobos, IES, light mixer. Compatible with Blender 3 / 4 / 5 | 
| Animation Layers (commercial) | [Superhive](https://superhivemarket.com/products/animation-layers/) | ~$25 | NLA-on-rails animation layering. Same role as the free evilmushroom add-on but with more polish | 
| Bézier Mesh Shaper | [rafaelnavega.gumroad.com](https://rafaelnavega.gumroad.com/l/bezier_mesh_shaper) | ~$20 | Curve-driven mesh deformation for organic shaping | 

If a paid add-on goes into the workflow, add a row here with the
licence terms (per-seat? per-org? renewable?) and pair it with the
file or module that came to depend on it.

## Rejected (surveyed, not in catalogue)

| Name | Why excluded |
| --- | --- |
| Tilt Brush importer (older add-ons) | The studio uses Open Brush directly (Apache-2.0); the old TB importers are unmaintained and the format is the same. See `docs/OPEN-SOURCE-STACK.md`. |
| Various unmaintained "low-poly generator" add-ons | The studio's low-poly aesthetic is hand-modelled. Generators that auto-decimate to a faceted look land in uncanny territory; the human eye spots procedural facets. |
| GPL-only commercial add-ons sold without source on Gumroad | Not rejected for licence reasons — for *traceability* reasons. The platform Superhive ships source; bare Gumroad listings often don't. If the author disappears the studio is stuck. |
| Molecular (legacy particle physics add-on) | Superseded by Geometry Nodes simulation in 4.x for the use cases the studio cares about. |
| Blender Asset Manager forks (multiple) | Blender 4.x ships a built-in Asset Browser; the studio uses that. No third-party asset manager is in the pipeline. |

If you survey an add-on and decide *against* using it, add a row
here with the one-line reason. Saves the next person repeating the
survey six months later.

## Further reading

- [extensions.blender.org](https://extensions.blender.org/) — the
  official platform. Browse by category, sort by recently-updated,
  trust the verified-by-Blender badge.
- [Blender Manual](https://docs.blender.org/manual/en/latest/) —
  every built-in modifier + add-on has a section here. When the
  N-panel of an add-on is opaque, the manual usually clarifies.
- [Blender Developer Documentation](https://developer.blender.org/docs/) —
  for writing add-ons, not just installing them. The studio's own
  add-on cribbed conventions from here.
- [BlenderArtists.org](https://blenderartists.org/) — the community
  forum. The "Released Scripts and Themes" section is where
  community add-ons announce themselves.
- [Blender YouTube channel](https://www.youtube.com/@BlenderOfficial) —
  release walkthroughs for each version. The 4.2 LTS and 5.0 release
  videos are the fastest way to find out what new built-ins exist.
- Hangar `blender-pipelines` skill — internal, covers the
  fabrication-chain scripts that don't live as proper add-ons (belt
  printer coordinate fix, Hunyuan text-to-print, Looking Glass quilt
  pipeline, the MCP socket protocol for `bld_remote_mcp`). Different
  audience to this doc but adjacent enough to mention.

## Adding a new entry

1. Verify the URL works (manually, today). Note the licence from the
   repo or product page, not from secondhand listings.
2. Pick the right section. If it crosses sections (e.g. a procedural
   add-on that's also great for 3D print) put it in the *primary*
   role section and add a one-line cross-reference in the others.
3. Fill in every column. Empty cells are easy to gloss over; honest
   "lined-up" beats wishful "used".
4. If the entry replaces something in the rejected table, move the
   rejected row's reason into the new entry's description so the
   history isn't lost.

Five steps, five minutes. Worth doing every time so the next person
on the bench knows what's available and what's already been tried.
