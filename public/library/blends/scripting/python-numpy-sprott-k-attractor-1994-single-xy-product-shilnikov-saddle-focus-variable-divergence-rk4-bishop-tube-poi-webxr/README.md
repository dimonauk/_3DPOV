# Sprott K Attractor — Library Entry

**System:** Sprott 1994, Case K  
**Equations:** ẋ = xy − z · ẏ = x − y · ż = x + az  
**Parameter:** a = 0.30 (canonical)  
**Source:** Phys Rev E 50(2):R647–R650, DOI 10.1103/PhysRevE.50.R647 (Public Domain equations)  
**Licence:** CC0  
**Blender version:** 5.1  

---

## What makes Sprott K special

Among Sprott's 1994 catalogue, Case K has the distinguishing property that its
Shilnikov eigenvalue at the origin is **exactly −1**. This is not a numerical
coincidence — it falls out of the ẏ = x − y equation directly: the y-tracking
dynamics contribute a clean real eigenvalue regardless of the parameter `a`.

The remaining two eigenvalues at the origin are complex conjugates
λ_c = a/2 ± i·√(1 − a²/4), giving Re(λ_c) = a/2 = 0.15. Because
|λ_s| = 1 > 0.15 = Re(λ_c), Shilnikov's criterion is satisfied with a ratio of
**6.7 : 1** — one of the cleanest confirmations in the catalogue.

The second equilibrium P = (−1/a, −1/a, 1/a²) = (−3.333, −3.333, 11.111)
is a distant saddle; the strange attractor lives around the origin.

The **variable divergence** ∇·F = y − 0.7 is rare among canonical Sprott
systems. The attractor self-selects trajectories that spend enough time at
y > 0.7 to remain net-contracting.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 Python script — integrates ODE, builds Bishop tube, shape keys, material, poi head, exports GLB |
| `record.py` | Renders a 150-frame EEVEE Next animation of the shape-key sweep to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for capturing the screen session |
| `.expected-artefacts.json` | Artefact registry + cross-reference manifest |

---

## Running the Blueprint

```python
# Inside Blender 5.1 → Scripting workspace → Text Editor
# Open blueprint.py, then Run Script.

# Or from the Python console:
import sys; sys.path.insert(0, "/path/to/this/directory")
from blueprint import build_sprott_k
tube = build_sprott_k(export_glb="/tmp/hf_sprott_k_poi.glb")
```

---

## Shape Keys

| Key | Parameter | Character |
|-----|-----------|-----------|
| Basis | a = 0.30 | Canonical Shilnikov spiral; tight orbit near origin |
| SK_LoA | a = 0.15 | Weaker ż self-coupling; wider outer loops |
| SK_HiA | a = 0.50 | Stronger amplification; orbit tightens and shifts |
| SK_NearP | a = 0.65 | Near second-equilibrium topology; figure changes shape |

---

## Lyapunov Analysis (a = 0.30)

| Quantity | Value |
|----------|-------|
| MLE λ₁ | ≈ +0.076 |
| Kaplan–Yorke dimension D_KY | ≈ 2.11 |
| Lyapunov time τ | ≈ 13 time-units |
| Divergence ∇·F | y − 0.7 (position-dependent) |
| Shilnikov ratio |λ_s|/Re(λ_c) | 1/0.15 ≈ 6.7 |

---

## Outside Sources

1. **Sprott JC 1994** — "Some simple chaotic flows", Phys Rev E 50(2):R647.  
   <https://sprott.physics.wisc.edu/chaos/> — equations are public domain.

2. **Gilpin W 2021–2024** — *dysts* Dynamical Systems Benchmarks, MIT licence.  
   <https://github.com/williamgilpin/dysts>

3. **Bishop RL 1975** — "There is more than one way to frame a curve",  
   Am Math Monthly 82(3):246–251. DOI 10.2307/2311093 (public domain).
