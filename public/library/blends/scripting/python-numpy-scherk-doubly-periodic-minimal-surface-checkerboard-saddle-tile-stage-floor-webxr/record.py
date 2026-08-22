"""
record.py — Viewport animation recorder for Scherk doubly-periodic surface
============================================================================
Run AFTER blueprint.py in the same Blender session.
Animates from the flat Basis key to SK_Full over 120 frames (4 s at 30 fps),
then holds for 30 frames, while the camera orbits.
Output: public/library/videos/scripting/
          python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard
          -saddle-tile-stage-floor-webxr/viewport.mp4

Requires: FFmpeg available in PATH (Blender uses it for MP4 output).
"""

import bpy
import math

# ─── Parameters ──────────────────────────────────────────────────────────────
OUTPUT_PATH  = "//../../videos/scripting/python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr/viewport.mp4"
FPS          = 30
TOTAL_FRAMES = 150          # 120 fold-in + 30 hold
FOLD_END     = 120
CAMERA_DIST  = 12.0         # metres from origin
CAMERA_ELEV  = math.radians(40)   # elevation angle
OBJ_NAME     = "scherk_doubly_periodic_floor"
SK_KEYS      = [("SK_Full", 1.0)]   # target shape key
# ─────────────────────────────────────────────────────────────────────────────

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUTPUT_PATH
scene.render.resolution_x = 1280
scene.render.resolution_y = 720

obj = bpy.data.objects.get(OBJ_NAME)
if obj is None:
    raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

sk_data = obj.data.shape_keys.key_blocks

# ─── Animate shape key SK_Full from 0 → 1 over frames 1..FOLD_END ────────────
for sk_name, target_val in SK_KEYS:
    kb = sk_data.get(sk_name)
    if kb is None:
        continue
    kb.value = 0.0
    kb.keyframe_insert("value", frame=1)
    kb.value = target_val
    kb.keyframe_insert("value", frame=FOLD_END)
    kb.value = target_val
    kb.keyframe_insert("value", frame=TOTAL_FRAMES)

# ─── Camera orbit ─────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

for f in range(1, TOTAL_FRAMES + 1):
    t     = (f - 1) / (TOTAL_FRAMES - 1)
    angle = math.radians(-20) + t * math.radians(60)   # −20° → +40° orbit
    cam_obj.location = (
        CAMERA_DIST * math.cos(CAMERA_ELEV) * math.cos(angle),
        CAMERA_DIST * math.cos(CAMERA_ELEV) * math.sin(angle),
        CAMERA_DIST * math.sin(CAMERA_ELEV),
    )
    cam_obj.keyframe_insert("location", frame=f)
    # Point at origin
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    dz = -cam_obj.location.z
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz),
        0.0,
        math.atan2(dy, dx) + math.pi / 2,
    )
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ─── Lighting ─────────────────────────────────────────────────────────────────
world = bpy.context.scene.world
if world is None:
    world = bpy.data.worlds.new("World")
    scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Strength"].default_value = 0.8

sun = bpy.data.lights.new("Sun", type="SUN")
sun_obj = bpy.data.objects.new("Sun", sun)
bpy.context.collection.objects.link(sun_obj)
sun_obj.location = (5, -8, 12)
sun.energy = 3.0

# ─── Render ──────────────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
bpy.ops.render.render(animation=True)
print("✓ viewport.mp4 written to", OUTPUT_PATH)
