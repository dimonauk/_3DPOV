# blueprint.py — GN Catenary Curve: Hanging Cable Array for WebXR Interior Scenes
# Blender 5.1 | CC0 | Holoflow Studio Library
# https://holoflow.co.uk/tutorials/blender-tutorial-gn-catenary-curve-cable-array-webxr
#
# WHY catenary, not parabola:
#   A parabola approximates the shape of a cable only when sag/span < 0.05.
#   At prop scale (sag/span ≈ 0.1–0.4) the error is visible; the catenary is
#   the exact solution for a cable of uniform linear mass density under gravity.
#
# Catenary equation for two equal-height endpoints separated by span S,
# with catenary parameter 'a' (the horizontal tension / linear weight ratio):
#   z(x) = a · (cosh(x/a) − cosh(S/(2a)))       x ∈ [−S/2, +S/2]
#   z(0)   = a · (1 − cosh(S/(2a)))  < 0         ← lowest point (sag peak)
#   z(±S/2)= 0                                   ← endpoints at Z=0
#
# Node implementation builds this formula inside a Geometry Nodes group,
# with 'Sag Parameter' (a) and 'Span' (S) exposed as animatable Group Inputs.
#
# Outputs:
#   output/cable_array.blend — 5 catenary cables in a WebXR-ready scene
#   output/cable_array.glb   — GLB, Draco 6, Y-up, snake_case root

import bpy
import math

# ── parameters ────────────────────────────────────────────────────────────────
SPAN          = 4.0    # endpoint separation (metres, along X)
SAG_PARAM     = 1.20   # catenary 'a'; lower = more droop; a > 0 always
RESAMPLE_PTS  = 32     # spline sample count (32 smooth, 64 silky)
PROFILE_RES   = 6      # profile circle segments; 6 = hexagonal cross-section
PROFILE_R     = 0.015  # cable radius (metres)
TAPER_TIP     = 0.40   # profile radius scale at endpoints (relative to centre)
CABLE_COUNT   = 5
CABLE_SPACING = 0.40   # Y gap between cable centrelines (metres)
OUT_BLEND     = "//output/cable_array.blend"
OUT_GLB       = "//output/cable_array.glb"


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def build_catenary_node_group(ng_name: str = "CatenaryCable") -> bpy.types.NodeGroup:
    """
    Build and return the GN node group implementing the catenary formula.

    Group Inputs:  Geometry, Sag Parameter (FLOAT), Span (FLOAT)
    Group Outputs: Geometry (swept tube mesh)
    """
    ng = bpy.data.node_groups.new(ng_name, "GeometryNodeTree")
    ng.is_modifier = True
    nodes = ng.nodes
    links = ng.links

    # ── group I/O sockets ────────────────────────────────────────────────────
    iface = ng.interface
    iface.new_socket("Geometry",      in_out="OUTPUT", socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",      in_out="INPUT",  socket_type="NodeSocketGeometry")
    sag_sock = iface.new_socket("Sag Parameter", in_out="INPUT",  socket_type="NodeSocketFloat")
    sag_sock.default_value = SAG_PARAM
    sag_sock.min_value     = 0.05
    span_sock = iface.new_socket("Span",         in_out="INPUT",  socket_type="NodeSocketFloat")
    span_sock.default_value = SPAN
    span_sock.min_value     = 0.10

    gin  = nodes.new("NodeGroupInput")
    gout = nodes.new("NodeGroupOutput")
    gin.location  = (-900, 0)
    gout.location = (700, 0)

    # ── source: horizontal line resampled to RESAMPLE_PTS points ─────────────
    line = nodes.new("GeometryNodeCurvePrimitiveLine")
    line.location = (-700, 80)
    line.inputs["Start"].default_value = (-SPAN / 2, 0.0, 0.0)
    line.inputs["End"].default_value   = ( SPAN / 2, 0.0, 0.0)

    resamp = nodes.new("GeometryNodeResampleCurve")
    resamp.location = (-500, 80)
    resamp.mode = "COUNT"
    resamp.inputs["Count"].default_value = RESAMPLE_PTS
    links.new(line.outputs["Curve"], resamp.inputs["Curve"])

    # ── catenary Z-offset chain ───────────────────────────────────────────────
    # x = (t − 0.5) × Span  where t = SplineParameter.Factor
    spm  = nodes.new("GeometryNodeSplineParameter");  spm.location = (-700, -100)
    msub = nodes.new("ShaderNodeMath"); msub.operation = "SUBTRACT"; msub.location = (-550, -100)
    msub.inputs[1].default_value = 0.5
    links.new(spm.outputs["Factor"], msub.inputs[0])

    mspan = nodes.new("ShaderNodeMath"); mspan.operation = "MULTIPLY"; mspan.location = (-380, -100)
    links.new(msub.outputs["Value"],  mspan.inputs[0])
    links.new(gin.outputs["Span"],    mspan.inputs[1])   # x = (t-0.5)*Span

    # cosh(x / a)
    mdiv_xa = nodes.new("ShaderNodeMath"); mdiv_xa.operation = "DIVIDE"; mdiv_xa.location = (-200, -60)
    links.new(mspan.outputs["Value"],   mdiv_xa.inputs[0])
    links.new(gin.outputs["Sag Parameter"], mdiv_xa.inputs[1])

    mcosh_xa = nodes.new("ShaderNodeMath"); mcosh_xa.operation = "COSH"; mcosh_xa.location = (-20, -60)
    links.new(mdiv_xa.outputs["Value"], mcosh_xa.inputs[0])

    # cosh(Span / (2·a))
    mhalf = nodes.new("ShaderNodeMath"); mhalf.operation = "MULTIPLY"; mhalf.location = (-380, -220)
    mhalf.inputs[1].default_value = 0.5
    links.new(gin.outputs["Span"], mhalf.inputs[0])

    mdiv_hsa = nodes.new("ShaderNodeMath"); mdiv_hsa.operation = "DIVIDE"; mdiv_hsa.location = (-200, -220)
    links.new(mhalf.outputs["Value"],          mdiv_hsa.inputs[0])
    links.new(gin.outputs["Sag Parameter"],    mdiv_hsa.inputs[1])

    mcosh_hsa = nodes.new("ShaderNodeMath"); mcosh_hsa.operation = "COSH"; mcosh_hsa.location = (-20, -220)
    links.new(mdiv_hsa.outputs["Value"], mcosh_hsa.inputs[0])

    # z_off = a · (cosh(x/a) − cosh(S/(2a)))   (negative at centre = droop)
    msub2 = nodes.new("ShaderNodeMath"); msub2.operation = "SUBTRACT"; msub2.location = (160, -140)
    links.new(mcosh_xa.outputs["Value"],  msub2.inputs[0])
    links.new(mcosh_hsa.outputs["Value"], msub2.inputs[1])

    mmul_a = nodes.new("ShaderNodeMath"); mmul_a.operation = "MULTIPLY"; mmul_a.location = (320, -140)
    links.new(msub2.outputs["Value"],          mmul_a.inputs[0])
    links.new(gin.outputs["Sag Parameter"],    mmul_a.inputs[1])

    cxyz = nodes.new("ShaderNodeCombineXYZ"); cxyz.location = (480, -80)
    cxyz.inputs["X"].default_value = 0.0
    cxyz.inputs["Y"].default_value = 0.0
    links.new(mmul_a.outputs["Value"], cxyz.inputs["Z"])

    setpos = nodes.new("GeometryNodeSetPosition"); setpos.location = (480, 80)
    links.new(resamp.outputs["Curve"],   setpos.inputs["Geometry"])
    links.new(cxyz.outputs["Vector"],    setpos.inputs["Offset"])

    # ── parabolic taper: radius = PROFILE_R · (TAPER_TIP + (1−TAPER_TIP)·4t(1−t)) ──
    # 4t(1-t) peaks at 1.0 when t=0.5, falls to 0 at both endpoints.
    m4t  = nodes.new("ShaderNodeMath"); m4t.operation = "MULTIPLY";  m4t.location = (-700, -340)
    m4t.inputs[1].default_value = 4.0
    links.new(spm.outputs["Factor"], m4t.inputs[0])

    m1mt = nodes.new("ShaderNodeMath"); m1mt.operation = "SUBTRACT"; m1mt.location = (-550, -340)
    m1mt.inputs[0].default_value = 1.0
    links.new(spm.outputs["Factor"], m1mt.inputs[1])

    mtenv = nodes.new("ShaderNodeMath"); mtenv.operation = "MULTIPLY"; mtenv.location = (-380, -340)
    links.new(m4t.outputs["Value"],  mtenv.inputs[0])
    links.new(m1mt.outputs["Value"], mtenv.inputs[1])

    # scale envelope: TAPER_TIP + (1 - TAPER_TIP) * envelope
    tip_diff = 1.0 - TAPER_TIP
    mscl = nodes.new("ShaderNodeMath"); mscl.operation = "MULTIPLY"; mscl.location = (-200, -340)
    mscl.inputs[1].default_value = tip_diff
    links.new(mtenv.outputs["Value"], mscl.inputs[0])

    madd = nodes.new("ShaderNodeMath"); madd.operation = "ADD";      madd.location = (-20, -340)
    madd.inputs[0].default_value = TAPER_TIP
    links.new(mscl.outputs["Value"], madd.inputs[1])

    mrad = nodes.new("ShaderNodeMath"); mrad.operation = "MULTIPLY"; mrad.location = (160, -340)
    mrad.inputs[1].default_value = PROFILE_R
    links.new(madd.outputs["Value"], mrad.inputs[0])

    setrad = nodes.new("GeometryNodeSetCurveRadius"); setrad.location = (480, -240)
    links.new(setpos.outputs["Curve"],  setrad.inputs["Curve"])
    links.new(mrad.outputs["Value"],    setrad.inputs["Radius"])

    # ── sweep: profile circle → Curve to Mesh ────────────────────────────────
    circle = nodes.new("GeometryNodeCurvePrimitiveCircle")
    circle.location = (320, -420)
    circle.mode = "RADIUS"
    circle.inputs["Resolution"].default_value = PROFILE_RES
    circle.inputs["Radius"].default_value     = 1.0   # driven by SetCurveRadius above

    c2m = nodes.new("GeometryNodeCurveToMesh"); c2m.location = (680, 0)
    c2m.inputs["Fill Caps"].default_value = False
    links.new(setrad.outputs["Curve"],   c2m.inputs["Curve"])
    links.new(circle.outputs["Curve"],   c2m.inputs["Profile Curve"])
    links.new(c2m.outputs["Mesh"],       gout.inputs["Geometry"])

    return ng


def apply_catenary_to_object(ng: bpy.types.NodeGroup, obj_name: str) -> bpy.types.Object:
    me = bpy.data.meshes.new(obj_name + "_base")
    obj = bpy.data.objects.new(obj_name, me)
    bpy.context.scene.collection.objects.link(obj)
    mod = obj.modifiers.new("CatenaryCable", "NODES")
    mod.node_group = ng
    return obj


def build_cable_array():
    reset_scene()
    scene = bpy.context.scene
    scene.render.fps = 30

    ng = build_catenary_node_group()

    mat = bpy.data.materials.new("cable_jacket")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.05, 0.05, 0.12, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.8
    bsdf.inputs["Roughness"].default_value  = 0.35

    cable_objects = []
    for i in range(CABLE_COUNT):
        y = (i - (CABLE_COUNT - 1) / 2.0) * CABLE_SPACING
        obj = apply_catenary_to_object(ng, f"cable_{i:02d}")
        obj.location = (0.0, y, 0.0)
        obj.data.materials.append(mat)
        cable_objects.append(obj)

    # anchor empties mark endpoint positions for reference
    for side_x in (-SPAN / 2, SPAN / 2):
        emp = bpy.data.objects.new("anchor", None)
        emp.location = (side_x, 0.0, 0.0)
        emp.empty_display_type = "SPHERE"
        emp.empty_display_size = 0.04
        scene.collection.objects.link(emp)

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT_BLEND))
    return cable_objects


def export_glb(cable_objects):
    for obj in cable_objects:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier="CatenaryCable")

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUT_GLB),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
    )
    print(f"Exported → {OUT_GLB}")


if __name__ == "__main__":
    cables = build_cable_array()
    export_glb(cables)
