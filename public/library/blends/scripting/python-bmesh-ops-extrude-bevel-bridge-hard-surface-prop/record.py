# record.py — viewport animation for the bmesh.ops hard-surface panel tutorial
# Output: public/library/videos/scripting/
#         python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop/viewport.mp4
#
# Run AFTER blueprint.py so the panel prop exists in the scene.
# A camera orbits the panel over 72 frames (2.4 s at 30 fps) — a 3/4 front arc
# that shows the recessed window, bevel strips, and conduit tubes together.

import bpy
import math
import mathutils

FRAMES   = 72
FPS      = 30
ORBIT_R  = 3.6          # radial distance from panel centre
ORBIT_Z  = 0.55         # camera Z height (above horizontal centreline)
ARC_DEG  = 180.0        # orbit arc in degrees (0 → 180: front-left to front-right)
OUT_PATH = (
    "//../../../../public/library/videos/scripting/"
    "python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop/viewport.mp4"
)


def setup_render():
    sc = bpy.context.scene
    sc.render.engine                        = 'BLENDER_EEVEE_NEXT'
    sc.render.fps                           = FPS
    sc.frame_start                          = 1
    sc.frame_end                            = FRAMES
    sc.render.filepath                      = OUT_PATH
    sc.render.image_settings.file_format    = 'FFMPEG'
    sc.render.ffmpeg.format                 = 'MPEG4'
    sc.render.ffmpeg.codec                  = 'H264'
    sc.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
    sc.render.resolution_x                  = 1280
    sc.render.resolution_y                  = 720
    sc.render.resolution_percentage         = 100


def add_lights():
    # Three-point rig chosen to make the bevel highlight loops visible.
    # Key from upper-right punches across the chamfered edges; Rim from
    # upper-rear traces the conduit silhouette.
    for name, loc, energy, colour in (
        ("Key",  ( 4.0,  3.0,  3.0), 15.0, (1.00, 0.97, 0.90)),
        ("Fill", (-3.0, -1.5,  2.0),  4.0, (0.80, 0.90, 1.00)),
        ("Rim",  ( 0.0, -4.0,  2.5),  6.0, (1.00, 0.95, 0.80)),
    ):
        ld         = bpy.data.lights.new(name, 'SUN')
        ld.energy  = energy
        ld.color   = colour
        lo         = bpy.data.objects.new(name, ld)
        bpy.context.collection.objects.link(lo)
        lo.location = loc
        direction   = mathutils.Vector((-lo.location.x, -lo.location.y, -lo.location.z)).normalized()
        lo.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


def add_camera_orbit():
    """
    Camera orbits from ARC_START to ARC_END in world XY (Z-up).
    At each keyframe the camera always points toward the panel centre (0, 0, 0).
    LINEAR interpolation keeps the orbit at constant angular velocity.
    """
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    arc_start = math.radians(-90.0)   # front-left
    arc_end   = math.radians( 90.0)   # front-right (stays in front hemisphere)

    for frame in range(1, FRAMES + 1):
        t     = (frame - 1) / (FRAMES - 1)
        angle = arc_start + t * (arc_end - arc_start)
        x     = ORBIT_R * math.cos(angle)
        y     = ORBIT_R * math.sin(angle)
        z     = ORBIT_Z

        cam_ob.location = (x, y, z)
        direction       = mathutils.Vector((-x, -y, -z)).normalized()
        cam_ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

        cam_ob.keyframe_insert("location",       frame=frame)
        cam_ob.keyframe_insert("rotation_euler", frame=frame)

    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
        fc.update()


def make_output_dir():
    import os
    out_dir = bpy.path.abspath(
        "//../../../../public/library/videos/scripting/"
        "python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop/"
    )
    os.makedirs(out_dir, exist_ok=True)


def main():
    panel = bpy.data.objects.get("scifi_panel_prop")
    if panel is None:
        print("[record.py] scifi_panel_prop not found — run blueprint.py first")
        return

    # EEVEE: enable screen-space reflections so bevel highlights read clearly
    bpy.context.scene.eevee.use_ssr      = True
    bpy.context.scene.eevee.use_ssr_half_resolution = False

    setup_render()
    add_lights()
    add_camera_orbit()
    make_output_dir()

    bpy.ops.render.render(animation=True)
    print(f"[record.py] Rendered {FRAMES} frames → {bpy.path.abspath(OUT_PATH)}")


if __name__ == "__main__":
    main()
