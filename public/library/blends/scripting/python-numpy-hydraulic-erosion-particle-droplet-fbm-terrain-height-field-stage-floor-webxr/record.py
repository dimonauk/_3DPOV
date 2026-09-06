"""
record.py — Viewport animation for Hydraulic Erosion terrain.
==============================================================
Produces:  public/library/videos/scripting/
  python-numpy-hydraulic-erosion-particle-droplet-fbm-terrain-height-field-stage-floor-webxr/
  viewport.mp4

Run AFTER blueprint.py (needs the 'hydraulic_erosion_floor' object).
Technique: camera orbits over the terrain while the shape-key value
animates from Basis → SK_Eroded → SK_Rivers → SK_Deposition,
showing erosion carving then the deposition phase.

Output: 15 seconds · 30 fps · 450 frames · 1920×1080
"""

import bpy, math

# ── parameters ────────────────────────────────────────────────────────────────
FPS       = 30
DURATION  = 15          # seconds
TOTAL_F   = FPS * DURATION
OUT_PATH  = "//../../videos/scripting/python-numpy-hydraulic-erosion-particle-droplet-fbm-terrain-height-field-stage-floor-webxr/viewport.mp4"

CAM_DIST   = 7.5        # orbit radius (m)
CAM_HEIGHT = 4.0        # camera height (m)
CAM_TILT   = math.radians(50)  # pitch down toward terrain

# Shape key animation keyframes (frame : key_name : value)
# 0-90   Basis (raw FBM)
# 90-180 blend in SK_Eroded
# 180-270 blend in SK_Rivers
# 270-360 blend in SK_Deposition
# 360-450 hold SK_Deposition


def clear_animation():
    """Remove all existing animation from shape keys on target object."""
    ob = bpy.data.objects.get("hydraulic_erosion_floor")
    if ob and ob.data.shape_keys:
        ob.data.shape_keys.animation_data_clear()


def animate_shape_keys(ob):
    keys = ob.data.shape_keys.key_blocks
    sk_names = ["Basis", "SK_Eroded", "SK_Rivers", "SK_Deposition"]

    def set_kf(name, frame, value):
        if name in keys:
            keys[name].value = value
            keys[name].keyframe_insert("value", frame=frame)

    # Basis visible frames 1-90
    set_kf("SK_Eroded",     1,   0.0)
    set_kf("SK_Rivers",     1,   0.0)
    set_kf("SK_Deposition", 1,   0.0)

    # Blend from Basis → SK_Eroded over frames 90-180
    set_kf("SK_Eroded",    90,   0.0)
    set_kf("SK_Eroded",   180,   1.0)

    # Blend SK_Eroded out while SK_Rivers in: 180-270
    set_kf("SK_Eroded",   270,   0.0)
    set_kf("SK_Rivers",   180,   0.0)
    set_kf("SK_Rivers",   270,   1.0)

    # Blend SK_Rivers out while SK_Deposition in: 270-360
    set_kf("SK_Rivers",   360,   0.0)
    set_kf("SK_Deposition", 270, 0.0)
    set_kf("SK_Deposition", 360, 1.0)
    set_kf("SK_Deposition", TOTAL_F, 1.0)

    # Make Basis always-on background
    set_kf("Basis",   1,   1.0)
    set_kf("Basis", TOTAL_F, 1.0)


def setup_camera():
    bpy.ops.object.camera_add(location=(0, 0, 0))
    cam_ob = bpy.context.active_object
    cam_ob.name = "RecordCam"
    bpy.context.scene.camera = cam_ob

    # Orbit animation: full 360° over TOTAL_F frames
    for f in range(1, TOTAL_F + 1, 3):
        angle = 2 * math.pi * (f - 1) / TOTAL_F
        x = math.cos(angle) * CAM_DIST
        y = math.sin(angle) * CAM_DIST
        cam_ob.location = (x, y, CAM_HEIGHT)
        cam_ob.rotation_euler = (CAM_TILT, 0.0, angle + math.pi / 2)
        cam_ob.keyframe_insert("location", frame=f)
        cam_ob.keyframe_insert("rotation_euler", frame=f)

    # Smooth interpolation
    if cam_ob.animation_data:
        for fc in cam_ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
    return cam_ob


def setup_lighting():
    # Sun lamp for terrain definition
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 8))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(45), math.radians(20), math.radians(30))
    # Ambient fill
    bpy.ops.object.light_add(type='AREA', location=(-2, 2, 5))
    fill = bpy.context.active_object
    fill.data.energy = 200.0
    fill.data.size = 4.0


def setup_render():
    scn = bpy.context.scene
    scn.frame_start = 1
    scn.frame_end   = TOTAL_F
    scn.render.fps   = FPS
    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.filepath      = OUT_PATH
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format     = 'MPEG4'
    scn.render.ffmpeg.codec      = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    # Use EEVEE for fast viewport-quality render
    scn.render.engine = 'BLENDER_EEVEE_NEXT'


# ── Main ──────────────────────────────────────────────────────────────────────

ob = bpy.data.objects.get("hydraulic_erosion_floor")
if ob is None:
    raise RuntimeError("Run blueprint.py first to create 'hydraulic_erosion_floor'.")

clear_animation()
animate_shape_keys(ob)
setup_camera()
setup_lighting()
setup_render()

print("Record setup complete. Render with:")
print("  bpy.ops.render.render(animation=True)")
