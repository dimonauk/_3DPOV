#!/usr/bin/env python3
"""
blueprint.py — GN Shortest Edge Path: Circuit Trace Network on a Geodesic Sphere
Blender 5.1 | CC0 | Holoflow Studio

Technique:
  GeometryNodeShortestEdgePaths runs Dijkstra simultaneously from all
  polar-cap "end" vertices.  For every non-end vertex it records the index
  of the next vertex toward the nearest end vertex — a next-hop tree.
  GeometryNodeEdgePathsToCurves traces that tree outward from equatorial
  "start" vertices, producing one Curve strand per start vertex.

  Random per-edge cost in [COST_MIN, COST_MAX] (seeded by EdgeIndex) breaks
  the geodesic symmetry of a regular icosphere: Dijkstra's tree navigates
  around cheap edges and avoids expensive ones, producing the organic
  right-angle-ish detours characteristic of PCB trace routing.  Uniform cost
  collapses many paths into identical meridians; a 6× cost ratio gives
  distinctly circuit-trace-like snaking.

  CurveToMesh with a hexagonal profile (Resolution=6) extrudes each trace
  into a flat-faceted tube suited to the studio's low-poly aesthetic.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
from pathlib import Path

# ─── Parameters ───────────────────────────────────────────────────────────────
SLUG      = "gn-shortest-edge-path-circuit-trace"
TOPIC     = "geometry-nodes"
MESH_NAME = "circuit_trace_sphere"

HERE      = Path(__file__).parent
BLEND_OUT = HERE / f"{MESH_NAME}.blend"
GLB_OUT   = HERE.parents[2] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

ICO_SUBDIVISIONS = 4      # 320 faces, 162 vertices — enough for varied path routing
ICO_RADIUS       = 1.0

END_CAP_Z  = 0.70   # |z| > this → polar-cap end vertex (~top/bottom 45°)
START_EQ_Z = 0.35   # |z| < this → equatorial candidate band
START_PROB = 0.60   # fraction of equatorial vertices that start a trace
START_SEED = 23

COST_SEED = 7
COST_MIN  = 0.5
COST_MAX  = 3.0   # ratio 6× → recognisable circuit-trace detours

TRACE_RADIUS        = 0.012   # tube radius in metres
TRACE_PROFILE_VERTS = 6       # hexagonal cross-section — circle at typical distance

SPHERE_COLOUR = (0.02, 0.04, 0.08, 1.0)  # deep navy
TRACE_COLOUR  = (0.0, 1.0, 0.88, 1.0)   # circuit-board cyan
TRACE_EMISSION_STRENGTH = 3.0

# ─── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ─── Materials ────────────────────────────────────────────────────────────────
mat_sph = bpy.data.materials.new("CircuitSphere")
mat_sph.use_nodes = True
p_sph = mat_sph.node_tree.nodes["Principled BSDF"]
p_sph.inputs["Base Color"].default_value = SPHERE_COLOUR
p_sph.inputs["Roughness"].default_value  = 0.85
p_sph.inputs["Metallic"].default_value   = 0.15

mat_tr = bpy.data.materials.new("CircuitTrace")
mat_tr.use_nodes = True
p_tr = mat_tr.node_tree.nodes["Principled BSDF"]
p_tr.inputs["Base Color"].default_value        = TRACE_COLOUR
p_tr.inputs["Emission Color"].default_value    = TRACE_COLOUR
p_tr.inputs["Emission Strength"].default_value = TRACE_EMISSION_STRENGTH
p_tr.inputs["Roughness"].default_value         = 0.05
p_tr.inputs["Metallic"].default_value          = 0.85

# ─── Empty base object — geometry generated entirely inside the GN tree ───────
# Using an empty base mesh + IcoSphere node inside GN makes the asset portable:
# no dependency on a pre-built mesh data block.
mesh = bpy.data.meshes.new(f"{MESH_NAME}_base")
obj  = bpy.data.objects.new(MESH_NAME, mesh)
scene.collection.objects.link(obj)

# ─── GN tree setup ────────────────────────────────────────────────────────────
tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNCircuitTrace")
nodes = tree.nodes
links = tree.links

tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

s_density = tree.interface.new_socket(
    "Start Density", in_out="INPUT", socket_type="NodeSocketFloat"
)
s_density.default_value = START_PROB
s_density.min_value     = 0.0
s_density.max_value     = 1.0

# ─── Node helpers ─────────────────────────────────────────────────────────────
def _n(typ, loc, **kw):
    n = nodes.new(typ)
    n.location = loc
    for k, v in kw.items():
        setattr(n, k, v)
    return n

def _math(op, loc):
    return _n("ShaderNodeMath", loc, operation=op)

def _lk(a, b):
    links.new(a, b)

# ─── I/O ──────────────────────────────────────────────────────────────────────
n_in  = _n("NodeGroupInput",  (-1600,    0))
n_out = _n("NodeGroupOutput", (  1800,   0))

# ─── Source geometry ──────────────────────────────────────────────────────────
n_ico = _n("GeometryNodeIcoSphere", (-1400, 300))
n_ico.inputs["Subdivisions"].default_value = ICO_SUBDIVISIONS
n_ico.inputs["Radius"].default_value       = ICO_RADIUS

# ─── Field: polar-cap end vertices (|z| > END_CAP_Z) ─────────────────────────
# ShortestEdgePaths runs Dijkstra FROM end vertices outward.
# Polar caps as end points → traces flow equator-to-pole.
n_pos  = _n("GeometryNodeInputPosition", (-1400, -100))
n_sxyz = _n("ShaderNodeSeparateXYZ",     (-1200, -100))
n_absz = _math("ABSOLUTE", (-1000, -100))   # |z| keeps both caps symmetric

n_cmp_end = _n("FunctionNodeCompare", (-800,  -50))
n_cmp_end.data_type = "FLOAT"
n_cmp_end.operation = "GREATER_THAN"
n_cmp_end.inputs["B"].default_value = END_CAP_Z

# ─── Field: equatorial start vertices — position gate AND random fraction ─────
# Two-stage selection: position Compare limits candidates to the equatorial band;
# RandomValue(BOOLEAN) then culls to START_PROB fraction for controllable density.
n_cmp_eq = _n("FunctionNodeCompare", (-800, -350))
n_cmp_eq.data_type = "FLOAT"
n_cmp_eq.operation = "LESS_THAN"
n_cmp_eq.inputs["B"].default_value = START_EQ_Z

n_rand_s = _n("GeometryNodeRandomValue", (-800, -580))
n_rand_s.data_type = "BOOLEAN"
n_rand_s.inputs["Seed"].default_value = START_SEED
# Probability comes from group socket so record.py can reveal traces over time.

n_and = _n("FunctionNodeBooleanMath", (-550, -450))
n_and.operation = "AND"

# ─── Field: random per-edge cost ──────────────────────────────────────────────
# EdgeIndex wired to RandomValue.ID gives each edge a unique deterministic cost.
# Low COST_MIN prevents zero-cost "free" edges that collapse paths to trivial routes.
n_eidx      = _n("GeometryNodeInputIndex",  (-1000, -700))
n_rand_cost = _n("GeometryNodeRandomValue", ( -800, -700))
n_rand_cost.data_type = "FLOAT"
n_rand_cost.inputs["Min"].default_value  = COST_MIN
n_rand_cost.inputs["Max"].default_value  = COST_MAX
n_rand_cost.inputs["Seed"].default_value = COST_SEED

# ─── Shortest edge paths (field node — context from EdgePathsToCurves.Mesh) ───
n_path = _n("GeometryNodeShortestEdgePaths", (-300, -200))

# ─── Edge paths → curves → tube mesh ─────────────────────────────────────────
n_e2c = _n("GeometryNodeEdgePathsToCurves", (100, 100))

n_setr = _n("GeometryNodeSetCurveRadius", (400, 100))
n_setr.inputs["Radius"].default_value = TRACE_RADIUS

n_circle = _n("GeometryNodeCurvePrimitiveCircle", (400, -150))
n_circle.mode = "RADIUS"
n_circle.inputs["Resolution"].default_value = TRACE_PROFILE_VERTS
n_circle.inputs["Radius"].default_value     = TRACE_RADIUS

n_c2m = _n("GeometryNodeCurveToMesh", (700, 100))
n_c2m.inputs["Fill Caps"].default_value = False  # caps pop against dark sphere

n_tr_mat = _n("GeometryNodeSetMaterial", (1000, 100))
n_tr_mat.inputs[2].default_value = mat_tr

# ─── Sphere path — passes through with its own material ───────────────────────
n_sph_mat = _n("GeometryNodeSetMaterial", (-1000, 400))
n_sph_mat.inputs[2].default_value = mat_sph

# ─── Join ─────────────────────────────────────────────────────────────────────
n_join = _n("GeometryNodeJoinGeometry", (1300, 200))

# ─── Wiring ───────────────────────────────────────────────────────────────────
_lk(n_pos.outputs["Position"],             n_sxyz.inputs["Vector"])
_lk(n_sxyz.outputs["Z"],                   n_absz.inputs[0])
_lk(n_absz.outputs["Value"],               n_cmp_end.inputs["A"])
_lk(n_absz.outputs["Value"],               n_cmp_eq.inputs["A"])

_lk(n_cmp_eq.outputs["Result"],            n_and.inputs[0])
_lk(n_rand_s.outputs["Value"],             n_and.inputs[1])
_lk(n_in.outputs["Start Density"],         n_rand_s.inputs["Probability"])

_lk(n_eidx.outputs["Index"],               n_rand_cost.inputs["ID"])

_lk(n_cmp_end.outputs["Result"],           n_path.inputs["End Vertex"])
_lk(n_rand_cost.outputs["Value"],          n_path.inputs["Edge Cost"])

_lk(n_ico.outputs["Mesh"],                 n_e2c.inputs["Mesh"])
_lk(n_and.outputs["Boolean"],              n_e2c.inputs["Start Vertices"])
_lk(n_path.outputs["Next Vertex Index"],   n_e2c.inputs["Next Vertex Index"])

_lk(n_e2c.outputs["Curves"],              n_setr.inputs["Curve"])
_lk(n_setr.outputs["Curve"],              n_c2m.inputs["Curve"])
_lk(n_circle.outputs["Curve"],            n_c2m.inputs["Profile Curve"])
_lk(n_c2m.outputs["Mesh"],               n_tr_mat.inputs[0])
_lk(n_tr_mat.outputs[0],                 n_join.inputs[0])

_lk(n_ico.outputs["Mesh"],               n_sph_mat.inputs[0])
_lk(n_sph_mat.outputs[0],               n_join.inputs[0])  # multi-input socket

_lk(n_join.outputs[0],                   n_out.inputs["Geometry"])

# ─── Attach modifier ──────────────────────────────────────────────────────────
mod = obj.modifiers.new("GNCircuitTrace", "NODES")
mod.node_group = tree

# ─── Export ───────────────────────────────────────────────────────────────────
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[holoflow] .blend → {BLEND_OUT}")

bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_yup=True,
)
print(f"[holoflow] .glb  → {GLB_OUT}")
