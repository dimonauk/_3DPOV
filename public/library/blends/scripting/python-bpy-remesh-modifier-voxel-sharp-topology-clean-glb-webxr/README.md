# RemeshModifier — VOXEL + SHARP Modes, Topology-Clean Pipeline

**Blender 5.1 | CC0 | Holoflow Studio**

Reconstructs a clean, uniform mesh from an organic or irregular source
using `bpy.types.RemeshModifier`. Demonstrates the VOXEL (OpenVDB SDF)
and SHARP (dual-contouring) modes that are most relevant to the studio's
faceted, WebXR-ready pipeline.

## What this entry produces

| File | How |
|------|-----|
| `hf_remesh_blob_src` in scene | noisy icosphere + VOXEL modifier (live) |
| `hf_remesh_blob.glb` | SHARP-remeshed faceted blob, Draco compressed |
| `viewport.mp4` | 90-frame render: voxel_size animation + 360° spin |
| `screen.mp4` | OBS recording of the full interactive workflow |

## Quick start

```bash
blender --background --python blueprint.py
```

Produces `hf_remesh_blob.glb` beside the script. Open the `.blend` that
the script saves to see both the VOXEL preview object and SHARP export
object side-by-side.

## Key API facts (Blender 5.1)

```python
rem = ob.modifiers.new("Remesh", 'REMESH')

rem.mode             = 'VOXEL'   # BLOCKS | SMOOTH | SHARP | VOXEL
rem.voxel_size       = 0.048     # metres (VOXEL only; keep >= 0.025)
rem.adaptivity       = 0.14      # flatten regions (VOXEL only; 0–1)
rem.use_smooth_shade = True       # smooth normals on VOXEL output

rem.mode             = 'SHARP'   # switch for dual-contouring mode
rem.octree_depth     = 5         # 2^5 = 32 cells per axis (SHARP/SMOOTH/BLOCKS)
rem.scale            = 0.90      # fit margin (0.5–0.99)
rem.use_smooth_shade = False      # flat faces for studio faceted look
rem.use_remove_disconnected = True
rem.threshold        = 1.0       # drop islands < this volume fraction
```

## Related studio tutorials

- [Boolean + Weld Modifier](/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr) — remesh cleans boolean residue
- [SubsurfModifier](/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr) — SubD as the alternative path
- [bmesh limited_dissolve + poke](/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr) — bmesh-native faceting
- [Metaball + Remesh pipeline](/tutorials/blender-tutorial-python-metaball-blob-chain-remesh-webxr) — metaball → remesh workflow

## Licence

CC0 — place in the public domain. Attribution appreciated but not required.
