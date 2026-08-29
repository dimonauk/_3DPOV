# Thomas Cyclically-Symmetric Attractor

**Topic:** Thomas's labyrinthine strange attractor · René Thomas 1999  
**Engine:** Blender 5.1 · Python scripting · NumPy RK4  
**Licence:** CC0  
**Format:** `.blend` + `.glb` + Bishop parallel-transport tube + 4 shape keys

## What this produces

Running `blueprint.py` inside Blender 5.1's Scripting workspace generates a
3D mesh shaped like the Thomas attractor — a strange attractor whose
trajectory weaves labyrinthine channels between 27 unstable equilibria
arranged on a 3×3×3 lattice in phase space. The result is exported as
`hf_thomas_poi.glb` with four shape-key deformation targets, suitable for
use as a WebXR poi head in Holoflow Studio.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main Blender script — integrates the ODE, builds the tube, exports GLB |
| `record.py` | Animated viewport render (viewport.mp4) — run after blueprint.py |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for screen.mp4 |
| `README.md` | This file |
| `.expected-artefacts.json` | CI/QA manifest |
| `hf_thomas_poi.glb` | *(generated on run)* GLB with shape keys |
| `viewport.mp4` | *(generated on run)* 10s EEVEE animated render |
| `screen.mp4` | *(recorded manually)* OBS screen capture |

## Quick start

1. Open Blender 5.1.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` in the text editor panel.
4. Press **Run Script** (Alt+P or the ▶ button).
5. After ~20 s a glowing tube appears in the viewport, and `hf_thomas_poi.glb`
   is written next to the blend file.

## The Thomas attractor

René Thomas introduced this system in 1999 to study how cyclic feedback
circuits generate deterministic chaos. The equations are:

```
ẋ = sin(y) − b·x
ẏ = sin(z) − b·y
ż = sin(x) − b·z
```

The cyclic permutation symmetry (x,y,z)→(y,z,x) is exact: every 120°
rotation of the coordinate axes maps the vector field onto itself. At the
canonical dissipation `b = 0.208187` the trajectory is confined to a
labyrinthine strange attractor with Lyapunov exponent λ₁ ≈ +0.039 and
Kaplan-Yorke dimension D_KY ≈ 2.085.

As `b→0` the dissipation vanishes (divergence −3b → 0) and the phase space
floods with quasi-periodic channels that tile all of R³ like a 3D crystal
maze — the SK_Conservative shape key (b=0.05) gives a taste of this limit.

## Shape keys

| Key | b value | Character |
|-----|---------|-----------|
| Basis | 0.208187 | Canonical labyrinthine chaos |
| SK_Dense | 0.180 | More volume explored; larger tangle |
| SK_Sparse | 0.250 | Tighter orbit; approaching period-1 cycle |
| SK_Conservative | 0.050 | Near-Hamiltonian; labyrinth floods the cube |

## Cross-references

**Internal:**
- [Halvorsen Attractor (Z₃ symmetry)](/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr)
- [Aizawa Attractor (Bishop tube method)](/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr)
- [Lorenz Attractor (RK4 classic)](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr)
- [Duffing Oscillator (Poincaré chaos)](/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr)

**External:**
- Thomas R (1999) *Int J Bifurc Chaos* 9(10):1889–1905.
  DOI [10.1142/S0218127499001383](https://doi.org/10.1142/S0218127499001383)
- Gilpin W (2021–2024) dysts: Dynamical Systems Benchmarks (MIT).
  <https://github.com/williamgilpin/dysts>
- Sprott J C (2010) *Elegant Chaos*. Cambridge University Press. (equations PD)
