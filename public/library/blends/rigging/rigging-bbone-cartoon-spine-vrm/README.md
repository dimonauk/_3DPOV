# B-Bones Cartoon Spine — Blender 5.1

**Slug**: `rigging-bbone-cartoon-spine-vrm`  
**Topic**: rigging  
**Blender**: 5.1  
**Licence**: CC0  
**Tutorial**: `/tutorials/blender-tutorial-rigging-bbone-cartoon-spine-vrm`

## What this builds

A six-bone cartoon spine with Bendy Bones (`bbone_segments = 4`) and TANGENT
handle bones at root and tip, skinned to a 16-side tapered cylindrical torso
via Automatic Weights.  The rig demonstrates 'C' and 'S' curve bends with
smooth mesh deformation — the foundation of any cartoon character spine in
Blender, and directly applicable to VRM character rigs.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the rig, torso mesh, toon material, and Automatic Weights skinning |
| `record.py` | Animates four poses and renders a 120-frame OpenGL viewport recording |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-capture video |
| `.expected-artefacts.json` | Expected output file list |

## Key parameters

| Name | Default | Notes |
|---|---|---|
| `SPINE_BONES` | 6 | Number of deform spine bones |
| `BBONE_SEGS` | 4 | Sub-segments per bone — controls GLB export bone count |
| `TORSO_LOOPS` | 24 | Edge loops (= SPINE_BONES × BBONE_SEGS for 1 : 1 ratio) |
| `HANDLE_LEN` | 0.14 m | Visual length of the TANGENT handle bones |

## GLB export note

`SPINE_BONES × BBONE_SEGS = 24` standard linear bones are written to the glTF
armature.  Most glTF runtimes (three.js, Babylon.js, VRM viewer) cap at 256
bones per skin, so the 24-bone bake is well within budget even alongside limb
bones.  Enable **Armature → Export Deformation Bones Only** to exclude the
non-deforming handle bones from the export.
