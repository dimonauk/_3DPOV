# Python bpy.types.Image — Pixel Buffer: SDF Texture Atlas for WebXR

**Blender 5.1 · CC0 · Holoflow Studio**

Teaches `bpy.data.images.new()`, flat pixel buffer construction with
`array.array('f', ...)`, bulk upload via `foreach_set('pixels', buf)`, and
WebP export into the WebXR asset pipeline.

## What you build

A 512×512 greyscale texture atlas containing four SDF (Signed Distance Field)
shapes packed into UV quadrants:

| Quadrant | Shape | Use in shader |
|----------|-------|---------------|
| Top-right | Filled circle | Lens flare mask |
| Top-left | Ring / annulus | Neon halo |
| Bottom-left | Rounded box | UI element shadow |
| Bottom-right | Radial gradient | Point-light falloff |

The atlas is exported as a `Non-Color` WebP and embedded in a GLB sphere
ready for a Three.js `DataTexture` in WebXR.

## Key techniques

- `float_buffer=True` — 32-bit per channel prevents quantisation banding on SDF edges
- `img.colorspace_settings.name = 'Non-Color'` — skips sRGB gamma on data textures
- `foreach_set('pixels', buf)` — single C-level bulk write; 10–50× faster than element-wise
- Quilez 2D SDF functions — circle, annular ring, axis-aligned box
- `smooth_step()` — C1-continuous Hermite curve anti-aliases the SDF edge
- Atlas packing — four masks, one texture unit, one draw call

## Running

1. Open Blender 5.1 with an empty scene.
2. Open `blueprint.py` in the Scripting workspace.
3. Run the script → creates `sdf_texture_atlas.webp` and `sdf_atlas_sphere.glb`
   in the same directory as the `.blend` file.
4. Open `record.py` in a second Text editor slot and run to render `viewport.mp4`.

## Artefacts

| File | Purpose |
|------|---------|
| `sdf_texture_atlas.webp` | Non-Color atlas, 95% WebP, 512×512 |
| `sdf_atlas_sphere.glb` | Sphere + atlas, Draco-6, WebP textures |
| `viewport.mp4` | Crossfade reveal recording (120 frames) |
| `screen.mp4` | OBS screen capture (see SCREEN-RECORDING-NOTES.md) |

## Outside sources

- **Blender Foundation** — `bpy.types.Image` API Reference — CC-BY-4.0
  <https://docs.blender.org/api/5.1/bpy.types.Image.html>
- **Inigo Quilez** — 2D SDF Functions — MIT
  <https://iquilezles.org/articles/distfunctions2d/>

## Cross-references

- [Python Mesh Attributes: foreach_set/foreach_get](/tutorials/blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline)
- [Cycles Shader AOV Custom Pass Bake](/tutorials/blender-tutorial-python-cycles-shader-aov-custom-pass-bake-webxr)
- [Compositor Render Passes EXR Pipeline](/tutorials/blender-tutorial-python-compositor-nodetree-render-passes-eevee-glb-bake)
- [Texture Baking Normal + AO](/tutorials/blender-tutorial-texture-baking-normal-ao)
- [Python Scene Colour Management AgX](/tutorials/blender-tutorial-python-scene-color-management-agx-ocio-bake-safe)
