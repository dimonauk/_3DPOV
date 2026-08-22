# GN Is Viewport + Switch — Automatic Render-vs-Viewport LOD

**Topic**: Geometry Nodes | **Blender**: 5.1 | **Licence**: CC0

`GeometryNodeIsViewport` is a zero-input field source that returns `True` while
the GN tree is being evaluated for the interactive 3D viewport and `False` for
every other evaluation context — final render, Cycles baking, viewport render
animation, and `bpy.ops.export_scene.gltf(export_apply=True)`.

Paired with `Switch(GEOMETRY)`, a single modifier automatically presents the
artist with a fast low-poly mesh and feeds the bake / GLB pipeline with a
detailed subdivided + noise-displaced version. No duplicate objects, no render
layer visibility flags, no manual "swap before bake" workflow.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full GN tree + scene setup. Run in Blender Scripting workspace. |
| `record.py` | 90-frame EEVEE camera orbit — records the render-time geometry. |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for recording the viewport low-poly ↔ render switch. |

## Quick start

1. Open Blender 5.1, switch to the **Scripting** workspace.
2. Open `blueprint.py` and press **Run Script**.
3. A server panel prop appears. In SOLID viewport shading it shows the
   low-poly box (~12 faces). Press Z → **Rendered** — the subdivided +
   displaced version appears (192+ faces).
4. Call `export_glb()` from the Python console to write `server_panel_lod.glb`.
   The GLB always contains the render-time geometry (Is Viewport = False).

## GLB export caveat

`bpy.ops.export_scene.gltf(export_apply=True)` evaluates every GN modifier in
render context. `Is Viewport` evaluates to `False`, so the high-quality
subdivided mesh is what the exporter sees. Artists who check the face count in
`gltf-validator` and expect 12 faces will find 192 — this is correct and
intentional. Document this in your studio's export checklist.

## Simulation Zone interaction

In GN Simulation Zones, `Is Viewport` prevents expensive physics simulations
from running during Cycles bakes. Wrap the simulation zone output in a
`Switch(GEOMETRY)` gated by `Is Viewport`: in the viewport the live simulation
runs; during baking a cached static mesh is used. See the GN Bake Node tutorial
for the companion caching pattern.

## Source

- Blender Manual: [Is Viewport node](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/misc/is_viewport.html) — CC-BY Blender Foundation
- Related repo: [blender/blender](https://github.com/blender/blender)
