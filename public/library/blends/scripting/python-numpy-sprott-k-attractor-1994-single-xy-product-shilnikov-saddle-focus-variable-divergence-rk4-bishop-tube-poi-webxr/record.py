"""
record.py — Sprott K Attractor  ·  Viewport Animation
======================================================
Run inside Blender 5.1 (Text Editor → Run Script, or
  blender --background --python record.py -- output_dir=/abs/path)

Renders a 5-second, 30 fps (150 frame) EEVEE Next animation:
  frames 1–37   : Basis  (a=0.30 canonical)
  frames 38–75  : morph → SK_LoA  (a=0.15 wider loops)
  frames 76–112 : morph → SK_HiA  (a=0.50 tighter spiral)
  frames 113–150: morph → SK_NearP (a=0.65 near second equilibrium)
Camera orbits 1.3 revolutions at elevation 0.35 rad, distance 8.5 m.
Output: public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy, math, sys, os

# ── output path ───────────────────────────────────────────────────────────────
SLUG    = ("python-numpy-sprott-k-attractor-1994-single-xy-product-"
           "shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr")
DEFAULT_OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..", "videos", "scripting", SLUG, "viewport.mp4"
)
OUT_PATH = DEFAULT_OUT
for arg in sys.argv:
    if arg.startswith("output_dir="):
        OUT_PATH = os.path.join(arg.split("=",1)[1], "viewport.mp4")

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

# ── build scene ───────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blueprint import build_sprott_k
tube = build_sprott_k(shape_keys=True)

# ── scene render settings ─────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine          = "BLENDER_EEVEE_NEXT"
scene.render.fps             = 30
scene.frame_start            = 1
scene.frame_end              = 150
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format   = "MPEG4"
scene.render.ffmpeg.codec    = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath        = OUT_PATH

# bloom / exposure
eevee = scene.eevee
eevee.use_bloom  = True
eevee.bloom_threshold = 0.30
eevee.bloom_intensity = 0.55

# ── camera: simple orbit empty ────────────────────────────────────────────────
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
pivot = bpy.context.active_object; pivot.name = "CamPivot"

bpy.ops.object.camera_add()
cam = bpy.context.active_object; cam.name = "OrbitCam"
cam.data.lens            = 85
cam.data.clip_start      = 0.1
cam.data.clip_end        = 200.0
ELEV     = 0.35      # radians above equator
DIST     = 8.5
cam.location = (DIST*math.cos(ELEV), -DIST*math.cos(ELEV), DIST*math.sin(ELEV))
track = cam.constraints.new("TRACK_TO")
track.target      = pivot
track.track_axis  = "TRACK_NEGATIVE_Z"
track.up_axis     = "UP_Y"

scene.camera = cam

# ── world / background ────────────────────────────────────────────────────────
bpy.data.worlds["World"].node_tree.nodes["Background"].inputs[0].default_value = (0.01, 0.01, 0.02, 1.0)

# ── shape-key animation keyframes ────────────────────────────────────────────
sk_block = tube.data.shape_keys
if sk_block:
    keys = sk_block.key_blocks
    key_names = [k.name for k in keys]
    # zero everything at frame 1
    for nm in key_names:
        if nm == "Basis": continue
        k = keys[nm]; k.value = 0.0; k.keyframe_insert("value", frame=1)

    def _cross_fade(from_name, to_name, f_start, f_end):
        """Linear cross-fade between two shape keys."""
        if from_name in key_names:
            k = keys[from_name]
            k.value = 1.0; k.keyframe_insert("value", frame=f_start)
            k.value = 0.0; k.keyframe_insert("value", frame=f_end)
        if to_name in key_names:
            k = keys[to_name]
            k.value = 0.0; k.keyframe_insert("value", frame=f_start)
            k.value = 1.0; k.keyframe_insert("value", frame=f_end)

    _cross_fade("Basis",  "SK_LoA",   37,  75)
    _cross_fade("SK_LoA", "SK_HiA",   75, 112)
    _cross_fade("SK_HiA", "SK_NearP", 112, 150)

# ── camera rotation keyframes ─────────────────────────────────────────────────
REVS = 1.3
for fr in range(1, 151):
    angle = 2 * math.pi * REVS * (fr - 1) / 149
    r     = DIST
    cam.location = (
        r * math.cos(angle) * math.cos(ELEV),
        r * math.sin(angle) * math.cos(ELEV),
        r * math.sin(ELEV),
    )
    cam.keyframe_insert("location", frame=fr)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] Written → {OUT_PATH}")
