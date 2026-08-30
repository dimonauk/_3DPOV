"""
record.py — Moore-Spiegel Oscillator viewport render
Outputs: public/library/videos/scripting/<slug>/viewport.mp4
Duration: 216 frames @ 24 fps = 9 seconds
Camera orbits 300° while shape-keys morph: Basis→SK_Periodic→SK_Dense→SK_HighT→Basis.

Run after blueprint.py has built the MooreSpiegel_Amp object.
"""

import bpy
import math

SLUG   = "python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr"
OUTPUT = f"//../../videos/scripting/{SLUG}/viewport"
FPS    = 24
FRAMES = 216   # 9 seconds — full orbit + all four shape-key transitions

scene = bpy.context.scene
scene.render.engine                      = "BLENDER_WORKBENCH"
scene.render.fps                         = FPS
scene.frame_start                        = 1
scene.frame_end                          = FRAMES
scene.render.filepath                    = OUTPUT
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.resolution_percentage       = 100

# Workbench vertex-colour mode so MSp_Amplitude FLOAT_COLOR is visible
shading = scene.display.shading
shading.light               = "FLAT"
shading.color_type          = "VERTEX"
shading.show_object_outline = True

# ── Camera orbit rig ────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 85.0
cam_obj  = bpy.data.objects.new("RecCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

rig = bpy.data.objects.new("CamRig", None)
bpy.context.collection.objects.link(rig)
cam_obj.parent = rig
ELEV_RAD = math.radians(25)
CAM_DIST = 0.48
cam_obj.location       = (0.0, -CAM_DIST, CAM_DIST * math.sin(ELEV_RAD))
cam_obj.rotation_euler = (math.pi / 2 - ELEV_RAD, 0, 0)

rig.rotation_euler = (0, 0, 0)
rig.keyframe_insert("rotation_euler", frame=1)
rig.rotation_euler = (0, 0, math.radians(300))
rig.keyframe_insert("rotation_euler", frame=FRAMES)
for fc in rig.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Shape-key animation ──────────────────────────────────────────────────────
obj = bpy.data.objects.get("MooreSpiegel_Amp")
if obj and obj.data.shape_keys:
    keys = obj.data.shape_keys.key_blocks
    # Basis(1)→SK_Periodic(54)→SK_Dense(108)→SK_HighT(162)→Basis(216)
    schedule = [
        (1,   "Basis",       1.0),
        (54,  "SK_Periodic", 1.0),
        (108, "SK_Dense",    1.0),
        (162, "SK_HighT",    1.0),
        (216, "Basis",       1.0),
    ]
    for key in keys:
        key.value = 0.0
        key.keyframe_insert("value", frame=1)
    for frame, sk_name, val in schedule:
        for key in keys:
            key.value = val if key.name == sk_name else 0.0
            key.keyframe_insert("value", frame=frame)

bpy.ops.render.render(animation=True)
print(f"Viewport render complete → {OUTPUT}.mp4")
