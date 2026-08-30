"""
record.py — Viewport-animation renderer for the Nosé–Hoover Poi Head
Run AFTER blueprint.py in the same Blender 5.1 session.

Output: public/library/videos/scripting/
        python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr/
        viewport.mp4

Technique: 5-second (150-frame) EEVEE Next render.
  - Camera orbits in a helix around the poi head (full 360°).
  - Shape-key morphs: Basis → SK_Torus (f40-80) → hold (f80-100)
                      → return Basis (f100-120) → SK_HotT (f130-150).
  - Bloom highlights the ξ-colour glow (amber heating spikes).
  - World is near-black to maximise emission contrast.
"""

import bpy
import math

# ── CONFIG ───────────────────────────────────────────────────────────────────
FPS          = 30
N_FRAMES     = 150        # 5 s at 30 fps — enough to show all 3 morphs once
CAM_RADIUS   = 0.32       # metres from world origin
CAM_Z_LOW    = -0.10      # helical low point
CAM_Z_HIGH   =  0.20      # helical high point
LENS         = 85         # mm — telephoto keeps tube detail
OBJ_NAME     = "NoseHoover"
OUTPUT_PATH  = "//../../videos/scripting/python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr/viewport"

# ── SCENE SETUP ──────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUTPUT_PATH

# ── RENDER ENGINE: EEVEE NEXT ─────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
eevee = scene.eevee
eevee.use_bloom          = True
eevee.bloom_threshold    = 0.30
eevee.bloom_intensity    = 0.35
eevee.bloom_radius       = 4.0
eevee.use_shadows        = True
eevee.shadow_cube_size   = "1024"
eevee.taa_render_samples = 32

# ── WORLD: NEAR-BLACK ─────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.04, 1.0)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4
scene.world = world

# ── CAMERA ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = LENS
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Track-to constraint → always points at the poi head
track = cam_obj.constraints.new("TRACK_TO")
nh_obj = bpy.data.objects.get(OBJ_NAME)
if nh_obj:
    track.target    = nh_obj
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis    = "UP_Y"

# Animate helical orbit + shape-key morphs
if nh_obj and nh_obj.data.shape_keys:
    sk = nh_obj.data.shape_keys.key_blocks

    # Zero all shape-key values
    for key in sk:
        key.value = 0.0

    for fr in range(1, N_FRAMES + 1):
        t = fr / N_FRAMES          # 0..1
        angle = 2.0 * math.pi * t  # full revolution in 5 s
        z = CAM_Z_LOW + (CAM_Z_HIGH - CAM_Z_LOW) * math.sin(math.pi * t)
        cam_obj.location = (
            CAM_RADIUS * math.cos(angle),
            CAM_RADIUS * math.sin(angle),
            z,
        )
        cam_obj.keyframe_insert("location", frame=fr)

        # Shape-key timeline:
        #  f01-40:  Basis (ergodic chaos)
        #  f40-80:  morph → SK_Torus
        #  f80-100: hold SK_Torus (show quasi-periodic orbit)
        #  f100-120: morph back to Basis
        #  f120-150: morph → SK_HotT (T=2 hot bath)
        def lerp(a, b, t_):
            return max(0.0, min(1.0, a + (b - a) * t_))

        if fr <= 40:
            torus_v, hot_v = 0.0, 0.0
        elif fr <= 80:
            torus_v = (fr - 40) / 40.0
            hot_v   = 0.0
        elif fr <= 100:
            torus_v = 1.0
            hot_v   = 0.0
        elif fr <= 120:
            torus_v = 1.0 - (fr - 100) / 20.0
            hot_v   = 0.0
        else:
            torus_v = 0.0
            hot_v   = (fr - 120) / 30.0

        sk["SK_Torus"].value = torus_v
        sk["SK_HotT"].value  = hot_v
        sk["SK_Torus"].keyframe_insert("value", frame=fr)
        sk["SK_HotT"].keyframe_insert("value", frame=fr)

# ── RENDER ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] Rendered {N_FRAMES} frames → {OUTPUT_PATH}.mp4")
