# Workbench Renderer — Technical Blueprint: Cavity Shading, Edge Outline & Colour-by-Object Exploded Assembly Diagram (Blender 5.1)

**Topic:** rendering / workbench  
**Blender version:** 5.1  
**Licence:** CC0

## What this is

Blender ships three render engines. Most tutorials target Cycles or EEVEE Next.
The **Workbench** engine is the one that runs in Solid viewport mode — promoted
here to a standalone renderer for producing technical illustration renders that
require zero lighting rigs, zero material nodes, and sub-second preview times.

The core technique: `scene.render.engine = 'WORKBENCH'`, then configure
`scene.display.shading` for `color_type='OBJECT'`, `show_cavity=True`, and
`show_object_outline=True`. Five lines of Python produce a render that reads
immediately as a technical assembly diagram.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the 5-part sensor pod, assigns object colours, configures Workbench, exports flat-emission GLB |
| `record.py` | Renders the 60-frame explode sequence to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for four tutorial takes |
| `.expected-artefacts.json` | CI manifest of expected output files |

## How to run

1. Open Blender 5.1 — Scripting workspace
2. Open `blueprint.py` → Run Script
3. The sensor pod appears; Workbench is active in Render Properties
4. Press numpad 0 for camera view, Space to play the explode animation
5. Open `record.py` → Run Script to produce `viewport.mp4`
6. Follow `SCREEN-RECORDING-NOTES.md` for the screen-capture video

## Expert notes

- `scene.display.shading` is a `View3DShading` struct — it feeds both the
  3D viewport (Solid mode) and the Workbench engine render. Changing it in
  Python is immediately visible in the Solid viewport without any bake step.

- `cavity_type='SCREEN'` uses a fast SSAO algorithm. `'WORLD'` uses mesh
  curvature; it captures concavities that face away from the camera (e.g. the
  underside of the lens dome when the camera is above). `'BOTH'` costs roughly
  2× but gives the sharpest reads on tight mechanical parts.

- Edge outline uses a Sobel filter on the depth buffer. It fires on any depth
  discontinuity — edges between separate objects, as well as silhouette edges
  within a mesh. You cannot control which edges outline via edge data (unlike
  Freestyle). Control comes from `object_outline_color` (brightness / contrast)
  and from scene-level depth thresholds.

- Object Color (`obj.color`) is ignored by Cycles and EEVEE shaders (unless
  you explicitly pipe it via `Object Info → Color` node). In Workbench with
  `color_type='OBJECT'` it is the *only* colour source. This means the same
  .blend file can render blueprint-style in Workbench and PBR-style in EEVEE
  by changing the engine — useful for dual-purpose studio assets.

## Related tutorials on this site

- [EEVEE Next — Bloom via Compositor](/tutorials/blender-tutorial-eevee-next-bloom-emission-glow-cel-shade)
- [EEVEE Next — Ray Tracing SSR](/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy)
- [Freestyle NPR Line Rendering](/tutorials/blender-tutorial-freestyle-npr-line-rendering)
- [GN Separate Geometry — Exploded View](/tutorials/blender-tutorial-gn-separate-geometry-exploded-view)

## Outside sources

- [Blender Manual — Workbench](https://docs.blender.org/manual/en/5.1/render/workbench/index.html)
  (CC-BY-SA-4.0, Blender Foundation)
- [Blender Manual — Cavity Shading](https://docs.blender.org/manual/en/5.1/editors/3dview/display/shading.html)
  (CC-BY-SA-4.0, Blender Foundation)
- [glTF 2.0 Specification — KHR_materials_unlit](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit)
  (CC-BY-4.0, Khronos Group) — the glTF equivalent of Workbench flat shading
