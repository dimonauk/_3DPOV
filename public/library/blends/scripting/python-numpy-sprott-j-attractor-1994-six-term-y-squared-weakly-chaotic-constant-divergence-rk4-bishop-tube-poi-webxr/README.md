# Sprott J Attractor (1994)
**Six-Term y²-Nonlinearity · Constant Divergence −2 · Bishop Tube + Poi Head · WebXR**

## What this is
A Blender 5.1 Python blueprint that integrates the Sprott J chaotic flow —
one of the *weakest* chaos cases in Julien Sprott's 1994 catalogue (λ₁ ≈ +0.017,
Lyapunov time τ ≈ 59 time units). The orbit is built as a Bishop
parallel-transport tube with Cobalt→Amber speed-gradient vertex colours and
four shape keys that explore the b·y² fold-strength parameter space.

## System
```
ẋ =  2z
ẏ = −2y + z
ż = −x + y + b·y²   (b = 1.0 canonical)
```
∇·F = −2 (constant, b-independent) · Single equilibrium P₀=(0,0,0), unstable.

## Files
| File | Purpose |
|---|---|
| `blueprint.py` | Run in Blender Text Editor → builds `.blend` + exports `hf_sprott_j_poi.glb` |
| `record.py` | Renders 210-frame `viewport.mp4` animation via Workbench |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |

## Shape keys
| Key | b value | Character |
|---|---|---|
| Basis | 1.0 | Canonical chaos, barely positive λ₁ |
| SK_LoB | 0.5 | Weakened fold — near-periodic transients |
| SK_HiB | 1.5 | Broader y-excursions, more diffuse |
| SK_VHiB | 2.0 | Dominant quadratic — topology shift |

## Quick start
1. Blender 5.1 → Scripting workspace.
2. Open `blueprint.py` and press **Run Script** (Alt+P).
3. After ~45 s the SprottJ_Tube object is in the scene.
4. File → Export → glTF 2.0 is handled automatically.

## Source
Sprott JC (1994). *Some simple chaotic flows.* Phys. Rev. E 50(2):R647–R650.
DOI [10.1103/PhysRevE.50.R647](https://doi.org/10.1103/PhysRevE.50.R647).
Equations are public-domain mathematical facts.
