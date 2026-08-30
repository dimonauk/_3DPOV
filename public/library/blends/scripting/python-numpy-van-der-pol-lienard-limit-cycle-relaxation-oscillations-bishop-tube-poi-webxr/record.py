"""
record.py — Viewport-animation renderer for the Van der Pol Poi Head
Run AFTER blueprint.py in the same Blender 5.1 session.

Output:
  public/library/videos/scripting/
  python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr/
  viewport.mp4

Technique: 6-second (180-frame) EEVEE Next render.
  Camera orbits one full revolution while shape keys morph through the
  four μ regimes, showing the progression from harmonic to relaxation.

Shape-key timeline:
  f001–045: Basis     (μ=1.0, moderate limit cycle — 4.5 loops)
  f045–090: → SK_Gentle  (μ=0.2, nearly harmonic circular helix)
  f090–105: hold SK_Gentle (show the clean circular form)
  f105–135: → Basis    (return to μ=1)
  f135–180: → SK_Relax (μ=3.0, relaxation oscillations visible)
"""

import bpy
import math

# ── CONFIG ───────────────────────────────────────────────────────────────────
FPS         = 30
N_FRAMES    = 180
CAM_RADIUS  = 0.30          # metres from world origin
CAM_Z_LOW   = -0.08
CAM_Z_HIGH  =  0.16
LENS        = 85            # mm — telephoto keeps tube detail sharp
OBJ_NAME    = "VanDerPol"
OUTPUT_PATH = (
    "//../../videos/scripting/"
    "python-numpy-van-der-pol-lienard-limit-cycle-"
    "relaxation-oscillations-bishop-tube-poi-webxr/viewport"
)

# ── SCENE ────────────────────────────────────────────────────────────────────
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

# ── EEVEE NEXT ───────────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
eevee = scene.eevee
eevee.use_bloom           = True
eevee.bloom_threshold     = 0.28
eevee.bloom_intensity     = 0.40
eevee.bloom_radius        = 4.0
eevee.use_shadows         = True
eevee.shadow_cube_size    = "1024"
eevee.taa_render_samples  = 32

# ── WORLD: NEAR-BLACK ────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value   = (0.02, 0.02, 0.04, 1.0)
bg.inputs["Strength"].default_value = 0.35
scene.world = world

# ── CAMERA ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = LENS
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

poi_obj = bpy.data.objects.get(OBJ_NAME)
if poi_obj:
    track = cam_obj.constraints.new("TRACK_TO")
    track.target     = poi_obj
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis    = "UP_Y"

# ── KEYFRAME ANIMATION ───────────────────────────────────────────────────────
if poi_obj and poi_obj.data.shape_keys:
    sk = poi_obj.data.shape_keys.key_blocks
    for key in sk:
        key.value = 0.0

    def lerp01(lo, hi, v):
        if hi == lo:
            return 1.0
        return max(0.0, min(1.0, (v - lo) / (hi - lo)))

    for fr in range(1, N_FRAMES + 1):
        t     = fr / N_FRAMES
        angle = 2.0 * math.pi * t
        z_cam = CAM_Z_LOW + (CAM_Z_HIGH - CAM_Z_LOW) * math.sin(math.pi * t)
        cam_obj.location = (
            CAM_RADIUS * math.cos(angle),
            CAM_RADIUS * math.sin(angle),
            z_cam,
        )
        cam_obj.keyframe_insert("location", frame=fr)

        # Morph schedule
        if fr <= 45:
            gentle_v, relax_v = 0.0, 0.0
        elif fr <= 90:
            gentle_v = lerp01(45, 90, fr)
            relax_v  = 0.0
        elif fr <= 105:
            gentle_v = 1.0
            relax_v  = 0.0
        elif fr <= 135:
            gentle_v = 1.0 - lerp01(105, 135, fr)
            relax_v  = 0.0
        else:
            gentle_v = 0.0
            relax_v  = lerp01(135, 180, fr)

        sk["SK_Gentle"].value = gentle_v
        sk["SK_Relax"].value  = relax_v
        sk["SK_Gentle"].keyframe_insert("value", frame=fr)
        sk["SK_Relax"].keyframe_insert("value", frame=fr)

# ── RENDER ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] {N_FRAMES} frames → {OUTPUT_PATH}.mp4")
