# record.py — viewport animation for the bmesh faceted gem tutorial
# Output: public/library/videos/scripting/
#         python-bmesh-faceted-gem-topology-construction-webxr/viewport.mp4
#
# Run AFTER blueprint.py so the gem object exists in the scene.
# The gem makes one full Z-axis rotation over 72 frames while three
# directional lights cast catch-lights across the sharp-edged facets.

import bpy
import math
import mathutils

FRAMES   = 72
FPS      = 24
ORBIT_R  = 2.8
ORBIT_Z  = 0.9
OUT_PATH = (
    "//../../../../public/library/videos/scripting/"
    "python-bmesh-faceted-gem-topology-construction-webxr/viewport.mp4"
)


def setup_render() -> None:
    s = bpy.context.scene
    s.render.engine              = 'BLENDER_EEVEE_NEXT'
    s.render.fps                 = FPS
    s.frame_start                = 1
    s.frame_end                  = FRAMES
    s.render.filepath            = OUT_PATH
    s.render.image_settings.file_format = 'FFMPEG'
    s.render.ffmpeg.format       = 'MPEG4'
    s.render.ffmpeg.codec        = 'H264'
    s.render.resolution_x        = 1280
    s.render.resolution_y        = 720
    s.render.resolution_percentage = 100


def add_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    cam_ob.location = (ORBIT_R, 0.0, ORBIT_Z)
    direction = mathutils.Vector((-ORBIT_R, 0.0, -ORBIT_Z)).normalized()
    cam_ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


def spin_gem() -> None:
    """One full Z rotation over FRAMES frames at constant speed."""
    gem = bpy.data.objects.get("faceted_gem")
    if gem is None:
        print("[record.py] faceted_gem not found — run blueprint.py first")
        return

    gem.rotation_euler = (0.0, 0.0, 0.0)
    gem.keyframe_insert("rotation_euler", frame=1)
    gem.rotation_euler = (0.0, 0.0, 2 * math.pi)
    gem.keyframe_insert("rotation_euler", frame=FRAMES)

    # LINEAR prevents ease-in/out — keeps angular velocity constant so each
    # facet's catch-light spends equal time in frame.
    for fc in gem.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
        fc.update()


def add_lights() -> None:
    # Three-point setup: multiple sources create distinct catch-lights on each
    # facet as the gem rotates — the main visual payoff of sharp-edge marking.
    lights = [
        ("Key",  ( 3.0,  2.0, 2.5), 8.0),
        ("Fill", (-2.5, -1.0, 1.5), 2.5),
        ("Rim",  ( 0.0, -3.0, 1.0), 3.5),
    ]
    for name, loc, energy in lights:
        ld      = bpy.data.lights.new(name, 'SUN')
        ld.energy = energy
        lo      = bpy.data.objects.new(name, ld)
        bpy.context.collection.objects.link(lo)
        lo.location = loc


def main() -> None:
    setup_render()
    add_lights()
    add_camera()
    spin_gem()
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
