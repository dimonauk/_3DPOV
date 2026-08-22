# ArrayModifier — Object-Offset Radial Crown & Helix Stack

**Blender 5.1 | CC0 | scripting**

`bpy.types.ArrayModifier` tiles a source mesh along an accumulating transform
chain. This tutorial focuses on the `use_object_offset` mode — the one most
commonly misused — to build two patterns a WebXR prop artist needs repeatedly:
a radial crown (N-fold symmetry around Z) and a rising helix bead chain.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Production Python script — run in Blender's Scripting workspace |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Output artefacts

- `hf_array_crown_helix.glb` — merged GLB, Draco level 6
- `viewport.mp4` — 6-second turntable render
- `screen.mp4` — annotated screen recording

## Blender version

5.1 — uses `bpy.data.meshes.new_from_object(ev, depsgraph=dg)` (Blender 4.0+
API for evaluated snapshot; replaces the deprecated `to_mesh()` assign pattern).

## Key concepts

### Why `use_relative_offset = False` is mandatory for radial arrays

ArrayModifier adds the active offset types together. If `use_relative_offset`
is left on (the default), Blender also adds one bounding-box stride per step.
For a rotation-only radial pattern this shifts every copy radially outward,
breaking the ring. Disable it explicitly before enabling `use_object_offset`.

### Object-offset transform formula

The per-step matrix is:
```
T_step = inv(T_src_world) @ T_empty_world
```
If the Empty is at the source object's world origin with only Z-rotation,
the translation component cancels: you get pure rotation around that point.

### Helix from radial

Add a Z-translation to the offset Empty. The modifier accumulates both
rotation and translation per step, producing a spiral path without any
curve object.

## Cross-references

- [Bezier Spline Camera Rail](/tutorials/blender-tutorial-python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr) — FIT_CURVE mode arrays populate a curve's arc length; the curve itself is authored there.
- [BooleanModifier + WeldModifier](/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr) — same `modifier_apply` + depsgraph snapshot pipeline.
- [Faceted Ornament (limited_dissolve + poke)](/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr) — the crown gem shape is a sibling of the ornament faceting workflow there.

## Licence

CC0 1.0 Universal. Attribution appreciated but not required.
