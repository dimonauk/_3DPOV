# Sprott P Attractor — 1994 Catalogue Complete

**System**: ẋ = ay + z · ẏ = −x + y² · ż = x + y − z  
**Parameter**: a = 2.7 (canonical, 1994)  
**Source**: Sprott (1994), Phys. Rev. E 50, R647 — equations PD  
**Blender version**: 5.1  
**Licence**: CC0

---

## What this is

Sprott P is the final entry of Sprott's 1994 catalogue of nineteen
minimal chaotic flows.  It is the only case in that set with **both**
a y²-nonlinearity **and** a position-dependent (variable) divergence —
making it structurally distinct from all other entries in this library.

The divergence ∇·F = 2y − 1 means the system alternates between
locally expanding and contracting volumes as trajectories cross the
plane y = ½.  The time-average ⟨∇·F⟩ ≈ −1.16 is negative, ensuring
the attractor is genuinely dissipative despite lacking a constant
contraction rate.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 build script |
| `record.py` | 300-frame viewport animation render |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `README.md` | This file |

## Artefacts (when run locally)

- `hf_sprott_p_poi.blend` — Blender scene with tube + poi head
- `hf_sprott_p_poi.glb` — Draco-compressed, WebP-textured, +Y-up
- `public/library/videos/.../viewport.mp4` — rendered animation
- `public/library/videos/.../screen.mp4` — screen recording

## Key mathematics

### Fixed points

P₀ = (0, 0, 0) and P₁ = ((1+a)², −(1+a), a(1+a))

For a = 2.7: P₁ = (13.69, −3.70, 9.99)

### Characteristic polynomial at P₀

λ³ + λ² + (a−1)λ + (a+1) = 0

For a = 2.7: λ_r ≈ −1.505, λ_c ≈ 0.253 ± 1.549i

Shilnikov ratio ρ = |λ_r|/Re(λ_c) = 1.505/0.253 ≈ **5.96** > 1 ✓

### Lyapunov spectrum (a = 2.7)

λ₁ ≈ +0.075, λ₂ ≈ 0.00, λ₃ ≈ −1.24  
D_KY ≈ 2.06, ∑λᵢ ≈ −1.165 = ⟨2y−1⟩ ✓

## Shape keys

| Key | a | Character |
|-----|---|-----------|
| Basis | 2.7 | Canonical — Shilnikov ratio ≈5.96 |
| SK_LowA | 2.0 | Wider orbit — P₁ moves closer to P₀ |
| SK_HighA | 3.5 | Tighter orbit — stronger Shilnikov ratio ≈7.9 |
| SK_WideA | 4.5 | Near topology change |

## Why variable divergence matters

Most attractors in this library have **constant** divergence —
the Liouville balance ∑λᵢ = ∇·F is a single number, easy to verify.
Sprott P forces you to think about **time-averaged** contraction.
The orbit visits both y > ½ (locally expanding) and y < ½ (locally
contracting) regions; dissipation emerges from the weighted average.
This is physically realistic: real fluid flows, biological oscillators,
and climate models all have position-dependent divergence.

## Cross-references

- [Sprott I](../../../../components/tutorials/entries/) — highest Shilnikov ratio (≈16.7), same y²-class
- [Sprott Q](../../../../components/tutorials/entries/) — exact Shilnikov ratio 4.0, also y²
- [Sprott K](../../../../components/tutorials/entries/) — variable divergence, bilinear xy class
- [Sprott D](../../../../components/tutorials/entries/) — variable divergence, two-quadratic class

## External sources

1. **Sprott 1994**: J.C. Sprott, "Some simple chaotic flows",
   Phys. Rev. E 50(2):R647 — DOI: 10.1103/PhysRevE.50.R647 (PD)  
   Atlas: https://sprott.physics.wisc.edu/chaos/

2. **dysts** (MIT): W. Gilpin, 2021–2024 —
   https://github.com/williamgilpin/dysts  
   Lyapunov spectra and Kaplan–Yorke dimensions for 131 systems

3. **Bishop 1975** (PD): R.L. Bishop, "There is more than one way to
   frame a curve", Am. Math. Monthly 82(3):246–251
