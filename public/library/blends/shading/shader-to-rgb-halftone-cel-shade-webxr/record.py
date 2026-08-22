"""
record.py — Viewport animation for shader-to-rgb-halftone-cel-shade-webxr
==========================================================================
Produces: public/library/videos/shading/shader-to-rgb-halftone-cel-shade-webxr/viewport.mp4

Run after blueprint.py has built the scene.  Animates the sun lamp elevation
from near-overhead (full lit zone → tiny dots) through a 42° arc to low angle
(large shadow zone → fat dots), revealing the AM halftone behaviour.  Total
120 frames at 24 fps = 5 seconds.

Frame 001: Sun high (80°) — mostly lit band, sparse dots
Frame 060: Sun mid  (42°) — balanced toon boundary
Frame 120: Sun low  (12°) — mostly shadow band, dense dots

Run as: blender --background halftone_cel.blend --python record.py
"""

import bpy
import math
import os

OUTPUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath),
    "../../../../videos/shading/shader-to-rgb-halftone-cel-shade-webxr"
)

FPS        = 24
FRAMES     = 120
START_ELEV = math.radians(80.0)
END_ELEV   = math.radians(12.0)


def setup_output() -> None:
    scn = bpy.context.scene
    scn.render.engine             = 'BLENDER_EEVEE_NEXT'
    scn.render.film_transparent   = False
    scn.render.resolution_x       = 1280
    scn.render.resolution_y       = 720
    scn.render.fps                = FPS
    scn.frame_start               = 1
    scn.frame_end                 = FRAMES

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scn.render.image_settings.file_format  = 'FFMPEG'
    scn.render.ffmpeg.format               = 'MPEG4'
    scn.render.ffmpeg.codec                = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'HIGH'
    scn.render.filepath = os.path.join(OUTPUT_DIR, "viewport.mp4")


def animate_sun() -> None:
    """Key the sun elevation to sweep from 80° down to 12°."""
    sun = None
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT' and obj.data.type == 'SUN':
            sun = obj
            break
    if sun is None:
        raise RuntimeError("No SUN lamp found — run blueprint.py first.")

    # Maintain azimuth (Y, Z rotation) from blueprint; animate X (elevation)
    az_y = sun.rotation_euler.y
    az_z = sun.rotation_euler.z

    scn = bpy.context.scene
    scn.frame_set(1)
    sun.rotation_euler = (START_ELEV, az_y, az_z)
    sun.keyframe_insert(data_path='rotation_euler', index=0)

    scn.frame_set(FRAMES)
    sun.rotation_euler = (END_ELEV, az_y, az_z)
    sun.keyframe_insert(data_path='rotation_euler', index=0)

    # Linear interpolation — constant sweep, no easing, tutorial-clarity
    for fc in sun.animation_data.action.fcurves:
        if fc.data_path == 'rotation_euler' and fc.array_index == 0:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def ensure_eevee_material() -> None:
    """Confirm slot 0 (EEVEE Shader-to-RGB) is active for the render."""
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.active_material_index = 0


def record() -> None:
    setup_output()
    animate_sun()
    ensure_eevee_material()
    bpy.ops.render.render(animation=True, use_viewport=False)
    print(f"[record] Viewport animation saved to {bpy.context.scene.render.filepath}")


if __name__ == "__main__":
    record()
