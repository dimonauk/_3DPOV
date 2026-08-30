# Hindmarsh-Rose Bursting Neuron
**Blender 5.1 · Holoflow Studio**

`public/library/blends/scripting/python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr/`

## What this is

A poi-head GLB encoding the three-dimensional phase-space trajectory of the
Hindmarsh-Rose neuron model (Hindmarsh & Rose, 1984, Proc R Soc Lond B
221:87-102).  The HR system couples a fast FitzHugh-Nagumo-type planar
oscillator (membrane potential x, recovery variable y) to a slow
calcium-like adaptation current z, producing a continuous bifurcation
sequence as the applied current I_ext increases:

```
quiescent  →  tonic spiking  →  period-doubling  →  chaotic bursting  →  fast spiking
 I < 1.0       I ≈ 1.3–1.5       1.5 < I < 1.9       2.0 < I < 3.5       I > 3.5
```

The equations (standard Hindmarsh-Rose parametrisation, a=1 b=3 c=1 d=5
s=4 x_R=−1.6 r=0.006):

```
ẋ = y − x³ + 3x² − z + I   (membrane potential)
ẏ = 1 − 5x² − y            (Na⁺/K⁺ recovery)
ż = 0.006[4(x + 1.6) − z]  (slow Ca²⁺ adaptation)
```

## Shape keys

| Key | I_ext | Regime | Lyapunov λ₁ |
|---|---|---|---|
| Basis | 2.0 | Regular bursting | ≈ +0.008 |
| SK_Tonic | 1.5 | Periodic tonic spiking | < 0 |
| SK_Chaotic | 2.5 | Chaotic bursting | ≈ +0.012 |
| SK_Fast | 4.0 | Fast dense spiking | ≈ +0.004 |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Production Blender script — run in Text Editor |
| `record.py` | Headless viewport animation render (EEVEE Next) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest |

## Integration parameters

- **DT** = 0.05 · **BURN_IN** = 5 000 steps (250 t.u.) · **N_STEPS** = 80 000 · **SKIP** = 25 → **3 200 waypoints**
- **TUBE_SIDES** = 12 · **TUBE_R** = 0.014 m → 3 200 × 12 = **38 400 vertices**
- Vertex colour **HR_Potential** FLOAT_COLOR: x mapped cobalt (rest, x ≈ −1.6) → amber (spike peak, x ≈ +2.0)
- Emission strength 1.8 · metallic 0.45 · roughness 0.26

## Licence

CC0-1.0 — no rights reserved.  
Source equations: Hindmarsh & Rose 1984 Proc R Soc Lond B 221:87-102
(PD by age; Crown copyright expired for publications >40 years old).
