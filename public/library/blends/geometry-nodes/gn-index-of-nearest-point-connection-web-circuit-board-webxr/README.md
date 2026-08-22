# GN Index of Nearest — 1-NN Circuit Board Panel

**Blender 5.1 · Geometry Nodes · CC0**

Demonstrates `GeometryNodeIndexOfNearest` — the spatial KNN field node
that returns the index of the nearest element within the same geometry.

## What this produces

A 2 × 2 m flat panel covered in ~640 scattered point-nodes connected by
thin emission-green tubes representing the **1-Nearest-Neighbour graph**:
each point is connected to its single nearest neighbour. ICO sphere pads
sit at each point. The whole assembly exports as a single GLB ready for a
WebXR environment, interior or circuit-board prop.

## How to run

```sh
blender --background --python blueprint.py
```

Output: `output/circuit_board_panel.glb`

To record a viewport animation, run `record.py` **after** `blueprint.py`
from the Blender Text Editor (Alt+P). Output: `videos/…/viewport.mp4`.

## Key technique: unit-line instancing

```
unit_line (0,0,0)→(1,0,0)
  ↓ Instance on Points
    rotation = Align Euler to Vector(normalize(nn_pos - pos))
    scale    = CombineXYZ(length(nn_pos - pos), 1, 1)
  ↓ Realize Instances
```

After realising, each instance is a correctly directed edge from
the scatter point to its nearest neighbour.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Expert bpy script — builds scene + GN tree + exports GLB |
| `record.py` | Viewport animation render (density growth, 60 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture instructions |
| `.expected-artefacts.json` | CI artefact manifest + cross-reference registry |

## Licence

Blueprint authored under CC0. Technique derives from Blender Foundation
documentation (CC0). See `.expected-artefacts.json` for full attribution.
