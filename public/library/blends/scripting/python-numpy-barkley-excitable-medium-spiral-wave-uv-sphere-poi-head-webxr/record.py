"""
record.py — Barkley Spiral Wave viewport animation
===================================================
Runs blueprint.py to build the displaced UV sphere poi head, then captures
a 150-frame animation that morphs through the three wave-state shape keys
while the camera orbits.  Output:

  public/library/videos/scripting/
  python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr/
  viewport.mp4

5 seconds at 30 fps — long enough to show one full spiral rotation cycle.

Run from Blender's Script editor or:
    blender --background --python record.py
"""

import bpy, math, os, sys

# ── 1. Run blueprint ──────────────────────────────────────────────────────────
BLUEPRINT = os.path.join(os.path.dirname(__file__), "blueprint.py")
exec(open(BLUEPRINT).read())   # noqa: S102

# ── 2. Camera ─────────────────────────────────────────────────────────────────
DIST     = 0.22
ELEV_DEG = 30.0

cam_data             = bpy.data.cameras.new("rec_cam")
cam_data.lens        = 85
cam_obj              = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

elev = math.radians(ELEV_DEG)
cam_obj.location = (0.0, -DIST * math.cos(elev), DIST * math.sin(elev))
cam_obj.rotation_euler = (math.radians(90.0 - ELEV_DEG), 0.0, 0.0)

# ── 3. Lights ─────────────────────────────────────────────────────────────────
def add_light(name, loc, energy, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, type='AREA')
    ld.energy = energy
    ld.color  = color
    lo = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = loc
    return lo

add_light("key",  ( 0.3, -0.25,  0.35), energy=60,  color=(1.0, 0.9, 0.7))
add_light("fill", (-0.2, -0.15, -0.1 ), energy=20,  color=(0.5, 0.6, 1.0))
add_light("rim",  ( 0.0,  0.35,  0.2 ), energy=35,  color=(1.0, 0.4, 0.1))

# ── 4. Scene settings ─────────────────────────────────────────────────────────
FRAMES = 150
scene  = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = 30

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "public", "library", "videos", "scripting",
    "python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1280
scene.render.resolution_y =  720
scene.render.filepath     = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── 5. Shape-key animation (morph cycle) ─────────────────────────────────────
# WHY this timing:
#   F1-50   : Basis (Spiral_T1)
#   F51-100 : cross-fade to Spiral_T2
#   F101-150: cross-fade to Spiral_T3 → loops back to Basis
# Each morph spans ≈T/4 of the rotor period — three keys cover 3/4 revolution.

obj_name = "hf_barkley_spiral"
obj      = bpy.data.objects.get(obj_name)
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    basis_key  = kb.get("Basis")
    t2_key     = kb.get("Spiral_T2")
    t3_key     = kb.get("Spiral_T3")

    if t2_key and t3_key:
        def key_frame(key, frame, val):
            key.value = val
            key.keyframe_insert("value", frame=frame)

        # Basis stays at 1.0 before F50, fades to 0 by F100
        key_frame(basis_key, 1,   1.0)
        key_frame(basis_key, 50,  1.0)
        key_frame(basis_key, 100, 0.0)
        key_frame(basis_key, 150, 0.0)

        # T2 fades in F50-100, holds, fades out F125-150
        key_frame(t2_key, 1,   0.0)
        key_frame(t2_key, 50,  0.0)
        key_frame(t2_key, 100, 1.0)
        key_frame(t2_key, 125, 1.0)
        key_frame(t2_key, 150, 0.0)

        # T3 fades in from F125
        key_frame(t3_key, 1,   0.0)
        key_frame(t3_key, 125, 0.0)
        key_frame(t3_key, 150, 1.0)

# Turntable: camera orbits 360° over 150 frames
empty = bpy.data.objects.new("cam_pivot", None)
bpy.context.scene.collection.objects.link(empty)
cam_obj.parent = empty

for fr, angle in [(1, 0), (150, math.radians(360))]:
    empty.rotation_euler = (0, 0, angle)
    empty.keyframe_insert("rotation_euler", frame=fr)

for fc in empty.animation_data.action.fcurves:
    for kfp in fc.keyframe_points:
        kfp.interpolation = 'LINEAR'

# ── 6. Workbench render (vertex-colour, FLAT shading) ─────────────────────────
scene.render.engine                            = 'BLENDER_WORKBENCH'
scene.display.shading.light                    = 'FLAT'
scene.display.shading.color_type               = 'VERTEX'
scene.display.shading.show_shadows             = False
scene.display.shading.show_specular_highlight  = False

bpy.ops.render.opengl(animation=True)
print("[record] viewport.mp4 written to", OUTPUT_DIR)
