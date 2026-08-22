"""holoflow_macros.gn_trim_curve_reveal
Blender 5.1 macro — attach a Trim Curve reveal animation to any curve object.

Wraps the object in a Geometry Nodes modifier whose Draw_End socket is
keyframed from 0.0 (frame_start) to 1.0 (frame_end) with EASE_IN interpolation.
Works on any incoming curve — spiral, Bézier, polyline — because TrimCurve
FACTOR mode is length-agnostic.

CC0 — public domain.

Usage:
    from holoflow_macros.gn_trim_curve_reveal import apply_trim_curve_reveal
    apply_trim_curve_reveal(obj, tube_radius=0.025, frame_start=1, frame_end=60)
"""

import bpy

GN_TREE_NAME = "HF_TrimCurveReveal"


def _n(nodes: bpy.types.Nodes, idname: str) -> bpy.types.Node:
    return nodes.new(idname)


def build_trim_curve_reveal_tree(
    tube_radius: float = 0.025,
    tube_segs: int = 8,
    tree_name: str = GN_TREE_NAME,
) -> tuple[bpy.types.GeometryNodeTree, str]:
    """
    Build (or replace) the HF_TrimCurveReveal node tree.

    Returns (node_tree, draw_end_identifier) so the caller can keyframe
    the socket via mod[draw_end_id].

    tube_radius: world-space radius of the swept tube profile.
    tube_segs:   sides on the profile circle (8 = octagonal, studio default).
    """
    if tree_name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[tree_name])

    ng: bpy.types.GeometryNodeTree = bpy.data.node_groups.new(
        tree_name, "GeometryNodeTree"
    )

    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="INPUT",
                            socket_type="NodeSocketGeometry")

    de = ng.interface.new_socket("Draw_End", in_out="INPUT",
                                  socket_type="NodeSocketFloat")
    de.default_value = 1.0
    de.min_value     = 0.0
    de.max_value     = 1.0
    draw_end_id = de.identifier

    lr = ng.interface.new_socket("Line_Radius", in_out="INPUT",
                                  socket_type="NodeSocketFloat")
    lr.default_value = tube_radius
    lr.min_value     = 0.001
    lr.max_value     = 0.5

    g_in  = _n(ng.nodes, "NodeGroupInput")
    g_out = _n(ng.nodes, "NodeGroupOutput")

    # Trim Curve — clips incoming geometry curve to [0, Draw_End]
    trim = _n(ng.nodes, "GeometryNodeTrimCurve")
    trim.mode = "FACTOR"
    trim.inputs["Start"].default_value = 0.0

    # Octagonal profile swept along the trimmed arc
    profile = _n(ng.nodes, "GeometryNodeCurvePrimitiveCircle")
    profile.inputs["Resolution"].default_value = tube_segs

    ctm = _n(ng.nodes, "GeometryNodeCurveToMesh")
    ctm.inputs["Fill Caps"].default_value = True

    shade = _n(ng.nodes, "GeometryNodeSetShadeSmooth")
    shade.domain = "FACE"
    shade.inputs["Shade Smooth"].default_value = True

    lk = ng.links.new
    lk(g_in.outputs["Geometry"],   trim.inputs["Curve"])
    lk(g_in.outputs["Draw_End"],   trim.inputs["End"])
    lk(g_in.outputs["Line_Radius"], profile.inputs["Radius"])
    lk(trim.outputs["Curve"],      ctm.inputs["Curve"])
    lk(profile.outputs["Curve"],   ctm.inputs["Profile Curve"])
    lk(ctm.outputs["Mesh"],        shade.inputs["Geometry"])
    lk(shade.outputs["Geometry"],  g_out.inputs["Geometry"])

    return ng, draw_end_id


def apply_trim_curve_reveal(
    obj: bpy.types.Object,
    tube_radius: float = 0.025,
    tube_segs: int = 8,
    frame_start: int = 1,
    frame_end: int = 60,
    tree_name: str = GN_TREE_NAME,
) -> None:
    """
    Attach a Trim Curve reveal GN modifier to obj and bake Draw_End keyframes.

    obj must be a Curve object (or a mesh object whose geometry will be
    passed through the GN tree — the Spiral blueprint uses a Plane as the
    host object because GN replaces it entirely).
    """
    ng, draw_end_id = build_trim_curve_reveal_tree(
        tube_radius=tube_radius,
        tube_segs=tube_segs,
        tree_name=tree_name,
    )

    mod = obj.modifiers.new(tree_name, "NODES")
    mod.node_group = ng

    scene = bpy.context.scene
    mod[draw_end_id] = 0.0
    mod.keyframe_insert(data_path=f'["{draw_end_id}"]', frame=frame_start)
    mod[draw_end_id] = 1.0
    mod.keyframe_insert(data_path=f'["{draw_end_id}"]', frame=frame_end)

    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "EASE_IN"
