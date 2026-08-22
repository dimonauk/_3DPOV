# Dupin Cyclide — Ring / Horn / Spindle Poi Head (Blender 5.1)

**Topic category**: `scripting` → `python-numpy`  
**Blender version**: 5.1  
**Licence**: CC0 (studio output)

## What this produces

A poi-head GLB (`hf_cyclide_poi.glb`) whose shape is a **Dupin cyclide** —
the unique (up to Möbius transformation) class of surfaces all of whose
principal curvature lines are circles.

Three shape keys sweep through the three classical cyclide types:

| Shape key  | d value | Cyclide type | Character |
|------------|---------|--------------|-----------|
| Basis      | 2.0     | Ring cyclide | Smooth, torus-like, well-proportioned |
| SK_Wide    | 0.4     | Near-torus   | Wider inner ring; nearly rotationally symmetric |
| SK_Spindle | 3.9     | Near-spindle | Inner ring approaching a cusp (d → b = 4) |

Vertex colour attribute `K_curvature` encodes **Gaussian curvature**:
deep cobalt (K < 0, inner saddle) → near-white (K ≈ 0, waist circles) →
amber-gold (K > 0, outer convex shell).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 bpy script — runs in Text Editor, builds mesh, exports GLB |
| `record.py` | Viewport animation recording (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Mathematical background

**Charles Dupin** introduced these surfaces in his 1822 treatise as the
solution to: *"Which surfaces have the property that both families of lines of
curvature are circles?"*  He proved there are exactly three non-planar
families (up to inversive equivalence): the **ring cyclide** (smooth),
the **spindle cyclide** (self-intersecting along an inner circle), and the
**horn cyclide** (one circle family degenerates to a single point).

The **Bloor–Wilson (1989) parametrisation** expresses this explicitly:

```
D(u,v)  = a − c·cos u·cos v          (denominator, always > 0 when c < a)
x(u,v)  = [d(c − a cos u cos v) + b² cos v] / D
y(u,v)  = b·sin u·(a − d·cos v) / D
z(u,v)  = b·sin v·(c·cos u − d) / D
```

with the **Pythagorean constraint** b² = a² − c².  Studio choice: (a, b, c) =
(5, 4, 3) keeps the triangle integer-exact.

## Inversive geometry connection

Every cyclide is the **inversion** of a standard torus in a sphere.  Inversion
is a Möbius (conformal) map; it preserves angles but not distances.  Since a
torus has latitude and longitude circles as its curvature lines, their
inversive images — circles in 3D but no longer on any standard torus — are the
curvature lines of the cyclide.  This is the deep reason why cyclides are
"circle-curvature" surfaces: they inherit it from the torus via an angle-
preserving map.

## Cross-references (studio)

- [Villarceau Circles — hidden oblique circles on the torus](/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr)
  — the latitude/longitude duality that the cyclide inherits via inversion.
- [Gauss–Bonnet angle-defect / discrete curvature on a torus](/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr)
  — the discrete counterpart of the K computation used here.
- [Schwarz–Christoffel conformal map](/tutorials/blender-tutorial-python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr)
  — another conformal / inversive technique applied to surface parametrisation.
- [Schwarz P, D & Gyroid TPMS](/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-triply-periodic-minimal-surfaces-webxr)
  — comparing curvature-colouring on periodic surfaces.

## External sources

1. **Bloor MI & Wilson MJ** (1989) *"Generating Blend Surfaces Using Partial
   Differential Equations"*, CAD Vol. 21(3), pp 165–171.
   Mathematical content: PD.
   <https://www.sciencedirect.com/science/article/pii/0010448589900073>

2. **Dupin C** (1822) *"Applications de Géométrie et de Méchanique"*,
   Paris: Bachelier. Licence: PD (pre-1928).
   Digitised: <https://archive.org/details/applicationsdog00dupigoog>
