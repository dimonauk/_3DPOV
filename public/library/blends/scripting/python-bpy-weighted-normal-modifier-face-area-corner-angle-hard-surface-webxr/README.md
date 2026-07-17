# WeightedNormalModifier — Face-Area, Corner-Angle & Face-With-Angle Modes
## Hard-Surface Console-Lid Prop · Blender 5.1 · CC0

**Technique:** `bpy.types.WeightedNormalModifier` rewrites the custom normal
field on the evaluated mesh so each vertex normal is a weighted blend of its
adjacent face normals. Three modes control the weight function:

| Mode | Weight source | Best for |
|------|---------------|----------|
| `FACE_AREA` | proportional to face area | large flat slab + small bevel strips |
| `CORNER_ANGLE` | angle subtended at vertex | panels with varied incident angles |
| `FACE_WITH_ANGLE` | area × angle (product) | maximum bevel-strip suppression |

On a chamfered hard-surface prop standard normal averaging produces a visible
shading gradient across every bevel strip. WeightedNormal eliminates that
gradient so structural flat zones read as perfectly flat while edges stay crisp.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build the console lid, apply Bevel + WeightedNormal, export GLB |
| `record.py` | OpenGL viewport animation, outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_weighted_console_lid.blend` | Saved scene with all three mode variants |
| `hf_weighted_console_lid.glb` | FACE_AREA variant, Draco-compressed |

## How to Run

```bash
blender --background --python blueprint.py
```

Or open Blender, paste `blueprint.py` into the Text Editor, press **Run Script**.

## Critical Stack Order

Bevel modifier must appear BEFORE WeightedNormal in the modifier list.
WeightedNormal reads the evaluated geometry — if it runs before Bevel it sees
only the pre-chamfer mesh and cannot recalculate bevel-strip normals.

```
# Correct order (top → bottom in modifier stack)
Bevel          ← generates the chamfer geometry
WeightedNormal ← recalculates normals on that geometry
```

## GLB Export

`export_normals=True` (default) writes the WeightedNormal result into the
`NORMAL` accessor in the GLB. Three.js reads it verbatim — no recomputation.
`export_apply=True` ensures the depsgraph evaluates the full modifier stack.

## Licence

All files in this directory are released under CC0 (public domain).
See [https://creativecommons.org/publicdomain/zero/1.0/](https://creativecommons.org/publicdomain/zero/1.0/)
