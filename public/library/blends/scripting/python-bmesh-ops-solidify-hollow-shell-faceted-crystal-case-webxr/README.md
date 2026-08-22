# Python bmesh.ops.solidify — Hollow-Shell Extrusion: Faceted Crystal Relic Case (Blender 5.1)

`bmesh.ops.solidify` turns a surface of faces into a hollow shell by offsetting each face along its local normal and bridging the boundary edges with rim quads. The result dictionary carries a `geom` field containing every newly created element — verts, edges, and faces of the inner shell — giving you a deterministic handle to set material indices without any reliance on vertex normals or Z-depth comparisons.

## What this tutorial covers

- `bmesh.ops.solidify(bm, geom, thickness)` — signature, semantics, return value
- Why `thickness > 0` offsets inward on a convex mesh (and when to use negatives)
- Filtering `result['geom']` by `isinstance(e, bmesh.types.BMFace)` to tag inner faces
- The open-top bowl pattern: `bisect_plane(clear_outer=True)` → `solidify` → visible wall rim
- Two-material-slot GLB export with flat shading for the studio's faceted aesthetic
- Comparison with `bpy.types.SolidifyModifier` (even-thickness, complex mode, rim fill)

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Production script — creates the hollow relic case and exports `hf_relic_case.glb` |
| `record.py` | Viewport animation — orbiting camera render for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-capture walkthrough |
| `.expected-artefacts.json` | Manifest of expected output files and cross-references |

## Running

1. Open Blender 5.1. Go to **Scripting** workspace.
2. Open `blueprint.py`. Run (Alt+P). Inspect the hollow urn in the 3D viewport.
3. Run `record.py` to render the orbiting `viewport.mp4`.

## Output geometry (approximate)

- icosahedron (subdiv=1): 20 input faces, 12 input verts
- After Z-scale + bisect top: ~14 remaining faces
- After solidify: ~14 outer faces + ~14 inner faces + ~12 rim quads = ~40 total faces
- Two material slots: `hf_crystal_outer` (index 0) · `hf_crystal_inner` (index 1)

## Licence

CC0 — place in the public domain. No attribution required.

## Outside sources

- **Blender 5.1 Python API — bmesh.ops reference**  
  <https://docs.blender.org/api/5.1/bmesh.ops.html>  
  © Blender Foundation — CC-BY-SA 4.0 (documentation text, reference only).  
  Related: <https://projects.blender.org/blender/blender>

- **KhronosGroup/glTF specification**  
  <https://github.com/KhronosGroup/glTF>  
  © The Khronos Group — Apache-2.0.  
  Related: <https://github.com/KhronosGroup/glTF-Sample-Models>
