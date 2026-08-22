# Vector Displacement Map — Multires Sculpt Bake to 32-bit EXR
Blender 5.1 | CC0 | Holoflow Studio

A vector displacement map (VDM) stores per-texel surface offset in a
32-bit float OpenEXR image.  Unlike an 8-bit normal map, a VDM encodes
actual signed displacement so Cycles can tessellate real geometry at
render time — producing correct silhouettes and self-shadowing that
WebXR runtime renderers cannot replicate.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Fully automated pipeline: panel mesh, high-poly source, bake, VDM shader, adaptive subdivision |
| `record.py` | Viewport animation record (panel orbit + dicing rate sweep) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar script with timestamps and common failure modes |
| `vdm_armour_panel.exr` | Baked 32-bit float displacement EXR (written by blueprint.py) |

## Pipeline in 30 Seconds

```
Low-poly panel (800 tris)
    ↓  Duplicate
High-poly (× 16 via SubD 4) + Displacement modifier (Noise, 0.015 m)
    ↓  Cycles DISPLACEMENT bake (Selected-to-Active, cage 0.0165 m)
32-bit float Non-Color OpenEXR (1024 × 1024)
    ↓  Vector Displacement node (Tangent Space)
Cycles render with Adaptive Subdivision (dicing 1.0 px)
    ↓  GLB export
Switch to Bump Only + disable SubD; bake normal map → include in GLB
```

## Key Decisions

**32-bit float over 16-bit half-float**
Half-float covers ±65504 but loses sub-millimetre precision near zero (half
ULP ≈ 0.0006).  At 0.015 m displacement amplitude over a 1 K grid, each
texel represents 0.015/1024 ≈ 14 µm — well below half-float resolution.
Use 32-bit float; the file is ≈ 4 MB per 1024² channel.

**Non-Color colorspace is mandatory**
Blender applies sRGB gamma decode to "Colour" images in the shader.  A VDM
is raw linear data; gamma decode corrupts the displacement values.

**Cage extrusion = 110 % of displacement amplitude**
Too small: rays from the low-poly miss high-poly faces that protrude beyond
the cage boundary → unresolved artefacts at high-amplitude features.
Too large: rays penetrate the opposite wall of thin geometry → bleeding at
UV seams.

**Adaptive Subdivision, not fixed SubD**
Fixed subdivision tessellates every quad equally regardless of camera
distance.  Adaptive dices only the visible micropolygon budget where
displacement changes fastest (silhouette edges, rivet faces).  Cycles'
`dicing_rate` is measured in pixels per micropolygon edge; 1.0 gives
cinema-quality; 4.0 gives preview quality.

## Export Dichotomy

| Target | Displacement method | Workflow |
|--------|--------------------|---------:|
| Cycles render | VDM + Adaptive SubD | Keep blueprint.blend unchanged |
| WebXR / GLB | Bump Only | Bake normal map from displaced render → export in GLB |
| Real-time engine (Godot, Unity) | Normal + height map | Same normal map bake |

## Related Tutorials

- `/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision`
  — scalar height displacement with procedural noise (the simpler path that
  this tutorial extends with a baked-from-sculpt VDM source)
- `/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr`
  — the batch bake pipeline used to produce the GLB-deliverable normal map
- `/tutorials/blender-tutorial-texture-baking-normal-ao`
  — foundational bake workflow; understand this before attempting VDM bake

## Outside Sources

1. **Blender Manual — Vector Displacement Node**
   https://docs.blender.org/manual/en/latest/render/shader_nodes/vector/vector_displacement.html
   Licence: CC-BY-4.0 © Blender Foundation

2. **AcademySoftwareFoundation/openexr** (Apache-2.0)
   https://github.com/AcademySoftwareFoundation/openexr
   Reference implementation and specification for OpenEXR 32-bit float format.
   Related: `AcademySoftwareFoundation/Imath` (Apache-2.0), `AcademySoftwareFoundation/openexr-website`.
