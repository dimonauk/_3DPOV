# Low-Poly Faceted Rock — Geometry Nodes Blueprint

**Technique:** Procedural displacement of an icosphere along per-vertex normals,
driven by a 3D Noise Texture node, then flat-shaded to produce hard silhouette edges
between faces.

**Blender version:** 5.1  
**Output format:** GLB (Draco level 6, +Y up)  
**Export size:** ~12 KB

---

## Files

| File                         | Purpose                                                        |
|------------------------------|----------------------------------------------------------------|
| `blueprint.py`               | Run once to build and export the rock                          |
| `record.py`                  | Run after blueprint to render the 5-second viewport animation  |
| `SCREEN-RECORDING-NOTES.md`  | OBS instructions for the tutorial screen recording             |
| `.expected-artefacts.json`   | CI-readable list of expected output files                      |

---

## Quick start

```bash
blender --background --python blueprint.py
```

Or open Blender, load `blueprint.py` in the Text Editor, and press **Alt+P**.

---

## Parameters (top of blueprint.py)

| Constant            | Default | Effect                                            |
|---------------------|---------|---------------------------------------------------|
| `ICO_SUBDIVISIONS`  | 1       | Base mesh resolution (1 = 80 tris)                |
| `GN_SUBDIVISIONS`   | 2       | Extra GN subdivisions (increases facet count)     |
| `NOISE_SCALE`       | 1.8     | Frequency of lumps (lower = bigger bumps)         |
| `NOISE_DETAIL`      | 4.0     | Octaves: adds micro-facet texture                 |
| `NOISE_ROUGHNESS`   | 0.65    | Fractal character (0 = smooth, 1 = jagged)        |
| `DISPLACEMENT_STR`  | 0.20    | ±m push along the surface normal                  |

Increasing `GN_SUBDIVISIONS` to 3 gives a pebble-like result with smaller facets.
Dropping `NOISE_SCALE` to 0.6 gives a boulder with a few large planes.

---

## Node chain (abbreviated)

```
GroupInput
  └─ SubdivideMesh (Level=2)
       └─ SetPosition (Offset = Normal × Noise)
            └─ SetShadeSmooth (Shade Smooth = False)
                 └─ GroupOutput
```

The `SetShadeSmooth(False)` node is the pivot of the technique — it tells Blender to
interpolate nothing across face boundaries, producing the hard crystalline edges the
studio aesthetic relies on.

---

## Variations to try

- **Seed the noise:** add a `Math (Add)` node between `InputPosition` and the Noise
  `Vector` input, keyed by an integer parameter. Different seeds = different rock shapes
  from the same tree.
- **Stretch the rock:** scale the object non-uniformly before applying (Scale X by 1.5,
  Z by 0.7) for a flatter, slate-like form.
- **Tighter facets for 3D print:** raise `GN_SUBDIVISIONS` to 3, lower `NOISE_SCALE`
  to 1.2. The surface detail is finer and the print will hold it.

---

## Cross-references

- Tutorial: `/tutorials/geometry-nodes-low-poly-faceted-rock`
- Article: `/articles/low-poly-high-facet-shading`
- Article: `/articles/cohesive-low-poly-cell-shaded-vrm-worlds`
- Tutorial: `/tutorials/blender-to-site-asset-pipeline`

---

## Outside sources

- Blender Geometry Nodes manual — https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/
  Licence: CC-BY-SA 4.0 (Blender Foundation)
- Ian Hubert's "Lazy Tutorials" series (procedural displacement techniques) — https://www.youtube.com/c/IanHubert2
  Referenced for the remap-then-scale-normal displacement pattern; videos are CC-BY.
