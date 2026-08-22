# Python bpy.types.MetaBall — Implicit Blob Chain: Organic Shape Blocking → Voxel Remesh → GLB for WebXR

**Blender 5.1 · Holoflow Studio · Licence: CC0**

## What this is

A production blueprint for building organic blob forms entirely in Python via
`bpy.data.metaballs.new()`. Three MetaBall objects sharing the `BlobChain`
family prefix merge automatically into one isosurface — body chain, head, and
tail capsule become a single unified creature silhouette without any boolean or
manual sculpt work. After `bpy.ops.object.convert(target='MESH')`, a Voxel
Remesh modifier produces clean all-quad topology at 0.05 m edge length; a
Decimate modifier brings poly count to the WebXR LOD0 budget.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full production script — run in Blender Scripting workspace |
| `record.py` | Viewport render animation (orbiting camera, 4 s, 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Library manifest entry |

## Quick start

1. Open Blender 5.1 → New General file
2. Switch to the Scripting workspace
3. Open `blueprint.py` in the text editor
4. Press **Run Script**
5. Switch to Layout workspace — the blob creature appears
6. `blob_chain.glb` is written next to the .blend file

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `CHAIN_SEGMENTS` | 6 | Number of BALL elements in the body chain |
| `RADIUS_MID` | 0.30 | Maximum radius at chain midpoint (m) |
| `THRESHOLD` | 0.60 | Iso value — lower → puffier, higher → tighter |
| `RESOLUTION_VIEW` | 0.08 | Viewport tessellation resolution (m) |
| `VOXEL_SIZE` | 0.05 | Remesh edge length — drives final poly density |
| `DECIMATE_RATIO` | 0.40 | Decimate collapse ratio for GLB export |
| `FAMILY` | `"BlobChain"` | Shared prefix — all .* objects merge |

## Outside sources

- **Blender Foundation — bpy.types.MetaBall API** (CC-BY-SA-4.0)
  https://docs.blender.org/api/5.1/bpy.types.MetaBall.html
- **Blender Manual — Meta Objects** (CC-BY-SA-4.0)
  https://docs.blender.org/manual/en/latest/modeling/metas/introduction.html

## Studio cross-references

- `/tutorials/blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr`
- `/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export`
- `/tutorials/blender-tutorial-python-armature-edit-bones-vrm-spine-chain`
- `/tutorials/blender-tutorial-gn-mesh-to-volume-sdf-blob-fusion`
