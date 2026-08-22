# Butterfly Catastrophe A₅ — Holoflow Library Entry

**Topic**: Scripting (Python / numpy)  
**Blender version**: 5.1  
**Licence**: CC0  
**Date**: 2026-08-16

## What is this?

A 2D bifurcation surface of René Thom's **A₅ butterfly catastrophe** — the codimension-4 singularity in his 1972 classification of elementary catastrophes, and the direct successor to the [swallowtail (A₄)](/tutorials/blender-tutorial-python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr).

The germ `V₀(x) = x⁶` unfolds to `V(x;a,b,c,d) = x⁶ + ax⁴ + bx³ + cx² + dx`.  The bifurcation set — where `V'` and `V''` both vanish, signalling degenerate critical points — is a 2D surface in 4D control space.  Fixing the butterfly parameter `b` and projecting onto `(a, c, d)` reveals the **three-wing shape**: a central spine cusp (`x=0`) flanked by two outer wing cusps (`x = ±√(−a/5)` for `a < 0`).  All three branches coalesce at the A₅ origin.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the 80×60 quad mesh, shape keys, material, exports GLB |
| `record.py` | 150-frame viewport animation — orbit + shape-key morph |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output files and cross-references |

## Running

1. Open Blender 5.1 → **Scripting** workspace.
2. Open `blueprint.py` → **Run Script**.
3. A 80×60-vertex faceted disc poi appears (three-wing butterfly disc).
4. Open `record.py` → **Run Script** to render `viewport.mp4`.
5. Save as `hf_butterfly_a5.blend` in this directory.

## Mathematics

| Property | Value |
|----------|-------|
| Germ | `V₀(x) = x⁶` |
| Codimension | 4 |
| Fold lines (`b=0`) | `x = 0` (spine) and `x = ±√(−a/5)` for `a < 0` (wings) |
| A₅ point | `a = b = c = d = 0`, `x = 0` |
| Predecessor | A₄ Swallowtail (codim 3) |
| Successor (corank 2) | D₄ Elliptic/Hyperbolic Umbilic |

## Shape Keys

| Key | `b` | Effect |
|-----|-----|--------|
| `Basis` | 0 | Symmetric three-wing butterfly |
| `Butterfly_Left` | −1 | Left wing inflated, right deflated |
| `Butterfly_Right` | +1 | Right wing inflated, left deflated |

## Vertex Colour

Divergent blue → teal → amber, encoding the state variable `x`:
- **Blue** (`x < 0`): outer left wing
- **Teal** (`x ≈ 0`): body spine (A₅ coalescence locus)
- **Amber** (`x > 0`): outer right wing

Self-intersecting points where two sheets meet appear as sharp colour boundaries.
