"""
record.py — viewport animation for bmesh.ops.triangulate + join_triangles
Outputs: public/library/videos/scripting/
         python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr/
         viewport.mp4

Timeline (30 fps):
  F001–F030  Raw topology: 6 quads + 1 central n-gon boss (OVERLAY_WIREFRAME on)
  F031–F060  Triangulate applied: all faces become tris (wireframe density jump)
  F061–F090  join_triangles: horizontal tris merge back to quads (density drops)
  F091–F120  Final faceted material view, orbit 360°

Run from: Blender Scripting workspace, or:
  blender --background --python record.py
"""

import bpy
import bmesh
from mathutils import Vector
import math
import os

FPS          = 30
FRAME_RAW    = 1
FRAME_TRI    = 31
FRAME_JOIN   = 61
FRAME_ORBIT  = 91
FRAME_END    = 120

OUTPUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath or "/tmp"),
    "../../../../videos/scripting/"
    "python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr",
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport.mp4")

OUTER_R  = 0.60
INNER_R  = 0.22
DEPTH    = 0.05
HEX_N    = 6


def _make_material(name, rgb):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Metallic"].default_value   = 0.8
        bsdf.inputs["Roughness"].default_value  = 0.3
    return mat


def _hex_pts(r, z=0.0, n=HEX_N):
    return [
        Vector((r * math.cos(2*math.pi*i/n + math.pi/n),
                r * math.sin(2*math.pi*i/n + math.pi/n), z))
        for i in range(n)
    ]


def _build_raw_mesh():
    """Return mesh with 6 quads + 1 n-gon (pre-triangulate topology)."""
    bm = bmesh.new()
    outer = [bm.verts.new(v) for v in _hex_pts(OUTER_R)]
    inner = [bm.verts.new(v) for v in _hex_pts(INNER_R)]
    for i in range(HEX_N):
        bm.faces.new([outer[i], outer[(i+1)%HEX_N], inner[(i+1)%HEX_N], inner[i]])
    bm.faces.new(inner)                    # n-gon
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    ret = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    bmesh.ops.translate(bm,
        verts=[g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)],
        vec=Vector((0,0,-DEPTH)))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new("HF_Rec_Raw")
    bm.to_mesh(me); bm.free()
    return me


def _build_tri_mesh():
    """Return mesh after bmesh.ops.triangulate — all tris."""
    bm = bmesh.new()
    outer = [bm.verts.new(v) for v in _hex_pts(OUTER_R)]
    inner = [bm.verts.new(v) for v in _hex_pts(INNER_R)]
    for i in range(HEX_N):
        bm.faces.new([outer[i], outer[(i+1)%HEX_N], inner[(i+1)%HEX_N], inner[i]])
    bm.faces.new(inner)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    ret = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    bmesh.ops.translate(bm,
        verts=[g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)],
        vec=Vector((0,0,-DEPTH)))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces),
                          quad_method='BEAUTY', ngon_method='BEAUTY')
    me = bpy.data.meshes.new("HF_Rec_Tri")
    bm.to_mesh(me); bm.free()
    return me


def _build_join_mesh():
    """Return mesh after triangulate + join_triangles on horizontal faces."""
    bm = bmesh.new()
    outer = [bm.verts.new(v) for v in _hex_pts(OUTER_R)]
    inner = [bm.verts.new(v) for v in _hex_pts(INNER_R)]
    for i in range(HEX_N):
        bm.faces.new([outer[i], outer[(i+1)%HEX_N], inner[(i+1)%HEX_N], inner[i]])
    bm.faces.new(inner)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    ret = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    bmesh.ops.translate(bm,
        verts=[g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)],
        vec=Vector((0,0,-DEPTH)))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces),
                          quad_method='BEAUTY', ngon_method='BEAUTY')
    bm.faces.ensure_lookup_table()
    horiz = [f for f in bm.faces if abs(f.normal.z) > 0.85]
    bmesh.ops.join_triangles(bm, faces=horiz,
                             angle_face_threshold=0.02, angle_shape_threshold=0.25,
                             cmp_sharp=True, cmp_materials=True)
    me = bpy.data.meshes.new("HF_Rec_Join")
    bm.to_mesh(me); bm.free()
    return me


def main():
    scene = bpy.context.scene
    scene.frame_start = FRAME_RAW
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    # — clean previous HF_Rec objects ─────────────────────────────────────────
    for o in list(bpy.data.objects):
        if o.name.startswith("HF_Rec"):
            bpy.data.objects.remove(o, do_unlink=True)

    # — create three mesh versions ────────────────────────────────────────────
    mat_b = _make_material("HF_RecBody", (0.08, 0.10, 0.20))
    mat_g = _make_material("HF_RecBoss", (0.60, 0.50, 0.10))

    def _obj(me):
        ob = bpy.data.objects.new(me.name, me)
        me.materials.append(mat_b)
        scene.collection.objects.link(ob)
        return ob

    raw_obj  = _obj(_build_raw_mesh())
    tri_obj  = _obj(_build_tri_mesh())
    join_obj = _obj(_build_join_mesh())

    # — visibility keyframes for each phase ───────────────────────────────────
    for ob, vis_start, vis_end in [
        (raw_obj,  FRAME_RAW,   FRAME_TRI  - 1),
        (tri_obj,  FRAME_TRI,   FRAME_JOIN - 1),
        (join_obj, FRAME_JOIN,  FRAME_END),
    ]:
        for f in range(FRAME_RAW, FRAME_END + 1):
            ob.hide_viewport = not (vis_start <= f <= vis_end)
            ob.hide_render   = not (vis_start <= f <= vis_end)
            ob.keyframe_insert("hide_viewport", frame=f)
            ob.keyframe_insert("hide_render",   frame=f)

    # — camera orbit ──────────────────────────────────────────────────────────
    cam_data = bpy.data.cameras.new("HF_RecCam")
    cam_data.type        = 'PERSP'
    cam_data.lens        = 50
    cam_obj  = bpy.data.objects.new("HF_RecCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    orbit_r = 1.8
    cam_z   = 0.6
    for f in range(FRAME_RAW, FRAME_END + 1):
        frac     = (f - FRAME_RAW) / (FRAME_END - FRAME_RAW)
        angle    = 2 * math.pi * frac
        cam_obj.location = Vector((
            orbit_r * math.cos(angle),
            orbit_r * math.sin(angle),
            cam_z,
        ))
        cam_obj.rotation_euler = (
            math.radians(70),
            0.0,
            angle + math.pi / 2,
        )
        cam_obj.keyframe_insert("location",       frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)

    # — render settings ───────────────────────────────────────────────────────
    scene.render.engine          = 'BLENDER_WORKBENCH'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format   = 'MPEG4'
    scene.render.ffmpeg.codec    = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.filepath        = OUTPUT_FILE

    # overlay wireframe on for all views
    for area in bpy.context.screen.areas if bpy.context.screen else []:
        if area.type == 'VIEW_3D':
            area.spaces.active.overlay.show_wireframes = True

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    bpy.ops.render.render(animation=True)
    print(f"[Holoflow] viewport.mp4 → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
