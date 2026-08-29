"""
record.py — Viewport animation recorder for the FPUT stage floor.

Outputs:
  public/library/videos/scripting/
    python-numpy-fermi-pasta-ulam-tsingou-recurrence-anharmonic-chain-alpha-fpu-stage-floor-webxr/
    viewport.mp4

Duration : 300 frames @ 30 fps = 10 s
Sequence :
  0–80   slow elevated orbit over the Basis floor (α=0.25 recurrence visible)
  80–130 crossfade Basis → SK_Linear; floor flattens to pure standing wave
  130–200 crossfade SK_Linear → SK_Half (α=0.125); slower spreading
  200–270 crossfade SK_Half → SK_Double (α=0.50); rapid chaotic mixing
  270–300 return camera to start position; crossfade back to Basis

Run AFTER blueprint.py has built fput_floor.blend:
  blender fput_floor.blend --background --python record.py

Requires: FFmpeg on PATH.
"""

import bpy, math, os

# ── Paths ─────────────────────────────────────────────────────────────────────
_HERE    = os.path.dirname(bpy.data.filepath)
OUT_DIR  = os.path.normpath(os.path.join(
    _HERE,
    "..", "..", "..", "..",
    "..", "..", "videos", "scripting",
    "python-numpy-fermi-pasta-ulam-tsingou-recurrence-anharmonic-chain-alpha-fpu-stage-floor-webxr",
))
OUT_PATH = os.path.join(OUT_DIR, "viewport.mp4")

TOTAL_FRAMES = 300
FPS          = 30

# ── Scene ─────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

scene.render.engine                      = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath                    = OUT_PATH

scene.eevee.use_bloom     = True
scene.eevee.bloom_threshold = 0.35
scene.eevee.bloom_intensity = 0.18

# ── Camera ────────────────────────────────────────────────────────────────────
from mathutils import Vector, Euler

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 55.0
cam_ob = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

CAM_DIST = 2.40
CAM_ELEV = math.radians(38)


def set_cam(frame: int, orbit_deg: float, elev: float = CAM_ELEV) -> None:
    a = math.radians(orbit_deg)
    cam_ob.location = Vector((
        CAM_DIST * math.cos(a) * math.cos(elev),
        CAM_DIST * math.sin(a) * math.cos(elev),
        CAM_DIST * math.sin(elev),
    ))
    direction = -cam_ob.location
    rot = direction.to_track_quat('-Z', 'Y')
    cam_ob.rotation_euler = rot.to_euler()
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)


# 240° arc over full run; hold last 30 frames at end position
for f in range(1, 271):
    set_cam(f, (f - 1) * 240.0 / 270)
set_cam(300, 240.0)   # hold end position

# ── Lighting ──────────────────────────────────────────────────────────────────
sun_d = bpy.data.lights.new("RecordSun", "SUN")
sun_d.energy = 5.0
sun_ob = bpy.data.objects.new("RecordSun", sun_d)
scene.collection.objects.link(sun_ob)
sun_ob.rotation_euler = Euler((math.radians(52), 0, math.radians(25)))

fill_d = bpy.data.lights.new("RecordFill", "SUN")
fill_d.energy = 2.0
fill_ob = bpy.data.objects.new("RecordFill", fill_d)
scene.collection.objects.link(fill_ob)
fill_ob.rotation_euler = Euler((math.radians(30), 0, math.radians(195)))

# ── Shape-key animation ────────────────────────────────────────────────────────
ob = bpy.data.objects.get("FPUT_Floor")
if ob and ob.data.shape_keys:
    kb = ob.data.shape_keys.key_blocks

    def zero_all(frame: int) -> None:
        for k in kb:
            k.value = 0.0
            k.keyframe_insert("value", frame=frame)

    def ramp(name: str, f0: int, f1: int, v0: float, v1: float) -> None:
        kb[name].value = v0
        kb[name].keyframe_insert("value", frame=f0)
        kb[name].value = v1
        kb[name].keyframe_insert("value", frame=f1)

    zero_all(1)

    # 1–80: show Basis (α=0.25) — recurrence topology visible
    # Frame 1 already set to Basis by zero_all; all others at 0.
    # 80–130: Basis → SK_Linear
    ramp("SK_Linear", 80, 130, 0.0, 1.0)
    # 130–200: SK_Linear → SK_Half
    ramp("SK_Linear", 130, 200, 1.0, 0.0)
    ramp("SK_Half",   130, 200, 0.0, 1.0)
    # 200–270: SK_Half → SK_Double
    ramp("SK_Half",   200, 270, 1.0, 0.0)
    ramp("SK_Double", 200, 270, 0.0, 1.0)
    # 270–300: return to Basis
    ramp("SK_Double", 270, 300, 1.0, 0.0)

# ── Render ────────────────────────────────────────────────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[record] → {OUT_PATH}")
