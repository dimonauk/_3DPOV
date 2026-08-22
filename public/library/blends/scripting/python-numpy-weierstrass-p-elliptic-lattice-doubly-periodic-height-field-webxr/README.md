# Weierstrass ℘-Function: Doubly-Periodic Elliptic Height Field (Blender 5.1)

**Topic**: Complex analysis / elliptic functions  
**Category**: scripting / numpy  
**Blender**: 5.1  
**Licence**: CC0  
**Tutorial**: [/tutorials/blender-tutorial-python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr](/tutorials/blender-tutorial-python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr)

---

## What this builds

A 96 × 96 quadrilateral height-field mesh whose Z-coordinate is the real part of
the Weierstrass ℘-function, evaluated on the fundamental domain of three classical
complex lattices.  The function has a second-order pole at the origin (a volcanic
peak, truncated to `POLE_CLIP = 9.0`), three finite-value saddle points at the
half-periods, and doubly-periodic repetition across the entire complex plane.

Three Blender shape keys let you morph between lattice shapes at runtime or in
the GLB's `morphTargetInfluences`:

| Shape key | τ (modular parameter) | Symmetry | Special property |
|---|---|---|---|
| `Square_tau_i` (basis) | i | Z₄ | g₃ = 0 |
| `Rectangular_tau_1p5i` | 1.5i | Z₂ | elongated volcano |
| `Equianharmonic_tau_eiπ3` | e^{iπ/3} | Z₆ | g₂ = 0, CM by ℤ[ω] |

Vertex colours encode the gradient magnitude |∇Re(℘)|:
**cyan** = near-zero gradient (flat regions / half-period saddles),
**magenta** = steep gradient (pole surroundings).

## Output artefacts

| File | Description |
|---|---|
| `blueprint.py` | Run in Blender 5.1 Scripting workspace. Builds scene + exports GLB. |
| `record.py` | Run after blueprint.py. Renders 120-frame morph animation to viewport.mp4. |
| `hf_weierstrass_p.blend` | Saved .blend (Dimona runs `File → Save As`). |
| `hf_weierstrass_p.glb` | Draco-6 / WebP GLB ready for Holoflow WebXR stage. |
| `viewport.mp4` | Rendered morph flyover (lands in `public/library/videos/…`). |
| `screen.mp4` | OBS screen recording per SCREEN-RECORDING-NOTES.md. |

## Quick start

```
1. Open Blender 5.1 → Scripting workspace
2. New text datablock → paste blueprint.py → Alt+P
3. Console prints field sizes and shape key names (~60 s on a modern CPU)
4. File → Save As → hf_weierstrass_p.blend
5. New text datablock → paste record.py → Alt+P (renders viewport.mp4)
6. Follow SCREEN-RECORDING-NOTES.md for OBS session
```

## Mathematical background

The Weierstrass ℘-function (1862) is characterised uniquely (up to the lattice)
by being doubly-periodic with a second-order pole at each lattice point.
The three half-period values **e₁ = ℘(ω₁/2)**, **e₂ = ℘((ω₁+ω₂)/2)**,
**e₃ = ℘(ω₂/2)** are exactly the roots of `4X³ − g₂X − g₃ = 0`, connecting
the transcendental function to an algebraic elliptic curve.  The j-invariant
`j(τ) = 1728 g₂³ / (g₂³ − 27g₃²)` parametrises the isomorphism class of the
curve and extends to the modular function j: ℍ/SL(2,ℤ) → ℂ at the heart of
the Moonshine conjecture and modern number theory.

## Cross-references

- [KdV Soliton tutorial](/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr) — ℘ is a 1-soliton of the KdV equation
- [Joukowski conformal map tutorial](/tutorials/blender-tutorial-python-numpy-joukowski-conformal-map-aerofoil-complex-potential-flow-poi-webxr) — complex-function field visualisation
- [Möbius transformation / Riemann sphere tutorial](/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr) — SL(2,ℤ) modular group acts on ℘ by τ-transformations
- [Weierstrass-Enneper minimal surfaces tutorial](/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr) — same Weierstrass apparatus, different application
