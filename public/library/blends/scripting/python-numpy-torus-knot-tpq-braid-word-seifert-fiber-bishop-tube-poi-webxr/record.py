# ─────────────────────────────────────────────────────────────────────
# record.py — Viewport animation render for the Torus Knot T(p,q) entry.
# Run this from Blender's scripting workspace AFTER blueprint.py.
# Outputs: public/library/videos/scripting/<slug>/viewport.mp4
# Duration: ~10 seconds at 30 fps = 300 frames.
# Technique: camera orbits around the poi head while shape keys
#             animate through all four knot types in sequence.
# ─────────────────────────────────────────────────────────────────────
import bpy
import math
import os

SLUG   = "python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
FPS    = 30
FRAMES = 300   # 10 s
OUTPUT_DIR = bpy.path.abspath(
    f"//../../../../public/library/videos/scripting/{SLUG}/"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport")
os.makedirs(OUTPUT_DIR, exist_ok=True)

ob = bpy.data.objects.get("hf_torus_knot")
if ob is None:
    raise RuntimeError("Run blueprint.py first — object 'hf_torus_knot' not found.")

# ── Shape-key animation: cycle through all four knot types ───────────
# Each type gets ~75 frames (≈2.5 s).  Keys cross-fade linearly.
# Shape-key indices: 0=Basis, 1=Trefoil, 2=Solomon, 3=Torus34, 4=Torus35
KEY_NAMES = ["Trefoil_T23", "Solomon_T25", "Torus_T34", "Torus_T35"]
SK_BLOCKS  = ob.data.shape_keys.key_blocks

# Reset all shape keys
for blk in SK_BLOCKS:
    blk.value = 0.0

# Helper: set and keyframe a single shape key
def kf_sk(name: str, frame: int, val: float) -> None:
    blk = SK_BLOCKS[name]
    blk.value = val
    blk.keyframe_insert("value", frame=frame)

# Phase boundaries (frames): 0–75, 75–150, 150–225, 225–300
phase_len = FRAMES // len(KEY_NAMES)
for ki, kname in enumerate(KEY_NAMES):
    f_start = ki * phase_len
    f_peak  = f_start + phase_len // 2
    f_end   = (ki + 1) * phase_len

    # Fade in
    kf_sk(kname, f_start, 0.0)
    kf_sk(kname, f_peak,  1.0)
    # Fade out (or hold to end)
    if ki < len(KEY_NAMES) - 1:
        kf_sk(kname, f_end, 0.0)
    else:
        kf_sk(kname, FRAMES, 1.0)

# ── Camera orbit ─────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
bpy.context.scene.camera = cam_ob

ORBIT_R   = 0.38    # metres — radius of camera orbit
CAM_Z     = 0.06    # slight elevation
for f in range(0, FRAMES + 1, 5):
    angle = 2.0 * math.pi * f / FRAMES
    cx = ORBIT_R * math.cos(angle)
    cy = ORBIT_R * math.sin(angle)
    cam_ob.location = (cx, cy, CAM_Z)
    # Point camera at origin (poi centre)
    dx, dy, dz = -cx, -cy, -CAM_Z
    length = math.sqrt(dx**2 + dy**2 + dz**2)
    # Camera -Z axis must point at origin → compute Euler from look-at vector
    import mathutils
    fwd    = mathutils.Vector((dx, dy, dz)).normalized()
    up     = mathutils.Vector((0, 0, 1))
    right  = fwd.cross(up).normalized()
    cam_up = right.cross(fwd)
    rot_mat = mathutils.Matrix((
        (right.x,  right.y,  right.z),
        (cam_up.x, cam_up.y, cam_up.z),
        (-fwd.x,  -fwd.y,   -fwd.z),
    )).transposed()
    cam_ob.rotation_euler = rot_mat.to_euler("XYZ")
    cam_ob.keyframe_insert("location", frame=f)
    cam_ob.keyframe_insert("rotation_euler", frame=f)

# ── Lighting: single area light overhead ─────────────────────────────
light_data = bpy.data.lights.new("RecordLight", type="AREA")
light_data.energy = 40.0
light_ob   = bpy.data.objects.new("RecordLight", light_data)
light_ob.location = (0, 0, 0.35)
bpy.context.collection.objects.link(light_ob)

# ── Render settings ──────────────────────────────────────────────────
scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAMES
scn.render.fps  = FPS

scn.render.engine              = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x        = 1920
scn.render.resolution_y        = 1080
scn.render.resolution_percentage = 100
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format       = "MPEG4"
scn.render.ffmpeg.codec        = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
scn.render.filepath            = OUTPUT_FILE

# ── Black world background ────────────────────────────────────────────
scn.world = bpy.data.worlds.new("RecordWorld")
scn.world.use_nodes = True
bg_node = scn.world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
    bg_node.inputs["Strength"].default_value = 0.0

bpy.ops.render.render(animation=True)
print(f"Render complete → {OUTPUT_FILE}.mp4")
