# bmesh.ops.bisect_plane — Cross-Section, Cutaway & Symmetry Seal

**Blender version**: 5.1  
**Licence**: CC0  
**Topic**: scripting / bmesh  
**Tutorial**: [/tutorials/blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr](/tutorials/blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr)

## What this entry covers

`bmesh.ops.bisect_plane` cuts any BMesh with a mathematical plane (defined by
a point and a unit normal) and optionally removes the geometry on one or both
sides.  The operator returns a `geom_cut` dict key containing only the new
verts and edges at the cut boundary — the edge ring you need for downstream
`bmesh.ops.fill`, `bridge_loops`, or extrude operations.

Two production objects are built and exported:

| Object | Technique |
|---|---|
| `hf_halfshell` | UV sphere bisected at Z=0; equatorial ring sealed with `bmesh.ops.fill`; two-material shell+cap |
| `hf_cutaway` | Subdivided cube bisected at 45°; cut faces assigned a distinct material for the exposed cross-section |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Run inside Blender 5.1 to produce the blend + GLB |
| `record.py` | Viewport animation rendering to `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_bisect_halfshell.blend` | Saved Blender file (produced by blueprint.py) |
| `hf_bisect_halfshell.glb` | Draco L6 / WebP GLB for WebXR (produced by blueprint.py) |

## Key API facts

- `geom=` must include **all three types** — `bm.verts[:] + bm.edges[:] + bm.faces[:]`.  
  Passing only faces leaves boundary edges uncut; passing only edges misses interior polygon cuts.
- `clear_outer=True` removes faces on the positive-normal side (`(centroid − plane_co)·plane_no > 0`).
- `geom_cut` returns only the verts and edges AT the cut line — filter to `BMEdge` instances for
  downstream fill/bridge.
- `dist` snaps any vertex within that distance to the plane — doubles as a mirror-axis weld tool.

## Running the blueprint

```python
# In Blender 5.1 Text Editor:
import bpy
exec(open("/path/to/blueprint.py").read())
```

Or drag `blueprint.py` into the Text Editor and press **Alt+P**.

## Outside sources

- Blender Foundation — [bmesh.ops API Reference 5.1](https://docs.blender.org/api/5.1/bmesh.ops.html) (CC-BY-SA-4.0)
- Khronos Group — [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) (Apache-2.0)
