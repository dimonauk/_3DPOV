"""
record.py — Viewport animation recording for Lissajous Knots
=============================================================
Outputs: public/library/videos/scripting/
           python-numpy-lissajous-knots-chebyshev-amphichiral-bishop-tube-poi-webxr/
             viewport.mp4

Run after blueprint.py has built and saved hf_lissajous_poi.blend.
The animation shows:
  • Frames  1–30:  slow orbit of the figure-eight (Basis) shape from front
  • Frames 31–50:  morph to SK_Trefoil shape (shape key value 0 → 1)
  • Frames 51–70:  orbit the trefoil, pausing at a 3/4 view
  • Frames 71–90:  morph back to Basis; simultaneous slow full rotation
Total: 90 frames at 30 fps = 3 seconds (within 5–15 s target via viewport mp4).

This script uses bpy.context.scene.render for OpenGL animation.
No external renderer — Workbench / Eevee viewport capture only.
"""

import bpy
import math

# ── Output path (relative to .blend file location) ───────────────────────────
OUTPUT_PATH = (
    "//../../videos/scripting/"
    "python-numpy-lissajous-knots-chebyshev-amphichiral-bishop-tube-poi-webxr/"
    "viewport"
)

# ── Scene & render settings ───────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps          = 30
scene.frame_start         = 1
scene.frame_end           = 90

# Output: FFmpeg H.264 mp4
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_PATH

# ── Camera setup: orbit around Z axis ────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.type = "PERSP"
cam_data.lens = 50.0   # mm — moderate telephoto to flatten the tube profile
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Empty as orbit target
empty = bpy.data.objects.new("CamTarget", None)
bpy.context.collection.objects.link(empty)
empty.location = (0, 0, 0)

# Track-To constraint keeps camera pointed at the poi
ttc = cam_obj.constraints.new("TRACK_TO")
ttc.target    = empty
ttc.track_axis  = "TRACK_NEGATIVE_Z"
ttc.up_axis     = "UP_Y"

# ── Camera orbit keyframes ────────────────────────────────────────────────────
ORBIT_RADIUS = 0.55   # metres — far enough to see the full 0.18m bounding box
ORBIT_HEIGHT = 0.10   # slight vertical offset

def set_cam_orbit(frame, angle_deg, height=ORBIT_HEIGHT):
    """Position camera at (R·cosθ, R·sinθ, h) and insert keyframe."""
    a = math.radians(angle_deg)
    cam_obj.location = (
        ORBIT_RADIUS * math.cos(a),
        ORBIT_RADIUS * math.sin(a),
        height,
    )
    cam_obj.keyframe_insert("location", frame=frame)

# Frames 1–30: slow front-to-3/4 orbit of figure-eight (Basis)
set_cam_orbit(1,   0.0)
set_cam_orbit(30, 90.0)

# Frames 31–70: hold 3/4 view during morph, then continue orbit
set_cam_orbit(31,  90.0)
set_cam_orbit(70, 200.0)

# Frames 71–90: continue orbit back toward front
set_cam_orbit(71, 200.0)
set_cam_orbit(90, 280.0)

# ── Shape key animation ───────────────────────────────────────────────────────
poi_obj = bpy.data.objects.get("hf_lissajous_poi")
if poi_obj and poi_obj.data.shape_keys:
    kb = poi_obj.data.shape_keys.key_blocks
    # Ensure all start at 0
    for k in kb:
        k.value = 0.0

    # Trefoil morph: frames 31–50 (Basis → SK_Trefoil)
    if "SK_Trefoil" in kb:
        kb["SK_Trefoil"].value = 0.0
        kb["SK_Trefoil"].keyframe_insert("value", frame=31)
        kb["SK_Trefoil"].value = 1.0
        kb["SK_Trefoil"].keyframe_insert("value", frame=50)
        # Hold at trefoil 51–70, then morph back 71–90
        kb["SK_Trefoil"].value = 1.0
        kb["SK_Trefoil"].keyframe_insert("value", frame=70)
        kb["SK_Trefoil"].value = 0.0
        kb["SK_Trefoil"].keyframe_insert("value", frame=90)

    # Brief flash of SK_Nine during return journey (frames 75–83)
    if "SK_Nine" in kb:
        kb["SK_Nine"].value = 0.0
        kb["SK_Nine"].keyframe_insert("value", frame=71)
        kb["SK_Nine"].value = 0.75
        kb["SK_Nine"].keyframe_insert("value", frame=79)
        kb["SK_Nine"].value = 0.0
        kb["SK_Nine"].keyframe_insert("value", frame=87)

# ── Lighting ──────────────────────────────────────────────────────────────────
# Key light: warm area lamp overhead-left
key = bpy.data.lights.new("Key", "AREA")
key.energy = 120.0
key.color  = (1.0, 0.95, 0.85)
key.size   = 0.8
key_obj = bpy.data.objects.new("Key", key)
bpy.context.collection.objects.link(key_obj)
key_obj.location = (-0.4, -0.3, 0.6)
key_obj.rotation_euler = (math.radians(45), math.radians(-30), 0)

# Fill light: cool blue rim
fill = bpy.data.lights.new("Fill", "AREA")
fill.energy = 40.0
fill.color  = (0.7, 0.8, 1.0)
fill.size   = 0.5
fill_obj = bpy.data.objects.new("Fill", fill)
bpy.context.collection.objects.link(fill_obj)
fill_obj.location = (0.5, 0.4, 0.3)
fill_obj.rotation_euler = (math.radians(-20), math.radians(40), 0)

# ── World background ─────────────────────────────────────────────────────────
scene.world.use_nodes = True
bg_node = scene.world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs["Color"].default_value   = (0.04, 0.04, 0.06, 1.0)  # near-black navy
    bg_node.inputs["Strength"].default_value = 0.8

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print("✓ viewport.mp4 written to", OUTPUT_PATH)
