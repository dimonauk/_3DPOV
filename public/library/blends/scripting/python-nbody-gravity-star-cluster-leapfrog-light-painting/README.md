# N-Body Gravity — Star Cluster Collapse & Leapfrog Light-Painting

**Blender 5.1 · Python KDK Leapfrog · CC0 · Holoflow Studio**

Twenty-four equal-mass stars initialised in a cold rotating Plummer disk
(virial ratio Q ≈ 0.25) collapse under mutual softened gravity, develop
streaming orbital arms through differential rotation, and produce poi
light-painting trails that trace the full gravitational choreography across
400 frames (8 N-body time units ≈ 3 orbital crossing times).

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build the scene — run once via Scripting tab |
| `record.py` | Render `viewport.mp4` — run after blueprint in same session |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture guide for `screen.mp4` |

## Quick start

1. Open a new Blender 5.1 file.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` and press **Run Script**.
4. Watch the progress log in the Info bar (integration takes ~10 s on a typical laptop).
5. Press **Space** to preview the animation in Rendered/EEVEE shading.
6. Open `record.py` and press **Run Script** to render `viewport.mp4`.

## Physics parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `N_STARS` | 24 | Particle count (O(N²) direct sum) |
| `PLUMMER_A` | 1.2 BU | Plummer scale radius (half-mass ≈ 1.56 BU) |
| `SOFTENING` | 0.20 BU | ε in softened force law — increase to suppress close encounters |
| `DT` | 0.005 | Leapfrog timestep in N-body time units |
| `N_SUBSTEPS` | 4 | KDK steps per recorded frame (effective Δt = 0.02) |
| `N_FRAMES` | 400 | Animation frame count |
| `VIRIAL_PERTURB` | 0.12 | Random σ on v as fraction of v_circ — controls arm irregularity |
| `SEED` | 42 | Random seed for reproducibility |

## Expected artefacts

See `.expected-artefacts.json`.

- `hf_nbody.blend` — scene with 24 animated bevel-curve trails
- `hf_nbody.glb` — full-trail snapshot GLB at frame 400
- `viewport.mp4` — EEVEE Bloom render of the cluster forming and streaming
- `screen.mp4` — OBS capture of live Rendered viewport playback

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting`
- Related: Lorenz Attractor (same bevel_factor_end reveal technique, different physics)
- Related: Double Pendulum Chaos (Python pre-computation → curve trails pattern)
- Related: SPH Fluid Light-Painting (particle simulation → poi trails)
- Related: Points to Curves Poi Trail (bevel_factor_end animation technique)
