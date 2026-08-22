"""
record.py — Viewport animation for Multi-View Camera Rig tutorial
Blender 5.1  ·  CC0  ·  Holoflow Studio

Requires blueprint.py to have run first.  The scene already contains the
faceted icosphere subject, the CamRig collection, and the cam_rig_root empty.

Animation (150 frames / 5 s at 30 fps):
  - cam_rig_root rotates 360° around Z at constant speed
  - A separate viewport camera orbits at higher elevation, showing the full
    Fibonacci shell of frustums rotating around the subject from the outside

Output: public/library/videos/scripting/
        python-multiview-camera-rig-gaussian-splat-render/viewport.mp4
"""

import bpy
import math
import os

import mathutils

# ── Config ────────────────────────────────────────────────────────────────────
FRAME_TOTAL  = 150
FPS          = 30
OUTPUT_PATH  = (
    "//../../../../videos/scripting/"
    "python-multiview-camera-rig-gaussian-splat-render/viewport"
)
RES_X        = 1280
RES_Y        = 720
ORBIT_RADIUS = 9.0
ORBIT_ELEV   = math.radians(28)   # elevation above equator for the viewport camera


def setup_render() -> None:
    s = bpy.context.scene
    s.frame_start = 1
    s.frame_end   = FRAME_TOTAL
    s.render.fps  = FPS
    s.render.resolution_x = RES_X
    s.render.resolution_y = RES_Y
    s.render.image_settings.file_format = 'FFMPEG'
    s.render.ffmpeg.format               = 'MPEG4'
    s.render.ffmpeg.codec                = 'H264'
    s.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    s.render.filepath = OUTPUT_PATH
    s.render.engine   = 'BLENDER_EEVEE_NEXT'
    s.eevee.taa_render_samples = 16


def add_viewport_camera() -> bpy.types.Object:
    """A wide-angle observer camera placed outside the Fibonacci shell."""
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    pivot = bpy.context.active_object
    pivot.name = "vc_pivot"

    x = ORBIT_RADIUS * math.cos(ORBIT_ELEV)
    z = ORBIT_RADIUS * math.sin(ORBIT_ELEV)
    bpy.ops.object.camera_add(location=(x, 0, z))
    vc = bpy.context.active_object
    vc.name = "viewport_cam"
    vc.data.lens = 18.0     # wider than the rig cameras to see the whole shell

    direction = mathutils.Vector((0, 0, 0)) - mathutils.Vector(vc.location)
    vc.rotation_mode       = 'QUATERNION'
    vc.rotation_quaternion = direction.to_track_quat('-Z', 'Y')
    vc.parent              = pivot

    bpy.context.scene.camera = vc
    return pivot


def animate_rig_rotation(root: bpy.types.Object) -> None:
    """Full 360° Z-rotation of the capture rig; linear for constant angular speed."""
    root.rotation_mode    = 'XYZ'
    root.rotation_euler   = (0, 0, 0)
    root.keyframe_insert("rotation_euler", frame=1)
    root.rotation_euler   = (0, 0, math.tau)
    root.keyframe_insert("rotation_euler", frame=FRAME_TOTAL)
    for fc in root.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def main() -> None:
    abs_dir = os.path.dirname(bpy.path.abspath(OUTPUT_PATH))
    os.makedirs(abs_dir, exist_ok=True)

    setup_render()
    add_viewport_camera()

    root = bpy.data.objects.get("cam_rig_root")
    if root is None:
        print("[record] ERROR: cam_rig_root not found — run blueprint.py first.")
        return

    animate_rig_rotation(root)
    bpy.ops.render.render(animation=True)
    print("[record] viewport.mp4 written.")


main()
