# Surface Reaction-Diffusion via Mesh Laplacian
**Blender 5.1 | Python + numpy | CC0 | Holoflow Studio**

Integrates the Gray-Scott PDEs on a triangulated icosphere using the umbrella
Laplacian.  Turing spots form on the sphere surface and are mapped to radial
displacement and vertex colour — producing a poi-head GLB with a biological
spot or stripe pattern.

## Quick Start

```
blender --python blueprint.py
```

Output: `hf_surface_rd.glb` (WebXR-ready, Draco-compressed, vertex colours)

## Pattern Families

| F_RATE | K_RATE | Pattern |
|--------|--------|---------|
| 0.060  | 0.062  | Turing spots (~10 spots on sphere) ← default |
| 0.035  | 0.060  | Stripe labyrinths |
| 0.025  | 0.060  | Self-replicating spot trains |

## How It Differs from the Flat-Grid Blueprint

The `python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr` blueprint
uses a 128×128 regular lattice with `np.roll` Laplacian.  This blueprint uses
the **vertex graph** of an icosphere: patterns wrap around the 3-D surface,
spots are slightly larger near poles (fewer neighbours → longer effective
diffusion range), and the result can be applied directly to any triangulated
mesh (VRM body, poi prop, torus knot) without UV mapping.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Simulation + mesh write-back + GLB export |
| `record.py` | Shape-key animation → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Key Parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `SUBDIVISIONS` | 4 | Icosphere density (642 verts) |
| `SPHERE_R` | 0.15 m | Poi head radius |
| `DT` | 0.50 | Timestep (stable ≤ 0.78) |
| `N_STEPS` | 12 000 | Integration steps |
| `DISP_SCALE` | 0.045 m | Radial bump height |

## References

- Gray & Scott (1985) Chem. Eng. Sci. 39:1087 — original RD model
- "Discrete Laplace–Beltrami operator" Wikipedia — umbrella vs cotangent
