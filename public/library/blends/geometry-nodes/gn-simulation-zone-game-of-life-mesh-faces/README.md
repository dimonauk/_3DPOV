# GN Simulation Zone — Conway's Game of Life on Mesh Faces

**Blender 5.1 · CC0 · Holoflow Studio**

Conway's 1970 cellular automaton implemented in a Geometry Nodes Simulation Zone, running on the face domain of a 32×32 quad grid. The central technique: `Blur Attribute` with `iterations=1` and `Weight=1.0` computes the mean of edge-adjacent face values. For interior quad-grid faces (exactly four edge-neighbours), multiplying by four and rounding gives the exact integer neighbour count — no loops, no iteration over topology in Python, no additional state items in the Simulation Zone.

## What is produced

- `gol_grid` object with 961 quad faces, each carrying an `alive` FLOAT attribute
- `GN_GameOfLife` node group with a Simulation Zone implementing B3/S23 rules
- Emission material that reads `alive` per-face and renders dead cells as near-black, alive cells as saturated neon green

## Blueprint usage

```bash
blender --background --python blueprint.py
```

Open the resulting scene, press Space to play, and watch the automaton evolve from a 30%-density random seed through self-organisation into still lifes, oscillators, and gliders.

## Record usage

```bash
blender --background --python record.py
```

Renders frames 0–80 to `../../videos/geometry-nodes/gn-simulation-zone-game-of-life-mesh-faces/viewport.mp4`.

## Key design decisions

| Decision | Reason |
|---|---|
| Store `alive` as FLOAT (0.0/1.0), not BOOLEAN | `Blur Attribute` only supports FLOAT/VECTOR/COLOR; storing BOOLEAN requires a cast pipeline |
| `BlurAttribute` with Iterations=1, Weight=1.0 | Weight=1.0 = pure neighbour average (not weighted by distance); Iterations=1 = single-step diffusion for clean counting |
| Multiply-by-4 then Round | Interior quad faces have exactly 4 edge-adjacent faces; rounding cleans float drift from boundary approximation |
| CONSTANT interpolation on colour ramp | Hard step at 0.5 — no bleed between dead (0.0) and alive (1.0) cells |
| `pair_with_output()` for the Simulation Zone | Required Python API to link SimInput↔SimOutput in Blender 5.x |

## Boundary limitation

Edge and corner faces have 3 and 2 edge-neighbours respectively. Multiplying their blur average by 4 gives a non-integer result before rounding, which slightly over- or under-counts. In practice this manifests as a ~1-cell dead zone at all four edges of the grid. A border ring of permanently-dead cells (set to 0 in the bmesh seed loop by checking `face.index < GRID_DIVS` etc.) cleanly masks this effect.

## Outside sources

- Blender Manual — Blur Attribute: <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/blur_attribute.html> (CC-BY-SA 4.0, Blender Foundation)
- Blender Manual — Simulation Zone: <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html> (CC-BY-SA 4.0, Blender Foundation)
