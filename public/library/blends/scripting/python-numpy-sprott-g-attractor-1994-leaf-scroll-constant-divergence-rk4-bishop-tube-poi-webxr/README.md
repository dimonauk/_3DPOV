# Sprott G Attractor (1994) — Leaf-Scroll Constant-Divergence Chaos
**Bishop Parallel-Transport Tube + Poi Head · WebXR · Blender 5.1**

## What this is

The Sprott G system is one of the 14 "simplest chaotic flows" catalogued by
J. C. Sprott in his 1994 *Physical Review E* landmark:

```
ẋ = a·x + z          (linear x-stretch + z-injection)
ẏ = x·z − y          (single product nonlinearity; self-damped)
ż = −x + y           (cyclic feedback)
```

Canonical parameter: **a = 0.40**.

What makes it stand apart from Lorenz, Rössler, and the other Sprott cases in
this library is the combination of:

1. **Constant divergence** ∇·F = a − 1 = −0.60 — the flow shrinks every
   phase-space volume element at a fixed exponential rate, independent of
   position.  Contrast Dadras, Aizawa, or Bouali, where the divergence is
   position-dependent.
2. **Single product nonlinearity** (only x·z in ẏ) — minimum nonlinearity,
   as Sprott's minimum-term search required.
3. **Leaf-scroll topology** — the attractor traces a single lobe that curls
   like a rolled leaf, very different from the two-wing butterflies of Lorenz
   or the tight spirals of Genesio–Tesi.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 script; run in Text Editor → Run Script |
| `record.py` | Renders `viewport.mp4` (run after `blueprint.py`) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Outputs (after running blueprint.py)

| Artefact | Where |
|----------|-------|
| `hf_sprott_g_poi.blend` | Save manually via File → Save |
| `hf_sprott_g_poi.glb` | Auto-exported to the same folder |

## Parameters

| Constant | Value | Meaning |
|----------|-------|---------|
| `A_BASIS` | 0.40 | Canonical Sprott (1994) a; ∇·F = −0.60 |
| `A_LOWA` | 0.20 | Stronger dissipation; ∇·F = −0.80 |
| `A_HIGHA` | 0.65 | Weaker dissipation; ∇·F = −0.35 |
| `A_NEARCONS` | 0.85 | Near-conservative; ∇·F = −0.15 |
| `DT` | 0.01 | RK4 timestep |
| `BURN_IN` | 2000 | Steps discarded (≈ 26 Lyapunov times) |
| `N` | 90 000 | Integration steps after burn-in |
| `THIN` | 30 | Keep every 30th step → 3 000 waypoints |
| `TUBE_R` | 0.045 m | Tube cross-section radius |
| `TUBE_SIDES` | 8 | Octagonal cross-section |
| `POI_R` | 0.090 m | Poi-head sphere radius |

## Shape keys

| Name | a | ∇·F | Visual |
|------|---|-----|--------|
| Basis | 0.40 | −0.60 | Canonical leaf-scroll, moderate orbit |
| SK_LowA | 0.20 | −0.80 | Tighter, more dissipation, compressed looping |
| SK_HighA | 0.65 | −0.35 | Wider orbit, less damping, expanded leaf |
| SK_NearCons | 0.85 | −0.15 | Large ring, approaching conservative chaos |

## Physics notes

### Fixed points

**Origin O = (0, 0, 0)**  
Jacobian eigenvalues: λ₁ = −1 (stable) and λ_{2,3} = 0.2 ± 0.98i (unstable saddle-focus).  
The Shilnikov condition requires |Re(λ_c)| > |λ_r|, i.e. 0.2 > 1 — NOT met.  
Chaos does not arise from a Shilnikov homoclinic orbit to O; it is global.

**P* = (−2.5, −6.25, 2.5)** for a = 0.40  
The second fixed point lies well off-axis, and the orbit visits both
neighbourhoods, generating the characteristic leaf-scroll shape.

### Lyapunov spectrum (a = 0.40)

| Exponent | Value | Role |
|----------|-------|------|
| λ₁ | ≈ +0.077 | Chaos (positive = stretching) |
| λ₂ | ≈ 0 | Flow direction |
| λ₃ | ≈ −0.677 | Stable folding |
| Sum | −0.600 | = ∇·F ✓ Liouville |

Kaplan–Yorke dimension: D_KY = 2 + 0.077/0.677 ≈ **2.114**  
Lyapunov time: τ = 1/λ₁ ≈ **13.0** time units

### Colour coding

`SprottG_Speed` FLOAT_COLOR attribute encodes normalised local speed.  
Slow orbit regions → **cobalt** (0.02, 0.10, 0.55).  
Fast orbit regions → **amber** (0.95, 0.60, 0.00).

## Licence

Blueprint: CC0 (studio work).  
Equations: public-domain mathematical facts.  
Sprott (1994) DOI: 10.1103/PhysRevE.50.R647.
