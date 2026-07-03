# Gabor Noise Texture — Satin Frosted Acrylic Panel

**Blender version:** 5.1  
**Topic:** Shading  
**Licence:** CC0  
**Tutorial:** [/tutorials/blender-tutorial-shader-gabor-noise-satin-frosted-acrylic-webxr](/tutorials/blender-tutorial-shader-gabor-noise-satin-frosted-acrylic-webxr)

## What this is

A thin PMMA acrylic wall panel whose surface uses the `ShaderNodeTexGabor`
node (new in Blender 4.1) to drive both roughness variation and bump
micro-detail.  The Gabor kernel field produces the directional striations
found on spun or brushed acrylic — a look impossible to achieve convincingly
with the standard Noise Texture.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full material + geometry + bake pipeline. Run in Blender Scripting workspace. |
| `record.py` | Renders a 10-second viewport animation sweeping Anisotropy 0→1→0. Run after blueprint.py. |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the tutorial screen recording. |
| `gabor_frosted_acrylic.glb` | Exported GLB with baked WebP roughness + normal maps (generated at runtime). |

## Key technique

`ShaderNodeTexGabor` with `gabor_type = GABOR_STOCHASTIC` at 600 Hz and
0.88 anisotropy.  The `Value` output (absolute) feeds a Color Ramp that
maps to Roughness 0.04 – 0.38.  The `Phase Offset` output feeds a Bump
node at strength 0.35, providing micro-surface normal detail without a
separate normal-map bake pass.

## Blender 5.1 node type string

```python
nt.nodes.new("ShaderNodeTexGabor")
```

Parameters set in Python:
- `gabor_type` — `"GABOR_STOCHASTIC"` or `"GABOR"`
- `inputs["Frequency"].default_value`
- `inputs["Anisotropy"].default_value`
- `inputs["Orientation"].default_value`

## WebXR export

Roughness and Normal maps are baked to 1024×1024 WebP before GLB export.
The Principled BSDF with `Transmission Weight = 0.78` and `IOR = 1.49`
maps to `KHR_materials_transmission` in the exported GLB, preserving the
milky glass look in Three.js WebXR scenes.
