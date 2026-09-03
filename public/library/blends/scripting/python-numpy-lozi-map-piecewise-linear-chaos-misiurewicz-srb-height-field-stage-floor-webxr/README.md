# Lozi Map — Piecewise-Linear Strange Attractor

**René Lozi 1978 · Misiurewicz SRB Measure 1980**  
Blender 5.1 · bpy direct-data API · Log-density height-field stage floor

---

## What this is

The Lozi map is the piecewise-linear sibling of the Hénon map. Replace Hénon's
smooth quadratic `x²` with the non-smooth `|x|` and you gain something rare in
the study of strange attractors: **rigorous mathematical proof**. Misiurewicz
(1980) demonstrated existence of a Sinai–Ruelle–Bowen invariant measure at
`a = 1.7, b = 0.5` — the first complete proof for a non-invertible plane map,
predating the analogous Hénon result (Benedicks & Carleson 1991) by over a decade.

```
x_{n+1} = 1 − a·|x_n| + y_n
y_{n+1} = b·x_n
```

The `|x|` fold creates a sharp crease at `x = 0` visible in the rendered
height-field as a prominent central ridge — the geometric signature of
piecewise linearity. Both sides of the crease have **identical area contraction**
(`|det J| = |b| = 0.5`), so the attractor compresses at a provably constant
rate at every point except the crease itself.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main Blender 5.1 script — builds mesh, colours, shape keys |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Running

1. Open Blender 5.1.
2. Scripting workspace → open `blueprint.py` → **Run Script**.
3. Allow ~60 s for five 5 M-step density computations.
4. Save as `lozi_attractor.blend`.
5. (Optional) Run `record.py` to produce `viewport.mp4`.

## Shape keys

| Key | Parameters | Dynamics |
|---|---|---|
| Basis | a=1.70, b=0.50 | Canonical Misiurewicz chaos |
| SK_LowA | a=1.40, b=0.50 | Near bifurcation boundary, sparser |
| SK_HiA | a=2.00, b=0.50 | Stronger stretching, broader support |
| SK_LowB | a=1.70, b=0.30 | Weaker contraction, thinner leaves |

## Sources

- Lozi R (1978) *J. Phys. Colloq.* 39:C5-9 — original paper, public domain
- Misiurewicz M (1980) *Ann. New York Acad. Sci.* 357:348-358 — SRB proof
- Sprott JC chaos web companion — CC0: <https://sprott.physics.wisc.edu/fractals/2d/>
- Bourke P "Lozi Attractor" — CC0: <https://paulbourke.net/fractals/lozi/>

## Licence

Blueprint code: CC0 / public domain.  
Equations: public domain (Lozi 1978, Misiurewicz 1980).
