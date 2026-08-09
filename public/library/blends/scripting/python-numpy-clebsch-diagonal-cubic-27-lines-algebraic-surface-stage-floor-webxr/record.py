"""
record.py — Clebsch Diagonal Cubic viewport animation
======================================================
Builds the mesh via blueprint.py, then renders a 90-frame turntable that
shows the stage-floor tile from top-down (revealing the S₃ symmetry of the
27-line pattern) and then a low-angle orbit (showing the compressed thickness).

Output:
    public/library/videos/scripting/
    python-numpy-clebsch-diagonal-cubic-27-lines-algebraic-surface-stage-floor-webxr/
    viewport.mp4

Run from Blender's Script editor or:
    blender --background --python record.py
"""

import bpy, math, os, sys

# ── 1. Run blueprint to build mesh ───────────────────────────────────────────
BLUEPRINT = os.path.join(os.path.dirname(__file__), "blueprint.py")
exec(open(BLUEPRINT).read())   # noqa: S102 — trusted local file

# ── 2. Camera: start top-down, orbit to low angle ────────────────────────────
DIST     = 2.0          # camera distance from tile centre (metres)
cam_data = bpy.data.cameras.new("record_cam")
cam_data.lens = 35
cam_obj  = bpy.data.objects.new("record_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Start at top-down (elev=90°), settle to 25° elevation mid-animation
cam_obj.location = (0.0, 0.0, DIST)
cam_obj.rotation_euler = (0.0, 0.0, 0.0)

# ── 3. Three-point light rig ──────────────────────────────────────────────────
def add_light(name, loc, energy, colour=(1, 1, 1)):
    ld = bpy.data.lights.new(name, type='AREA')
    ld.energy = energy
    ld.color  = colour
    lo = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = loc
    return lo

add_light("key",  ( 1.5,  -1.0,  1.8), energy=120, colour=(0.90, 0.90, 1.00))
add_light("fill", (-1.0,   0.8,  0.6), energy=50,  colour=(0.60, 0.50, 1.00))
add_light("rim",  ( 0.0,   1.5, -0.3), energy=40,  colour=(0.40, 0.20, 0.90))

# ── 4. Scene / render settings ────────────────────────────────────────────────
FRAMES    = 90
FRAME_END = FRAMES - 1

scene = bpy.context.scene
scene.frame_start = 0
scene.frame_end   = FRAME_END
scene.render.fps  = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 17

OUT_DIR = os.path.normpath(os.path.join(
    os.path.dirname(__file__),
    "../../../../videos/scripting/"
    "python-numpy-clebsch-diagonal-cubic-27-lines-algebraic-surface-stage-floor-webxr/",
))
os.makedirs(OUT_DIR, exist_ok=True)
scene.render.filepath     = os.path.join(OUT_DIR, "viewport")
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.engine       = 'BLENDER_EEVEE_NEXT'

# ── 5. Rotation animation — slow turntable from above ─────────────────────────
obj_name = "hf_clebsch_cubic"
obj      = bpy.data.objects.get(obj_name)
if obj is None:
    raise RuntimeError(f"Object '{obj_name}' not found — run blueprint first.")

# Animate the tile's Z rotation (turntable reveals S₃ symmetry every 120°)
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert("rotation_euler", frame=0)
obj.rotation_euler = (0, 0, math.radians(360))
obj.keyframe_insert("rotation_euler", frame=FRAME_END)

for fcurve in obj.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'LINEAR'

# Camera orbit: from top-down at frame 0 to 25° elevation at frame 45, hold
def set_cam(frame, elev_deg, azim_deg):
    e = math.radians(elev_deg)
    a = math.radians(azim_deg)
    cam_obj.location = (
        DIST * math.cos(e) * math.sin(a),
        -DIST * math.cos(e) * math.cos(a),
        DIST * math.sin(e),
    )
    cam_obj.rotation_euler = (math.radians(90 - elev_deg), 0, math.radians(azim_deg))
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

set_cam(0,  88,  0)    # nearly top-down: shows S₃ radial symmetry
set_cam(30, 50, 45)    # tilt to mid-angle: shows the compressed thickness
set_cam(60, 25, 90)    # low angle: reveals the 27-line ridges on the surface
set_cam(89, 25, 160)   # continue orbit

# ── 6. Render ─────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport animation → {scene.render.filepath}.mp4")
