# Skin + Voxel Remesh — Low-Poly Character Blocking

**Blender 5.1 | Holoflow Studio Library | CC0-1.0**

Build a humanoid character proxy in ~30 seconds of script execution. The
pipeline: edge skeleton → **Skin modifier** (quad tubes per edge) →
**Voxel Remesh** (OpenVDB isosurface) → **Decimate Planar** (flat-faceted
low-poly reduction) → GLB export for WebXR / VRM rigging.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build + GLB export. Run in Blender Scripting workspace. |
| `record.py` | Turntable animation render to `viewport.mp4`. Run after blueprint.py. |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the tutorial screen recording. |
| `character_block.blend` | Saved scene (created by blueprint.py, check in after running). |
| `character_block.glb` | Exported GLB with Draco compression, +Y up. |

## How to run

1. Open Blender 5.1.
2. **Scripting workspace → Text → Open** → `blueprint.py`.
3. Press **Run Script** (or `Alt+P`).
4. Save the result: **File → Save As** → `character_block.blend`.
5. For the turntable render, open `record.py` and run it.

## Parameters to tweak

| Constant | Default | Effect |
|---|---|---|
| `VOXEL_SIZE` | 0.055 | Lower = more polys and detail, slower |
| `DECIMATE_ANG` | 5° | Higher = more aggressive polygon reduction |
| `HEAD_RAD` | 0.19 m | Head cross-section radius |
| `TRUNK_RAD` | 0.16 m | Torso / pelvis radius |
| `LIMB_RAD` | 0.09 m | Arm / leg radius (scales down towards extremities) |

## Output

- `character_block.glb` — ~1 500–3 000 faces depending on VOXEL_SIZE
- `public/library/videos/modifiers/modifier-skin-remesh-character-blocking/viewport.mp4` — 10 s turntable

## Related tutorials

- [Retopology: PolyBuild + Shrinkwrap](/tutorials/blender-tutorial-retopology-polybuild-shrinkwrap) — clean the blocked mesh
- [Rigging: Stretchy IK for VRM](/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm) — rig the proxy
- [Modifier Decimate: LOD Meshes](/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse) — further poly reduction
- [Sculpt: Dyntopo + Voxel Remesh](/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh) — organic sculpt detail after blocking

## External sources

- [Blender Manual — Skin Modifier](https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/skin.html) (CC-BY-SA-4.0, Blender Foundation)
- [VRM Specification](https://github.com/vrm-c/vrm-specification) (MIT, VRM Consortium) — morph target and bone naming conventions for the exported character
