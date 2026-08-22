"""
record.py — Viewport render: Width 4m→7m→4m, Height 2.5m→4.5m→2.5m, 10 s loop
Output : public/library/videos/geometry-nodes/gn-gizmo-nodes-interactive-viewport-controls/viewport.mp4
Run    : open roman_arch_gizmos.blend in Blender → Scripting workspace → Run Script.

Technique: keyframe-animate the GN modifier's Width and Height inputs.
EEVEE Next viewport render at 1920×1080, 30 fps for speed.  The animation
shows the arch widening then rising — demonstrating the two gizmo axes without
requiring an interactive session.  When Dimona records the screen version
(screen.mp4), she replaces this render with a live drag of the actual viewport
handles, which shows the gizmos snapping to the geometry surface.
"""

import bpy
import math

FPS = 30
DURATION_S = 10
OUT = "//../../videos/geometry-nodes/gn-gizmo-nodes-interactive-viewport-controls/viewport.mp4"

scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps          = FPS
scene.frame_start         = 1
scene.frame_end           = FPS * DURATION_S
scene.render.engine       = 'BLENDER_EEVEE_NEXT'
scene.render.filepath     = OUT
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.film_transparent            = False


def kf(obj, prop, frame, value):
    """Set a modifier custom-property and insert a keyframe."""
    mod = obj.modifiers["GN_RomanArch"]
    mod[prop] = value
    obj.keyframe_insert(
        data_path=f'modifiers["GN_RomanArch"]["{prop}"]',
        frame=frame,
    )


arch = bpy.data.objects.get("RomanArch")
if arch:
    # Frame 1:   default — width 4, height 2.5
    kf(arch, "Width",  1,       4.0);  kf(arch, "Height",  1,       2.5)
    # Frame 60:  widen to 7 m
    kf(arch, "Width",  FPS*2,   7.0);  kf(arch, "Height",  FPS*2,   2.5)
    # Frame 120: narrow back, then rise
    kf(arch, "Width",  FPS*4,   4.0);  kf(arch, "Height",  FPS*4,   2.5)
    kf(arch, "Width",  FPS*6,   4.0);  kf(arch, "Height",  FPS*6,   4.5)
    # Frame 240: return to default
    kf(arch, "Width",  FPS*8,   4.0);  kf(arch, "Height",  FPS*8,   2.5)
    kf(arch, "Width",  FPS*10,  4.0);  kf(arch, "Height",  FPS*10,  2.5)

    if arch.animation_data and arch.animation_data.action:
        for fc in arch.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'

# Viewport shading: Material Preview so the arch reads clearly
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
        break

bpy.ops.render.opengl(animation=True)
print(f"[holoflow] viewport.mp4 → {OUT}")
