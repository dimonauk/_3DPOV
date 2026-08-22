# record.py — viewport animation recorder for BVHTree surface scatter
# Output: public/library/videos/scripting/
#         python-mathutils-bvhtree-raycast-surface-scatter-webxr/viewport.mp4
#
# Run AFTER blueprint.py so the scatter props exist in the scene.
# Camera orbits the origin over 120 frames; props reveal one-by-one
# to animate the scatter "build-up" for tutorial audiences.

import bpy
import math
from mathutils import Vector

FRAMES    = 120
FPS       = 24
ORBIT_R   = 5.0
ORBIT_Z   = 1.8
OUT_PATH  = (
    "//../../../../public/library/videos/scripting/"
    "python-mathutils-bvhtree-raycast-surface-scatter-webxr/viewport.mp4"
)


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = FRAMES
    scene.render.filepath = OUT_PATH
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100


def add_orbit_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_ob = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    for frame in range(1, FRAMES + 1):
        angle = (2 * math.pi) * ((frame - 1) / FRAMES)
        cam_ob.location = Vector((
            ORBIT_R * math.cos(angle),
            ORBIT_R * math.sin(angle),
            ORBIT_Z,
        ))
        direction = -cam_ob.location.normalized()
        cam_ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        cam_ob.keyframe_insert("location", frame=frame)
        cam_ob.keyframe_insert("rotation_euler", frame=frame)

    # constant orbit speed — no ease-in/out on camera
    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
        fc.update()

    return cam_ob


def reveal_props_sequentially(instances: list):
    """Keyframe each prop hidden → visible spread across FRAMES."""
    n = len(instances)
    if n == 0:
        return
    step = max(1, FRAMES // n)
    for idx, ob in enumerate(instances):
        reveal_frame = min(1 + idx * step, FRAMES)

        ob.hide_viewport = True
        ob.hide_render = True
        ob.keyframe_insert("hide_viewport", frame=1)
        ob.keyframe_insert("hide_render", frame=1)

        ob.hide_viewport = False
        ob.hide_render = False
        ob.keyframe_insert("hide_viewport", frame=reveal_frame)
        ob.keyframe_insert("hide_render", frame=reveal_frame)


def add_light():
    light_data = bpy.data.lights.new("KeyLight", 'SUN')
    light_data.energy = 4.0
    light_ob = bpy.data.objects.new("KeyLight", light_data)
    bpy.context.collection.objects.link(light_ob)
    light_ob.rotation_euler = (math.radians(45), 0, math.radians(45))


def main():
    setup_render()
    add_light()
    add_orbit_camera()

    # collect scatter instances (all objects whose name starts with ScatterProp
    # but is not the hidden source prop named exactly "ScatterProp")
    instances = sorted(
        [
            o for o in bpy.data.objects
            if o.name.startswith("ScatterProp") and o.name != "ScatterProp"
        ],
        key=lambda o: o.name,
    )
    reveal_props_sequentially(instances)

    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
