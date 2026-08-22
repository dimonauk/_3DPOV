"""
record.py — viewport render: 180° turntable of hf_poke_shield (5 s @ 30 fps)
Run:  blender --python record.py
Output: ../../videos/scripting/python-bmesh-ops-poke-face-faceted-crystal-boss-webxr/viewport.mp4
"""

import bpy, bmesh, math, os
from mathutils import Vector, Euler

# ─── constants (mirror blueprint.py) ──────────────────────────────────────────
GRID_SEGS   = 7
GRID_SIZE   = 1.0
DISC_RADIUS = 0.88
BOSS_HEIGHT = 0.07
SHELL_DEPTH = 0.10
CENTER_MODE = 'MEAN_WEIGHTED'
SLUG        = "hf_poke_shield"
FRAME_END   = 150
FPS         = 30
OUT_DIR     = ("//../../videos/scripting/"
               "python-bmesh-ops-poke-face-faceted-crystal-boss-webxr")

# ─── scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'

# ─── materials ────────────────────────────────────────────────────────────────
def _mat(name, r, g, b, rough=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1)
    bsdf.inputs["Roughness"].default_value = rough
    return m

mat_body = _mat("HF_Shield_Body", 0.18, 0.22, 0.30)
mat_boss = _mat("HF_Shield_Boss", 0.75, 0.65, 0.20, 0.45)

# ─── rebuild shield geometry ───────────────────────────────────────────────────
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=GRID_SEGS, y_segments=GRID_SEGS, size=GRID_SIZE)
bm.faces.ensure_lookup_table()

outer = [f for f in bm.faces if f.calc_center_median().length > DISC_RADIUS * GRID_SIZE]
bmesh.ops.delete(bm, geom=outer, context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bm.faces.ensure_lookup_table()

disc_faces = bm.faces[:]
result = bmesh.ops.poke(bm, faces=disc_faces, offset=BOSS_HEIGHT, center_mode=CENTER_MODE)
boss_verts = set(result['verts'])

for e in bm.edges:
    e.smooth = False
for f in bm.faces:
    f.smooth = False
    f.material_index = 1 if any(v in boss_verts for v in f.verts) else 0

bm.edges.ensure_lookup_table()
rim = [e for e in bm.edges if len(e.link_faces) == 1]
ret_e = bmesh.ops.extrude_edge_only(bm, edges=rim)
wv = [g for g in ret_e['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=wv, vec=Vector((0, 0, -SHELL_DEPTH)))
bm.edges.ensure_lookup_table()
back = [e for e in bm.edges if len(e.link_faces) == 1]
bmesh.ops.fill(bm, edges=back, use_beauty=True)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
for f in bm.faces:
    f.smooth = False

me = bpy.data.meshes.new(SLUG)
ob = bpy.data.objects.new(SLUG, me)
sc.collection.objects.link(ob)
bm.to_mesh(me)
bm.free()
me.materials.append(mat_body)
me.materials.append(mat_boss)

# ─── rotation animation — 180° around Z over FRAME_END frames ─────────────────
ob.rotation_euler = Euler((math.radians(15), 0, 0))
ob.keyframe_insert("rotation_euler", frame=1)
ob.rotation_euler = Euler((math.radians(15), 0, math.pi))
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
cam_ob.location = Vector((0, -3.0, 1.0))
cam_ob.rotation_euler = Euler((math.radians(70), 0, 0))

# ─── lights ───────────────────────────────────────────────────────────────────
def _area(name, loc, energy, size=1.5):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lo)
    lo.location = Vector(loc)
    return lo

_area("Key",  ( 2.0, -1.5,  3.0), 500)
_area("Fill", (-1.5, -2.0,  1.5), 120, 2.0)
_area("Rim",  ( 0.0,  2.5,  2.0), 200)

# ─── world ────────────────────────────────────────────────────────────────────
sc.world = bpy.data.worlds.new("W")
sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.04, 0.04, 0.07, 1)

# ─── render settings ──────────────────────────────────────────────────────────
sc.frame_start = 1
sc.frame_end   = FRAME_END
sc.render.fps  = FPS
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080
sc.render.engine = 'CYCLES'
sc.cycles.samples = 64

abs_out = bpy.path.abspath(OUT_DIR)
os.makedirs(abs_out, exist_ok=True)
sc.render.filepath = OUT_DIR + "/viewport"
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format  = 'MPEG4'
sc.render.ffmpeg.codec   = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'

bpy.ops.render.render(animation=True)
print(f"[HF] render complete → {abs_out}/viewport.mp4")
