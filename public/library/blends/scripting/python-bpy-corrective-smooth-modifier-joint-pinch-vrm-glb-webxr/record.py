"""
record.py — Viewport animation for CorrectiveSmoothModifier tutorial.

Output:
  public/library/videos/scripting/
    python-bpy-corrective-smooth-modifier-joint-pinch-vrm-glb-webxr/
    viewport.mp4

What it shows:
  Frame  0– 30  Side view of the straight arm tube. Camera holds.
  Frame 30– 60  Arm bends to -100° at the elbow. Smooth elbow fold visible.
  Frame 60– 90  Camera orbits 90° around the elbow while bent; shows no pinch.
  Frame 90–120  Arm returns to rest; camera returns to start position.

Run after blueprint.py:
    blender --background hf_corrective_smooth_arm.blend --python record.py
Or open the .blend file and run from Text Editor.
"""

import bpy
import math
import os

FRAMES     = 120
FPS        = 24
OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-bpy-corrective-smooth-modifier-joint-pinch-vrm-glb-webxr/"
)

# Rebuild if missing (e.g. fresh --background run without .blend)
if "hf_corrective_smooth_arm" not in bpy.data.objects:
    script = bpy.path.abspath("//blueprint.py")
    exec(open(script).read())

scene = bpy.context.scene
scene.frame_start = 0
scene.frame_end   = FRAMES - 1
scene.render.fps  = FPS

rig = bpy.data.objects.get("ArmRig")
cam = scene.camera or bpy.data.objects.get("Cam")

# ── Camera keyframes ───────────────────────────────────────────────────────────
# (frame, loc_x, loc_y, loc_z, rot_x_deg, rot_z_deg)
CAM_KEYS = [
    (0,   0.0, -3.5,  0.4,  90.0,   0.0),
    (30,  0.0, -3.5,  0.4,  90.0,   0.0),
    (55,  0.0, -3.5,  0.6,  88.0,   0.0),
    (65,  1.6, -3.0,  0.5,  84.0, -30.0),
    (85,  1.6, -3.0,  0.5,  84.0, -30.0),
    (110, 0.0, -3.5,  0.4,  90.0,   0.0),
    (119, 0.0, -3.5,  0.4,  90.0,   0.0),
]
for fr, lx, ly, lz, rx, rz in CAM_KEYS:
    scene.frame_set(fr)
    cam.location       = (lx, ly, lz)
    cam.rotation_euler = (math.radians(rx), 0.0, math.radians(rz))
    cam.keyframe_insert('location',       frame=fr)
    cam.keyframe_insert('rotation_euler', frame=fr)

for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation     = 'BEZIER'
        kp.handle_left_type  = 'AUTO_CLAMPED'
        kp.handle_right_type = 'AUTO_CLAMPED'

# ── Arm bend keyframes ─────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')
pb = rig.pose.bones["lower_arm"]
pb.rotation_mode = 'XYZ'

ARM_KEYS = [
    (0,   0),
    (30,  0),
    (60, -100),
    (90, -100),
    (119,  0),
]
for fr, deg in ARM_KEYS:
    scene.frame_set(fr)
    pb.rotation_euler = (math.radians(deg), 0, 0)
    pb.keyframe_insert("rotation_euler", frame=fr)

bpy.ops.object.mode_set(mode='OBJECT')
scene.frame_set(0)

# ── Render settings ────────────────────────────────────────────────────────────
os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.resolution_percentage = 100
scene.render.filepath       = OUTPUT_DIR + "viewport"
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format  = 'MPEG4'
scene.render.ffmpeg.codec   = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.ffmpeg_preset        = 'GOOD'

# Viewport shading: Solid with MatCap for clean cel-shade read
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type            = 'MATERIAL'
                    space.shading.use_scene_lights = True
                    space.overlay.show_overlays    = False

bpy.ops.render.opengl(animation=True)
print(f"[holoflow] record.py done → {OUTPUT_DIR}viewport.mp4")
