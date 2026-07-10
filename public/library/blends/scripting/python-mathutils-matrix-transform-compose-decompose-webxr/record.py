"""
record.py — Viewport animation recording for the mathutils.Matrix tutorial.
Outputs: public/library/videos/scripting/python-mathutils-matrix-transform-compose-decompose-webxr/viewport.mp4

Run from Blender's Script Editor AFTER running blueprint.py (or with the .blend already open).
Duration: 120 frames @ 24 fps = 5 seconds.
  F 1 – 40  : camera orbits while satellites fade in one by one
  F 41 – 80 : pivot-rotate the constellation clockwise 90°
  F 81 – 120: camera pull-back revealing the full orbit ring + children
"""

import bpy, math
from mathutils import Matrix, Vector, Euler

# ── Output path ────────────────────────────────────────────────────────────────
OUTPUT_PATH = (
    "//../../../../videos/scripting/"
    "python-mathutils-matrix-transform-compose-decompose-webxr/viewport.mp4"
)
FRAME_END   = 120
FPS         = 24


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = bpy.path.abspath(OUTPUT_PATH)

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100


def add_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("rec_cam")
    cam_data.lens = 50.0
    cam  = bpy.data.objects.new("rec_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def add_sun() -> None:
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.data.angle  = math.radians(5)
    sun.rotation_euler = Euler((math.radians(55), 0, math.radians(30)), 'XYZ')


def keyframe_camera_orbit(cam: bpy.types.Object) -> None:
    """
    Orbit the camera around the world origin on an elevated arc.
    Frame 1  : 30° longitude, 25° elevation, distance 10
    Frame 80 : 120° longitude (90° sweep), same elevation
    Frame 120: 120° longitude, elevation pulled back to 15°, distance 13
    WHY animate_workaround: camera parent object is simpler than animated constraints
    for a one-shot screen recording — no bake step needed.
    """
    def cam_pos(lon_deg: float, lat_deg: float, dist: float) -> Vector:
        lon = math.radians(lon_deg)
        lat = math.radians(lat_deg)
        return Vector((
            dist * math.cos(lat) * math.cos(lon),
            dist * math.cos(lat) * math.sin(lon),
            dist * math.sin(lat),
        ))

    def point_at_origin(cam: bpy.types.Object, pos: Vector) -> None:
        direction = (Vector((0, 0, 0)) - pos).normalized()
        rot_q     = direction.to_track_quat('-Z', 'Y')
        cam.matrix_world = Matrix.Translation(pos) @ rot_q.to_matrix().to_4x4()

    keyframes = [
        (1,   30,  25, 10.0),
        (40,  60,  25, 10.0),
        (80,  120, 25, 10.0),
        (120, 120, 18, 13.0),
    ]
    for frame, lon, lat, dist in keyframes:
        pos = cam_pos(lon, lat, dist)
        point_at_origin(cam, pos)
        cam.keyframe_insert('location',         frame=frame)
        cam.keyframe_insert('rotation_euler',   frame=frame)
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
        fc.update()


def keyframe_satellite_reveal(satellites: list) -> None:
    """
    Fade satellites in sequentially: each appears over 4 frames, staggered by 4.
    WHY hide_viewport → hide_render toggle: object visibility keyframes
    survive GLB export as extras data but are cheap and readable here.
    """
    for i, sat in enumerate(satellites):
        appear_f = 1 + i * 7
        for frame in [1, max(1, appear_f - 1)]:
            sat.hide_render = True
            sat.keyframe_insert('hide_render', frame=frame)
        sat.hide_render = False
        sat.keyframe_insert('hide_render', frame=appear_f)


def keyframe_pivot_rotation(satellites: list, children: list) -> None:
    """
    Animate the 90° pivot rotation between frame 41 and frame 80.
    We key the initial world position at f41, then advance the scene
    frame-by-frame through the rotation arc.  This is the record.py
    equivalent of the blueprint's pivot_rotate() call — using tiny per-frame
    increments so BEZIER handles interpolate the arc correctly.
    """
    import bpy
    from mathutils import Vector

    all_obs = satellites + children
    for ob in all_obs:
        ob.rotation_mode = 'QUATERNION'

    steps      = 39         # frames 41 → 80
    total_ang  = math.radians(90)

    for step in range(steps + 1):
        frame = 41 + step
        frac  = step / steps
        # Rotate each object by (frac * total_ang) from its frame-41 pose.
        # We re-read matrix_world at f=41 each step by keyframing the incremental.
        bpy.context.scene.frame_set(frame)
        if step == 0:
            for ob in all_obs:
                ob.keyframe_insert('location',            frame=frame)
                ob.keyframe_insert('rotation_quaternion', frame=frame)
        else:
            ang = (total_ang / steps)
            for ob in all_obs:
                from mathutils import Matrix
                R = Matrix.Rotation(ang, 4, Vector((0, 0, 1)))
                ob.matrix_world = R @ ob.matrix_world
                ob.keyframe_insert('location',            frame=frame)
                ob.keyframe_insert('rotation_quaternion', frame=frame)
    for ob in all_obs:
        for fc in (ob.animation_data.action.fcurves if ob.animation_data else []):
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'
            fc.update()


def main() -> None:
    setup_render()
    add_sun()
    cam = add_camera()

    satellites = [ob for ob in bpy.data.objects if ob.name.startswith("sat_")]
    satellites.sort(key=lambda o: o.name)
    children   = [ob for ob in bpy.data.objects if ob.name.startswith("knob_")]

    if not satellites:
        raise RuntimeError("Run blueprint.py first to create the scene objects.")

    keyframe_camera_orbit(cam)
    keyframe_satellite_reveal(satellites)
    keyframe_pivot_rotation(satellites, children)

    bpy.context.scene.frame_set(1)
    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f"[holoflow] record.py complete → {bpy.path.abspath(OUTPUT_PATH)}")


main()
