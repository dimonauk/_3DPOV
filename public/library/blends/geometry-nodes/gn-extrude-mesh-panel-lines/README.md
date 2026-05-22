# GN Extrude Mesh — Procedural Panel Lines

**Blender 5.1 | CC0 | Holoflow Studio**

A 4×4 wall-panel grid with a Geometry Nodes modifier that extrudes alternating
faces individually to create recessed panel lines, then chamfers each panel rim
using the `Extrude Mesh` Top socket fed directly into `Scale Elements`.

## What this produces

| Artefact | Description |
|---|---|
| `output/panel_lines.glb` | Draco-compressed GLB, ~5 KB |
| `panel_lines.blend` | Live GN modifier with Panel Depth and Panel Inset sliders |
| `../../videos/geometry-nodes/gn-extrude-mesh-panel-lines/viewport.mp4` | 60-frame animation: panels recess then chamfer appears |

## Run headless

```bash
blender --background --python blueprint.py
```

## Key techniques

**Individual extrusion** — `GeometryNodeExtrudeMesh` with `mode='FACES'` and
`inputs[4].default_value = True` (Individual). Each selected face extrudes
along its own normal independently. Adjacent extruded faces do not share
vertices at their edges — this gap is the panel line.

**Top socket reuse** — The `Top` output from Extrude Mesh is a live boolean
mask of the newly created end faces. Wiring it directly to
`GeometryNodeScaleElements.inputs['Selection']` chamfers exactly those faces
with no secondary attribute storage needed.

**Pre-tagged attribute** — The checkerboard face selection is computed in
Python (`(row + col) % 2 == 0`) and stored as a `BOOLEAN` `FACE` attribute
named `panel_face` via `mesh.attributes.new()`. The GN tree reads it with a
Named Attribute node. This keeps the GN tree minimal and readable.

**Flat shading** — `GeometryNodeSetShadeSmooth` with `domain='FACE'` and
`Shade Smooth=False` applied after Scale Elements guarantees faceted normals
on all faces, consistent with the studio cel-shading pipeline.

## Modifier inputs

| Socket | Key | Default | Range | Effect |
|---|---|---|---|---|
| Panel Depth | `Input_1` | -0.04 | -0.20 → 0.0 | Recess depth |
| Panel Inset | `Input_2` | 0.82 | 0.5 → 1.0 | Chamfer rim scale |

## Licence

CC0 — no attribution required. Outside references:
- Blender Manual Extrude Mesh node (CC-BY-SA 4.0, Blender Foundation)
- Blender Manual Scale Elements node (CC-BY-SA 4.0, Blender Foundation)
- glTF-Blender-IO export_apply documentation (Apache-2.0, Khronos Group)
