# Python Object Constraint Stack — TRACK_TO + FLOOR + Manual Bake for WebXR

**Blender version:** 5.1  
**Topic:** `bpy.types.ObjectConstraint` — constraint.new(), evaluated_get(depsgraph), manual bake loop  
**Output:** `constraint_baked.glb` — sphere with baked look-at + floor-contact animation

## What This Does

Scripts the full constraint pipeline in Blender 5.1:

1. Creates a sphere (head) and a circling Empty (target) using FCurves via the data API.
2. Adds a `TRACK_TO` constraint so the sphere always faces the target.
3. Adds a `FLOOR` constraint so the sphere rests on a ground plane.
4. Bakes the constraint stack to keyframes using a manual frame-stepping loop
   (`evaluated_get(depsgraph)` → decompose → `keyframe_insert`) — context-free,
   works headlessly and from the Script Editor.
5. Clears constraints and exports a clean GLB with only keyframe data.

## Key Concepts

- **`obj.constraints.new(type)`** — allocates a constraint block; no UI context needed.
- **Constraint stack order** — index 0 evaluates first; TRACK_TO before FLOOR is correct.
- **`bpy.context.view_layer.update()`** — forces depsgraph re-evaluation per frame.
- **`obj.evaluated_get(depsgraph)`** — returns the evaluated (post-constraint) object;
  the source object itself always holds only the raw authored values.
- **`obj.constraints.clear()`** — strips all constraints after bake.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full pipeline: scene build → constraints → bake → GLB export |
| `record.py` | Adds camera + materials, renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact checklist |

## Cross-References

- [PoseBone IK Bake for VRM](/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm) — same depsgraph bake pattern applied to armature bones
- [FCurve Keyframe Authoring](/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable) — FCurve data API used in step 4 above for the target path
- [NLA Track & Strip Action Library](/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend) — pushing baked actions into NLA for multi-clip VRM export

## Outside Sources

- Blender Foundation · `bpy.types.Constraint` API Reference · CC-BY-SA 4.0
  <https://docs.blender.org/api/5.1/bpy.types.Constraint.html>
- Nikolai Janakiev · `blender-scripting` · MIT
  <https://github.com/njanakiev/blender-scripting>
