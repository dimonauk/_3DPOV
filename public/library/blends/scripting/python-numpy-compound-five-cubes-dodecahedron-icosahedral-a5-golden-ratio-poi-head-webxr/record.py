"""
record.py — viewport animation renderer for Compound of Five Cubes
Outputs: public/library/videos/scripting/.../viewport.mp4
Duration: ~10 s at 30 fps (300 frames)
Sequence:
  F001–060  orbit shot of the full compound (cobalt/amber/crimson/jade/ivory)
  F061–120  morph Basis → SK_Dodecahedron (cubes merge into dodecahedron envelope)
  F121–180  morph SK_Dodecahedron → Basis (reconstruct)
  F181–240  morph Basis → SK_Frame (hollow wire-frame look)
  F241–300  orbit continues — full compound with bloom
Run inside Blender after blueprint.py has already created the objects.
"""
import bpy, math

# ── output path ───────────────────────────────────────────────────────────────
OUT_PATH = "//../../../../videos/scripting/python-numpy-compound-five-cubes-dodecahedron-icosahedral-a5-golden-ratio-poi-head-webxr/viewport.mp4"

# ── render settings ──────────────────────────────────────────────────────────
scene          = bpy.context.scene
scene.render.engine                    = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x             = 1920
scene.render.resolution_y             = 1080
scene.render.fps                      = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format            = 'MPEG4'
scene.render.ffmpeg.codec             = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.frame_start                     = 1
scene.frame_end                       = 300
scene.render.filepath                 = OUT_PATH

# EEVEE bloom for emission glow
eevee = scene.eevee
eevee.use_bloom = True
eevee.bloom_threshold = 0.35
eevee.bloom_intensity = 0.40
eevee.bloom_radius    = 4.0

# ── camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens  = 85           # mm — mild telephoto to compress perspective
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

CAM_DIST = 0.28              # m from origin — fits POI_RADIUS=0.1 well at 85mm
CAM_ELEV = 25.0              # elevation degrees above equator

# ── world background ─────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.04, 1.0)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
scene.world = world

# ── keyframe helper ──────────────────────────────────────────────────────────
def set_sk(obj, key_name, value, frame):
    sk = obj.data.shape_keys.key_blocks[key_name]
    sk.value = value
    sk.keyframe_insert("value", frame=frame)

def set_cam(frame, angle_deg):
    """Orbit camera around origin at fixed elevation."""
    a = math.radians(angle_deg)
    e = math.radians(CAM_ELEV)
    cam_obj.location = (
        CAM_DIST * math.cos(e) * math.cos(a),
        CAM_DIST * math.cos(e) * math.sin(a),
        CAM_DIST * math.sin(e),
    )
    cam_obj.rotation_euler = (
        math.pi/2 - e,
        0,
        math.pi/2 + a,
    )
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# ── find compound object ──────────────────────────────────────────────────────
compound = bpy.data.objects.get("hf_five_cubes_compound")
if compound is None:
    raise RuntimeError("Run blueprint.py first to create hf_five_cubes_compound")

# ── zero all shape-key values ─────────────────────────────────────────────────
for kb_name in ("SK_Dodecahedron", "SK_Frame", "SK_GoldenStar"):
    set_sk(compound, kb_name, 0.0, 1)
    set_sk(compound, kb_name, 0.0, 300)

# ── camera orbit keyframes ────────────────────────────────────────────────────
for f, ang in [( 1,   0), (60,  60), (120, 120), (180, 180),
               (240, 240), (300, 300)]:
    set_cam(f, ang)

# ── shape-key animation sequence ─────────────────────────────────────────────
# F001–060   compound (Basis only)
set_sk(compound, "SK_Dodecahedron", 0.0, 1)

# F061–120   blend → dodecahedron
set_sk(compound, "SK_Dodecahedron", 0.0, 60)
set_sk(compound, "SK_Dodecahedron", 1.0, 120)

# F121–180   blend back to Basis
set_sk(compound, "SK_Dodecahedron", 1.0, 120)
set_sk(compound, "SK_Dodecahedron", 0.0, 180)

# F181–240   blend → Frame
set_sk(compound, "SK_Frame", 0.0, 180)
set_sk(compound, "SK_Frame", 1.0, 240)

# F241–300   hold Frame, then snap back
set_sk(compound, "SK_Frame", 1.0, 240)
set_sk(compound, "SK_Frame", 0.0, 300)

# ── ease all curves ───────────────────────────────────────────────────────────
for act in bpy.data.actions:
    for fc in act.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.easing        = 'EASE_IN_OUT'

# ── render ────────────────────────────────────────────────────────────────────
import os
abs_path = bpy.path.abspath(OUT_PATH)
os.makedirs(os.path.dirname(abs_path), exist_ok=True)
bpy.ops.render.render(animation=True, write_still=False)
print(f"✓  Rendered → {abs_path}")
