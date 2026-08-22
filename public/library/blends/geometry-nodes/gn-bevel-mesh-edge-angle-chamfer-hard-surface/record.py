"""
Blender 5.1  –  record.py
Animates the Bevel Width socket from near-zero to full chamfer width over frames
1-30, then orbits the camera 90° during frames 30-60.  Renders a 60-frame PNG
sequence and encodes to viewport.mp4 via ffmpeg.

Run AFTER blueprint.py has been executed (uses the existing scene).
Licence: CC0
"""

import bpy
import math
import os
import subprocess

# ── parameters ───────────────────────────────────────────────────────────────
BEVEL_FULL   = 0.018          # final bevel width (matches blueprint constant)
FRAME_TOTAL  = 60
FRAME_BEVEL  = 30             # frame at which bevel reaches full width
OUTPUT_DIR   = bpy.path.abspath("//render_frames/bevel_chamfer/")
OUTPUT_VIDEO = bpy.path.abspath(
    "//../../videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer-hard-surface/viewport.mp4"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_TOTAL

# ── locate the GN modifier on the control panel ───────────────────────────────
panel = bpy.data.objects.get("control_panel")
if panel is None:
    raise RuntimeError("Run blueprint.py first — 'control_panel' object not found.")

mod = panel.modifiers.get("BevelAngle_GN")
ng  = mod.node_group

# find the Amount socket identifier from the interface
amount_id = None
for item in ng.interface.items_tree:
    if item.in_out == 'INPUT' and getattr(item, 'name', '') == 'Bevel Width':
        amount_id = item.identifier
        break

if amount_id is None:
    raise RuntimeError("Cannot locate 'Bevel Width' socket in GN interface.")

# ── keyframe bevel width: 0.001 at frame 1 → BEVEL_FULL at frame FRAME_BEVEL ─
# Starting at 0.001 (not 0) avoids a degenerate bevel-mesh computation on frame 1.
mod[amount_id] = 0.001
mod.keyframe_insert(data_path=f'["{amount_id}"]', frame=1)

mod[amount_id] = BEVEL_FULL
mod.keyframe_insert(data_path=f'["{amount_id}"]', frame=FRAME_BEVEL)

mod[amount_id] = BEVEL_FULL
mod.keyframe_insert(data_path=f'["{amount_id}"]', frame=FRAME_TOTAL)

# ease the bevel curve: set interpolation to BEZIER for smooth ramp
for fcurve in panel.animation_data.action.fcurves:
    if amount_id in fcurve.data_path:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'

# ── keyframe camera orbit: 0° to 90° during frames FRAME_BEVEL → FRAME_TOTAL ─
cam = scene.camera
if cam is None:
    raise RuntimeError("No camera found; ensure blueprint.py has been run.")

# Orbit pivot at world origin; initial position is (2.8, -2.8, 2.0) → angle 45°
import mathutils

start_angle = math.radians(45)
end_angle   = math.radians(135)
radius      = math.sqrt(2.8**2 + 2.8**2)
cam_z       = 2.0

def cam_pos_from_angle(a: float) -> tuple:
    return (radius * math.cos(a), radius * math.sin(a), cam_z)

cam.location = cam_pos_from_angle(start_angle)
cam.keyframe_insert(data_path='location', frame=FRAME_BEVEL)

cam.location = cam_pos_from_angle(end_angle)
cam.keyframe_insert(data_path='location', frame=FRAME_TOTAL)

# track camera to origin throughout
track = cam.constraints.get("Track To") or cam.constraints.new('TRACK_TO')
track.target     = panel
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis    = 'UP_Y'

# ── render settings ───────────────────────────────────────────────────────────
scene.render.engine       = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath     = os.path.join(OUTPUT_DIR, "frame_")
scene.render.image_settings.file_format = 'PNG'

# ── render all frames ─────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[record] rendered {FRAME_TOTAL} frames to {OUTPUT_DIR}")

# ── encode to mp4 via ffmpeg ─────────────────────────────────────────────────
os.makedirs(os.path.dirname(OUTPUT_VIDEO), exist_ok=True)
cmd = [
    "ffmpeg", "-y",
    "-framerate", "30",
    "-i", os.path.join(OUTPUT_DIR, "frame_%04d.png"),
    "-c:v", "libx264",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    OUTPUT_VIDEO,
]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"[record] video → {OUTPUT_VIDEO}")
else:
    print(f"[record] ffmpeg error:\n{result.stderr}")
