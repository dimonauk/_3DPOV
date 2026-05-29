#!/usr/bin/env python3
"""
blueprint.py — GN Accumulate Field: Parametric Spiral Tower
Blender 5.1 | CC0 | Holoflow Studio

Technique:
  GeometryNodeAccumulateField is a field node that computes prefix sums
  over a domain-sorted array of values.  Given step heights h₀, h₁, h₂…
  the LEADING output at index i = h₀+h₁+…+h_{i-1} (sum BEFORE adding hᵢ).
  This gives the exact floor Z of pillar i with no loop or state.
  TRAILING = Leading + hᵢ = ceiling of pillar i.

  The XY layout uses a Fermat spiral (radius ∝ √i, angle = i×golden_angle)
  so pillars fill area with even density as count grows.

  Unit-depth cones are scaled per instance: Scale.Z = step_height (hᵢ),
  point Z = Leading + hᵢ/2 (midpoint) — base of scaled cone = Leading.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import math
from pathlib import Path

# ─── Constants ────────────────────────────────────────────────────────────────
SLUG         = "gn-accumulate-field-spiral-tower"
TOPIC        = "geometry-nodes"
MESH_NAME    = "spiral_tower"

HERE       = Path(__file__).parent
BLEND_OUT  = HERE / f"{MESH_NAME}.blend"
GLB_OUT    = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

N_STEPS      = 28       # number of pillars in the spiral
BASE_HEIGHT  = 0.06     # height of pillar 0 (shortest)
HEIGHT_GROWTH = 0.014   # each subsequent pillar taller by this amount
SPIRAL_RADIUS = 0.95    # outer XY radius at full count
CONE_BASE_R   = 0.10    # max XY radius of pillar 0 (unit-cone scale)
CONE_TIP_R    = 0.01    # tip radius fraction (applied via cone node)
CONE_VERTS    = 7       # polygon sides per cross-section (odd = crystal feel)
GOLDEN_ANGLE  = math.pi * (3.0 - math.sqrt(5.0))  # ≈ 2.39996 rad

# ─── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ─── Base object: empty mesh — GN provides all geometry ───────────────────────
mesh = bpy.data.meshes.new(f"{MESH_NAME}_base")
obj  = bpy.data.objects.new(MESH_NAME, mesh)
scene.collection.objects.link(obj)

# ─── GN tree setup ────────────────────────────────────────────────────────────
tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNSpiralTower")
nodes = tree.nodes
links = tree.links

tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")


def _sock_int(name, val, lo=1, hi=256):
    s = tree.interface.new_socket(name, in_out="INPUT", socket_type="NodeSocketInt")
    s.default_value, s.min_value, s.max_value = val, lo, hi


def _sock_float(name, val, lo=0.0, hi=10.0):
    s = tree.interface.new_socket(name, in_out="INPUT", socket_type="NodeSocketFloat")
    s.default_value, s.min_value, s.max_value = val, lo, hi


_sock_int(  "Pillar Count",   N_STEPS,       2, 128)
_sock_float("Base Height",    BASE_HEIGHT,   0.01, 2.0)
_sock_float("Height Growth",  HEIGHT_GROWTH, 0.0,  0.5)
_sock_float("Spiral Radius",  SPIRAL_RADIUS, 0.01, 5.0)
_sock_float("Cone Base R",    CONE_BASE_R,   0.01, 2.0)
_sock_int(  "Cone Vertices",  CONE_VERTS,    3, 32)

n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-1200,  0)
n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 1600,  0)

n_golden = nodes.new("ShaderNodeValue")
n_golden.outputs[0].default_value = GOLDEN_ANGLE
n_golden.label    = "Golden Angle rad"
n_golden.location = (-1000, -500)


def _math(op, x=None, y=None, loc=(0, 0)):
    n = nodes.new("ShaderNodeMath")
    n.operation = op
    n.use_clamp = False
    n.location  = loc
    if isinstance(x, (int, float)):
        n.inputs[0].default_value = float(x)
    if isinstance(y, (int, float)):
        n.inputs[1].default_value = float(y)
    return n


# ─── Step height: h_i = BaseHeight + Index × HeightGrowth ────────────────────
n_idx0   = nodes.new("GeometryNodeInputIndex"); n_idx0.location = (-950, 400)
n_grow   = _math("MULTIPLY", loc=(-750, 400))
n_step_h = _math("ADD",      loc=(-550, 400))
links.new(n_idx0.outputs["Index"],         n_grow.inputs[0])
links.new(n_in.outputs["Height Growth"],   n_grow.inputs[1])
links.new(n_grow.outputs["Value"],         n_step_h.inputs[0])
links.new(n_in.outputs["Base Height"],     n_step_h.inputs[1])
# n_step_h.outputs["Value"] = h_i for point i

# ─── Accumulate Field ─────────────────────────────────────────────────────────
# data_type='FLOAT', domain='POINT':
#   outputs[0] = Leading   (Σ h_j for j < i — the FLOOR of pillar i)
#   outputs[1] = Trailing  (Σ h_j for j ≤ i — the CEILING of pillar i)
#   outputs[2] = Total     (grand sum — useful for normalising later)
n_accum = nodes.new("GeometryNodeAccumulateField")
n_accum.data_type = "FLOAT"
n_accum.domain    = "POINT"
n_accum.location  = (-300, 400)
links.new(n_step_h.outputs["Value"], n_accum.inputs[0])   # Value
# inputs[1] = Group Index, leave at default 0 → one contiguous tower

# ─── Pillar midpoint Z = Leading + h_i / 2 ────────────────────────────────────
n_half  = _math("MULTIPLY", y=0.5, loc=(-200, 200))
n_mid_z = _math("ADD",             loc=(  50, 400))
links.new(n_step_h.outputs["Value"],    n_half.inputs[0])
links.new(n_accum.outputs[0],           n_mid_z.inputs[0])  # Leading
links.new(n_half.outputs["Value"],      n_mid_z.inputs[1])  # h_i / 2

# ─── Fermat spiral XY ─────────────────────────────────────────────────────────
# radius_i = SpiralRadius × √(i / (N-1))  — equal-area distribution
# angle_i  = i × GoldenAngle
n_idx1   = nodes.new("GeometryNodeInputIndex"); n_idx1.location = (-950, -100)
n_idx2   = nodes.new("GeometryNodeInputIndex"); n_idx2.location = (-950, -300)

n_norm   = _math("DIVIDE",            loc=(-750, -100))  # i / (N-1)
n_cnt_m1 = _math("SUBTRACT", y=1.0,  loc=(-950, -200))  # N - 1
links.new(n_in.outputs["Pillar Count"], n_cnt_m1.inputs[0])
links.new(n_idx1.outputs["Index"],      n_norm.inputs[0])
links.new(n_cnt_m1.outputs["Value"],    n_norm.inputs[1])

n_sqrt_t  = _math("SQRT",   loc=(-550, -100))
n_rad_i   = _math("MULTIPLY", loc=(-300, -100))
links.new(n_norm.outputs["Value"],        n_sqrt_t.inputs[0])
links.new(n_sqrt_t.outputs["Value"],      n_rad_i.inputs[0])
links.new(n_in.outputs["Spiral Radius"],  n_rad_i.inputs[1])

n_angle  = _math("MULTIPLY", loc=(-750, -300))
n_cos_a  = _math("COSINE",   loc=(-550, -200))
n_sin_a  = _math("SINE",     loc=(-550, -350))
links.new(n_idx2.outputs["Index"],   n_angle.inputs[0])
links.new(n_golden.outputs["Value"], n_angle.inputs[1])
links.new(n_angle.outputs["Value"],  n_cos_a.inputs[0])
links.new(n_angle.outputs["Value"],  n_sin_a.inputs[0])

n_px = _math("MULTIPLY", loc=(-150, -200))
n_py = _math("MULTIPLY", loc=(-150, -350))
links.new(n_cos_a.outputs["Value"],   n_px.inputs[0])
links.new(n_rad_i.outputs["Value"],   n_px.inputs[1])
links.new(n_sin_a.outputs["Value"],   n_py.inputs[0])
links.new(n_rad_i.outputs["Value"],   n_py.inputs[1])

# ─── Points cloud & SetPosition ───────────────────────────────────────────────
n_pts = nodes.new("GeometryNodePoints")
n_pts.location = (-950, 200)
links.new(n_in.outputs["Pillar Count"], n_pts.inputs[0])   # Count

n_combine = nodes.new("ShaderNodeCombineXYZ"); n_combine.location = (200, 0)
links.new(n_px.outputs["Value"],    n_combine.inputs["X"])
links.new(n_py.outputs["Value"],    n_combine.inputs["Y"])
links.new(n_mid_z.outputs["Value"], n_combine.inputs["Z"])

n_setpos = nodes.new("GeometryNodeSetPosition"); n_setpos.location = (400, 200)
links.new(n_pts.outputs["Geometry"],    n_setpos.inputs["Geometry"])
links.new(n_combine.outputs["Vector"],  n_setpos.inputs["Position"])

# ─── Per-instance XY scale: taper = 1.0 → 0.25 as index grows ────────────────
n_taper = nodes.new("ShaderNodeMapRange"); n_taper.location = (-150, 700)
n_taper.inputs["From Min"].default_value = 0.0
n_taper.inputs["From Max"].default_value = 1.0
n_taper.inputs["To Min"].default_value   = 1.0   # largest at bottom
n_taper.inputs["To Max"].default_value   = 0.25  # slimmest at top
links.new(n_norm.outputs["Value"],  n_taper.inputs["Value"])  # reuse i/(N-1)

n_scale_xy = _math("MULTIPLY", loc=(50, 700))
links.new(n_taper.outputs["Result"],      n_scale_xy.inputs[0])
links.new(n_in.outputs["Cone Base R"],    n_scale_xy.inputs[1])

n_scale_v = nodes.new("ShaderNodeCombineXYZ"); n_scale_v.location = (250, 700)
links.new(n_scale_xy.outputs["Value"],  n_scale_v.inputs["X"])
links.new(n_scale_xy.outputs["Value"],  n_scale_v.inputs["Y"])
links.new(n_step_h.outputs["Value"],    n_scale_v.inputs["Z"])  # Z scale = h_i

# ─── Unit cone prototype (depth=1, base_r=1) ──────────────────────────────────
n_cone = nodes.new("GeometryNodeMeshCone")
n_cone.fill_type = "NGON"
n_cone.location  = (400, 700)
n_cone.inputs["Radius Bottom"].default_value = 1.0   # unit — scaled per instance
n_cone.inputs["Radius Top"].default_value    = CONE_TIP_R
n_cone.inputs["Depth"].default_value         = 1.0   # unit — Scale.Z = h_i
links.new(n_in.outputs["Cone Vertices"], n_cone.inputs["Vertices"])

# ─── InstanceOnPoints + RealizeInstances ──────────────────────────────────────
n_inst = nodes.new("GeometryNodeInstanceOnPoints"); n_inst.location = (700, 400)
links.new(n_setpos.outputs["Geometry"],   n_inst.inputs["Points"])
links.new(n_cone.outputs["Mesh"],         n_inst.inputs["Instance"])
links.new(n_scale_v.outputs["Vector"],    n_inst.inputs["Scale"])

n_realise = nodes.new("GeometryNodeRealizeInstances"); n_realise.location = (950, 400)
links.new(n_inst.outputs["Instances"], n_realise.inputs["Geometry"])

# ─── Flat shade: crystal pillars look best with hard face edges ───────────────
n_smooth = nodes.new("GeometryNodeSetShadeSmooth")
n_smooth.domain   = "FACE"
n_smooth.location = (1150, 400)
n_smooth.inputs["Shade Smooth"].default_value = False
links.new(n_realise.outputs["Geometry"], n_smooth.inputs["Geometry"])
links.new(n_smooth.outputs["Geometry"],  n_out.inputs["Geometry"])

# ─── Attach modifier ──────────────────────────────────────────────────────────
mod = obj.modifiers.new(name="HoloflowGNSpiralTower", type="NODES")
mod.node_group = tree
mod["Input_2"] = N_STEPS
mod["Input_3"] = BASE_HEIGHT
mod["Input_4"] = HEIGHT_GROWTH
mod["Input_5"] = SPIRAL_RADIUS
mod["Input_6"] = CONE_BASE_R
mod["Input_7"] = CONE_VERTS

# ─── Material: translucent crystal, EEVEE Next FORWARD path ───────────────────
mat = bpy.data.materials.new("CrystalTower")
mat.use_nodes           = True
mat.blend_method        = "BLEND"
mat.shadow_method       = "NONE"
mat.use_backface_culling = False
mat.surface_render_method = "FORWARD"
nt   = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value          = (0.45, 0.82, 1.0, 1.0)
bsdf.inputs["Transmission Weight"].default_value = 0.90
bsdf.inputs["Roughness"].default_value           = 0.02
bsdf.inputs["IOR"].default_value                 = 1.46
bsdf.inputs["Alpha"].default_value               = 0.72
obj.data.materials.append(mat)

# ─── Lighting + camera ────────────────────────────────────────────────────────
sun_d = bpy.data.lights.new("Sun", type="SUN")
sun_d.energy = 4.0
sun_o = bpy.data.objects.new("Sun", sun_d)
scene.collection.objects.link(sun_o)
sun_o.rotation_euler = (0.7, 0.1, 0.85)

cam_d = bpy.data.cameras.new("Cam")
cam_o = bpy.data.objects.new("Cam", cam_d)
scene.collection.objects.link(cam_o)
cam_o.location       = (2.2, -2.4, 2.0)
cam_o.rotation_euler = (1.05, 0.0, 0.75)
scene.camera         = cam_o

# ─── Export GLB ──────────────────────────────────────────────────────────────
# export_apply=True — evaluates the full GN modifier stack before serialising.
# Without it the exporter writes the empty base mesh: zero geometry in glTF.
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_normals=True,
    export_materials="EXPORT",
    export_image_format="WEBP",
)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[holoflow] {MESH_NAME}.blend + GLB written — {N_STEPS} pillars via AccumulateField")
