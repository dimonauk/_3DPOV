# UV Unwrapping for Low-Poly Stylised Meshes — Blender 5.1

**Library path:** `public/library/blends/uv-mapping/uv-unwrap-low-poly-stylised/`  
**Topic:** uv-mapping  
**Blender version:** 5.1  
**Licence:** CC0 (all files in this directory)

---

## What this is

A production blueprint and recording scaffold for UV-unwrapping a
low-poly faceted mesh in Blender 5.1 for use with stylised/cel
textures. Covers seam placement strategy, the Angle-Based Unwrap
algorithm, island packing, and checker-material verification.

The tutorial pairs with the studio's faceted gemstone and hard-surface
panel tutorials — both produce mesh files that need a clean UV layout
before texturing.

---

## Why UV layout matters for low-poly work

With a low-poly faceted mesh, every polygon is a large, clearly visible
face. Misaligned UVs smear a texture across that face at an angle,
producing an ugly gradient on what should be a flat colour. A well-laid-
out UV map gives the artist exactly one pixel per texel: predictable,
paintable, clean.

For cel/stylised work specifically: toon-shading ramps need a consistent
UV V-direction per face; texture seams should land on hard edges already
visually distinct; pixel-aligned UV borders prevent 1-pixel bleed at
island boundaries in bilinear filtering.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | bpy script — builds a low-poly gem, places seams, unwraps, packs, saves .blend |
| `record.py` | Viewport animation render — rotating checker-mapped gem |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the live screen capture |
| `README.md` | This file |
| `.expected-artefacts.json` | CI audit manifest |

---

## Running

```bash
# Build the demo blend
blender --background --python blueprint.py

# Render the viewport video
blender uv_low_poly_demo.blend --background --python record.py
```

---

## Outside sources

| Source | Licence | Author | URL |
|---|---|---|---|
| Blender Manual — UV Unwrapping | CC BY | Blender Foundation | https://docs.blender.org/manual/en/latest/editors/uv/index.html |
| glTF-Blender-IO (TEXCOORD export) | Apache-2.0 | Khronos Group / Julien Duroure | https://github.com/KhronosGroup/glTF-Blender-IO |

---

## Cross-references

- `/articles/low-poly-high-facet-shading` — the aesthetic this UV
  workflow serves
- `/tutorials/blender-tutorial-faceted-gemstone-geonodes` — the gem
  this tutorial unwraps
- `/tutorials/blender-tutorial-low-poly-faceted-hard-surface` — the
  hard-surface panel that also needs UV layout
- `/tutorials/blender-to-site-asset-pipeline` — how UVs survive the
  glTF export and load in the WebXR runtime
- `/codex/mtoon` — the VRM shader that reads UVs for expression maps
- `/articles/advanced-cell-shading-techniques` — where UV layout feeds
  into the shading pipeline
