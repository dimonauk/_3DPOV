# Array Modifier + Curve Deform — Procedural Chain / Rope Along Curve
**Blender 5.1 · CC0 · Holoflow Studio**

Two classic modifiers, one elegant pipeline: Array fills a guide path with
repeated segments; Curve bends the strip to follow any arbitrary Bezier.
The result updates live — reshape the path and the link count recalculates
automatically, with no manual counting or re-instancing.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene construction (chain or rope) + GLB export |
| `record.py` | OpenGL viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar recording guide |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
blender --background --python blueprint.py
```

Set `PRESET = "ROPE"` (line 47) for the rope variant before running.

## Key concepts

- **Array Fit Curve** — counts copies dynamically from curve arc-length.
- **Constant Offset X** — slides copies end-to-end along the travel axis.
- **Object Offset (rope)** — rotates each copy by 15° for cumulative twist.
- **Curve Deform +X axis** — bends the tiled strip around the guide path.
- **export_apply = True** — bakes modifiers to static mesh before GLB write.

## Outside sources

- [Blender Manual — Array Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/array.html)
  CC-BY-SA 4.0, Blender Documentation Team
- [Blender Manual — Curve Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/curve.html)
  CC-BY-SA 4.0, Blender Documentation Team
- [njanakiev/blender-scripting](https://github.com/njanakiev/blender-scripting)
  MIT, Nicolas Janakiev

## Studio cross-references

- `/tutorials/blender-tutorial-armature-spline-ik-tentacle` — Spline IK
  is the rigging counterpart to Curve Deform: bones follow curves instead
  of mesh vertices.
- `/tutorials/blender-tutorial-gn-curve-to-mesh` — Geometry Nodes'
  Curve-to-Mesh node provides a node-graph version of this modifier workflow.
- `/tutorials/blender-tutorial-gn-fillet-curve-neon-sign` — Fillet Curve
  node rounds corners on the guide path, useful for chain loops.
- `/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear` —
  Edge Wear shader pairs well with the chain material.
