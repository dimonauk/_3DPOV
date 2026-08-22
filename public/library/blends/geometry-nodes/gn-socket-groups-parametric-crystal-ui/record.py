"""
record.py — Viewport animation for gn-socket-groups-parametric-crystal-ui
Blender 5.1 | CC0

Builds the scene via blueprint, then:
  • Frame 1–60:  Tip Length 0.05 → 0.55  (crystal tips grow out from prism body)
  • Frame 61–120: crystal holds final shape, orbiting camera completes half-turn

Output: public/library/videos/geometry-nodes/gn-socket-groups-parametric-crystal-ui/viewport.mp4
Run:    blender --background --python record.py
"""

import bpy
import math
import sys
import os

# ── Pull in blueprint from same directory ─────────────────────────────────────
_here = os.path.dirname(os.path.abspath(__file__))
if _here not in sys.path:
    sys.path.insert(0, _here)

import importlib, blueprint as bp
importlib.reload(bp)

# ── Build base scene ──────────────────────────────────────────────────────────
obj = bp.build_scene()
scene = bpy.context.scene

# ── Locate modifier and identify Tip Length socket identifier ─────────────────
mod  = obj.modifiers["CrystalPanelDemo"]
tree = mod.node_group

# In 5.1+, modifier inputs are accessed via mod[socket.identifier]
# Find the identifier for the "Tip Length" interface socket
tip_id   = None
body_id  = None
for sock in tree.interface.items_tree:
    if sock.item_type == 'SOCKET' and sock.in_out == 'INPUT':
        if sock.name == "Tip Length":
            tip_id = sock.identifier
        if sock.name == "Body Height":
            body_id = sock.identifier

# ── Keyframe Tip Length: grow from stub to full length ───────────────────────
scene.frame_start = 1
scene.frame_end   = 120

# Frame 1: tiny stub (crystal is just a prism)
scene.frame_set(1)
mod[tip_id] = 0.05
mod.keyframe_insert(data_path=f'["{tip_id}"]', frame=1)

# Frame 60: full tip length
scene.frame_set(60)
mod[tip_id] = 0.55
mod.keyframe_insert(data_path=f'["{tip_id}"]', frame=60)

# Frame 120: hold (no new keyframe needed — extrapolation is CONSTANT by default,
# but we insert one to be explicit)
scene.frame_set(120)
mod[tip_id] = 0.55
mod.keyframe_insert(data_path=f'["{tip_id}"]', frame=120)

# ── Camera orbit: half-turn around Z from frame 1 to 120 ─────────────────────
cam = scene.camera
cam.rotation_euler[0] = math.radians(80)
cam.rotation_euler[2] = 0.0

scene.frame_set(1)
cam.location = (0.0, -5.0, 1.2)
cam.keyframe_insert(data_path="location", frame=1)
cam.keyframe_insert(data_path="rotation_euler", frame=1)

# Animate via empty + TrackTo constraint for clean orbit
empty = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(empty)
empty.location = (0, 0, 0)

track = cam.constraints.new('TRACK_TO')
track.target = empty
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

# Keyframe cam position around a circle of radius 5
for fr, deg in [(1, 0), (60, 120), (120, 240)]:
    angle = math.radians(deg)
    cam.location = (
        5.0 * math.sin(angle),
        -5.0 * math.cos(angle),
        1.8,
    )
    cam.keyframe_insert(data_path="location", frame=fr)

# ── Render settings ───────────────────────────────────────────────────────────
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps          = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

_repo_root = os.path.normpath(os.path.join(_here, '..', '..', '..', '..', '..'))
_out       = os.path.join(
    _repo_root, 'public', 'library', 'videos',
    'geometry-nodes', 'gn-socket-groups-parametric-crystal-ui', 'viewport.mp4'
)
os.makedirs(os.path.dirname(_out), exist_ok=True)
scene.render.filepath = _out

# Viewport / OpenGL render
bpy.ops.render.opengl(animation=True)

print(f"[record] Written → {_out}")
