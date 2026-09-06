# Sprott R Attractor — 5-Term XY-Bilinear, Shilnikov Ratio ≈10.7

**Blender 5.1 | scripting | CC0**

---

## System

```
ẋ = a − y
ẏ = b + z        a = 0.9, b = 0.4 (canonical)
ż = xy − z
```

Five terms, one bilinear product (xy).  This places Sprott R in the
same nonlinearity class as Sprott K — as distinct from the y²/z²/xz
systems that dominate the 1994 catalogue.

---

## Key physics

| Property | Value |
|---|---|
| Divergence ∇·F | −1 (constant, ab-independent) |
| Fixed point P* | (−b/a, a, −b) = (−0.4̄, 0.9, −0.4) |
| λ_r | ≈ −1.231 |
| λ_c | ≈ 0.115 ± 0.845i |
| Shilnikov ratio ρ | ≈ 10.7  ← third-highest in 1994 catalogue |
| λ₁ (Lyapunov) | ≈ +0.087 |
| D_KY | ≈ 2.09 |
| Lyapunov time τ | ≈ 11.5 |

Shilnikov's theorem guarantees chaotic horseshoes when ρ > 1.
At ρ ≈ 10.7 the number of homoclinic lobes is exceptionally large,
giving Sprott R a richer fold structure than most 5-term systems.

---

## Shape key family

| Key | a | b | Note |
|---|---|---|---|
| Basis | 0.9 | 0.4 | Canonical chaos |
| SK_LowA | 0.6 | 0.4 | Weaker coupling, broader orbit |
| SK_HighA | 1.2 | 0.4 | Stronger coupling, topology shift |
| SK_LowB | 0.9 | 0.2 | Smaller y-offset, near-periodic boundary |

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Expert bpy blueprint — run in Blender Scripting workspace |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar screen-recording instructions |
| `.expected-artefacts.json` | Mesh stats + cross-references |

---

## Running the blueprint

1. Open Blender 5.1, switch to **Scripting** workspace.
2. Open `blueprint.py`, click **Run Script**.
3. Open `record.py`, click **Run Script** — writes `viewport.mp4`.
4. Export GLB: `File → Export → glTF 2.0` with Draco level 6, WebP textures,
   morph targets enabled, vertex colours enabled, +Y-up.

---

## Outside references

- Sprott JC (1994). *Some simple chaotic flows.* Phys Rev E 50(2):R647–R650.
  DOI 10.1103/PhysRevE.50.R647 · equations public-domain.
  Site: https://sprott.physics.wisc.edu/chaos/sprott.htm
- Bishop RL (1975). *There is more than one way to frame a curve.*
  Am Math Monthly 82(3):246–251.  DOI 10.2307/2311093 · public-domain.
- dysts library (MIT) — https://github.com/williamgilpin/dysts
  131-attractor benchmark with verified Lyapunov spectra.
