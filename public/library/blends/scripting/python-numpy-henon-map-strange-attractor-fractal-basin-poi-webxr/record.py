"""
record.py — Viewport Animation for Hénon Basin + Poi Trail
===========================================================
Blender 5.1 | Holoflow Studio | CC0

Renders a 240-frame OpenGL animation to:
  public/library/videos/scripting/
    python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr/viewport.mp4

Timeline:
  F001–F060  Camera descends from top-down bird's-eye view → 45° diagonal.
             Basin relief colouring is fully visible from above.
  F061–F180  Camera orbits 360° around the combined scene at constant elevation.
             Poi trails glow as emissive tubes against the fractal basin.
  F181–F240  Camera zooms into the densest attractor region (centre of basin)
             to show the Cantor-fibre fine structure.

Run: open the .blend produced by blueprint.py, then Text → Run Script.
"""

import bpy, math

FPS         = 30
TOTAL_FRAME = 240
OUT_PATH    = "//../../../../videos/scripting/python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr/viewport.mp4"

# Camera orbit parameters
ORBIT_R     = 3.8       # radius at mid-elevation
ORBIT_Z     = 2.2       # elevation during orbit phase
ZOOM_TARGET = (0.0, 0.0, 0.08)   # centre of Hénon attractor in scene space


def _insert_loc_rot(cam, frame):
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)


def _linear_fcurves(obj):
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "record_cam"
    bpy.context.scene.camera = cam
    cam.data.lens = 35
    cam.data.clip_end = 50.0
    return cam


def setup_lighting():
    bpy.ops.object.light_add(type="SUN", location=(3.0, -3.0, 5.0))
    sun = bpy.context.active_object
    sun.data.energy = 2.0
    sun.data.angle = math.radians(5.0)

    bpy.ops.object.light_add(type="POINT", location=(0.0, 0.0, 2.5))
    fill = bpy.context.active_object
    fill.data.energy = 12.0
    fill.data.color = (0.3, 0.5, 1.0)


def key_camera(cam):
    # Phase 1: top-down → diagonal (F001–F060)
    cam.location = (0.0, 0.0, 4.5)
    cam.rotation_euler = (0.0, 0.0, 0.0)
    _insert_loc_rot(cam, 1)

    cam.location = (ORBIT_R * 0.7, -ORBIT_R * 0.7, ORBIT_Z)
    cam.rotation_euler = (math.radians(55.0), 0.0, math.radians(45.0))
    _insert_loc_rot(cam, 60)

    # Phase 2: full 360° orbit (F061–F180)
    steps = 6
    for s in range(steps + 1):
        t = s / steps
        angle = 2.0 * math.pi * t
        frame = 60 + int(t * 120)
        cam.location = (
            ORBIT_R * math.cos(angle),
            ORBIT_R * math.sin(angle),
            ORBIT_Z,
        )
        cam.rotation_euler = (
            math.radians(60.0),
            0.0,
            angle + math.pi * 0.5,
        )
        _insert_loc_rot(cam, frame)

    # Phase 3: zoom into attractor (F181–F240)
    cam.location = (0.4, 0.0, 2.0)
    cam.rotation_euler = (math.radians(72.0), 0.0, 0.0)
    _insert_loc_rot(cam, 181)

    cam.location = (0.1, 0.0, 0.9)
    cam.rotation_euler = (math.radians(75.0), 0.0, 0.0)
    _insert_loc_rot(cam, 240)

    _linear_fcurves(cam)

    # Point camera toward scene centre via Track To constraint
    empty = bpy.data.objects.new("orbit_target", None)
    empty.location = ZOOM_TARGET
    bpy.context.scene.collection.objects.link(empty)
    tc = cam.constraints.new("TRACK_TO")
    tc.target = empty
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis = "UP_Y"


def setup_render(scene):
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_bloom = True
    scene.eevee.bloom_threshold = 0.8
    scene.eevee.bloom_intensity = 0.6
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = TOTAL_FRAME
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUT_PATH


def main():
    scene = bpy.context.scene
    cam = setup_camera()
    setup_lighting()
    key_camera(cam)
    setup_render(scene)
    bpy.ops.render.render(animation=True)
    print("[holoflow] record.py complete → viewport.mp4")


if __name__ == "__main__":
    main()
