# ─────────────────────────────────────────────────────────────────────────────
# RECORD: Viewport animation for the Crystal Scatter tutorial.
#         Run inside Blender 5.1 after blueprint.py to render viewport.mp4.
#         Output: public/library/videos/geometry-nodes/
#                 gn-distribute-points-instance-on-points-scatter-webxr/
#                 viewport.mp4
# ─────────────────────────────────────────────────────────────────────────────
import bpy
import math

VIDEO_PATH  = "//../../videos/geometry-nodes/gn-distribute-points-instance-on-points-scatter-webxr/viewport.mp4"
FPS         = 24
TOTAL_FRAMES = 144   # 6 seconds @ 24fps

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

# Viewport render settings
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format             = 'MPEG4'
scene.render.ffmpeg.codec              = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath      = bpy.path.abspath(VIDEO_PATH)

# Place camera — looking down at a 45° angle from the front-right
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 35
cam_obj = bpy.data.objects.new("RecCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location    = (2.0, -2.0, 2.2)
cam_obj.rotation_euler = (math.radians(52), 0, math.radians(45))

# Area light from above
light_data = bpy.data.lights.new("RecLight", 'AREA')
light_data.energy  = 400
light_data.size    = 3.0
light_obj  = bpy.data.objects.new("RecLight", light_data)
bpy.context.scene.collection.objects.link(light_obj)
light_obj.location = (0, 0, 3.5)

terrain = bpy.data.objects.get("HF_Terrain")

# ── Animate Seed to show scatter regenerating (first 3 seconds)
if terrain:
    mod = terrain.modifiers.get("GN_CrystalScatter")
    if mod:
        # Seed walks 0→5 in first 3 seconds, then holds
        for frame, seed_val in [(1, 0), (48, 1), (72, 3), (96, 5)]:
            scene.frame_set(frame)
            mod["Input_3"] = seed_val
            mod.keyframe_insert(data_path='["Input_3"]', frame=frame)

# ── Camera slow orbit around terrain (full 6 seconds)
import mathutils
orbit_r = 2.8
for f in range(1, TOTAL_FRAMES + 1):
    t = (f - 1) / TOTAL_FRAMES
    angle = 2 * math.pi * t * 0.75   # 270° orbit
    cam_obj.location = mathutils.Vector((
        orbit_r * math.cos(angle),
        orbit_r * math.sin(angle),
        2.0 + 0.3 * math.sin(math.pi * t)
    ))
    # Look at scene origin
    direction = mathutils.Vector((0, 0, 0.15)) - cam_obj.location
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    cam_obj.keyframe_insert(data_path='location',       frame=f)
    cam_obj.keyframe_insert(data_path='rotation_euler', frame=f)

# Use Workbench renderer for fast viewport-quality output
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light       = 'MATCAP'
scene.display.shading.show_object_outline = True
scene.display.shading.outline_color = (0.9, 0.6, 1.0)

bpy.ops.render.render(animation=True)
print("Viewport animation written:", bpy.path.abspath(VIDEO_PATH))
