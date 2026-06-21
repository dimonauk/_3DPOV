# GN Corners of Face + Vertex of Corner — Per-Corner Gradient on a Faceted Gem

**Blender version:** 5.1  
**Domain:** Geometry Nodes — Mesh Topology  
**Licence:** CC0  
**Studio topic tags:** faceted, gem, geometry-nodes, corner-domain, topology-traversal, WebXR

## What this teaches

Blender's mesh topology nodes — `Corners of Face`, `Vertex of Corner`, and `Face of Corner` —
expose the corner domain: the half-edge–like layer that sits between faces, vertices, and edges.
By traversing this layer explicitly inside a GN tree, you can compute any per-face quantity from
scratch using vertex data, without leaving the node graph.

This entry builds a procedural gradient on an ICO sphere gem: for each corner of each triangular
face, the gradient value is the normalised distance from the corner's vertex to the face's centroid.
Face centres glow aqua-white; face edges fall to deep indigo.

## Nodes used

| Node | Role |
|------|------|
| `Face of Corner` | Given current corner index → owning face index |
| `Corners of Face` | Given face index + sort order (0, 1, 2) → sibling corner indices |
| `Vertex of Corner` | Given corner index → vertex index |
| `Evaluate at Index (POINT)` | Given vertex index → world-space position |
| `Attribute Statistic (CORNER)` | Max of distance field over all corners → normalisation divisor |
| `Map Range` | Normalise raw distance → [0, 1] |
| `Store Named Attribute (CORNER)` | Write `corner_grad` float to corner domain |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene + GN tree + material + GLB export |
| `record.py` | Camera-orbit animation render → `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup and shot list for `screen.mp4` |
| `faceted_gem_gradient.glb` | Exported gem with corner_grad baked as vertex colour |

## Running

```bash
blender --background --python blueprint.py
```

GLB is written to the same directory as `blueprint.py`.

## Studio cross-references

- Attribute pipeline: see `gn-store-named-attribute-shader-data-bridge`
- AttributeStatistic normalisation pattern: see `gn-attribute-statistic-evaluate-on-domain`  
- Faceted aesthetic that this gem belongs to: see `faceted-gem-flat-normals`

## Outside sources

1. [Blender Manual — Corners of Face](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/topology/corners_of_face.html)
   CC-BY-SA-4.0 · Blender Foundation
2. [njanakiev/blender-scripting](https://github.com/njanakiev/blender-scripting)
   MIT · Nikolai Janakiev — GN tree construction patterns via bpy
