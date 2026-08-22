"""
record.py — Viewport animation render for the Weierstrass ℘ height-field
            Outputs: public/library/videos/scripting/
                       python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr/
                       viewport.mp4

Run AFTER blueprint.py has built the scene.  120 frames at 24 fps ≈ 5 s.

Animation programme:
  F001–F040  Square τ=i → Rectangular τ=1.5i  (morph to elongated volcano)
  F041–F080  Rectangular → Equianharmonic τ=e^{iπ/3}  (6-fold volcano)
  F081–F120  Equianharmonic → Square  (return to basis)
  Camera orbits 0° → 30° elevation over full sequence for a rolling flyover.
"""

import bpy
import os

# ── Locate the mesh object ───────────────────────────────────────────────────
OBJ_NAME  = "hf_weierstrass_p"
FPS       = 24
N_FRAMES  = 120

OUTPUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "..", "..", "..",
    "public", "library", "videos", "scripting",
    "python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

obj = bpy.data.objects.get(OBJ_NAME)
if obj is None:
    raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

# ── Shape key references ─────────────────────────────────────────────────────
sk_blocks = obj.data.shape_keys.key_blocks
SK_SQ  = sk_blocks.get("Square_tau_i")
SK_REC = sk_blocks.get("Rectangular_tau_1p5i")
SK_EQ  = sk_blocks.get("Equianharmonic_tau_eiπ3")

if not all([SK_SQ, SK_REC, SK_EQ]):
    raise RuntimeError("Shape keys missing — run blueprint.py first.")

# Zero all shape key values and insert at frame 0
def reset_keys(frame):
    bpy.context.scene.frame_set(frame)
    for sk in [SK_SQ, SK_REC, SK_EQ]:
        sk.value = 0.0
        sk.keyframe_insert("value", frame=frame)
    SK_SQ.value = 1.0
    SK_SQ.keyframe_insert("value", frame=frame)


# ── Insert keyframes ─────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, N_FRAMES

reset_keys(1)

# F001: all weight on Square
sc.frame_set(1)
SK_SQ.value = 1.0;  SK_SQ.keyframe_insert("value", frame=1)
SK_REC.value = 0.0; SK_REC.keyframe_insert("value", frame=1)
SK_EQ.value  = 0.0; SK_EQ.keyframe_insert("value", frame=1)

# F040: full Rectangular
sc.frame_set(40)
SK_SQ.value = 0.0;  SK_SQ.keyframe_insert("value", frame=40)
SK_REC.value = 1.0; SK_REC.keyframe_insert("value", frame=40)
SK_EQ.value  = 0.0; SK_EQ.keyframe_insert("value", frame=40)

# F080: full Equianharmonic
sc.frame_set(80)
SK_SQ.value = 0.0;  SK_SQ.keyframe_insert("value", frame=80)
SK_REC.value = 0.0; SK_REC.keyframe_insert("value", frame=80)
SK_EQ.value  = 1.0; SK_EQ.keyframe_insert("value", frame=80)

# F120: back to Square
sc.frame_set(120)
SK_SQ.value = 1.0;  SK_SQ.keyframe_insert("value", frame=120)
SK_REC.value = 0.0; SK_REC.keyframe_insert("value", frame=120)
SK_EQ.value  = 0.0; SK_EQ.keyframe_insert("value", frame=120)

# ── Camera orbit ──────────────────────────────────────────────────────────────
import math
cam_obj = bpy.context.scene.camera
if cam_obj:
    for f in [1, 120]:
        sc.frame_set(f)
        angle = 0.0 if f == 1 else math.radians(30)
        cam_obj.location.z = 3.2 + math.sin(angle) * 2
        cam_obj.keyframe_insert("location", frame=f)

# ── Render settings ──────────────────────────────────────────────────────────
sc.render.engine              = "BLENDER_WORKBENCH"
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format       = "MPEG4"
sc.render.ffmpeg.codec        = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"
sc.render.fps                 = FPS
sc.render.resolution_x        = 1920
sc.render.resolution_y        = 1080
sc.render.resolution_percentage = 100
sc.display_settings.display_device = "sRGB"

# Workbench: vertex colour shading
sc.display.shading.type             = "SOLID"
sc.display.shading.color_type       = "VERTEX"
sc.display.shading.light            = "FLAT"
sc.display.shading.show_shadows     = False

out_path = os.path.join(OUTPUT_DIR, "viewport")
sc.render.filepath = out_path

bpy.ops.render.render(animation=True)
print(f"✓  viewport.mp4 → {out_path}.mp4")
