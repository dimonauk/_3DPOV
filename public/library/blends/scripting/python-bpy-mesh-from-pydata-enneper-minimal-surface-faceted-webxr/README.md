# Enneper Minimal Surface — `bpy.types.Mesh.from_pydata()`

**Blender 5.1 · Python scripting · CC0**

Constructs Enneper's classical minimal surface (mean curvature H = 0 everywhere)
entirely in Python using `bpy.types.Mesh.from_pydata()` — no bmesh, no operator,
no primitive.  A `(u, v)` parameter grid evaluates the three-component Enneper
equations, the resulting vertex and face lists are passed directly to
`from_pydata()` in a single C-level call, and a height-gradient `FLOAT_COLOR`
point attribute is baked as `COLOR_0` for WebXR playback.  Flat shading gives
the studio's signature faceted look.

---

## Files

| File | Description |
|---|---|
| `blueprint.py` | Complete bpy script — run from the Scripting workspace |
| `record.py` | Camera-orbit viewport render → `viewport.mp4` (5 s) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `enneper_surface.glb` | Draco-compressed GLB with COLOR_0 (generated) |
| `enneper_surface.blend` | Saved Blender scene (generated) |

---

## Quick start

```bash
blender --background --python blueprint.py
```

Or open Blender 5.1, go to **Scripting** workspace, open `blueprint.py`, and
press **Alt+P**.

---

## Parameters

| Constant | Default | Effect |
|---|---|---|
| `N` | `60` | Quads per axis (3 600 faces total) |
| `U_MIN / U_MAX` | `±1.75` | Domain — self-intersection begins at `\|u\| = √3 ≈ 1.732` |

---

## Technique notes

- `Mesh.from_pydata(verts, [], faces)` — `edges=[]` is correct; Blender infers
  edges from face winding and saves you building an explicit edge list.
- `me.update()` is required after `from_pydata()` to finalise edge/face structures.
- `FLOAT_COLOR` on domain `POINT` exports as `COLOR_0` in the GLB without any
  extra export flags in Blender 5.1.
- Flat shading (`polygon.use_smooth = False`) is set explicitly so later
  viewport operators cannot silently override it.

---

## Related tutorials

- [bmesh Faceted Gem Topology](/tutorials/blender-tutorial-python-bpy-bmesh-faceted-gem-topology-construction-webxr) — alternative bmesh approach
- [mathutils.noise Terrain Heightfield](/tutorials/blender-tutorial-python-mathutils-noise-terrain-heightfield-webxr) — procedural geometry
- [Custom Split Normals](/tutorials/blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr) — normal control after from_pydata

---

## Outside sources

- Blender Foundation — `bpy.types.Mesh` Python API, CC-BY-SA 4.0
  <https://docs.blender.org/api/5.1/bpy.types.Mesh.html>
- Khronos Group — glTF 2.0 Specification (COLOR_0 accessor), Apache-2.0
  <https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html>
