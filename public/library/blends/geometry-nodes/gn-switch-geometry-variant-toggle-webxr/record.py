"""
record.py — GN Switch Geometry Variant Toggle: viewport render (Blender 5.1)
Outputs: public/library/videos/geometry-nodes/gn-switch-geometry-variant-toggle-webxr/viewport.mp4

Renders 5 seconds at 30 fps. Frames 1-60: pristine panel (Damaged=False).
Frames 61-90: slow cross-dissolve via Damage Scale scrub (dramatic reveal).
Frames 91-150: damaged panel with camera orbit.
"""

import bpy, math
from mathutils import Vector
from pathlib import Path

FPS      = 30
FRAMES   = 150
RADIUS   = 4.2
HEIGHT   = 0.8


def setup_scene():
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAMES
    sc.render.fps  = FPS
    sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    out = (
        Path(__file__).resolve().parents[4]
        / "videos/geometry-nodes/gn-switch-geometry-variant-toggle-webxr"
    )
    out.mkdir(parents=True, exist_ok=True)
    sc.render.filepath = str(out / "viewport")
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format              = "MPEG4"
    sc.render.ffmpeg.codec               = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"


def add_sun():
    bpy.ops.object.light_add(type="SUN", location=(4, -4, 7))
    sun = bpy.context.active_object
    sun.data.energy      = 3.5
    sun.rotation_euler   = (math.radians(55), 0, math.radians(45))


def add_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_data.lens = 50

    # Frames 1-60: static three-quarter view of clean panel
    for f in (1, 60):
        cam_obj.location       = Vector((2.5, -3.8, HEIGHT))
        cam_obj.rotation_euler = (math.radians(78), 0, math.radians(33))
        cam_obj.keyframe_insert("location",       frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)

    # Frames 61-150: orbit revealing damaged panel
    for f in range(61, FRAMES + 1):
        t     = (f - 61) / (FRAMES - 61)
        angle = math.pi / 4 + t * (math.pi / 3)   # quarter-circle sweep
        pos   = Vector((RADIUS * math.sin(angle), -RADIUS * math.cos(angle), HEIGHT))
        cam_obj.location = pos
        look  = Vector((0, 0, 0)) - pos
        cam_obj.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
        cam_obj.keyframe_insert("location",       frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)

    # Smooth interpolation
    if cam_obj.animation_data:
        for fc in cam_obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"

    return cam_obj


def animate_switch(ob):
    """
    Keyframe the 'Damaged' modifier boolean.
    Frame 1-60  → False (pristine)
    Frame 61    → True  (damaged — switch happens at cut point)
    """
    mod = ob.modifiers.get("HS_SwitchToggle")
    if not mod:
        return
    # Find the socket identifier for 'Damaged'
    sock_id = None
    for item in mod.node_group.interface.items_tree:
        if item.name == "Damaged":
            sock_id = item.identifier
            break
    if sock_id is None:
        return

    for f, val in ((1, False), (60, False), (61, True), (FRAMES, True)):
        mod[sock_id] = val
        mod.keyframe_insert(f'["{sock_id}"]', frame=f)


def main():
    setup_scene()
    add_sun()

    ob = bpy.data.objects.get("wall_panel_switch")
    if ob is None:
        print("[holoflow] run blueprint.py first to create the wall panel object.")
        return

    add_camera()
    animate_switch(ob)
    bpy.ops.render.render(animation=True)
    print("[holoflow] record.py render complete.")


if __name__ == "__main__":
    main()
