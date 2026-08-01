"""
record.py — viewport animation for the Weierstrass-Enneper tutorial.

Outputs:
    public/library/videos/scripting/
        python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr/
        viewport.mp4

Run after blueprint.py.  The animation has three acts:
  F001–080  Slow orbit around the catenoid, Shape Key morphing to helicoid
  F081–160  Full orbit around the helicoid
  F161–240  Pull back to show all three surfaces; pan left-to-right

Total: 240 frames at 30 fps → 8 s.
"""
import bpy
import math

FRAME_START   = 1
FRAME_END     = 240
ORBIT_RADIUS  = 14.0
CENTER_HEIGHT = 1.5
SEP_X         = 6.0
OUTPUT_PATH   = (
    "//../../videos/scripting/"
    "python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr/"
    "viewport"
)

bpy.context.scene.frame_start = FRAME_START
bpy.context.scene.frame_end   = FRAME_END
bpy.context.scene.render.fps  = 30

bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
bpy.context.scene.eevee.use_bloom      = True
bpy.context.scene.eevee.bloom_threshold = 0.40
bpy.context.scene.eevee.bloom_intensity = 0.22

bpy.context.scene.render.image_settings.file_format = "FFMPEG"
bpy.context.scene.render.ffmpeg.format              = "MPEG4"
bpy.context.scene.render.ffmpeg.codec               = "H264"
bpy.context.scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.render.filepath     = OUTPUT_PATH

cam = bpy.context.scene.camera
if cam is None:
    raise RuntimeError("Run blueprint.py first.")
cam.rotation_mode = "XYZ"

# Find catenoid to drive Shape Key
cat_obj = bpy.data.objects.get("hf_catenoid")
if cat_obj and cat_obj.data.shape_keys:
    kb = cat_obj.data.shape_keys
    # We animate the value of the final Shape Key to trigger the morph
    last_key = kb.key_blocks[-1]

for frame in range(FRAME_START, FRAME_END + 1):
    t = (frame - FRAME_START) / (FRAME_END - FRAME_START)   # 0 → 1

    # Act split
    if frame <= 80:
        # Orbit around catenoid (x = -SEP_X); morph Shape Key 0 → 1
        t_act = (frame - 1) / 79.0
        focus_x = -SEP_X
        angle   = math.tau * t_act * 0.6
        r       = ORBIT_RADIUS * 0.75
        morph   = t_act          # catenoid → helicoid Shape Key value
    elif frame <= 160:
        # Orbit the helicoid (x = 0)
        t_act   = (frame - 81) / 79.0
        focus_x = 0.0
        angle   = math.tau * t_act
        r       = ORBIT_RADIUS * 0.75
        morph   = 1.0
    else:
        # Pull back; show all three
        t_act   = (frame - 161) / 79.0
        focus_x = 0.0
        angle   = math.pi * 0.5 + math.tau * t_act * 0.25
        r       = ORBIT_RADIUS * 1.6
        morph   = 1.0

    cx = r * math.sin(angle) + focus_x
    cy = -r * math.cos(angle)
    cz = CENTER_HEIGHT + r * 0.25

    cam.location        = (cx, cy, cz)
    cam.rotation_euler  = (math.pi * 0.40, 0.0, angle + math.pi)
    cam.keyframe_insert(data_path="location",       frame=frame)
    cam.keyframe_insert(data_path="rotation_euler", frame=frame)

    # Drive Shape Key morph
    if cat_obj and cat_obj.data.shape_keys:
        last_key.value = morph
        last_key.keyframe_insert(data_path="value", frame=frame)

for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

bpy.ops.render.render(animation=True)
print("Record complete →", OUTPUT_PATH)
