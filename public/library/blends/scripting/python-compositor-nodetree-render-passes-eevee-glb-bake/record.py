# record.py — Viewport render animation: Compositor Nodetree Pipeline
# Run AFTER blueprint.py in the same Blender session.
# Rotates the subject sphere 360° so the emission glow pulses through the
# Glare + LensDist pipeline.  Shows the graded colour output live in the viewport.
# Output: public/library/videos/scripting/
#         python-compositor-nodetree-render-passes-eevee-glb-bake/viewport.mp4

import bpy
import math

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 72   # 3 s at 24 fps
scene.render.fps  = 24

subject = bpy.data.objects.get("CompositorSubject")
if not subject:
    raise RuntimeError("Run blueprint.py first to create the subject sphere.")

# Rotate sphere 360° around Z — emission hot-spot sweeps around the equator
subject.animation_data_create()
action = bpy.data.actions.new("compositor_subject_spin")
subject.animation_data.action = action

SPIN_KEYS = [
    (1,  0.0),
    (72, math.radians(360.0)),
]
for frame, angle in SPIN_KEYS:
    subject.rotation_euler = (0.0, 0.0, angle)
    subject.keyframe_insert("rotation_euler", frame=frame)

for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'   # constant angular velocity

# Compositor is evaluated on every frame; use RENDERED shading so it shows
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type             = 'RENDERED'
        space.shading.use_scene_lights = True
        # The viewport compositor is active — lens distortion and glare visible
        space.use_compositor            = True
        break

scene.render.filepath = (
    "//../../videos/scripting/"
    "python-compositor-nodetree-render-passes-eevee-glb-bake/viewport"
)
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.audio_codec          = 'NONE'
scene.render.resolution_x                = 1280
scene.render.resolution_y                = 720
scene.render.resolution_percentage       = 100

bpy.ops.render.opengl(animation=True, write_still=False)
print("viewport.mp4 written.")
