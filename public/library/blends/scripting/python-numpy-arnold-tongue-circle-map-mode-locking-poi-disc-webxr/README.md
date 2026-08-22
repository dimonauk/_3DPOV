# Arnold Tongue / Sine Circle Map — Mode-Locking Basin Relief

**Blender 5.1 · Python + numpy · CC0**

## What This Is

The *sine circle map* is the simplest mathematical model of two coupled
oscillators: a fast oscillator driving a slow one.  As the coupling
strength K rises from 0 to 1, the slow oscillator's average rotation
rate locks onto rational multiples of the drive — 1:1 (unison),
1:2 (octave), 2:3 (fifth), 3:5, and so on.  Each locking state
corresponds to a tongue-shaped region in the (Ω, K) parameter plane,
widening like a trumpet as K increases.  These are *Arnol'd tongues*,
first classified by Vladimir Arnol'd in 1965.

This library entry scans the full (Ω, K) unit square at 180 × 180
resolution, classifies each point by winding number, and lifts the
mode-locking depth into a displaced mesh.  The result is a topographic
map of rational resonances — useful as a poi disc decoration, a stage
floor tile, or an educational artefact for WebXR.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Complete Blender 5.1 script: scan → mesh → vertex colours → GLB export |
| `record.py` | Viewport orbit render (360 frames → viewport.mp4) |
| `SCREEN-RECORDING-NOTES.md` | OBS setup and capture walkthrough |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# Headless (background mode — no GUI):
blender --python blueprint.py --background

# Interactive (paste into Text Editor and press Run Script):
# Open Blender 5.1 → Scripting workspace → Open blueprint.py → ▶
```

Expected runtime on a modern CPU: 30–90 s for the winding-number scan
(GRID_RES 180, N_TRANSIENT 400, N_ITER 1200).

## Mathematical Background

### The Map

```
θ_{n+1} = (θ_n + Ω − (K / 2π) · sin(2π θ_n))  mod 1
```

- At K = 0: pure rotation at frequency Ω.  All orbits are quasiperiodic
  if Ω is irrational, periodic if rational.
- At K > 0: the sine term deforms the circle, pulling orbits toward
  periodic resonances.  The locking regions widen with K.
- At K = 1: the map's derivative is zero at one point — the boundary
  of "criticality".  The winding number as a function of Ω becomes
  the *devil's staircase* (a continuous, monotone function that is
  constant on a dense set of intervals and has zero derivative a.e.).
- At K > 1: the map folds and becomes non-invertible; chaotic windows appear.

### Winding Number Estimation

After N_TRANSIENT transient steps (discarded to let the orbit settle),
N_ITER steps accumulate the *raw* (unmodded) angular displacement.
Dividing by N_ITER gives the winding number W ≈ p/q for locked orbits.

The Farey table (all rationals p/q with q ≤ 8) provides 49 candidate
winding numbers.  Each grid cell is assigned to its nearest rational;
if the distance is below LOCK_EPSILON, the cell is marked locked and
its displacement is proportional to the distance to the boundary.

### Vertex Colour Hue Assignment

Each Farey rational p/q receives a hue derived from its denominator q
(band) and numerator p (offset within the band).  Locked cells are
saturated (S = 0.82), unlocked (chaotic) cells are desaturated (S = 0.14).
This creates pastel, per-tongue colouring with a unified palette.

## Blender 5.x Notes

- Vertex colours use `mesh.color_attributes.new(type='FLOAT_COLOR', domain='POINT')` —
  the legacy `mesh.vertex_colors` API is deprecated in 5.x.
- The GLB exporter flag `export_colors=True` is required for vertex
  colour attributes to survive into the WebXR viewer.
- Auto-smooth is a Geometry Nodes modifier in 5.x; the mesh here uses
  flat shading by design (Arnold tongue topology has sharp tongue boundaries).

## Outside Sources

1. **Arnol'd Standard Map — Scholarpedia** (CC BY-NC-SA 3.0)
   Figueras, Haro, Luque — http://www.scholarpedia.org/article/Arnold_standard_map
   Related: http://www.scholarpedia.org/article/Siegel_disks

2. **Jensen, Bak, Bohr (1984) "Transition to Chaos by Interaction of
   Resonances in Dissipative Systems"**, Phys. Rev. Lett. 50, 1637
   (PD/fair-use academic reference) — first experimental and numerical
   confirmation of devil's-staircase universality in the circle map.

## Studio Cross-References

- [Duffing Oscillator: Period-Doubling Route to Chaos](/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr)
- [Mandelbrot & Julia: Complex Iteration](/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr)
- [Physarum Slime-Mould Transport Network](/tutorials/blender-tutorial-python-numpy-physarum-slime-mould-transport-network-poi-webxr)
- [Lenia: Continuous Cellular Automaton](/tutorials/blender-tutorial-python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr)
