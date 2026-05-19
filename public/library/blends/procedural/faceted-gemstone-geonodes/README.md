# Faceted Gemstone — Geometry Nodes & Flat Shading
**Topic:** procedural · **Slug:** faceted-gemstone-geonodes · **Blender:** 5.1

A UV sphere shaped into crown-girdle-pavilion gem zones via bmesh, flat-shaded
throughout, with a Principled BSDF gem material and Geometry Nodes parametric
sliders exposed in the modifier panel. Exported as a Draco-compressed GLB for
WebXR scenes.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Production script — runs headless, outputs `.blend` + `.glb` |
| `record.py` | Viewport animation — full rotation render, outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen recording session |
| `.expected-artefacts.json` | CI manifest with checksums + cross-reference map |

## Quick start

```bash
# Build the gem (headless)
blender --background --python blueprint.py

# Render the viewport animation (needs an existing gemstone.blend)
blender gemstone.blend --python record.py
```

## Technique summary

- **UV sphere topology** (8 segments × 6 rings) maps cleanly to gem zones:
  ring indices correspond directly to crown / girdle / pavilion bands.
- **Flat shading** (`poly.use_smooth = False` on every polygon) gives each
  triangular face its own discrete normal — the crystalline 'pop' you see
  when the mesh catches light from different angles.
- **Principled BSDF IOR 2.42** (sapphire) with near-zero roughness produces
  strong specular on each flat face without requiring a custom shader graph.
- **Geometry Nodes modifier** (`GemParams`) demonstrates the Blender 5.x
  `nt.interface.new_socket()` API (replaced `nt.inputs.new()` in 4.0) and
  exposes `Crown Height` and `Pavilion Depth` as UI sliders.

## Output artefacts

```
public/library/blends/procedural/faceted-gemstone-geonodes/gemstone.blend
public/library/glbs/procedural/faceted-gemstone-geonodes/gemstone.glb
public/library/videos/procedural/faceted-gemstone-geonodes/viewport.mp4  ← record.py
```

## Studio connections

- Load `gemstone.glb` into the sculpture gallery:
  `public/models/sculpture-gallery/` → register in the catalogue JSON.
- The export conventions in `blueprint.py` match the Holoflow WebXR exporter
  defaults documented at `tools/blender-addon/README.md`.
- The faceted-shading rationale is argued in the article
  `/articles/low-poly-high-facet-shading`.

## Licence

Blueprint, record script, and notes are released under **CC0 1.0 Universal**.
The Blender application itself is GPL-2.0-or-later; its Python API bindings
are covered by Blender's own licence, not this file's CC0 grant.
