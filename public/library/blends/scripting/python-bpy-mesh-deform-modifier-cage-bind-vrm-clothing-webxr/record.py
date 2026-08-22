"""
record.py — viewport animation render for the MeshDeform cage-bind demo.
Runs AFTER blueprint.py has built the scene.
Outputs: public/library/videos/scripting/
         python-bpy-mesh-deform-modifier-cage-bind-vrm-clothing-webxr/viewport.mp4

Technique demonstrated:
  Frames 1–60: cage waist pinch (shape key 0→1→0) drives the cloth tunic.
  Camera orbits 30° to show the three-dimensional deformation.
"""

import bpy
import math
from mathutils import Vector

VIDEO_DIR  = "//../../videos/scripting/python-bpy-mesh-deform-modifier-cage-bind-vrm-clothing-webxr/"
VIDEO_FILE = VIDEO_DIR + "viewport"

FRAME_START = 1
FRAME_END   = 60
FPS         = 24

CAM_RADIUS   = 3.2
CAM_HEIGHT   = 0.9       # focus roughly at waist
CAM_TILT_DEG = 18.0      # slight downward angle

ORBIT_START_DEG = -20.0
ORBIT_END_DEG   =  20.0  # gentle arc to show depth


def _camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("hf_record_cam")
    cam_data.lens = 50.0
    cam = bpy.data.objects.new("hf_record_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def _set_render() -> None:
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.resolution_percentage = 50   # 960×540 for speed
    sc.render.fps = FPS
    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END
    sc.render.filepath = bpy.path.abspath(VIDEO_FILE)
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"


def _keyframe_camera(cam: bpy.types.Object) -> None:
    """Orbit camera from ORBIT_START_DEG to ORBIT_END_DEG over the clip."""
    for frame, angle_deg in [
        (FRAME_START, ORBIT_START_DEG),
        (FRAME_END,   ORBIT_END_DEG),
    ]:
        bpy.context.scene.frame_set(frame)
        angle = math.radians(angle_deg)
        cam.location = Vector((
            CAM_RADIUS * math.sin(angle),
            -CAM_RADIUS * math.cos(angle),
            CAM_HEIGHT,
        ))
        # Point camera toward the torso centre
        target = Vector((0.0, 0.0, 0.8))
        direction = target - cam.location
        rot_quat = direction.to_track_quat("-Z", "Y")
        cam.rotation_euler = rot_quat.to_euler()
        cam.rotation_euler.x += math.radians(CAM_TILT_DEG)
        cam.keyframe_insert(data_path="location", frame=frame)
        cam.keyframe_insert(data_path="rotation_euler", frame=frame)


def main() -> None:
    _set_render()
    cam = _camera()
    _keyframe_camera(cam)

    # Simple 3-point light rig
    for name, loc, energy in [
        ("hf_key",   ( 2.5,  -2.0, 3.5), 300.0),
        ("hf_fill",  (-2.0,  -1.5, 2.0),  80.0),
        ("hf_back",  ( 0.0,   3.0, 2.5), 120.0),
    ]:
        ld = bpy.data.lights.new(name, "POINT")
        ld.energy = energy
        lo = bpy.data.objects.new(name, ld)
        bpy.context.scene.collection.objects.link(lo)
        lo.location = loc

    bpy.ops.render.render(animation=True)
    print("[hf] Viewport render complete →", bpy.path.abspath(VIDEO_FILE + ".mp4"))


main()
