"""
record.py — Viewport animation for modifier-wireframe-edge-tube-neon-skeleton
=============================================================================
Run after blueprint.py has built the scene:
  blender wire_sphere.blend --python record.py

Output:
  public/library/videos/modifiers/modifier-wireframe-edge-tube-neon-skeleton/
      viewport.mp4

Animation: 8 s at 24 fps (192 frames).
Camera orbits 180° centred between the teal icosphere skeleton (left) and the
orange neon-grid panel (right) — starting from the front face and sweeping
around to the back, showing even-offset vertex joints and boundary edge tubes
at the panel perimeter from multiple angles.
"""

import os
import math
import bpy
from mathutils import Vector

BLEND_DIR    = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR    = os.path.normpath(os.path.join(
    BLEND_DIR, "..", "..", "..", "..",
    "videos", "modifiers", "modifier-wireframe-edge-tube-neon-skeleton",
))
OUT_PATH     = os.path.join(VIDEO_DIR, "viewport")
TOTAL_FRAMES = 192   # 8 s @ 24 fps
FPS          = 24
ORBIT_RADIUS = 9.5   # metres from scene mid-point (between −2.5 and +2.5 on X)
ORBIT_HEIGHT = 1.8   # metres above ground — eye-level with top of panel


def setup_render():
    scene = bpy.context.scene
    scene.render.fps               = FPS
    scene.frame_start              = 1
    scene.frame_end                = TOTAL_FRAMES
    scene.render.engine            = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format     = 'MPEG4'
    scene.render.ffmpeg.codec      = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.resolution_x      = 1920
    scene.render.resolution_y      = 1080
    scene.render.filepath          = OUT_PATH
    os.makedirs(VIDEO_DIR, exist_ok=True)


def setup_orbit():
    """Full 180° orbit centred between sphere (−2.5, 0, 0) and panel (+2.5, 0, 0).

    Start angle = 0° (camera on −Y axis, front-on view of both objects).
    End angle   = 180° (camera on +Y axis, rear view showing neon glow from back).

    WHY 180° rather than 360°: the flat panel reads very differently from
    front (grid of orange tubes on black base) vs. back (backs of tubes, depth
    visible). A 360° orbit spends too long on uninformative side-on angles. 180°
    shows both the most informative front and the revealing rear in 8 seconds.
    """
    scene = bpy.context.scene

    pivot = bpy.data.objects.new("OrbitPivot", None)
    pivot.location = Vector((0.0, 0.0, 0.0))
    bpy.context.collection.objects.link(pivot)

    if scene.camera:
        cam = scene.camera
    else:
        cam_d = bpy.data.cameras.new("RecordCam")
        cam_d.lens = 35.0
        cam = bpy.data.objects.new("RecordCam", cam_d)
        bpy.context.collection.objects.link(cam)
        scene.camera = cam

    cam.parent = pivot
    # Camera starts on the −Y side, elevated, pointing at origin
    cam.location = Vector((0, -ORBIT_RADIUS, ORBIT_HEIGHT))
    cam.rotation_euler = (math.radians(79), 0, 0)

    # Keyframe pivot Z rotation: 0° → 180°
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler = (0, 0, math.radians(180))
    pivot.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES)

    # Linear interpolation → constant angular velocity
    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def main():
    setup_render()
    setup_orbit()
    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 → {VIDEO_DIR}")


if __name__ == "__main__":
    main()
