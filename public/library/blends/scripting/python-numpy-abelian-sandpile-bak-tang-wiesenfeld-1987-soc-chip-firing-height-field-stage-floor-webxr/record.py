"""
record.py — Viewport animation for Abelian Sandpile SOC Stage Floor
Blender 5.1  |  Run AFTER blueprint.py has built the scene.
Output: public/library/videos/scripting/<slug>/viewport.mp4

Sequence (150 frames @ 30 fps = 5 seconds):
  F001–045  : Basis (12 000 chips) — canonical diamond fractal, overhead orbit
  F045–090  : morph Basis → SK_Dense; pile grows, outer rings appear,
              finite-size cutoff truncates pile at grid edge
  F090–110  : hold SK_Dense; camera tilts for 3-D relief view
  F110–150  : morph SK_Dense → SK_Cross; four interacting circular piles
              assemble into a cross with overlapping interference fringes

Camera performs a 30° overhead orbit throughout (z = 8 m, radius = 6 m).
"""

import bpy
import math
import os

SLUG = (
    "python-numpy-abelian-sandpile-bak-tang-wiesenfeld-1987"
    "-soc-chip-firing-height-field-stage-floor-webxr"
)

OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "videos", "scripting", SLUG,
)
os.makedirs(OUT_DIR, exist_ok=True)

scn = bpy.context.scene
ob  = bpy.data.objects["Sandpile_SOC"]
sk  = ob.data.shape_keys.key_blocks

# ── RENDER SETTINGS ───────────────────────────────────────────────────────
scn.render.engine                      = 'BLENDER_EEVEE_NEXT'
scn.render.resolution_x                = 1920
scn.render.resolution_y                = 1080
scn.render.fps                         = 30
scn.render.image_settings.file_format  = 'FFMPEG'
scn.render.ffmpeg.format               = 'MPEG4'
scn.render.ffmpeg.codec                = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")
scn.frame_start = 1
scn.frame_end   = 150

# ── EEVEE BLOOM ───────────────────────────────────────────────────────────
eevee = scn.eevee
eevee.bloom_threshold = 0.30
eevee.bloom_intensity = 0.20

# ── CAMERA ────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 85.0
cam = bpy.data.objects.new("Cam", cam_data)
bpy.context.scene.collection.objects.link(cam)
scn.camera = cam
CAM_R = 6.0
CAM_Z = 8.0


def set_cam(frame: int, orbit_deg: float, tilt: float = 0.35) -> None:
    """Position camera on overhead orbit arc."""
    theta = math.radians(orbit_deg)
    cam.location.x = CAM_R * math.sin(theta)
    cam.location.y = -CAM_R * math.cos(theta)
    cam.location.z = CAM_Z
    cam.rotation_euler = (tilt, 0.0, theta)
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)


def set_sk(frame: int, **kw) -> None:
    """Keyframe shape key values and insert orbit position."""
    for name, val in kw.items():
        sk[name].value = val
        sk[name].keyframe_insert("value", frame=frame)


# ── ZERO SHAPE KEYS ───────────────────────────────────────────────────────
for block in sk:
    block.value = 0.0
sk["Basis"].value = 1.0

# ── KEYFRAME SEQUENCE ─────────────────────────────────────────────────────
# F001–045: Basis overhead
set_sk(1,   Basis=1.0, SK_Sparse=0.0, SK_Dense=0.0, SK_Cross=0.0)
set_sk(45,  Basis=1.0, SK_Sparse=0.0, SK_Dense=0.0, SK_Cross=0.0)
set_cam(1,  0)
set_cam(45, 10)

# F045–090: Basis → SK_Dense (pile grows, finite-size cutoff)
set_sk(90,  Basis=0.0, SK_Sparse=0.0, SK_Dense=1.0, SK_Cross=0.0)
set_cam(90, 20)

# F090–110: hold SK_Dense, camera dips for relief view
set_sk(110, Basis=0.0, SK_Sparse=0.0, SK_Dense=1.0, SK_Cross=0.0)
set_cam(110, 22, tilt=0.55)

# F110–150: SK_Dense → SK_Cross (4 interacting piles)
set_sk(150, Basis=0.0, SK_Sparse=0.0, SK_Dense=0.0, SK_Cross=1.0)
set_cam(150, 30, tilt=0.40)

# ── RENDER ────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("Render complete →", scn.render.filepath)
