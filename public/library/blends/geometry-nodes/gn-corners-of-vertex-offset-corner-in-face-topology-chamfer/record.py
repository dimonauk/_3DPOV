"""
record.py — viewport animation render for topology_trim_panel (Blender 5.1)
Produces a 150-frame (5 s @ 30 fps) turntable + slow zoom that reveals the
three-zone trim classification.  Run AFTER blueprint.py.

Output: public/library/videos/geometry-nodes/
        gn-corners-of-vertex-offset-corner-in-face-topology-chamfer/viewport.mp4
"""

import bpy, math, os

FRAMES      = 150
FPS         = 30
RESOLUTION  = (1920, 1080)
OUTPUT_DIR  = "//../../videos/geometry-nodes/" \
              "gn-corners-of-vertex-offset-corner-in-face-topology-chamfer/"
OUTPUT_FILE = "viewport"

scn = bpy.context.scene
scn.render.engine          = 'BLENDER_EEVEE_NEXT'
scn.render.fps             = FPS
scn.frame_start            = 1
scn.frame_end              = FRAMES
scn.render.resolution_x    = RESOLUTION[0]
scn.render.resolution_y    = RESOLUTION[1]
scn.render.resolution_percentage = 100
scn.render.film_transparent = False
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format        = 'MPEG4'
scn.render.ffmpeg.codec         = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.filepath = bpy.path.abspath(os.path.join(OUTPUT_DIR, OUTPUT_FILE))

# ── camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
scn.collection.objects.link(cam_obj)
scn.camera = cam_obj

# Orbit path: start from slight top-front angle, full 360° rotation, mild zoom.
# z_start=2.8 gives a 35° elevation — shows both the face surface and depth gaps.
ORBIT_R  = 5.0
Z_HEIGHT = 2.8

def place_camera(frame, angle_deg, radius):
    rad = math.radians(angle_deg)
    cam_obj.location = (
        math.sin(rad) * radius,
        -math.cos(rad) * radius,
        Z_HEIGHT,
    )
    # Point at scene origin
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    dz = -cam_obj.location.z
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz),
        0.0,
        math.atan2(dx, dy),
    )
    cam_obj.keyframe_insert('location', frame=frame)
    cam_obj.keyframe_insert('rotation_euler', frame=frame)

# Frame 1: face-on front view
place_camera(1,    0.0,  ORBIT_R)
# Frame 50: 120° — shows the corner-trim detail (orange corner)
place_camera(50,  120.0, ORBIT_R * 0.85)
# Frame 100: 240° — opposite corner, edge-trim ring visible
place_camera(100, 240.0, ORBIT_R * 0.85)
# Frame 150: back to start, zoom out to full view
place_camera(150,  0.0, ORBIT_R)

for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# ── lighting ─────────────────────────────────────────────────────────────────
world = scn.world
if world is None:
    world = bpy.data.worlds.new("RecordWorld")
    scn.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value    = (0.04, 0.04, 0.06, 1.0)
    bg.inputs['Strength'].default_value = 0.6

sun = bpy.data.lights.new("RecordSun", 'SUN')
sun.energy = 3.5
sun.angle  = math.radians(5)
sun_obj = bpy.data.objects.new("RecordSun", sun)
sun_obj.rotation_euler = (math.radians(55), 0, math.radians(30))
scn.collection.objects.link(sun_obj)

fill = bpy.data.lights.new("RecordFill", 'AREA')
fill.energy = 1.2
fill.size   = 4.0
fill_obj = bpy.data.objects.new("RecordFill", fill)
fill_obj.location       = (-3, -2, 3)
fill_obj.rotation_euler = (math.radians(45), 0, math.radians(-30))
scn.collection.objects.link(fill_obj)

# ── eevee settings ────────────────────────────────────────────────────────────
eevee = scn.eevee
eevee.taa_render_samples = 16
if hasattr(eevee, 'use_gtao'):
    eevee.use_gtao = True

os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"✓ viewport.mp4 rendered → {OUTPUT_DIR}{OUTPUT_FILE}")
