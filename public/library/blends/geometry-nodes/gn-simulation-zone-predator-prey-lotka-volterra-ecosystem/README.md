# GN Simulation Zone — Predator-Prey Lotka-Volterra Ecosystem

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

Three-state spatial cellular automaton on a 31×31 quad grid face domain.
Empty / Prey / Predator encoded as a single `FLOAT` named attribute `state`
(0.0 / 1.0 / 2.0). Two independent Blur Attribute passes — one per population
mask — drive the Lotka-Volterra update rules inside a Simulation Zone.

## What this is

The classic Lotka-Volterra equations describe two interacting populations
whose abundances oscillate over time. The *spatial* version — where each cell
on a grid can be empty, prey, or predator, and transitions depend on the
state of its direct neighbours — produces something qualitatively richer:
rotating **spiral waves** that travel across the mesh surface indefinitely,
never settling and never exploding.

This tutorial implements that system entirely inside a Geometry Nodes
Simulation Zone, using the same Blur Attribute trick as the Game of Life
tutorial but extended to two concurrent Blur passes and three update outcomes.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full Blender 5.1 Python script — purges scene, builds grid, seeds state, wires GN tree, adds emission material |
| `record.py` | Renders frames 0–120 to `viewport.mp4` (EEVEE Next, 1920×1080, 30 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the `screen.mp4` walkthrough |
| `.expected-artefacts.json` | CI manifest of expected outputs |

## Quick start

```python
# In Blender's scripting workspace:
exec(open('blueprint.py').read())
```

## Update rules

| Current state | Condition | New state |
|--------------|-----------|-----------|
| Prey | No predator neighbour | Prey (survives) |
| Prey | ≥1 predator neighbour | Predator (predation) |
| Predator | ≥1 prey neighbour | Predator (fed) |
| Predator | 0 prey neighbours | Empty (starvation) |
| Empty | ≥1 prey neighbour | Prey (colonisation) |
| Empty | 0 prey neighbours | Empty (stays) |

## Outside sources

- Blender Foundation — [Simulation Zone manual](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html) (CC-BY-SA 4.0)
- mlankhorst — [rps-cellular](https://github.com/mlankhorst/rps-cellular) spatial Rock-Paper-Scissors (MIT)
- Khronos Group — [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) (Apache-2.0)

## Licence

CC0 — no rights reserved. Use freely.
