# Armature — Bone Collections + Custom Bone Shapes
**Blender 5.1 · CC0 · Holoflow Studio**

## What this entry builds

A biped upper-body control rig shell with:
- Seven named bone collections replacing the legacy 32-layer bitmask (Root /
  Spine FK / Head / Arm FK.L / Arm IK.L / Arm FK.R / Arm IK.R)
- Three custom mesh shapes assigned to control bones: a ring for the root,
  a circle for IK wrist targets, a diamond for pole vectors
- GLB skeleton export compatible with VRM tooling and `three.js SkeletonHelper`

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the rig, collections, and custom shapes in Blender |
| `record.py` | Renders a 240-frame viewport orbit + arm-raise animation |
| `armature_control_rig.blend` | Saved blend (produced by blueprint.py → File → Save) |
| `armature_control_rig.glb` | Skeleton GLB (produced by blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 tutorial video |

## Running

1. Open Blender 5.1.
2. Open the Scripting workspace.
3. Load and run `blueprint.py` — the rig appears in the scene.
4. File → Save As → `armature_control_rig.blend` into this folder.
5. Load and run `record.py` — renders `viewport.mp4` into the videos folder.

## Key API note

`armature.collections` was introduced in **Blender 4.0** alongside the deprecation of
`bone.layers`.  Files saved in Blender 3.x will auto-migrate layer bitmasks to
unnamed collections when opened in 4.x+; rename them with `col.name = "Spine FK"`.

## Licence

All content in this folder is released under CC0 1.0 Universal.
Original sources credited in `blueprint.py` header.
