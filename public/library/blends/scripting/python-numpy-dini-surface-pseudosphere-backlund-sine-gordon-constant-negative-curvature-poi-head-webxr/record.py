"""
record.py — Dini's Surface viewport animation
=============================================
Runs inside Blender 5.1 *after* blueprint.py has been executed.
Outputs: public/library/videos/scripting/<slug>/viewport.mp4

Animation (300 frames @ 30 fps = 10 seconds):
  F001–060   Basis (b=0.20) — standard helical Dini surface, camera orbits 120°
  F060–120   Morph Basis → SK_Tight (b=0.40) — spiral tightens
  F120–180   Hold SK_Tight — camera continues orbit
  F180–240   Morph SK_Tight → SK_Loose (b=0.08) — spiral opens
  F240–300   Hold SK_Loose — final wide-helix reveal

Camera: helical dolly — slow upward arc while orbiting, keeping surface centred.
Render: EEVEE_NEXT, 1920×1080, 30 fps, bloom for emission glow.
"""

import bpy
import math
import os

# ── Output path ──────────────────────────────────────────────────────────────
SLUG    = "python-numpy-dini-surface-pseudosphere-backlund-sine-gordon-constant-negative-curvature-poi-head-webxr"
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "../../videos/scripting",
    SLUG,
)
os.makedirs(OUT_DIR, exist_ok=True)

# ── Scene settings ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.fps            = 30
scene.frame_start           = 1
scene.frame_end             = 300
scene.render.filepath       = os.path.join(OUT_DIR, "viewport")
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format             = "MPEG4"
scene.render.ffmpeg.codec              = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"

# Bloom
eevee = scene.eevee
eevee.use_bloom             = True
eevee.bloom_threshold       = 0.32
eevee.bloom_intensity       = 0.45
eevee.bloom_radius          = 5.0

# ── World (dark studio) ───────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background") or \
     world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value   = (0.02, 0.02, 0.04, 1.0)
bg.inputs["Strength"].default_value = 0.5

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("DiniCam")
cam_data.lens = 85.0
cam_obj  = bpy.data.objects.new("DiniCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Orbit parameters
CAM_DIST  = 1.10    # distance from origin (m)
CAM_ELEV  = 0.18    # height offset (m) — slight upward look
ORBIT_DEG = 240.0   # total azimuth sweep over 300 frames

def set_camera_frame(frame: int):
    """Position camera on a gentle helical orbit."""
    t = (frame - 1) / 299.0
    az = math.radians(ORBIT_DEG * t)
    # slight elevation rise mid-animation
    elev = CAM_ELEV + 0.12 * math.sin(math.pi * t)
    cam_obj.location = (
        CAM_DIST * math.cos(az),
        CAM_DIST * math.sin(az),
        elev,
    )
    # point at origin
    dx, dy, dz = -cam_obj.location
    cam_obj.rotation_mode = "XYZ"
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz) - math.pi,
        0.0,
        math.atan2(dy, dx) + math.pi / 2,
    )

# ── Find mesh object ──────────────────────────────────────────────────────────
mesh_obj = bpy.data.objects.get("Dini_Surface")
if mesh_obj is None:
    raise RuntimeError("Dini_Surface not found — run blueprint.py first.")

sk = mesh_obj.data.shape_keys
basis_key  = sk.key_blocks["Basis"]
tight_key  = sk.key_blocks["SK_Tight"]
loose_key  = sk.key_blocks["SK_Loose"]

# ── Keyframe shape key values ─────────────────────────────────────────────────
def _set(kb, val, frame):
    kb.value = val
    kb.keyframe_insert("value", frame=frame)

# F001–060: pure Basis
_set(basis_key,  1.0,  1);  _set(tight_key, 0.0,  1);  _set(loose_key, 0.0,  1)
_set(basis_key,  1.0, 60);  _set(tight_key, 0.0, 60);  _set(loose_key, 0.0, 60)

# F060–120: crossfade Basis → SK_Tight
_set(basis_key, 0.0, 120);  _set(tight_key, 1.0, 120); _set(loose_key, 0.0, 120)

# F120–180: hold SK_Tight
_set(basis_key, 0.0, 180);  _set(tight_key, 1.0, 180); _set(loose_key, 0.0, 180)

# F180–240: crossfade SK_Tight → SK_Loose
_set(basis_key, 0.0, 240);  _set(tight_key, 0.0, 240); _set(loose_key, 1.0, 240)

# F240–300: hold SK_Loose
_set(basis_key, 0.0, 300);  _set(tight_key, 0.0, 300); _set(loose_key, 1.0, 300)

# ── Camera path keyframes ──────────────────────────────────────────────────────
for f in range(1, 301, 10):
    set_camera_frame(f)
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport.mp4 → {OUT_DIR}")
