"""
record.py — Viewport turntable render for UVProjectModifier decal tutorial
Run after blueprint.py in the same Blender session.

Output: public/library/videos/scripting/
        python-bpy-uv-project-modifier-camera-projector-decal-stamp-glb-webxr/
        viewport.mp4

90 frames (3 s at 30 fps):
  0–30  front view (badge face-on)
  30–90 full 360° orbit so the projector drift is visible
"""

import bpy
import math

OUT_PATH = ("//../../videos/scripting/"
            "python-bpy-uv-project-modifier-camera-projector-decal-stamp-glb-webxr/"
            "viewport.mp4")
FRAMES   = 90

# ── render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine             = 'BLENDER_EEVEE'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format      = 'MPEG4'
scene.render.ffmpeg.codec       = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x       = 1920
scene.render.resolution_y       = 1080
scene.render.fps                = 30
scene.frame_start               = 1
scene.frame_end                 = FRAMES
scene.render.filepath           = OUT_PATH

# ── world lighting ────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("rec_world")
world.use_nodes = True
scene.world = world
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.04, 0.04, 0.07, 1.0)
bg.inputs["Strength"].default_value = 1.2

key = bpy.data.lights.new("key", 'AREA')
key.energy = 220
key_obj = bpy.data.objects.new("key", key)
bpy.context.collection.objects.link(key_obj)
key_obj.location = (1.5, -2.0, 2.5)

# ── render camera ─────────────────────────────────────────────────────────────
# Separate from the UV projector camera — this one orbits the shield.
rc_data = bpy.data.cameras.new("render_cam")
rc_data.lens = 55
rc_obj = bpy.data.objects.new("render_cam", rc_data)
bpy.context.collection.objects.link(rc_obj)
scene.camera = rc_obj

# Pivot empty that rotates; camera is parented to it
pivot = bpy.data.objects.new("orbit_pivot", None)
bpy.context.collection.objects.link(pivot)
rc_obj.parent = pivot
rc_obj.location = (0.0, -2.6, 0.4)

# Track-To keeps shield centred regardless of orbit angle
ct = rc_obj.constraints.new('TRACK_TO')
shield = bpy.data.objects.get("hf_uvproject_shield")
if shield:
    ct.target     = shield
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'

# Keyframe orbit: frame 1 = 0°, frame 90 = 360°
pivot.rotation_euler.z = 0.0
pivot.keyframe_insert("rotation_euler", frame=1)
pivot.rotation_euler.z = math.radians(360)
pivot.keyframe_insert("rotation_euler", frame=FRAMES)
for fc in pivot.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

bpy.ops.render.render(animation=True, write_still=False)
print("[HF] record.py complete → viewport.mp4")
