# bmesh.ops.wireframe — Edge-Tube Lattice & Crystal Cage

**Blender 5.1 · Holoflow Studio · CC0**

Converts every edge of a mesh into a rectangular-section tube by inserting
new vertices at each face corner and building quad rings — the headless
context-free kernel behind Blender's Wireframe edit-mode tool.

Two studio props: a hollow icosahedron crystal cage (emissive, WebXR-ready)
and a semi-transparent HUD grid panel with a separate emissive wire layer.

## What this demonstrates

| Concept | Details |
|---------|---------|
| `bmesh.ops.wireframe` | Core API: solidifies edge topology into tube quads |
| `use_replace=True` | Removes original fill faces → hollow lattice cage |
| `use_replace=False` | Retains fill faces → wire overlay on solid surface |
| `use_even_offset=True` | Equalises tube thickness at angled junctions |
| `use_boundary=True` | Extends tubes to open-mesh perimeter edges (flat grid) |
| `material_offset` | Integer offset assigns wire quads to a separate material slot |
| Two-material HUD | Semi-transparent fill + emissive wire for WebXR depth read |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless build + GLB export (cage + grid HUD) |
| `record.py` | EEVEE turntable render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS window-capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
blender --background --python blueprint.py
```

Outputs `hf_wireframe_cage.glb` and `hf_wireframe_grid_hud.glb` next to the
script. Both are Draco-compressed, WebP-textured, +Y-up GLBs suitable for
WebXR drop-in.

## Topology Notes

Each original edge in the input mesh produces **four new quad faces** forming
a rectangular-section tube. On a subdivided icosphere at `subdivisions=1`:

- 42 vertices, 80 triangular faces, 120 edges
- After `wireframe` with `use_replace=True`: 0 fill faces, 480 tube quads

On the 6×6 grid with `use_replace=False`:

- 49 vertices, 36 fill quads, 84 edges (60 inner + 24 boundary)
- After `wireframe`: 36 fill quads retained + 336 wire tube quads
