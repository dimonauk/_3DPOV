# Bloch Sphere: Qubit Pure-State Geometry

**Blender 5.1 · Python + numpy · CC0**

The Bloch sphere (Felix Bloch 1946) is the geometric representation of a two-level quantum
system (qubit). Every pure state |ψ⟩ = α|0⟩ + β|1⟩ maps to a point on S² via the Bloch
vector r = (⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩), with |r|=1 for pure states and |r|<1 for mixed states.

This library entry contains three closed paths on S² as a single POLY curve with shape keys:

| Shape key     | Path                        | Physics                              |
|---------------|-----------------------------|--------------------------------------|
| Basis         | Great circle, y-z plane     | Rabi precession about the x-axis     |
| SK_Berry      | Latitude circle at 60°      | Berry geometric phase γ = −π/2       |
| SK_DoubleLoop | Two great-circle arcs       | SU(2)→SO(3) spinor double cover      |

## Files

| File                        | Purpose                                               |
|-----------------------------|-------------------------------------------------------|
| `blueprint.py`              | Run in Blender to build scene + export GLB            |
| `record.py`                 | Renders `viewport.mp4` (150 frames, EEVEE NEXT)       |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4`            |
| `.expected-artefacts.json`  | Machine-readable manifest with cross-references       |
| `hf_bloch_poi.glb`          | Generated GLB (run blueprint.py to produce)           |
| `viewport.mp4`              | Rendered viewport animation (run record.py)           |
| `screen.mp4`                | Manual OBS recording of shape-key morphing            |

## Quick start

```bash
blender --python blueprint.py   # builds scene, exports hf_bloch_poi.glb
blender --background --python record.py  # renders viewport.mp4
```

Or open `blueprint.py` in Blender's Text Editor and press **Alt+P**.

## Key parameters (top of blueprint.py)

| Constant       | Default   | Effect                                     |
|----------------|-----------|--------------------------------------------|
| `SPHERE_R`     | `0.100 m` | Bloch sphere radius; all paths on S²       |
| `TUBE_R`       | `0.006 m` | Trajectory tube radius (bevel depth)       |
| `N_TRAJ`       | `360`     | Samples per closed path (1° resolution)    |
| `BERRY_THETA`  | `π/3`     | Berry loop colatitude (60°); γ = −π/2      |

## Mathematics

The Bloch sphere is CP¹ ≅ S²: the projective Hilbert space of a two-dimensional complex
vector space modulo global phase. The SU(2) group acts on S² via the Pauli generators:
σ_x, σ_y, σ_z form a basis for su(2) ≅ so(3).

The double-cover SU(2) → SO(3) means a 2π rotation of the Hamiltonian returns the Bloch
vector to its starting position but multiplies the state |ψ⟩ by −1 — the "spinor sign".
Only a 4π rotation restores |ψ⟩ exactly. This is the content of SK_DoubleLoop.

## Licence

CC0 1.0 Universal — all code and blueprint files are dedicated to the public domain.
Mathematical content (Bloch sphere geometry, Berry phase formula) is likewise public domain.

## Credits

- Bloch, F. (1946) Nuclear Induction. *Phys Rev* 70:460–474
- Berry, M. V. (1984) Quantal Phase Factors. *Proc Roy Soc A* 392:45–57
- Feynman, R. P., Vernon, F. L., Hellwarth, R. W. (1957) *J Appl Phys* 28:49–52
