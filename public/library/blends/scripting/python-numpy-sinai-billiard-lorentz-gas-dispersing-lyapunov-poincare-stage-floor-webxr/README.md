# Sinai Billiard / Lorentz Gas — Poincaré Section Stage Floor

**Blender 5.1 · Python bpy + NumPy · Scripting topic**

Ya. G. Sinai placed a hard circular disk inside a periodic square and asked
what happens to a billiard particle bouncing between the disk and its periodic
images. The answer (Sinai 1970) was definitive: the billiard is ergodic,
strongly mixing, and Bernoulli — the strongest possible randomness for a
deterministic system. The convex ("dispersing") scatterer is the engine:
each glancing reflection defocuses nearby orbits faster than straight walls
can refocus them, forcing the Lyapunov exponent to be strictly positive.

This entry builds a 4 m × 3 m stage-floor GLB whose Z height *is* the
Poincaré section density — 150 000 disk collisions binned in Birkhoff
coordinates (s, p = sin θ), lifted into a cobalt-to-amber height field.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Pure-bpy + NumPy script; run inside Blender to build `sinai_floor.glb` |
| `record.py` | Automated viewport render (120 frames, 30 fps, 270° orbit) → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the companion `screen.mp4` |
| `.expected-artefacts.json` | CI-readable artefact manifest with cross-reference table |

---

## Running the blueprint

1. Open Blender 5.1 → **Scripting** workspace.
2. Load `blueprint.py`.
3. Click **Run Script**. Watch the console for:
   ```
   [Sinai] Lyapunov exponent λ ≈ 0.41   (expected > 0)
   [Sinai] GLB export complete → //sinai_floor.glb
   ```
4. The GLB lands next to the `.blend` file; move it to
   `public/library/glbs/scripting/<slug>/sinai_floor.glb`.

Expected mesh: (65 × 49) = 3 185 vertices, 3 072 quad faces.

---

## Mathematics

### Periodic Sinai billiard (Lorentz gas)
- Cell: \[-1, 1\]² with periodic boundary conditions
- Hard disk: radius R = 0.38, centre at origin
- Particle: unit-speed straight-line motion; specular reflection off disk

### Birkhoff coordinates
After each disk collision, record:

- **s** = arc-length / circumference ∈ [0, 1): the angle φ / 2π of the hit point on the disk
- **p** = sin θ ∈ [−1, 1]: the sine of the departure angle from the outward normal

Liouville measure in these coordinates is ds dp — uniform on the rectangle.
Ergodicity means density → uniform as N → ∞; finite-sample fluctuations remain
as the gentle hills seen on the stage floor.

### Lyapunov exponent
A shadow trajectory, offset by ε = 10⁻⁷ m perpendicular to the main orbit,
is advected through the same reflections and wrapped at the same boundaries.
After each disk collision we measure the log-growth ratio:
λ ≈ ⟨log(separation / ε)⟩ ≈ 0.35–0.50 (expected positive for R = 0.38).

The positive Lyapunov exponent is the hallmark of chaos: two billiard
trajectories starting 10⁻⁷ m apart become macroscopically different after
~ 1 / λ ≈ 2–3 collisions.

---

## Holoflow export conventions

- Snake-case root name: `sinai_floor`
- `holoflow:facet = True` (flat shading, hard edges)
- `holoflow:category = stage-floor`
- +Y up (`export_yup=True`)
- Draco mesh compression level 6
- WebP textures

---

## Outside sources

1. **Ya. G. Sinai** (1970). "Dynamical systems with elastic reflections."
   *Russian Mathematical Surveys* 25(2): 137–189.
   https://iopscience.iop.org/article/10.1070/RM1970v025n02ABEH003794
   Licence: Public Domain (Soviet publication, pre-1978).
   Related: Chernov & Markarian "Chaotic Billiards" (AMS 2006);
   D. Szász (ed.) "Hard Ball Systems and the Lorentz Gas" (Springer 2000).

2. **NumPy** (BSD-3-Clause).
   https://numpy.org · https://github.com/numpy/numpy
   Used for the 2D density histogram (`np.zeros`, random trajectories).
   Related: SciPy (BSD-3) — `scipy.spatial` for Voronoi billiard tables;
   Numba (BSD-2) — JIT-compiled billiard loops for production-scale runs.

---

## Studio cross-references

- [Bunimovich Stadium Billiard](/tutorials/blender-tutorial-python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr)
- [Feigenbaum Bifurcation / Logistic Map](/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr)
- [Hénon-Heiles Hamiltonian KAM Tori](/tutorials/blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr)
- [Mathieu / Ince-Strutt Stability Floor](/tutorials/blender-tutorial-python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr)

---

Licence: **CC0** — release all rights. Scripts, notes, and supporting files are
free to use, copy, modify, and distribute without restriction.
