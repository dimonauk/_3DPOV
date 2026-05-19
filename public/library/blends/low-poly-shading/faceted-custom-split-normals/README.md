# Faceted Custom Split Normals

**Topic:** low-poly-shading  
**Blender:** 5.1+  
**Output:** `glbs/low-poly-shading/faceted-custom-split-normals/faceted_icosphere.glb`

---

## What this is

The definitive reference for the Holoflow high-facet aesthetic. Demonstrates
why Shade Flat alone does not survive GLB export, and how `normals_split_custom_set()`
commits per-face normals into the mesh so the glTF exporter has something concrete
to write into the NORMAL accessor.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full procedural script — create, bake normals, export |
| `record.py` | EEVEE animation render (turntable, 5 s) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the screen recording |
| `.expected-artefacts.json` | CI/audit manifest |

## Quick start

1. Open Blender 5.1.
2. Scripting workspace → open `blueprint.py`.
3. Run (Alt+P). The GLB is written to `glbs/low-poly-shading/faceted-custom-split-normals/`.
4. For the video: open `record.py` and run it. Renders to `videos/low-poly-shading/faceted-custom-split-normals/viewport.mp4`.

## Key technique

```python
# Build per-face normals for every loop
loop_normals = [(0.0, 0.0, 0.0)] * len(mesh.loops)
for poly in mesh.polygons:
    fn = (poly.normal.x, poly.normal.y, poly.normal.z)
    for li in poly.loop_indices:
        loop_normals[li] = fn

# Commit — after this, mesh.has_custom_normals == True
# and the glTF exporter reads from the CD_CUSTOMLOOPNORMAL layer
mesh.normals_split_custom_set(loop_normals)
```

## Why not `use_auto_smooth`?

Removed in Blender 4.2. The 5.x canonical alternative for full-faceted output
is `normals_split_custom_set()` directly. For angle-threshold smooth shading
(not faceted, but smooth-with-creases) use the **Smooth by Angle** geometry
nodes modifier instead.

## External references

- **KhronosGroup/glTF 2.0 Specification** — Apache-2.0  
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html  
  §3.7.2 defines the NORMAL accessor and how hard edges force vertex duplication.

- **KhronosGroup/glTF-Blender-IO** — Apache-2.0  
  https://github.com/KhronosGroup/glTF-Blender-IO  
  The bundled Blender exporter. `_gather_normals()` in the primitives module
  checks `has_custom_normals` — the exact branch this technique exercises.
