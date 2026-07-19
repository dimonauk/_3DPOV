"""
Holoflow Studio — Blender 5.1
record.py — EEVEE turntable render for
python-bmesh-ops-create-primitives-modular-crystal-tile-webxr

Outputs a 5-second 360° overhead turntable to:
  public/library/videos/scripting/
    python-bmesh-ops-create-primitives-modular-crystal-tile-webxr/viewport.mp4

Run headless:
  blender --background --python record.py
"""

import math
import bpy
import bmesh
from mathutils import Matrix

FRAME_COUNT = 150   # 5 s @ 30 fps
FPS         = 30
OUTPUT_PATH = (
    "//../../../../videos/scripting/"
    "python-bmesh-ops-create-primitives-modular-crystal-tile-webxr/viewport.mp4"
)

# Mirror of blueprint.py parameters — kept here so record.py is self-contained
TILE_HALF    = 1.5;  GRID_DIV = 6
N_SPIRES     = 5;    SPIRE_SEGS = 6
SPIRE_R_BASE = 0.18; SPIRE_R_TIP = 0.03; SPIRE_DEPTH = 1.60
SPIRE_RING_R = 0.95
GEM_SUBDIV   = 1;    GEM_RADIUS = 0.11;  GEM_OFFSET = 0.7
UV_SEGS_U    = 8;    UV_SEGS_V = 5;      UV_R = 0.14
RING_SEGS    = 12;   RING_RADIUS = SPIRE_R_BASE + 0.09
PED_SIZE     = 0.58


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def pentagon_positions():
    return [
        (SPIRE_RING_R * math.cos(2 * math.pi * i / N_SPIRES + math.pi / 2),
         SPIRE_RING_R * math.sin(2 * math.pi * i / N_SPIRES + math.pi / 2))
        for i in range(N_SPIRES)
    ]


def build_tile() -> bpy.types.Object:
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")

    bmesh.ops.create_grid(bm, x_segments=GRID_DIV, y_segments=GRID_DIV,
                          size=TILE_HALF, calc_uvs=True)
    bmesh.ops.create_cube(bm, size=PED_SIZE,
                          matrix=Matrix.Translation((0.0, 0.0, PED_SIZE / 2.0)),
                          calc_uvs=True)
    bmesh.ops.create_uvsphere(bm, u_segments=UV_SEGS_U, v_segments=UV_SEGS_V,
                              radius=UV_R,
                              matrix=Matrix.Translation((0.0, 0.0, PED_SIZE + UV_R)),
                              calc_uvs=True)

    for px, py in pentagon_positions():
        bmesh.ops.create_cone(bm, segments=SPIRE_SEGS,
                              radius1=SPIRE_R_BASE, radius2=SPIRE_R_TIP,
                              depth=SPIRE_DEPTH, cap_ends=True, cap_tris=False,
                              matrix=Matrix.Translation((px, py, SPIRE_DEPTH / 2.0)),
                              calc_uvs=True)

    gem_z = SPIRE_DEPTH - GEM_RADIUS * GEM_OFFSET
    for px, py in pentagon_positions():
        bmesh.ops.create_icosphere(bm, subdivisions=GEM_SUBDIV, radius=GEM_RADIUS,
                                   matrix=Matrix.Translation((px, py, gem_z)),
                                   calc_uvs=True)

    for px, py in pentagon_positions():
        bmesh.ops.create_circle(bm, segments=RING_SEGS, radius=RING_RADIUS,
                                cap_ends=True, cap_tris=False,
                                matrix=Matrix.Translation((px, py, 0.008)),
                                calc_uvs=True)

    bm.normal_update()
    for f in bm.faces:
        f.smooth = False

    me = bpy.data.meshes.new("rec_tile")
    ob = bpy.data.objects.new("rec_tile", me)
    bpy.context.collection.objects.link(ob)
    bm.to_mesh(me)
    bm.free()
    me.update()
    return ob


def setup_render(ob: bpy.types.Object) -> None:
    for rgb, name in [((0.12, 0.14, 0.18), "mat_tile"),
                      ((0.38, 0.70, 0.95), "mat_spire")]:
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Metallic"].default_value   = 0.5
        bsdf.inputs["Roughness"].default_value  = 0.3
        ob.data.materials.append(mat)

    # Turntable pivot at tile centre; tile orbits underneath a static camera
    pivot = bpy.data.objects.new("pivot", None)
    bpy.context.collection.objects.link(pivot)
    ob.parent = pivot

    cam_d = bpy.data.cameras.new("cam")
    cam_o = bpy.data.objects.new("cam", cam_d)
    cam_o.location      = (0.0, -5.5, 5.0)
    cam_o.rotation_euler = (math.radians(52), 0.0, 0.0)
    bpy.context.collection.objects.link(cam_o)
    bpy.context.scene.camera = cam_o

    sun = bpy.data.lights.new("sun", 'SUN')
    sun_o = bpy.data.objects.new("sun", sun)
    sun_o.location      = (5.0, -3.0, 7.0)
    sun_o.rotation_euler = (0.6, 0.0, 0.9)
    sun.energy = 5.0
    bpy.context.collection.objects.link(sun_o)

    sc = bpy.context.scene
    sc.frame_start = 1; sc.frame_end = FRAME_COUNT
    sc.render.fps = FPS
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler = (0, 0, math.tau)
    pivot.keyframe_insert("rotation_euler", frame=FRAME_COUNT)
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def setup_output() -> None:
    sc = bpy.context.scene
    sc.render.engine               = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x         = 1920
    sc.render.resolution_y         = 1080
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format         = 'MPEG4'
    sc.render.ffmpeg.codec          = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.filepath = OUTPUT_PATH
    sc.world = bpy.data.worlds.new("world")
    sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.03, 0.03, 0.06, 1.0)


def main() -> None:
    purge_scene()
    ob = build_tile()
    setup_render(ob)
    setup_output()
    bpy.ops.render.render(animation=True)
    print(f"Recorded → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
