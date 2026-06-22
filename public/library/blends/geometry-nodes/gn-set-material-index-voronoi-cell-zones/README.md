# GN Set Material Index — Voronoi Cell Zones on a Faceted Gem

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

Procedurally assigns one of four Principled BSDF gem materials (ruby, topaz,
sapphire, obsidian) to each face of a flat-shaded ICO-sphere using a Voronoi
Texture-driven integer field fed into the **Set Material Index** node.

## What it produces

| File | Description |
|---|---|
| `voronoi_gem.blend` | Scene with gem, four materials, GeoNode modifier, camera |
| `voronoi_gem.glb` | WebXR-ready GLB with Draco + WebP, multi-primitive (one per material) |
| `blueprint.py` | Reproducible bpy build script |
| `record.py` | Renders 5 s spin animation to `videos/…/viewport.mp4` |

## Technique summary

```
Position → Voronoi Texture (3D, F1, Euclidean, Scale=3)
         → Color output (constant per Voronoi cell)
         → Separate XYZ → X
         → Math MULTIPLY (× Num Slots)
         → Math FLOOR
         → Float to Integer
         → Set Material Index → output geometry
```

The `Color` output of Voronoi F1 is seeded from the cell's hash — it is a
constant vector within a cell and differs across cells.  Extracting one
component and scaling it into `[0, NUM_SLOTS)` then flooring gives a stable
integer slot index per Voronoi zone.

## Key constraints

- All material slots must be populated on the mesh **before** the GeoNode
  modifier runs.  Out-of-range indices are silently clamped to 0.
- In a GLB export with `export_apply=True`, each unique `material_index` becomes
  a separate mesh primitive.  Four materials → four draw calls in the WebXR
  renderer.  For performance-sensitive scenes, bake to a single atlas texture
  and use one material.

## Parameters

| Parameter | Default | Effect |
|---|---|---|
| Scale | 3.0 | Voronoi cell density. Higher = more, smaller zones. |
| Randomness | 1.0 | Cell seed variation. 0 = regular grid, 1 = fully random. |
| Num Slots | 4 | How many material slots to cycle through (must ≤ mesh slot count). |

## Related tutorials

- `/tutorials/blender-tutorial-faceted-gem-flat-normals`
- `/tutorials/blender-tutorial-gn-corners-of-face-vertex-of-corner-faceted-gem-gradient`
- `/tutorials/blender-tutorial-shader-voronoi-cracked-ceramic-iridescence`
- `/tutorials/blender-tutorial-cycles-lightmap-bake-webxr-uv2`
