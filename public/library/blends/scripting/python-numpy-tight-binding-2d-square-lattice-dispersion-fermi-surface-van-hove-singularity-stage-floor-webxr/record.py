"""
record.py — Viewport animation render for the tight-binding band floor.
Outputs: public/library/videos/scripting/<slug>/viewport.mp4

Technique: orbit the camera around the band landscape while sweeping shape
keys from Basis → SK_NNN → SK_TriLattice → SK_DWave.  300 frames at 30 fps
= 10 s loop.  EEVEE_NEXT, 1920×1080.  No audio.

Run after blueprint.py has built and saved tb_band_floor.blend:
  blender --background tb_band_floor.blend --python record.py
"""

import bpy, math, os

SLUG       = "python-numpy-tight-binding-2d-square-lattice-dispersion-fermi-surface-van-hove-singularity-stage-floor-webxr"
OUT_DIR    = os.path.join(
    os.path.dirname(__file__),
    "../../../../public/library/videos/scripting",
    SLUG,
)
FRAMES     = 300
FPS        = 30
CAM_DIST   = 9.0      # metres from origin
CAM_ELEV   = 0.55     # radians elevation
BLOOM_STR  = 0.22

# ── shape key sweep schedule (frame : {key_name: value}) ──────────────────
KEY_SCHEDULE = {
    1:   {"Basis": 1.0, "SK_NNN": 0.0, "SK_TriLattice": 0.0, "SK_DWave": 0.0},
    60:  {"Basis": 1.0, "SK_NNN": 0.0, "SK_TriLattice": 0.0, "SK_DWave": 0.0},
    90:  {"Basis": 0.0, "SK_NNN": 1.0, "SK_TriLattice": 0.0, "SK_DWave": 0.0},
    150: {"Basis": 0.0, "SK_NNN": 1.0, "SK_TriLattice": 0.0, "SK_DWave": 0.0},
    180: {"Basis": 0.0, "SK_NNN": 0.0, "SK_TriLattice": 1.0, "SK_DWave": 0.0},
    240: {"Basis": 0.0, "SK_NNN": 0.0, "SK_TriLattice": 1.0, "SK_DWave": 0.0},
    270: {"Basis": 0.0, "SK_NNN": 0.0, "SK_TriLattice": 0.0, "SK_DWave": 1.0},
    300: {"Basis": 0.0, "SK_NNN": 0.0, "SK_TriLattice": 0.0, "SK_DWave": 1.0},
}


def setup_scene():
    scene = bpy.context.scene
    scene.render.engine           = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x     = 1920
    scene.render.resolution_y     = 1080
    scene.render.fps              = FPS
    scene.frame_start             = 1
    scene.frame_end               = FRAMES
    scene.eevee.use_bloom         = True
    scene.eevee.bloom_intensity   = BLOOM_STR

    os.makedirs(OUT_DIR, exist_ok=True)
    scene.render.filepath         = os.path.join(OUT_DIR, "viewport")
    scene.render.image_settings.file_format  = 'FFMPEG'
    scene.render.ffmpeg.format    = 'MPEG4'
    scene.render.ffmpeg.codec     = 'H264'
    scene.render.ffmpeg.audio_codec = 'NONE'


def add_camera():
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    bpy.context.scene.camera = cam
    return cam


def keyframe_camera(cam):
    for f in range(1, FRAMES + 1):
        angle = 2.0 * math.pi * (f - 1) / FRAMES    # full orbit
        cam.location.x = CAM_DIST * math.cos(angle) * math.cos(CAM_ELEV)
        cam.location.y = CAM_DIST * math.sin(angle) * math.cos(CAM_ELEV)
        cam.location.z = CAM_DIST * math.sin(CAM_ELEV)
        # Point camera at origin
        dx, dy, dz = -cam.location.x, -cam.location.y, -cam.location.z
        length = math.sqrt(dx**2 + dy**2 + dz**2)
        cam.rotation_mode = 'XYZ'
        cam.rotation_euler[0] = math.acos(max(-1, min(1, dz / length)))
        cam.rotation_euler[2] = math.atan2(dy, dx) + math.pi
        bpy.context.scene.frame_set(f)
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)


def keyframe_shape_keys():
    obj = bpy.data.objects.get("tb_band_floor")
    if obj is None:
        return
    kb = obj.data.shape_keys
    if kb is None:
        return
    frames = sorted(KEY_SCHEDULE.keys())
    for frame, vals in KEY_SCHEDULE.items():
        bpy.context.scene.frame_set(frame)
        for k_name, val in vals.items():
            kb_key = kb.key_blocks.get(k_name)
            if kb_key:
                kb_key.value = val
                kb_key.keyframe_insert("value", frame=frame)
    # Smooth interpolation
    if kb.animation_data and kb.animation_data.action:
        for fc in kb.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def add_sun():
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.data.angle  = math.radians(5.0)


def main():
    setup_scene()
    cam = add_camera()
    keyframe_camera(cam)
    keyframe_shape_keys()
    add_sun()
    bpy.ops.render.render(animation=True)


main()
