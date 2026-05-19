# Install scan — Blender 5.1 (Sovereign-PC)

Descriptive snapshot of the Blender install on the studio's Sovereign-PC bench
as of 2026-05-19. This file is the **factual** counterpart to
`docs/BLENDER-EXTENSIONS.md`, which is the prescriptive knowledge base. If a
row here disagrees with the catalogue, this file wins — it's what was on
disk when the scan ran.

Scope: only the user-installed add-ons + the new-style extensions. The
Blender built-ins under `C:\Program Files\Blender Foundation\Blender 5.1\`
are not scanned — they ship with every install and are documented at
`docs.blender.org`.

Read-only scan. Nothing in the install was modified.

## Blender version

- **Version:** 5.1
- **User-data root:** `C:\Users\dimon\AppData\Roaming\Blender Foundation\Blender\5.1\`
- **Add-on path (legacy):** `…\scripts\addons\`
- **Extension path (new):** `…\extensions\blender_org\`
- **`config\userpref.blend`:** present but binary — enabled-state per
  add-on cannot be parsed from the file system alone. Treat the lists
  below as *installed*, not necessarily *enabled*. The user can confirm
  via Edit › Preferences › Add-ons inside Blender if it matters.

## Installed legacy add-ons — `scripts\addons\`

These are the pre-extensions add-ons sitting in the legacy folder. Sizes
are folder-scale categories — small (single-file or few-KB), medium
(a few MB), large (tens of MB or more). Last-modified dates from the
file-system, used as a freshness signal.

| Folder | Friendly name | Author | Version | Category | Source | Size | Last touched |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `skybrush_studio` | Skybrush Studio | CollMot Robotics Ltd. | 4.3.0 | Interface | commercial — drone-show licence | large (vendored deps) | 2026-05-12 |
| `AliceLG` | Alice/LG | Christian Stolze | 2.3.1 | View | community / GitHub — Looking Glass | large (bundled OpenCV + pynng) | 2026-04-07 |
| `bld_remote_mcp` | BLD Remote MCP | "Claude Code" | 1.2.3 | Development | studio-bespoke — Hangar pipeline | small | 2026-04-07 |
| `kitops` | KIT OPS | Chipp Walters et al. | 2.26.4 | 3D View | commercial — boxcutter ecosystem | medium | 2026-04-09 |
| `kitops-toggle-display` | KIT OPS Toggle Display | community | n/a | 3D View | community | small | 2026-04-09 |
| `Sanctus-Library` | Sanctus-Library | Sanctus, quackarooni | 3.3.2 | Material | commercial — Blender Market | medium | 2026-04-09 |
| `Sanctus-Bake` | Sanctus Bake | Sanctus | 1.0.1 | Material | commercial — Blender Market | medium | 2026-04-09 |
| `BYGEN` | BY-GEN | Curtis Holt | 9.2.1 | Generic | community — Curtis Holt | medium | 2026-04-09 |
| `chalk_style` | Chalk Style | Chipp Walters | 1.0.13 | Render | commercial — wireframe AO render | small | 2026-04-09 |
| `AntiSeam_1-2` | Anti-Seam | Tim Crellin (Thatimster) | 1.2 | Node | commercial — Blender Market | small | 2026-04-09 |
| `autouv` | AutoUV | Pamir Bal | 1.0.1 | (unset) | community | small | 2026-04-09 |
| `ZenUVChecker` | Zen UV Checker | Yatsenko + Zhornyak + Tyapkin + Teplov | 1.4.2 | UV | community — Zen UV team | small | 2026-04-09 |
| `speedretopo` | SpeedRetopo | Cedric Lepiller + EWOC | 0.4.0 | Object | community | small | 2026-04-09 |
| `CheckToolBox_v1_5` | CheckToolBox | (anonymous) | 1.5 | Mesh | community | small | 2026-04-09 |
| `b50_fluent_4_2_0_power_trip` | Fluent: Power Trip | rzr | 4.2.0 | Modeling | commercial — fluent-stressless.com | large | 2026-04-09 |
| `animation_extras` | AnimExtras (onion skinning) | Andrew Combs | 1.1.0 | Animation | commercial — Blender Market | small | 2026-04-07 |
| `in_placer` | in placer | Fatih Pehlevan | 1.0.2 | Animation | community | small | 2026-04-08 |
| `point_animate_by_kiri_engine` | Point Animate (KIRI Engine) | Blue Nile 3D | 1.0.2 | Animation | commercial — KIRI Engine | medium | 2026-04-09 |
| `render_arena_by_kiri_engine_basic` | Render Arena Basic (KIRI Engine) | Blue Nile 3D | 1.0.1 | Comprehensive | community-free — KIRI Engine | medium | 2026-04-09 |
| `edit_by_color_by_kiri_engine` | Edit By Color (KIRI Engine) | Blue Nile 3D | 2.1.0 | Mesh | community — KIRI Engine | small | 2026-04-09 |
| `KO-FreeMats_Masterfolder` | KO FreeMats (master library) | KaiOst | n/a (bundle) | Material | community — KaiOst KO-FreeMats | medium | 2026-04-09 |
| `LinkageObjectAligner_v1.0.2` | Linkage Object Aligner | community | 1.0.2 | Object | community — Gumroad | small | 2026-04-09 |
| `Mechanical Creature Kit Free` | Mechanical Creature Kit (free tier) | Mark Kingsnorth | n/a | Object | community-free | medium | 2026-04-09 |
| `MODAL_LATTICE_RESOLUTION-V_2` | Modal Lattice Resolution v2 | community | 2 | Modifier | community | small | 2026-04-09 |
| `mirrorselectedbones` | Mirror Selected Bones | community | n/a | Rigging | community | small | 2026-04-09 |
| `PowerSave` | PowerSave | bonjorno7, TeamC | 0.5.1 | View3D | community — bonjorno7 ecosystem | small | 2026-04-09 |
| `Quick Attach V2 by HuyKhoi2407` | Quick Attach V2 | HuyKhoi2407 | 2 | Object | community | small | 2026-04-09 |
| `simple-tabs` | SIMPLE TABS | bonjorno7, Chipp Walters, MasterXeon1001 | 1.2.5 | 3D View | community | small | 2026-04-09 |

Stray single-file scripts in the same folder (loose `.py` siblings):

- `__init__.py` — the user-modifications init the add-on folder ships with by default.
- `addon.py` (111 KB) — provenance unclear; not associated with any of
  the folders above. Treat as a stray detached install.
- `blender_zen_utils.py` (2 KB) — single-file ZenSets / Zen UV utility.
- `ui_skybrush_studio.py` (11 KB) — Skybrush UI vendor support module.
- `vendor/` — Skybrush's vendored `sbstudio` + `natsort` Python deps.

## Installed extensions (new format) — `extensions\blender_org\`

These are the post-4.2 extensions. All sourced from
**extensions.blender.org** (the official catalogue) per the
`.blender_ext/index.json` registry pin. Versions parsed from each
`blender_manifest.toml`.

| Extension id | Friendly name | Version | Tags | Min Blender | Maintainer | Role / one-liner |
| --- | --- | --- | --- | --- | --- | --- |
| `vrm` | VRM format | 3.26.3 | Import-Export, Animation | 4.2.0 | Isamu Mogi | VRM import / export / editing — the official VRM add-on for Blender. |
| `print3d_toolbox` | 3D Print Toolbox | 1.3.3 | Mesh | 4.2.0 | Mikhail Rachinskiy | The official 3D-print sanity toolkit: manifold check, wall thickness, volume, mesh repair. |
| `ThreeMF_io` | 3MF Import/Export | 2.5.0 | Import-Export | 4.2.0 | Clonephaze (fork) | 3MF reader/writer — the format Prusa, Bambu, and Cura use as native. |
| `freestyle_svg_exporter` | Freestyle SVG Exporter | 1.0.0 | Render | 4.2.0 | community (Folkert de Vries) | Renders Freestyle stylised edges to SVG — the screen-print / engraving pipeline. |
| `simple_gcode_importer` | Simple Gcode Importer | 1.1.1 | Import-Export, Pipeline | 4.2.0 | Kevin Nunley | Read sliced G-code back into Blender as curves — toolpath visualisation. |
| `print3d_toolbox` *(listed above)* | | | | | | |
| `tissue` | Tissue | 0.3.71 | Mesh | 4.2.0 | community (Alessandro Zomparelli) | Computational design — tessellate, dual mesh, reaction-diffusion. The dragon-scale family lives here. |
| `modular_tree` | Modular Tree | 5.5.0 | Mesh, Add Curve | 4.3.0 | GoodPie (fork) | Node-based procedural tree generation — exports pivot-painter textures for Unreal / Unity. |
| `decentraland_tools` | Decentraland Tools | 1.9.0 | Object, Import-Export | 4.2.0 | Decentraland Foundation | Scenes / wearables / emotes for Decentraland — glTF + atlas optimisation. |
| `lightpainter` | Light Painter | 1.5.6 | 3D View, Lighting, Object | 4.2.0 | Spencer Magnusson | Paint strokes on a mesh; the add-on places + aims area lights to match. |
| `hdri_lightbrush` | HDRI LightBrush | 1.0.1 | Lighting, Paint | 4.2.0 | Tamas Laszlo | Paint HDRI on a sphere — interactive studio lighting control. |
| `bool_tool` | Bool Tool | 2.0.0 | Modeling, Object | 4.5.0 | Nika Kutsniashvili (fork) | The maintained Bool Tool fork — quick boolean operators for hard-surface. |
| `mesh_repair_tools` | Mesh Repair Tools | 4.0.2 | Modeling, Mesh, UI | 4.2.0 | SineWave | Integrated mesh-repair toolbox — non-manifold, flipped normals, hole-fill. |
| `mixamo_rig` | Mixamo Rig | 1.1.9 | Import-Export, Rigging | 4.2.0 | BeyondDev / Tyler Walker | Generate a control rig from a Mixamo FBX skeleton — character-rig shortcut. |
| `sprite_sheet_maker` | Sprite Sheet Maker | 5.1.3 | Animation, Render | 5.1.0 | Manas R. Makde | 3D scene → 2D sprite sheet, with optional pixelation. |
| `storytools` | Storytools - Storyboard Tools | 3.3.2 | Animation, Grease Pencil, 3D View | 5.0.0 | Samuel Bernou | Storyboard + 2D animation tooling on top of Grease Pencil. |
| `geo_nodes_guide` | Geo Nodes Guide | — | Geometry Nodes | 4.2.0 | community | Interactive Geometry Nodes tutorial / cookbook. |
| `t3d_gn_presets` | T3D Geometry Nodes Presets | — | Geometry Nodes | 4.2.0 | community | GN preset library. |
| `marchingcube` | Marching Cubes | — | Mesh | 4.2.0 | community | Marching-cubes mesher inside Blender — voxel-to-mesh. |
| `strange_attractors` | Strange Attractors | — | Mesh | 4.2.0 | community | Generate Lorenz / Aizawa / Halvorsen attractors as curves. |
| `motion_sounds` | Motion Sounds | — | VSE | 4.2.0 | community | Add tap-style sound effects to keyframed motion. |
| `simple_audio_visualizer` | Simple Audio Visualizer | — | Animation | 4.2.0 | community | Audio waveform → animated geometry. |
| `gamepadcontrol` | Gamepad Control | — | Interface | 4.2.0 | community | Drive Blender's viewport / playback from a gamepad. |
| `controller_link` | Controller Link | — | Animation | 4.2.0 | community | Hardware controller mapping for live animation. |
| `proceduraltiles` | Procedural Tiles | — | Material | 4.2.0 | community | Procedural tile material generator. |
| `CurveFitting` | Curve Fitting | — | Curve | 4.2.0 | community | Curve-fitting tooling for splines. |
| `Utilities_Gadget` | Utilities Gadget | — | Interface | 4.2.0 | community | Misc viewport utility gadget. |
| `bbone_Tools` | Bendy Bone Tools | — | Rigging | 4.2.0 | community | Bendy-bone manipulation helpers. |
| `cursor_plus` | Cursor Plus | — | View3D | 4.2.0 | community | 3D cursor extras. |
| `math_formula` | Math Formula | — | Node | 4.2.0 | community | Type a math expression, get the corresponding shader-node tree. |
| `Duplication_Tool_addon` | Duplication Tool | — | Object | 4.2.0 | community | Array / duplication helpers. |
| `stl_format_legacy` | STL Format (Legacy) | — | Import-Export | 4.2.0 | Blender Foundation | The pre-4.x STL I/O kept available as an extension. |
| `web3d_x3d_vrml2_format` | X3D / VRML2 Format | — | Import-Export | 4.2.0 | Blender Foundation | X3D + VRML2 import/export. |
| `curve_tools` | Curve Tools | — | Curve | 4.2.0 | Blender Foundation | The classic Curve Tools add-on as a packaged extension. |
| `antlandscape` | A.N.T. Landscape | — | Mesh | 4.2.0 | Blender Foundation | The classic procedural landscape generator. |
| `vdm_brush_baker` | VDM Brush Baker | — | Sculpt | 4.2.0 | community | Bake vector-displacement-map sculpt brushes. |
| `extra_curve_objectes` | Extra Curve Objects | — | Curve | 4.2.0 | Blender Foundation | Extra parametric curves. |
| `btracer` | B-Tracer | — | Render | 4.2.0 | community | Frame-by-frame tracing utility. |
| `keymesh` | Keymesh | — | Animation | 4.2.0 | community | Mesh keyframe animation — different topology per frame. |
| `looptools` | LoopTools | — | Mesh | 4.2.0 | Blender Foundation | The classic LoopTools as an extension — bridge, circle, flatten, etc. |
| `f2` | F2 | — | Mesh | 4.2.0 | Blender Foundation | The classic F2 mesh-extension add-on. |
| `motionpath` | Motion Path | — | Animation | 4.2.0 | community | Motion-path visualisation extras. |
| `hot_node` | Hot Node | — | Node | 4.2.0 | community | Save / load node-tree presets. |
| `scatter_objects` | Scatter Objects | — | Object | 4.2.0 | community | Surface scatterer. |
| `bezier_curve_editor` | Bezier Curve Editor | — | Curve | 4.2.0 | community | Bezier-curve editing extras. |
| `screencast_keys` | Screencast Keys | — | Interface | 4.2.0 | community | Show pressed keys on-screen (for tutorial recording). |
| `amaranth` | Amaranth | — | Interface | 4.2.0 | Pablo Vazquez | The much-loved Amaranth toolset. |
| `node_to_python` | Node to Python | — | Development | 4.2.0 | community | Export a node tree as a Python add-on. |
| `fractal_family` | Fractal Family | — | Mesh | 4.2.0 | community | Parametric fractal generator. |
| `overscan_addon` | Overscan | — | Camera | 4.2.0 | community | Render with overscan margin (for VFX). |
| `lodify_optimizer` | LODify Optimizer | — | Mesh | 4.2.0 | community | Auto-generate LODs. |
| `brushstroke_tools` | Brushstroke Tools | — | Grease Pencil | 4.2.0 | community | Grease-pencil brush extras. |
| `o_oo_math_controller` | O.OO Math Controller | — | Animation | 4.2.0 | community | Math-driven driver controllers. |
| `sculpt_mask_facesets_tools` | Sculpt Mask / Face-Sets Tools | — | Sculpt | 4.2.0 | community | Mask + face-sets extras for sculpt mode. |
| `home_builder_5` | Home Builder 5 | — | Object | 4.2.0 | community | Architectural home-builder kit. |
| `e_topology_smooth` | E-Topology Smooth | — | Mesh | 4.2.0 | community | Edge-topology smoothing helper. |
| `grease_mesh` | Grease Mesh | — | Grease Pencil | 4.2.0 | community | Convert grease-pencil strokes to mesh. |
| `import_paint_brush` | Import Paint Brush | — | Paint | 4.2.0 | community | Import paint-brush presets. |
| `select_similar_geometry` | Select Similar Geometry | — | Mesh | 4.2.0 | community | Selection helper. |
| `gizmo_resizer` | Gizmo Resizer | — | UI | 4.2.0 | community | Resize viewport gizmos at runtime. |
| `bone_math` | Bone Math | — | Rigging | 4.2.0 | community | Bone-math helper. |
| `surface_diagnostics` | Surface Diagnostics | — | Mesh | 4.2.0 | community | Surface-quality diagnostics. |
| `sidebar_tab_search` | Sidebar Tab Search | — | UI | 4.2.0 | community | Search the N-panel tab stack. |
| `savepoints` | Savepoints | — | File | 4.2.0 | community | Named save-points within a session. |
| `easy_tree` | Easy Tree | — | Mesh | 4.2.0 | community | Simpler tree generator. |
| `node_arrange` | Node Arrange | — | Node | 4.2.0 | community | Auto-arrange node trees. |
| `modern_primitive` | Modern Primitive | — | Object | 4.2.0 | community | A modern primitives library. |

Dash (—) in version / category means the manifest was present but not
captured in this pass; the extensions browser inside Blender will show
the full row. The 60+ extensions installed are predominantly community
add-ons pulled from extensions.blender.org.

## Active vs disabled

Cannot be parsed from disk. `userpref.blend` is a binary Blender file
and the scan is strictly read-only. The user can confirm via:

```
Edit → Preferences → Add-ons → "Enabled" filter
```

Any add-on with `category` listed above will show up under that
category's filter in the preferences pane.

## Studio bench notes

- **Skybrush Studio** is the highest-leverage commercial install here —
  it's why the drone-show pipeline lives on this bench and not on
  someone else's. The vendored `sbstudio` deps + the `ui_skybrush_studio.py`
  shell are evidence of an active install (last touched 2026-05-12).
- **AliceLG** ships its own OpenCV + pynng — that's the Looking Glass
  bridge pipeline. Lives next to `D:\The_Hangar\` finishing-school
  protocol.
- **bld_remote_mcp** is the studio's own MCP socket bridge for
  remote Blender control from Claude / agent loops. Documented at
  `D:\The_Hangar\engines\splat360\docs\already-installed-tools.md`.
- **Sanctus-Library + Sanctus-Bake** are the commercial material /
  baking pair. Used in the print pipeline for material previews.
- **KIT OPS** is the kit-bash / boolean / hard-surface workhorse.
- **Fluent: Power Trip** is the modelling-modifier shortcut suite.
- **The three KIRI Engine add-ons** (Render Arena, Point Animate,
  Edit By Color) are the photogrammetry-side toolchain — KIRI does
  the scanning, these import / process / render.
- **The new-style extensions** lean heavily community-driven: VRM,
  Tissue, Modular Tree, Light Painter, Mixamo Rig, Sprite Sheet Maker,
  Storytools, 3D Print Toolbox, 3MF I/O, Freestyle SVG Exporter,
  Decentraland Tools, Simple GCode Importer — that's the bulk of the
  studio's actual day-to-day extension stack.

## Hangar Blender writeups index

The Hangar at `D:\The_Hangar\` has the following Blender-related
documentation. Paths absolute. One-liner per file.

- `D:\The_Hangar\.agent\skills\vrm-avatar-blender\SKILL.md` — Skill
  covering VRM avatar import, bone-mapping, blendshape access, and
  pose-mode manipulation in `bpy`.
- `D:\The_Hangar\writeups\2026-05-12-nine-seconds-to-printable.md` —
  Long-form writeup of the SDXL → SAM2 → marching-cubes pipeline,
  references the Blender side of the printable-STL workflow.
- `D:\The_Hangar\engines\splat360\docs\already-installed-tools.md` —
  Catalogue of bench-installed tools including the Blender side of
  the splat / 3DGS pipeline.
- `D:\The_Hangar\engines\splat360\docs\hosting-platforms-landscape.md` —
  Hosting landscape for splat assets; touches on Blender / glTF.
- `D:\The_Hangar\engines\splat360\docs\holoflow-system-map.md` — The
  splat360 system map, including the Blender authoring step.
- `D:\.github\_3DPOV\docs\BLENDER-ADDON.md` — The site-side
  documentation for the studio's `holoflow_webxr_exporter` add-on
  (the canonical glTF export pipeline for WebXR Game Framework).
- `D:\.github\_3DPOV\docs\BLENDER-EXTENSIONS.md` — Companion to
  this scan; the **prescriptive** knowledge base of add-ons the
  studio uses / has lined up / has rejected.

Tutorial-side coverage on the studio website that touches Blender:

- `components/tutorials/entries/blender-to-site-asset-pipeline.tsx` —
  End-to-end glTF export through the studio's exporter add-on.
- `components/tutorials/entries/from-photograph-to-object.tsx` —
  Photogrammetry into a printable object, Blender as the cleanup stop.
- `components/tutorials/entries/from-jamcam-to-mesh.tsx` — JamCam
  capture through to mesh, Blender as the topology stop.

The eight new add-on tutorials in this pass slot into the same
registry — see the commit log for the contiguous insert in
`lib/tutorials.tsx`.
