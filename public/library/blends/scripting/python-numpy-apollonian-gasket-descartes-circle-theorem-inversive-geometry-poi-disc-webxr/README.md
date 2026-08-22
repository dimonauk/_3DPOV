# Apollonian Gasket — Descartes Circle Theorem, Inversive Geometry & Fractal Disc Poi Head

**Blender 5.1 · Python scripting · Holoflow Studio**  
**Category**: scripting  
**Licence**: CC0 (original work, mathematical content public domain)

---

## What this is

The Apollonian gasket is the fractal obtained by starting with three mutually-tangent
circles inside a larger enclosing circle, then repeatedly filling every curvilinear
triangular interstice with the unique Soddy circle that fits snugly inside it.

This blueprint generates the integer packing seeded by the quadruple **(−1, 2, 2, 3)**
(outer disc plus left, right, and top circles — the densest integer packing whose
curvatures are consecutive integers).  Each gasket circle becomes an extruded
cylinder disc; height is proportional to generation depth, creating a terraced
fractal relief suitable as a Holoflow poi-head shield disc.

---

## Key mathematics

| Concept | Formula |
|---|---|
| Descartes Circle Theorem | (k₁+k₂+k₃+k₄)² = 2(k₁²+k₂²+k₃²+k₄²) |
| Apollonian reflection | kₙₑw = 2(kB+kC+kD) − kₚₐᵣₑₙₜ |
| Complex Descartes (z = k·c ∈ ℂ) | zₙₑw = 2(zB+zC+zD) − zₚₐᵣₑₙₜ |
| Curvature | k = 1/r (negative for enclosing circle) |
| Fractal dimension | Hd ≈ 1.305 688 (Boyd 1973) |

The reflection identity avoids complex square-root branch cuts — every new circle
is found by purely linear arithmetic over the existing quadruple.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | BFS gasket generator + Blender mesh assembly |
| `record.py` | 8 s orbital viewport animation render |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest |

---

## Expected artefacts

- `hf_apollonian_gasket.blend` — Blender file with disc mesh + camera + lights
- `hf_apollonian_gasket.glb` — Draco-6 WebP GLB export for WebXR (export via Holoflow exporter)
- `viewport.mp4` — produced by `record.py`
- `screen.mp4` — produced from OBS recording (see notes above)

---

## Running

```bash
# Inside Blender 5.1 Scripting workspace:
#   1. Open blueprint.py → Run Script
#   2. Open record.py   → Run Script (produces viewport.mp4)
```

---

## Cross-references

- [Möbius Transformation Gallery](/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr)
  — Apollonian packings are invariant under Möbius transformations; the inversive
  distance between circles is a Möbius invariant.
- [Arnold Tongue Circle Map](/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr)
  — resonance gaps in the Arnold tongue diagram are the continued-fraction analogues
  of the Apollonian curvature gaps.
- [Kleinian Limit Set](/tutorials/blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr)
  — the Apollonian gasket IS the limit set of the Apollonian group, a subgroup of
  PSL(2,ℂ); Schottky groups produce analogous fractal circle packings.

---

*Holoflow Studio — Blender Expert Content Mill*  
*Curvatures go to infinity. The circles go to zero. The fractal never ends.*
