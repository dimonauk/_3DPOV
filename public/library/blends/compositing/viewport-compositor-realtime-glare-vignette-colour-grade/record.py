"""
record.py — Viewport Compositor: Glare, Vignette & Colour Grade  Blender 5.1
Produces: public/library/videos/compositing/viewport-compositor-realtime-glare-vignette-colour-grade/viewport.mp4

Run AFTER blueprint.py.  Requires a Blender session with a 3D VIEW_3D area.
The animation cycles the orb emission 1→6→1 over 120 frames (5 s at 24 fps)
so bloom grows, saturates, and retreats — demonstrating the full glare range.
"""

import bpy, os, pathlib

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
OUT_DIR  = pathlib.Path(bpy.path.abspath("//../../../../../../public/library/videos"))
OUT_DIR  = OUT_DIR / "compositing" / "viewport-compositor-realtime-glare-vignette-colour-grade"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = str(OUT_DIR / "viewport")   # Blender appends codec extension

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.filepath        = OUT_FILE
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.fps             = 24
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.frame_start            = 1
scene.frame_end              = 120

# Compositor node tree must already exist (built by blueprint.py).
# The full F12 render applies the same node tree, producing compositor-graded
# output — identical to what the Viewport Compositor shows in RENDERED shading.
assert scene.use_nodes, "Run blueprint.py first to build the compositor tree."

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] Rendered → {OUT_FILE}.mp4")
