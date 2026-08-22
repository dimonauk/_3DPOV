"""
Holoflow Studio — Blender 5.1
record.py — EEVEE turntable render for
python-bmesh-ops-offset-edgeloops-support-loop-panel-trench-armour-webxr

Outputs a 5-second 360° turntable to:
  public/library/videos/scripting/
    python-bmesh-ops-offset-edgeloops-support-loop-panel-trench-armour-webxr/viewport.mp4

Run headless:
  blender --background --python record.py
"""

import bpy
import bmesh
from mathutils import Vector

FRAME_COUNT = 150    # 5 s @ 30 fps
FPS         = 30
OUTPUT_PATH = (
    "//../../../../videos/scripting/"
    "python-bmesh-ops-offset-edgeloops-support-loop-panel-trench-armour-webxr/viewport.mp4"
)

PLATE_W = 2.4; PLATE_H = 1.6; SEG_X = 4; SEG_Y = 8
BOSS_Z = 0.10; GROOVE_DEPTH = 0.015; PLATE_THICKNESS = 0.035
BOSS_X_LIMIT = 0.35; BOSS_Y_LIMIT = 0.15; COORD_EPS = 0.02
GROOVE_Y_VALS = [0.4, -0.4]


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def horiz_edges_at_y(bm, y_val):
    return [
        e for e in bm.edges
        if abs(e.verts[0].co.y - y_val) < COORD_EPS
        and abs(e.verts[1].co.y - y_val) < COORD_EPS
        and abs(e.verts[0].co.x - e.verts[1].co.x) > COORD_EPS
        and e.verts[0].co.z < COORD_EPS
        and e.verts[1].co.z < COORD_EPS
    ]


def build_plate() -> bpy.types.Object:
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_grid(bm, x_segments=SEG_X, y_segments=SEG_Y,
                          size=1.0, calc_uvs=True)
    for v in bm.verts:
        v.co.x *= PLATE_W / 2.0
        v.co.y *= PLATE_H / 2.0
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    boss_faces = [f for f in bm.faces
                  if abs(f.calc_center_median().x) < BOSS_X_LIMIT
                  and abs(f.calc_center_median().y) < BOSS_Y_LIMIT]
    boss_set   = set(boss_faces)
    boss_perim = [e for e in bm.edges
                  if sum(1 for f in e.link_faces if f in boss_set) == 1]

    ret = bmesh.ops.extrude_face_region(bm, geom=boss_faces)
    bmesh.ops.translate(bm,
                        verts=[g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)],
                        vec=Vector((0.0, 0.0, BOSS_Z)))
    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()

    bmesh.ops.offset_edgeloops(bm, edges=boss_perim, use_cap_endpoint=False)
    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()

    for gy in GROOVE_Y_VALS:
        src = horiz_edges_at_y(bm, gy)
        if not src:
            continue
        bmesh.ops.offset_edgeloops(bm, edges=src, use_cap_endpoint=True)
        bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
        gf = [f for f in bm.faces
              if abs(f.calc_center_median().y - gy) < 0.08
              and abs(f.calc_center_median().z) < COORD_EPS]
        if gf:
            gr = bmesh.ops.extrude_face_region(bm, geom=gf)
            bmesh.ops.translate(bm,
                                verts=[g for g in gr['geom'] if isinstance(g, bmesh.types.BMVert)],
                                vec=Vector((0.0, 0.0, -GROOVE_DEPTH)))
            bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()

    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=-PLATE_THICKNESS)
    bm.normal_update()
    for f in bm.faces: f.smooth = False

    me = bpy.data.meshes.new("rec_plate")
    ob = bpy.data.objects.new("rec_plate", me)
    bpy.context.collection.objects.link(ob)
    bm.to_mesh(me); bm.free(); me.update()
    return ob


def setup_render(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("rec_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.35, 0.38, 0.42, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.7
    bsdf.inputs["Roughness"].default_value  = 0.3
    ob.data.materials.append(mat)

    # Empty pivot at plate centre; plate orbits around it
    empty = bpy.data.objects.new("pivot", None)
    bpy.context.collection.objects.link(empty)
    ob.parent = empty

    # Camera static above-side
    cam_d = bpy.data.cameras.new("cam")
    cam_o = bpy.data.objects.new("cam", cam_d)
    cam_o.location = (0.0, -4.2, 2.4)
    cam_o.rotation_euler = (1.05, 0.0, 0.0)
    bpy.context.collection.objects.link(cam_o)
    bpy.context.scene.camera = cam_o

    sun = bpy.data.lights.new("sun", 'SUN')
    sun_o = bpy.data.objects.new("sun", sun)
    sun_o.location = (4.0, -3.0, 5.0)
    sun_o.rotation_euler = (0.7, 0.0, 0.8)
    sun.energy = 5.0
    bpy.context.collection.objects.link(sun_o)

    # 360° rotation keyframes on pivot
    sc = bpy.context.scene
    sc.frame_start = 1; sc.frame_end = FRAME_COUNT
    sc.render.fps   = FPS
    empty.rotation_euler = (0, 0, 0); empty.keyframe_insert("rotation_euler", frame=1)
    import math
    empty.rotation_euler = (0, 0, math.tau); empty.keyframe_insert("rotation_euler", frame=FRAME_COUNT)
    for fc in empty.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def setup_output() -> None:
    sc  = bpy.context.scene
    sc.render.engine          = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x    = 1920
    sc.render.resolution_y    = 1080
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format          = 'MPEG4'
    sc.render.ffmpeg.codec           = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.filepath = OUTPUT_PATH
    sc.world = bpy.data.worlds.new("world")
    sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.04, 0.04, 0.06, 1.0)


def main() -> None:
    purge_scene()
    ob = build_plate()
    setup_render(ob)
    setup_output()
    bpy.ops.render.render(animation=True)
    print(f"Recorded → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
