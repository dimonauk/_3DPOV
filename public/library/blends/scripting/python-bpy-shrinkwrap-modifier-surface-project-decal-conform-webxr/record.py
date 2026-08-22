"""
record.py — viewport animation render for the ShrinkwrapModifier decal tutorial.

Outputs: public/library/videos/scripting/
           python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr/
           viewport.mp4

Run AFTER blueprint.py.  The scene must contain hf_dome_target + hf_decal.
Animates a 120-frame orbit (24 fps / 5 s) in Workbench, tilting camera to show
the decal draped over the curved dome surface from multiple angles.
"""

import bpy
import math

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
OUTPUT_PATH  = "//../../../../videos/scripting/" \
               "python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr/" \
               "viewport"
FRAME_START  = 1
FRAME_END    = 120
FPS          = 24
CAM_DISTANCE = 3.6
CAM_HEIGHT   = 2.0
CAM_FOCUS_Z  = 0.6


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(CAM_DISTANCE, 0.0, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "rec_cam"

    bpy.ops.object.empty_add(location=(0.0, 0.0, CAM_FOCUS_Z))
    target = bpy.context.active_object
    target.name = "rec_target"

    ct = cam.constraints.new('TRACK_TO')
    ct.target     = target
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'

    bpy.context.scene.camera = cam
    return cam


def keyframe_orbit(cam: bpy.types.Object) -> None:
    """
    Full 360° orbit with gentle camera height oscillation.
    The camera dips lower in the second half to show the decal profile from
    near-horizontal — useful for confirming the ABOVE_SURFACE lift is uniform.
    """
    scene = bpy.context.scene
    for frame in range(FRAME_START, FRAME_END + 1):
        t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = math.tau * t
        # Height oscillates: high at front, low at back
        height = CAM_HEIGHT - 0.6 * math.sin(angle)
        cam.location.x = CAM_DISTANCE * math.cos(angle)
        cam.location.y = CAM_DISTANCE * math.sin(angle)
        cam.location.z = height
        scene.frame_set(frame)
        cam.keyframe_insert("location", frame=frame)


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.resolution_x               = 1920
    scene.render.resolution_y               = 1080
    scene.render.resolution_percentage      = 100
    scene.render.filepath                   = OUTPUT_PATH

    # Workbench cavity reveals the surface curvature clearly
    ws = scene.display.shading
    ws.light               = 'MATCAP'
    ws.show_cavity         = True
    ws.cavity_type         = 'WORLD'
    ws.cavity_ridge_factor = 1.4
    ws.show_object_outline = True
    ws.object_outline_color = (0.08, 0.90, 0.40)   # match decal teal


def add_light() -> None:
    bpy.ops.object.light_add(type='AREA', location=(2.5, -2.0, 3.5))
    light = bpy.context.active_object
    light.data.energy = 500
    light.data.size   = 3.0


def main() -> None:
    cam = setup_camera()
    keyframe_orbit(cam)
    add_light()
    setup_render()
    bpy.ops.render.render(animation=True)
    print("[holoflow] viewport.mp4 rendered")


if __name__ == "__main__":
    main()
