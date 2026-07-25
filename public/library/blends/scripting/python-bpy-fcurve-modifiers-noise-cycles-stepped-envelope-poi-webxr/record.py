"""
Blender 5.1 — Viewport animation render for FCurve Modifier Poi tutorial.
Runs the blueprint, then renders a 160-frame EEVEE Next preview to viewport.mp4.

Output: public/library/videos/scripting/
        python-bpy-fcurve-modifiers-noise-cycles-stepped-envelope-poi-webxr/viewport.mp4
Duration: 160 frames @ 24 fps ≈ 6.7 s — four complete orbit cycles.

Run from Blender 5.1 scripting workspace: open this file and press Run Script (Alt+P).
"""

import bpy
import math
import os

_HERE = os.path.dirname(os.path.abspath(__file__))
_BP   = os.path.join(_HERE, "blueprint.py")
with open(_BP) as _f:
    exec(compile(_f.read(), _BP, 'exec'))  # noqa: S102 — trusted local script

# After blueprint.run(), the scene has both poi balls with baked keyframes.

# ── Camera ──────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(3.4, -3.4, 2.2))
cam = bpy.context.active_object
cam.name = "HF_RecordCam"
cam.data.lens          = 35
cam.rotation_euler     = (math.radians(56), 0.0, math.radians(45))
bpy.context.scene.camera = cam

# ── Render ───────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine       = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.frame_start         = 1
scene.frame_end           = 160

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = (
    "//../../../../public/library/videos/scripting/"
    "python-bpy-fcurve-modifiers-noise-cycles-stepped-envelope-poi-webxr/"
    "viewport"
)

bpy.ops.render.render(animation=True)
