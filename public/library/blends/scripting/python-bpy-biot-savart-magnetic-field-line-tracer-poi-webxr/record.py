"""
Biot-Savart Field-Line Tracer — Record Script (Blender 5.1)
============================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Builds a compact viewport-animation demonstration and renders it to:
  public/library/videos/scripting/
      python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr/viewport.mp4

Scene: 12 field lines (every-other seed from blueprint.py, for speed),
300 RK4 steps each.  Camera rotates 90° over 90 frames while trails
draw on, showing the helix coil surrounded by field lines spiralling
away and looping back.  EEVEE Next with bloom for glow readability.

Run from Blender's Script Editor with an empty scene, or headless:
  blender --background --python record.py
"""

import bpy, math
from mathutils import Vector

# ── Render target ─────────────────────────────────────────────────────────────
import pathlib, os

REPO_ROOT   = pathlib.Path(__file__).resolve().parents[5]
VIDEO_DIR   = REPO_ROOT / "public" / "library" / "videos" / "scripting" / \
              "python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_MP4  = str(VIDEO_DIR / "viewport.mp4")

# ── Reduced parameters for fast render ───────────────────────────────────────
WIRE_TURNS  = 3
WIRE_RADIUS = 0.15
WIRE_HEIGHT = 0.40
N_WIRE_PTS  = 128      # half resolution is fine for record
N_SEEDS     = 12       # every-other seed from full set
SEED_RADIUS = 0.30
RK4_STEPS   = 300
RK4_DT      = 0.012
BEVEL_DEPTH = 0.004
FRAME_END   = 90
EMIT_STR    = 9.0

PALETTE = [
    (0.30, 0.80, 1.00, 1.0),
    (0.80, 0.30, 1.00, 1.0),
    (1.00, 0.50, 0.10, 1.0),
    (0.10, 1.00, 0.40, 1.0),
    (1.00, 0.20, 0.40, 1.0),
    (1.00, 0.95, 0.20, 1.0),
]

# ── Minimal Biot-Savart + RK4 (self-contained, no import from blueprint.py) ──
def helix(theta):
    z = WIRE_HEIGHT * theta / (2 * math.pi * WIRE_TURNS) - WIRE_HEIGHT * 0.5
    return Vector((WIRE_RADIUS * math.cos(theta), WIRE_RADIUS * math.sin(theta), z))

def build_segs(n=N_WIRE_PTS):
    dt = 2 * math.pi * WIRE_TURNS / n
    return [(helix((i + 0.5) * dt), helix((i + 1) * dt) - helix(i * dt))
            for i in range(n)]

SEGS = build_segs()

def b_dir(p):
    B = Vector((0, 0, 0))
    for mid, dl in SEGS:
        r = p - mid
        r2 = r.length_squared
        if r2 < 9e-8:
            continue
        B += dl.cross(r / math.sqrt(r2)) / r2
    L = B.length
    return B / L if L > 1e-12 else Vector((0, 0, 1))

def rk4(p, h):
    k1 = b_dir(p)
    k2 = b_dir(p + h * 0.5 * k1)
    k3 = b_dir(p + h * 0.5 * k2)
    k4 = b_dir(p + h * k3)
    return p + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)

def trace(seed):
    pts = [seed.copy()]
    p = seed.copy()
    for _ in range(RK4_STEPS):
        p = rk4(p, RK4_DT)
        pts.append(p.copy())
        if p.length > 5.0:
            break
    return pts

# ── Scene ─────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for col in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
    for item in list(col):
        col.remove(item)

def mat(name, rgba, strength=EMIT_STR):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    for n in list(m.node_tree.nodes):
        m.node_tree.nodes.remove(n)
    out  = m.node_tree.nodes.new("ShaderNodeOutputMaterial")
    emit = m.node_tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = rgba
    emit.inputs["Strength"].default_value = strength
    m.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return m

# Coil wire
n  = 80
dt = 2 * math.pi * WIRE_TURNS / n
cd = bpy.data.curves.new("coil", 'CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.005
sp = cd.splines.new('POLY')
sp.points.add(n)
for i in range(n + 1):
    t = i * dt
    z = WIRE_HEIGHT * t / (2 * math.pi * WIRE_TURNS) - WIRE_HEIGHT * 0.5
    sp.points[i].co = (WIRE_RADIUS * math.cos(t), WIRE_RADIUS * math.sin(t), z, 1.0)
coil_obj = bpy.data.objects.new("coil", cd)
bpy.context.scene.collection.objects.link(coil_obj)
coil_obj.data.materials.append(mat("coil_mat", (0.6, 0.65, 0.9, 1.0), 3.0))

# Field lines
for i in range(N_SEEDS):
    angle = 2 * math.pi * i / N_SEEDS
    seed  = Vector((SEED_RADIUS * math.cos(angle), SEED_RADIUS * math.sin(angle), 0.0))
    pts   = trace(seed)
    rgba  = PALETTE[i % len(PALETTE)]
    m     = mat(f"fl_mat_{i}", rgba)
    cd    = bpy.data.curves.new(f"fl_{i}", 'CURVE')
    cd.dimensions    = '3D'
    cd.bevel_depth   = BEVEL_DEPTH
    cd.bevel_resolution = 2
    sp = cd.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for j, p in enumerate(pts):
        sp.points[j].co = (*p, 1.0)
    cd.bevel_factor_end = 0.0
    cd.keyframe_insert("bevel_factor_end", frame=1)
    cd.bevel_factor_end = 1.0
    cd.keyframe_insert("bevel_factor_end", frame=FRAME_END)
    obj = bpy.data.objects.new(f"fl_{i}", cd)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(m)

# Camera on animated orbit
bpy.ops.object.camera_add(location=(0, -2.4, 0.3))
cam = bpy.context.object
cam.rotation_euler = (math.radians(83), 0, 0)
bpy.context.scene.camera = cam

# Orbit empty drives camera parent
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
empty = bpy.context.object
cam.parent = empty
empty.rotation_euler.z = 0.0
empty.keyframe_insert("rotation_euler", index=2, frame=1)
empty.rotation_euler.z = math.radians(90)
empty.keyframe_insert("rotation_euler", index=2, frame=FRAME_END)

# World
w = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
bpy.context.scene.world = w
w.use_nodes = True
bg = w.node_tree.nodes.get("Background") or w.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
bg.inputs["Strength"].default_value = 0.0

# Render settings
scn = bpy.context.scene
scn.frame_start, scn.frame_end = 1, FRAME_END
scn.render.engine             = 'BLENDER_EEVEE_NEXT'
scn.eevee.use_bloom           = True
scn.eevee.bloom_intensity     = 0.10
scn.render.resolution_x       = 1920
scn.render.resolution_y       = 1080
scn.render.fps                = 30
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format      = 'MPEG4'
scn.render.ffmpeg.codec       = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath           = OUTPUT_MP4

bpy.ops.render.render(animation=True)
print(f"[record] viewport animation → {OUTPUT_MP4}")
