# GN Face Group Boundaries — Procedural Panel Groove Engraving

**Blender 5.1 · Geometry Nodes · CC0**

Procedurally scores panel-line grooves onto a hard-surface cube by detecting where
noise-driven face zones change, extracting those boundary edges, and converting them
to tube geometry — raised weld seams tracing organic Voronoi-like cluster borders.

## What this produces

| Artefact | Description |
|---|---|
| `panel_grooves.blend` | Animated rotating cube, GN modifier intact |
| `panel_grooves.glb` | Draco-compressed GLB with panel colour attribute |
| `blueprint.py` | Headless bpy script that builds everything |
| `record.py` | OpenGL viewport render → `viewport.mp4` |

## Key nodes

| Node | Role |
|---|---|
| `GeometryNodeSubdivideMesh` | Flat-quad subdivision (not CatmullClark) |
| `ShaderNodeTexNoise` (4D) | Organic noise field at face centres |
| `FunctionNodeFloatToInt` | Explicit FLOAT→INT cast for face set IDs |
| `GeometryNodeFaceGroupBoundaries` | BOOL edge field: True where face sets differ |
| `GeometryNodeSeparateGeometry` (EDGE) | Isolate only boundary edges |
| `GeometryNodeMeshToCurve` | Boundary edge chains → curve splines |
| `GeometryNodeCurveToMesh` | Sweep circle profile → groove tubes |

## Running

```bash
blender --background --python blueprint.py
blender panel_grooves.blend --background --python record.py
```

## Parameters to experiment with

- `NOISE_SCALE` — smaller value (0.4) = fewer, larger panels; larger (1.5) = fine mosaic
- `NUM_GROUPS` — increase for more colour zones; does not affect groove density
- `GROOVE_RADIUS` — thicker = chunky welds; thinner = fine scribe lines
- `CIRCLE_VERTS` — 8 = round tube; 4 = square (cheaper, visible in closeup)
- `NOISE_SEED` — change the W offset to reskin panel layout without moving camera

## Studio connections

- Tutorial: `/tutorials/blender-tutorial-gn-face-group-boundaries-panel-grooves`
- Related: Extrude Mesh Panel Lines, GN Mesh Boolean Hard Surface
- Codex: `faceted`, `hard-surface`
