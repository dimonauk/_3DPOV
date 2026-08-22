"""
record.py — Viewport animation render for Spring-Mass Cloth GN tutorial
Blender 5.1  ·  CC0  ·  Holoflow Studio

Runs blueprint.main() to build the scene, then renders frames 0–200 to
public/library/videos/geometry-nodes/gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr/viewport.mp4
at 1920×1080, 24 fps, EEVEE Next engine.

Camera: positioned at (0.8, −1.8, 0.1) looking slightly upward toward the
centre of the cloth so the full drape from the pinned top edge to the free
swaying hem is visible in one frame.  A Sun lamp at 45° provides enough
directional shading to make the folds read as three-dimensional.

The first ~30 frames show the cloth beginning to sag under gravity from its
flat initial condition.  By frame 60 the cloth is fully drooping and wind
has pushed it slightly into the +X half.  Frames 60–200 show continuous
gentle oscillation with damping (DAMPING=0.018 settles slowly).

Invoke from Blender's Scripting workspace or via:
  blender --background --python record.py
"""

import bpy
import sys
import os

# ── Build scene if not already present ───────────────────────────────────────
if 'cloth_grid' not in bpy.data.objects:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, script_dir)
    import blueprint
    blueprint.main()

# ── Render parameters ─────────────────────────────────────────────────────────
FRAME_START = 0
FRAME_END   = 200
FPS         = 24
OUTPUT_PATH = (
    '//../../videos/geometry-nodes/'
    'gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr/viewport'
)

scene = bpy.context.scene
scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.resolution_percentage       = 100
scene.render.fps                         = FPS
scene.frame_start                        = FRAME_START
scene.frame_end                          = FRAME_END
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath                    = OUTPUT_PATH

# ── Camera: side-and-slightly-below view to show drape ───────────────────────
# Placed at +Y to look across the XZ cloth plane; elevated slightly above
# ground so the camera catches both the pinned top edge and the free bottom.
import mathutils

bpy.ops.object.camera_add(location=(0.6, -1.8, 0.05))
cam = bpy.context.active_object
cam.name = 'ClothCam'
# Point camera toward cloth centre (0, 0, 0.1) from (0.6, -1.8, 0.05)
direction = mathutils.Vector((0.0, 0.0, 0.1)) - mathutils.Vector(cam.location)
rot_quat  = direction.to_track_quat('-Z', 'Y')
cam.rotation_euler = rot_quat.to_euler()
cam.data.lens       = 50.0   # 50 mm focal length for natural look
cam.data.clip_start = 0.1
cam.data.clip_end   = 20.0
scene.camera = cam

# ── Lighting: sun lamp from upper-left for clear fold shading ────────────────
bpy.ops.object.light_add(type='SUN', location=(2.0, -1.0, 3.0))
sun = bpy.context.active_object
sun.name = 'ClothSun'
sun.data.energy = 5.0
import math
sun.rotation_euler = (math.radians(40), math.radians(0), math.radians(-30))

# ── World: neutral grey so cloth colour reads correctly ──────────────────────
world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value    = (0.04, 0.04, 0.04, 1.0)
    bg.inputs['Strength'].default_value = 0.3
scene.world = world

# ── Ensure output directory exists ───────────────────────────────────────────
out_abs = bpy.path.abspath(OUTPUT_PATH + '.mp4')
os.makedirs(os.path.dirname(out_abs), exist_ok=True)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("record.py complete — viewport.mp4 written.")
