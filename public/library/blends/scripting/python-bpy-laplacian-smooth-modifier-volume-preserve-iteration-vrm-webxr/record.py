"""
record.py — viewport animation for LaplacianSmoothModifier tutorial
--------------------------------------------------------------------
Animates the modifier's `iterations` parameter from 0 → 10 over 60 frames,
then holds for 20 frames at the maximum, producing a 80-frame clip that
clearly shows the geometry flowing from jagged-boolean residue to smooth
organic form while the seam ring stays pinned.

Run after blueprint.py has saved the .blend.

Output: public/library/videos/scripting/
        python-bpy-laplacian-smooth-modifier-volume-preserve-iteration-vrm-webxr/
        viewport.mp4
"""

import bpy
import math
import os

SLUG    = "hf_lapsmooth_panel"
OUT_DIR = "public/library/videos/scripting/" \
          "python-bpy-laplacian-smooth-modifier-volume-preserve-iteration-vrm-webxr"
FPS     = 30
HOLD_FRAMES   = 20   # hold at max iterations
RAMP_FRAMES   = 60   # ramp from 0 to MAX_ITER
MAX_ITER      = 10


# ---------------------------------------------------------------------------
# Locate the panel object and its LaplacianSmooth modifier
# ---------------------------------------------------------------------------
panel = bpy.data.objects.get(SLUG)
if panel is None:
    raise RuntimeError(f"Object '{SLUG}' not found — run blueprint.py first")

mod = panel.modifiers.get("LapSmooth")
if mod is None:
    raise RuntimeError("LaplacianSmoothModifier 'LapSmooth' not found")

total_frames = RAMP_FRAMES + HOLD_FRAMES


# ---------------------------------------------------------------------------
# Keyframe iterations: 0 at frame 1, MAX_ITER at frame RAMP_FRAMES,
# hold at MAX_ITER through RAMP_FRAMES + HOLD_FRAMES.
# ---------------------------------------------------------------------------
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = total_frames

# iterations must be int; keyframe as int property
mod.iterations = 0
mod.keyframe_insert(data_path="iterations", frame=1)

mod.iterations = MAX_ITER
mod.keyframe_insert(data_path="iterations", frame=RAMP_FRAMES)
mod.keyframe_insert(data_path="iterations", frame=total_frames)

# Set interpolation to LINEAR on the ramp, CONSTANT on the hold
for fc in panel.animation_data.action.fcurves:
    if 'iterations' in fc.data_path:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
        # Override last keypoint to CONSTANT to hold cleanly
        fc.keyframe_points[-1].interpolation = 'CONSTANT'


# ---------------------------------------------------------------------------
# Camera: gentle orbit showing the panel as it smooths
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("rec_cam")
cam_data.lens = 50.0
cam_obj = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

cam_distance = 1.1
cam_height   = 0.15
cam_obj.location = (cam_distance, -cam_distance * 0.8, cam_height)
cam_obj.rotation_euler = (math.radians(88), 0.0, math.radians(45))

# Gentle orbit: rotate around Z over the full animation
cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)
cam_obj.rotation_euler.z = math.radians(135)
cam_obj.keyframe_insert(data_path="rotation_euler", frame=total_frames)


# ---------------------------------------------------------------------------
# Lighting: three-point EEVEE Next rig
# ---------------------------------------------------------------------------
def add_light(name, type_, energy, loc, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, type_)
    ld.energy = energy
    ld.color  = color
    lo = bpy.data.objects.new(name, ld)
    lo.location = loc
    bpy.context.collection.objects.link(lo)
    return lo

add_light("key",  'AREA', 600,  ( 1.2,  -0.9,  1.5), (1.0, 0.95, 0.85))
add_light("fill", 'AREA', 150,  (-1.2,  -0.6,  0.8), (0.7, 0.8,  1.0))
add_light("rim",  'SPOT', 450,  ( 0.0,   1.8,  1.2), (1.0, 0.85, 1.0))


# ---------------------------------------------------------------------------
# Render settings
# ---------------------------------------------------------------------------
scene.render.engine        = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x  = 1920
scene.render.resolution_y  = 1080
scene.render.fps           = FPS
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format      = 'MPEG4'
scene.render.ffmpeg.codec       = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

os.makedirs(bpy.path.abspath(f"//{OUT_DIR}"), exist_ok=True)
scene.render.filepath = f"//{OUT_DIR}/viewport"

bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport render complete → {OUT_DIR}/viewport.mp4")
