# record.py — Viewport render for Crystal Antenna Repeat Zone tutorial
# Blender 5.1 | CC0 | Holoflow Studio Library
#
# Animates the Iterations modifier input from 1 → 5 over the first 50 frames
# so the viewer watches the crystal grow generation by generation.  Camera
# orbits 180° to show the three-way symmetry from all angles.
#
# Run after blueprint.py:
#   blender --background crystal_antenna.blend --python record.py

import bpy
import math

OUT_MP4 = (
    "//../../videos/geometry-nodes/"
    "gn-repeat-zone-crystal-antenna-webxr/viewport.mp4"
)
FRAMES = 90

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES

# ── Render settings ────────────────────────────────────────────────────────────
scene.render.engine                      = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.fps                         = 30
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath                    = OUT_MP4

# ── Camera: 180° orbit at an angle that shows depth and symmetry ──────────────
cam_data      = bpy.data.cameras.new("rec_cam")
cam_data.lens = 50
cam_obj       = bpy.data.objects.new("rec_cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

RADIUS   = 3.2
HEIGHT   = 1.5     # tree centre of mass after 5 generations ≈ 1.2 m
ANG_MIN  = math.radians(-90)
ANG_MAX  = math.radians(90)

for frame in range(1, FRAMES + 1):
    t   = (frame - 1) / (FRAMES - 1)
    ang = ANG_MIN + t * (ANG_MAX - ANG_MIN)
    x   = RADIUS * math.sin(ang)
    y   = -RADIUS * math.cos(ang)
    cam_obj.location = (x, y, HEIGHT)
    cam_obj.rotation_euler = (
        math.radians(90 - math.degrees(math.atan2(HEIGHT, RADIUS))),
        0.0,
        math.atan2(-x, y),
    )
    cam_obj.keyframe_insert('location',       frame=frame)
    cam_obj.keyframe_insert('rotation_euler', frame=frame)

# ── Animate Iterations 1 → 5 over frames 1-50, hold at 5 through frame 90 ────
host = bpy.data.objects.get('crystal_antenna')
if host and host.modifiers:
    mod = host.modifiers[0]
    # Locate the Iterations socket key — modifier properties use internal IDs
    it_key = None
    for k in mod.keys():
        try:
            if mod.id_properties_ui(k).as_dict().get('description', '').lower().__contains__('iter'):
                it_key = k
                break
        except Exception:
            pass
    # Fallback: try the first integer modifier property
    if it_key is None:
        for k in mod.keys():
            if isinstance(mod[k], int):
                it_key = k
                break
    if it_key:
        for frame in range(1, FRAMES + 1):
            t   = min((frame - 1) / 49.0, 1.0)   # 0 → 1 over frames 1-50
            val = round(1 + t * 4)                # integer 1 → 5
            mod[it_key] = val
            mod.keyframe_insert(f'["{it_key}"]', frame=frame)

# ── Environment and lighting ───────────────────────────────────────────────────
world = bpy.data.worlds.new("RecWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value    = (0.03, 0.03, 0.07, 1.0)
bg.inputs['Strength'].default_value = 1.0

def add_spot(name, loc, energy, colour=(1, 1, 1)):
    ld = bpy.data.lights.new(name, 'SPOT')
    ld.energy       = energy
    ld.color        = colour
    ld.spot_size    = math.radians(45)
    ld.spot_blend   = 0.3
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc

add_spot("KeyLight", ( 2.5, -2.0, 4.0), 1800, (0.9, 0.95, 1.0))
add_spot("RimLight", (-2.0,  2.5, 2.5),  900, (0.5, 0.70, 1.0))
add_spot("FillLight",(  0,   3.5, 1.0),  400, (0.8, 0.85, 0.9))

bpy.ops.render.render(animation=True)
print(f"[crystal-antenna] Viewport recording saved to {OUT_MP4}")
