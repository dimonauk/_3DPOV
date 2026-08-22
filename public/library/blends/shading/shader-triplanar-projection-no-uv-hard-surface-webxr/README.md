# Triplanar Projection — Seamless No-UV Texturing (Blender 5.1)

**Topic:** Shading → Triplanar projection  
**Blender version:** 5.1  
**Licence:** CC0  
**Studio tags:** hard-surface, webxr, procedural, glb, no-uv, terrain

## What this is

Triplanar mapping projects a texture from all three axis planes simultaneously
and blends the results using the mesh's surface normal as a weight.  The result
is seam-free on any topology — no UV unwrapping required.

This is the go-to technique for:
- Imported meshes without UVs (scans, CAD exports)
- Infinitely tiling terrain and rock surfaces
- Hard-surface props where seam placement is difficult
- Rapid prototyping before investing in UV layout

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: boulder mesh + triplanar shader + bake + GLB export |
| `record.py` | 90-frame viewport render (boulder rotation + SHARPNESS animation) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the screen capture |
| `.expected-artefacts.json` | CI artefact manifest |

## How to run

1. Open Blender 5.1.
2. Create `output/` folder next to this file (or edit `OUT_DIR` in `blueprint.py`).
3. Open `blueprint.py` in the Text Editor → **Run Script**.
4. Check System Console for `[holoflow] triplanar_boulder complete`.
5. Open `record.py` → **Run Script** to render `viewport.mp4`.

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `SCALE` | `2.0` | Texture repeat per Blender unit — higher = tighter tiling |
| `SHARPNESS` | `4.0` | Blend exponent: 1 = smooth seams, 4 = hard-surface, 8 = razor |
| `BAKE_RES` | `1024` | UV bake image resolution |

## Sharpness reference

| Value | Visual result | Best use |
|-------|--------------|----------|
| 1.0 | Very smooth blend zone, near-invisible seams | Organic / cloth |
| 2.0 | Gentle blend, almost no banding | Terrain / rock |
| 4.0 | Clean hard-surface transition | **Studio default** |
| 8.0 | Near-sharp seam, slight artefact at 45° | Tiled panels |

## glTF export note

Triplanar shaders have no `KHR_` extension in glTF.  The blueprint bakes
the Diffuse channel to a 1024 × 1024 PNG, wires it into the Principled BSDF
`Base Color` socket, then exports.  Roughness and Normal bakes can be added
with the same `setup_bake_target` + `bake_diffuse` pattern.

## Cross-references

- [Principled BSDF v2 full parameter map](/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr)
- [Texture Baking: Normal + AO for GLB export](/tutorials/blender-tutorial-texture-baking-normal-ao)
- [Shader AOV — Custom Render Passes](/tutorials/blender-tutorial-shader-aov-custom-render-passes) *(related bake workflow)*
- [GN Subdivide Mesh — Adaptive Terrain LOD](/tutorials/blender-tutorial-gn-subdivide-mesh-adaptive-noise-lod) *(terrain application)*

## Outside sources

- [Texture Coordinate Node — Blender Manual](https://docs.blender.org/manual/en/5.1/render/shader_nodes/input/texture_coordinate.html)
  (CC BY, Blender Foundation)
- [Mix Color Node — Blender Manual](https://docs.blender.org/manual/en/5.1/render/shader_nodes/converter/mix.html)
  (CC BY, Blender Foundation) — related: [blender/blender](https://github.com/blender/blender)
