# Villarceau Circles: Hidden Oblique-Section Circles on the Torus

**Blender 5.1 · Python scripting · numpy**
**Topic:** Differential geometry, inversive geometry, Hopf fibration

---

## What this is

Every ring torus has four families of circles:
two obvious (meridians and latitudes) and two hidden.
The hidden circles — discovered by Yvon Villarceau in 1848 — arise from
intersecting the torus with oblique planes tangent to its inner equator
circle at two antipodal points.  Remarkably, each Villarceau circle has
the same radius R as the torus major radius, regardless of the minor
radius r.

This library entry builds a poi head from 16 Villarceau circles (8 ascending
+ 8 descending), each extruded into a Bishop-framed tube.  Five shape keys
sweep the minor radius r from 0.06 m to 0.20 m, animating the tilt angle
arcsin(r/R) continuously from ~11° to ~42° — an armillary-sphere-in-motion.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main production script: builds mesh, materials, shape keys, exports GLB |
| `record.py` | Automated viewport render → `viewport.mp4` (210 f, 30 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar live screen-capture guide |
| `.expected-artefacts.json` | CI manifest of expected outputs |

### Generated outputs (after running scripts)

| File | Contents |
|------|---------|
| `hf_villarceau_poi.blend` | Blender scene (auto-saved when running blueprint.py in Blender) |
| `hf_villarceau_poi.glb` | WebXR-ready GLB: Draco L6, WebP, 5 morph targets, vertex colour |

---

## Key mathematics

```
A = √(R² − r²)           half-chord at Villarceau tangent points

Family 1 (ascending), direction φ, parameter t ∈ [0, 2π):
  x = A·cos t·cos φ − (R·sin t + r)·sin φ
  y = A·cos t·sin φ + (R·sin t + r)·cos φ
  z = r·cos t

Family 2 (descending), same φ, t:
  x = A·cos t·cos φ − (R·sin t − r)·sin φ
  y = A·cos t·sin φ + (R·sin t − r)·cos φ
  z = r·cos t

Circle radius = R (major torus radius) — independent of r.
Tilt angle    = arcsin(r/R).
```

Hopf fibration link: under the Hopf map S³ → S², the pre-image of each
point is a great circle; the Clifford torus in S³ is foliated by these
circles, which project to the Villarceau circles of a standard torus.

---

## Blender technique highlights

- **`mesh.from_pydata()`** — single-call bulk import (no operator overhead)
- **Bishop (parallel-transport) frame** — avoids Frenet–Serret gimbal lock
  at inflection; holonomy distributed linearly over the full circuit
- **`color_attributes.new("Col", "FLOAT_COLOR", "POINT")`** — Blender 5.1 API
- **Shape keys** with topology-invariant vertex reindexing across all 5 r values
- **EEVEE bloom** at threshold 0.08 for emissive glow

---

## Studio cross-references

- Tutorial: Hopf Fibration — S³→S² Fibre Bundle & Linked Circles
- Tutorial: Torus Knot T(p,q) — Parallel-Transport Tube
- Tutorial: Möbius Transformation — Riemann Sphere & Loxodromes

---

## Licences

- Mathematical content (Villarceau 1848): Public Domain
- NumPy: BSD-3-Clause
- This library entry: CC0
