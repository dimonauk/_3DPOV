# ============================================================
# Blueprint — Python bpy.types.Curve Data API
# slug     : python-bpy-curve-data-bezier-nurbs-spline-api
# topic    : scripting
# blender  : 5.1
# licence  : CC0
# ============================================================
#
# WHY the data API instead of bpy.ops.curve.*:
#   Operators poll for an active 3D Viewport in Curve Edit Mode.
#   In a background / headless script that context never exists, and
#   operators silently no-op or raise RuntimeError without a useful
#   message. bpy.data.curves.new() is always available, deterministic,
#   and gives exact control over every handle, weight, and bevel
#   parameter without operator overhead.
#
# Studio use-case:
#   WebXR cable routes and motion paths are authored as JSON arrays
#   of control points in the Three.js spatial editor and imported
#   here to be visualised, refined, and re-exported as GLB geometry.

import bpy
import math
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────
CABLE_NAME         = "hf_cable_bezier"
RING_NAME          = "hf_ring_nurbs"
CABLE_BEVEL_DEPTH  = 0.04    # metres — matches Holoflow cable spec
CABLE_BEVEL_RES    = 4       # cross-section edge count (octagon)
CABLE_RESOLUTION_U = 6       # path sampling — default 12 is too dense for WebXR
RING_BEVEL_DEPTH   = 0.025
RING_BEVEL_RES     = 3
RING_CTRL_COUNT    = 8
RING_ORDER         = 4       # cubic-equivalent NURBS smoothness
RING_RADIUS        = 0.5
EXPORT_PATH        = "//cable_bezier.glb"


def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def link_obj(cu: bpy.types.Curve, name: str,
             offset_x: float = 0.0) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(obj)
    obj.location.x = offset_x
    return obj


# ── 1. Bézier S-Cable ───────────────────────────────────────
# Handle types and when to use them:
#   VECTOR  — handle collinear with line to neighbour; Blender recomputes
#             it automatically when the neighbour moves; produces a
#             straight segment with a sharp corner at that point.
#   AUTO    — Blender solves the smoothest possible handle; magnitude
#             also updates automatically; best for organic waypoints.
#   ALIGNED — both handles stay collinear but magnitudes are independent;
#             good for deliberate acceleration profiles.
#   FREE    — fully independent left and right; use for cusps/inflections.
#
# For a cable between two hard mount-points (VECTOR corners) and two
# organic mid-route waypoints (AUTO) this mixed approach produces the
# correct engineering shape with minimal control.
def make_bezier_cable() -> bpy.types.Object:
    cu             = bpy.data.curves.new(CABLE_NAME, type='CURVE')
    cu.dimensions  = '3D'
    cu.bevel_depth      = CABLE_BEVEL_DEPTH
    cu.bevel_resolution = CABLE_BEVEL_RES
    cu.fill_mode        = 'FULL'   # closes bevel end-caps
    cu.resolution_u     = CABLE_RESOLUTION_U

    spl = cu.splines.new(type='BEZIER')
    spl.bezier_points.add(3)  # new() gives 1 point; add(3) → 4 total

    # (co, handle_type, handle_left_co, handle_right_co)
    # For AUTO type Blender recomputes handles on evaluation;
    # explicit handle values are stored but overridden.
    data = [
        ((-1.0,-0.6, 0.0), 'VECTOR', (-1.4,-0.6, 0.0), (-0.6,-0.6, 0.0)),
        ((-0.3, 0.4,  0.3), 'AUTO',  None,              None),
        (( 0.3,-0.4,  0.3), 'AUTO',  None,              None),
        (( 1.0, 0.6,  0.0), 'VECTOR',( 0.6, 0.6, 0.0), ( 1.4, 0.6, 0.0)),
    ]

    for i, (co, ht, hl, hr) in enumerate(data):
        pt = spl.bezier_points[i]
        pt.co                 = Vector(co)
        pt.handle_left_type   = ht
        pt.handle_right_type  = ht
        if hl: pt.handle_left  = Vector(hl)
        if hr: pt.handle_right = Vector(hr)

    return link_obj(cu, CABLE_NAME)


# ── 2. NURBS Closed Ring ─────────────────────────────────────
# NURBS points have homogeneous (x, y, z, w) coordinates.
# w = weight; equal weights → uniform B-spline (no rational distortion).
# use_cyclic_u closes the loop across the last-to-first control-point gap.
# use_endpoint_u clamps the curve to touch first+last points; contradicts
#   cyclic — leave False for closed loops.
# order_u = degree + 1: value 4 → cubic smoothness, minimum order for
#   producing a visually circular NURBS ring.
def make_nurbs_ring() -> bpy.types.Object:
    cu                  = bpy.data.curves.new(RING_NAME, type='CURVE')
    cu.dimensions       = '3D'
    cu.bevel_depth      = RING_BEVEL_DEPTH
    cu.bevel_resolution = RING_BEVEL_RES
    cu.fill_mode        = 'FULL'

    spl                = cu.splines.new(type='NURBS')
    spl.points.add(RING_CTRL_COUNT - 1)  # new() gives 1 pt; add N-1 → total N
    spl.order_u        = RING_ORDER
    spl.use_cyclic_u   = True
    spl.use_endpoint_u = False

    for i, pt in enumerate(spl.points):
        angle = 2 * math.pi * i / RING_CTRL_COUNT
        pt.co = (
            math.cos(angle) * RING_RADIUS,
            math.sin(angle) * RING_RADIUS,
            0.0,
            1.0,   # uniform weight
        )

    return link_obj(cu, RING_NAME, offset_x=2.0)


# ── 3. bevel_factor animation (self-drawing cable) ───────────
# bevel_factor_start / bevel_factor_end (0–1) trim the tube geometry.
# Animating bevel_factor_end from 0 to 1 across a frame range produces
# a "self-writing" cable reveal without any Geometry Nodes.
def keyframe_reveal(cu: bpy.types.Curve,
                    frame_start: int, frame_end: int) -> None:
    cu.bevel_factor_end = 0.0
    cu.keyframe_insert('bevel_factor_end', frame=frame_start)
    cu.bevel_factor_end = 1.0
    cu.keyframe_insert('bevel_factor_end', frame=frame_end)


# ── 4. Convert to mesh for GLB export ────────────────────────
# glTF 2.0 has no native curve primitive; bevel geometry on a CurveData
# block cannot be exported directly. Conversion requires OBJECT mode +
# active + selected. After the call obj.data is a bpy.types.Mesh.
def convert_and_export(objects: list) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH', keep_original=False)

    bpy.ops.export_scene.gltf(
        filepath    = bpy.path.abspath(EXPORT_PATH),
        export_format = 'GLB',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
    )


def main() -> None:
    reset_scene()
    cable = make_bezier_cable()
    ring  = make_nurbs_ring()
    keyframe_reveal(cable.data, 1, 48)  # reveal the cable over 48 frames
    convert_and_export([cable, ring])
    print("Blueprint complete — cable_bezier.glb exported.")


if __name__ == "__main__":
    main()
