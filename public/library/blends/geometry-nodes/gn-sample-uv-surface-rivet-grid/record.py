"""
record.py — viewport animation render for gn-sample-uv-surface-rivet-grid
Output: public/library/videos/geometry-nodes/gn-sample-uv-surface-rivet-grid/viewport.mp4

ANIMATION CONCEPT (120 frames at 24fps = 5 seconds)
─────────────────────────────────────────────────────
Frames  1–30:  Camera orbits from 45° to 90° (right side view), revealing
               the rivet grid from a raking angle that shows the surface warp.
Frames 31–60:  Noise strength ramps up (0.14 → 0.28 m) — hull deforms, rivets
               follow the surface exactly.  Demonstrates UV addressing stability.
Frames 61–90:  Noise strength ramps back down (0.28 → 0.14 m).
Frames 91–120: Camera orbits back to start position.  Slow, clean finish.
"""

import bpy
import math

# ─── RUN BLUEPRINT FIRST ──────────────────────────────────────────────────────
exec(open("blueprint.py").read())

hull     = bpy.data.objects['hull_panel']
gn_mod   = hull.modifiers['RivetGrid']
tree     = gn_mod.node_group
nodes    = tree.nodes
FRAMES   = 120
FPS      = 24
CAM_DIST = 3.8
CAM_Z    = 1.2

# ─── CAMERA ───────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -CAM_DIST, CAM_Z))
cam = bpy.context.active_object
cam.name = "record_cam"
cam.data.lens = 50
# Point at scene origin
bpy.ops.object.constraint_add(type='TRACK_TO')
cam.constraints['Track To'].target    = hull
cam.constraints['Track To'].track_axis = 'TRACK_NEGATIVE_Z'
cam.constraints['Track To'].up_axis   = 'UP_Y'
bpy.context.scene.camera = cam

# ─── LIGHTING ─────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(4, -3, 6))
sun = bpy.context.active_object
sun.data.energy = 3.0
sun.data.angle  = math.radians(5.0)

bpy.ops.object.light_add(type='AREA', location=(-3, 2, 3))
fill = bpy.context.active_object
fill.data.energy = 80.0
fill.data.size   = 3.0

# ─── KEYFRAME CAMERA ORBIT ────────────────────────────────────────────────────
# Animate camera X/Y position to orbit around Z axis
def set_cam_orbit(frame, angle_deg):
    angle_rad = math.radians(angle_deg)
    cam.location = (
        math.sin(angle_rad) * CAM_DIST,
        -math.cos(angle_rad) * CAM_DIST,
        CAM_Z,
    )
    cam.keyframe_insert('location', frame=frame)


set_cam_orbit(1,    0.0)
set_cam_orbit(30,  45.0)
set_cam_orbit(91,  45.0)
set_cam_orbit(120,  0.0)

# ─── KEYFRAME NOISE STRENGTH (via node default value) ─────────────────────────
# Find the MapRange node in the tree (controls warp strength)
remap_node = next(
    n for n in nodes
    if n.bl_idname == 'ShaderNodeMapRange'
)

def set_noise_strength(frame, value):
    remap_node.inputs['To Max'].default_value = value
    remap_node.inputs['To Max'].keyframe_insert('default_value', frame=frame)
    remap_node.inputs['To Min'].default_value = -value
    remap_node.inputs['To Min'].keyframe_insert('default_value', frame=frame)


set_noise_strength(1,    0.14)
set_noise_strength(30,   0.14)
set_noise_strength(60,   0.28)   # peak warp — rivets visibly hug the curved surface
set_noise_strength(90,   0.14)
set_noise_strength(120,  0.14)

# ─── RENDER SETTINGS ──────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = FRAMES
sc.render.fps  = FPS

sc.render.engine            = 'BLENDER_EEVEE_NEXT'
sc.eevee.use_bloom          = True
sc.eevee.bloom_intensity    = 0.05

sc.render.resolution_x      = 1920
sc.render.resolution_y      = 1080
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format     = 'MPEG4'
sc.render.ffmpeg.codec      = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'

import os
sc.render.filepath = os.path.join(
    bpy.path.abspath("//"),
    "../../videos/geometry-nodes/gn-sample-uv-surface-rivet-grid/viewport.mp4",
)

bpy.ops.render.render(animation=True)
print("Render complete →", sc.render.filepath)
