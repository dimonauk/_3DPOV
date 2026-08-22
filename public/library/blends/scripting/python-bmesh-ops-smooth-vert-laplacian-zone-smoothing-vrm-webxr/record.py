"""
Holoflow Studio — Blender 5.1
record.py — EEVEE turntable render for
python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr

Outputs an 8-second 360° turntable to:
  public/library/videos/scripting/
    python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr/viewport.mp4

Run headless:
  blender --background --python record.py
"""

import bpy
import bmesh
import math
from mathutils import Vector

FRAME_COUNT = 240    # 8 s @ 30 fps
FPS         = 30
OUTPUT_PATH = (
    "//../../../../videos/scripting/"
    "python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr/viewport.mp4"
)

DOME_RADIUS   = 0.60
COLLAR_SEGS   = 16
DOME_V_SEGS   = 10
COLLAR_DROP   = 0.12
ZONE_COLLAR   = 0.16
ZONE_BLEND    = 0.35
SV_FACTOR     = 0.50
SV_ITERS      = 5
SLV_LAMBDA    = 0.50
SLV_LAMBDA_B  = 0.20
SLV_ITERS     = 3


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def _perturb(bm, verts):
    for v in verts:
        theta = math.atan2(v.co.y, v.co.x)
        bump  = math.sin(theta * 7 + v.co.z * 22) * 0.022
        r = math.sqrt(v.co.x**2 + v.co.y**2)
        if r > 1e-5:
            v.co.x += bump * (v.co.x / r)
            v.co.y += bump * (v.co.y / r)
        v.co.z += math.sin(theta * 5 + v.co.z * 14) * 0.012


def build_pauldron() -> bpy.types.Object:
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(
        bm, u_segments=COLLAR_SEGS, v_segments=DOME_V_SEGS,
        radius=DOME_RADIUS, calc_uvs=True,
    )
    bm.verts.ensure_lookup_table()

    lower = [v for v in bm.verts if v.co.z < -0.005]
    bmesh.ops.delete(bm, geom=lower, context='VERTS')
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    blend_verts = [v for v in bm.verts if ZONE_COLLAR < v.co.z <= ZONE_BLEND]
    dome_verts  = [v for v in bm.verts if v.co.z > ZONE_BLEND]
    _perturb(bm, blend_verts)

    for _ in range(SV_ITERS):
        bmesh.ops.smooth_vert(
            bm, verts=blend_verts, factor=SV_FACTOR,
            mirror_clip_x=False, mirror_clip_y=False, mirror_clip_z=False,
            clip_dist=1e-5, use_axis_x=True, use_axis_y=True, use_axis_z=True,
        )
    bm.normal_update()

    for _ in range(SLV_ITERS):
        bmesh.ops.smooth_laplacian_vert(
            bm, verts=dome_verts, lambda_factor=SLV_LAMBDA,
            lambda_border=SLV_LAMBDA_B, use_x=True, use_y=True, use_z=True,
            preserve_volume=True,
        )
    bm.normal_update()

    boundary = [e for e in bm.edges if len(e.link_faces) == 1]
    if boundary:
        ret = bmesh.ops.extrude_edge_only(bm, edges=boundary)
        new_v = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=new_v, vec=Vector((0, 0, -COLLAR_DROP)))
    bm.normal_update()

    for f in bm.faces:
        f.smooth = (f.calc_center_median().z > ZONE_COLLAR)

    me = bpy.data.meshes.new("rec_pauldron")
    ob = bpy.data.objects.new("rec_pauldron", me)
    bpy.context.collection.objects.link(ob)
    bm.to_mesh(me); bm.free(); me.update()
    return ob


def setup_render(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("rec_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value    = (0.22, 0.28, 0.55, 1.0)
    bsdf.inputs["Metallic"].default_value      = 0.3
    bsdf.inputs["Roughness"].default_value     = 0.45
    ob.data.materials.append(mat)

    empty = bpy.data.objects.new("pivot", None)
    bpy.context.collection.objects.link(empty)
    ob.parent = empty
    ob.location = (0, 0, 0)

    cam_d = bpy.data.cameras.new("cam")
    cam_o = bpy.data.objects.new("cam", cam_d)
    cam_o.location = (0.0, -1.8, 0.55)
    cam_o.rotation_euler = (math.radians(80), 0.0, 0.0)
    bpy.context.collection.objects.link(cam_o)
    bpy.context.scene.camera = cam_o

    key = bpy.data.lights.new("key", 'AREA')
    key_o = bpy.data.objects.new("key", key)
    key_o.location = (1.2, -1.0, 2.0)
    key.energy = 200.0
    bpy.context.collection.objects.link(key_o)

    fill = bpy.data.lights.new("fill", 'SUN')
    fill_o = bpy.data.objects.new("fill", fill)
    fill_o.rotation_euler = (0.6, 0.0, -1.1)
    fill.energy = 1.8
    bpy.context.collection.objects.link(fill_o)

    sc = bpy.context.scene
    sc.frame_start = 1; sc.frame_end = FRAME_COUNT
    sc.render.fps = FPS
    empty.rotation_euler = (0, 0, 0)
    empty.keyframe_insert("rotation_euler", frame=1)
    empty.rotation_euler = (0, 0, math.tau)
    empty.keyframe_insert("rotation_euler", frame=FRAME_COUNT)
    for fc in empty.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def setup_output() -> None:
    sc = bpy.context.scene
    sc.render.engine                   = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x             = 1920
    sc.render.resolution_y             = 1080
    sc.render.resolution_percentage    = 100
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format            = 'MPEG4'
    sc.render.ffmpeg.codec             = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.filepath                 = OUTPUT_PATH
    sc.world = bpy.data.worlds.new("world")
    sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.03, 0.03, 0.06, 1.0)


def main() -> None:
    purge_scene()
    ob = build_pauldron()
    setup_render(ob)
    setup_output()
    bpy.ops.render.render(animation=True)
    print(f"Recorded → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
