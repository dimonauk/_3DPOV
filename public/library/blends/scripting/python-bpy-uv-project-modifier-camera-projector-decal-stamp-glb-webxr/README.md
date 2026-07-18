# UVProjectModifier — Camera-Projected Decal Stamp & GLB Export (Blender 5.1)

`UVProjectModifier` writes UV coordinates by projecting each vertex through one
or more camera/light frustums. The modifier never touches pixel data — it writes
(u, v) pairs into a named UV layer. A UV Map node in the material then samples
that layer to drive a texture. The result: a badge, logo, or insignia
stamped onto any curved surface without manual UV unwrapping.

## What this builds

A ten-sided faceted buckler (shield) with a gold-on-steel diamond clan insignia
projected from an orthographic camera. Two UV layers coexist on the mesh:
`projected` (written by UVProjectModifier) and `LightmapUV` (reserved for
lightmap baking). The modifier is applied on an export duplicate before GLB
export so all downstream tools receive baked, static UV data.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene, modifier, material, apply, and GLB export |
| `record.py` | 90-frame orbit turntable render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Run order

1. Open Blender 5.1 → Scripting workspace → open `blueprint.py` → Run Script.
2. Press Z → Material Preview — the diamond insignia should appear on the shield.
3. Open UV Editor, Tab into Edit Mode, select all — the `projected` UV layer shows
   the diamond shape projected onto UV space.
4. Run `record.py` in the same session to generate `viewport.mp4`.
5. Follow `SCREEN-RECORDING-NOTES.md` to capture `screen.mp4` with OBS.

## Key parameters

| Param | Location | Effect |
|---|---|---|
| `uv_layer` | modifier | Which UV layer to write (must match UV Map node) |
| `projector_count` | modifier | 1–10 active projectors |
| `projectors[i].object` | modifier | Camera or Light object acting as projector |
| `aspect_x / aspect_y` | modifier | Must match image pixel ratio to prevent stretch |
| `scale_x / scale_y` | modifier | Fraction of frustum the image fills (1.0 = full frustum) |
| `ortho_scale` | Camera Properties | Frustum width in metres (Orthographic type only) |

Effective decal footprint = `ortho_scale × scale_x` metres wide.

## Blender 5.1 notes

- `use_image_override` and `image` on UVProjectModifier were removed in 4.0.
  Image selection is now handled entirely via the material node tree.
- Applying the modifier (`bpy.ops.object.modifier_apply`) requires OBJECT mode
  and the object must be the active context object.
- `export_texcoords=True` in `bpy.ops.export_scene.gltf()` is required for
  UV layer data to appear in the GLB.

## Multiple projectors

Set `projector_count = N` and assign `projectors[0..N-1].object`. Blending
is by vertex normal orientation: the projector whose direction is closest to
the surface normal contributes more. This allows seamless logos on cylindrical
props without a seam where the projection wraps around the back.
