"""
record.py — Viewport animation recording for Cloth Flag Banner
Outputs: public/library/videos/physics/physics-cloth-simulation-flag-banner/viewport.mp4

Sequence (60 frames at 24 fps = 2.5 seconds):
  F01–F10  : flag fully slack — hoist column pinned, fabric barely moving
  F11–F40  : wind ramps up via keyframed field.strength, flag billows out
  F41–F60  : steady-state billow, full wave-ripple visible

Run AFTER blueprint.py has baked the cache (cloth_flag_banner.blend exists).
Open cloth_flag_banner.blend, then run this script from the Blender Script Editor.
"""

import bpy
import math

scene = bpy.context.scene

# ── Render settings for viewport capture ──────────────────────────────────────
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end   = 60

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = "//../../videos/physics/physics-cloth-simulation-flag-banner/viewport.mp4"

# ── Camera ────────────────────────────────────────────────────────────────────
camera_data = bpy.data.cameras.new("RecordCam")
camera_data.lens = 50
camera_obj = bpy.data.objects.new("RecordCam", camera_data)
bpy.context.scene.collection.objects.link(camera_obj)
scene.camera = camera_obj

# Position: side-on view from +Y, slightly elevated, looking at flag centre
camera_obj.location    = (1.0, -3.8, 0.85)
camera_obj.rotation_euler = (math.radians(82), 0.0, 0.0)

# ── EEVEE Next render engine ───────────────────────────────────────────────────
scene.render.engine = 'BLENDER_EEVEE_NEXT'
eevee = scene.eevee
eevee.taa_render_samples = 16
eevee.use_shadows = True

# ── Three-point lighting ───────────────────────────────────────────────────────
def add_light(name, ltype, energy, loc, rot_deg):
    ld = bpy.data.lights.new(name, ltype)
    ld.energy = energy
    lo = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = loc
    lo.rotation_euler = (math.radians(rot_deg[0]),
                         math.radians(rot_deg[1]),
                         math.radians(rot_deg[2]))
    return lo

add_light("key_sun",  'SUN',  3.5, (0, 0, 5), (60, 0, -30))
add_light("fill_area",'AREA', 400, (-2, -2, 2), (45, 0, 45))
add_light("rim_area", 'AREA', 200, (3, 2, 3),  (60, 0, -120))

# ── Wind strength animation (ramp 0→8 over frames 1–20) ───────────────────────
wind = bpy.data.objects.get("wind_field")
if wind:
    wind.field.strength = 0.0
    wind.field.keyframe_insert(data_path="field.strength", frame=1)
    wind.field.strength = WIND_STRENGTH = 8.0
    wind.field.keyframe_insert(data_path="field.strength", frame=20)
    wind.field.strength = WIND_STRENGTH
    wind.field.keyframe_insert(data_path="field.strength", frame=60)
    # Set interpolation to BEZIER for smooth ramp
    action = wind.animation_data.action
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

# ── Render animation ──────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("Viewport recording written to viewport.mp4")
