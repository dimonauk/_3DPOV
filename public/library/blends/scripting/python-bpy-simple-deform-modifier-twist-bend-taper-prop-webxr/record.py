"""
record.py — Viewport animation render for SimpleDeformModifier tutorial.
Animates the TWIST angle from 0 → 270° and the BEND angle from 0 → 80°
over 120 frames, then renders an OpenGL viewport animation to:
  public/library/videos/scripting/python-bpy-simple-deform-modifier-twist-bend-taper-prop-webxr/viewport.mp4

Run AFTER blueprint.py has produced the scene, or run standalone (it rebuilds).
Requires: Blender 5.1 opened with the blend file (or run from background with -b).
"""

import bpy
import os
import math

FRAMES      = 120
OUTPUT_DIR  = "//../../videos/scripting/python-bpy-simple-deform-modifier-twist-bend-taper-prop-webxr/"
OUTPUT_FILE = "viewport"

# ---------------------------------------------------------------------------
# Rebuild scene if objects are absent
# ---------------------------------------------------------------------------
if "hf_twisted_column" not in bpy.data.objects:
    exec(open(bpy.path.abspath("//blueprint.py")).read())

col   = bpy.data.objects.get("hf_twisted_column")
horn  = bpy.data.objects.get("hf_bent_horn")

# ---------------------------------------------------------------------------
# Re-add modifiers for animation (blueprint bakes them; here we re-add live)
# ---------------------------------------------------------------------------

def re_add_twist(obj):
    obj.modifiers.clear()
    mod = obj.modifiers.new("TwistAnim", 'SIMPLE_DEFORM')
    mod.deform_method = 'TWIST'
    mod.deform_axis   = 'Z'
    mod.limits        = (0.0, 1.0)
    return mod

def re_add_bend(obj):
    obj.modifiers.clear()
    mod = obj.modifiers.new("BendAnim", 'SIMPLE_DEFORM')
    mod.deform_method = 'BEND'
    mod.deform_axis   = 'Z'
    mod.limits        = (0.0, 1.0)
    return mod


twist_mod = re_add_twist(col)
bend_mod  = re_add_bend(horn)

# ---------------------------------------------------------------------------
# Keyframe animation
# ---------------------------------------------------------------------------
scn         = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAMES

for frame in range(1, FRAMES + 1):
    t = (frame - 1) / (FRAMES - 1)   # 0.0 → 1.0

    scn.frame_set(frame)

    # Column: twist 0 → 270°
    twist_mod.angle = t * math.pi * 1.5
    twist_mod.keyframe_insert("angle", frame=frame)

    # Horn: bend 0 → 80°
    bend_mod.angle = t * math.radians(80)
    bend_mod.keyframe_insert("angle", frame=frame)

# ---------------------------------------------------------------------------
# Camera framing
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("RecCam")
cam_ob   = bpy.data.objects.new("RecCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
cam_ob.location       = (0.0, -6.0, 1.2)
cam_ob.rotation_euler = (math.radians(85), 0.0, 0.0)
cam_data.lens         = 50.0
scn.camera            = cam_ob

# ---------------------------------------------------------------------------
# Render settings (OpenGL viewport animation)
# ---------------------------------------------------------------------------
scn.render.resolution_x       = 1920
scn.render.resolution_y       = 1080
scn.render.fps                = 30
scn.render.image_settings.file_format  = 'FFMPEG'
scn.render.ffmpeg.format               = 'MPEG4'
scn.render.ffmpeg.codec                = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'

out_abs = bpy.path.abspath(OUTPUT_DIR)
os.makedirs(out_abs, exist_ok=True)
scn.render.filepath = os.path.join(out_abs, OUTPUT_FILE)

bpy.ops.render.opengl(animation=True)
print(f"holoflow:record — viewport.mp4 written to {out_abs}")
