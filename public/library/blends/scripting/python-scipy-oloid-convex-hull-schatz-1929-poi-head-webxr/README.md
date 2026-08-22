# Oloid — Convex Hull of Two Perpendicular Unit Circles (Schatz 1929)

**Blender 5.1 · Python + scipy · Holoflow Studio**  
Licence: CC0 (code) | Mathematical content: Public Domain

---

## What this builds

`oloid_poi.blend` — smooth-shaded mesh of the oloid with a gold→indigo
vertex-colour gradient following the ruling direction.

`oloid_poi.glb` — Draco-6 compressed, WebP textures, Holoflow WebXR
poi-head export with `holoflow:facet=True` and `holoflow:category="poi-head"`.

---

## The mathematics

The **oloid** is the convex hull of two congruent circles of radius *r* in
mutually perpendicular planes, placed so that each circle passes through
the centre of the other:

```
C₁ = { (r·cos t,  0,        r·sin t) : t ∈ [0, 2π) }   ← xz-plane, centre O₁=(0,0,0)
C₂ = { (r+r·cos s, r·sin s, 0)       : s ∈ [0, 2π) }   ← xy-plane, centre O₂=(r,0,0)
```

The mutual-centre condition requires `|O₁O₂| = r`, so O₂=(r,0,0) lies
on C₁ (at t=0) and O₁=(0,0,0) lies on C₂ (at s=π). ✓

The boundary of the convex hull consists solely of the two circles (as
1-D edge curves) and a **ruled surface** connecting them — parameterised
by the common external tangent lines from C₁ to C₂.

### Key properties

| Property | Fact |
|----------|------|
| Surface area | 2π·r² (same as a sphere of radius r) |
| Volume | π²·r³/4 |
| Developable | Yes — unrolls flat without stretching |
| 100% surface wetting | Yes — every surface point contacts the rolling plane |
| Rolling lemniscate | Centre of mass traces a figure-of-eight |

---

## Running the blueprint

```bash
# Install scipy into Blender's Python if needed:
/path/to/blender/python -m pip install scipy

# Run headless:
blender --background --python blueprint.py
```

Expected output: `oloid_poi.blend` in this directory, `oloid_poi.glb` in
`public/library/glbs/scripting/<slug>/`.

---

## Recording the screen video

See `SCREEN-RECORDING-NOTES.md` for OBS setup and the shot list.

After recording, run `record.py` to produce the headless viewport animation:

```bash
blender --background oloid_poi.blend --python record.py
```

---

## Cross-references

- [Hopf Fibration — S³→S² Fibre Bundle, Linked Circles Poi Ball](/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr)
- [Spherical Voronoi — Lloyd CVT Faceted Poi Head](/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr)
- [Dupin Cyclide — Confocal-Conic Curvature Lines Poi Head](/tutorials/blender-tutorial-python-numpy-dupin-cyclide-confocal-conics-poi-webxr)

---

## Outside sources

- **Schatz P (1975). Rhythmusforschung und Technik.** Freies Geistesleben, Stuttgart.
  English translation of Schatz's original 1929 oloid discovery. Public Domain (mathematical content).

- **Dirnböck H, Stachel H (1997). The Development of the Oloid.**
  Journal for Geometry and Graphics 1(2):105–118.  
  https://heldermann-verlag.de/jgg/jgg01_05/jgg0113.pdf  
  First rigorous proof that the oloid is 100%-wetting; derivation of the
  ruling parameterisation. Public Domain (mathematical content).

- **SciPy documentation — scipy.spatial.ConvexHull.**
  https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.ConvexHull.html  
  BSD-3-Clause. SciPy community.
