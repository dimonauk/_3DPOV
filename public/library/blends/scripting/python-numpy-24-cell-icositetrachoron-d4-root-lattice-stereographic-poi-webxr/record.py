"""
record.py — 24-Cell Viewport Animation
========================================
Runs blueprint.py to build the three-tier poi head, then captures a
150-frame camera orbit that shows the full nested shell structure rotating
once. Output:

  public/library/videos/scripting/
  python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr/
  viewport.mp4

5 seconds at 30 fps.  Camera elevation 28° lets the viewer see all three
shells at once — the outer spread-out northern vertices, the middle amber
cuboctahedron, and the compact inner southern cage.

Run from Blender's Script editor, or:
    blender --background --python record.py
"""

import bpy
import math
import os
import sys

# ── 1. Build scene via blueprint ──────────────────────────────────────────────
BLUEPRINT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blueprint.py")
exec(open(BLUEPRINT).read())  # noqa: S102 — intentional script execution

# ── 2. Scene & render settings ────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150
scene.render.fps  = 30

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.film_transparent = False
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(
    bpy.types, 'EEVEE_NEXT') else 'BLENDER_EEVEE'

# Bloom/glow for emission materials
eevee = scene.eevee
eevee.use_bloom             = True
eevee.bloom_threshold       = 0.40
eevee.bloom_intensity       = 0.70
eevee.bloom_radius          = 4.0

# Output path
VIDEO_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..",
    "public", "library", "videos", "scripting",
    "python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr",
)
os.makedirs(VIDEO_DIR, exist_ok=True)
scene.render.filepath = os.path.join(VIDEO_DIR, "viewport")
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format      = 'MPEG4'
scene.render.ffmpeg.codec       = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.ffmpeg_preset = 'GOOD'

# ── 3. Camera orbit ───────────────────────────────────────────────────────────
# The 24-cell poi head is centred near the origin with outer extent ~0.14 m.
# Orbit at 0.60 m distance, 28° elevation for a clear three-shell view.
DIST     = 0.60
ELEV_DEG = 28.0
CENTRE   = (0.0, 0.0, 0.0)

import mathutils

if "rec_cam" in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects["rec_cam"], do_unlink=True)

cam_data      = bpy.data.cameras.new("rec_cam")
cam_data.lens = 85          # slight telephoto compresses shells nicely
cam_obj       = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

elev_rad = math.radians(ELEV_DEG)
FRAMES   = scene.frame_end

for f in range(1, FRAMES + 1):
    t  = (f - 1) / FRAMES          # 0 → 1 over full animation
    az = 2.0 * math.pi * t         # full 360° orbit

    cx, cy, cz = CENTRE
    cam_obj.location = (
        cx + DIST * math.cos(elev_rad) * math.cos(az),
        cy + DIST * math.cos(elev_rad) * math.sin(az),
        cz + DIST * math.sin(elev_rad),
    )
    direction = mathutils.Vector(CENTRE) - mathutils.Vector(cam_obj.location)
    rot_q = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_mode    = 'QUATERNION'
    cam_obj.rotation_quaternion = rot_q

    cam_obj.keyframe_insert(data_path="location",            frame=f)
    cam_obj.keyframe_insert(data_path="rotation_quaternion", frame=f)

# Linearise FCurves to remove Bézier easing artefacts
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── 4. Area light for ambient illumination ────────────────────────────────────
if "rec_light" in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects["rec_light"], do_unlink=True)

light_data          = bpy.data.lights.new("rec_light", type='AREA')
light_data.energy   = 5.0
light_data.size     = 2.0
light_obj           = bpy.data.objects.new("rec_light", light_data)
light_obj.location  = (0.5, -0.5, 0.8)
bpy.context.scene.collection.objects.link(light_obj)

# ── 5. Render ─────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] Animation rendered → {VIDEO_DIR}/viewport.mp4")
