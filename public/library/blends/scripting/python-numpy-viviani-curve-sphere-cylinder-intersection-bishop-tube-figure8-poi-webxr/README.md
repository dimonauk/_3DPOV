# Viviani's Curve — Sphere × Cylinder Intersection

**Blender 5.1 · Python + numpy · CC0**

Vincenzo Viviani posed his "window" problem in 1659 and published the solution
in 1674: cut the largest possible aperture in a hemisphere such that its area
can be determined by elementary geometry. The boundary of that window is the
curve that now bears his name — the intersection of the sphere x² + y² + z²
= (2A)² with the cylinder (x − A)² + y² = A².

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Pure-bpy construction: Bishop tube, shape keys, vertex colour, GLB |
| `record.py` | Viewport animation and FFMPEG render |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_viviani_poi.blend` | Saved Blender file (run blueprint.py first) |
| `hf_viviani_poi.glb` | Draco-6 WebP GLB for WebXR |

---

## Curve parametrisation

```
x(t) = A(1 + cos t)
y(t) = A sin t
z(t) = 2A sin(t/2),   t ∈ [0, 4π)
```

The period of z(t) is 4π while x, y have period 2π, so the complete
figure-8 requires a full 4π traversal. The self-intersection at (2A, 0, 0)
occurs at t = 0 and t = 2π.

**Projections**:

| Plane | Projection |
|-------|-----------|
| xz | z² = 2A(2A − x) — parabola; two branches form the figure-8 |
| xy | (x − A)² + y² = A² — the generator cylinder itself |
| yz | y² + z² = 4A² − x² — slice of the sphere |

---

## Shape keys

| Key | Change |
|-----|--------|
| Basis | A = 0.50 m, TUBE_R = 0.072 m |
| SK_Contracted | A = 0.35 m (tighter figure-8) |
| SK_Expanded | A = 0.70 m (wider figure-8) |
| SK_Thick | A = 0.50 m, TUBE_R = 0.119 m (fatter tube) |

---

## Vertex colour

Attribute **Viviani_Z** (FLOAT_COLOR POINT):

- z = +2A → Cobalt `#0E68EA`
- z = 0 → White (self-intersection equator)
- z = −2A → Amber `#EB8210`

---

## Quick start

```bash
blender --background --python blueprint.py
# then open hf_viviani_poi.blend and run record.py interactively
```

---

## Mathematical connections

- **Dandelin spheres** — the sphere-cylinder intersection is analogous to the
  construction Germinal Dandelin used in 1822 to prove the focal property of
  conics: a plane cutting a cone meets its inscribed Dandelin spheres at the
  foci.
- **Solid angle** — the Viviani window subtends a solid angle of
  (2π − 2)·steradians at the centre of the sphere; the remaining (2π + 2)
  steradians in the other hemisphere give an area Viviani could not compute
  by elementary means.
- **Bézout's theorem** — a sphere (degree 2) meets a cylinder (degree 2) in a
  curve of degree ≤ 4. The Viviani curve has degree 4 (you can eliminate the
  parameter to get a quartic).

---

## Licence

CC0 — public domain dedication. No rights reserved.
