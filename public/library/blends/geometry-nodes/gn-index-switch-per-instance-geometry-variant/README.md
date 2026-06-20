# GN Index Switch — Per-Instance Geometry Variation

**Topic**: Geometry Nodes — Index Switch  
**Blender version**: 5.1  
**Licence**: CC0  
**Difficulty**: intermediate  
**Estimated time**: 45–90 min

---

## What this builds

A procedural colonnade of 40 columns scattered across a flat ground plane,
where each column is one of four distinct geometry variants (plain cylinder,
hexagonal pillar, tapered frustum, stepped box) chosen per-instance by an
integer field flowing through the **Index Switch** node.

A proximity override forces the nearest columns to always use the grandest
variant (plain cylinder, index 0), demonstrating how spatial logic and random
variation can coexist in a single field expression.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — run in Blender's Script editor to build the scene |
| `record.py` | Viewport animation recorder — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |
| `colonnade_index_switch.blend` | Generated .blend (after running blueprint.py) |
| `colonnade_index_switch.glb` | Draco-6 GLB export (after running blueprint.py) |

---

## Running the blueprint

1. Open Blender 5.1.
2. Switch workspace to **Scripting**.
3. Click **Open** and select `blueprint.py`.
4. Press **Run Script** (or `Alt + P`).
5. The script creates the scene, builds the GN modifier, saves the .blend,
   and exports `colonnade_index_switch.glb` — all relative to the script's
   directory.

---

## Key concepts

- **Index Switch vs Menu Switch**: Menu Switch is a *global* enum evaluated
  once per modifier evaluation.  Index Switch evaluates as an *integer field*,
  meaning each instance (point, vertex, face) can resolve to a different input.

- **Per-instance seeding**: `FunctionNodeRandomValue` with `data_type = INT`
  produces a unique integer per instance when its `ID` socket is driven by the
  `Index` node.  This is the canonical Blender 5.x pattern for per-element
  random variation.

- **Proximity override**: `LESS_THAN(distance_from_origin, centre_radius)`
  produces a 0/1 boolean field.  Multiplying the random index by its inverse
  `(1 − near)` zeroes out the random variation for near-centre points without
  any branch node or If block.

---

## Outside sources

- **Blender Manual — Index Switch Node**  
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/switch/index_switch.html  
  Licence: CC-BY-SA 4.0 (documentation only; scripts are CC0)

- **Blender Manual — Random Value Node**  
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/random_value.html  
  Licence: CC-BY-SA 4.0

---

## Tutorial page

`/tutorials/blender-tutorial-gn-index-switch-per-instance-geometry-variant`
