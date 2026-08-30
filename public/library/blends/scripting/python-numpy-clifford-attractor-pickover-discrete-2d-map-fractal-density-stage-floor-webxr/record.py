"""
record.py — Clifford Attractor Viewport Animation
Outputs: public/library/videos/scripting/
         python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr/
         viewport.mp4

Run from Blender's scripting tab AFTER blueprint.py has built the mesh.
Duration: 12 s at 24 fps = 288 frames.
Animation: shape-key value interpolation  Basis → SK_Cave → SK_Web → SK_Sparse → Basis
plus slow top-down camera orbit to reveal the floor pattern.

Blender 5.1  |  EEVEE  |  1920×1080  |  H.264 via FFmpeg
"""

import bpy
import math
import os

# ── OUTPUT ────────────────────────────────────────────────────────────────
SLUG    = "python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr"
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "public", "library", "videos", "scripting", SLUG,
)
os.makedirs(OUT_DIR, exist_ok=True)

FPS     = 24
FRAMES  = 288   # 12 s
OUTFILE = os.path.join(OUT_DIR, "viewport.mp4")

# ── SCENE SETUP ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine              = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.fps                  = FPS
scene.frame_start                 = 1
scene.frame_end                   = FRAMES
scene.render.filepath             = OUTFILE
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format        = "MPEG4"
scene.render.ffmpeg.codec         = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"

# EEVEE: bloom for luminous vertex colour feel
eevee = scene.eevee
eevee.use_bloom = True
eevee.bloom_threshold = 0.4
eevee.bloom_intensity = 0.8

# World: dark background
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.0

# ── CAMERA ────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Slow top-down orbit at radius=10, height=9 — reveals the floor pattern
# Starts directly above, rotates 90° over the clip.
CAM_R  = 10.0
CAM_H  =  9.0
START_ANG = math.radians(90)
END_ANG   = math.radians(180)

def set_cam(frame: int) -> None:
    t   = (frame - 1) / (FRAMES - 1)
    ang = START_ANG + (END_ANG - START_ANG) * t
    cam_obj.location = (CAM_R * math.cos(ang), CAM_R * math.sin(ang), CAM_H)
    cam_obj.rotation_euler = (math.radians(50), 0.0, ang + math.radians(90))
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

set_cam(1)
set_cam(FRAMES)

# ── SHAPE KEY ANIMATION ───────────────────────────────────────────────────
ob = bpy.data.objects.get("Clifford_Attractor")
if ob and ob.data.shape_keys:
    sk = ob.data.shape_keys
    keys = ["Basis", "SK_Cave", "SK_Web", "SK_Sparse", "Basis"]
    # Each key held for 3 s (72 frames), with 0.5 s (12 frame) crossfade.
    HOLD = 60
    FADE = 12
    frame_marks = [1, 1+HOLD, 1+HOLD+FADE, 1+HOLD+FADE+HOLD,
                   1+HOLD+FADE+HOLD+FADE, 1+HOLD+FADE+HOLD+FADE+HOLD,
                   FRAMES]

    def zero_all(frame: int) -> None:
        for kb in sk.key_blocks:
            kb.value = 0.0
            kb.keyframe_insert("value", frame=frame)

    # Basis shown at start
    zero_all(1)
    sk.key_blocks["Basis"].value = 1.0
    sk.key_blocks["Basis"].keyframe_insert("value", frame=1)

    # Crossfade schedule: Basis→Cave (f=61-72), Cave hold (73-132), ...
    transitions = [
        (1,   73,  "Basis",    "SK_Cave"),
        (73,  145, "SK_Cave",  "SK_Web"),
        (145, 217, "SK_Web",   "SK_Sparse"),
        (217, 289, "SK_Sparse","Basis"),
    ]
    for (f_start, f_end, from_key, to_key) in transitions:
        if f_end > FRAMES:
            f_end = FRAMES
        mid_a = f_start + HOLD
        mid_b = mid_a + FADE
        if mid_a > FRAMES:
            break
        zero_all(mid_a)
        if from_key in sk.key_blocks:
            sk.key_blocks[from_key].value = 1.0
            sk.key_blocks[from_key].keyframe_insert("value", frame=mid_a)
        if mid_b <= FRAMES:
            zero_all(mid_b)
            if to_key in sk.key_blocks:
                sk.key_blocks[to_key].value = 1.0
                sk.key_blocks[to_key].keyframe_insert("value", frame=mid_b)

# ── EMIT MATERIAL ─────────────────────────────────────────────────────────
if ob:
    mat = bpy.data.materials.new("CliffordEmit")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    emit  = nt.nodes.new("ShaderNodeEmission")
    vattr = nt.nodes.new("ShaderNodeVertexColor")
    vattr.layer_name = "Clifford_Z"
    emit.inputs["Strength"].default_value = 6.0
    nt.links.new(vattr.outputs["Color"],  emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)

# ── RENDER ────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"Viewport animation written → {OUTFILE}")
