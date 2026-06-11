# GN Compose Matrix: Procedural Iris Fold (N-Petal Fan)
**Blender 5.1 · CC0 · Holoflow Studio**

## What this is
A Geometry Nodes modifier that folds N flat rectangular panels around a shared
central hinge, creating an iris/lotus-flower close animation.  Each panel's
transform is computed as `M_i = M_azim × M_fold` using the Blender 4.3+ matrix
socket nodes: `Compose Matrix`, `Multiply Matrices`, and `Set Instance Transform`.

## Key nodes
| Node | Purpose |
|------|---------|
| `FunctionNodeAxisAngleToRotation` | Axis + angle → Rotation socket |
| `GeometryNodeComposeMatrix` | TRS → 4×4 matrix |
| `GeometryNodeMultiplyMatrices` | Compose two matrices (M_azim × M_fold) |
| `GeometryNodeSetInstanceTransform` | Apply per-instance 4×4 transform |

## Files
| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy script — builds `iris_fold.blend` + exports `iris_fold.glb` |
| `record.py` | Viewport renderer — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Running
```sh
# Step 1: build the blend + GLB
blender --background --python blueprint.py

# Step 2: render viewport animation
blender iris_fold.blend --background --python record.py
```

## Parameters
Edit the constants at the top of `blueprint.py`:

| Constant | Default | Effect |
|----------|---------|--------|
| `N_PANELS` | 8 | Number of petals (try 6, 12, 16) |
| `PANEL_W` | 0.06 m | Panel width |
| `PANEL_L` | 0.50 m | Panel length (root → tip) |
| `FOLD_END` | π/2 | Final fold angle (π = folds flat back underneath) |

## Licence
All code in this directory is released as **CC0** (public domain).
Outside references: Blender Manual (CC-BY-SA 4.0), glTF spec (Apache-2.0).
