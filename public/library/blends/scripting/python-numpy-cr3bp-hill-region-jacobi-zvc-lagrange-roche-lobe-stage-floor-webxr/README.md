# CR3BP Hill Regions & Roche Lobe — Stage Floor

**Blender 5.1 · Python · NumPy · CC0**

A height-field stage floor visualising the effective potential of the
Circular Restricted Three-Body Problem (CR3BP) and its zero-velocity curves
(Hill regions / Roche lobe) for the Earth-Moon system.

---

## What is the CR3BP?

The **Circular Restricted Three-Body Problem** models the motion of a test
particle (a spacecraft, asteroid, or gas parcel) under the gravity of two
massive bodies — here Earth (M₁, mass fraction 1−μ) and Moon (M₂, mass
fraction μ = 0.01215) — while the two primaries orbit their common
barycentre in circular orbits.

In the *co-rotating* (synodic) frame, the equations of motion are:

```
ẍ − 2ẏ − x = −∂U/∂x
ÿ + 2ẋ − y = −∂U/∂y
z̈           = −∂U/∂z
```

where `U = ½(x²+y²) + (1−μ)/r₁ + μ/r₂` is the **effective potential**
(centrifugal + gravitational). Here `r₁`, `r₂` are distances from M₁ and M₂.

The single integral of motion is the **Jacobi constant**:
```
C_J = 2·Ω(x,y,z) − v²        where Ω = U + ½(x²+y²) (some notations)
```
(Convention here: 2·U — v² so the centrifugal term appears in both U and the
kinetic term; the height field uses `2·Ω` with Ω as defined in the code.)

---

## Zero-velocity curves (Hill regions)

Setting **v = 0** gives `2Ω = C_J`. This is the **zero-velocity curve
(ZVC)** — a boundary the particle can never cross without gaining energy.

| C_J relation | Hill topology |
|---|---|
| C > C_L1 ≈ 3.2015 | Moon enclosed in *Roche lobe*; particle trapped near Moon |
| C_L2 < C < C_L1   | L1 neck opens — Earth–Moon mass exchange possible |
| C_L3 < C < C_L2   | L2 opens — Moon region accessible from outer space |
| C < C_L4 ≈ 2.9880 | All forbidden zones collapse; tadpole/horseshoe orbits |

The floor models `z = H · tanh(α · (2Ω − C_J))`:
- **Accessible** (2Ω < C_J): floor below datum (white/cobalt)
- **Forbidden** (2Ω > C_J): raised wall (amber)
- **ZVC** (2Ω = C_J): floor datum z = 0 (ridge line)

---

## Five Lagrange points

L4 and L5 sit at the vertices of the equilateral triangle formed with the two
primaries. The Moon's Trojan asteroids (if any existed) would orbit there.
L1, L2, L3 lie on the x-axis; their x-coordinates are roots of Szebehely's
quintic equations, solved here by Newton-Raphson from Szebehely's
`γ ≈ (μ/3)^(1/3)` starting guess.

---

## Shape keys

| Key | C_J target | Hill topology |
|-----|-----------|---------------|
| **Basis**     | C_L1 + 0.04 | Moon completely enclosed in Roche lobe |
| **SK_L1Open** | (C_L1+C_L2)/2 | L1 neck just open |
| **SK_L2Open** | C_L2 − 0.01  | L2 escape route reached |
| **SK_Wide**   | C_L4 − 0.06  | All forbidden zones removed |

---

## Mesh spec

| Property | Value |
|----------|-------|
| Grid | 180 × 180 = 32 400 vertices |
| Quads | 179 × 179 = 32 041 |
| Domain | x ∈ [−1.85, 1.85], y ∈ [−1.40, 1.40] (normalised units) |
| Attribute | `CR3BP_Omega` FLOAT_COLOR (cobalt = accessible, amber = forbidden) |
| Shape keys | 4 (Basis + 3) |
| Export | GLB, +Y up, Draco 6, WebP, morph targets |

---

## Applications

- JWST at **Sun-Earth L2** (launched 2021)
- SOHO heliospheric observatory at **Sun-Earth L1** (since 1995)
- ISEE-3 — first spacecraft deliberately placed in a halo orbit (L1, 1978)
- Binary-star **Roche-lobe overflow** — mass transfer in cataclysmic variables
- Jupiter's **Trojan asteroids** at Sun-Jupiter L4/L5

---

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Open `blueprint.py`, run it.
3. Inspect the shape keys in Properties › Object Data.
4. Export: File › Export › glTF 2.0 — enable *Shape Keys*, *Custom Properties*,
   *Vertex Colours*, Draco compression level 6.
5. Run `record.py` to render `viewport.mp4`.
6. Follow `SCREEN-RECORDING-NOTES.md` to capture `screen.mp4`.

---

*Part of the Holoflow Studio Blender 5.1 Library. CC0 — no rights reserved.*
