"""
record.py — Viewport animation recorder for the Hopf Fibration poi head.
Outputs:  public/library/videos/topology/
            python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr/
            viewport.mp4
Duration: 300 frames @ 30 fps = 10 s
Sequence: 0-60 slow orbit + morph Basis→SK_Clifford,
          60-150 continue orbit + hold SK_Clifford,
          150-210 morph SK_Clifford→SK_SouthHeavy (zoom to dense cluster),
          210-270 morph SK_SouthHeavy→SK_NorthHeavy (open to far rings),
          270-300 morph SK_NorthHeavy→Basis + return camera.

Run this script inside Blender *after* blueprint.py has built the scene:
  blender hf_hopf_poi.blend --background --python record.py

Requires:  FFmpeg accessible on PATH (Blender calls it for the final encode).
"""

import bpy, math, os

OUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath),
    "..", "..", "..", "..",           # public/library/blends/scripting/<slug>/
    "..", "..", "videos", "topology",
    "python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr",
)
OUT_PATH = os.path.normpath(os.path.join(OUT_DIR, "viewport"))

TOTAL_FRAMES = 300
FPS          = 30

# ── Scene setup ───────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

scene.render.engine              = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format       = "MPEG4"
scene.render.ffmpeg.codec        = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath            = OUT_PATH + ".mp4"

# Bloom
scene.eevee.use_bloom            = True
scene.eevee.bloom_threshold      = 0.40
scene.eevee.bloom_intensity      = 0.20

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0
cam_ob = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_ob)
scene.camera = cam_ob
CAM_DIST = 0.28
CAM_ELEV = math.radians(30)

def set_cam(frame: int, orbit_deg: float, elev: float = CAM_ELEV):
    a = math.radians(orbit_deg)
    cam_ob.location = (
        CAM_DIST * math.cos(a) * math.cos(elev),
        CAM_DIST * math.sin(a) * math.cos(elev),
        CAM_DIST * math.sin(elev),
    )
    # Point at origin
    direction = -cam_ob.location
    rot = direction.to_track_quat('-Z', 'Y')
    from mathutils import Vector
    cam_ob.location = Vector(cam_ob.location)
    cam_ob.rotation_euler = rot.to_euler()
    cam_ob.keyframe_insert("location", frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# Slow 240° orbit over 300 frames
for f in range(1, TOTAL_FRAMES + 1):
    set_cam(f, (f - 1) * 240.0 / TOTAL_FRAMES)

# ── Lighting ──────────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("RecordSun", "SUN")
sun.energy = 4.0
sun_ob = bpy.data.objects.new("RecordSun", sun)
bpy.context.scene.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (math.radians(55), 0, math.radians(30))

fill = bpy.data.lights.new("RecordFill", "SUN")
fill.energy = 1.5
fill_ob = bpy.data.objects.new("RecordFill", fill)
bpy.context.scene.collection.objects.link(fill_ob)
fill_ob.rotation_euler = (math.radians(35), 0, math.radians(200))

# ── Shape-key animation ────────────────────────────────────────────────────────
ob = bpy.data.objects.get("HF_Hopf_Poi")
if ob and ob.data.shape_keys:
    kb = ob.data.shape_keys.key_blocks

    def key_zero_all(frame: int):
        for k in kb:
            k.value = 0.0
            k.keyframe_insert("value", frame=frame)

    def key_ramp(sk_name: str, f0: int, f1: int, v0: float = 0.0, v1: float = 1.0):
        kb[sk_name].value = v0
        kb[sk_name].keyframe_insert("value", frame=f0)
        kb[sk_name].value = v1
        kb[sk_name].keyframe_insert("value", frame=f1)

    # All keys start at zero
    key_zero_all(1)
    # 1-60: ramp in SK_Clifford
    key_ramp("SK_Clifford", 1, 60, 0.0, 1.0)
    # 60-150: hold SK_Clifford at 1.0
    kb["SK_Clifford"].value = 1.0
    kb["SK_Clifford"].keyframe_insert("value", frame=150)
    # 150-210: transition to SK_SouthHeavy
    key_ramp("SK_Clifford",  150, 210, 1.0, 0.0)
    key_ramp("SK_SouthHeavy", 150, 210, 0.0, 1.0)
    # 210-270: transition to SK_NorthHeavy
    key_ramp("SK_SouthHeavy", 210, 270, 1.0, 0.0)
    key_ramp("SK_NorthHeavy", 210, 270, 0.0, 1.0)
    # 270-300: return to Basis
    key_ramp("SK_NorthHeavy", 270, 300, 1.0, 0.0)

# ── Render ────────────────────────────────────────────────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[record] Wrote {OUT_PATH}.mp4")
