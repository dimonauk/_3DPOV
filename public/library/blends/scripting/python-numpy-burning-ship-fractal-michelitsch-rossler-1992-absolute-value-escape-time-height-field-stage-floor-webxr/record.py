"""
record.py — Viewport-animation renderer for the Burning Ship fractal scene.
Run AFTER blueprint.py has created the BurningShip object.

Output: public/library/videos/scripting/
  python-numpy-burning-ship-fractal-michelitsch-rossler-1992-absolute-value-escape-time-height-field-stage-floor-webxr/
  viewport.mp4

Duration: ~10 seconds at 24 fps (240 frames).
The camera orbits overhead and the shape-key value animates from 0 → 1
across four keys to reveal each view in sequence.
"""

import bpy, math

OBJ_NAME  = "BurningShip"
OUTPUT    = (
    "//../../videos/scripting/"
    "python-numpy-burning-ship-fractal-michelitsch-rossler-1992-"
    "absolute-value-escape-time-height-field-stage-floor-webxr/"
    "viewport"
)
FPS       = 24
DURATION  = 10          # seconds
N_FRAMES  = FPS * DURATION   # 240

scene = bpy.context.scene
scene.render.fps       = FPS
scene.frame_start      = 1
scene.frame_end        = N_FRAMES
scene.render.filepath  = OUTPUT
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080

ob = bpy.data.objects.get(OBJ_NAME)
if ob is None:
    raise RuntimeError(f"Run blueprint.py first — object '{OBJ_NAME}' not found.")

# ── CAMERA ────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

# Orbit 50° overhead at radius 14 m, centred on the mesh
cx = ob.location.x + 4.2
cy = ob.location.y + 4.2

def set_cam(frame: int, angle_deg: float, height: float, radius: float) -> None:
    a = math.radians(angle_deg)
    cam_ob.location = (cx + radius * math.cos(a),
                       cy + radius * math.sin(a),
                       height)
    # Point camera at mesh centre
    dx = cx - cam_ob.location.x
    dy = cy - cam_ob.location.y
    dz = -height
    horiz = math.sqrt(dx*dx + dy*dy)
    cam_ob.rotation_euler = (math.atan2(horiz, -dz),
                              0.0,
                              math.atan2(dy, dx) + math.pi/2)
    cam_ob.keyframe_insert("location",        frame=frame)
    cam_ob.keyframe_insert("rotation_euler",  frame=frame)

set_cam(1,   30,  14, 12)
set_cam(60,  90,  12, 11)
set_cam(120, 160, 11, 10)
set_cam(180, 220, 12, 11)
set_cam(240, 270, 14, 12)

# ── SHAPE KEY ANIMATION ────────────────────────────────────────────────────
# Animate through Basis → SK_Ship → SK_Mast → SK_Julia in segments
keys = ob.data.shape_keys.key_blocks
for k in keys:
    k.value = 0.0

def key_at(frame: int, key_name: str, value: float) -> None:
    k = keys.get(key_name)
    if k:
        k.value = value
        k.keyframe_insert("value", frame=frame)

# Basis visible throughout
key_at(1, "Basis", 1.0); key_at(240, "Basis", 1.0)

# SK_Ship peaks frames 60-100
key_at(1, "SK_Ship", 0.0)
key_at(55, "SK_Ship", 0.0); key_at(75, "SK_Ship", 1.0)
key_at(100, "SK_Ship", 1.0); key_at(120, "SK_Ship", 0.0)

# SK_Mast peaks frames 120-160
key_at(115, "SK_Mast", 0.0); key_at(130, "SK_Mast", 1.0)
key_at(155, "SK_Mast", 1.0); key_at(170, "SK_Mast", 0.0)

# SK_Julia peaks frames 180-220
key_at(175, "SK_Julia", 0.0); key_at(190, "SK_Julia", 1.0)
key_at(215, "SK_Julia", 1.0); key_at(230, "SK_Julia", 0.0)

# ── LIGHTING ─────────────────────────────────────────────────────────────
if "Sun" not in bpy.data.objects:
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 20))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))

scene.eevee.use_bloom = True
scene.eevee.bloom_intensity = 0.4

# ── RENDER ────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, write_still=False)
print("Render complete →", OUTPUT)
