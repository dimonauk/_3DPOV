"""
record.py — Viewport render for Möbius Strip N-Twist Parametric Mesh
Blender 5.1 | CC0 | Holoflow Studio Library

Run AFTER blueprint.py in the same Blender session.
Outputs: public/library/videos/scripting/
         python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr/viewport.mp4

Camera arc:
  Frames 1–90   : wide orbit 45° above, full strip in view (one complete revolution)
  Frames 91–180 : slow zoom into the Möbius seam showing the colour flip
  Frames 181–240: pull back to reveal full topology — backface colour visible

12-second clip at 20 fps = 240 frames.
"""

import bpy, math
from mathutils import Vector, Euler

SLUG       = "hf_mobius"
FPS        = 20
N_FRAMES   = 240
OUTPUT_DIR = "//../../videos/scripting/python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr/"
RADIUS_CAM = 3.8       # camera orbit radius (m)
HEIGHT_CAM = 1.6       # camera elevation (m)
ZOOM_NEAR  = 2.2       # closest approach at seam zoom


def _get_strip() -> bpy.types.Object:
    obj = bpy.data.objects.get(SLUG)
    if obj is None:
        raise RuntimeError("Run blueprint.py first — hf_mobius not found.")
    return obj


def _setup_scene() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = N_FRAMES
    scene.render.fps  = FPS
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.filepath     = OUTPUT_DIR
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.display.shading.type              = "MATERIAL"


def _ensure_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def _ensure_key_light() -> None:
    if bpy.data.lights.get("RecordKey"):
        return
    light_data = bpy.data.lights.new("RecordKey", type="AREA")
    light_data.energy = 800
    light_data.size   = 2.0
    light_obj = bpy.data.objects.new("RecordKey", light_data)
    light_obj.location = (2.0, -2.5, 3.0)
    bpy.context.collection.objects.link(light_obj)

    fill_data = bpy.data.lights.new("RecordFill", type="AREA")
    fill_data.energy = 200
    fill_obj = bpy.data.objects.new("RecordFill", fill_data)
    fill_obj.location = (-3.0, 1.0, 1.5)
    bpy.context.collection.objects.link(fill_obj)


def _keyframe_camera(cam: bpy.types.Object) -> None:
    """
    Three-phase animation:
    Phase A (1–90):  steady orbit at elevation 45°, full revolution
    Phase B (91–180): zoom into seam region, elevation drops to 15°
    Phase C (181–240): pull back to wide 55° for topology reveal
    """
    scene = bpy.context.scene

    def _set(frame: int, radius: float, elevation: float, azimuth: float) -> None:
        scene.frame_set(frame)
        z = math.sin(math.radians(elevation)) * radius
        xy_r = math.cos(math.radians(elevation)) * radius
        cam.location = Vector((
            xy_r * math.cos(math.radians(azimuth)),
            xy_r * math.sin(math.radians(azimuth)),
            z,
        ))
        # Point camera at origin (strip centre)
        direction = -cam.location.normalized()
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location")
        cam.keyframe_insert("rotation_euler")

    # Phase A: full revolution
    for f in range(1, 91, 10):
        t = (f - 1) / 89.0
        _set(f, RADIUS_CAM, 45.0, t * 360.0)

    # Phase B: zoom to seam (azimuth ≈ 0° = where the seam colour flip is)
    for f in range(91, 181, 10):
        t = (f - 91) / 89.0
        radius = RADIUS_CAM + (ZOOM_NEAR - RADIUS_CAM) * t
        elev   = 45.0 + (15.0 - 45.0) * t
        _set(f, radius, elev, 360.0 - t * 30.0)

    # Phase C: pull back and rise
    for f in range(181, 241, 10):
        t = (f - 181) / 59.0
        radius = ZOOM_NEAR + (RADIUS_CAM - ZOOM_NEAR) * t
        elev   = 15.0 + (55.0 - 15.0) * t
        _set(f, radius, elev, 330.0 + t * 90.0)


def main() -> None:
    strip = _get_strip()
    _setup_scene()
    cam = _ensure_camera()
    _ensure_key_light()
    _keyframe_camera(cam)
    bpy.ops.render.opengl(animation=True)
    print(f"[record] viewport.mp4 → {OUTPUT_DIR}")


main()
