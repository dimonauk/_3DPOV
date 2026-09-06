# Halvorsen Cyclic Attractor — Blender 5.1 Library Entry

**Category:** scripting · **Type:** blend + glb · **Licence:** CC0 (equations are mathematical objects)  
**Blender version:** 5.1 · **Python API:** bpy + numpy · **Date:** 2026-09-06

## What this is

A pure-Python Blender 5.1 blueprint that builds a poi-head trail mesh tracing
the Halvorsen cyclic strange attractor (submitted to J.C. Sprott by A. Halvorsen
~2005; published in *Elegant Chaos*, World Scientific, 2010).

The attractor is defined by:

```
ẋ = −a·x  −  4·y  −  4·z  −  y²
ẏ = −a·y  −  4·z  −  4·x  −  z²
ż = −a·z  −  4·x  −  4·y  −  x²
```

With canonical parameter **a = 1.89**, this generates a three-armed
(trefoil-like) strange attractor with exact **C₃ cyclic symmetry** —
permuting (x,y,z)→(y,z,x) maps the equations onto themselves.

## Why it matters

Two other entries in this library carry C₃ symmetry:

- **Thomas Attractor (1999)**: cyclic via *sine* coupling — globally bounded,
  smooth nonlinearity.
- **Halvorsen (2005)**: cyclic via *quadratic* self-coupling — the y², z², x²
  terms are *rectified*, always pushing negative regardless of sign.

The rectification is the key difference. It means the nonlinear terms can
never cancel through sign change, creating an asymmetric trapping region and a
distinctly different spiral arm geometry.

## Key mathematical facts

| Property | Value |
|----------|-------|
| Constant divergence | ∇·F = −3a = −5.67 |
| Positive Lyapunov exponent | λ₁ ≈ +0.076 |
| Kaplan-Yorke dimension | D_KY ≈ 2.013 |
| Lyapunov time | τ ≈ 13 time units |
| Fixed point O = (0,0,0) | eigenvalues {−9.89, +2.11, +2.11} — unstable |
| Fixed point P₁ = (−9.89)³ | eigenvalues {+9.89, −7.78±17.13i} — saddle-focus |
| Chaos mechanism | NOT Shilnikov; global trapping via rectified coupling |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 Python script; builds mesh, shape keys, colour attribute |
| `record.py` | Viewport animation recorder; outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `hf_halvorsen_poi.blend` | Pre-built Blender file (run blueprint.py to regenerate) |
| `hf_halvorsen_poi.glb` | WebXR-ready GLB with morph targets + vertex colour |

## Running the blueprint

1. Open Blender 5.1.
2. Scripting workspace → open `blueprint.py` → Run Script.
3. Wait for `Halvorsen blueprint complete.` in the console.
4. File → Export → glTF 2.0 with: Draco compression (level 6), WebP textures,
   morph targets, vertex colours, +Y up.

## Shape keys

| Key | a value | Character |
|-----|---------|-----------|
| Basis | 1.89 | Canonical trefoil — three interlocked spiral arms |
| SK_LowA | 1.50 | Weaker dissipation — arms expand ~25 % outward |
| SK_HighA | 2.50 | Stronger dissipation — orbit contracts inward |
| SK_NearP | 1.20 | Near periodic transition — large-amplitude single loop |

## Vertex colour: `Halvorsen_Speed` (FLOAT_COLOR)

Cobalt (0.03, 0.20, 0.78) → Amber (0.98, 0.62, 0.05)

Low speed = cobalt, near origin/fixed-point vicinities.  
High speed = amber, on the open-arm arcs away from the centre.

## Attribution

- Halvorsen A, Sprott JC (2010) *Elegant Chaos*, World Scientific, p. 37-38.
  ISBN 978-981-283-881-0. Mathematical equations: public domain.
- NumPy (BSD-3-Clause): https://numpy.org
- Bishop RL (1975) "There is more than one way to frame a curve."
  *Amer Math Monthly* 82(3):246-251. Public domain.
