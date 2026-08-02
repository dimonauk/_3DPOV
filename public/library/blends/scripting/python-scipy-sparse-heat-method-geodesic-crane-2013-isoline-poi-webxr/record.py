"""
record.py — Viewport animation capture for geodesic heat-method tutorial
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py. Animates the wavefront shape keys over 120 frames,
then renders a 4-second viewport animation to:
  public/library/videos/scripting/
    python-scipy-sparse-heat-method-geodesic-crane-2013-isoline-poi-webxr/
      viewport.mp4

WHY viewport render not Cycles: the vertex colour emission is visible
immediately in the Workbench/EEVEE viewport, and the shape-key wavefront
reads more clearly as a silhouette change than in a path-trace.
"""
import bpy, math

FRAMES     = 120       # 4 s at 30 fps
OUT_DIR    = (
    "//../../../../videos/scripting/"
    "python-scipy-sparse-heat-method-geodesic-crane-2013-isoline-poi-webxr/"
)
OUT_FILE   = "viewport"

# ── 1. LOCATE OBJECT ─────────────────────────────────────────────────────────
obj = bpy.data.objects.get("GeodesicPoi")
if obj is None:
    raise RuntimeError("Run blueprint.py first to create GeodesicPoi object.")

sk_block = obj.data.shape_keys
if sk_block is None or len(sk_block.key_blocks) < 2:
    raise RuntimeError("Shape keys missing — re-run blueprint.py.")

n_waves = len(sk_block.key_blocks) - 1   # exclude Basis

# ── 2. KEY THE SHAPE KEYS ─────────────────────────────────────────────────────
# Wave01..WaveN each pulse through 0→1→0 at staggered frames
for bpy.context.scene.frame_current in [0]:
    pass
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = FRAMES

for ki in range(1, n_waves + 1):
    kb     = sk_block.key_blocks[ki]
    kb.value = 0.0
    period = FRAMES // n_waves
    peak_f = int(ki * period - period // 2)
    for frame, val in [
        (max(1, peak_f - period // 2), 0.0),
        (peak_f,                        1.0),
        (min(FRAMES, peak_f + period // 2), 0.0),
    ]:
        kb.value = val
        kb.keyframe_insert("value", frame=frame)

# ── 3. CAMERA ORBIT ──────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam      = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam)
bpy.context.scene.camera = cam

import math
CAM_DIST  = 0.60
CAM_Z     = 0.15
for frame in range(1, FRAMES + 1):
    angle = 2 * math.pi * (frame - 1) / FRAMES
    cam.location = (
        CAM_DIST * math.cos(angle),
        CAM_DIST * math.sin(angle),
        CAM_Z,
    )
    # Point camera at object origin
    dx = -cam.location[0]; dy = -cam.location[1]; dz = -cam.location[2]
    yaw   = math.atan2(dy, dx) + math.pi
    pitch = math.atan2(-cam.location[2], math.sqrt(dx**2+dy**2))
    cam.rotation_euler = (pitch + math.pi/2, 0.0, yaw)
    cam.keyframe_insert("location",        frame=frame)
    cam.keyframe_insert("rotation_euler",  frame=frame)

# ── 4. LIGHTING ───────────────────────────────────────────────────────────────
world = bpy.context.scene.world
if world is None:
    world = bpy.data.worlds.new("RecordWorld")
    bpy.context.scene.world = world
world.use_nodes = False
world.color     = (0.02, 0.02, 0.06)   # near-black indigo background

# ── 5. RENDER SETTINGS ───────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine              = "BLENDER_EEVEE_NEXT"
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format       = "MPEG4"
sc.render.ffmpeg.codec        = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
sc.render.filepath            = OUT_DIR + OUT_FILE
sc.render.fps                 = 30
sc.render.resolution_x        = 1920
sc.render.resolution_y        = 1080
sc.render.resolution_percentage = 100

bpy.ops.render.render(animation=True)
print("✓  viewport.mp4 written to", sc.render.filepath)
