# Cloth Simulation → Vertex Animation Texture (VAT) for WebXR
**Blender 5.1  ·  Scripting  ·  CC0**

A Vertex Animation Texture (VAT) bakes an entire physics simulation into two
flat images: one for per-vertex world positions and one for normals.  The
WebXR runtime replaces the GPU vertex fetch with a texture sample — no
skeleton, no morph targets, no joint matrices.  The mesh topology is static in
the GLB; the motion lives in the EXR pair.

## Artefacts
| File | Description |
|------|-------------|
| `cloth_vat.blend` | Cloth scene with modifier, wind force, VAT images |
| `cloth_flag_rest.glb` | Rest-pose mesh with `VAT_ID` UV channel for shader |
| `vat_position.exr` | 32-bit float RGBA — normalised world positions per frame |
| `vat_normal.exr` | 32-bit float RGBA — remapped normals per frame |
| `vat_meta.json` | Bounding box + frame count for shader-side decode |
| `blueprint.py` | Standalone Blender script reproducing all artefacts |
| `record.py` | OpenGL viewport animation — outputs `viewport.mp4` |

## VAT texture layout
```
     col 0        col 1   …   col N-1   [padding to next PoT]
row 0   frame 1 vert 0   …
row 1   frame 2 vert 0   …
…
row 47  frame 48 vert 0  …
```
`VAT_ID` UV channel stores `u = vertex_index / (VAT_WIDTH - 1)` per loop.
The WebXR shader samples at `vec2(aVatId, frame_t)`.

## Position decode in shader
```glsl
vec3 pos_n = texture(uVATPos, vec2(aVatId, frame_t)).rgb;
vec3 pos   = uBBoxMin + pos_n * uBBoxSize;
```
`uBBoxMin` and `uBBoxSize` come from `vat_meta.json`.

## Why float EXR over 8-bit PNG
A 1-metre cloth simulated over 48 frames can shift a vertex by ~0.5 m.
Encoding that into [0, 255] gives ~2 mm precision — visible stepping at
any camera distance under 5 m.  32-bit float EXR gives sub-micron precision
at no runtime cost (the GPU samples float textures natively).

## Related tutorials
- [Depsgraph evaluated geometry](/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export)
- [Image pixel buffer / EXR packing](/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr)
- [Modifier stack pre-export apply](/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply)
- [Mesh attributes foreach_set](/tutorials/blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline)
