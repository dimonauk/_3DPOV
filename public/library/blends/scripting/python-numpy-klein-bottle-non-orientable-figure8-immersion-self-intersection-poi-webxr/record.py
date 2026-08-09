"""
Klein Bottle — Viewport animation record script.
Outputs: public/library/videos/scripting/
  python-numpy-klein-bottle-non-orientable-figure8-immersion-self-intersection-poi-webxr/
  viewport.mp4

Run AFTER blueprint.py has built the scene.
The camera orbits 360° over 120 frames at 24 fps (5 s).
Mid-animation: shape-key 'saddled' fades in (frames 40–80) then out,
so the viewer sees figure-8 → saddled → figure-8 morph.
"""

import bpy
import math

DIST     = 1.4     # camera distance (metres)
ELEV_DEG = 22.0    # camera elevation above equator
FRAMES   = 120     # total frames
FPS      = 24
OUT_PATH = "//../../videos/scripting/python-numpy-klein-bottle-non-orientable-figure8-immersion-self-intersection-poi-webxr/viewport"

scene = bpy.context.scene
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.fps            = FPS
scene.frame_start           = 1
scene.frame_end             = FRAMES
scene.render.filepath       = OUT_PATH
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"

# ── Camera orbit ─────────────────────────────────────────────────────────────
cam = scene.camera
elev = math.radians(ELEV_DEG)

for f in range(1, FRAMES + 1):
    t   = (f - 1) / FRAMES          # 0 → 1
    ang = 2 * math.pi * t           # full 360°

    cam.location.x = DIST * math.cos(ang) * math.cos(elev)
    cam.location.y = DIST * math.sin(ang) * math.cos(elev)
    cam.location.z = DIST * math.sin(elev)

    # Always look at origin
    dx = -cam.location.x
    dy = -cam.location.y
    dz = -cam.location.z
    cam.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz),
        0.0,
        math.atan2(dy, dx) + math.pi / 2,
    )
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

# ── Shape-key animation (saddled morph 40→80) ────────────────────────────────
obj = bpy.data.objects.get("hf_klein_bottle")
if obj and obj.data.shape_keys:
    sk = obj.data.shape_keys.key_blocks.get("saddled")
    if sk:
        sk.value = 0.0; sk.keyframe_insert("value", frame=1)
        sk.value = 0.0; sk.keyframe_insert("value", frame=39)
        sk.value = 1.0; sk.keyframe_insert("value", frame=60)
        sk.value = 0.0; sk.keyframe_insert("value", frame=81)
        sk.value = 0.0; sk.keyframe_insert("value", frame=FRAMES)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[holoflow] Klein bottle viewport render complete.")
