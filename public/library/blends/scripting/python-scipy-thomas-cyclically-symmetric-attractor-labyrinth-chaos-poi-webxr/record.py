"""
record.py — Viewport animation record for Thomas attractor tutorial.

Run with: blender --background --python record.py
Outputs: public/library/videos/scripting/python-scipy-thomas-.../viewport.mp4

Renders 192 frames (6.4 s at 30 fps) of a smooth orbit around the three
interlocked poi trails. Uses Blender's OpenGL viewport render (RENDER_OPENGL)
rather than Cycles — fast enough for screen-capture reference, consistent
across hardware, no material baking required.
"""

import bpy
import math

# ── Constants ─────────────────────────────────────────────────────────────────
SLUG        = "python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr"
OUTPUT_PATH = f"//../../videos/scripting/{SLUG}/viewport"  # Blender //→blend dir
FPS         = 30
FRAMES      = 192   # 6.4 s — enough for one full orbit plus a second look
RES_X       = 1920
RES_Y       = 1080
ORBIT_R     = 4.5   # camera orbit radius (metres)
ORBIT_Z     = 1.2   # camera height above attractor centroid
FOCAL       = 50    # lens focal length (mm) — moderate telephoto for compression

# ── Scene ─────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_PATH

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("HF_Cam")
cam_data.lens = FOCAL
cam_obj  = bpy.data.objects.new("HF_Cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Orbit target — empty at attractor centroid
target = bpy.data.objects.new("Orbit_Target", None)
target.location = (0.0, 0.0, 0.0)
bpy.context.scene.collection.objects.link(target)

# Track-to constraint keeps camera facing the centroid at all frames
con = cam_obj.constraints.new("TRACK_TO")
con.target     = target
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis    = "UP_Y"

# Keyframe the camera position in a circle — one full orbit over FRAMES
for f in range(1, FRAMES + 1):
    t     = (f - 1) / FRAMES
    angle = 2 * math.pi * t
    cam_obj.location = (
        ORBIT_R * math.cos(angle),
        ORBIT_R * math.sin(angle),
        ORBIT_Z,
    )
    cam_obj.keyframe_insert("location", frame=f)

# Set interpolation to LINEAR so the orbit speed is constant
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Lighting — emission only, world already black ─────────────────────────────
# The attractor tubes use self-emission material; no additional lights needed.
# A very faint ambient point light prevents absolute black in screen captures.
lamp_data   = bpy.data.lights.new("Fill", "POINT")
lamp_data.energy = 0.5
lamp_obj    = bpy.data.objects.new("Fill", lamp_data)
lamp_obj.location = (0, 0, 3)
bpy.context.scene.collection.objects.link(lamp_obj)

# ── Viewport shading for OpenGL render ───────────────────────────────────────
space = None
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        space = area.spaces.active
        break

if space:
    space.shading.type           = "MATERIAL"  # show emission materials
    space.shading.use_scene_lights = True

# ── Render ────────────────────────────────────────────────────────────────────
# Run the blueprint first so objects exist; this script only animates & renders.
# bpy.ops.render.opengl(animation=True)   # uncomment when objects are present
print(f"Record script ready — {FRAMES} frames at {FPS} fps → {OUTPUT_PATH}.mp4")
print("Run blueprint.py first, then uncomment the render line above.")
