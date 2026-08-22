"""
record.py — Viewport animation render for bmesh.ops.convex_hull tutorial
════════════════════════════════════════════════════════════════════════════
Outputs:
  public/library/videos/geometry/python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr/viewport.mp4

Run after blueprint.py has been executed (objects already in scene).
Or run standalone — it rebuilds the gem + proxy from scratch before rendering.

Renders a 5-second orbit: camera sweeps 360° around all three objects while
each gem subtly rotates on its Z axis so the faceted faces catch the light
at different angles. Rendered at 24 fps (120 frames).
"""

import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Vector

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
THIS_DIR    = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT   = os.path.normpath(os.path.join(THIS_DIR, "..", "..", "..", ".."))
VIDEO_OUT   = os.path.join(
    REPO_ROOT,
    "public", "library", "videos",
    "geometry",
    "python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr",
    "viewport.mp4",
)
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

# ── ANIMATION PARAMS ──────────────────────────────────────────────────────────
FPS           = 24
DURATION_SEC  = 5
FRAME_COUNT   = FPS * DURATION_SEC        # 120 frames
ORBIT_RADIUS  = 3.8
ORBIT_HEIGHT  = 1.4
SPIN_DEG      = 180.0                     # gem self-rotation over full clip


# ── REBUILD SCENE ─────────────────────────────────────────────────────────────
# Inline minimal rebuild so this script is self-contained.

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[block])


def make_mat(name, color):
    m = bpy.data.materials.new(name)
    m.use_nodes = False
    m.diffuse_color = (*color, 1.0)
    return m


def build_gem():
    rng = random.Random(42)
    golden = math.pi * (3.0 - math.sqrt(5.0))
    mesh = bpy.data.meshes.new("hf_crystal_gem")
    bm   = bmesh.new()
    for i in range(56):
        y   = 1.0 - (i / 55) * 2.0
        r   = math.sqrt(max(0.0, 1.0 - y * y))
        phi = i * golden
        jit = 1.0 + 0.05 * (rng.random() * 2.0 - 1.0)
        bm.verts.new(Vector((r * math.cos(phi) * 0.50 * jit,
                             y * 0.50 * jit,
                             r * math.sin(phi) * 0.68 * 0.50 * jit)))
    bm.verts.ensure_lookup_table()
    res = bmesh.ops.convex_hull(bm, input=bm.verts[:], use_existing_faces=False)
    bmesh.ops.delete(bm, geom=res["geom_interior"], context="VERTS")
    for f in bm.faces:
        f.smooth = False
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new("hf_crystal_gem", mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(make_mat("gem", (0.42, 0.72, 0.95)))
    obj.location = (-1.1, 0, 0)
    return obj


def build_proxy():
    mesh_src = bpy.data.meshes.new("hf_org")
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.46)
    bm.verts.ensure_lookup_table()
    for v in bm.verts:
        d = math.sin(v.co.x*3.5) * math.cos(v.co.y*3.5) * math.sin(v.co.z*3.5+0.7)
        v.co += v.normal * d * 0.22
    bm.to_mesh(mesh_src); bm.free()
    src = bpy.data.objects.new("hf_org", mesh_src)
    bpy.context.collection.objects.link(src)
    src.location = (0, 0, 0)

    mesh_p = bpy.data.meshes.new("hf_proxy")
    bm2 = bmesh.new()
    for v in mesh_src.vertices:
        bm2.verts.new(Vector(v.co))
    bm2.verts.ensure_lookup_table()
    res2 = bmesh.ops.convex_hull(bm2, input=bm2.verts[:], use_existing_faces=False)
    bmesh.ops.delete(bm2, geom=res2["geom_interior"], context="VERTS")
    for f in bm2.faces:
        f.smooth = False
    bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces[:])
    bm2.to_mesh(mesh_p); bm2.free()
    prx = bpy.data.objects.new("hf_proxy", mesh_p)
    bpy.context.collection.objects.link(prx)
    mesh_p.materials.append(make_mat("prx", (0.90, 0.62, 0.12)))
    prx.location = (1.1, 0, 0)
    return src, prx


# ── CAMERA + LIGHT SETUP ──────────────────────────────────────────────────────
def setup_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 40.0
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def orbit_frame(cam, frame: int):
    t     = frame / FRAME_COUNT
    angle = 2.0 * math.pi * t
    cam.location = Vector((
        math.sin(angle) * ORBIT_RADIUS,
        -math.cos(angle) * ORBIT_RADIUS,
        ORBIT_HEIGHT,
    ))
    # Point at origin
    direction = -cam.location.normalized()
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = direction.to_track_quat("-Z", "Y")
    cam.keyframe_insert("location",             frame=frame)
    cam.keyframe_insert("rotation_quaternion",  frame=frame)


def add_light():
    light_data = bpy.data.lights.new("RecordSun", type="SUN")
    light_data.energy = 4.0
    light = bpy.data.objects.new("RecordSun", light_data)
    bpy.context.collection.objects.link(light)
    light.rotation_euler = (0.6, 0.2, 0.8)


# ── MAIN ──────────────────────────────────────────────────────────────────────
clear_scene()
gem = build_gem()
organic, proxy = build_proxy()
cam = setup_camera()
add_light()

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_COUNT

# Insert camera keyframes at regular intervals (8 keyframes for smooth orbit)
KEYFRAME_STEPS = 8
for k in range(KEYFRAME_STEPS + 1):
    orbit_frame(cam, max(1, int(k * FRAME_COUNT / KEYFRAME_STEPS)))

# Gem self-rotation keyframes
spin_rad = math.radians(SPIN_DEG)
gem.rotation_mode = "XYZ"
gem.rotation_euler = (0, 0, 0)
gem.keyframe_insert("rotation_euler", frame=1)
gem.rotation_euler = (0, 0, spin_rad)
gem.keyframe_insert("rotation_euler", frame=FRAME_COUNT)

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene.render.engine              = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.fps                  = FPS
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format       = "MPEG4"
scene.render.ffmpeg.codec        = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath            = VIDEO_OUT

bpy.ops.render.render(animation=True)
print(f"[record] Viewport render saved → {VIDEO_OUT}")
