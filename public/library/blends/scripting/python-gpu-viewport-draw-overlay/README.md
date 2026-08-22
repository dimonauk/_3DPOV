# Python — gpu Module: Custom Viewport Overlay
## Blender 5.1 · CC0 · Holoflow Studio Library

Draw coloured face-normal arrows in the 3D Viewport using Blender 5.1's
`gpu` module and `SpaceView3D.draw_handler_add`. No bgl. No OpenGL calls.
Fully supported on Blender's Metal, Vulkan, and OpenGL backends.

---

## What you get

| File | Purpose |
|---|---|
| `blueprint.py` | Full production script — paste into Scripting workspace and run |
| `record.py` | Viewport animation capture — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

---

## Quick start

1. Open Blender 5.1.
2. Switch the header layout to **Scripting**.
3. Open `blueprint.py` in the Text Editor.
4. Press **Alt+P** (Run Script).
5. Click any mesh object in the 3D Viewport — coloured arrows appear over
   every face, encoding normal direction as a blue (−Z) → red (+Z) gradient.
6. To remove: run `unregister_overlay()` in the Python Console.

---

## How it works

```
Active mesh
  └─ evaluated_get(depsgraph)    # post-modifier positions + normals
       └─ for each polygon
            ├─ world_centre  = mat @ poly.center
            ├─ world_normal  = (inv_mat_T_3x3 @ poly.normal).normalized()
            ├─ tip           = world_centre + world_normal * NORMAL_LENGTH
            └─ colour        = lerp(COL_DOWN, COL_UP, (normal.z + 1) / 2)

gpu.shader.from_builtin('SMOOTH_COLOR')
  + batch_for_shader('LINES', {pos, color})
  → draw in POST_VIEW region (world-space, after geometry, depth-tested)
```

---

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `NORMAL_LENGTH` | `0.15` | Arrow length in metres |
| `LINE_WIDTH` | `2.5` | Pixel width of arrows |
| `COL_DOWN` | blue | Colour for normals pointing toward −Z |
| `COL_UP` | red | Colour for normals pointing toward +Z |

---

## Compatibility

- Blender 5.1 — confirmed against `gpu.shader.from_builtin` signature in 5.x API.
- Blender 4.0–4.x — compatible; `SMOOTH_COLOR` builtin was introduced in 4.0.
- Blender 3.x — replace `from_builtin('SMOOTH_COLOR')` with `from_builtin('3D_SMOOTH_COLOR')`.
- bgl was removed in 5.0; this script does not use bgl.

---

## Tutorial

Full walkthrough, expert notes, and troubleshooting:
`/tutorials/blender-tutorial-python-gpu-viewport-draw-overlay`

---

## Licence

CC0 — public domain. No attribution required.
