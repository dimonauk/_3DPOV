"""
record.py — ABC Flow viewport animation
========================================
Runs blueprint.py to build the three-colour interlocked streamline mesh,
then captures a 150-frame camera orbit that shows the full entangled
structure rotating once.  Output:

  public/library/videos/scripting/
  python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr/
  viewport.mp4

5 seconds at 30 fps — enough to see all three colour bundles and their
tangles.

Run from Blender's Script editor, or:
    blender --background --python record.py
"""

import bpy, math, os, sys

# ── 1. Build scene via blueprint ──────────────────────────────────────────────
BLUEPRINT = os.path.join(os.path.dirname(__file__), "blueprint.py")
exec(open(BLUEPRINT).read())   # noqa: S102

# ── 2. Camera ─────────────────────────────────────────────────────────────────
# Orbit camera at 0.8 m from origin, 20° elevation.
# The ABC domain maps to roughly [0, 0.50]³ at SCALE=0.08 so centre at 0.25
CENTRE   = (0.25, 0.25, 0.25)
DIST     = 0.80
ELEV_DEG = 20.0

cam_data        = bpy.data.cameras.new("rec_cam")
cam_data.lens   = 50
cam_obj         = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# ── 3. Animate camera orbit ───────────────────────────────────────────────────
FRAMES = 150
scene  = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = 30

elev = math.radians(ELEV_DEG)
for f in range(1, FRAMES + 1):
    t   = (f - 1) / FRAMES                    # 0 → 1 over 150 frames
    az  = 2 * math.pi * t                     # full 360° orbit
    cx, cy, cz = CENTRE
    cam_obj.location = (
        cx + DIST * math.cos(elev) * math.cos(az),
        cy + DIST * math.cos(elev) * math.sin(az),
        cz + DIST * math.sin(elev),
    )
    # Point camera toward scene centre
    import mathutils
    direction = mathutils.Vector(CENTRE) - mathutils.Vector(cam_obj.location)
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    cam_obj.keyframe_insert(data_path="location",        frame=f)
    cam_obj.keyframe_insert(data_path="rotation_euler",  frame=f)

# ── 4. Render settings ────────────────────────────────────────────────────────
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.dirname(__file__))))),
    "videos", "scripting",
    "python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)
scene.render.filepath = os.path.join(OUTPUT_DIR, "viewport.mp4")

bpy.ops.render.render(animation=True)
print(f"✓ Rendered → {scene.render.filepath}")
