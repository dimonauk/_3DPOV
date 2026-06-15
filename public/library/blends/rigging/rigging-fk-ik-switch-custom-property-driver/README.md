# FK/IK Switch — Custom Property + Drivers (Blender 5.1)

A three-bone arm armature with a single float slider (`fk_ik` on the armature
data block) that drives an IK constraint's `influence` from 0.0 (pure FK) to
1.0 (pure IK) via a `SINGLE_PROP` driver. The switch is fully keyframeable.

## Quick start

```
Scripting workspace → open blueprint.py → Run Script
```

The arm appears in the viewport. Slide `N-panel ▸ Item ▸ fk_ik` from 0 to 1
to switch modes live.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds armature, custom property, driver, IK constraint |
| `record.py` | Renders 90-frame viewport animation (FK bend → IK follow) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Key technique

```
arm_data["fk_ik"]  →  SINGLE_PROP driver  →  IK_Limb.influence
```

`id_type = "ARMATURE"`, `id = arm_data`, `data_path = '["fk_ik"]'`.
Targeting the *armature data block* (not the object) means the driver
survives object renames and NLA re-evaluation.

## Expected artefacts

- `fk_ik_arm.blend` (save manually after blueprint.py)
- `public/library/videos/rigging/rigging-fk-ik-switch-custom-property-driver/viewport.mp4`
- `public/library/videos/rigging/rigging-fk-ik-switch-custom-property-driver/screen.mp4`

## Tutorial

`/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver`
