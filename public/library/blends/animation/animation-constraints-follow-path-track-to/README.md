# Orbital Camera Constraint Rig — Follow Path + Track To + Damped Track

**Blender 5.1 | CC0 | Holoflow Studio**

## What this is

A fully procedural orbital camera rig built from three stacked object constraints:

| Constraint | Object | Role |
|---|---|---|
| Follow Path | OrbitalCam | Position along Bezier orbit |
| Track To | OrbitalCam | Rotation toward look-at target |
| Damped Track | EyeCone | Roll-free gaze tracking (eye proxy) |

A single animated float — `offset_factor` on the Follow Path constraint — drives
the entire orbit. Reshape the Bezier path and the camera follows automatically.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy scene builder |
| `record.py` | Viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions |
| `.expected-artefacts.json` | CI manifest |

## Usage

```bash
blender --python blueprint.py
# Save as orbital_cam_rig.blend
blender orbital_cam_rig.blend --python record.py
```

## Key concepts

- **Constraint stacking order** — Follow Path before Track To; the latter wins on rotation.
- **Damped Track vs Track To** — Damped Track has no up-axis enforcement, avoiding gimbal flips.
- **offset_factor LINEAR** — constant angular velocity requires linear keyframe interpolation.
- **Bake for export** — `Object ▸ Animation ▸ Bake Action` converts to explicit keyframes for glTF.

## Tutorial

`/tutorials/blender-tutorial-animation-constraints-follow-path-track-to`
