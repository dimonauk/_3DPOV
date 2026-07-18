# Python bpy.types.MeshDeformModifier — Cage Bind VRM Clothing, Volumetric Coordinate Basis & Deformation Bake for WebXR (Blender 5.1)

**Topic:** scripting | **Blender:** 5.1 | **Licence:** CC0

The MeshDeformModifier builds a volumetric trilinear-coordinate basis (voxel
grid) that maps every target vertex to a weighted combination of cage vertices.
Once bound, the cage drives the clothing with no separate rigging — shape keys,
pose bones, and cage edits all propagate automatically.  This blueprint creates
a low-poly torso cage, a tunic clothing mesh, binds them via the operator
context override pattern, then animates a waist-pinch shape key and bakes the
deformed cloth to a static GLB.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full headless Python script — run in Blender Script Editor |
| `record.py` | Viewport animation render → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_meshdeform_clothing.glb` | Deformed cloth baked at frame 30, Draco-compressed |

## Key Concepts

### Cage topology freedom
The Lattice modifier constrains the cage to a grid; MeshDeformModifier accepts
**any closed mesh**.  A hand-sculpted torso, a convex-hull body shell, or even
a lower-LOD VRM body can serve as the cage, giving artists full control over
how the influence field follows body contours.

### Volumetric binding: how it works
At bind time Blender voxelises the cage interior at `precision²³` resolution.
Each target vertex is located in the voxel grid, and the eight surrounding
cage vertices' weights are computed via trilinear interpolation.  The result
is stored as `mod.is_bound = True`.  After that, transforming a cage vertex
moves all target vertices that have non-zero weight for it.

### Precision trade-off
`mod.precision` (2–10) sets the voxel grid resolution per axis.  Precision 3 →
27 voxels (fast, blocky); precision 6 → 216 voxels (accurate, slower bind).
For character clothing, precision 5–6 balances fidelity and bind time.  Rebind
after changing precision.

### Binding requires UI operator context
`bpy.ops.object.meshdeform_bind()` is a context-dependent operator.  In
headless scripts it must be called inside `bpy.context.temp_override(object=…,
active_object=…)` with the target cloth object active.  Without this the
operator silently does nothing and `mod.is_bound` stays `False`.

### Cage enclosure is mandatory
Any target vertex **outside** the cage at bind time receives zero influence and
will not deform.  Always build the cage slightly larger than the clothing and
verify there are no open holes.  The blueprint scales the cloth to
`CLOTH_SCALE = 1.04` of the cage geometry so this condition is always met.

### Unbind and rebind
`is_bound` is a toggle.  Calling `bpy.ops.object.meshdeform_bind(modifier=…)`
again when already bound clears the bind data.  This is the correct way to
rebind after sculpting or reshaping the cage.  Do **not** delete and recreate
the modifier — the modifier slot position on the stack is preserved.

### Pre-export apply pattern
MeshDeformModifier has no GLB equivalent; the WebXR runtime cannot evaluate it.
Before export: duplicate the clothing object, call `new_from_object(eval_obj)`
to bake the evaluated geometry, strip the modifier, and export only the
duplicate.  The original `.blend` keeps the live modifier intact for iteration.

## Running

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → Run Script (allow ~15 s for voxel bind at precision 5)
3. Scrub timeline frames 1–60 to see the waist-pinch deformation
4. Open `record.py` → Run Script to render `viewport.mp4`

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `mod.is_bound` is `False` after script runs | Operator context not set | Verify `temp_override(object=cloth_obj, active_object=cloth_obj)` |
| Cloth verts not moving at waist | Cage doesn't enclose those verts | Increase cage radius or run a shrink check via `mathutils.BVHTree` |
| Cloth verts jumping at bind | Another modifier (e.g. Subsurf) runs after MeshDeform | Reorder: MeshDeform should be last, or apply Subsurf first |
| GLB export shows T-posed flat cloth | Export ran before apply | Confirm `new_from_object(evaluated_get(depsgraph))` is called at the correct frame |
| Bind takes >60 s | Precision too high for cage polygon count | Drop to precision=4 for quick iteration; use 6 only for final bake |
