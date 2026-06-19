"""
Blender 5.1  —  GN Gizmo Nodes: Parametric Roman Arch with Interactive Viewport Handles
Slug    : gn-gizmo-nodes-interactive-viewport-controls
Topic   : geometry-nodes
Licence : CC0 — no rights reserved

Technique ─────────────────────────────────────────────────────────────────────
  Gizmo nodes (Blender 5.0+) attach interactive 3D handles directly to GN
  modifier inputs, allowing artists to drag Width and Height directly in the
  viewport instead of scrubbing sidebar numbers.

  Two GeometryNodeGizmoLinear nodes (new in 5.0):
    • Width gizmo  — horizontal arrow at the arch's right shoulder
    • Height gizmo — vertical arrow floating above the crown

  The handle POSITION is driven by the same Width/Height values it controls,
  so the arrow tracks the arch edge as you drag.  This "self-referential
  position" is the canonical gizmo pattern — the handle sits exactly where
  your intuition expects it.

  Geometry: MeshLine of SEGMENTS+1 vertices (all at origin) reshaped by
  per-vertex SetPosition math: x = cos(i/SEGMENTS * π) * Width/2,
  z = sin(i/SEGMENTS * π) * Height.  Two pillar cubes are added at the feet.
  This avoids needing a CurveArc rotate trick and exposes Width + Height as
  fully independent parameters.

Outside sources ────────────────────────────────────────────────────────────────
  Blender 5.0 Release Notes — Geometry Nodes: Gizmos
  https://wiki.blender.org/wiki/Reference/Release_Notes/5.0/Nodes_and_Physics
  CC-BY-SA 4.0, Blender Wiki contributors

  Blender Python API — GeometryNodeGizmoLinear, NodeSocketGizmo
  https://docs.blender.org/api/5.1/bpy.types.GeometryNodeGizmoLinear.html
  CC-BY-SA 4.0, Blender Documentation Team
"""

import bpy
import math

# ── Named constants ────────────────────────────────────────────────────────────
ARCH_WIDTH   = 4.0     # metres, inner span
ARCH_HEIGHT  = 2.5     # metres, crown rise
ARCH_THICK   = 0.35    # metres, voussoir ring depth
ARCH_DEPTH   = 0.55    # metres, extrusion depth along Y
PILLAR_H     = 2.0     # metres, pillar height below arch feet
SEGMENTS     = 32      # spine vertex count; ≥16 for smooth silhouette
GZ_OFFSET    = 0.5     # metres, gizmo handle clearance beyond geometry


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = "GN_Gizmo_RomanArch"
    cam_d = bpy.data.cameras.new("cam")
    cam_o = bpy.data.objects.new("cam", cam_d)
    bpy.context.scene.collection.objects.link(cam_o)
    bpy.context.scene.camera = cam_o
    cam_o.location       = (7.0, -5.5, 3.8)
    cam_o.rotation_euler = (math.radians(65), 0.0, math.radians(52))
    sun_d = bpy.data.lights.new("sun", "SUN")
    sun_d.energy = 4.0
    sun_o = bpy.data.objects.new("sun", sun_d)
    bpy.context.scene.collection.objects.link(sun_o)
    sun_o.rotation_euler = (math.radians(45), 0.0, math.radians(-30))


def make_seed_object() -> bpy.types.Object:
    """Single-vertex mesh: GN replaces all geometry; vertex just anchors the modifier."""
    me  = bpy.data.meshes.new("arch_seed")
    me.from_pydata([(0.0, 0.0, 0.0)], [], [])
    obj = bpy.data.objects.new("RomanArch", me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


def nd(nodes, tp: str, loc=(0, 0), label=None):
    """Convenience: add a node at loc with an optional display label."""
    node = nodes.new(tp)
    node.location = loc
    if label:
        node.label = label
    return node


def build_gn_tree(obj: bpy.types.Object) -> bpy.types.GeometryNodeTree:
    nt    = bpy.data.node_groups.new("GN_RomanArch", "GeometryNodeTree")
    mod   = obj.modifiers.new("GN_RomanArch", "NODES")
    mod.node_group = nt
    N     = nt.nodes
    L     = nt.links
    iface = nt.interface

    # ── Interface sockets ─────────────────────────────────────────────────────
    def f_in(name, default, lo=None, hi=None):
        s = iface.new_socket(name, in_out="INPUT", socket_type="NodeSocketFloat")
        s.default_value = default
        if lo is not None:
            s.min_value = lo
        if hi is not None:
            s.max_value = hi

    f_in("Width",     ARCH_WIDTH,  0.5,  20.0)
    f_in("Height",    ARCH_HEIGHT, 0.5,  20.0)
    f_in("Thickness", ARCH_THICK,  0.05,  2.0)
    f_in("Depth",     ARCH_DEPTH,  0.05,  5.0)
    f_in("PillarH",   PILLAR_H,    0.0,  20.0)
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    # NodeSocketGizmo is the dedicated socket type for gizmo data in Blender 5.0+.
    # VERIFY: run `bpy.types.NodeSocketGizmo` in the console to confirm it exists.
    iface.new_socket("Gizmos",   in_out="OUTPUT", socket_type="NodeSocketGizmo")

    gi = nd(N, "NodeGroupInput",  loc=(-2200, 0))
    go = nd(N, "NodeGroupOutput", loc=(700,   0))

    # ── Arch spine: SEGMENTS+1 verts at origin, reshaped to semicircle ────────
    # x = cos(i/SEGMENTS * π) * Width/2  →  right foot (1,0) → crown (0,1) → left foot (-1,0)
    # z = sin(i/SEGMENTS * π) * Height
    mline = nd(N, "GeometryNodeMeshLine", loc=(-2000, 350), label="arch_scaffold")
    mline.mode                           = 'OFFSET'
    mline.count_mode                     = 'TOTAL'
    mline.inputs['Count'].default_value  = SEGMENTS + 1
    mline.inputs['Offset'].default_value = (0.0, 0.0, 0.0)

    idx = nd(N, "GeometryNodeInputIndex", loc=(-2000, 180), label="vert_index")

    m_t = nd(N, "ShaderNodeMath", loc=(-1800, 180), label="t = idx/SEG")
    m_t.operation = 'DIVIDE'
    m_t.inputs[1].default_value = float(SEGMENTS)
    L.new(idx.outputs["Index"], m_t.inputs[0])

    m_ang = nd(N, "ShaderNodeMath", loc=(-1600, 180), label="angle = t*π")
    m_ang.operation = 'MULTIPLY'
    m_ang.inputs[1].default_value = math.pi
    L.new(m_t.outputs[0], m_ang.inputs[0])

    m_cos = nd(N, "ShaderNodeMath", loc=(-1400, 300), label="cos(angle)")
    m_cos.operation = 'COSINE'
    L.new(m_ang.outputs[0], m_cos.inputs[0])

    m_sin = nd(N, "ShaderNodeMath", loc=(-1400, 120), label="sin(angle)")
    m_sin.operation = 'SINE'
    L.new(m_ang.outputs[0], m_sin.inputs[0])

    # half_width = Width * 0.5  — reused for pillar positions and gizmo positions
    m_hw = nd(N, "ShaderNodeMath", loc=(-1800, 450), label="half_width")
    m_hw.operation = 'MULTIPLY'
    m_hw.inputs[1].default_value = 0.5
    L.new(gi.outputs["Width"], m_hw.inputs[0])

    m_x = nd(N, "ShaderNodeMath", loc=(-1200, 300), label="arch_x")
    m_x.operation = 'MULTIPLY'
    L.new(m_cos.outputs[0], m_x.inputs[0])
    L.new(m_hw.outputs[0],  m_x.inputs[1])

    m_z = nd(N, "ShaderNodeMath", loc=(-1200, 120), label="arch_z")
    m_z.operation = 'MULTIPLY'
    L.new(m_sin.outputs[0],      m_z.inputs[0])
    L.new(gi.outputs["Height"],  m_z.inputs[1])

    cxyz = nd(N, "ShaderNodeCombineXYZ", loc=(-1000, 220), label="arch_pos")
    cxyz.inputs["Y"].default_value = 0.0
    L.new(m_x.outputs[0], cxyz.inputs["X"])
    L.new(m_z.outputs[0], cxyz.inputs["Z"])

    setp = nd(N, "GeometryNodeSetPosition", loc=(-800, 330))
    L.new(mline.outputs["Mesh"],    setp.inputs["Geometry"])
    L.new(cxyz.outputs["Vector"],   setp.inputs["Position"])

    m2c = nd(N, "GeometryNodeMeshToCurve", loc=(-600, 330), label="mesh→curve")
    L.new(setp.outputs["Geometry"], m2c.inputs["Mesh"])

    # Profile: octagonal circle of radius Thickness/2
    m_th2 = nd(N, "ShaderNodeMath", loc=(-800, 120), label="thick/2")
    m_th2.operation = 'MULTIPLY'
    m_th2.inputs[1].default_value = 0.5
    L.new(gi.outputs["Thickness"], m_th2.inputs[0])

    prof = nd(N, "GeometryNodeCurvePrimitiveCircle", loc=(-600, 120), label="profile")
    prof.mode = 'RADIUS'
    prof.inputs["Resolution"].default_value = 8
    L.new(m_th2.outputs[0], prof.inputs["Radius"])

    c2m = nd(N, "GeometryNodeCurveToMesh", loc=(-400, 280), label="arch_ring")
    c2m.inputs["Fill Caps"].default_value = True
    L.new(m2c.outputs["Curve"],  c2m.inputs["Curve"])
    L.new(prof.outputs["Curve"], c2m.inputs["Profile Curve"])

    # ── Pillars ───────────────────────────────────────────────────────────────
    m_ph2 = nd(N, "ShaderNodeMath", loc=(-2000, -100), label="pillarH/2")
    m_ph2.operation = 'MULTIPLY'
    m_ph2.inputs[1].default_value = 0.5
    L.new(gi.outputs["PillarH"], m_ph2.inputs[0])

    def make_pillar(x_sign: float, row_y: int, label: str):
        cube = nd(N, "GeometryNodeMeshCube", loc=(-1800, row_y), label=label)
        sz   = nd(N, "ShaderNodeCombineXYZ", loc=(-1600, row_y), label=f"{label}_sz")
        L.new(gi.outputs["Thickness"], sz.inputs["X"])
        L.new(gi.outputs["Depth"],     sz.inputs["Y"])
        L.new(gi.outputs["PillarH"],   sz.inputs["Z"])
        L.new(sz.outputs["Vector"], cube.inputs["Size"])

        m_px = nd(N, "ShaderNodeMath", loc=(-1600, row_y - 90), label=f"{label}_px")
        m_px.operation = 'MULTIPLY'
        m_px.inputs[1].default_value = x_sign
        L.new(m_hw.outputs[0], m_px.inputs[0])

        pos = nd(N, "ShaderNodeCombineXYZ", loc=(-1400, row_y), label=f"{label}_pos")
        L.new(m_px.outputs[0],  pos.inputs["X"])
        L.new(m_ph2.outputs[0], pos.inputs["Z"])

        txfm = nd(N, "GeometryNodeTransform", loc=(-1200, row_y), label=f"{label}_tr")
        L.new(cube.outputs["Mesh"],      txfm.inputs["Geometry"])
        L.new(pos.outputs["Vector"],     txfm.inputs["Translation"])
        return txfm

    r_pil = make_pillar(+1.0, -200, "right_pillar")
    l_pil = make_pillar(-1.0, -450, "left_pillar")

    jg = nd(N, "GeometryNodeJoinGeometry", loc=(100, 200))
    L.new(c2m.outputs["Mesh"],          jg.inputs["Geometry"])
    L.new(r_pil.outputs["Geometry"],    jg.inputs["Geometry"])
    L.new(l_pil.outputs["Geometry"],    jg.inputs["Geometry"])
    L.new(jg.outputs["Geometry"],       go.inputs["Geometry"])

    # ── Gizmo nodes ───────────────────────────────────────────────────────────
    # Pattern: same Group Input value → geometry AND → Gizmo node "Value".
    # Gizmo output → Group Output "Gizmos" (NodeSocketGizmo, multi-input).
    # BLENDER 5.1 VERIFY: type string = 'GeometryNodeGizmoLinear'.

    # Width gizmo — right shoulder at (Width/2 + offset, 0, Height/2)
    gz_wx = nd(N, "ShaderNodeMath", loc=(-400, -200), label="gz_w_x")
    gz_wx.operation = 'ADD'
    gz_wx.inputs[1].default_value = GZ_OFFSET
    L.new(m_hw.outputs[0], gz_wx.inputs[0])

    gz_wz = nd(N, "ShaderNodeMath", loc=(-400, -300), label="gz_w_z")
    gz_wz.operation = 'MULTIPLY'
    gz_wz.inputs[1].default_value = 0.5
    L.new(gi.outputs["Height"], gz_wz.inputs[0])

    gz_w_pos = nd(N, "ShaderNodeCombineXYZ", loc=(-200, -250), label="gz_w_pos")
    L.new(gz_wx.outputs[0], gz_w_pos.inputs["X"])
    L.new(gz_wz.outputs[0], gz_w_pos.inputs["Z"])

    gz_w = nd(N, "GeometryNodeGizmoLinear", loc=(100, -200), label="width_gizmo")
    gz_w.inputs["Direction"].default_value = (1.0, 0.0, 0.0)
    L.new(gi.outputs["Width"],        gz_w.inputs["Value"])
    L.new(gz_w_pos.outputs["Vector"], gz_w.inputs["Position"])

    # Height gizmo — directly above crown at (0, 0, Height + offset)
    gz_hz = nd(N, "ShaderNodeMath", loc=(-400, -450), label="gz_h_z")
    gz_hz.operation = 'ADD'
    gz_hz.inputs[1].default_value = GZ_OFFSET
    L.new(gi.outputs["Height"], gz_hz.inputs[0])

    gz_h_pos = nd(N, "ShaderNodeCombineXYZ", loc=(-200, -450), label="gz_h_pos")
    L.new(gz_hz.outputs[0], gz_h_pos.inputs["Z"])

    gz_h = nd(N, "GeometryNodeGizmoLinear", loc=(100, -400), label="height_gizmo")
    gz_h.inputs["Direction"].default_value = (0.0, 0.0, 1.0)
    L.new(gi.outputs["Height"],       gz_h.inputs["Value"])
    L.new(gz_h_pos.outputs["Vector"], gz_h.inputs["Position"])

    # Both gizmo outputs connect to the same "Gizmos" socket (multi-input).
    # If this errors, insert a GeometryNodeJoinGizmos node between them.
    L.new(gz_w.outputs["Gizmo"], go.inputs["Gizmos"])
    L.new(gz_h.outputs["Gizmo"], go.inputs["Gizmos"])

    return nt


def main() -> None:
    reset_scene()
    obj = make_seed_object()
    build_gn_tree(obj)
    bpy.ops.wm.save_mainfile(filepath="//roman_arch_gizmos.blend")
    print("[holoflow] roman_arch_gizmos.blend saved.")


main()
