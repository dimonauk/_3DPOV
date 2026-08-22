"""
Viewport animation recorder for CVT Faceted Poi Head.
Outputs: public/library/videos/scripting/python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr/viewport.mp4
Run AFTER blueprint.py has placed 'hf_cvt_poi_head' in the scene.

The recording shows: poi head rotating 360° with EEVEE bloom (5 seconds at 24fps).
"""

import bpy
import math

OUTPUT_PATH = "//public/library/videos/scripting/" \
              "python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr/viewport.mp4"

FPS        = 24
DURATION_S = 6       # seconds
N_FRAMES   = FPS * DURATION_S

OBJ_NAME   = "hf_cvt_poi_head"


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0, -3.5, 0.5))
    cam = bpy.context.active_object
    cam.name = "record_cam"
    cam.data.lens = 50.0
    # Point camera at origin
    bpy.ops.object.constraint_add(type="TRACK_TO")
    cam.constraints["Track To"].target = bpy.data.objects[OBJ_NAME]
    cam.constraints["Track To"].track_axis = "TRACK_NEGATIVE_Z"
    cam.constraints["Track To"].up_axis    = "UP_Y"
    bpy.context.scene.camera = cam
    return cam


def animate_rotation(obj: bpy.types.Object) -> None:
    """One full 360° Z rotation over DURATION_S seconds."""
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.tau)  # 2π = 360°
    obj.keyframe_insert("rotation_euler", frame=N_FRAMES)

    # Linear interpolation (no easing) for constant angular velocity
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def configure_render() -> None:
    scn = bpy.context.scene
    scn.render.engine           = "BLENDER_EEVEE_NEXT"
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format    = "MPEG4"
    scn.render.ffmpeg.codec     = "H264"
    scn.render.ffmpeg.constant_rate_factor = "HIGH"
    scn.render.fps              = FPS
    scn.frame_start             = 1
    scn.frame_end               = N_FRAMES
    scn.render.resolution_x     = 1280
    scn.render.resolution_y     = 720
    scn.render.filepath         = OUTPUT_PATH
    # Black background to make emission pop
    scn.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)


def main() -> None:
    if OBJ_NAME not in bpy.data.objects:
        raise RuntimeError(f"Run blueprint.py first — object '{OBJ_NAME}' not found.")
    obj = bpy.data.objects[OBJ_NAME]
    setup_camera()
    animate_rotation(obj)
    configure_render()
    print(f"[record] Rendering {N_FRAMES} frames → {OUTPUT_PATH}")
    bpy.ops.render.render(animation=True)
    print("[record] Done.")


if __name__ == "__main__":
    main()
