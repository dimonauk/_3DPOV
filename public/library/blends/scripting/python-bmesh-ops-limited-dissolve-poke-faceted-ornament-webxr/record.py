# ================================================================
# record.py — Viewport Animation Recorder
# bmesh.ops Limited Dissolve + Poke  |  Blender 5.1
# ================================================================
# Adds a studio camera + three-point light rig to the animated
# .blend produced by blueprint.py, then renders a 4-second
# viewport animation to:
#   public/library/videos/scripting/
#     python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr/
#       viewport.mp4
#
# Run AFTER blueprint.py:
#   blender ornament_faceted.blend --background --python record.py

import bpy, math
from mathutils import Vector

SLUG       = "python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
FPS        = 30
DURATION_S = 4
FRAMES     = FPS * DURATION_S    # 120 frames — matches blueprint animation
OUTPUT     = (f"//../../../../public/library/videos/scripting/"
              f"{SLUG}/viewport.mp4")

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("rec_cam")
cam_data.lens      = 85.0   # telephoto compresses facets for drama
cam_data.clip_end  = 20.0
cam_obj  = bpy.data.objects.new("rec_cam", cam_data)
cam_obj.location   = Vector((0.0, -3.2, 0.8))
cam_obj.rotation_euler = (math.radians(75), 0.0, 0.0)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# ── Three-point lights ────────────────────────────────────────────────────────
def _area(name, loc, energy, colour=(1,1,1)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy    = energy
    ld.size      = 1.2
    ld.color     = colour
    lo = bpy.data.objects.new(name, ld)
    lo.location  = Vector(loc)
    lo.rotation_euler = (math.radians(45), 0, math.radians(-45))
    scene.collection.objects.link(lo)
    return lo

_area("key_light",  (-1.5, -2.0, 2.5), 120, (1.0, 0.97, 0.90))
_area("fill_light", ( 1.8, -1.5, 1.0),  40, (0.75, 0.85, 1.00))
_area("rim_light",  ( 0.0,  2.5, 0.5),  80, (1.00, 0.90, 0.70))

# ── Render settings ───────────────────────────────────────────────────────────
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath            = OUTPUT

# ── World background ──────────────────────────────────────────────────────────
world = bpy.data.worlds.new("rec_world")
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value   = (0.06, 0.06, 0.08, 1.0)
    bg.inputs['Strength'].default_value = 0.3
scene.world = world

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport.mp4 → {OUTPUT}")
