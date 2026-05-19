# Flat-Faceted Normals for Cel-Shading — Blender 5.1

**Category:** shading  
**Blender version:** 5.1  
**Technique:** custom split normals + Shader to RGB cel material  
**Licence:** MIT (studio original — no adapted GPL code)

---

## What this entry teaches

How to control the exact shape of cel-shading light-bands on a low-poly mesh
by authoring per-loop custom normals.  Shade-flat and shade-smooth are the two
extremes; custom split normals let you hold a smooth silhouette while keeping
hard band edges on interior faces — the look the studio calls *silhouette-blend*.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — creates sphere, applies custom normals, builds cel material, exports GLB |
| `record.py` | Animates sun orbit → renders viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS beat-sheet for the 6–8 min screen recording |
| `.expected-artefacts.json` | Machine-readable list of expected output files |

---

## How to run

```bash
# In Blender 5.1, open the Text Editor and run:
# 1. blueprint.py  →  writes faceted_sphere.blend + faceted_sphere.glb
# 2. record.py     →  renders viewport.mp4 (requires ffmpeg on PATH)
```

Or from the command line:

```bash
blender --background --python public/library/blends/shading/flat-shaded-faceted-normals/blueprint.py
```

---

## Technique notes

### Why custom split normals beat shade-flat for cel-shading

A standard shade-flat mesh reads every polygon's geometric normal. On a UV
sphere that gives a ringed-planet silhouette — readable but abrupt at the poles.
With custom split normals you give the pole-adjacent loops their vertex-averaged
normal (smooth silhouette) while every other loop keeps the face normal (hard
band edge).  The result: the outer contour curves naturally, the interior reads
as deliberately faceted.

### Blender 5.1 API note

`mesh.use_auto_smooth` was removed in Blender 4.1.  In 5.x, custom normals are
always active and are written directly with `mesh.normals_split_custom_set()`.
You no longer need to toggle a flag first.

### Material architecture

```
Diffuse BSDF → Shader to RGB → Color Ramp (CONSTANT) → Emission → Output
```

The Color Ramp in CONSTANT interpolation mode posterises the lighting result into
hard colour bands.  Using Emission as the output shader avoids a second lighting
pass that would soften the bands.

---

## Cross-references

- **Studio article:** `/articles/low-poly-high-facet-shading`
- **Studio article:** `/articles/advanced-cell-shading-techniques`
- **Studio codex:** `/codex/ramp-shading`
- **Studio tutorial:** `/tutorials/blender-to-site-asset-pipeline`
- **External:** https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/normals.html
- **External:** https://github.com/blender/blender/blob/main/scripts/addons_core/mesh_looptools.py (Apache-2.0)

---

## Expected artefacts

See `.expected-artefacts.json`.
