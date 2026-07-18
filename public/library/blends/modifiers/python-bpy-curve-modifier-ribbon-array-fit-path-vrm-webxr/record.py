"""
record.py — viewport animation render for CurveModifier ribbon tutorial.
Outputs: public/library/videos/modifiers/python-bpy-curve-modifier-ribbon-array-fit-path-vrm-webxr/viewport.mp4

Run AFTER blueprint.py has created the scene.
Animates one Bezier control point to show the ribbon deforming live.
90 frames @ 24 fps ≈ 3.75 s. Material Preview shading.
"""

import bpy
from pathlib import Path

OUTPUT_PATH = "//../../videos/modifiers/python-bpy-curve-modifier-ribbon-array-fit-path-vrm-webxr/viewport.mp4"
FRAME_START = 1
FRAME_END   = 90
FPS         = 24


def ensure_output_dir():
    blend_dir = Path(bpy.data.filepath).parent
    out = blend_dir / "../../videos/modifiers/python-bpy-curve-modifier-ribbon-array-fit-path-vrm-webxr"
    out.mkdir(parents=True, exist_ok=True)


def setup_camera():
    scene = bpy.context.scene
    if "record_cam" in bpy.data.objects:
        cam_ob = bpy.data.objects["record_cam"]
    else:
        cam_data = bpy.data.cameras.new("record_cam")
        cam_data.lens = 50
        cam_ob = bpy.data.objects.new("record_cam", cam_data)
        bpy.context.collection.objects.link(cam_ob)
    cam_ob.location = (0.18, -0.55, 0.18)
    cam_ob.rotation_euler = (1.15, 0.0, 0.0)
    scene.camera = cam_ob
    return cam_ob


def setup_render(scene):
    scene.frame_start  = FRAME_START
    scene.frame_end    = FRAME_END
    scene.render.fps   = FPS

    scene.render.engine              = 'BLENDER_WORKBENCH'
    scene.display.shading.light      = 'MATCAP'
    scene.display.shading.color_type = 'MATERIAL'

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

    scene.render.resolution_x      = 1920
    scene.render.resolution_y      = 1080
    scene.render.resolution_percentage = 100
    scene.render.filepath           = bpy.path.abspath(OUTPUT_PATH)


def animate_curve_point():
    """
    Keyframe the 3rd Bezier control point vertically over 90 frames.
    This shows the ribbon responding live as the path inflects.
    CurveModifier re-evaluates every frame so the ribbon deforms visibly.
    """
    path_ob = bpy.data.objects.get("ribbon_path")
    if not path_ob:
        return

    curve    = path_ob.data
    spline   = curve.splines[0]
    bp       = spline.bezier_points[2]   # third control point

    bpy.context.scene.frame_set(1)
    bp.co.z = -0.055
    bp.keyframe_insert("co", frame=1)

    bpy.context.scene.frame_set(45)
    bp.co.z = 0.080
    bp.keyframe_insert("co", frame=45)

    bpy.context.scene.frame_set(90)
    bp.co.z = -0.055
    bp.keyframe_insert("co", frame=90)

    # Smooth interpolation
    for fcurve in path_ob.data.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'


def main():
    ensure_output_dir()
    scene = bpy.context.scene
    setup_camera()
    setup_render(scene)
    animate_curve_point()
    bpy.ops.render.render(animation=True)
    print("[holoflow] record.py render complete →", OUTPUT_PATH)


main()
