# Jacobi Elliptic Functions: sn/cn/dn, AGM & Elliptic Poi Head (Blender 5.1)

Jacobi's elliptic functions — introduced in 1829 — are the exact solution of the
nonlinear pendulum at any swing amplitude.  Unlike the small-angle approximation
(sin θ ≈ θ), they capture the true slowing of the pendulum near its turning points
via the **complete elliptic integral** K(k), computed here by the **arithmetic-geometric
mean** (AGM): six iterations of `a ← (a+b)/2, b ← √(ab)` give 15 correct
decimal places.

## The Surface

`dn(u,k)` is the "energy envelope" of the oscillation; it equals 1 at the pendulum's
resting point and drops to `k′ = √(1-k²)` at maximum angular velocity.  Using it as
a radial modulator on a sphere:

```
ρ(θ, k) = R · dn(θ · 2K(k)/π, k)
```

produces a poi head that morphs from a **perfect sphere** (k = 0) through progressively
pinched elliptic profiles to a dramatic **hourglass** (k → 1) — all while preserving
the warm-gold pole / deep-violet equator colour gradient encoded in the dn amplitude.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: AGM, dn surface, shape keys, vertex colours, GLB export |
| `record.py` | 150-frame Workbench shape-key sweep animation |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture walkthrough |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

1. Open **Blender 5.1**, switch to **Scripting** workspace.
2. Open `blueprint.py`, click ▶ **Run Script**.
3. The dn-modulated sphere appears; a GLB lands at
   `public/library/glbs/scripting/…/hf_jacobi_poi.glb`.
4. Optionally run `record.py` to render `viewport.mp4`.

## Shape Key Guide

| Key name | k value | Character |
|----------|---------|-----------|
| `Basis`  | 0.00    | Perfect sphere — trig limit |
| `k_050`  | 0.50    | Slightly waisted — 13% narrowing at equator |
| `k_080`  | 0.80    | Clearly elliptic — 40% narrowing |
| `k_095`  | 0.95    | Strong waist — 69% narrowing |
| `k_099`  | 0.999   | Hourglass — equator radius < 5% of pole |

## Mathematical Notes

- **Pendulum period**: T = 4K(k)/ω₀.  At k = 0.99 (θ₀ ≈ 162°): T ≈ 2.66 × (2π/ω₀).
- **Key identity**: sn² + cn² = 1; k²sn² + dn² = 1 (the elliptic "Pythagorean" pair).
- **Weierstrass connection**: sn and ℘ (Weierstrass P-function) are related by
  `sn²(u,k) = (e₁-e₃)⁻¹(℘(u) - e₃)` — both are doubly-periodic meromorphic functions.

## Licence

All authored code: CC0 1.0 Universal.  External maths references: Public Domain (NIST, NBS 1964).
