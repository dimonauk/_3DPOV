"""
record.py — Rössler Attractor viewport render
Outputs: public/library/videos/scripting/<slug>/viewport.mp4
Duration: 192 frames @ 24 fps = 8 seconds
Camera orbits 270° while shape-key morphs through all three variants.

Run after blueprint.py has built the Rössler_A object.
"""

import bpy
import math

SLUG   = "python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
OUTPUT = f"//../../videos/scripting/{SLUG}/viewport"
FPS    = 24
FRAMES = 192   # 8 seconds — enough to show the full orbit and all three shape keys

scene = bpy.context.scene
scene.render.engine          = "BLENDER_WORKBENCH"
scene.render.fps             = FPS
scene.frame_start            = 1
scene.frame_end              = FRAMES
scene.render.filepath        = OUTPUT
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format          = "MPEG4"
scene.render.ffmpeg.codec           = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.resolution_percentage = 100

# Workbench: vertex colour so the FLOAT_COLOR attribute is visible
shading = scene.display.shading
shading.light        = "FLAT"
shading.color_type   = "VERTEX"
shading.show_object_outline = True

# ── Camera ──────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 85.0
cam_obj  = bpy.data.objects.new("RecCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Orbit rig: empty at origin, camera as child offset along Y
rig = bpy.data.objects.new("CamRig", None)
bpy.context.collection.objects.link(rig)
cam_obj.parent = rig
ELEV_RAD = math.radians(28)
CAM_DIST = POI_RADIUS = 0.45
cam_obj.location = (0.0, -CAM_DIST, CAM_DIST * math.sin(ELEV_RAD))
cam_obj.rotation_euler = (math.pi/2 - ELEV_RAD, 0, 0)

# Animate rig: 270° orbit over FRAMES frames
rig.rotation_euler = (0, 0, 0)
rig.keyframe_insert("rotation_euler", frame=1)
rig.rotation_euler = (0, 0, math.radians(270))
rig.keyframe_insert("rotation_euler", frame=FRAMES)
for fc in rig.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Shape-key animation ──────────────────────────────────────────────────────
obj = bpy.data.objects.get("Rossler_A")
if obj and obj.data.shape_keys:
    keys = obj.data.shape_keys.key_blocks
    # Frames: 1=Basis, 48=SK_Periodic, 96=SK_Period2, 144=SK_Dense, 192=Basis
    schedule = [
        (1,   "Basis",       1.0),
        (48,  "SK_Periodic", 1.0),
        (96,  "SK_Period2",  1.0),
        (144, "SK_Dense",    1.0),
        (192, "Basis",       1.0),
    ]
    # Zero all keys at frame 1
    for key in keys:
        key.value = 0.0
        key.keyframe_insert("value", frame=1)

    for frame, sk_name, val in schedule:
        # Ramp up target key, ramp down others
        for key in keys:
            target_val = val if key.name == sk_name else 0.0
            key.value = target_val
            key.keyframe_insert("value", frame=frame)

# ── Render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Viewport render complete → {OUTPUT}.mp4")
