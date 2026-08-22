"""
record.py — Viewport render for bmesh.ops.subdivide_edges tutorial
═══════════════════════════════════════════════════════════════════
Output: public/library/videos/scripting/
        python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr/
        viewport.mp4

5-second orbit at 24 fps (120 frames). Camera sweeps 360° around the three
objects while they slowly rotate on Z so the edge patterns read clearly.
Run standalone — rebuilds objects before rendering.
"""

import math
import os

import bpy
import bmesh
from mathutils import Vector

# ── PATHS ─────────────────────────────────────────────────────────────────────
THIS_DIR  = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(THIS_DIR, "..", "..", "..", ".."))
VIDEO_OUT = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "scripting",
    "python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr",
    "viewport.mp4",
)
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

FPS          = 24
DURATION_SEC = 5
FRAME_COUNT  = FPS * DURATION_SEC
ORBIT_RADIUS = 4.5
ORBIT_HEIGHT = 1.5


# ── MINIMAL OBJECT BUILDS (inline, self-contained) ────────────────────────────
def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for b in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[b])


def mat(name, rgba):
    m = bpy.data.materials.new(name)
    m.use_nodes = False
    m.diffuse_color = rgba
    return m


def box_bm(w, d, h):
    bm = bmesh.new()
    hw, hd, hh = w / 2, d / 2, h / 2
    v = [bm.verts.new(Vector(c)) for c in [
        (-hw,-hd,-hh),(hw,-hd,-hh),(hw,hd,-hh),(-hw,hd,-hh),
        (-hw,-hd,hh),(hw,-hd,hh),(hw,hd,hh),(-hw,hd,hh),
    ]]
    for idx in [(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]:
        bm.faces.new([v[i] for i in idx])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def link(name, bm):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def build_cap():
    bm = box_bm(1.10, 1.10, 0.18)
    bm.edges.ensure_lookup_table()
    z_up = Vector((0, 0, 1))
    ve = [e for e in bm.edges if abs((e.verts[1].co-e.verts[0].co).normalized().dot(z_up)) > 0.98]
    res = bmesh.ops.subdivide_edges(bm, edges=ve, cuts=2,
                                     quad_corner_type="STRAIGHT_CUT",
                                     use_grid_fill=True, smooth=0.0, fractal=0.0)
    sl = bm.edges.layers.bool.new("sharp_edge")
    for e2 in res["geom_inner"]:
        if isinstance(e2, bmesh.types.BMEdge):
            e2[sl] = True
    for f in bm.faces:
        f.smooth = False
    obj = link("hf_sub_cap", bm)
    obj.data.materials.append(mat("cap", (0.88, 0.84, 0.80, 1.0)))
    obj.location = (-1.80, 0, 0)
    return obj


def build_shaft():
    bm = box_bm(0.78, 0.78, 1.05)
    bm.edges.ensure_lookup_table()
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=3,
                               quad_corner_type="STRAIGHT_CUT",
                               use_grid_fill=True, smooth=0.0,
                               fractal=0.055, fractal_along_normal=0.030, seed=7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:
        f.smooth = True
    obj = link("hf_sub_shaft", bm)
    obj.data.materials.append(mat("shaft", (0.62, 0.58, 0.53, 1.0)))
    obj.location = (0, 0, 0)
    return obj


def build_base():
    bm = box_bm(1.42, 1.42, 0.28)
    bm.faces.ensure_lookup_table()
    top = max(bm.faces, key=lambda f: f.calc_center_bounds().z)
    res = bmesh.ops.subdivide_edges(bm, edges=list(top.edges), cuts=1,
                                     quad_corner_type="INNER_VERT",
                                     use_grid_fill=True, smooth=0.0, fractal=0.0)
    sl = bm.edges.layers.bool.new("sharp_edge")
    for e2 in res["geom_inner"]:
        if isinstance(e2, bmesh.types.BMEdge):
            e2[sl] = True
    for f in bm.faces:
        f.smooth = False
    obj = link("hf_sub_base", bm)
    obj.data.materials.append(mat("base", (0.74, 0.70, 0.64, 1.0)))
    obj.location = (1.80, 0, 0)
    return obj


# ── CAMERA + LIGHT ────────────────────────────────────────────────────────────
def setup_cam():
    cd = bpy.data.cameras.new("RecordCam")
    cd.lens = 40.0
    cam = bpy.data.objects.new("RecordCam", cd)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def orbit_keyframe(cam, frame):
    t     = frame / FRAME_COUNT
    angle = 2.0 * math.pi * t
    cam.location = Vector((
        math.sin(angle) * ORBIT_RADIUS,
        -math.cos(angle) * ORBIT_RADIUS,
        ORBIT_HEIGHT,
    ))
    direction = -cam.location.normalized()
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = direction.to_track_quat("-Z", "Y")
    cam.keyframe_insert("location",            frame=frame)
    cam.keyframe_insert("rotation_quaternion", frame=frame)


def add_light():
    ld = bpy.data.lights.new("Sun", type="SUN")
    ld.energy = 3.5
    lo = bpy.data.objects.new("Sun", ld)
    bpy.context.collection.objects.link(lo)
    lo.rotation_euler = (0.7, 0.2, 0.9)


# ── MAIN ──────────────────────────────────────────────────────────────────────
clear()
cap   = build_cap()
shaft = build_shaft()
base  = build_base()
cam   = setup_cam()
add_light()

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = FRAME_COUNT

for k in range(9):
    orbit_keyframe(cam, max(1, int(k * FRAME_COUNT / 8)))

# Slow Z-rotation on all objects so edge patterns catch the light.
for obj in (cap, shaft, base):
    obj.rotation_mode = "XYZ"
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.radians(120))
    obj.keyframe_insert("rotation_euler", frame=FRAME_COUNT)

sc.render.engine                       = "BLENDER_EEVEE_NEXT"
sc.render.resolution_x                 = 1920
sc.render.resolution_y                 = 1080
sc.render.fps                          = FPS
sc.render.image_settings.file_format   = "FFMPEG"
sc.render.ffmpeg.format                = "MPEG4"
sc.render.ffmpeg.codec                 = "H264"
sc.render.ffmpeg.constant_rate_factor  = "HIGH"
sc.render.filepath                     = VIDEO_OUT

bpy.ops.render.render(animation=True)
print(f"[record] Saved → {VIDEO_OUT}")
