# Texture Baking: Normal Map + AO from High-Poly to Low-Poly

**Blender 5.1 · CC0 · Holoflow Studio**

Bakes tangent-space normals and ambient occlusion from a sinusoidal-displaced,
subdivided high-poly sphere onto a clean 8×8 low-poly target using Cycles
selected-to-active baking. The resulting GLB contains the low-poly mesh with
Draco compression, WebP normal map, and AO map packed inline — ready for
WebXR delivery without any external texture files.

## Outputs

| File | Description |
|------|-------------|
| `baked_normal_ao.blend` | Source scene — high-poly, low-poly, packed images, full material |
| `baked_normal_ao.glb` | Draco-compressed low-poly + WebP normal map + AO |
| `normal_baked.png` | 512 × 512 tangent-space normal map (Non-Color) |
| `ao_baked.png` | 512 × 512 ambient occlusion map (Non-Color) |
| `viewport.mp4` | 3-second half-orbit EEVEE render showing catch-light shift |
| `screen.mp4` | OBS recording of the live bake in Blender |

## Running

```shell
# Step 1 — run the bake (30–90 s on CPU at TEX_SIZE=512)
blender --background --python blueprint.py

# Step 2 — render the preview orbit
blender --background --python record.py
```

## Key constants

| Constant | Default | Notes |
|----------|---------|-------|
| `TEX_SIZE` | 512 | Raise to 2048 / 4096 for production quality |
| `BAKE_SAMPLES` | 8 | Cycles samples per bake pass; 64 for cleaner AO |
| `EXTRUSION` | 0.18 | Ray-cast distance — must exceed displacement amplitude |
| `AMPLITUDE` | 0.12 | Sinusoidal displacement on the high-poly source |

## Why bake at all?

The displaced high-poly has ~8 000 faces after subdivision. The low-poly target
has 128. At 60 fps in WebXR the low-poly is trivially renderable; the high-poly
would miss frame budget on most mobile headsets. Baking transfers the surface
detail from geometry (expensive) into a texture (cheap at runtime).

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-texture-baking-normal-ao`
- UV unwrap is the prerequisite: `/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised`
- Complementary per-geometry approach: `/tutorials/blender-tutorial-faceted-custom-split-normals`
- Export pipeline context: `/tutorials/blender-to-site-asset-pipeline`

## Outside sources

- Blender Manual — Baking · CC-BY-SA · Blender Documentation Team
  https://docs.blender.org/manual/en/latest/render/cycles/baking.html
- glTF 2.0 Spec — Normal Texture · Apache-2.0 · Khronos Group
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-material-normaltextureinfo
- KhronosGroup/glTF-Blender-IO · Apache-2.0 · Khronos Group
  https://github.com/KhronosGroup/glTF-Blender-IO
