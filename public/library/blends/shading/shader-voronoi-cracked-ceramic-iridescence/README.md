# Voronoi DISTANCE_TO_EDGE — Cracked-Glaze Ceramic & Soap-Film Iridescence

**Blender 5.1 · Category: shading · Licence: CC0**

Two procedural shaders built on the Voronoi Texture node's often-overlooked
output modes.

## What this teaches

| Concept | Node / setting |
|---|---|
| Voronoi cell-boundary extraction | `ShaderNodeTexVoronoi` → feature: `DISTANCE_TO_EDGE` |
| Crack width control | `ColorRamp` stop position at boundary distance |
| Glaze physics (clearcoat + SSS) | `Principled BSDF v2` Coat Weight + Subsurface Radius |
| Thin-film colour proxy | Voronoi F1 Distance → `HueSaturation` Hue input |
| Grazing-angle iridescence gate | `Fresnel` → `MixRGB` Factor |
| Object-space texture coords | `TexCoord → Object` socket (avoids UV seam breaks) |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build + GLB export. Run in Blender's Script Editor. |
| `record.py` | Animated render (150 frames, 30 fps). Run after `blueprint.py`. |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions. |
| `celadon_bowl.blend` | Saved Blender file (committed after manual save). |
| `celadon_bowl.glb` | DRACO-compressed GLB, WebP textures. |

## Quick start

```
File → New → General
Scripting workspace → Text Editor → Open → blueprint.py
Run Script (Alt + P)
# Both bowls appear. Switch to Rendered mode to see cracks + iridescence.
```

## Key parameters (top of `blueprint.py`)

```python
CRACK_SCALE  = 8.0   # cells per unit — higher = finer crackle
CRACK_STOP   = 0.12  # ColorRamp stop: lower = hairline cracks
GLAZE_COLOR  = (0.20, 0.48, 0.40, 1.0)   # celadon green
SOAP_SPIN_AMP = 0.45  # iridescence hue sweep in turns (0.5 = full rainbow)
```

## Physics note

Crackle glaze (Japanese: *kannyu*) forms when the thermal expansion coefficient
of the glaze is mismatched from the clay body.  The glaze, already rigid below
its glass transition, fractures along the Voronoi cell boundaries of internal
stress concentration points.  Celadon glaze (iron-reduced copper oxide, ~1260°C)
is the classic carrier for this effect in Song-dynasty ceramics.

## Cross-references

- Tutorial: [Voronoi Cell Borders: Cracked Ceramic](/tutorials/blender-tutorial-shader-voronoi-cracked-ceramic-iridescence)
- Related shader: [Procedural Marble Veins](/tutorials/blender-tutorial-shader-procedural-marble-veins)
- Related shader: [Holographic Panel — Emission + Fresnel](/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel)
- Related GN: [Dual Mesh Voronoi Cell Sphere](/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere)
