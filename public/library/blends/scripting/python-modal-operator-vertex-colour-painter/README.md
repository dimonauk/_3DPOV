# Python Modal Operator — Interactive 3-D Vertex-Colour Painter

**Blender 5.1 · CC0 · Topic: Scripting**

A complete example of the modal operator pattern applied to a practical
problem: painting vertex colours directly in the 3-D viewport by clicking
and dragging over a mesh surface.

## What this teaches

| Concept | Detail |
|---------|--------|
| Modal operator lifecycle | `invoke()` → `RUNNING_MODAL` → `modal()` → `FINISHED` / `CANCELLED` |
| Screen-space ray casting | `bpy_extras.view3d_utils` unproject + `scene.ray_cast()` BVH hit |
| Blender 5.1 colour attributes | `mesh.color_attributes` (replaces legacy `vertex_colors`) |
| GPU module HUD overlay | `SpaceView3D.draw_handler_add` + `gpu.shader` + `blf` |
| Handler cleanup | `draw_handler_remove` on every exit path; handler leak prevention |
| Operator options | `GRAB_CURSOR`, `BLOCKING`, `UNDO` — why each matters |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene setup + modal operator class + panel. Run once to register. |
| `record.py` | Programmatic demonstration + 150-frame turntable render. |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for screen.mp4. |

## Usage

1. Open Blender 5.1 and switch to the **Scripting** workspace.
2. Open `blueprint.py` and click **Run Script**.
3. Switch to the 3-D Viewport and press **N** to open the side panel.
4. Under the **Holoflow** tab, click **HF Vertex Colour Paint**.
5. Hold **LMB** and drag across the sphere — faces paint vermillion.
6. Press **Enter** to confirm or **Esc** to cancel.

## Notes

- The colour attribute domain is `CORNER` (per-loop), not `POINT` (per-vertex).
  This means each polygon can have a unique colour at a shared vertex, which is
  necessary for faceted / flat-shaded meshes.
- Undo works because `bl_options` includes `'UNDO'`.  Each invoke of the
  operator that ends in `FINISHED` is treated as one atomic undo step.
- MMB orbit, scroll zoom, and RMB-pan all pass through correctly mid-paint
  so you can navigate without leaving the tool.

## Extending

- Change `BRUSH_COLOUR` in the parameter block to any RGBA tuple.
- Add a `FloatVectorProperty` to the operator and surface it in the panel to
  let the user pick the brush colour via a standard colour picker.
- Increase `BRUSH_RADIUS_PX` and use `BVHTree` from `mathutils.bvhtree` to
  find all faces whose centre lies within the screen-radius cone for a soft
  brush falloff.

## Sources

- Blender Python API — `bpy.types.Operator.modal`:
  https://docs.blender.org/api/current/bpy.types.Operator.html#bpy.types.Operator.modal
- Blender Manual — Colour Attributes:
  https://docs.blender.org/manual/en/latest/sculpt_paint/vertex_paint/index.html
- njanakiev/blender-scripting (MIT):
  https://github.com/njanakiev/blender-scripting
