# ============================================================
# record.py — viewport animation for Ikeda Map attractor
# Runs inside Blender 5.1 after blueprint.py has executed.
# Outputs: public/library/videos/scripting/
#          python-numpy-ikeda-map-complex-laser-cavity-attractor-basin-poi-webxr/
#          viewport.mp4
# Duration: 90 frames @ 24 fps ≈ 3.75 s
# ============================================================

import bpy

SLUG      = "python-numpy-ikeda-map-complex-laser-cavity-attractor-basin-poi-webxr"
OUT_PATH  = f"//../../../../library/videos/scripting/{SLUG}/viewport"
FPS       = 24
FRAMES    = 90          # 3.75 s: 3 b-value sweeps × 30 frames each
SK_NAME   = "b=0.92"   # the most chaotic shape key for the peak

scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.filepath = OUT_PATH
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format   = 'MPEG4'
scene.render.ffmpeg.codec    = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# ── locate the height-field object from blueprint ──────────
obj = bpy.data.objects.get("hf_ikeda")
if obj is None:
    raise RuntimeError("Run blueprint.py first — hf_ikeda not found.")

keys = obj.data.shape_keys.key_blocks

# Zero all key values at frame 1 (Basis)
for kb in keys:
    kb.value = 0.0
    kb.keyframe_insert("value", frame=1)

# Animate b=0.70 in at frame 15, hold until 35
b70 = keys.get("b=0.70")
if b70:
    b70.value = 0.0; b70.keyframe_insert("value", frame=1)
    b70.value = 1.0; b70.keyframe_insert("value", frame=15)
    b70.value = 1.0; b70.keyframe_insert("value", frame=35)
    b70.value = 0.0; b70.keyframe_insert("value", frame=50)

# Animate b=0.85 in at frame 50, hold until 65
b85 = keys.get("b=0.85")
if b85:
    b85.value = 0.0; b85.keyframe_insert("value", frame=1)
    b85.value = 1.0; b85.keyframe_insert("value", frame=50)
    b85.value = 1.0; b85.keyframe_insert("value", frame=65)
    b85.value = 0.0; b85.keyframe_insert("value", frame=80)

# Animate b=0.92 in at frame 70, hold until end
b92 = keys.get("b=0.92")
if b92:
    b92.value = 0.0; b92.keyframe_insert("value", frame=1)
    b92.value = 1.0; b92.keyframe_insert("value", frame=70)
    b92.value = 1.0; b92.keyframe_insert("value", frame=FRAMES)

# ── camera slow pan (0° → 25° around Z) ────────────────────
cam = scene.camera
if cam:
    cam.rotation_euler = (1.15, 0.0, 0.0)
    cam.keyframe_insert("rotation_euler", frame=1)
    cam.rotation_euler = (1.15, 0.0, 0.44)   # ~25° yaw
    cam.keyframe_insert("rotation_euler", frame=FRAMES)

# ── set viewport shading to Material Preview (EEVEE) ────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces[0].shading.type = 'MATERIAL'
        break

# ── render animation via opengl ─────────────────────────────
bpy.ops.render.opengl(animation=True)
print(f"[record] viewport animation written to {OUT_PATH}")
