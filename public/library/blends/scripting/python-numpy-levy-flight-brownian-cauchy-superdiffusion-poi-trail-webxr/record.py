# record.py — viewport animation render for Lévy Flight tutorial
# Outputs: public/library/videos/scripting/python-numpy-levy-flight-brownian-cauchy-superdiffusion-poi-trail-webxr/viewport.mp4
# Run AFTER blueprint.py has created the scene.
# Blender 5.1 · bpy direct API · no bpy.ops for scene objects

import bpy, math

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
FPS       = 24
FRAMES    = 192              # 8 s: slow orbit showing all three walks
OUT_PATH  = "//../../videos/scripting/python-numpy-levy-flight-brownian-cauchy-superdiffusion-poi-trail-webxr/viewport"

scene = bpy.context.scene
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.fps            = FPS
scene.frame_start           = 1
scene.frame_end             = FRAMES
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_bit_rate    = 8_000_000
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.filepath                    = OUT_PATH

# ── EEVEE NEXT BLOOM ──────────────────────────────────────────────────────────
eevee = scene.eevee
eevee.use_bloom             = True
eevee.bloom_threshold       = 0.6
eevee.bloom_intensity       = 0.25
eevee.bloom_radius          = 5.0
eevee.use_gtao              = True

# ── WORLD (dark background) ───────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.01, 0.01, 0.02, 1.0)
    bg.inputs["Strength"].default_value = 0.0
scene.world = world

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35.0
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Camera orbits around origin at radius 18 m, height 4 m
R, H = 18.0, 4.0

def set_cam_frame(frame, angle_deg):
    angle = math.radians(angle_deg)
    cam_obj.location = (R * math.cos(angle), R * math.sin(angle), H)
    # point at scene centre
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    dz = -cam_obj.location.z
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), -dz),
        0.0,
        math.atan2(dy, dx) + math.pi,
    )
    cam_obj.keyframe_insert("location",        frame=frame)
    cam_obj.keyframe_insert("rotation_euler",  frame=frame)

# Full 360° orbit in 192 frames
for f in range(1, FRAMES + 1):
    set_cam_frame(f, (f - 1) / FRAMES * 360.0)

# Smooth interpolation
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[holoflow] viewport.mp4 written")
