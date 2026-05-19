# Faceted Low-Poly Hard-Surface Panel

**Topic:** low-poly  
**Technique:** Smooth by Angle + manual Sharp edge marks  
**Blender version:** 5.1  
**Studio interest:** WebXR assets, cel-shading pipeline, printable hard-surface

---

## What this is

A wall-mount control panel built entirely from box-modelling primitives,
shaded using Blender 5.1's **Smooth by Angle** modifier to preserve the
faceted look the studio's WebXR scenes are built on.

The panel is 80 × 7 × 50 cm (W × D × H), exports as a Y-up GLB with
Draco level-6 compression and WebP textures. It loads directly into the
Holoflow WebXR sculpture gallery or any three.js scene that reads glTF.

---

## Key learning: Smooth by Angle in Blender 5.1

In Blender 4.1, Auto Smooth was removed from Object Properties and
replaced by a geometry-node modifier added via:

  Right-click > Shade Smooth by Angle (threshold in degrees)

The modifier writes a custom normal attribute into the mesh data. That
attribute is preserved through GLB export by the KhronosGroup glTF-Blender-IO
exporter, so the faceting reads identically in Blender and in the browser.

Setting it to **30°** means any two faces joined at a dihedral angle
steeper than 30° will have their normals split — i.e. they will shade
independently, giving the crisp faceted read. Faces joined at shallower
angles (e.g. the tiny chamfer bevel) can share normals or be forced into
a hard split by marking the edge Sharp.

---

## Files

| File | Purpose |
| --- | --- |
| `blueprint.py` | Fully automated bpy script — run once, get a GLB |
| `record.py` | Viewport turntable render → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture instructions for a live session |
| `.expected-artefacts.json` | CI checklist for the artefacts this entry should produce |

---

## Running

```bash
# Full automated pipeline (no display needed):
blender --background --python blueprint.py

# Viewport turntable video:
blender --background --python record.py
```

Both scripts are idempotent and self-contained. The GLB lands in this
directory; the video lands in `public/library/videos/low-poly/faceted-hard-surface/`.

---

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-low-poly-faceted-hard-surface`
- Studio article: `/articles/low-poly-high-facet-shading`
- Studio article: `/articles/cohesive-low-poly-cell-shaded-vrm-worlds`
- Export pipeline: `/tutorials/blender-to-site-asset-pipeline`
- Outside source: https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/normals.html (CC-BY-SA)
- Outside source: https://github.com/KhronosGroup/glTF-Blender-IO (Apache-2.0)
