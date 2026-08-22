# GN Dual Mesh — Geodesic Hex-Pent Dome

**Blender 5.1 · Geometry Nodes · Licence: CC0**

Converts a subdivided icosphere into a geodesic dome using the **Dual Mesh**
node: every triangular face becomes a vertex; every vertex becomes a polygonal
face. The result is the classic soccer-ball / Buckminster Fuller pattern of
hexagons and pentagons.

## Why Dual Mesh?

Euler's polyhedral formula (V − E + F = 2) applied to any triangular mesh
with only degree-5 and degree-6 vertices proves there are exactly **12
pentagonal faces**, regardless of how many subdivisions you add. Additional
subdivisions produce more hexagons but never change the pentagon count. This
is the mathematical foundation of geodesic dome design.

| Icosphere Subdiv | Triangular Faces | Dual Faces | Pentagons | Hexagons |
|:-:|:-:|:-:|:-:|:-:|
| 1 | 20 | 12 | 12 | 0 |
| 2 | 80 | 42 | 12 | 30 |
| 3 | 320 | 162 | 12 | 150 |
| 4 | 1280 | 642 | 12 | 630 |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full expert Python build script |
| `record.py` | Automated viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Usage

Run `blueprint.py` from Blender's built-in Text Editor (`Run Script`) or via
the CLI:

```bash
blender --background --python blueprint.py
```

Outputs: `geodesic_dome.blend` + `geodesic_dome.glb` in the same directory.

## Node Graph Summary

```
Group Input
  └─ [Dual Mesh]              keep_boundaries=False
       └─ [Merge by Distance] threshold=0.001 m
            ├─ [Face Neighbors] → vertex_count
            │       └─ [Compare INT == 5]  → pentagon boolean
            │               └─ [Set Material Index = 1]  pentagon slot
            └─ [Store Named Attribute] holoflow:facet=1.0, domain=FACE
                 └─ Group Output
```

## WebXR Export Notes

- Shade **Flat** before export — each dual face is planar; smooth shading
  blurs the cell edges.
- Enable `export_attributes=True` in the glTF exporter so `holoflow:facet`
  survives as a mesh accessor for the Three.js flat-shade system.
- Draco compression level 6 gives ~40 % size reduction on this geometry.

## Cross-References

- `/tutorials/blender-tutorial-gn-dual-mesh-geodesic-hex-pent-dome`
- `/tutorials/blender-tutorial-gn-merge-by-distance-weld-clean-tiled-module`
- `/tutorials/blender-tutorial-gn-align-euler-to-vector-signage-facade`
- `/tutorials/blender-tutorial-workbench-cavity-outline-assembly-diagram`

## Outside Sources

- Blender Manual — Dual Mesh Node (CC-BY-SA 4.0, Blender Foundation)
  <https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/mesh/operations/dual_mesh.html>
- "Geodesic Domes" — Buckminster Fuller Institute (public domain reference)
  <https://www.bfi.org/about-fuller/big-ideas/geodesic-domes/>
