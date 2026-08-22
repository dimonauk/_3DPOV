"""
record.py — viewport render: 180° turntable of hf_spike_urchin (5 s @ 30 fps)
Rebuild the geometry from scratch so the record is self-contained — no .blend
dependency required.

Run:  blender --python record.py
Out:  ../../videos/scripting/
        python-bmesh-ops-extrude-discrete-faces-per-face-spike-urchin-crystal-webxr/
        viewport.mp4
"""

import bpy
import bmesh
import math
import os
from mathutils import Matrix, Vector, Euler

# ─── constants (mirror blueprint.py) ──────────────────────────────────────────
SPHERE_RADIUS   = 1.0
ICO_SUBDIVS     = 2
SPIKE_HEIGHT    = 0.30
SPIKE_TIP_SCALE = 0.06
FRAME_END       = 150      # 5 s @ 30 fps
FPS             = 30
SLUG            = "python-bmesh-ops-extrude-discrete-faces-per-face-spike-urchin-crystal-webxr"
OUT_DIR         = f"//../../videos/scripting/{SLUG}"

# ─── scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'

# ─── geometry (rebuilt inline) ────────────────────────────────────────────────
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIVS, radius=SPHERE_RADIUS)
bm.faces.ensure_lookup_table()

result = bmesh.ops.extrude_discrete_faces(bm, faces=list(bm.faces))
for cap in result['faces']:
    normal  = cap.normal.copy()
    verts   = list(cap.verts)
    bmesh.ops.translate(bm, verts=verts, vec=normal * SPIKE_HEIGHT)
    centroid = Vector(sum((v.co for v in verts), Vector()) / len(verts))
    pivot    = Matrix.Translation(centroid)
    bmesh.ops.scale(bm, verts=verts,
                    vec=(SPIKE_TIP_SCALE,) * 3, space=pivot.inverted())

bm.normal_update()
for e in bm.edges:
    e.smooth = False
for f in bm.faces:
    f.smooth = False

me = bpy.data.meshes.new("hf_spike_urchin")
ob = bpy.data.objects.new("hf_spike_urchin", me)
sc.collection.objects.link(ob)
bm.to_mesh(me)
bm.free()

# ─── material ────────────────────────────────────────────────────────────────
def _mat(name, r, g, b, rough=0.2, metallic=0.8):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (r, g, b, 1)
    bsdf.inputs["Roughness"].default_value   = rough
    bsdf.inputs["Metallic"].default_value    = metallic
    return m

me.materials.append(_mat("HF_Urchin", 0.25, 0.10, 0.80))

# ─── slow-rotation animation ─────────────────────────────────────────────────
ob.rotation_euler = Euler((math.radians(20), 0, 0))
ob.keyframe_insert("rotation_euler", frame=1)
ob.rotation_euler = Euler((math.radians(20), 0, math.pi))
ob.keyframe_insert("rotation_euler", frame=FRAME_END)
for fcu in ob.animation_data.action.fcurves:
    for kp in fcu.keyframe_points:
        kp.interpolation = 'LINEAR'

# ─── camera ───────────────────────────────────────────────────────────────────
cam_d = bpy.data.cameras.new("Cam")
cam_d.lens = 50
cam_ob = bpy.data.objects.new("Cam", cam_d)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob
cam_ob.location      = Vector((0, -4.5, 0.8))
cam_ob.rotation_euler = Euler((math.radians(80), 0, 0))

# ─── lights ───────────────────────────────────────────────────────────────────
def _area(name, loc, energy, size=1.5):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.size   = size
    lo = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lo)
    lo.location = Vector(loc)
    return lo

_area("Key",  ( 3.0, -2.0, 3.5), 800)
_area("Fill", (-2.5, -2.5, 1.0), 200, 2.5)
_area("Rim",  ( 0.0,  3.0, 2.5), 400)

# ─── world ────────────────────────────────────────────────────────────────────
sc.world = bpy.data.worlds.new("W")
sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.03, 0.02, 0.08, 1)

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
sc.render.filepath                       = OUT_DIR + "/viewport"
sc.render.image_settings.file_format     = 'FFMPEG'
sc.render.ffmpeg.format                  = 'MPEG4'
sc.render.ffmpeg.codec                   = 'H264'
sc.render.ffmpeg.constant_rate_factor    = 'HIGH'

bpy.ops.render.render(animation=True)
print(f"[HF] render complete → {abs_out}/viewport.mp4")
