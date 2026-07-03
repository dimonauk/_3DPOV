# record.py — Viewport animation render
# Output: public/library/videos/scripting/
#         python-bpy-curve-data-bezier-nurbs-spline-api/viewport.mp4
#
# Scene: a Bézier S-cable reveals itself (bevel_factor_end 0→1),
# then a NURBS ring grows into frame (bevel_depth 0→target).
# Total: 120 frames @ 24 fps = 5 seconds.

import bpy, math
from mathutils import Vector

FPS          = 24
TOTAL_FRAMES = 120
OUTPUT       = ("//../../videos/scripting/"
                "python-bpy-curve-data-bezier-nurbs-spline-api/viewport.mp4")
CABLE_BEVEL  = 0.04
RING_BEVEL   = 0.025
RING_RADIUS  = 0.5


def reset() -> None:
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)


def key(datablock, prop: str, frame: int, value: float) -> None:
    setattr(datablock, prop, value)
    datablock.keyframe_insert(data_path=prop, frame=frame)


def make_cable_cu() -> bpy.types.Curve:
    cu = bpy.data.curves.new("rec_cable", 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = CABLE_BEVEL
    cu.bevel_resolution = 4
    cu.fill_mode = 'FULL'
    cu.resolution_u = 6
    cu.bevel_factor_end = 0.0   # hidden at frame 1

    spl = cu.splines.new('BEZIER')
    spl.bezier_points.add(3)

    pts = [
        ((-1.0,-0.6, 0.0), 'VECTOR', (-1.4,-0.6, 0.0), (-0.6,-0.6, 0.0)),
        ((-0.3, 0.4,  0.3), 'AUTO',  None,              None),
        (( 0.3,-0.4,  0.3), 'AUTO',  None,              None),
        (( 1.0, 0.6,  0.0), 'VECTOR',( 0.6, 0.6, 0.0), ( 1.4, 0.6, 0.0)),
    ]
    for i, (co, ht, hl, hr) in enumerate(pts):
        p = spl.bezier_points[i]
        p.co = Vector(co)
        p.handle_left_type = p.handle_right_type = ht
        if hl: p.handle_left  = Vector(hl)
        if hr: p.handle_right = Vector(hr)

    obj = bpy.data.objects.new("rec_cable", cu)
    bpy.context.collection.objects.link(obj)
    return cu


def make_ring_cu() -> tuple:
    cu = bpy.data.curves.new("rec_ring", 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.0   # hidden at frame 1
    cu.bevel_resolution = 3
    cu.fill_mode = 'FULL'

    spl = cu.splines.new('NURBS')
    spl.points.add(7)
    spl.order_u = 4
    spl.use_cyclic_u = True
    spl.use_endpoint_u = False

    n = 8
    for i, pt in enumerate(spl.points):
        a = 2 * math.pi * i / n
        pt.co = (math.cos(a) * RING_RADIUS, math.sin(a) * RING_RADIUS, 0.0, 1.0)

    obj = bpy.data.objects.new("rec_ring", cu)
    bpy.context.collection.objects.link(obj)
    obj.location.x = 2.0
    return cu, obj


def add_camera() -> None:
    bpy.ops.object.camera_add(location=(0.5, -3.8, 1.8))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(62), 0, math.radians(18))
    bpy.context.scene.camera = cam


def add_sun() -> None:
    bpy.ops.object.light_add(type='SUN', location=(2, -2, 4))
    bpy.context.active_object.data.energy = 3.0


def setup_render() -> None:
    scn = bpy.context.scene
    scn.render.fps = FPS
    scn.frame_start = 1
    scn.frame_end = TOTAL_FRAMES
    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format = 'MPEG4'
    scn.render.ffmpeg.codec  = 'H264'
    scn.render.filepath = OUTPUT
    scn.render.engine = 'BLENDER_WORKBENCH'


def main() -> None:
    reset()
    setup_render()

    cable_cu          = make_cable_cu()
    ring_cu, ring_obj = make_ring_cu()
    add_camera()
    add_sun()

    # Phase 1 (frames 1–48): cable tube writes itself along the path
    key(cable_cu, 'bevel_factor_end', 1,  0.0)
    key(cable_cu, 'bevel_factor_end', 48, 1.0)

    # Phase 2 (frames 48–96): NURBS ring bevel grows in
    key(ring_cu, 'bevel_depth', 48, 0.0)
    key(ring_cu, 'bevel_depth', 96, RING_BEVEL)

    # Phase 3 (frames 96–120): ring orbits for beauty shot
    ring_obj.rotation_euler.z = 0.0
    ring_obj.keyframe_insert('rotation_euler', frame=96)
    ring_obj.rotation_euler.z = math.radians(90)
    ring_obj.keyframe_insert('rotation_euler', frame=120)

    bpy.ops.render.render(animation=True)
    print("record.py complete — viewport.mp4 rendered.")


if __name__ == "__main__":
    main()
