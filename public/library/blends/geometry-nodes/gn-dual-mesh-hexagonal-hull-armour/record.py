"""
record.py — Viewport animation render for GN Dual Mesh Hull Armour (Blender 5.1)

Produces: public/library/videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/viewport.mp4
Duration: 5 s at 24 fps = 120 frames
Animation:
  F001–F060  Panel gap animates 0.0 → 0.88 (panels "separate" from solid sphere)
  F061–F120  Object rotates 360 ° on Z — full turntable reveal

Run from Blender's Script Editor after executing blueprint.py, OR from the CLI:
  blender --background hull_armour.blend --python record.py
"""

import bpy
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
FPS         = 24
FRAME_START = 1
FRAME_END   = 120        # 5 s
SEP_END     = 60         # panels fully separated by frame 60
ROT_START   = 61         # turntable starts
OUTPUT_PATH = "//../../videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/viewport"

OBJ_NAME  = "hull_armour"
TREE_NAME = "GN_DualMesh_HullArmour"

# ── SCENE SETTINGS ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps           = FPS
scene.frame_start          = FRAME_START
scene.frame_end            = FRAME_END
scene.render.resolution_x  = 1920
scene.render.resolution_y  = 1080
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath      = OUTPUT_PATH

# EEVEE settings for a clean viewport-quality render
scene.render.engine                       = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_bloom                     = False   # handled by compositor if desired
scene.eevee.shadow_cube_size              = '1024'
scene.eevee.taa_render_samples            = 16

# ── OBJECT & MODIFIER SETUP ───────────────────────────────────────────────────
# Re-run blueprint to ensure we have a clean starting state with the GN
# modifier unapplied, so we can animate the Gap socket.
#
# If blueprint.py already applied the modifier, rebuild a lightweight version:
obj = bpy.data.objects.get(OBJ_NAME)
if obj is None or TREE_NAME not in [m.name for m in obj.modifiers]:
    # Rebuild from scratch: add icosphere + unapplied modifier
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)
    obj      = bpy.context.active_object
    obj.name = OBJ_NAME

    mod = obj.modifiers.new(TREE_NAME, type='NODES')
    # Reuse existing node group if present from blueprint run
    if TREE_NAME in bpy.data.node_groups:
        mod.node_group = bpy.data.node_groups[TREE_NAME]

# Expose Panel Gap as an animatable Group Input socket so we can keyframe it.
# The GN tree's interface must have a Float socket named 'Panel Gap'.
ng = bpy.data.node_groups.get(TREE_NAME)
if ng:
    # Check if socket already exists; add if not
    existing = [s.name for s in ng.interface.items_tree if s.in_out == 'INPUT']
    if 'Panel Gap' not in existing:
        sock = ng.interface.new_socket(
            'Panel Gap', in_out='INPUT', socket_type='NodeSocketFloat'
        )
        sock.default_value = 0.88
        sock.min_value     = 0.0
        sock.max_value     = 1.0
        # Wire the socket to the Scale Elements 'Scale' input in the tree
        # (Assumes node named 'Scale Elements' exists; blueprint.py uses that label)
        for node in ng.nodes:
            if node.bl_idname == 'GeometryNodeScaleElements':
                grp_in = next(
                    (n for n in ng.nodes if n.bl_idname == 'NodeGroupInput'), None
                )
                if grp_in:
                    out_idx = len(grp_in.outputs) - 2  # last real output (before __extend__)
                    ng.links.new(grp_in.outputs[out_idx], node.inputs['Scale'])
                break

# ── KEYFRAME ANIMATION — PHASE 1: PANEL SEPARATION ───────────────────────────
# Frame 1: gap = 0.0 (panels touching, looks like solid sphere)
# Frame 60: gap = 0.88 (12 % gap between panels, full armour look)
mod = obj.modifiers.get(TREE_NAME)
if mod and mod.node_group:
    # The modifier exposes the 'Panel Gap' socket as a modifier property.
    # In Blender 4.0+, animated GN sockets are accessed via the modifier's
    # data path: modifiers["name"]["Socket_N"]
    # Get the socket identifier from the node group interface
    gap_socket_id = None
    for item in mod.node_group.interface.items_tree:
        if item.name == 'Panel Gap' and item.in_out == 'INPUT':
            gap_socket_id = item.identifier
            break

    if gap_socket_id:
        scene.frame_set(1)
        mod[gap_socket_id] = 0.0
        mod.keyframe_insert(f'["{gap_socket_id}"]', frame=1)

        scene.frame_set(SEP_END)
        mod[gap_socket_id] = 0.88
        mod.keyframe_insert(f'["{gap_socket_id}"]', frame=SEP_END)

        # Ease-in-out interpolation
        action = obj.animation_data.action if obj.animation_data else None
        if action:
            for fc in action.fcurves:
                if gap_socket_id in fc.data_path:
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'BEZIER'
                        kp.easing        = 'EASE_IN_OUT'

# ── KEYFRAME ANIMATION — PHASE 2: TURNTABLE ───────────────────────────────────
# Frame 61: rotation Z = 0 °
# Frame 120: rotation Z = 360 °
scene.frame_set(ROT_START)
obj.rotation_euler = (0.0, 0.0, 0.0)
obj.keyframe_insert('rotation_euler', frame=ROT_START)

scene.frame_set(FRAME_END)
obj.rotation_euler = (0.0, 0.0, math.radians(360.0))
obj.keyframe_insert('rotation_euler', frame=FRAME_END)

if obj.animation_data and obj.animation_data.action:
    for fc in obj.animation_data.action.fcurves:
        if 'rotation_euler' in fc.data_path and fc.array_index == 2:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"✓  viewport.mp4 written to {OUTPUT_PATH}.mp4")
