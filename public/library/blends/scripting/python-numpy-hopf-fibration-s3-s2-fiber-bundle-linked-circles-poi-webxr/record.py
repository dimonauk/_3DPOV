"""
Hopf Fibration — Viewport Animation Recording Script (Blender 5.1)
===================================================================
Run AFTER blueprint.py.  Animates the shape-key blend from the
equatorial Clifford torus → Hemisphere → FullSphere → back, rendering
a 120-frame Workbench animation to the videos folder.

OUTPUT  public/library/videos/scripting/
          python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr/
          viewport.mp4
RENDER  Workbench, MatCap + Solid, top-oblique camera, 1280×720, 30 fps
"""

import bpy, math

SLUG    = "hf_hopf"
FPS     = 30
FRAMES  = 120
OUT_DIR = ("//../../videos/scripting/"
           "python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr/")

obj = bpy.data.objects.get(SLUG)
if obj is None:
    raise RuntimeError("Run blueprint.py first — object 'hf_hopf' not found.")

keys = obj.data.shape_keys.key_blocks

# ── Camera: 45° oblique looking down at origin ────────────────────────────────
bpy.ops.object.camera_add(location=(0.14, -0.14, 0.10))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(55), 0, math.radians(45))
bpy.context.scene.camera = cam

# ── Light: soft area lamp ─────────────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(0.2, -0.1, 0.3))
light = bpy.context.active_object
light.data.energy = 50.0
light.data.size    = 0.4

# ── Animation keyframes ───────────────────────────────────────────────────────
# F1-30: Basis value 1 → Hemisphere 0  (equatorial torus dominant)
# F31-60: Hemisphere rises to 1        (hemisphere appears)
# F61-90: FullSphere rises to 1        (full fibration)
# F91-120: return to Basis             (graceful close)
def set_keys(frame, vals):
    bpy.context.scene.frame_set(frame)
    for name, val in vals.items():
        if name in keys:
            keys[name].value = val
            keys[name].keyframe_insert('value', frame=frame)

# Silence all keys first
for k in keys:
    k.value = 0.0

set_keys(1,   {'Basis': 1.0, 'Hemisphere': 0.0, 'FullSphere': 0.0})
set_keys(30,  {'Basis': 0.0, 'Hemisphere': 1.0, 'FullSphere': 0.0})
set_keys(60,  {'Basis': 0.0, 'Hemisphere': 0.0, 'FullSphere': 1.0})
set_keys(90,  {'Basis': 0.0, 'Hemisphere': 1.0, 'FullSphere': 0.0})
set_keys(120, {'Basis': 1.0, 'Hemisphere': 0.0, 'FullSphere': 0.0})

# Smooth all keyframe handles
for fcurve in (obj.data.shape_keys.animation_data.action.fcurves
               if obj.data.shape_keys.animation_data else []):
    for kfp in fcurve.keyframe_points:
        kfp.interpolation = 'BEZIER'
        kfp.handle_left_type = kfp.handle_right_type = 'AUTO_CLAMPED'

# ── Workbench render settings ─────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine         = 'BLENDER_WORKBENCH'
scn.render.resolution_x   = 1280
scn.render.resolution_y   = 720
scn.render.fps            = FPS
scn.frame_start           = 1
scn.frame_end             = FRAMES
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format  = 'MPEG4'
scn.render.ffmpeg.codec   = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'

scn.display.shading.light        = 'MATCAP'
scn.display.shading.color_type   = 'VERTEX'
scn.display.shading.show_backface_culling = False
scn.render.filepath = bpy.path.abspath(OUT_DIR + "viewport.mp4")

# Orbit: animate camera around Z axis across the 120 frames
import mathutils
cam_data = cam
for f in range(1, FRAMES + 1):
    ang = math.radians(f * 3)   # 360° in 120 frames
    r   = 0.20
    cam.location = (r*math.cos(ang), r*math.sin(ang), 0.10)
    cam.rotation_euler = (math.radians(55), 0, ang + math.radians(90))
    cam.keyframe_insert('location', frame=f)
    cam.keyframe_insert('rotation_euler', frame=f)

bpy.ops.render.render(animation=True)
print(f"[Hopf record] written → {scn.render.filepath}")
