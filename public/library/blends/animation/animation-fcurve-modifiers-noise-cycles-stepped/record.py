"""
record.py — Viewport animation recorder
F-Curve Modifiers: Noise + Cycles + Stepped
Blender 5.1  |  CC0  |  Holoflow Studio

Run AFTER blueprint.py has built the scene (or chain them):
    exec(open("blueprint.py").read())

Renders 96 frames at 24 fps (4 seconds) in EEVEE Next.
Output: public/library/videos/animation/animation-fcurve-modifiers-noise-cycles-stepped/viewport.mp4

What to watch for in the render:
  - Sphere bounces with SINE ease; each loop identical (CYCLES working)
  - Sphere rotates erratically on Z — NOISE wobble visible around each apex
  - RatchetDisc snaps 15° every 4 frames instead of rotating smoothly
  - Subtle camera drift in X/Y (the NOISE handheld-shake — barely perceptible
    but present; compare frames 1 and 50 at a fixed point on the ground plane)
"""

import bpy

# ── OUTPUT ────────────────────────────────────────────────────────────────────
OUT_PATH = "//../../videos/animation/animation-fcurve-modifiers-noise-cycles-stepped/viewport.mp4"
FRAMES   = 96
FPS      = 24

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath       = OUT_PATH
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.resolution_percentage = 100

# ── VIEWPORT SHADING ──────────────────────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type != "VIEW_3D":
        continue
    for space in area.spaces:
        if space.type != "VIEW_3D":
            continue
        space.shading.type            = "RENDERED"
        space.shading.use_scene_lights = True
        space.shading.use_scene_world  = True
    break

scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples      = 32
scene.eevee.use_motion_blur         = True   # captures shake + bounce arc
scene.eevee.motion_blur_shutter     = 0.5

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print(f"Render complete → {OUT_PATH}")
