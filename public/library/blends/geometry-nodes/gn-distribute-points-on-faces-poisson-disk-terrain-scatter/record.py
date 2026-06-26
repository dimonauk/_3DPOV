"""
Blender 5.1 — record.py
GN Distribute Points on Faces: Poisson-Disk Terrain Scatter

Renders a 6-second (180 frame, 30 fps) camera orbit showing the finished
scatter from 360 °.  A turntable reveal is the clearest way to demonstrate
that distribution is uniform across the terrain, that cliff faces are empty,
and that rock scale/rotation variety reads from every angle.

Run after blueprint.py (the terrain + scatter must already be in the scene):
  blender -b terrain_scatter.blend --python record.py

Output: public/library/videos/geometry-nodes/
        gn-distribute-points-on-faces-poisson-disk-terrain-scatter/viewport.mp4
"""

import bpy
import math

# ── Parameters ─────────────────────────────────────────────────────────────
FRAMES      = 180        # 6 s at 30 fps
FPS         = 30
CAM_DIST    = 14.0       # orbit radius (metres)
CAM_HEIGHT  = 5.5        # camera elevation above terrain centre
CAM_FOCUS   = 0.0        # Z of the point the camera looks at
OUTPUT_PATH = "//../../videos/geometry-nodes/" \
              "gn-distribute-points-on-faces-poisson-disk-terrain-scatter/viewport"
RESOLUTION  = (1920, 1080)
SAMPLES     = 32          # Cycles samples — enough for clean preview render


# ── Scene / render settings ─────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format       = "MPEG4"
scene.render.ffmpeg.codec        = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUTPUT_PATH

# Use EEVEE Next for a fast but correct preview render
scene.render.engine = "BLENDER_EEVEE_NEXT"


# ── Lighting ──────────────────────────────────────────────────────────────────
def setup_lighting():
    sun_data = bpy.data.lights.new("sun", "SUN")
    sun_data.energy = 3.0
    sun_data.angle  = math.radians(5)
    sun = bpy.data.objects.new("sun", sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(55), 0.0, math.radians(30))

    # Sky (world)
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value   = (0.5, 0.65, 0.9, 1.0)
        bg.inputs["Strength"].default_value = 0.4


# ── Camera orbit ──────────────────────────────────────────────────────────────
def setup_camera():
    """
    Empty at scene origin acts as the orbit pivot.
    Camera parented to the empty with a constant offset.
    Animating the empty's Z rotation by 360 ° over FRAMES gives a smooth orbit
    without needing to recalculate camera position per frame.
    """
    pivot = bpy.data.objects.new("cam_pivot", None)
    bpy.context.collection.objects.link(pivot)
    pivot.location = (0.0, 0.0, CAM_FOCUS)

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 35.0
    cam_data.clip_end = 200.0
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.parent = pivot
    cam.location = (CAM_DIST, 0.0, CAM_HEIGHT)

    # Point camera at the terrain centre
    track = cam.constraints.new("TRACK_TO")
    track.target       = pivot
    track.track_axis   = "TRACK_NEGATIVE_Z"
    track.up_axis      = "UP_Y"

    scene.camera = cam

    # Keyframe: Z rotation 0 → 360 ° over the full frame range
    pivot.rotation_euler = (0.0, 0.0, 0.0)
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler = (0.0, 0.0, math.tau)
    pivot.keyframe_insert("rotation_euler", frame=FRAMES)

    # Linear interpolation so speed is constant
    for fcurve in pivot.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"

    return cam


# ── Run ──────────────────────────────────────────────────────────────────────
setup_lighting()
setup_camera()
bpy.ops.render.render(animation=True)
print("✓ Viewport render complete →", OUTPUT_PATH)
