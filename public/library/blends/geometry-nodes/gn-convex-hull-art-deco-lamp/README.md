# GN Convex Hull — Procedural Faceted Art-Deco Lamp Shade

**Blender 5.1 · Geometry Nodes · CC0**

A noise-displaced IcoSphere fed into `GeometryNodeConvexHull` produces a
taut faceted gem form — every face mathematically planar, zero hand-modelling
required. Animated W axis in the 4D noise field morphs the facet topology over
time while the lamp completes a full rotation.

## Key node

`GeometryNodeConvexHull` — wraps any point cloud or mesh in the minimal
enclosing convex polyhedron.  Inputs: `Geometry`.  Output: `Convex Hull` (Geometry).
This is a pure geometry transform node; it has no field inputs, no domain selector,
no parameters.  All control lives upstream in the displacement chain.

## Controls

| Socket | Default | Effect |
|--------|---------|--------|
| `W Seed` | 0.0–1.8 (animated) | Translates through 4D noise field — different facet topology each value |
| `Amp` | 0.32 | Displacement magnitude; 0 = sphere, >0.5 = spiky star |

## Parameter guide

- `NOISE_SCALE = 2.2` → ~30 hull faces (art-deco lantern silhouette)
- `NOISE_SCALE = 5.0` → ~70 hull faces (crushed-velvet micro-facet)
- `NOISE_DETAIL = 2.0` → large displacement bumps (desirable — more facets)
- `NOISE_DETAIL = 8.0` → self-similar fractal bumps → hull ≈ sphere (undesirable)
- `SPHERE_SUBDIVISIONS = 3` → 162 input vertices; hull uses ~20% of them

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy script — builds GN tree, material, camera, exports `.blend` + `.glb` |
| `record.py` | OpenGL animation render → `viewport.mp4` (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `convex_hull_lamp.blend` | Generated blend file (run blueprint.py to create) |
| `convex_hull_lamp.glb` | GLB snapshot at frame 24 (Draco 6, WebP, +Y up) |

## Related tutorials

- [GN Fillet Curve — Neon Sign](/tutorials/blender-tutorial-gn-fillet-curve-neon-sign)
- [Principled BSDF Transmission & Iridescence](/tutorials/blender-tutorial-shader-principled-transmission-iridescence)
- [GN For Each Element — Hex Panel](/tutorials/blender-tutorial-gn-for-each-element-hex-panel)
- [Faceted Gem WebXR Export](/tutorials/blender-tutorial-faceted-gem-webxr)
- [GN Points to Volume — Organic Coral](/tutorials/blender-tutorial-gn-points-to-volume-organic-coral)

## Licence

CC0 — all source files in this directory are released to the public domain.
