# 3D Print Prep — bmesh Manifold Validation & Overhang Analysis (Blender 5.1)

Builds a chess-pawn shape by revolving a profile via the bmesh API, then runs
a full print-readiness audit without loading any extension.  The audit covers
four failure modes that commonly break FDM and SLA slicers:

| Check | API | Pass condition |
|---|---|---|
| Non-manifold edges | `edge.is_manifold` | 0 non-manifold edges |
| Winding consistency | `bm.calc_volume() > 0` | positive signed volume |
| Overhang severity | `max(0, -face.normal.z)` | user-defined tolerance |
| Sliver faces | `min(f.calc_area())` | > 1e-8 m² |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Build, analyse, and export — run once in the Scripting workspace |
| `record.py` | EEVEE viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions |
| `pawn_print_ready.blend` | Blender scene with heat-map material (generated) |
| `pawn_print_ready.glb` | Draco GLB with `overhang_severity` vertex attribute (generated) |
| `pawn_print_ready.stl` | Binary STL for slicer import (generated) |

## Quick start

```bash
blender --background --python blueprint.py
```

Or interactively: Scripting workspace → Open `blueprint.py` → Run Script.

## Technique notes

### Why `recalc_face_normals` is mandatory for revolution meshes

When you build a revolution by stitching rings, the bottom triangle fan
winds CW from outside and the top fan winds CCW — the two poles disagree.
`bmesh.ops.recalc_face_normals()` propagates a consistent outward winding
across all faces using a flood-fill over the edge adjacency graph.
Without it, `bm.calc_volume()` returns a value near zero (mixed winding
cancels out) and the overhang check is meaningless.

### The signed-volume invariant

`bm.calc_volume()` computes:  V = (1/6) Σ (v₀ · v₁ × v₂)  over all triangulated
faces.  The sign depends on normal orientation: outward normals → positive,
inward normals → negative.  A near-zero result means the mesh is open,
self-intersecting, or has mixed normals.  For a valid print mesh: V > 0.

### Overhang threshold and FDM physics

FDM filament bridges unsupported spans up to ~45° from horizontal before
drooping.  The threshold is actually printer-specific (45° for PLA, up to 60°
for bridging-capable slicers with cooling).  `OVERHANG_DEG = 45.0` is the
conservative default.  Increase it if your printer / slicer handles steeper
overhangs reliably.

### STL export in Blender 5.1

`bpy.ops.wm.stl_export()` was introduced in Blender 4.2 as the unified I/O
operator, replacing the older `bpy.ops.export_mesh.stl()`.  The `forward_axis='Y'`
+ `up_axis='Z'` combination matches the Blender world axes to the slicer
convention (most FDM slicers expect Z-up with the build plate in XY).

## Outside sources

- Blender Manual — 3D Print Toolbox:
  https://docs.blender.org/manual/en/latest/addons/mesh/3d_print_toolbox.html
  CC-BY-SA 4.0, Blender Foundation

- njanakiev/blender-scripting (MIT):
  https://github.com/njanakiev/blender-scripting

- glTF-Blender-IO (Apache-2.0, Khronos Group):
  https://github.com/KhronosGroup/glTF-Blender-IO

## Studio cross-references

- `/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron` — same bmesh construction API
- `/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map` — per-face topology visualisation
- `/tutorials/blender-tutorial-vertex-colour-attributes` — attribute visualisation pipeline
- `/tutorials/blender-tutorial-texture-baking-normal-ao` — baking heat-map to texture for WebXR export
- `/tutorials/blender-tutorial-faceted-gem-webxr` — watertight closed-mesh requirements
