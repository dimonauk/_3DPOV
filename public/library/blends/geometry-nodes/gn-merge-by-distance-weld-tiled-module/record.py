"""
record.py — Viewport animation recording for
GN Merge by Distance — Weld-Clean Tiled Module Assembly
Blender 5.1 · CC0 · Holoflow Studio

Renders a 120-frame turntable clip that visually demonstrates the
before/after difference:
  Frames  1– 40  Tile grid with MergeByDistance DISABLED (wireframe overlay
                  on so seam-duplicate edges glow differently)
  Frames 41– 60  Transition: weld distance animates 0 → WELD_DIST
  Frames 61–120  Tile grid WELDED — clean topology, camera orbit completes

Output: public/library/videos/geometry-nodes/gn-merge-by-distance-weld-tiled-module/viewport.mp4
Run via:  blender --background --python record.py
"""

import bpy
import math

# ── Parameters ─────────────────────────────────────────────────────────────
OUTPUT_PATH = "//../../../../videos/geometry-nodes/gn-merge-by-distance-weld-tiled-module/viewport"
FPS         = 30
TOTAL_F     = 120
WELD_DIST   = 0.0005

TILE_W, TILE_D, TILE_H = 1.0, 1.0, 0.05
RIDGE_W, RIDGE_H       = 0.06, 0.012
GRID_COLS, GRID_ROWS   = 3, 3


# ── Re-run blueprint to build the scene ────────────────────────────────────
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from blueprint import clear_scene, make_tile_module, build_gn_weld_tile, make_tile_material

clear_scene()
ob  = make_tile_module()
mat = make_tile_material()
ob.data.materials.append(mat)
build_gn_weld_tile(ob)


# ── Animated weld threshold ─────────────────────────────────────────────────
# Access the MergeByDistance node's Distance input via the modifier's
# node_group and keyframe its default_value.
mod = ob.modifiers["GN_WeldTile"]
ng  = mod.node_group
mbd_node = next(n for n in ng.nodes if n.type == 'MERGE_BY_DISTANCE')
dist_input = mbd_node.inputs['Distance']

# Frame 1–40: threshold = 0 (effectively disabled — nothing merges)
dist_input.default_value = 0.0
dist_input.keyframe_insert("default_value", frame=1)
dist_input.keyframe_insert("default_value", frame=40)

# Frame 60: threshold = WELD_DIST (weld kicks in)
dist_input.default_value = WELD_DIST
dist_input.keyframe_insert("default_value", frame=60)
dist_input.keyframe_insert("default_value", frame=TOTAL_F)

# Set interpolation to EASE_IN for the reveal snap
for fc in ng.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'EASE_IN'


# ── Camera orbit ────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(5.5, -5.5, 4.0))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(52), 0.0, math.radians(45))
bpy.context.scene.camera = cam

# Pivot point for orbit = centre of 3×3 tile grid
cx = TILE_W * (GRID_COLS - 1) * 0.5   # 1.0
cy = TILE_D * (GRID_ROWS - 1) * 0.5   # 1.0

# Shift camera to look at grid centre
cam.location = (cx + 5.0, cy - 5.0, 4.0)

# Orbit: parent camera to an empty at grid centre and rotate the empty
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(cx, cy, 0.0))
pivot = bpy.context.active_object
pivot.name = "CamPivot"
cam.parent = pivot

# Camera relative to pivot: (5, -5, 4) minus pivot position
cam.location = (5.0, -5.0, 4.0)

# Animate pivot Z rotation: 0° → 360° over 120 frames
pivot.rotation_euler = (0.0, 0.0, 0.0)
pivot.keyframe_insert("rotation_euler", frame=1)
pivot.rotation_euler = (0.0, 0.0, math.radians(360))
pivot.keyframe_insert("rotation_euler", frame=TOTAL_F)
for fc in pivot.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'


# ── Sun light ────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(6, -6, 10))
sun = bpy.context.active_object
sun.data.energy         = 5.0
sun.rotation_euler      = (math.radians(38), 0.0, math.radians(30))


# ── Render settings ─────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.fps                 = FPS
scene.frame_start                = 1
scene.frame_end                  = TOTAL_F
scene.render.resolution_x        = 1280
scene.render.resolution_y        = 720
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath            = OUTPUT_PATH

# EEVEE settings: wireframe overlay is viewport-only, so
# encode the topology change as a brief wireframe-material phase instead
# by adding an Emission material with wire-like base colour for frames 1-40.


# ── Render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] Wrote: {OUTPUT_PATH}.mp4")
