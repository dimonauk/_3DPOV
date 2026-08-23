# Weaire-Phelan A15 Foam — Poi Head

**Blender version:** 5.1  
**Python dependencies:** NumPy (bundled), SciPy (bundled in Blender 5.1 Python env)  
**Output:** `hf_weaire_phelan.blend` · `hf_weaire_phelan.glb` · `viewport.mp4` · `screen.mp4`  
**Licence:** CC0

---

## What this is

The Weaire-Phelan structure is the answer to a 107-year-old open problem.

In 1887, Lord Kelvin asked: how do you partition three-dimensional space into
equal-volume cells with the minimum total surface area? His own answer — the
bitruncated cubic honeycomb, built from truncated octahedra — stood for over a
century. In 1994, Denis Weaire and Robert Phelan found a periodic structure with
two types of cells that achieves approximately 0.3 % less surface area per unit
volume. No structure has beaten it since.

The two cell types, both with equal volume, are:
- **Type A — pentagonal dodecahedron:** 12 pentagonal faces, 30 edges, 20 vertices.
- **Type B — tetrakaidecahedron (Goldberg polyhedron GP(2,1)):** 2 hexagonal + 12 pentagonal faces = 14 faces, 36 edges, 24 vertices.

The unit cell contains 2 type-A and 6 type-B cells (ratio 1:3), and it is
derived from the A15 crystal lattice (space group Pm-3n, prototype: Cr₃Si).

The same structure appears on the Beijing National Aquatics Centre ("Water Cube")
façade — 22,000 steel members and 4,000 ETFE cushions tiling the Weaire-Phelan
foam cross-section.

---

## Prerequisites

```bash
# Blender 5.1 ships with scipy; verify inside Blender Python console:
import scipy.spatial; print(scipy.__version__)
```

If SciPy is missing: install it into Blender's Python environment:
```bash
/path/to/blender-5.1/python/bin/pip install scipy
```

---

## Running the blueprint

1. Open Blender 5.1, Scripting workspace.
2. Open `blueprint.py` from this folder.
3. Press **Run Script**.
4. Expect output in the console:
   ```
   [Weaire-Phelan]  vertices: ~1200
                    faces   : ~2400
                    radius  : 0.082 m
                    cells   : 2 × A (dodecahedra) + 6 × B (tetrakaidecahedra)
   ```

## Running the viewport animation

```bash
blender --background --python record.py
```

---

## Exporting the GLB

Apply the Wireframe modifier first if you want the cage baked in:

```python
import bpy
obj = bpy.data.objects["hf_weaire_phelan"]
bpy.ops.object.modifier_apply(modifier="Cage")
bpy.ops.export_scene.gltf(
    filepath="/path/to/hf_weaire_phelan.glb",
    use_selection=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_yup=True,
)
```

---

## Shape keys

| Name | Effect |
|------|--------|
| Basis | Default Weaire-Phelan configuration |
| SK_Tight | Vertices nudged 12 mm inward — bubbles contract |
| SK_Expanded | Vertices nudged 12 mm outward — bubbles inflate |

---

## File inventory

```
blueprint.py               — main generation script
record.py                  — viewport animation render
SCREEN-RECORDING-NOTES.md  — OBS capture instructions
README.md                  — this file
.expected-artefacts.json   — CI manifest
```
