"""
Apollonian Gasket — Record Script (Blender 5.1)
================================================
Renders a 180-frame viewport animation to:
  public/library/videos/scripting/
  python-numpy-apollonian-gasket-descartes-theorem-integer-packing-fractal-stage-floor-webxr/
  viewport.mp4

Run AFTER blueprint.py has been executed and the object exists.
Technique: overhead→oblique camera sweep + shape-key morph Basis→SK_Elevated→SK_Inverted.
"""

import bpy, math, os

# ─── Config ────────────────────────────────────────────────────────────────────
TOTAL_FRAMES = 180
FPS          = 30
CAM_DIST     = 2.20     # metres from origin
ELEV_START   = 0.50     # radians elevation at frame 1 (near-overhead)
ELEV_END     = 0.30     # radians elevation at frame 180 (more oblique)
ORBIT_DEG    = 270.0    # total azimuth sweep
VIDEO_PATH   = ("public/library/videos/scripting/"
                "python-numpy-apollonian-gasket-descartes-theorem-integer-packing-fractal-stage-floor-webxr/"
                "viewport.mp4")

# ─── Scene ────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine        = "BLENDER_EEVEE_NEXT"
scene.render.fps           = FPS
scene.frame_start          = 1
scene.frame_end            = TOTAL_FRAMES
scene.render.resolution_x  = 1920
scene.render.resolution_y  = 1080
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"

out_abs = os.path.join(bpy.path.abspath("//"), VIDEO_PATH)
os.makedirs(os.path.dirname(out_abs), exist_ok=True)
scene.render.filepath = out_abs

# Bloom (EEVEE Next: Glare node in compositor or legacy bloom properties)
try:
    scene.eevee.use_bloom          = True
    scene.eevee.bloom_threshold    = 0.30
    scene.eevee.bloom_intensity    = 0.14
except AttributeError:
    pass  # Blender 5.x uses compositor bloom; blueprint material handles glow

# ─── Camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

def set_cam(frame):
    t       = (frame - 1) / max(1, TOTAL_FRAMES - 1)
    elev    = ELEV_START + t * (ELEV_END - ELEV_START)
    azimuth = math.radians(ORBIT_DEG * t)
    x = CAM_DIST * math.cos(azimuth) * math.cos(elev)
    y = CAM_DIST * math.sin(azimuth) * math.cos(elev)
    z = CAM_DIST * math.sin(elev)
    cam_obj.location = (x, y, z)
    # Point camera toward origin
    dx, dy, dz = -x, -y, -z
    pitch  = math.atan2(-dz, math.sqrt(dx*dx + dy*dy))
    yaw    = math.atan2(dy, dx)
    cam_obj.rotation_euler = (math.pi/2 + pitch, 0, yaw + math.pi/2)

for f in range(1, TOTAL_FRAMES + 1, 10):
    scene.frame_set(f)
    set_cam(f)
    cam_obj.keyframe_insert("location", frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ─── Shape-key animation ──────────────────────────────────────────────────────
obj = bpy.data.objects.get("apollonian_gasket_floor")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    names = [k.name for k in kb]

    def sk_val(name, f):
        return kb[name].value if name in names else 0.0

    def set_sk(name, val, frame):
        if name in names:
            kb[name].value = val
            kb[name].keyframe_insert("value", frame=frame)

    # All flat at start
    for nm in names[1:]:
        set_sk(nm, 0.0, 1)

    # Frame 30-80: morph to SK_Elevated
    set_sk("SK_Elevated", 0.0, 30)
    set_sk("SK_Elevated", 1.0, 80)

    # Frame 100-130: morph to SK_Inverted
    set_sk("SK_Elevated", 1.0, 100)
    set_sk("SK_Elevated", 0.0, 130)
    set_sk("SK_Inverted", 0.0, 100)
    set_sk("SK_Inverted", 1.0, 130)

    # Frame 155-180: return to flat
    set_sk("SK_Inverted", 1.0, 155)
    set_sk("SK_Inverted", 0.0, 180)

# ─── Lighting ─────────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("RecordSun", "SUN")
sun.energy = 3.0
sun_obj = bpy.data.objects.new("RecordSun", sun)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0, math.radians(30))

# ─── Render ───────────────────────────────────────────────────────────────────
print(f"Rendering {TOTAL_FRAMES} frames → {out_abs}")
bpy.ops.render.render(animation=True)
print("record.py done.")
