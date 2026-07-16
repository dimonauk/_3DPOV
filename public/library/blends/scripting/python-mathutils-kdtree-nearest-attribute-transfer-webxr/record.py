"""
record.py — viewport render for KDTree attribute transfer tutorial.

Run AFTER blueprint.py has created attr_transfer.blend.
Outputs a 90-frame turntable (3 s at 30 fps) showing both the hi-res source
and the lo-res target side by side, with the transferred vertex colours
displayed in Workbench VERTEX shading mode.

Output: public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
import math

SLUG      = "python-mathutils-kdtree-nearest-attribute-transfer-webxr"
VIDEO_DIR = f"//../../../../videos/scripting/{SLUG}/"
FRAME_END = 90

scene          = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END

# ── camera ───────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(1.3, -5.0, 1.4))
cam = bpy.context.active_object
cam.name = "record_cam"
scene.camera = cam

# Track to the midpoint between the two spheres
empty = bpy.data.objects.new("cam_target", None)
empty.location = (1.3, 0.0, 0.0)
scene.collection.objects.link(empty)
ct = cam.constraints.new('TRACK_TO')
ct.target     = empty
ct.track_axis = 'TRACK_NEGATIVE_Z'
ct.up_axis    = 'UP_Y'

# Orbit the centre point over 90 frames
ORBIT_RADIUS = 5.0
ORBIT_HEIGHT = 1.4
for f in range(1, FRAME_END + 1):
    angle = (f - 1) / FRAME_END * 2 * math.pi
    cam.location = (
        1.3 + ORBIT_RADIUS * math.sin(angle),
        -ORBIT_RADIUS * math.cos(angle),
        ORBIT_HEIGHT,
    )
    cam.keyframe_insert("location", frame=f)

# ── lighting ─────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(3, 5, 8))
sun = bpy.context.active_object
sun.data.energy = 2.5

# ── render settings (Workbench for speed + vertex colour) ────────────────────
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light      = 'STUDIO'
scene.display.shading.color_type = 'VERTEX'   # shows transferred ao_baked
scene.display.shading.show_object_outline = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps          = 30

scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = VIDEO_DIR + "viewport"

bpy.ops.render.render(animation=True, write_still=False)
print(f"[record] viewport.mp4 → {VIDEO_DIR}")
