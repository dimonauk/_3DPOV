# Python bpy.types.TextCurve — 3D Font Object Scripting for WebXR Signage

**Blender 5.1 · scripting · CC0**

`bpy.data.curves.new(name, type='FONT')` returns a `bpy.types.TextCurve`
without any operator context. This blueprint scripts a two-line extruded sign
with a fitted backing panel, exports to GLB, and demonstrates the full
TextCurve data-API: font loading, `body_format` per-character material index,
and the convert-to-mesh pipeline.

## What this demonstrates

| Feature | API |
|---|---|
| TextCurve creation | `bpy.data.curves.new(name, type='FONT')` |
| Font loading | `bpy.data.fonts.load(filepath)` · Bfont fallback |
| Typography | `body`, `font`, `size`, `extrude`, `bevel_depth`, `bevel_resolution` |
| Alignment | `align_x`, `align_y`, `space_character`, `shear` |
| Per-character format | `tc.body_format[i].material_index` |
| Mesh conversion | `bpy.ops.object.convert(target='MESH')` |
| UV unwrap | `bpy.ops.uv.smart_project()` on extruded glyph mesh |
| Backing panel | `bmesh` from converted mesh vertex extents |
| Export | `bpy.ops.export_scene.gltf()` — Draco 6, WebP |

## How to run

1. Open Blender 5.1, switch to the **Scripting** workspace.
2. Open `blueprint.py` via the text editor.
3. Optionally set `FONT_PATH` to an absolute `.ttf` / `.otf` path.
4. Click **Run Script**. The scene is built and `holoflow_sign.glb` is
   written next to the `.blend` file.
5. Open `record.py` and **Run Script** to produce `viewport.mp4`.

## Expected outputs

| File | Description |
|---|---|
| `holoflow_sign.glb` | Three mesh objects, two PBR materials, Draco+WebP |
| `blueprint.py` | This blueprint |
| `record.py` | Viewport animation render script |
| `viewport.mp4` | Rendered via `record.py` |
| `screen.mp4` | Screen-recorded by Dimona per `SCREEN-RECORDING-NOTES.md` |

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-python-bpy-text-curve-3d-font-signage-webxr`
- Related: GN String to Curves 3D text approach
- Related: Bézier & NURBS Spline API (parent Curve data-block)
- Outside: [bpy.types.TextCurve API](https://docs.blender.org/api/5.1/bpy.types.TextCurve.html) — Blender Foundation CC-BY-SA-4.0
- Outside: [Nunito font](https://github.com/googlefonts/Nunito) — Vernon Adams, OFL
