"""
record.py — viewport animation for bisect_plane tutorial
─────────────────────────────────────────────────────────
Run this script inside Blender 5.1 (Text Editor → Run Script).
Output: public/library/videos/scripting/<slug>/viewport.mp4

Animation beats (30 fps):
  F1–30   — full sphere + full cube (before bisect), front-orbit view
  F31–60  — halfshell only appears (cutaway hidden); camera arc left
  F61–90  — cutaway reveals itself; both objects in frame
  F91–120 — slow top-down orbit; both objects show cut faces

Camera arc is driven by animating camera Z-rotation.  The 'before' state is
simulated by toggling a second temporary mesh (sphere + cube) visible in the
first 30 frames, then swapping it for the bisected versions.
"""

import math
import os

import bpy
import bmesh
from mathutils import Vector

FPS        = 30
TOTAL_F    = 120
OUTPUT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)),
                 "..", "..", "..", "..",
                 "public", "library", "videos",
                 "scripting",
                 "python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr"))
os.makedirs(OUTPUT_DIR, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[block])


def build_before_sphere(name="before_sphere"):
    """Opaque full UV sphere — visible only in frames 1-30."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=0.55)
    for f in bm.faces:
        f.smooth = False
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = Vector((-0.75, 0, 0))
    mat = bpy.data.materials.new("before_sphere_mat")
    mat.use_nodes = False
    mat.diffuse_color = (0.12, 0.22, 0.55, 1.0)
    mesh.materials.append(mat)
    return obj


def build_halfshell(name="halfshell"):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=0.55)
    res = bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        dist=0.0001,
        plane_co=Vector((0, 0, 0)),
        plane_no=Vector((0, 0, 1)),
        clear_outer=True, clear_inner=False)
    cut_edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    fill_res = bmesh.ops.fill(bm, edges=cut_edges, use_beauty=True)
    for f in bm.faces:
        f.smooth = False
    for f in fill_res.get("faces", []):
        f.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = Vector((-0.75, 0, 0))
    m0 = bpy.data.materials.new("hs_shell")
    m0.use_nodes = False
    m0.diffuse_color = (0.12, 0.22, 0.55, 1.0)
    m1 = bpy.data.materials.new("hs_cap")
    m1.use_nodes = False
    m1.diffuse_color = (0.88, 0.90, 0.95, 1.0)
    mesh.materials.append(m0)
    mesh.materials.append(m1)
    return obj


def build_cutaway(name="cutaway"):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.8)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2,
                              use_grid_fill=True, use_single_divide=False)
    angle = math.radians(45.0)
    n = Vector((0, math.sin(angle), math.cos(angle))).normalized()
    res = bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        dist=0.0001,
        plane_co=Vector((0, 0, 0)),
        plane_no=n,
        clear_outer=True, clear_inner=False)
    cut_edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    for f in bm.faces:
        f.smooth = False
    for e in cut_edges:
        for f in e.link_faces:
            f.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = Vector((0.75, 0, 0))
    m0 = bpy.data.materials.new("ca_body")
    m0.use_nodes = False
    m0.diffuse_color = (0.08, 0.08, 0.10, 1.0)
    m1 = bpy.data.materials.new("ca_section")
    m1.use_nodes = False
    m1.diffuse_color = (0.80, 0.35, 0.10, 1.0)
    mesh.materials.append(m0)
    mesh.materials.append(m1)
    return obj


def setup_camera():
    bpy.ops.object.camera_add(location=(0, -4.5, 1.8))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(68), 0, 0)
    bpy.context.scene.camera = cam

    # Animate Z-rotation for a slow orbit
    cam.keyframe_insert(data_path="rotation_euler", frame=1)
    cam.rotation_euler.z = math.radians(30)
    cam.keyframe_insert(data_path="rotation_euler", frame=TOTAL_F)
    return cam


def setup_light():
    bpy.ops.object.light_add(type="SUN", location=(3, -3, 5))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    return sun


def setup_visibility(before_sph, halfshell, cutaway):
    """
    F1–30:   before_sphere visible, halfshell + cutaway hidden
    F31–90:  halfshell visible, before_sphere hidden, cutaway hidden
    F91–120: halfshell + cutaway both visible
    """
    def kf(obj, val, frame, path="hide_viewport"):
        obj.hide_viewport = val
        obj.hide_render   = val
        obj.keyframe_insert(data_path="hide_viewport", frame=frame)
        obj.keyframe_insert(data_path="hide_render",   frame=frame)

    # before_sphere: visible F1-30, hidden from F31
    kf(before_sph, False, 1)
    kf(before_sph, False, 30)
    kf(before_sph, True,  31)
    kf(before_sph, True,  TOTAL_F)

    # halfshell: hidden F1-30, visible from F31
    kf(halfshell, True,  1)
    kf(halfshell, True,  30)
    kf(halfshell, False, 31)
    kf(halfshell, False, TOTAL_F)

    # cutaway: hidden F1-90, visible from F91
    kf(cutaway, True,  1)
    kf(cutaway, True,  90)
    kf(cutaway, False, 91)
    kf(cutaway, False, TOTAL_F)


def render_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_F
    scene.render.fps  = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = os.path.join(OUTPUT_DIR, "viewport.mp4")

    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f"[bisect record] Wrote: {scene.render.filepath}")


clear_scene()
before_sph = build_before_sphere()
hs         = build_halfshell()
ca         = build_cutaway()
setup_camera()
setup_light()
setup_visibility(before_sph, hs, ca)
render_animation()
