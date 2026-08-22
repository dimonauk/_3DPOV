# GN Shortest Edge Path — Procedural Circuit Trace Network on a Geodesic Sphere

**Blender 5.1 | CC0 | Holoflow Studio**

## What this does

Applies a Geometry Nodes modifier to an empty object. Inside the GN tree:

1. `GeometryNodeIcoSphere` (subdivisions = 4, 162 vertices) provides the source mesh.
2. `ShortestEdgePaths` runs Dijkstra simultaneously from polar-cap end vertices
   (|z| > 0.70), recording the next-hop vertex index for every non-end vertex.
3. `EdgePathsToCurves` traces that next-hop tree outward from equatorial start
   vertices (|z| < 0.35, thinned to 60 % via `RandomValue(BOOLEAN)`), producing
   one Curve per start vertex.
4. `CurveToMesh` with a hexagonal profile extrudes each trace into a tube.
5. `SetMaterial` assigns `CircuitTrace` (emissive cyan) to traces and
   `CircuitSphere` (deep navy) to the base icosphere.

The **Start Density** group socket (float, 0–1) controls how many equatorial
vertices start traces — animating it from 0 → 0.60 progressively reveals the network.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless bpy — builds scene, GN tree, materials, exports .blend + .glb |
| `record.py` | Keyframes Start Density 0 → 0.60 → 0, renders `viewport.mp4` (72 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output file list and cross-references |

## Key nodes

| Node | Role |
|------|------|
| `GeometryNodeShortestEdgePaths` | Field node — no Geometry input. Inputs: End Vertex (bool), Edge Cost (float). Output: Next Vertex Index (int). |
| `GeometryNodeEdgePathsToCurves` | Takes Mesh, Start Vertices, Next Vertex Index. Outputs one Curve per start vertex. |
| `GeometryNodeInputIndex` | Provides per-edge unique integer for seeding RandomValue edge cost. |
| `GeometryNodeCurvePrimitiveCircle(Resolution=6)` | Hexagonal tube profile for CurveToMesh. |
| `FunctionNodeCompare(FLOAT, GREATER_THAN)` | Polar-cap end-vertex field. |
| `FunctionNodeBooleanMath(AND)` | Combines equatorial-band and random-fraction start selections. |

## Why random edge cost breaks geodesic symmetry

On a uniform-cost icosphere Dijkstra finds the fewest-hop paths — geodesics.
A regular icosphere has 5-fold rotational symmetry, so many start vertices share
identical paths. Assigning each edge a random cost in [0.5, 3.0] seeded by
`EdgeIndex → RandomValue.ID` breaks that symmetry: the Dijkstra tree routes around
cheap edges and avoids expensive ones, producing the organic PCB-trace detours.
The cost ratio COST_MAX / COST_MIN is the zigzag factor: 6× gives circuit traces;
1.2× gives near-geodesic curvature.

## Expert note: ShortestEdgePaths is a field node

`ShortestEdgePaths` has no Geometry input socket. Its evaluation context is the
mesh that `EdgePathsToCurves` receives on its `Mesh` socket. `Position`, `InputIndex`,
and all upstream field nodes are also evaluated at that same mesh context. This is
the same lazy-field mechanism described in the Capture Attribute tutorial: the
consuming node's geometry input sets the domain and mesh for all upstream fields.

## Outside sources

- Blender Manual — Shortest Edge Paths Node.  
  URL: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/shortest_edge_paths.html  
  Licence: CC-BY-SA 4.0 · Author: Blender Documentation Team
- Blender Manual — Curve to Mesh Node.  
  URL: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html  
  Licence: CC-BY-SA 4.0 · Author: Blender Documentation Team
- glTF-Blender-IO.  
  URL: https://github.com/KhronosGroup/glTF-Blender-IO  
  Licence: Apache-2.0 · Author: Khronos Group
