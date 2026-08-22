# Scherk Doubly-Periodic Minimal Surface — Poi Head (Blender 5.1)

**Topic** `scripting · mathematics · minimal-surfaces`  
**Blender** 5.1  
**Licence** CC0  
**Date** 2026-08-08

---

## What this is

A poi head whose silhouette traces Scherk's doubly-periodic minimal surface —
the third classical minimal surface ever discovered (H.F. Scherk, 1835),
after the plane and the catenoid/helicoid.

The surface satisfies **H = 0** (zero mean curvature) everywhere.  Its
defining equation is the level set:

```
F(x, y, z) = e^{kz} · cos(kx) − cos(ky) = 0
```

where k = 2π / PERIOD.  In any "diamond" domain where `cos(kx)·cos(ky) > 0`
this is equivalent to the explicit saddle:

```
z = (1/k) · ln[ cos(ky) / cos(kx) ]
```

The full surface tiles the xy-plane with a checkerboard of such saddles,
separated by asymptotic lines at x = ±π/2k and y = ±π/2k where the surface
goes to z = ±∞.

## Technique

A subdivided icosphere (4 subdivisions, 2562 vertices) is projected onto the
Scherk level set by binary-searching each outward radial ray for the smallest
`t > 0` satisfying `F(t·n̂) = 0`.  This preserves mesh topology while
conforming every vertex to the soap-film geometry.

Four shape keys provide real-time WebXR morphs:

| Key | Change |
|---|---|
| Basis | One saddle (PERIOD = 0.16 m) |
| Scherk_Dense | Two periods across the sphere (PERIOD halved) |
| Scherk_Rotated | 45° XY rotation — diamond aligned to axes |
| Scherk_Shallow | Saddle height compressed 60% — near-disc shape |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main construction script — run in Blender 5.1 Text Editor |
| `record.py` | Viewport animation recording script (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for screen.mp4 |
| `.expected-artefacts.json` | Build validation manifest |

## Running

1. Open Blender 5.1.  Create a new project or clear the default scene.
2. Open `blueprint.py` in the Scripting workspace.
3. Click **Run Script** (or press Alt+P).
4. The poi head appears in the viewport; a `.glb` is written to
   `public/library/glbs/scripting/…/hf_scherk_poi.glb`.
5. Optionally open `record.py` and run it to set up animation keyframes,
   then render with `Render → Render Animation`.

## Cross-references

- [Weierstrass–Enneper Minimal Surfaces tutorial](/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr) — the complex-analysis framework Scherk's surface also inhabits
- [Gyroid SDF Isosurface tutorial](/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr) — a triply periodic minimal surface via marching cubes (different class: Scherk is not triply periodic)
- [SDF CSG Smooth Boolean tutorial](/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr) — level-set operations on sphere-projected meshes
- [Kummer Quartic Algebraic Surface tutorial](/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr) — another algebraic surface projected to a poi head

## Outside sources

1. **Scherk, H.F. (1835)**. "Bemerkungen über die kleinste Fläche innerhalb
   gegebener Grenzen." *Crelle's Journal* 13:185–208.  
   Public Domain.  Internet Archive scan:
   <https://archive.org/details/journalfurdierein13crell>

2. **NumPy contributors**.  *NumPy Linear Algebra Reference*.  BSD-3-Clause.  
   <https://numpy.org/doc/stable/reference/routines.linalg.html>  
   Related: <https://github.com/numpy/numpy>
