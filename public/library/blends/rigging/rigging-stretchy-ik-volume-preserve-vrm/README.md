# Stretchy IK + Volume Preservation for VRM Elastic Limbs

**Blender 5.1 · Rigging · CC0**

Demonstrates how to combine Blender's built-in `ik_stretch` per-bone setting
with scripted drivers to preserve volume as an IK chain extends beyond its
natural reach — producing cartoon-elastic limbs that don't thin like rubber tubes.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Production script — builds the rig, drivers, mesh, animation, and exports GLB |
| `record.py` | Standalone render script — outputs `viewport.mp4` (60 frames at 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |

## Outputs (run blueprint.py)

- `stretchy_ik_vrm.glb` — GLB with 3-bone arm, skin weights, 60-frame stretch animation
- `stretchy_ik_vrm.blend` — save the .blend after running the script

## Key technique

```
X_scale = Z_scale = Y_scale ^ (-0.5)
```

Derived from X·Y·Z = 1 (conservation of volume).  Blended with a custom
`volume_preserve` property so animators can choose between full compensation
(rubberhose) and natural thinning (realistic stretch).

## Blender 5.1 compatibility notes

- `PoseBone.ik_stretch` is available since Blender 2.8; value range [0, 1].
- `IKConstraint.use_stretch` must be `True` for per-bone stretch to fire.
- `export_force_sampling=True` in the glTF exporter bakes all drivers into
  per-frame keyframes so the volume drivers export correctly to glTF TRS data.
- Three.js / WebXR reads bone scale from glTF tracks — no runtime shader needed.

## Tutorial

`/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm`
