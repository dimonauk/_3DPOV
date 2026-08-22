# GN Simulation Zone — Abelian Sandpile (Bak-Tang-Wiesenfeld SOC)

**Blender 5.1 · CC0 · Holoflow Studio**

Implements the Abelian Sandpile cellular automaton — the original 1987
Self-Organised Criticality demonstration by Per Bak, Chao Tang, and Kurt
Wiesenfeld — entirely inside a Blender 5.1 Geometry Nodes Simulation Zone.

A `GRID_N × GRID_N` flat quad grid carries a FLOAT `sand` attribute on the
face domain.  1 536 grains are heaped at the centre face.  Each simulation
frame, any face with `sand ≥ 4` topples: it loses 4 grains, and each of its
four cardinal edge-neighbours gains 1.  Grains at the open boundary are
absorbed.  Within ~200 frames the pile avalanches into a stable fractal
diamond pattern — the classic SOC attractor.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene setup + GN Simulation Zone tree (run in Blender) |
| `record.py` | Overhead orthographic render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

```
blender --background --python blueprint.py
```

Open `hf_sandpile.blend`, go to **Object → Geometry Nodes Cache → Bake All**,
then scrub the timeline to watch the avalanche.

## Key technique

`GeometryNodeSampleIndex` with `clamp=False` reads exact FLOAT grain values
from cardinal neighbours by index arithmetic (`i ± 1`, `i ± GRID_N`).  A
`GeometryNodeSwitch` guards left/right directions against column-boundary
row-wrap artefacts.  Up/down out-of-bounds indices return 0 automatically.

This is the correct approach for the sandpile: `BlurAttribute` divides by
each face's actual neighbour count (4/3/2 for interior/edge/corner), making
it impossible to recover integer grain counts without domain-specific scaling.

## Tutorial

`/tutorials/blender-tutorial-gn-simulation-zone-abelian-sandpile-soc-fractal-cascade`

## External references

- Bak, Tang, Wiesenfeld (1987) — *Phys. Rev. Lett.* 59:381 (Public Domain)
- Blender Manual — Simulation Zone: CC-BY-SA 4.0, Blender Foundation
- rosamc/SandpileModel — MIT: https://github.com/rosamc/SandpileModel
