# CorrectiveSmoothModifier — VRM Elbow Artefact Correction

**Blender 5.1 · Licence: CC0**

Demonstrates `bpy.types.CorrectiveSmoothModifier` — a post-armature deform modifier
that fills in the volume-loss crease at bent joints without corrective shape keys.

## What this builds

A stylised arm tube (shoulder → elbow → wrist) weighted to a 2-bone armature.
The elbow is posed to 90° to expose the linear-blend-skinning crease artefact.
CorrectiveSmoothModifier with `smooth_type=LENGTH_WEIGHTED`, `rest_source=ORCO`,
`iterations=3` is stacked after ArmatureModifier to restore the joint volume.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build + modifier stack + GLB export |
| `record.py` | Viewport render of 0°→90° bend animation |
| `SCREEN-RECORDING-NOTES.md` | OBS screen-capture instructions |

## How to run

```bash
blender --background --python blueprint.py
# Then record the bend animation:
blender --background hf_corrective_smooth_arm.blend --python record.py
```

## Outputs

- `public/library/glbs/scripting/hf_corrective_smooth_arm.glb` — Draco-6, WebP, Y-up
- `public/library/videos/scripting/python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr/viewport.mp4` — 60 frames, 1280×720, 30fps

## Key technique

`CorrectiveSmoothModifier` computes `delta = smooth(rest) − rest` and adds it to the
deformed output. At the elbow crease, the smooth inflates the tube slightly, and that
inflation counteracts the armature's volume-loss — net result: a round elbow cross-section
under deformation without any shape-key overhead.
