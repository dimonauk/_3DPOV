"""
record.py — Viewport animation recorder for the Zernike Poi Disc
================================================================
Animates shape-key weights through each aberration mode in sequence,
renders via Workbench (fastest, no ray-tracing), outputs viewport.mp4.
Run AFTER blueprint.py has built the mesh; the object "hf_zernike_poi"
must exist in the scene.

Timeline (90 frames @ 30 fps = 3 s):
  0–14    Basis (spherical aberration) held still
  15–29   Morph → defocus
  30–44   Morph → astigmatism_0
  45–59   Morph → coma_x
  60–74   Morph → trefoil_x
  75–89   All weights back to 0 — basis
"""

import bpy

OBJECT_NAME  = "hf_zernike_poi"
OUTPUT_PATH  = "//../../videos/scripting/python-numpy-zernike-polynomials-noll-wavefront-aberration-disc-poi-webxr/viewport"
FPS          = 30
TOTAL_FRAMES = 90

MORPH_SCHEDULE = [
    ("defocus",       15, 29),
    ("astigmatism_0", 30, 44),
    ("coma_x",        45, 59),
    ("trefoil_x",     60, 74),
]

# ── scene setup ───────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine          = 'BLENDER_WORKBENCH'
scn.render.fps             = FPS
scn.frame_start            = 0
scn.frame_end              = TOTAL_FRAMES - 1
scn.render.resolution_x    = 1280
scn.render.resolution_y    = 720
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format   = 'MPEG4'
scn.render.ffmpeg.codec    = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath        = OUTPUT_PATH

# Workbench lighting for emission materials
scn.display.shading.light            = 'FLAT'
scn.display.shading.color_type       = 'MATERIAL'
scn.display.shading.show_object_outline = True

# ── camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_ob   = bpy.data.objects.new("RecCam", cam_data)
bpy.context.scene.collection.objects.link(cam_ob)
cam_ob.location = (0.0, -1.0, 0.8)
cam_ob.rotation_euler = (1.05, 0.0, 0.0)   # ~60° tilt
scn.camera = cam_ob

# ── locate target object ──────────────────────────────────────────────────────
ob = bpy.data.objects.get(OBJECT_NAME)
if ob is None:
    raise RuntimeError(f"Object '{OBJECT_NAME}' not found — run blueprint.py first.")

keys   = ob.data.shape_keys
key_blocks = {kb.name: kb for kb in keys.key_blocks}


def insert_weight(key_name, frame, value):
    kb = key_blocks[key_name]
    kb.value = value
    kb.keyframe_insert("value", frame=frame)


# ── keyframe the shape-key weights ───────────────────────────────────────────
# All weights start at 0
for name in ("defocus", "astigmatism_0", "coma_x", "trefoil_x"):
    insert_weight(name, 0, 0.0)

for name, f_in, f_out in MORPH_SCHEDULE:
    insert_weight(name, f_in - 1, 0.0)   # held at 0 one frame before ramp
    insert_weight(name, f_in,     0.0)
    insert_weight(name, (f_in + f_out) // 2, 1.0)   # peak at midpoint
    insert_weight(name, f_out,    0.0)
    insert_weight(name, f_out + 1, 0.0)

# All weights back to 0 at end
for name in ("defocus", "astigmatism_0", "coma_x", "trefoil_x"):
    insert_weight(name, TOTAL_FRAMES - 1, 0.0)

# Slow rotation of the object for visual interest (30° over full clip)
ob.rotation_euler = (0, 0, 0)
ob.keyframe_insert("rotation_euler", frame=0)
ob.rotation_euler = (0, 0, 0.52)   # ~30°
ob.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES - 1)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[zernike record] ✓ wrote {OUTPUT_PATH}.mp4")
