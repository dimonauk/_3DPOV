# record.py — viewport animation for GN Flip Faces Double-Sided Panel
# Run AFTER blueprint.py. Outputs viewport.mp4 (15 s, 30 fps).
# Demonstrates both sides of the banner by rotating 360°.

import bpy, math
from pathlib import Path

FRAME_START = 1
FRAME_END   = 450         # 15 s @ 30 fps
FPS         = 30
OUT_DIR     = Path(__file__).parent.parent.parent.parent / \
              'videos' / 'geometry-nodes' / \
              'gn-flip-faces-double-sided-panel-kit-webxr'
OUT_DIR.mkdir(parents=True, exist_ok=True)
MP4_PATH    = str(OUT_DIR / 'viewport.mp4')

scn              = bpy.context.scene
scn.frame_start  = FRAME_START
scn.frame_end    = FRAME_END
scn.render.fps   = FPS

# ── Output settings ───────────────────────────────────────────────
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format              = 'MPEG4'
scn.render.ffmpeg.codec               = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.resolution_x  = 1920
scn.render.resolution_y  = 1080
scn.render.resolution_percentage = 100
scn.render.filepath = MP4_PATH

# ── Find / create panel object ────────────────────────────────────
obj = bpy.data.objects.get('banner_panel')
if obj is None:
    raise RuntimeError('Run blueprint.py first to create banner_panel.')

# ── Camera ────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -4.5, 0.0))
cam      = bpy.context.active_object
cam.name = 'RecordCam'
cam.rotation_euler = (math.radians(90), 0.0, 0.0)
scn.camera = cam

# Animate camera in a horizontal orbit (Y→Z plane, object at origin).
# Full 360° in 450 frames — viewer sees front, side, back, side, front.
for f in range(FRAME_START, FRAME_END + 1):
    t     = (f - FRAME_START) / (FRAME_END - FRAME_START)   # 0 → 1
    angle = t * math.tau                                     # 0 → 2π
    r     = 4.5      # orbit radius (m)
    cam.location.x = r * math.sin(angle)
    cam.location.y = -r * math.cos(angle)
    cam.location.z = 0.2   # slight upward tilt
    # Always face the panel at origin.
    dx    = -cam.location.x
    dy    = -cam.location.y
    dz    = -cam.location.z
    hor   = math.atan2(dx, -dy)            # yaw
    dist  = math.hypot(dx, dy)
    pit   = math.atan2(-dz, dist)          # pitch
    cam.rotation_euler = (math.radians(90) + pit, 0.0, hor)
    cam.keyframe_insert('location',        frame=f)
    cam.keyframe_insert('rotation_euler',  frame=f)

# Set linear interpolation so orbit is smooth (no easing artifacts).
if cam.animation_data:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

# ── Lighting ──────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(3.0, -3.0, 5.0))
sun             = bpy.context.active_object
sun.name        = 'RecordSun'
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(40), 0.0, math.radians(45))

# Ambient fill so the back panel is never completely black.
bpy.ops.object.light_add(type='SUN', location=(-3.0, 3.0, -2.0))
fill             = bpy.context.active_object
fill.name        = 'RecordFill'
fill.data.energy = 0.8
fill.rotation_euler = (math.radians(140), 0.0, math.radians(225))

# Solid Workbench render (no ray-tracing needed for viewport mp4).
scn.render.engine          = 'BLENDER_WORKBENCH'
scn.display.shading.light  = 'MATCAP'
scn.display.shading.color_type = 'MATERIAL'

# ── Render ────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print(f'Viewport video written to: {MP4_PATH}')
