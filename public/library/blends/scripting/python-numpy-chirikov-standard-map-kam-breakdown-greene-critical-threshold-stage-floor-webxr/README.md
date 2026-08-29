# Chirikov–Taylor Standard Map — KAM Breakdown & Greene's Critical Threshold

**Blender 5.1 · Python / numpy · Stage Floor · WebXR**

The standard map is the canonical area-preserving twist map on the 2-torus T²:

```
p_{n+1} = p_n + K · sin(θ_n)   (mod 2π)
θ_{n+1} = θ_n + p_{n+1}         (mod 2π)
```

Its Jacobian has determinant 1 everywhere, so volumes in phase space are
preserved — the map is **symplectic**.

## What the height field shows

Each cell `(θ, p)` of the 180 × 180 grid records how many orbit points fell
there across 200 initial conditions × 6 000 iterations.  The log-density is
then mapped to height:

- **Tall ridges** — dense lines visited repeatedly → intact KAM tori
- **Plateau** — uniform moderate density → chaotic sea (ergodic)
- **Intermediate humps** — island chains at rational winding numbers

## Shape keys

| Key | K | Character |
|---|---|---|
| Basis | 0.971635 | Greene's threshold — last KAM curve just broken |
| SK_Integrable | 0.10 | Nearly integrable — almost all tori present |
| SK_Intact | 0.50 | Typical KAM — clear island chains, most tori |
| SK_Chaotic | 2.00 | Mostly stochastic sea, small islands only |

## Quick start

```bash
# Inside Blender's Scripting workspace:
exec(open("blueprint.py").read())   # builds mesh + shape keys (~60 s)
exec(open("record.py").read())      # renders viewport.mp4
```

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds Blender mesh + shape keys + material |
| `record.py` | Viewport-animation renderer (10 s, shape-key sweep) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen capture |
| `.expected-artefacts.json` | CI artefact manifest |

## Mathematics

The KAM theorem (Kolmogorov 1954, Arnold 1963, Moser 1963) guarantees that
for small stochasticity K, Diophantine tori persist under perturbation.  As K
increases, resonant tori shatter first (Poincaré–Birkhoff): each rational
winding number ω = p/q spawns 2q alternating stable/unstable fixed points.

Greene (1979) showed that the last surviving invariant curve has winding number
equal to the noble number ω = (√5−1)/2 (the hardest irrational to approximate
by rationals), and that it breaks at **K_c ≈ 0.971635** — determined by the
residue criterion on the convergents of the continued-fraction expansion.

Chirikov's **resonance overlap criterion** (1979) gives a rough prediction:
overlap of adjacent resonances at K ≈ 1, consistent with the exact K_c.

## Licence

Blueprint and all authored code: CC0 1.0 Universal (Public Domain Dedication).
Mathematical content (equations, theorems) is in the public domain.
