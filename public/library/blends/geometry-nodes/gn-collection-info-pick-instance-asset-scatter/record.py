"""
record.py — Viewport animation for Collection Info Pick Instance scatter
Blender 5.1 · CC0

Renders a 150-frame sequence to:
  public/library/videos/geometry-nodes/gn-collection-info-pick-instance-asset-scatter/viewport.mp4

Animation arc:
  Fr  1–40  : Seed animates 0→80, props redistribute live (density fan-out)
  Fr 41–90  : Smooth orbit around ground plane at elevation 30°
  Fr 91–150 : Min Distance shrinks 1.0→0.25, packing tightens (density swell)

All animation is driven by modifier socket value keyframes + camera path — no
Timeline strips required.  Run after blueprint.py has built the scene.
"""

import bpy
import math

TOTAL_FRAMES  = 150
FPS           = 30
OUTPUT_PATH   = "//public/library/videos/geometry-nodes/" \
                "gn-collection-info-pick-instance-asset-scatter/viewport.mp4"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps   = FPS

# ── OUTPUT SETTINGS ──────────────────────────────────────────────────────────
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath      = OUTPUT_PATH

# ── GROUND + MODIFIER REFERENCE ──────────────────────────────────────────────
ground = bpy.data.objects.get("ground_scatter")
if ground is None:
    raise RuntimeError("Run blueprint.py first — 'ground_scatter' object not found.")

mod = ground.modifiers.get("HF_CollectionScatter")
if mod is None:
    raise RuntimeError("'HF_CollectionScatter' modifier missing on ground_scatter.")

# ── PHASE 1: SEED ANIMATION (fr 1–40) ────────────────────────────────────────
# Keyframe the Seed socket so the scatter pattern reshuffles visibly.
# Socket_3 is the Seed input (index set during blueprint build).
for fr, seed_val in [(1, 0), (20, 40), (40, 80)]:
    scene.frame_set(fr)
    mod["Socket_3"] = seed_val
    mod.keyframe_insert(data_path='["Socket_3"]', frame=fr)

# ── PHASE 2: CAMERA ORBIT (fr 41–90) ─────────────────────────────────────────
cam = scene.camera
if cam is None:
    raise RuntimeError("No active camera in scene.")

orbit_radius  = 11.0
orbit_elev    = math.radians(32)
pivot         = (0.0, 0.0, 0.5)

for i, fr in enumerate(range(41, 91)):
    t      = i / 49.0                           # 0..1 across 50 frames
    angle  = math.radians(-20) + t * math.radians(200)   # 220° sweep
    x = pivot[0] + orbit_radius * math.cos(angle) * math.cos(orbit_elev)
    y = pivot[1] + orbit_radius * math.sin(angle) * math.cos(orbit_elev)
    z = pivot[2] + orbit_radius * math.sin(orbit_elev)
    scene.frame_set(fr)
    cam.location = (x, y, z)
    # Point at pivot
    direction = (pivot[0] - x, pivot[1] - y, pivot[2] - z)
    from mathutils import Vector
    d = Vector(direction).normalized()
    # Euler look-at: pitch then yaw
    import math as _m
    pitch = _m.asin(-d.z)
    yaw   = _m.atan2(d.x, -d.y)
    cam.rotation_euler = (pitch + _m.pi / 2, 0.0, yaw)
    cam.keyframe_insert(data_path="location",       frame=fr)
    cam.keyframe_insert(data_path="rotation_euler", frame=fr)

# ── PHASE 3: MIN DISTANCE SHRINK (fr 91–150) ──────────────────────────────────
for fr, mdist in [(91, 1.0), (120, 0.45), (150, 0.22)]:
    scene.frame_set(fr)
    mod["Socket_4"] = mdist
    mod.keyframe_insert(data_path='["Socket_4"]', frame=fr)

# ── RENDER ───────────────────────────────────────────────────────────────────
scene.frame_set(1)
bpy.ops.render.opengl(animation=True, write_still=False)
print(f"[record] viewport.mp4 → {OUTPUT_PATH}")
