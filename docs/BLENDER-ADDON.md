# Blender add-on — Holoflow WebXR Game Framework exporter

Lives at `tools/blender-addon/holoflow_webxr_exporter/`. The author-
facing README sits inside the add-on folder; this doc is the
repository-side reference for the framework conventions the add-on
codifies.

## Why this exists

The Holoflow WebXR Game Framework reads glTF assets from
`public/models/<scene>/<slug>.glb`. Every asset on the site has to
land in the same shape — same axis convention, same compression
profile, same texture format, same animation bake rate — or the
runtime loader has to branch per asset and the scene budgets in
`docs/WEBXR-DEVICE-TARGETS.md` stop being enforceable.

The studio shipped a few rounds of "everyone remember the export
checklist" before accepting that automation was the only honest
answer. This add-on is the automation. The pipeline conventions live
in code now, not in the back of someone's head.

## Canonical glTF export settings

The defaults below are what `HOLOFLOW_OT_export_scene_glb` runs. The
rationale per option:

| Setting | Value | Why |
| --- | --- | --- |
| `export_format` | `GLB` | Single-file binary. The runtime loader doesn't have to fetch siblings. |
| `export_yup` | `True` | +Y up — glTF spec convention. Blender is +Z up, so the exporter does the rotation. Three.js then reads the file with no further axis math. |
| `export_apply` | `True` | Bake location, rotation, scale into the mesh. The scene graph at runtime is for grouping, not for transforms. |
| `export_apply_modifiers` | `True` | The mesh that ships is the mesh the modifier stack produces. Authors stop wondering "did the bevel ship?". |
| `export_draco_mesh_compression_enable` | `True` | Draco is the standard glTF mesh compression. The site preloads the Draco decoder so the cost is one-shot. |
| `export_draco_mesh_compression_level` | `6` (5–7 per preset) | Six is the workshop default — good size reduction with acceptable decode cost on a Quest 3 / XR2 Gen 2 class device. Splat props drop to 5 to keep detail; wall reliefs go to 7 because they're flat and the smaller payload matters more. |
| `export_image_format` | `WEBP` | Smaller than PNG and JPEG for most game-asset textures, with full alpha support. Browser support is universal on every device in the hard deck. |
| `export_tangents` | `True` | Normal-mapped materials need explicit tangents — the runtime can derive them, but the per-frame cost is real. Ship them precomputed. |
| `export_animations` | `True` (preset overrides) | Sculpture pieces and wall reliefs don't animate. Splat props and SceneStage props do. |
| `export_frame_range` | `True` | Use the scene's frame range, not the action's clipped range. |
| `export_force_sampling` | `True` | Sample every animated channel even if the animation system thinks they're constant. The runtime mixer wants the full set. |
| `export_anim_single_armature` | `True` | One armature per file. Multi-armature glTF is a nightmare at runtime. |
| `export_cameras` | `False` | The scene owns the camera. Assets that ship a camera shadow the scene's. |
| `export_lights` | `False` | Same — the scene owns the lighting. |
| `export_extras` | `True` | Blender custom properties (including `holoflow:facet`) survive into the glTF `extras` field, which the runtime can read for per-asset behaviour. |
| `fps` (during export) | `30` | The animation bake rate is locked to 30 fps to match the site's render loop budget. Higher rates ship junk frames that the runtime drops anyway. |

## The Y-up convention

Blender is +Z up. glTF is +Y up. The exporter is the conversion point
— `export_yup = True` rotates the mesh and the animation tracks once
on export. The runtime (Three.js with the glTF loader) reads the file
as-is, with no further axis math.

The author's responsibility: model in Blender's native +Z up. Don't
pre-rotate the mesh to compensate, and don't ship `-Y forward` from
the exporter dropdown either. The default convention everywhere is
"Blender +Z up, glTF +Y up, runtime +Y up", and a hand-rolled rotation
breaks the contract.

## The Draco level choice

Draco compression sits on a curve: higher level = smaller payload,
slower decode. The studio settled at level 6 as the workshop default
after profiling a Quest 3 cold-load:

- Level 4: 38% smaller than uncompressed, decode ~40 ms.
- Level 6: 58% smaller, decode ~70 ms.
- Level 8: 64% smaller, decode ~180 ms.
- Level 10: 65% smaller (no meaningful gain), decode ~360 ms.

(Numbers are from a 50 k triangle hero prop on a Quest 3 Browser cold
load — yours will differ. The curve shape is what matters.)

Level 6 sits at the inflection: most of the payload reduction is
already in the bag, and the decode cost still fits inside a single
frame's CPU budget on an XR2 Gen 2 device. The two preset overrides
that move off 6 — wall reliefs at 7 and splat props at 5 — are doing
it deliberately: wall reliefs have flat geometry that compresses
disproportionately well, splat props are decoded on a desktop GPU
under streaming and we'd rather keep the detail than save a megabyte.

## The flat-normals-for-high-facet trick

The studio's resin-printed sculptures read as crystalline because
every face has its own normal — no smoothing across edges. The look
is the look. The problem is that glTF doesn't carry Blender's "Shade
Flat" bit directly; it ships per-vertex normals, and a per-vertex
normal that averages across two adjacent faces produces a smooth
shading band where the artist wanted a hard crease.

The fix is custom split normals. The exporter does the following on
every object marked `holoflow:facet`:

1. Set `polygon.use_smooth = False` on every polygon. The mesh now
   reads flat in Blender too — useful as a visual confirmation.
2. Clear any existing custom split normals on the mesh.
3. Add custom split normals from the current (flat) state.
4. Set `mesh.use_auto_smooth = True` with an auto-smooth angle of 0
   radians, meaning every edge is treated as a crease.

The glTF exporter then sees the per-face normals, writes per-vertex
normals that duplicate at every edge, and the runtime renderer
preserves the facet look exactly. Round-trip survival, automatic.

## Mesh validation thresholds

The validators in `validators.py` walk the scene and compare against
hard-deck numbers from `docs/WEBXR-DEVICE-TARGETS.md` (section 3,
per-device hard decks).

| Check | Threshold | Source |
| --- | --- | --- |
| Per-object triangle count (sculpture piece) | 80 k hard fail, 64 k warning | Quest 3 hard deck 500 k triangles / 6 simultaneous objects ≈ 80 k each. Three sculptures on screen leaves room for the gallery furniture. |
| Per-object triangle count (sculpture wall) | 20 k hard fail, 16 k warning | Wall reliefs are flat by construction; 20 k is generous. |
| Per-object triangle count (splat-walker prop) | 250 k hard fail, 200 k warning | Steam Frame PC stream hard deck 1.5 M triangles / 6 visible props ≈ 250 k each. |
| Per-object triangle count (SceneStage prop) | 60 k hard fail, 48 k warning | Middle of the road; SceneStage is everywhere and budgets matter. |
| UVs present when materials assigned | binary | A glTF with a material and no UVs ships a black mesh. |
| N-gons present | warning only | glTF triangulates on export but the studio prefers the artist to control the topology. |
| Zero-area faces | error | Degenerate geometry — ships invisible junk and lies about the count. |
| Root object name not snake_case | warning | Exporter auto-renames; cleaner git diff if the author does it. |
| Case-insensitive name collision | error | `public/models/` lives on case-insensitive filesystems (macOS HFS+, Windows) and one file silently overwrites the other. |

When the device-targets doc moves — new device, new budget, a SoC
generation that changes the hard deck — these thresholds move in
lockstep. Both files cite the same source.

## Future passes

These aren't in scope for the first add-on cut, but they're the
natural next steps:

- **Watch mode** — a background operator that re-exports the active
  collection on save. The author keeps Blender's autosave on and the
  site has fresh assets without a manual button push.
- **CI hook** — a pre-PR check that runs the validators against any
  changed `.blend` file in the diff, using Blender's command-line
  Python mode. Fails the PR on any `error` severity.
- **Asset manifest write-back** — when the export lands in
  `public/models/sculpture-piece/<slug>.glb`, generate a stub entry in
  `lib/sculpture-gallery/catalogue.ts` so the author only fills in
  `blurb` and `note`.
- **Looking Glass quilt export** — for the studio's Looking Glass
  display, alongside the standard glTF, write a per-camera quilt
  texture using the Hangar's blender-pipelines skill.

Open one of these as a separate workstream when the framework
genuinely needs it. Until then, the add-on does one thing — author-
hand-rolled `.glb` files that obey the studio's conventions — and
does it without ceremony.
