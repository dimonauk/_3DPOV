# GN Foreach Element Zone — Per-Face Stone Chisel: Irregular Ashlar Wall

**Topic:** Geometry Nodes · Foreach Geometry Element Zone  
**Blender version:** 5.1 (zone introduced in 4.3)  
**Licence:** CC0  
**Category:** geometry-nodes  
**Slug:** `gn-foreach-element-zone-stone-chisel-wall`

## What this builds

A parametric ashlar stone wall (8 × 6 = 48 stones) where every block has a
unique depth recess and XY size determined by a per-face random seed.  The
Foreach Element Zone iterates one face at a time and outputs a distinct Mesh
Box per iteration; all 48 boxes are joined into a single wall mesh, exported
as `ashlar_wall.glb` (Draco 6, Y-up) for WebXR environments.

## Key concepts

- **Foreach Geometry Element Zone** — iterates over geometry elements (here
  faces) and collects one geometry output per iteration into a joined mesh.
  Unlike field-based GN, each iteration can produce a structurally different
  mesh (different polygon count, topology, size).
- **Capture Attribute (FACE domain)** — freezes Position evaluated at face
  centroids so the zone can read them with Sample Index without domain errors.
- **Sample Index** — reads a field at an explicit element index; the only
  reliable way to address a specific element's data inside the zone body.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Python/GN build script (run in Blender scripting editor) |
| `record.py` | Viewport animation render — 90 frames, camera arc, Seed animation |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Running

```bash
blender --background --python blueprint.py
# Outputs: output/ashlar_wall.blend  output/ashlar_wall.glb

blender --background output/ashlar_wall.blend --python record.py
# Outputs: ../../videos/.../viewport.mp4
```

## Parameters

| Constant | Default | Effect |
|---|---|---|
| `GRID_X` | 8 | Horizontal stone count |
| `GRID_Y` | 6 | Vertical course count |
| `STONE_W` | 0.30 m | Stone slot width |
| `STONE_H` | 0.18 m | Stone slot height |
| `MORTAR_GAP` | 0.012 m | Mortar joint width |
| `DEPTH_DEF` | 0.06 m | Default max depth variance |
| `JITTER_DEF` | 0.010 m | Default max XY size jitter |

## Tutorial

Full tutorial with step-by-step bench instructions:  
https://holoflow.co.uk/tutorials/blender-tutorial-gn-foreach-element-zone-stone-chisel-wall

## Related

- Simulation Zone (sibling zone type): `/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing`
- Capture Attribute deep-dive: `/tutorials/blender-tutorial-gn-capture-attribute-position-snapshot-stable-voronoi`
- Tiled module welding: `/tutorials/blender-tutorial-gn-merge-by-distance-weld-tiled-module`
