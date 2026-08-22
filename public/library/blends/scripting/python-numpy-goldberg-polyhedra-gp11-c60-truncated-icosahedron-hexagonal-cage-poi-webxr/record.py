"""
record.py — Viewport animation for the Goldberg GP(1,1) poi head
================================================================
Produces  public/library/videos/scripting/
          python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr/
          viewport.mp4
when run inside Blender 5.1 after blueprint.py has built the scene.

Timeline (150 frames at 30 fps = 5 s):
  0 – 49   Full sphere, slow 360° turntable, both materials visible
 50 – 99   Shape-key SK_Raw ramps in (→1) → flat-face polyhedron revealed
100 – 149  Shape-key SK_Raw ramps out (→0), SK_Prolate ramps in (→1) then out → sphere again
"""

import bpy, math

# ── Scene & render settings ──────────────────────────────────────────────────────
scene            = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150
scene.render.fps  = 30

scene.render.engine               = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x         = 1280
scene.render.resolution_y         = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format        = "MPEG4"
scene.render.ffmpeg.codec         = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = (
    "//../../videos/scripting/"
    "python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr/"
    "viewport.mp4"
)

# ── Camera rig ───────────────────────────────────────────────────────────────────
CAM_DIST  = 0.28   # m from origin
CAM_ELEV  = 28.0   # degrees above equator
LENS      = 85.0   # mm — slight telephoto flattens perspective

cam_empty = bpy.data.objects.get("CamRig") or bpy.data.objects.new("CamRig", None)
if "CamRig" not in bpy.context.collection.objects:
    bpy.context.collection.objects.link(cam_empty)

if "RecordCam" not in bpy.data.cameras:
    cam_data = bpy.data.cameras.new("RecordCam")
else:
    cam_data = bpy.data.cameras["RecordCam"]
cam_data.lens = LENS

cam_obj = bpy.data.objects.get("RecordCam") or bpy.data.objects.new("RecordCam", cam_data)
if "RecordCam" not in bpy.context.collection.objects:
    bpy.context.collection.objects.link(cam_obj)

cam_obj.parent = cam_empty
cam_obj.location = (0, -CAM_DIST, CAM_DIST * math.tan(math.radians(CAM_ELEV)))
cam_obj.rotation_euler = (math.radians(90 - CAM_ELEV), 0, 0)
scene.camera = cam_obj

# ── Turntable: CamRig Z-rotation over 150 frames ────────────────────────────────
cam_empty.rotation_euler = (0, 0, 0)
cam_empty.keyframe_insert("rotation_euler", frame=1)
cam_empty.rotation_euler = (0, 0, math.radians(360))
cam_empty.keyframe_insert("rotation_euler", frame=150)

for fc in cam_empty.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Shape-key animation ───────────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_goldberg_gp11_poi")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks

    def key(sk_name, frame, value):
        if sk_name in kb:
            kb[sk_name].value = value
            kb[sk_name].keyframe_insert("value", frame=frame)

    # SK_Raw: ramps in 50→70, holds 70→100, ramps out 100→120
    key("SK_Raw", 1,   0.0)
    key("SK_Raw", 50,  0.0)
    key("SK_Raw", 70,  1.0)
    key("SK_Raw", 100, 1.0)
    key("SK_Raw", 120, 0.0)
    key("SK_Raw", 150, 0.0)

    # SK_Prolate: ramps in 120→135, out 135→150
    key("SK_Prolate", 1,   0.0)
    key("SK_Prolate", 120, 0.0)
    key("SK_Prolate", 135, 1.0)
    key("SK_Prolate", 150, 0.0)

# ── Lighting (3-point Eevee) ──────────────────────────────────────────────────────
def _lamp(name, loc, energy, col=(1,1,1)):
    ld = bpy.data.lights.get(name) or bpy.data.lights.new(name, "POINT")
    ld.energy = energy
    ld.color  = col
    lo = bpy.data.objects.get(name) or bpy.data.objects.new(name, ld)
    if name not in bpy.context.collection.objects:
        bpy.context.collection.objects.link(lo)
    lo.location = loc

_lamp("Key",   ( 0.25, -0.20,  0.30), 35.0, (1.00, 0.95, 0.90))
_lamp("Fill",  (-0.20,  0.15,  0.15), 10.0, (0.85, 0.90, 1.00))
_lamp("Rim",   ( 0.05,  0.25,  0.20),  8.0, (0.70, 0.80, 1.00))

bpy.ops.render.render(animation=True, write_still=False)
print("✓ viewport.mp4 rendered")
