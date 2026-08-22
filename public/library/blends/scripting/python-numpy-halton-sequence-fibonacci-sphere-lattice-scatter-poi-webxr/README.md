# Halton Low-Discrepancy Sequence & Fibonacci Sphere Lattice

**Blender 5.1 · Python + numpy · CC0**

Generates 144 poi-head spheres scattered across a 2 m radius sphere using three methods side-by-side: Halton base-{2,3} low-discrepancy sequence, the Vogel (1979) golden-angle Fibonacci lattice, and area-preserving Monte Carlo random. Exports a single GLB for WebXR comparison.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — run in Blender Text Editor |
| `record.py` | Viewport animation render (EEVEE Next, 180 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for screen.mp4 |
| `.expected-artefacts.json` | Artefact manifest + cross-references |

## Quick start

1. Open Blender 5.1, switch to the **Scripting** workspace.
2. New text block → paste `blueprint.py` → **Run Script**.
3. The three clusters appear at Y = {−5, 0, +5} m. Press Numpad 7 for the top-down comparison view.

## Output artefacts

- `hf_scatter.glb` — three 144-point scatter clusters (Draco level 6, WebP textures)
- `viewport.mp4` — produced by `record.py`
- `screen.mp4` — OBS screen capture per notes above

## Algorithm notes

### van der Corput sequence (base b)
Reflect the base-b representation of index k across the decimal point.
k=6 in base 2: `110₂` → `0.011₂` = 3/8.
The first s prime bases give the s-dimensional Halton sequence.

### Fibonacci sphere
Golden angle φ_g = π(3 − √5) ≈ 137.508°.
z_k = 1 − (2k+1)/N for equal-area spacing.
This is the same pattern a sunflower uses to pack its seeds.

## Licence
CC0 — no rights reserved.  Attribution appreciated but not required.

## Credits
- Halton, J.H. (1960). *Numerische Mathematik* 2(1). Academic reference (PD).
- Vogel, H. (1979). *Mathematical Biosciences* 44. Academic reference (PD).
- NumPy — BSD-3-Clause — https://numpy.org
