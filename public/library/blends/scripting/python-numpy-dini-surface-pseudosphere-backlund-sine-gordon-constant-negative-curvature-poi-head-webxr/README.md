# Dini's Surface — Pseudospherical Helix

**Topic:** Constant negative Gaussian curvature, Bäcklund transform, sine-Gordon soliton  
**Blender version:** 5.1  
**Licence:** CC0  
**Series:** scripting  
**Form factor:** poi head for WebXR  

## What this is

**Dini's surface** is a one-parameter family of immersions of the hyperbolic
plane H² into Euclidean ℝ³, parametrised by a "helix pitch" b ≥ 0.  At b = 0
it degenerates to the **pseudosphere** (tractricoid), the classical surface of
constant negative curvature discovered by Beltrami (1868).  For b > 0 the
pseudosphere is twisted helically around the z-axis, producing the screwing
shape named after Ulisse Dini (1845–1918).

Crucially, the Gaussian curvature remains *exactly constant* regardless of b:

```
K = −1 / (a² + b²)
```

The surface is therefore a family of isometric embeddings of H² — they all
have the same intrinsic geometry, differing only in how they sit in ℝ³.

## Bäcklund transform and the sine-Gordon equation

The transformation from one pseudospherical surface to another is called the
**Bäcklund transform** (Albert Bäcklund, 1876).  Given any pseudospherical
surface Σ, you can construct a one-parameter family of new pseudospherical
surfaces Σ̃ by integrating a specific ODE system — Bäcklund's transformation
equations.  Each Dini surface is precisely such a transform applied to the
pure pseudosphere.

The angle function φ(u, v) between the tangent planes of Σ and Σ̃ satisfies
the **sine-Gordon equation**:

```
∂²φ / ∂u ∂v = sin φ
```

This is one of the most studied integrable PDEs in mathematical physics.
Its localised solutions (kinks with φ → 2π − φ₀) are topological solitons —
the parameter b controls the kink's velocity in light-cone coordinates.

## Geometry

Parametrisation:

```
x = a · cos(u) · sin(v)
y = a · sin(u) · sin(v)
z = a · ( cos(v) + ln( tan(v/2) ) ) + b · u
```

- u ∈ [0, 4π]: two full azimuthal turns
- v ∈ [0.10, π − 0.10]: polar angle (singular at 0 and π)
- a = 1.0: radius (fixed); K = −1/(1 + b²)

Grid: 160 × 120 = 19 200 vertices, 159 × 119 = 18 921 quads.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full bpy + numpy generation script |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Metadata and cross-reference registry |

## Shape keys

| Key | b value | K value | Character |
|---|---|---|---|
| `Basis` | 0.20 | −0.9615 | Visible helix, two full turns |
| `SK_Tight` | 0.40 | −0.8621 | Tight spiral, overlapping rings |
| `SK_Loose` | 0.08 | −0.9936 | Near-flat, open helix |
| `SK_Pseudo` | 0.01 | −0.9999 | Near-pseudosphere, almost no twist |

## Key references

- Eisenhart LP (1909) *A Treatise on the Differential Geometry of Curves and
  Surfaces.* Ginn & Company, Boston. §174 — pseudospherical surfaces;
  §178 — Bäcklund transform. Public domain.
  [archive.org](https://archive.org/details/treatisedifferen00eiseuoft)
- Bäcklund AV (1876) "Ueber Flächen-Transformationen." *Math. Ann.* 9:297–320.
  Public domain.
- NumPy BSD-3-Clause — https://numpy.org/

## Studio cross-references

- [Schoen Gyroid: TPMS & Gaussian Curvature](/tutorials/blender-tutorial-python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr)
- [Scherk Doubly Periodic Minimal Surface](/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr)
- [Hopf Fibration: S³ → S² Circle Bundle](/tutorials/blender-tutorial-python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr)
- [Bloch Sphere: Berry Phase & Gauss-Bonnet](/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr)
