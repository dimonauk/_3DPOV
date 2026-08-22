# BVH Motion Capture → VRM Bone Remap → NLA Bake

**Blender 5.1 · Python scripting · Rigging / Animation**

Retargets CMU-format BVH motion capture data (dancer, poi performer, acrobat)
onto a VRM-ready armature using LOCAL/LOCAL COPY_ROTATION constraints, bakes
the result to an NLA strip, and exports an animated GLB for WebXR.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Production retarget script: import BVH → apply constraints → bake → export GLB |
| `record.py` | Self-contained viewport render: synthetic two-armature scene showing live constraint-driven retargeting |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the screen-capture walkthrough video |

## Quick start

1. Open your VRM armature `.blend` file in Blender 5.1.
2. Edit `BVH_PATH` and `VRM_OBJ_NAME` at the top of `blueprint.py`.
3. Scripting workspace → Open `blueprint.py` → Run Script.
4. Find `hf_retarget_dancer.glb` next to your `.blend` file.

## Free BVH data sources

- **CMU Graphics Lab Motion Capture Database** (Public Domain)
  http://mocap.cs.cmu.edu/
  Download subject folders (e.g. 05_dance.bvh) as individual `.bvh` files.
  Use `global_scale=0.01` at import (data is in centimetres).

- **Mixamo** free BVH export (for Blender)
  https://www.mixamo.com/ — sign in, choose animation, Download → Format BVH
  Use `global_scale=1.0` (data is in metres) and remap Mixamo bone names.

## Bone name remap

The `CMU_TO_VRM` dict maps standard CMU names to VRM-for-Blender addon names.
If your BVH uses different names (Mixamo, BioVision, custom):
- Print `list(src_obj.pose.bones.keys())` after import to see the actual names.
- Update the dictionary keys accordingly.

## Expected artefacts

```
hf_retarget_dancer.glb   — animated VRM armature, NLA "dance_retarget" clip
viewport.mp4             — synthetic retarget demo render (record.py output)
screen.mp4               — OBS capture of the live Blender session
```
