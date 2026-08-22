# Procedural Wood Grain Shader

**Blender 5.1 · Category: shading · Licence: CC0**

Procedural oak plank shader built entirely from noise and wave primitives —
no image textures, no UV painting required.  Models annual ring colour variation
(dark latewood / light earlywood cycle), grain-line waviness, per-fibre roughness
texture, and the characteristic anisotropic sheen of sanded timber.  Exports to
GLB with `KHR_materials_anisotropy` so Three.js renders the grain highlight in
real-time WebXR.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Python script: mesh, shader, lights, camera, GLB export |
| `record.py` | Viewport animation: 4-second camera orbit showing anisotropic band |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for tutorial screen capture |
| `wood_grain.blend` | Generated after running blueprint.py |

## Quick start

```
blender --background --python blueprint.py
```

Or open Blender 5.1, paste `blueprint.py` into the Text Editor, click Run Script.
Run `record.py` in the same session to render `viewport.mp4`.

## Key techniques

### Annual ring pattern

`ShaderNodeTexWave` with `wave_type='BANDS'` and `bands_direction='X'` generates
parallel band oscillation along the X axis.  Object-space coordinates are pre-scaled
with a strong Z-compression (`LONG_COMPRESS = 0.06`) before the Wave node:  the
ring cross-section stretches into a 17:1 ellipse that reads as long grain lines on
the flat faces and tight arcs on the cut ends.

### Coordinate-perturbation waviness

A low-frequency `ShaderNodeTexNoise` is evaluated first and its Color output
(a smooth vector field) is scaled by `DISTORT_STRENGTH` and added to the
pre-scaled coordinates before the Wave node.  This perturbs ring centres
gently and irregularly — matching natural grain waviness.  Injecting the
distortion into the coordinate input rather than mixing the output preserves
the full dark→light→dark colour cycle; output-mixing would average across
ring boundaries and flatten the pattern.

### Fibre roughness

A second high-frequency Noise node (Scale=55) maps to a roughness range of
`[0.16, 0.44]` via `ShaderNodeMapRange`.  Individual fibre bundles in sanded
timber have small roughness differences (slightly raised grain); this node
reproduces that micro-texture without geometry.

### Anisotropic highlight

`Principled BSDF v2` Anisotropic=0.68 combined with a `ShaderNodeTangent`
reading the UV map's U derivatives.  The Cube Projection UV has its U direction
aligned with the plank's long X axis, so the anisotropic highlight sweeps
parallel to the grain — the characteristic bright-band sheen of sanded wood
under directional light.

### GLB / KHR_materials_anisotropy

`bpy.ops.export_scene.gltf()` automatically writes `KHR_materials_anisotropy`
when Principled BSDF v2 has `Anisotropic > 0` and a Tangent node connected.
Three.js `r153+` reads `anisotropy` and `anisotropyRotation` from
`MeshPhysicalMaterial` via the `GLTFLoader`.

## Parameter guide

| Parameter | Default | Effect |
|---|---|---|
| `RING_FREQ` | 14.0 | Rings per metre — lower = old-growth wide rings |
| `LONG_COMPRESS` | 0.06 | Z-axis compression — lower = longer grain lines |
| `DISTORT_STRENGTH` | 0.38 | Grain waviness — 0=straight, 0.5+=chaotic |
| `ROUGHNESS_BASE` | 0.30 | Base roughness — 0.15=lacquered, 0.50=rough-sawn |
| `ANISOTROPY` | 0.68 | Highlight band intensity — 0.90=polished parquet |

## Tutorial

`/tutorials/blender-tutorial-shader-procedural-wood-grain`

## Sources

- Blender Manual — Wave Texture Node (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/wave.html
- KhronosGroup/glTF — KHR_materials_anisotropy (Apache-2.0, Khronos Group)
  https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy
