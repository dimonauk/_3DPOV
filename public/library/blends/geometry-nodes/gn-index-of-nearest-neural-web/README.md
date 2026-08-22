# GN Index of Nearest — Neural Web Connection Field

**Blender 5.1 · CC0 · Holoflow Studio**

For each of ~120 Poisson-scattered points on a unit UV sphere, `Index of Nearest`
returns the integer index of the closest OTHER point in the cloud.  A `Sample Index`
node reads that neighbour's world position.  A For Each Element zone then
instantiates a two-vertex `Mesh Line` per scatter point — start at the current
point, end at the neighbour — building a nearest-neighbour graph in geometry.
`Curve to Mesh` extrudes each edge into a glowing emission tube.

A `wave_radius` Group Input (0 → 2.5) gates which connections are visible by
comparing the connection midpoint's distance from the north pole against the
current wave front, creating a synaptic activation sweep.

---

## Technique

| Node | Role |
|---|---|
| `GeometryNodeIndexOfNearest` | Per-point: find index of nearest other scatter point |
| `GeometryNodeSampleIndex` | Read the neighbour's Position (or any attribute) by index |
| `GeometryNodeForeachGeometryElementInput/Output` | Iterate over points; build one Mesh Line per point |
| `GeometryNodeMeshLine` (END_POINTS mode) | Two-vertex edge from pos_i to nn_pos_i |
| `GeometryNodeMeshToCurve` + `GeometryNodeCurveToMesh` | Convert edges to cylindrical tubes |
| `FunctionNodeCompare` × 2 + `FunctionNodeBooleanMath` | Gate connections by wave front AND distance |

### Why Index of Nearest, not Geometry Proximity?

`Geometry Proximity` measures distance to a *different* mesh's surface and returns
a scalar distance plus the nearest surface point.  `Index of Nearest` asks "which
OTHER element in my own set is nearest?" and returns an INTEGER INDEX — which is
exactly what `Sample Index` needs to look up an arbitrary attribute on that element.
The two nodes are complementary: use Proximity for cross-object influence fields,
use Index of Nearest for intra-cloud pairing.

### Why For Each Element to build edges?

Blender GN has no atomic "connect point A to point B" node.  The For Each zone
iterates N times (once per scatter point), and each iteration constructs a
`Mesh Line` between the two positions — a self-contained 2-vertex mesh.  The
zone accumulates these into a single mesh with N disconnected edges.  Alternative
approaches (Duplicate Elements + offset, manual edge-topology construction) all
require either post-bpy surgery or scripting outside the GN tree; the For Each
zone keeps the full pipeline live and scrub-safe.

### Wave front gating on the midpoint

Gating on the midpoint of each connection (rather than on the source point or the
destination point) prevents edges that STRADDLE the wave front from flickering
as the wave passes one endpoint: both endpoints must be inside the swept region
before the edge lights up.

---

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full bpy.data GN tree + GLB export |
| `record.py` | Wave-sweep animation + EEVEE render (5 s @ 30 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `neural_web.blend` | Generated scene (run blueprint.py) |
| `neural_web.glb` | Draco-compressed GLB for WebXR |

---

## Outside sources

- **blender-scripting** — Nicolas Janakiev — MIT
  <https://github.com/njanakiev/blender-scripting>
  bpy.data patterns referenced for GN tree construction and attribute API.
  Related OSS: `blender-osm`, `blender-gis` (same author).

- **glTF-Blender-IO** — Khronos Group — Apache-2.0
  <https://github.com/KhronosGroup/glTF-Blender-IO>
  Export pipeline including `export_attributes=True` for named attribute survival.
  Related OSS: glTF Validator, three.js glTF loader (Khronos ecosystem).

---

## Parameters

| Group Socket | Default | Effect |
|---|---|---|
| `Wave Radius` | 0.5 | Distance from north pole at which connections activate (0 → all off, 2.5 → all on) |
| `Max Conn Dist` | 0.48 | Maximum allowed edge length — longer connections are culled |
| `Tube Radius` | 0.005 | Cross-section radius of each connection tube |

---

## Troubleshooting

**No connections appear at all**
Check `Wave Radius` — if it is 0.0, no midpoints pass the gate.  Raise it to 1.0
and confirm connections appear near the north pole.

**All connections appear simultaneously (no wave)**
`conn_active` may be evaluating as `True` everywhere.  Open the Spreadsheet,
set domain to POINT on the scatter points, and verify the `conn_active` column
shows a mix of True and False values when Wave Radius is set to 1.0.

**Tubes are pure white / no gradient**
The `colour_t` attribute is not surviving the Curve to Mesh step.  Confirm that
`Store Named Attribute` (name = "colour_t") is placed BEFORE `Mesh to Curve`,
and that `export_attributes=True` is set in the GLB export call.

**Connections go outside the sphere surface**
This is expected and correct — connections are straight lines through 3D space
between two surface points, not geodesics along the sphere.  For surface-following
connections, see the Shortest Edge Path tutorial.
