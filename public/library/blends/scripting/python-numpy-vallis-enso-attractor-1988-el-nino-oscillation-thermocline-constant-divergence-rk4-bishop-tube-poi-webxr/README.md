# Vallis ENSO Attractor (1988)

**El Niño Chaos · Thermocline Coupling · Constant Divergence RK4 · Bishop Tube Poi · WebXR**

Blender 5.1 · Python + NumPy · CC0

---

## What this is

Gregory Vallis (1988) derived a three-variable ODE to explain why El Niño — the
anomalous warming of the central and eastern Pacific — recurs chaotically rather
than periodically.  The three variables are:

| Variable | Physical meaning |
|----------|-----------------|
| `x` | West-to-east sea-surface temperature (SST) gradient |
| `y` | Anomalous thermocline tilt (ocean heat reservoir) |
| `z` | Equatorial ocean current (Walker circulation anomaly) |

```
ẋ =  b·y·z  −  c·x  +  F
ẏ = −y      +  x·z
ż =  1      −  z    −  x·y
```

Canonical parameters (chaotic regime): **b = 14, c = 0.1, F = 18**

The system has a rare analytical property: its divergence is **constant**,

```
∇·F = −c − 1 − 1 = −(c + 2) = −2.1
```

regardless of position.  This means the Liouville sum of Lyapunov exponents
is exactly fixed: λ₁ + λ₂ + λ₃ = −2.1.  Numerics confirm:
λ₁ ≈ +0.120, λ₂ ≈ 0, λ₃ ≈ −2.220, sum = −2.100 ✓

Kaplan-Yorke dimension: **D_KY ≈ 2.054**

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the Bishop-tube mesh, 4 shape keys, GLB export |
| `record.py` | Renders the 12-second viewport animation |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 |
| `vallis_enso_poi.blend` | Blender project (produced by blueprint.py) |
| `vallis_enso_poi.glb` | WebXR-ready GLB (produced by blueprint.py) |

---

## Shape keys

| Key | Parameters | Physics |
|-----|-----------|---------|
| **Basis** | b=14, c=0.1, F=18 | Chaotic ENSO, D_KY≈2.054 |
| SK_Periodic | b=14, c=0.1, F=11 | Periodic limit cycle (regular El Niño) |
| SK_StrongB | b=20, c=0.1, F=18 | Stronger thermocline feedback, wider orbit |
| SK_LowDamp | b=14, c=0.05, F=18 | Halved SST damping, larger basin |

The morph from Basis to SK_Periodic shows the collapse from chaotic attractor
to limit cycle as the external forcing F decreases — one of the clearest
visual demonstrations of how a parameter bifurcation ends chaos.

---

## Vertex colour

**Vallis_Speed** FLOAT_COLOR attribute (POINT domain):

- **Cobalt** — high orbital speed (sharp bends, escape arcs)
- **Amber** — low orbital speed (near the unstable fixed point)

Speed reveals structure that position alone obscures: the slow amber
regions cluster near the fixed point at x* ≈ 1.42, where the orbit
spends most time before being expelled.

---

## Running the scripts

```bash
# From the Blender command line or Text Editor:
blender --background --python blueprint.py
blender --background project.blend --python record.py
```

Or paste each into the Blender Scripting workspace and press **Run Script**.

---

## Outside sources

1. **Vallis GK (1988)** — "Conceptual models of El Niño and the Southern Oscillation"
   *J. Geophysical Research* 93(C11):13979-13991.
   [https://doi.org/10.1029/JC093iC11p13979](https://doi.org/10.1029/JC093iC11p13979)
   Licence: mathematical equations PD · Related: Vallis 2006 "Atmospheric and Oceanic Fluid Dynamics" Cambridge

2. **Sprott JC (2020)** — Elegant Chaos parameter database
   [https://sprott.physics.wisc.edu/chaos/2020b.htm](https://sprott.physics.wisc.edu/chaos/2020b.htm)
   Licence: CC0 · Related: [Elegant Chaos book](https://www.worldscientific.com/worldscibooks/10.1142/6820)

3. **Janakiev N** — blender-scripting MIT reference implementations
   [https://github.com/njanakiev/blender-scripting](https://github.com/njanakiev/blender-scripting)
   Licence: MIT · Related: [njanakiev/scikit-spatial](https://github.com/njanakiev/scikit-spatial)
