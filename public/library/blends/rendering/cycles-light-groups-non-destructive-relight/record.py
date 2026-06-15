"""
record.py — viewport animation for the Cycles Light Groups tutorial
===================================================================
Renders a 120-frame MP4 that demonstrates the relighting concept as a
timed reveal: each light group fades in sequentially, then the gem rotates
to show all facets under the combined neon + ceiling rig.

Frame map
---------
  F1  → F30  : ceiling only    (neutral overhead — flat, clinical look)
  F30 → F60  : neon_left ramps in  (blue from stage left)
  F60 → F90  : neon_right ramps in (pink/magenta from stage right)
  F90 → F120 : all three lights; gem rotates 360° to show every facet

Output: public/library/videos/rendering/cycles-light-groups-non-destructive-relight/viewport.mp4
Run: Scripting workspace → open this file → Run Script
"""

import bpy
import math

OUTPUT = (
    "//../../../../public/library/videos/rendering/"
    "cycles-light-groups-non-destructive-relight/viewport.mp4"
)

TOTAL_FRAMES = 120

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUTPUT

# ── Light energy reveal ───────────────────────────────────────────────────────
# (frame, energy_watts) pairs for each light
energy_curves: dict = {
    "Light_ceiling":    [(1, 0), (10, 40), (120, 40)],
    "Light_neon_left":  [(1, 0), (30, 0), (60, 90), (120, 90)],
    "Light_neon_right": [(1, 0), (60, 0), (90, 90), (120, 90)],
}

for light_name, keyframes in energy_curves.items():
    obj = bpy.data.objects.get(light_name)
    if not obj or not obj.data:
        continue
    for frame, energy in keyframes:
        scene.frame_set(frame)
        obj.data.energy = energy
        obj.data.keyframe_insert(data_path="energy", frame=frame)
    # Ease-in interpolation so the light feels like a dimmer rising
    if obj.data.animation_data and obj.data.animation_data.action:
        for fc in obj.data.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "EASE_IN_OUT"

# ── Gem rotation (F90 → F120) ────────────────────────────────────────────────
gem = bpy.data.objects.get("gem")
if gem:
    scene.frame_set(90)
    gem.rotation_euler = (0, 0, 0)
    gem.keyframe_insert("rotation_euler", frame=90)

    scene.frame_set(120)
    gem.rotation_euler = (0, 0, math.tau)  # 360°
    gem.keyframe_insert("rotation_euler", frame=120)

    if gem.animation_data and gem.animation_data.action:
        for fc in gem.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

# Reset to frame 1 before viewport render
scene.frame_set(1)

# ── Render ───────────────────────────────────────────────────────────────────
# OpenGL viewport render — does not require a full Cycles solve, runs in seconds.
# The light group compositing only applies in F12 Cycles render;
# what you see here is the EEVEE-viewport approximation of the scene —
# still useful for demonstrating the timed lighting concept on camera.
bpy.ops.render.opengl(animation=True, write_still=False)

print("record.py complete — viewport.mp4 written.")
