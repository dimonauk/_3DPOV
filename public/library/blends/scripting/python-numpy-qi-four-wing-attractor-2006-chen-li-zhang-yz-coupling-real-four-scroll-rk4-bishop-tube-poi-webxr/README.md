# Qi Four-Wing Attractor

A poi-head GLB encoding the phase-space trajectory of the Qi four-wing
chaotic system (Qi, Chen, Li & Zhang 2006, Int. J. Bifurcation Chaos).

## What makes this attractor different

Most well-known chaotic attractors — Lorenz, Chen, Lü — produce a
**double scroll**: the orbit loops around two fixed points, staying in the
same two quadrants of the xy-plane. The Qi system adds a single bilinear
coupling term, *d·yz*, to the first equation. That one term allows the
orbit to visit all four quadrants, giving a **genuine four-wing** topology.

The SK_TwoWing shape key demonstrates this directly: set the slider to 1
(d=0) and the four-wing pattern collapses to a two-wing double scroll in
real time.

## Equations

```
ẋ = a(y − x) + d·y·z      d=0 → two-wing;  d=1 → four-wing
ẏ = b·x − x·z − y
ż = x·y − c·z

Canonical:  a=14  b=16  c=8  d=1
```

## Dynamics at a glance

| Property             | Value                                      |
|----------------------|--------------------------------------------|
| Divergence ∇·F       | −23 (constant; position-independent)       |
| Equilibria           | O=(0,0,0); P±≈(±16.08, ±7.72, +15.52)     |
| Origin eigenvalues   | +8.82 (unstable), −23.82 (stable), −8      |
| λ₁                   | ≈ +0.28                                    |
| Kaplan–Yorke dim.    | ≈ 2.012                                    |
| Integrator / DT      | RK4 / 0.005                                |
| Waypoints            | 3 000 (90 000 steps, thinned ×30)          |
| Shape keys           | Basis · SK_TwoWing · SK_HighB · SK_LowC    |

## Files

| File                        | Description                              |
|-----------------------------|------------------------------------------|
| `blueprint.py`              | Pure-bpy script; generates the .blend    |
| `record.py`                 | Viewport-render script → viewport.mp4    |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions → screen.mp4            |
| `hf_qi_poi.blend`           | Blender scene (generated)                |
| `hf_qi_poi.glb`             | WebXR-ready GLB (generated)              |

## How to run

```bash
# Generate the mesh
blender --background --python blueprint.py

# Render the animation (requires hf_qi_poi.blend)
blender hf_qi_poi.blend --background --python record.py
```

## Cross-references

### Studio surfaces
- [Lorenz Attractor — RK4 Bishop Tube](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr)
- [Chen Attractor — Lorenz Dual Butterfly](/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr)
- [Dadras Attractor — Four-Scroll Variable Divergence](/tutorials/blender-tutorial-python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr)
- [Halvorsen Attractor — C3 Cyclic Triple Scroll](/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr)

### Outside sources
- Qi G, Chen G, Li S, Zhang Y (2006). "Four-wing attractors: From pseudo
  to real." *Int. J. Bifurcation Chaos* 16(4):859–885.
  DOI 10.1142/S0218127406015180. (Equations: public domain mathematics.)
- NumPy BSD-3-Clause: https://numpy.org · github.com/numpy/numpy
- Sprott JC — Elegant Chaos companion code (MIT):
  https://sprott.physics.wisc.edu/chaos/elegantchaos.htm

## Licence

Blueprint, record.py, and all authored files: **CC0 1.0 Universal**.
The mathematical equations are public domain.
