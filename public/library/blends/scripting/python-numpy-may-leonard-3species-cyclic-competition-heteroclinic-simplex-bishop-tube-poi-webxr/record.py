"""
May–Leonard 3-Species Competition — record.py
Blender 5.1 · bpy · CC0

Renders a 10-second viewport animation (240 frames @ 24 fps) via EEVEE Next,
output to:
  public/library/videos/scripting/
    python-numpy-may-leonard-3species-cyclic-competition-heteroclinic-simplex-bishop-tube-poi-webxr/
      viewport.mp4

Run AFTER blueprint.py has been executed in the same Blender session.
The animation cycles through the four shape keys to demonstrate:
  • F  1– 48  Basis (canonical heteroclinic cycle, cobalt→amber gradient)
  • F 49– 96  fade-blend → SK_Coexist (stable interior: compact spiral)
  • F 97–144  hold SK_Coexist
  • F145–192  fade-blend → SK_Reverse (reversed dominance cycle)
  • F193–216  hold SK_Reverse
  • F217–240  fade back to Basis
"""

import bpy
import os

OUTPUT_DIR = "public/library/videos/scripting/" \
             "python-numpy-may-leonard-3species-cyclic-competition-heteroclinic-simplex-bishop-tube-poi-webxr"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport")

FRAMES     = 240
FPS        = 24
RESOLUTION = (1920, 1080)

# ── Renderer ──────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x       = RESOLUTION[0]
scene.render.resolution_y       = RESOLUTION[1]
scene.render.resolution_percentage = 100
scene.render.fps                 = FPS
scene.frame_start                = 1
scene.frame_end                  = FRAMES
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format        = 'MPEG4'
scene.render.ffmpeg.codec         = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath             = bpy.path.abspath("//" + OUTPUT_FILE)

# EEVEE quality settings
eevee = scene.eevee
eevee.use_bloom           = True
eevee.bloom_intensity     = 0.4
eevee.use_gtao            = True
eevee.taa_render_samples  = 16

# ── Camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -3.5, 1.2))
cam = bpy.context.active_object
cam.name = "Rec_Camera"
cam.rotation_euler = (1.22, 0.0, 0.0)   # ≈ 70° tilt — shows simplex triangle
scene.camera = cam

# ── Shape-key animation ───────────────────────────────────────────────────────
obj = bpy.data.objects.get("MayLeonard_Poi")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    names = ["Basis", "SK_Coexist", "SK_Reverse"]

    def set_kf(frame, basis_val, coexist_val, reverse_val):
        scene.frame_set(frame)
        kb["Basis"].value     = basis_val
        kb["SK_Coexist"].value = coexist_val
        kb["SK_Reverse"].value = reverse_val
        kb["Basis"].keyframe_insert("value",      frame=frame)
        kb["SK_Coexist"].keyframe_insert("value", frame=frame)
        kb["SK_Reverse"].keyframe_insert("value", frame=frame)

    #         frame  Basis   Coexist  Reverse
    set_kf(   1,     1.0,    0.0,     0.0)
    set_kf(  48,     1.0,    0.0,     0.0)
    set_kf(  72,     0.0,    1.0,     0.0)  # fade to SK_Coexist
    set_kf( 120,     0.0,    1.0,     0.0)
    set_kf( 144,     0.0,    0.0,     1.0)  # fade to SK_Reverse
    set_kf( 192,     0.0,    0.0,     1.0)
    set_kf( 216,     0.5,    0.0,     0.5)  # blend back
    set_kf( 240,     1.0,    0.0,     0.0)

# ── Render ────────────────────────────────────────────────────────────────────
os.makedirs(bpy.path.abspath("//" + OUTPUT_DIR), exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[may-leonard] record.py done → {OUTPUT_FILE}.mp4")
