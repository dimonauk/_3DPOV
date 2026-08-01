# Centroidal Voronoi Tessellation — Lloyd's Algorithm on S²

**Topic:** `python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr`
**Blender version:** 5.1
**Licence:** CC0
**Exports:** `hf_cvt_poi_head.glb` (Draco-6, WebP, Y-up)

## What this does

Implements Lloyd's algorithm on the unit sphere S² using
`scipy.spatial.SphericalVoronoi` to produce a **Centroidal Voronoi Tessellation**
(CVT) — a partition of the sphere into N convex cells where each generator
point coincides with the centroid of its own cell.  The result approximates the
optimal packing of N equal spherical caps, giving a near-uniform faceted sphere
ideal as a poi head, crystal orb, or gem stone prop for WebXR.

## Key numbers (default parameters)

| Parameter | Value | Rationale |
|---|---|---|
| N_GENERATORS | 92 | Produces ~12 pentagon / ~80 hexagon cells, soccer-ball-like |
| LLOYD_ITERS | 40 | Convergence typically < 20 iterations |
| FACE_INSET | 0.10 | 10% shrink creates visible grout lines |
| EXTRUDE_DEPTH | 0.05 m | 5 cm inward recess per facet |

## Running

```bash
# Install scipy in Blender's Python (once only):
blender --python-expr "import subprocess, sys; subprocess.run([sys.executable, '-m', 'pip', 'install', 'scipy'])"

# Run blueprint:
blender --background --python blueprint.py
```

Or paste `blueprint.py` into the Blender Scripting workspace and press **Run Script**.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full CVT + mesh construction + GLB export |
| `record.py` | Animated 360° viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar screen capture instructions |
| `.expected-artefacts.json` | Machine-readable artefact manifest |

## Algorithm outline

1. **Fibonacci seed** — N generators placed on S² via Fibonacci lattice for
   uniform initial distribution (avoids poles clustering).
2. **Lloyd step** — build SphericalVoronoi → compute spherical centroid of each
   region → move generator there → normalise to radius 1.
3. **Convergence check** — stop when max angular shift < 1e-6 rad (≈ 0.2 mm on
   a 1 m sphere).
4. **Mesh** — for each region: inset polygon by 10%, build bmesh face,
   extrude-region inward 5 cm.
5. **Material** — emission ramp navy → violet → cyan, EEVEE Next bloom.
6. **Export** — `bpy.ops.export_scene.gltf` with Draco-6 compression.

## Outside sources

- Du, Faber, Gunzburger (1999). *Centroidal Voronoi Tessellations: Applications
  and Algorithms.* SIAM Review 41(4): 637–676. PD-mathematical.
  <https://doi.org/10.1137/S0036144599352836>
- SciPy Developers (2024). *scipy.spatial.SphericalVoronoi.* BSD-3-Clause.
  <https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.SphericalVoronoi.html>
  Related project: <https://github.com/scipy/scipy>
