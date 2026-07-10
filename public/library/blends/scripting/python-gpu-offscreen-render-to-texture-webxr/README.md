# Python gpu.types.GPUOffScreen — Offscreen Render-to-Texture for WebXR Data Textures
**Blender 5.1 | CC0 | Holoflow Studio**

## What this entry teaches

Blender 5.1's Python GPU module exposes a headless render path via
`gpu.types.GPUOffScreen`. Rather than invoking the full Cycles or EEVEE
render pipeline, you create an OpenGL framebuffer at any resolution, draw
geometry with a custom GLSL shader, and read the colour attachment back to
a `bpy.types.Image`. The resulting texture — a world-space normal map,
position map, AO mask, or any custom data field — can be exported as a WebP
and embedded in a GLB as a data texture for Three.js TSL sampling.

This is the correct replacement for the deprecated `bgl` OpenGL wrapper
(removed in Blender 5.0). The `gpu` module is stable from Blender 4.0.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full pipeline: scene setup, GLSL shader, offscreen bake, WebP export, GLB export |
| `record.py` | Viewport animation: source sphere + baked-texture quad rotating in sync |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `world_normal_data_tex.webp` | Baked 512×512 world-space normal + depth texture (generated on run) |
| `normal_data_sphere.glb` | Icosphere with baked data texture embedded (generated on run) |
| `gpu_offscreen_bake.blend` | Saved session with scene and image data-block (generated on run) |

## Key API calls

```python
# Create an off-screen render target
offscreen = gpu.types.GPUOffScreen(512, 512)

# Draw into it
with offscreen.bind():
    fb = gpu.state.active_framebuffer_get()
    fb.clear(color=(0,0,0,0), depth=1.0)
    gpu.state.depth_test_set('LESS_EQUAL')
    shader.bind()
    shader.uniform_float('viewProjectionMatrix', vp_mat)
    batch.draw(shader)
    buf = fb.read_color(0, 0, 512, 512, 4, 0, 'FLOAT')

offscreen.free()  # release GPU memory
```

## Outside sources

- Blender Foundation — `gpu.types.GPUOffScreen` API reference
  <https://docs.blender.org/api/5.1/gpu.types.html#gpu.types.GPUOffScreen>
  Licence: CC-BY-SA 4.0

- Blender Foundation — GPU module overview
  <https://docs.blender.org/api/5.1/gpu.types.html>
  Licence: CC-BY-SA 4.0

## Studio cross-references

- [GPU Viewport Draw Overlay tutorial](/tutorials/blender-tutorial-python-gpu-viewport-draw-overlay)
- [Cycles Shader AOV Custom Pass Bake](/tutorials/blender-tutorial-python-cycles-shader-aov-custom-pass-bake-webxr)
- [Image Pixel Buffer SDF Texture Atlas](/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr)
- [Custom Render Engine tutorial](/tutorials/blender-tutorial-python-bpy-render-engine-webxr-snapshot)
