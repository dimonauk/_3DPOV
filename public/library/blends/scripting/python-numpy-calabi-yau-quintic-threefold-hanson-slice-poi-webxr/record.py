"""
record.py — Calabi-Yau Quintic Poi Head: Viewport Animation
============================================================
Run AFTER blueprint.py has built the scene.

Renders 120 frames of a 360° camera orbit (4 s at 30 fps) using Blender Workbench
in FLAT/VERTEX_COLOR mode — the fastest engine that faithfully shows the five-branch
colour coding without tone-mapping artefacts.

Output lands in:
  public/library/videos/scripting/
    python-numpy-calabi-yau-quintic-threefold-hanson-slice-poi-webxr/viewport.mp4

WHY WORKBENCH
-------------
Cycles/EEVEE add specular hot-spots that partially obscure the petal topology.
Workbench FLAT+VERTEX flattens each face to its colour, making the branch structure
immediately legible in the first frame — ideal for a 4-second tutorial teaser.
"""

import bpy
import math
import mathutils

# ── Parameters ────────────────────────────────────────────────────────────────

FRAMES     = 120
FPS        = 30
OUT_DIR    = (
    "//../../videos/scripting/"
    "python-numpy-calabi-yau-quintic-threefold-hanson-slice-poi-webxr/"
)
RESOLUTION = (1280, 720)

ORBIT_RADIUS  = 0.18     # metres — ~3.6× the 5 cm poi-head radius
ORBIT_ELEV_DEG = 30.0    # camera elevation above XY plane
ORBIT_FULL_DEG = 360.0   # one complete orbit over FRAMES frames

# ── Scene render settings ─────────────────────────────────────────────────────

scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.fps            = FPS
scene.render.resolution_x   = RESOLUTION[0]
scene.render.resolution_y   = RESOLUTION[1]
scene.render.filepath       = OUT_DIR + "viewport"

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# ── Workbench: FLAT shading, vertex colour, no shadows ───────────────────────

scene.render.engine                      = 'BLENDER_WORKBENCH'
scene.display.shading.light              = 'FLAT'
scene.display.shading.color_type         = 'VERTEX'
scene.display.shading.show_shadows       = False
scene.display.shading.show_specular_highlight = False

# ── Camera orbit ──────────────────────────────────────────────────────────────

cam_data   = bpy.data.cameras.new("RenderCam")
cam_data.lens = 50.0          # standard lens — no wide-angle distortion
cam_obj    = bpy.data.objects.new("RenderCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

elev = math.radians(ORBIT_ELEV_DEG)
R    = ORBIT_RADIUS

# Keyframe every 4th frame for smooth interpolation (Blender uses Bézier by default)
for f in range(1, FRAMES + 2, 4):
    angle = math.radians(ORBIT_FULL_DEG * (f - 1) / FRAMES)
    x = R * math.cos(elev) * math.cos(angle)
    y = R * math.cos(elev) * math.sin(angle)
    z = R * math.sin(elev)
    cam_obj.location = (x, y, z)

    # Always point at origin — compute rotation from direction vector
    direction = mathutils.Vector((0.0, 0.0, 0.0)) - mathutils.Vector((x, y, z))
    q = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = q.to_euler()

    scene.frame_set(min(f, FRAMES))
    cam_obj.keyframe_insert('location',       frame=min(f, FRAMES))
    cam_obj.keyframe_insert('rotation_euler', frame=min(f, FRAMES))

# ── Area light for subtle depth cues under FLAT shading ──────────────────────
# FLAT mode ignores lights, so this is purely for any EEVEE quick-preview fallback
light_data = bpy.data.lights.new("KeyLight", type='AREA')
light_data.energy = 200.0
light_obj  = bpy.data.objects.new("KeyLight", light_data)
light_obj.location = (0.15, -0.10, 0.20)
scene.collection.objects.link(light_obj)

# ── Render ────────────────────────────────────────────────────────────────────

bpy.ops.render.render(animation=True)
print(f"[record] Done → {OUT_DIR}viewport.mp4")
