"""
record.py — Phyllotaxis Viewport Animation
Holoflow Studio | Blender 5.1 | CC0

120-frame EEVEE Next animation. Run AFTER blueprint.py.

  F1-40   : top-down of sunflower disk (spiral arms & parastichies visible)
  F41-80  : 90° side orbit of torus (golden lattice wrapping visible)
  F81-120 : pull-back two-shot of both objects together

Output: public/library/videos/scripting/
        python-numpy-phyllotaxis-golden-angle-torus-spiral-sculpture-webxr/
        viewport.mp4
"""
import bpy, math
from mathutils import Vector

SLUG     = "python-numpy-phyllotaxis-golden-angle-torus-spiral-sculpture-webxr"
OUT_PATH = f"//public/library/videos/scripting/{SLUG}/viewport.mp4"
FPS      = 24
SAMPLES  = 16


def _kf(cam, frame, loc, rx, rz):
    cam.location          = loc
    cam.rotation_euler    = (math.radians(rx), 0.0, math.radians(rz))
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)


def setup_render(scene):
    scene.render.engine                      = "BLENDER_EEVEE_NEXT"
    scene.render.filepath                    = OUT_PATH
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.fps                         = FPS
    scene.render.resolution_x               = 1920
    scene.render.resolution_y               = 1080
    scene.frame_end                          = 120
    scene.eevee.taa_render_samples           = SAMPLES
    scene.eevee.use_bloom                    = True
    scene.eevee.bloom_threshold              = 0.5


def main():
    scene = bpy.context.scene
    setup_render(scene)

    cam_data      = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam           = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # F1-40: overhead disk (disk sits at X=+3.2)
    _kf(cam, 1,  Vector(( 3.2,  0.0, 7.2)), rx=0,  rz=0)
    _kf(cam, 40, Vector(( 3.2,  0.0, 7.2)), rx=0,  rz=0)

    # F41-80: side orbit of torus at origin, 90° sweep
    _kf(cam, 41, Vector(( 0.0,  3.2, 2.0)), rx=52, rz=0)
    _kf(cam, 80, Vector((-3.2,  0.0, 2.0)), rx=52, rz=90)

    # F81-120: pull back, frame both objects
    _kf(cam, 81,  Vector(( 1.5,  6.0, 5.0)), rx=40, rz=22)
    _kf(cam, 120, Vector(( 1.5, -6.0, 5.0)), rx=40, rz=-22)

    # Smooth bezier interpolation
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

    # Key light — warm point, off-axis from camera
    ld          = bpy.data.lights.new("KeyLight", "POINT")
    ld.energy   = 260.0
    ld.color    = (1.0, 0.92, 0.82)
    lo          = bpy.data.objects.new("KeyLight", ld)
    lo.location = Vector((2.0, -2.0, 4.5))
    scene.collection.objects.link(lo)

    bpy.ops.render.render(animation=True)
    print(f"[hf] record → {OUT_PATH}")


main()
