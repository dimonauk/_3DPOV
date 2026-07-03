"""
GN Curve Tangent + Curve Normal
Frenet-Serret Frame Storage: Energy Beam Trail for WebXR
Blender 5.1  ·  Holoflow Studio  ·  CC0 1.0 Universal

The Frenet-Serret frame at every point on a curve is three orthonormal vectors:
  T  Tangent   — unit vector in the direction of travel
  N  Normal    — unit vector toward the centre of curvature (concave side)
  B  Binormal  — T × N, the lateral axis completing the right-handed basis

Blender 5.1 exposes T via GeometryNodeCurveTangent and N via
GeometryNodeCurveNormal.  B must be computed with VectorMath(CROSS).

WHY CurveTangent ≠ CurveToPoints.Tangent output
  Both yield the same mathematical vector, but they are different APIs:
  · CurveTangent is a FIELD SOURCE — it evaluates lazily in whatever geometry
    context is active at the point of consumption. Feed it into
    StoreNamedAttribute, AlignEulerToVector, or VectorMath and the evaluation
    runs once per curve point, sharing no intermediate allocation.
  · CurveToPoints.Tangent is a REALIZED socket output — using it forces the
    CurveToPoints operator on the full geometry before any downstream node
    can start. Use CurveTangent when you want the tangent as data (attribute,
    math, export); use CurveToPoints.Tangent only when you are already using
    CurveToPoints for instance placement and need the tangent for free.

WHY CurveNormal.mode = MINIMUM_ROTATION vs Z_UP
  Z_UP projects the world Z-axis (0,0,1) perpendicular to T and normalises.
  When T ≈ ±Z (near-vertical path segment), that projection approaches zero
  length → the normal vector becomes undefined and flips violently between
  adjacent points. The result is UV twisting and lighting discontinuities.
  MINIMUM_ROTATION (parallel-transport frame) propagates the previous point's
  normal forward with the least rotation that keeps it perpendicular to T.
  There are no discontinuities on open paths. Use MINIMUM_ROTATION for any
  complex 3-D trajectory; reserve Z_UP for flat horizontal paths only.

WHY store T, N, B as named GLB attributes
  Three.js reads per-vertex custom attributes from the GLB extras block.
  The Holoflow exporter (tools/blender-addon/) copies named attributes whose
  names begin with an underscore into the accessor list.  This enables:
  · Anisotropic highlight streaks along _T (SparkLine shader, hair-like sheen)
  · Bend-direction gradient from _N (glow fades toward convex side)
  · Screen-space distortion axis from _B for stylised plasma effects
"""

import bpy
from math import pi, sin, cos, radians
from mathutils import Vector

# ── Named constants ────────────────────────────────────────────────────────────
CURVE_NAME     = "beam_path"
OBJ_NAME       = "energy_beam"
NG_NAME        = "FrenetBeam_GN"
EXPORT_PATH    = "//output/energy_beam.glb"

RESAMPLE_COUNT = 64          # resampled points — curve resolution for the sweep
TUBE_RADIUS    = 0.042       # metres, radius of swept tube
TUBE_SEGS      = 8           # vertices around tube circumference (WebXR: 6–12)
NOISE_SCALE    = 3.5         # texture noise spatial frequency
NOISE_STRENGTH = 0.014       # metres, max noise displacement amplitude

COL_CORE  = (0.18, 0.72, 1.00, 1.0)   # bright cyan  #2EB7FF (linear sRGB)
COL_GLOW  = (0.02, 0.30, 0.80, 1.0)   # deep electric blue

# ── Stage 1: purge scene ──────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for d in (bpy.data.meshes, bpy.data.curves, bpy.data.node_groups,
          bpy.data.materials):
    for item in list(d):
        d.remove(item)

# ── Stage 2: build sinuous S-curve ────────────────────────────────────────────
# Seven Bezier control points form a loose S-shape rising through 3-D space.
# AUTO handles give smooth curves without manual handle placement.
# WHY Bezier over Poly: Bezier gives smooth curvature everywhere, so
# CurveNormal's parallel-transport frame has gradual T changes rather than
# step jumps at every control point.

CTRL_PTS = [
    Vector((-1.6,  0.0,  0.0)),
    Vector((-0.8,  0.5,  0.5)),
    Vector((-0.2,  0.0,  1.0)),
    Vector(( 0.0, -0.5,  1.5)),
    Vector(( 0.2,  0.0,  2.0)),
    Vector(( 0.8,  0.5,  2.5)),
    Vector(( 1.6,  0.0,  3.0)),
]

cdata  = bpy.data.curves.new(CURVE_NAME, type='CURVE')
cdata.dimensions = '3D'
spline = cdata.splines.new('BEZIER')
spline.bezier_points.add(len(CTRL_PTS) - 1)
for i, pt in enumerate(CTRL_PTS):
    bp = spline.bezier_points[i]
    bp.co                = pt
    bp.handle_left_type  = 'AUTO'
    bp.handle_right_type = 'AUTO'

beam_obj = bpy.data.objects.new(OBJ_NAME, cdata)
bpy.context.scene.collection.objects.link(beam_obj)
bpy.context.view_layer.objects.active = beam_obj

# ── Stage 3: materials ────────────────────────────────────────────────────────
def _make_emission(name, colour, strength=5.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    pb = mat.node_tree.nodes["Principled BSDF"]
    pb.inputs["Base Color"].default_value      = colour
    pb.inputs["Emission Color"].default_value  = colour
    pb.inputs["Emission Strength"].default_value = strength
    pb.inputs["Roughness"].default_value       = 0.08
    pb.inputs["Metallic"].default_value        = 0.0
    return mat

mat_core = _make_emission("mat_beam_core", COL_CORE, strength=6.0)
mat_glow = _make_emission("mat_beam_glow", COL_GLOW, strength=2.0)
cdata.materials.append(mat_core)
cdata.materials.append(mat_glow)

# ── Stage 4: Geometry Nodes tree ──────────────────────────────────────────────
ng    = bpy.data.node_groups.new(NG_NAME, "GeometryNodeTree")
nodes = ng.nodes
links = ng.links
ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

def N(bl_id, x=0, y=0):
    n = nodes.new(bl_id)
    n.location = (x, y)
    return n

def L(a, a_s, b, b_s):
    links.new(a.outputs[a_s], b.inputs[b_s])

# I/O
n_in  = N("NodeGroupInput",  -1600,   0)
n_out = N("NodeGroupOutput",  1400,   0)

# Resample to uniform COUNT points — critical: without this, Bezier evaluates
# with non-uniform arc-length spacing and the CurveTangent field picks up
# density artefacts near control points.
n_res = N("GeometryNodeResampleCurve", -1300, 0)
n_res.mode = 'COUNT'
n_res.inputs["Count"].default_value = RESAMPLE_COUNT

# Field sources — these evaluate lazily in the context of their consumer.
# They have NO geometry input; they evaluate on whatever CURVE is active.
n_tan = N("GeometryNodeCurveTangent", -1300, -220)   # T
n_nrm = N("GeometryNodeCurveNormal",  -1300, -390)   # N
n_nrm.mode = 'MINIMUM_ROTATION'
n_spl = N("GeometryNodeSplineParameter", -1300, -580) # Factor → beam_t

# Binormal B = T × N — Vector Math in GN uses the Shader node type
n_cross = N("ShaderNodeVectorMath", -1050, -300)
n_cross.operation = 'CROSS_PRODUCT'

# Store _T, _N, _B, beam_t on POINT domain (curve point = vertex ring in tube)
# Names begin with underscore so the Holoflow exporter knows to copy them.
def _store(name, dtype, x, y):
    s = N("GeometryNodeStoreNamedAttribute", x, y)
    s.data_type = dtype
    s.domain    = 'POINT'
    s.inputs["Name"].default_value = name
    return s

n_sT = _store("_T",     "FLOAT_VECTOR", -800, 100)
n_sN = _store("_N",     "FLOAT_VECTOR", -800, -120)
n_sB = _store("_B",     "FLOAT_VECTOR", -800, -340)
n_st = _store("beam_t", "FLOAT",        -800, -540)

# Profile: circle of TUBE_RADIUS with TUBE_SEGS vertices (low-poly for WebXR).
# WHY circle not line: a closed circular profile gives a round tube with correct
# watertight topology for GLB; a line profile gives a flat ribbon with naked edges
# that cause transparency sorting issues in WebXR renderers.
n_circ = N("GeometryNodeCurvePrimitiveCircle", -1300, 300)
n_circ.mode = 'RADIUS'
n_circ.inputs["Resolution"].default_value = TUBE_SEGS
n_circ.inputs["Radius"].default_value     = TUBE_RADIUS

# Sweep profile along path
n_c2m = N("GeometryNodeCurveToMesh", -300, 100)
n_c2m.inputs["Fill Caps"].default_value = True

# Position noise — adds organic jitter so the beam reads as alive, not CG-rigid
n_noise = N("ShaderNodeTexNoise",  -300, -200)
n_noise.noise_dimensions = '3D'
n_noise.inputs["Scale"].default_value      = NOISE_SCALE
n_noise.inputs["Roughness"].default_value  = 0.55
n_noise.inputs["Distortion"].default_value = 0.2

n_vsub = N("ShaderNodeVectorMath", -50, -200)
n_vsub.operation = 'SUBTRACT'
n_vsub.inputs[1].default_value = (0.5, 0.5, 0.5)  # remap colour [0,1]→[-0.5,0.5]

n_vscl = N("ShaderNodeVectorMath", 150, -200)
n_vscl.operation = 'SCALE'
n_vscl.inputs["Scale"].default_value = NOISE_STRENGTH

n_spos = N("GeometryNodeSetPosition", 350, 100)

# Shade smooth — tube should interpolate normals
n_ssmth = N("GeometryNodeSetShadeSmooth", 600, 100)
n_ssmth.domain = 'FACE'
n_ssmth.inputs["Shade Smooth"].default_value = True

# ── Wire nodes ────────────────────────────────────────────────────────────────
# Resample chain
L(n_in,   "Geometry", n_res,  "Curve")

# Store T on resampled curve (field evaluates here, stored before c2m)
L(n_res,  "Curve",     n_sT,  "Geometry")
L(n_tan,  "Tangent",   n_sT,  "Value")

# Store N
L(n_sT,   "Geometry",  n_sN,  "Geometry")
L(n_nrm,  "Normal",    n_sN,  "Value")

# Compute B = T × N then store
L(n_tan,  "Tangent",   n_cross, 0)
L(n_nrm,  "Normal",    n_cross, 1)
L(n_sN,   "Geometry",  n_sB,  "Geometry")
L(n_cross, "Vector",   n_sB,  "Value")

# Store beam_t (Spline Parameter Factor)
L(n_sB,   "Geometry",  n_st,  "Geometry")
L(n_spl,  "Factor",    n_st,  "Value")

# Sweep curve (with stored attributes) through circle profile
L(n_st,   "Geometry",  n_c2m, "Curve")
L(n_circ, "Curve",     n_c2m, "Profile Curve")

# Noise displacement
L(n_c2m,  "Mesh",      n_vsub,  0)   # reuse geometry position as noise coord
L(n_noise, "Color",    n_vsub,  0)
L(n_vsub,  "Vector",   n_vscl,  0)
L(n_c2m,  "Mesh",      n_spos, "Geometry")
L(n_vscl,  "Vector",   n_spos, "Offset")

# Smooth + output
L(n_spos, "Geometry",  n_ssmth, "Geometry")
L(n_ssmth, "Geometry", n_out,   "Geometry")

# Apply modifier to object
gn_mod = beam_obj.modifiers.new("FrenetBeam", "NODES")
gn_mod.node_group = ng

# ── Stage 5: camera + sun (for record.py reference frame) ─────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("Camera", cam_data)
cam_obj.location = (3.5, -3.5, 2.0)
cam_obj.rotation_euler = (radians(70), 0, radians(45))
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

sun = bpy.data.lights.new("Sun", 'SUN')
sun.energy = 2.0
sun_obj = bpy.data.objects.new("Sun", sun)
sun_obj.location = (4, -3, 5)
bpy.context.scene.collection.objects.link(sun_obj)

# ── Stage 6: GLB export with Draco compression ───────────────────────────────
import os
out_dir = bpy.path.abspath("//output/")
os.makedirs(out_dir, exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath       = bpy.path.abspath(EXPORT_PATH),
    use_selection  = False,
    export_format  = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_apply   = True,          # apply GN modifier before export
    export_attributes = True,       # include _T, _N, _B, beam_t attributes
    export_tangents   = False,      # WebXR compute their own tangents
)

print(f"[Holoflow] Exported: {EXPORT_PATH}")
print(f"[Holoflow] Attributes stored: _T (tangent), _N (normal), _B (binormal), beam_t")
