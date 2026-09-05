"""
record.py — Sprott I Attractor viewport animation
===================================================
Run INSIDE Blender 5.1 after blueprint.py has built the scene.
Outputs: public/library/videos/scripting/
         python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr/
         viewport.mp4

Duration: 150 frames @ 30 fps = 5 seconds.
Camera orbits 360° while shape keys morph through the a-parameter sweep,
revealing how the orbit footprint contracts as coupling strengthens.
"""

import bpy
import math

SLUG   = ("python-numpy-sprott-i-attractor-1994-six-term-y-squared-"
          "single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr")
OUTDIR = f"//public/library/videos/scripting/{SLUG}/"
FRAMES = 150
FPS    = 30

# ── rendering engine ──────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine           = "BLENDER_WORKBENCH"
scn.render.resolution_x     = 1920
scn.render.resolution_y     = 1080
scn.render.fps              = FPS
scn.render.filepath         = OUTDIR + "viewport"
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format    = "MPEG4"
scn.render.ffmpeg.codec     = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"

# Workbench: vertex colour display
scn.display.shading.type                = "SOLID"
scn.display.shading.color_type          = "VERTEX"
scn.display.shading.show_object_outline = True

scn.frame_start = 1
scn.frame_end   = FRAMES

# ── camera orbit ──────────────────────────────────────────────────────────────
cam = scn.camera
cam_dist = 9.0
cam_elev = 0.38                      # ~22° elevation

for f in range(1, FRAMES + 1):
    scn.frame_set(f)
    angle = 2 * math.pi * (f - 1) / FRAMES   # full revolution over clip
    cam.location.x = cam_dist * math.sin(angle)
    cam.location.y = -cam_dist * math.cos(angle)
    cam.location.z = cam_dist * math.sin(cam_elev)
    # Point at attractor centroid (approximately origin)
    cam.rotation_euler = (math.pi / 2 - cam_elev, 0.0, angle)
    cam.keyframe_insert(data_path="location",        frame=f)
    cam.keyframe_insert(data_path="rotation_euler",  frame=f)

# ── shape-key morphing schedule ────────────────────────────────────────────────
# Segments: Basis(1-37) → SK_LowA(38-75) → SK_HighA(76-112) → SK_NearBif(113-150)
#
# WHY this order: starts at canonical orbit, then shows wider (lower a) and
# tighter (higher a) variants, finally approaching the near-bifurcation
# topology where the orbit compresses — providing a smooth visual ramp.

ob = bpy.data.objects.get("hf_sprott_i_poi")
if ob and ob.data.shape_keys:
    kb = ob.data.shape_keys.key_blocks
    KEY_SCHEDULE = [
        # (frame_in, frame_peak, key_name)
        (1,   37,  "Basis"),
        (38,  75,  "SK_LowA"),
        (76,  112, "SK_HighA"),
        (113, 150, "SK_NearBif"),
    ]
    for (f_in, f_peak, kname) in KEY_SCHEDULE:
        for key in kb:
            key.value = 0.0
            key.keyframe_insert(data_path="value", frame=f_in)
        if kname in kb:
            kb[kname].value = 1.0
            kb[kname].keyframe_insert(data_path="value", frame=f_peak)

# ── world / lighting ──────────────────────────────────────────────────────────
bpy.data.worlds["World"].node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.04, 1.0)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Sprott I record.py complete → {OUTDIR}viewport.mp4")
