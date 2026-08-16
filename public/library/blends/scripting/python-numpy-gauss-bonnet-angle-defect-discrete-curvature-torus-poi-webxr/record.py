"""
record.py — Viewport render script for Gauss-Bonnet torus
==========================================================
Run AFTER blueprint.py.  Assumes the scene contains the object built by
build().  Renders a 10-second (300-frame @ 30 fps) turntable animation that
slowly rotates the torus, showing the blue inner rim (K < 0) and red outer
equator (K > 0) from every angle.

Output: public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
from pathlib import Path

SLUG     = "python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
OBJ_NAME = "hf_gauss_bonnet_torus"
HERE     = Path(__file__).parent
OUT_DIR  = HERE.parents[3] / "videos" / "scripting" / SLUG
OUT_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_PATH = str(OUT_DIR / "viewport.mp4")

FRAMES     = 300    # 10 s at 30 fps
START      = 1
END        = FRAMES


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine              = "BLENDER_EEVEE_NEXT"
    sc.render.fps                 = 30
    sc.frame_start                = START
    sc.frame_end                  = END
    sc.render.resolution_x        = 1280
    sc.render.resolution_y        = 720
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format       = "MPEG4"
    sc.render.ffmpeg.codec        = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath            = VIDEO_PATH

    # Solid world background — neutral dark slate
    sc.world = bpy.data.worlds.new("RecordWorld")
    sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.06, 0.06, 0.08, 1.0)


def setup_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.location = (0.0, -0.22, 0.06)
    cam.rotation_euler = (1.35, 0.0, 0.0)   # slightly elevated angle


def setup_light() -> None:
    light_data = bpy.data.lights.new("KeyLight", type="AREA")
    light_data.energy = 80.0
    light_data.size   = 0.4
    light = bpy.data.objects.new("KeyLight", light_data)
    bpy.context.collection.objects.link(light)
    light.location = (0.15, -0.10, 0.20)


def animate_rotation() -> None:
    """Insert rotation keyframes — full 360° turntable over FRAMES frames."""
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        print("[record] Object not found — run blueprint.py first.")
        return

    import math
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=START)
    obj.rotation_euler = (0, 0, 2 * math.pi)
    obj.keyframe_insert("rotation_euler", frame=END)

    # Linear interpolation for steady turntable
    action = obj.animation_data.action
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def render_animation() -> None:
    bpy.ops.render.render(animation=True)
    print(f"[record] Rendered → {VIDEO_PATH}")


if __name__ == "__main__":
    setup_render()
    setup_camera()
    setup_light()
    animate_rotation()
    render_animation()
