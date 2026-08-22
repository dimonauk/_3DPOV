"""
record.py — Barth Sextic viewport animation
============================================
Runs the blueprint to build the mesh, then executes a 90-frame turntable
rotation (3 seconds at 30 fps) captured via bpy.ops.render.opengl.
Output lands at  public/library/videos/scripting/
                 python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr/
                 viewport.mp4

The spin axis is Z (vertical) — exposes all 65 icosahedral node tips as the
surface rotates, giving viewers a clear sense of the Ih symmetry.

Run from Blender's Script editor or:
    blender --background --python record.py
"""

import bpy, math, os, sys

# ── 1. Run blueprint to build mesh ───────────────────────────────────────────
BLUEPRINT = os.path.join(os.path.dirname(__file__), "blueprint.py")
exec(open(BLUEPRINT).read())   # noqa: S102 — trusted local file

# ── 2. Camera setup ───────────────────────────────────────────────────────────
DIST     = 0.28          # camera distance from origin in metres (2× poi diameter)
ELEV_DEG = 25.0          # elevation above equator (shows both top & bottom nodes)

cam_data = bpy.data.cameras.new("record_cam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("record_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

angle_elev = math.radians(ELEV_DEG)
cam_obj.location = (
    DIST * math.cos(angle_elev) * 0.0,
    -DIST * math.cos(angle_elev),
    DIST * math.sin(angle_elev),
)
cam_obj.rotation_euler = (math.radians(90.0 - ELEV_DEG), 0.0, 0.0)

# ── 3. Three-point light rig ──────────────────────────────────────────────────
def add_light(name, loc, energy, colour=(1, 1, 1)):
    ld = bpy.data.lights.new(name, type='AREA')
    ld.energy = energy
    ld.color  = colour
    lo = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = loc
    return lo

add_light("key",  ( 0.4,  -0.3,  0.4), energy=80,  colour=(1.0, 0.95, 0.80))
add_light("fill", (-0.3,  -0.2, -0.1), energy=25,  colour=(0.6, 0.75, 1.00))
add_light("rim",  (-0.1,   0.4,  0.3), energy=40,  colour=(1.0, 0.85, 0.50))

# ── 4. Scene / render settings ────────────────────────────────────────────────
FRAMES    = 90        # 3 seconds at 30 fps
FRAME_END = FRAMES - 1

scene = bpy.context.scene
scene.frame_start = 0
scene.frame_end   = FRAME_END
scene.render.fps  = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 17   # near-lossless

OUT_DIR = os.path.normpath(os.path.join(
    os.path.dirname(__file__),
    "../../../../videos/scripting/"
    "python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr/",
))
os.makedirs(OUT_DIR, exist_ok=True)
scene.render.filepath = os.path.join(OUT_DIR, "viewport")

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.engine       = 'BLENDER_EEVEE_NEXT'

# ── 5. Rotation animation (Z-axis turntable) ─────────────────────────────────
obj_name = "hf_barth_sextic"
obj      = bpy.data.objects.get(obj_name)
if obj is None:
    raise RuntimeError(f"Object '{obj_name}' not found — run blueprint first.")

obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert("rotation_euler", frame=0)
obj.rotation_euler = (0, 0, math.radians(360))
obj.keyframe_insert("rotation_euler", frame=FRAME_END)

# Linear interpolation — constant angular velocity
for fcurve in obj.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── 6. Render ─────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport animation saved → {scene.render.filepath}.mp4")
