"""
record.py — viewport animation for ArrayModifier radial crown + helix tutorial
Renders a 6-second turntable: camera orbits 360° around the merged prop.
Output: public/library/videos/scripting/python-bpy-array-modifier-object-offset-radial-helix-webxr/viewport.mp4
Blender 5.1 | CC0
"""

import bpy
import math

OUTPUT_PATH = "//../../videos/scripting/python-bpy-array-modifier-object-offset-radial-helix-webxr/viewport.mp4"
FPS         = 30
DURATION_S  = 6
FRAMES      = FPS * DURATION_S   # 180
CAM_DIST    = 2.20
CAM_HEIGHT  = 0.65


def setup_scene():
    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_WORKBENCH'
    scene.display.shading.type   = 'SOLID'
    scene.display.shading.light  = 'MATCAP'
    scene.display.shading.color_type = 'VERTEX'
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.fps             = FPS
    scene.frame_start            = 1
    scene.frame_end              = FRAMES
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format   = 'MPEG4'
    scene.render.ffmpeg.codec    = 'H264'
    scene.render.filepath        = OUTPUT_PATH


def add_camera():
    cam_data = bpy.data.cameras.new("rec_cam")
    cam_data.lens = 50.0
    cam = bpy.data.objects.new("rec_cam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    # Track-to constraint so camera always looks at origin
    cns = cam.constraints.new('TRACK_TO')
    cns.target     = bpy.data.objects.get("hf_array_crown_helix") or cam
    cns.track_axis = 'TRACK_NEGATIVE_Z'
    cns.up_axis    = 'UP_Y'

    return cam


def keyframe_orbit(cam):
    """
    Orbit camera 360° around Z in FRAMES steps.
    Single rotation axis avoids quaternion interpolation artefacts.
    """
    for f in range(1, FRAMES + 1):
        angle = math.tau * (f - 1) / FRAMES
        cam.location.x = CAM_DIST * math.cos(angle)
        cam.location.y = CAM_DIST * math.sin(angle)
        cam.location.z = CAM_HEIGHT
        cam.keyframe_insert("location", frame=f)

    # Linear interpolation for constant orbit speed
    action = cam.animation_data.action
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def render():
    bpy.ops.render.render(animation=True, write_still=False)


if __name__ == "__main__":
    # Run blueprint.py first to populate the scene
    exec(open(bpy.path.abspath("//blueprint.py")).read())

    setup_scene()
    cam = add_camera()
    keyframe_orbit(cam)

    import os
    os.makedirs(
        bpy.path.abspath("//../../videos/scripting/"
                         "python-bpy-array-modifier-object-offset-radial-helix-webxr/"),
        exist_ok=True,
    )
    render()
    print("[holoflow] record.py complete → viewport.mp4")
