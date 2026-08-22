"""
record.py — Viewport animation recorder for Raup Shell (Blender 5.1)
=====================================================================
Run AFTER blueprint.py.  Keyframes a 120-frame shape-key morph cycle:

  Frame 1   → Ammonite  (flat planispiral, open umbilicus)
  Frame 31  → Nautilus  (slight spire, open)
  Frame 61  → Cone      (moderate spire, tight)
  Frame 91  → Turritella (tall narrow tower)
  Frame 121 → Ammonite  (loop close)

Renders to:
  public/library/videos/scripting/
    python-numpy-raup-mollusc-shell-morphospace-helicoidal-coiling-poi-head-webxr/
    viewport.mp4

Renderer: Workbench + vertex colours (no material needed).
Resolution: 1280 × 720 @ 24 fps.  Duration: ~5 seconds.
"""

import bpy
import os

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
OBJ_NAME    = "raup_shell_poi"
OUTPUT_REL  = "//../../videos/scripting/" \
              "python-numpy-raup-mollusc-shell-morphospace-helicoidal-coiling-poi-head-webxr/" \
              "viewport"
FPS         = 24
TOTAL_FRAMES = 120

# Shape key morph schedule: (frame, key_name, value_on, others_off)
# Each key is blended in at its frame and faded out by the next
SCHEDULE = [
    ( 1,   "Ammonite",   1.0),
    ( 31,  "Nautilus",   1.0),
    ( 61,  "Cone",       1.0),
    ( 91,  "Turritella", 1.0),
    (121,  "Ammonite",   1.0),   # loop close
]

# ─── SCENE SETUP ──────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

# Workbench renderer with vertex colour display
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.color_type   = "VERTEX"
scene.display.shading.light        = "FLAT"
scene.display.shading.show_xray   = False

# Output
scene.render.filepath          = OUTPUT_REL
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format     = "MPEG4"
scene.render.ffmpeg.codec      = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x      = 1280
scene.render.resolution_y      = 720
scene.render.resolution_percentage = 100

# ─── CAMERA ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Isometric-ish view: 35° elevation, 30° azimuth
import mathutils
cam_obj.location = (0.35, -0.35, 0.20)
cam_obj.rotation_euler = (
    mathutils.radians(68),
    0.0,
    mathutils.radians(45),
)

# ─── LIGHT ────────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("RecordSun", type="SUN")
sun_data.energy = 4.0
sun_obj  = bpy.data.objects.new("RecordSun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (mathutils.radians(45), 0.0, mathutils.radians(30))

# ─── KEYFRAME SHAPE KEYS ──────────────────────────────────────────────────────
obj = bpy.data.objects.get(OBJ_NAME)
if obj is None:
    raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

shape_keys = obj.data.shape_keys
if shape_keys is None:
    raise RuntimeError("No shape keys on object — run blueprint.py first.")

key_blocks = {kb.name: kb for kb in shape_keys.key_blocks}
morph_names = ["Ammonite", "Nautilus", "Cone", "Turritella"]

def zero_all(frame: int) -> None:
    """Set all morph keys to 0 at the given frame."""
    for name in morph_names:
        kb = key_blocks.get(name)
        if kb:
            kb.value = 0.0
            kb.keyframe_insert("value", frame=frame)

# Build a smooth cross-fade: for each transition, ramp out the previous key
# and ramp in the next over a 10-frame window
for idx, (frame, key_name, value) in enumerate(SCHEDULE[:-1]):
    next_frame, next_key, _ = SCHEDULE[idx + 1]
    fade_start = frame
    fade_end   = min(frame + 10, next_frame)

    # At fade_start: current key = 1, all others 0
    scene.frame_set(fade_start)
    zero_all(fade_start)
    kb = key_blocks.get(key_name)
    if kb:
        kb.value = 1.0
        kb.keyframe_insert("value", frame=fade_start)

    # At fade_end: current key fades to 0, next key begins
    scene.frame_set(fade_end)
    if kb:
        kb.value = 0.0
        kb.keyframe_insert("value", frame=fade_end)

# Ensure loop-close at frame 121
scene.frame_set(121)
zero_all(121)
kb = key_blocks.get("Ammonite")
if kb:
    kb.value = 1.0
    kb.keyframe_insert("value", frame=121)

print(f"[record] shape-key animation: frames 1–{TOTAL_FRAMES} @ {FPS} fps")
print(f"[record] output → {OUTPUT_REL}.mp4")
print("[record] press Ctrl+F12 to render animation, or run bpy.ops.render.render(animation=True)")
