# ABC Flow — Arnold-Beltrami-Childress Force-Free Poi Light Brush

**Blender 5.1 · Python numpy · CC0**

---

## What this is

A Blender 5.1 blueprint that constructs 54 illuminated tube-curves whose
paths follow the **ABC (Arnold-Beltrami-Childress) flow** — the canonical
Beltrami vector field where every streamline is simultaneously a vortex line
and a magnetic field line.  The result is an entangled, three-colour light
brush for poi performance capture and WebXR presentation.

---

## Mathematical background

The ABC flow in [0, 2π]³ with periodic boundaries:

```
ẋ = A sin z + C cos y
ẏ = B sin x + A cos z
ż = C sin y + B cos x
```

with **(A, B, C) = (√3, √2, 1)** — the "standard chaotic" parameters from
Dombre et al. (1986).

**Beltrami condition**: ∇×u = u  
→ vorticity is parallel to velocity at every point.  
→ the field is an *eigenstate* of the curl operator with eigenvalue 1.  
→ any flow proportional to this field is an *exact* steady solution of the
Euler equations, valid at all Reynolds numbers.

**Lagrangian chaos**: despite the smooth, periodic, *steady* velocity field,
particle trajectories separate exponentially.  The maximal Lyapunov exponent
for these parameters is λ ≈ 0.13 per unit time.  This is the ABC dynamo
effect: a small seed magnetic field is stretched and folded, amplifying
exponentially — a mechanism proposed for stellar magnetic field generation.

---

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Main script — seeds + RK4 integration + curve mesh + GLB export |
| `record.py` | Renders `viewport.mp4` with an orbiting camera |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

---

## Running

```bash
# In Blender's Script editor
# Open blueprint.py → Run Script
# Expect ~30–60 s for 54 × 3 000 RK4 steps

# Headless
blender --background --python blueprint.py
blender --background --python record.py   # also renders viewport.mp4
```

---

## Parameters to tweak

| Constant | Default | Effect |
|----------|---------|--------|
| `A_COEF` | √3 | Change flow topology |
| `B_COEF` | √2 | " |
| `C_COEF` | 1.0 | " |
| `N_STEPS` | 3000 | Longer trails → denser tangle |
| `N_SEEDS` | 18 | More tubes per group |
| `TUBE_R` | 0.0025 | Bevel radius (tube thickness) |
| `SCALE` | 0.08 | Physical scale in metres |

Set A=B=C=1 to see the *integrable* ABC flow — streamlines lie on nested tori
instead of spreading chaotically.

---

## Outside sources

1. **Arnold, V.I. (1965)** — "Sur la topologie des écoulements stationnaires
   des fluides parfaits." *Comptes Rendus* 261:17–20.  Public Domain.

2. **Dombre et al. (1986)** — "Chaotic streamlines in the ABC flows."
   *J. Fluid Mech.* 167:353–391.  
   https://doi.org/10.1017/S0022112086002859  
   Public Domain mathematical content.

---

## Licence

Blueprint and all generated files: **CC0 1.0 Universal**.
