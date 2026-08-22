"""
record.py — Viewport animation render for the Bunimovich stadium billiard disc.
Run AFTER blueprint.py (object NAME must already exist in the scene).

Output: public/library/videos/scripting/
        python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr/
        viewport.mp4

Animation (120 frames @ 24 fps = 5 seconds):
  Frames   1–40:  Basis (ergodic stadium) — flat disc, uniform cobalt-amber colour
  Frames  40–80:  SK_Circle value 0→1 — disc lifts into 5 concentric ring-spikes
  Frames  80–120: slow rotation 0°→72° to reveal 5-fold ring symmetry

Camera: fixed overhead + slight tilt for depth cue.
"""

import bpy, math, os

NAME      = "hf_bunimovich_poi"
OUT_DIR   = "public/library/videos/scripting/" \
            "python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr"
OUT_FILE  = os.path.join(OUT_DIR, "viewport.mp4")
FPS       = 24
N_FRAMES  = 120

os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.render.fps              = FPS
scene.frame_start             = 1
scene.frame_end               = N_FRAMES
scene.render.resolution_x     = 1280
scene.render.resolution_y     = 720
scene.render.filepath         = OUT_FILE
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format    = 'MPEG4'
scene.render.ffmpeg.codec     = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

ob = bpy.data.objects.get(NAME)
if ob is None:
    raise RuntimeError(f"Object '{NAME}' not found — run blueprint.py first.")

# ── Camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -0.18, 0.22))
cam = bpy.context.object
cam.rotation_euler = (math.radians(52), 0, 0)
cam.data.lens      = 85
scene.camera       = cam

# ── Light ─────────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(0.2, -0.1, 0.30))
light = bpy.context.object
light.data.energy = 120
light.data.size   = 0.4

# ── Keyframes: shape key ──────────────────────────────────────────────────────
sk_block = ob.data.shape_keys
if sk_block and "SK_Circle" in sk_block.key_blocks:
    sk = sk_block.key_blocks["SK_Circle"]
    # Frame 1: stadium (flat)
    sk.value = 0.0;  sk.keyframe_insert("value", frame=1)
    # Frame 40: still flat
    sk.value = 0.0;  sk.keyframe_insert("value", frame=40)
    # Frame 80: fully circle rings
    sk.value = 1.0;  sk.keyframe_insert("value", frame=80)
    # Frame 120: stay rings
    sk.value = 1.0;  sk.keyframe_insert("value", frame=120)

# ── Keyframes: rotation to show 5-fold symmetry ───────────────────────────────
ob.rotation_euler = (0, 0, 0)
ob.keyframe_insert("rotation_euler", frame=80)
ob.rotation_euler = (0, 0, math.radians(72))
ob.keyframe_insert("rotation_euler", frame=120)

# ── Eevee viewport render ─────────────────────────────────────────────────────
scene.render.engine = 'BLENDER_EEVEE_NEXT'
bpy.ops.render.render(animation=True)
print(f"[holoflow] Viewport render complete → {OUT_FILE}")
