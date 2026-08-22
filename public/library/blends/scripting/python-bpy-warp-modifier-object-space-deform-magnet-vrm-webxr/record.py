"""
record.py — WarpModifier Sleeve Cuff Drape
Viewport animation for tutorial video (5–12 seconds, 24 fps).
Renders to: public/library/videos/scripting/
            python-bpy-warp-modifier-object-space-deform-magnet-vrm-webxr/viewport.mp4

Run in Blender 5.1 Script Editor AFTER running blueprint.py.
The sleeve mesh must exist in the scene as "hf_warp_sleeve".

Animation shows:
  F001–F036  object in default pose (no warp), camera orbiting 60°
  F036–F072  WarpModifier Drape strength animates 0→0.82 (drape grows in)
  F072–F096  WarpModifier Twist strength animates 0→0.55 (twist overlays)
  F096–F120  camera completes 360° orbit of final posed cuff
"""

import bpy
import math
from mathutils import Vector

FPS       = 24
DURATION  = 5.0    # seconds
FRAMES    = int(FPS * DURATION)  # 120 frames

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.fps_base = 1.0

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85   # telephoto compresses depth nicely for a sleeve close-up
cam = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam

# Orbit centre — bottom third of sleeve
ORBIT_CENTRE = Vector((0.0, 0.0, 0.07))
ORBIT_RADIUS = 0.22
ORBIT_HEIGHT = 0.08

# ── SLEEVE OBJECT ─────────────────────────────────────────────────────────────
ob = bpy.data.objects.get("hf_warp_sleeve")
if ob is None:
    raise RuntimeError("Run blueprint.py first — 'hf_warp_sleeve' not found.")

# Re-add WarpModifiers with keyframed strength for the animation.
# (blueprint.py applied them; we add fresh ones here for recording.)
from_e = bpy.data.objects.new("rec_from", None)
bpy.context.collection.objects.link(from_e)
from_e.location = Vector((0.0, 0.0, 0.0))

drape_to = bpy.data.objects.new("rec_drape_to", None)
bpy.context.collection.objects.link(drape_to)
drape_to.location = Vector((0.030, 0.012, 0.015))

twist_to = bpy.data.objects.new("rec_twist_to", None)
bpy.context.collection.objects.link(twist_to)
import mathutils
twist_to.rotation_euler = mathutils.Euler((0, 0, math.radians(13.0)), "XYZ")

drape_mod = ob.modifiers.new("DRec", "WARP")
drape_mod.object_from    = from_e
drape_mod.object_to      = drape_to
drape_mod.falloff_radius = 0.090
drape_mod.falloff_type   = "SMOOTH"
drape_mod.vertex_group   = "cuff_zone"

twist_mod = ob.modifiers.new("TRec", "WARP")
twist_mod.object_from    = from_e
twist_mod.object_to      = twist_to
twist_mod.falloff_radius = 0.068
twist_mod.falloff_type   = "SPHERE"
twist_mod.vertex_group   = "cuff_zone"

# Drape strength: 0 at F1, 0 at F36, 0.82 at F72
drape_mod.strength = 0.0
drape_mod.keyframe_insert("strength", frame=1)
drape_mod.keyframe_insert("strength", frame=36)
drape_mod.strength = 0.82
drape_mod.keyframe_insert("strength", frame=72)
drape_mod.keyframe_insert("strength", frame=120)

# Twist strength: 0 at F1, 0 at F72, 0.55 at F96
twist_mod.strength = 0.0
twist_mod.keyframe_insert("strength", frame=1)
twist_mod.keyframe_insert("strength", frame=72)
twist_mod.strength = 0.55
twist_mod.keyframe_insert("strength", frame=96)
twist_mod.keyframe_insert("strength", frame=120)

# ── CAMERA ORBIT KEYFRAMES ────────────────────────────────────────────────────
for f in range(1, FRAMES + 1):
    t = (f - 1) / (FRAMES - 1)
    angle = t * math.tau    # full 360° over duration
    cx = ORBIT_CENTRE.x + ORBIT_RADIUS * math.cos(angle)
    cy = ORBIT_CENTRE.y + ORBIT_RADIUS * math.sin(angle)
    cz = ORBIT_CENTRE.z + ORBIT_HEIGHT
    cam.location = (cx, cy, cz)

    # Point camera at orbit centre
    direction = ORBIT_CENTRE - Vector((cx, cy, cz))
    direction.normalize()
    rot = direction.to_track_quat("-Z", "Y")
    cam.rotation_euler = rot.to_euler()

    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene.render.engine          = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format   = "MPEG4"
scene.render.ffmpeg.codec    = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"

OUTPUT_PATH = "//public/library/videos/scripting/" \
              "python-bpy-warp-modifier-object-space-deform-magnet-vrm-webxr/" \
              "viewport.mp4"
scene.render.filepath = OUTPUT_PATH

# Viewport shading for readability
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
                space.shading.use_scene_lights = True
                space.overlay.show_wireframes   = False

print(f"[record] Ready. Press Ctrl+F12 to render → {OUTPUT_PATH}")
print(f"[record] Or: bpy.ops.render.render(animation=True)")
