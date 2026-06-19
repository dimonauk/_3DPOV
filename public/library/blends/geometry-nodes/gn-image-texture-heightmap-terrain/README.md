# GN Image Texture Heightmap — Greyscale PNG to Displaced Terrain

**Blender 5.1 · CC0 · Holoflow Studio**

Displaces a 64 × 64 quad grid using a greyscale PNG heightmap sampled inside
a Geometry Nodes modifier. Exports as `terrain_heightmap.glb` with a named
attribute (`height`, float, per-vertex) for use in THREE.js elevation shaders.

## What This Builds

- A 10 m × 10 m terrain tile subdivided to 4 096 quads (64 × 64)
- A synthesised 256 × 256 greyscale heightmap embedded in the `.blend`
- A GN modifier tree that maps world XY → UV and samples the image per-vertex
- Elevation colour ramp shader (deep blue → forest green → sandy white)
- GLB with applied displacement and `_HEIGHT` custom vertex accessor
- Named attribute `height` [0–1] readable by the Blender Shader's Attribute node

## File Contents

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Python script — run in Blender's Text Editor |
| `record.py` | Viewport orbit animation → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |
| `.expected-artefacts.json` | CI checklist |

## Usage

```python
# In Blender's Text Editor:
exec(open("blueprint.py").read())
# Terrain appears in the 3D Viewport.

# To render the viewport flyby:
exec(open("record.py").read())
```

## Swapping the Heightmap

```python
# Replace _build_heightmap() with:
import bpy
hm = bpy.data.images.load("/absolute/path/to/elevation.png")
hm.pack()  # embed in .blend
# Then pass hm to _build_gn_tree(hm)
```

16-bit greyscale PNGs (common from Poly Haven, USGS, or Krita) work without
any conversion — Blender normalises pixel values to [0, 1] internally.

## Key Technique

```
Position (per vertex)
  → SeparateXYZ
  → X ÷ GRID_SIZE + 0.5 = U          (maps [-5, 5] → [0, 1])
  → Y ÷ GRID_SIZE + 0.5 = V
  → CombineXYZ(U, V, 0) → Image Texture.Vector
  → Image Texture.Color (grayscale: R=G=B)
  → SeparateXYZ → X (R channel)
  → × HEIGHT_SCALE → Z offset
  → Set Position(Offset = (0, 0, Z_offset))
  → Store Named Attribute("height", value=R)
  → Set Shade Smooth(False)           ← AFTER displacement, not before
```

## Studio Integration

The GLB exports with `export_attributes=True`, emitting `_HEIGHT` as a
`Float32BufferAttribute` in THREE.js (`geometry.attributes['_HEIGHT']`).
Feed it into a custom `ShaderMaterial` to replicate the elevation colour ramp
at runtime without re-loading the texture.

## Outside Sources

- **Blender Manual — Image Texture Node (GN)**: CC-BY-SA 4.0 · Blender Foundation
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/texture/image.html>
- **Poly Haven** — CC0 heightmaps and PBR terrain textures
  <https://polyhaven.com>
