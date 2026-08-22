"""
record.py — viewport animation render for hf_crystal_column (5 s @ 30 fps)
Geometry is rebuilt inline so the record is self-contained.

Run:  blender --background --python record.py
Out:  ../../videos/scripting/
        python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr/
        viewport.mp4
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler

SLUG      = "python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr"
OUT_DIR   = f"//../../videos/scripting/{SLUG}"
FPS       = 30
FRAME_END = 150   # 5 s

# ─── scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'

# ─── geometry (mirrors blueprint.py) ─────────────────────────────────────────
RADIUS          = 1.0
SHAFT_HEIGHT    = 1.4
CROWN_HEIGHT    = 0.55
CROWN_INSET     = 0.18
SPLIT_ANGLE_DEG = 20.0

bm = bmesh.new()
vb, vt = [], []
for i in range(6):
    a  = math.radians(30 + 60 * i)
    xy = Vector((math.cos(a), math.sin(a), 0.0)) * RADIUS
    vb.append(bm.verts.new(xy))
    vt.append(bm.verts.new(xy + Vector((0.0, 0.0, SHAFT_HEIGHT))))

bm.faces.new(vb[::-1])
for i in range(6):
    j = (i + 1) % 6
    bm.faces.new([vb[i], vb[j], vt[j], vt[i]])

vc = []
r_crown = RADIUS - CROWN_INSET
for i in range(6):
    a = math.radians(30 + 60 * i)
    vc.append(bm.verts.new(Vector((
        math.cos(a) * r_crown, math.sin(a) * r_crown, SHAFT_HEIGHT,
    ))))

for i in range(6):
    j = (i + 1) % 6
    bm.faces.new([vt[i], vt[j], vc[j], vc[i]])

v_apex = bm.verts.new(Vector((0.0, 0.0, SHAFT_HEIGHT + CROWN_HEIGHT)))
for i in range(6):
    j = (i + 1) % 6
    bm.faces.new([vc[i], vc[j], v_apex])

bm.normal_update()
bm.edges.ensure_lookup_table()

SPLIT_RAD  = math.radians(SPLIT_ANGLE_DEG)
hard_edges = [
    e for e in bm.edges
    if (ang := e.calc_face_angle(None)) is not None and ang > SPLIT_RAD
]
bmesh.ops.split_edges(bm, edges=hard_edges)

for f in bm.faces:  f.smooth = False
for e in bm.edges:  e.smooth = False

me = bpy.data.meshes.new("hf_crystal_column")
ob = bpy.data.objects.new("hf_crystal_column", me)
sc.collection.objects.link(ob)
bm.to_mesh(me)
bm.free()

# ─── materials ────────────────────────────────────────────────────────────────
def _mat(name, r, g, b, rough=0.35, metallic=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (r, g, b, 1)
    bsdf.inputs["Roughness"].default_value   = rough
    bsdf.inputs["Metallic"].default_value    = metallic
    return m

ms = _mat("hf_shaft", 0.06, 0.28, 0.35)
mc = _mat("hf_crown", 0.80, 0.74, 0.42, rough=0.15, metallic=0.9)
me.materials.append(ms)
me.materials.append(mc)
for poly in me.polygons:
    poly.material_index = 1 if me.vertices[poly.vertices[0]].co.z > SHAFT_HEIGHT * 0.95 else 0

# ─── slow rotation animation ──────────────────────────────────────────────────
# Object rotates 180° over 5 s — enough to show all faces
ob.rotation_euler = Euler((math.radians(15), 0.0, 0.0))
ob.keyframe_insert("rotation_euler", frame=1)
ob.rotation_euler = Euler((math.radians(15), 0.0, math.pi))
ob.keyframe_insert("rotation_euler", frame=FRAME_END)
for fcu in ob.animation_data.action.fcurves:
    for kp in fcu.keyframe_points:
        kp.interpolation = 'LINEAR'

# ─── camera ───────────────────────────────────────────────────────────────────
cam_d  = bpy.data.cameras.new("Cam")
cam_d.lens = 50
cam_ob = bpy.data.objects.new("Cam", cam_d)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob
cam_ob.location       = Vector((0.0, -4.5, 1.2))
cam_ob.rotation_euler = Euler((math.radians(78), 0.0, 0.0))

# ─── lights ───────────────────────────────────────────────────────────────────
def _area(name, loc, energy, size=1.5):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.size   = size
    lo = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lo)
    lo.location = Vector(loc)
    return lo

_area("Key",  ( 3.0, -2.0, 4.0), 900)
_area("Fill", (-2.5, -2.5, 1.0), 250, 2.5)
_area("Rim",  ( 0.0,  3.5, 3.0), 450)

# ─── world ────────────────────────────────────────────────────────────────────
w = bpy.data.worlds.new("W")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.04, 0.10, 1)
sc.world = w

# ─── render ───────────────────────────────────────────────────────────────────
sc.frame_start = 1
sc.frame_end   = FRAME_END
sc.render.fps  = FPS
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080
sc.render.engine       = 'CYCLES'
sc.cycles.samples      = 64

abs_out = bpy.path.abspath(OUT_DIR)
os.makedirs(abs_out, exist_ok=True)
sc.render.filepath                    = OUT_DIR + "/viewport"
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'

bpy.ops.render.render(animation=True)
print(f"[HF] render complete → {abs_out}/viewport.mp4")
