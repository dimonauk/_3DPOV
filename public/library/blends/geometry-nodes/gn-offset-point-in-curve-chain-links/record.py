"""
record.py — Viewport animation for GN Chain Links.
Blender 5.1  |  CC0  |  Holoflow Studio

Run AFTER blueprint.py (opens chain_path object with ChainLinks modifier).
Camera orbits 180° over 90 frames at 30 fps while the chain path rotates
60° in the same direction — parallax reveals the 3-D interlocking structure
from all sides and exposes the alternating-perpendicular ring silhouette.

Usage (headless):
  blender --background chain_links.blend --python record.py
"""

import bpy
import math

OUT_DIR  = "//../../videos/geometry-nodes/gn-offset-point-in-curve-chain-links/"
OUT_FILE = OUT_DIR + "viewport"
FPS      = 30
FRAMES   = 90           # 3 s

CAM_RADIUS = 5.5
CAM_TILT   = math.radians(28)   # elevation above the ring equator
CAM_START  = math.radians(-90)
CAM_END    = math.radians(90)   # 180° sweep

CHAIN_ROT_DEG = 60      # chain path rotates to show underside


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine                     = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x               = 1920
    sc.render.resolution_y               = 1080
    sc.render.fps                        = FPS
    sc.frame_start                       = 1
    sc.frame_end                         = FRAMES
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format              = "MPEG4"
    sc.render.ffmpeg.codec               = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.filepath                   = bpy.path.abspath(OUT_FILE)
    sc.eevee.taa_render_samples          = 64
    sc.eevee.use_gtao                    = True


def ensure_camera() -> bpy.types.Object:
    if "Camera" in bpy.data.objects:
        return bpy.data.objects["Camera"]
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "Camera"
    bpy.context.scene.camera = cam
    return cam


def ensure_key_light() -> None:
    if "KeyLight" in bpy.data.objects:
        return
    bpy.ops.object.light_add(type="AREA", location=(2.5, -2.5, 3.5))
    light = bpy.context.active_object
    light.name = "KeyLight"
    light.data.energy = 1200
    light.data.size = 2.0
    light.rotation_euler = (math.radians(50), 0, math.radians(30))


def animate_camera(cam: bpy.types.Object) -> None:
    cam.animation_data_create()
    action = bpy.data.actions.new("CamOrbit")
    cam.animation_data.action = action

    for f in range(FRAMES + 1):
        t = f / FRAMES
        theta = CAM_START + t * (CAM_END - CAM_START)
        x = CAM_RADIUS * math.cos(theta) * math.cos(CAM_TILT)
        y = CAM_RADIUS * math.sin(theta) * math.cos(CAM_TILT)
        z = CAM_RADIUS * math.sin(CAM_TILT)

        cam.location = (x, y, z)
        cam.keyframe_insert("location", frame=f + 1)

        # Always point at origin (chain centre)
        direction = (-x, -y, -z)
        import mathutils
        rot = mathutils.Vector(direction).to_track_quat("-Z", "Y").to_euler()
        cam.rotation_euler = rot
        cam.keyframe_insert("rotation_euler", frame=f + 1)


def animate_chain_path() -> None:
    chain_obj = bpy.data.objects.get("chain_path")
    if chain_obj is None:
        return
    chain_obj.animation_data_create()
    action = bpy.data.actions.new("ChainSpin")
    chain_obj.animation_data.action = action

    chain_obj.rotation_euler = (0.0, 0.0, 0.0)
    chain_obj.keyframe_insert("rotation_euler", frame=1)

    chain_obj.rotation_euler = (0.0, 0.0, math.radians(CHAIN_ROT_DEG))
    chain_obj.keyframe_insert("rotation_euler", frame=FRAMES)


def main() -> None:
    setup_render()
    cam = ensure_camera()
    ensure_key_light()
    animate_camera(cam)
    animate_chain_path()
    bpy.ops.render.render(animation=True)
    print(f"✓ viewport animation rendered → {OUT_FILE}")


main()
