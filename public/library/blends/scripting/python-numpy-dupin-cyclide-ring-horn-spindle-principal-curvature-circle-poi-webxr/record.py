"""
record.py — Dupin Cyclide viewport render (Blender 5.1 bpy)
============================================================
Run AFTER blueprint.py in the same .blend session.
Output: public/library/videos/scripting/
        python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr/
        viewport.mp4

Animation design (180 frames @ 30 fps = 6.0 s):
  F   0–59   Orbit 360° at elevation 30° — both circle families visible.
  F  60–89   Tilt camera down to 5° (equatorial view) — waist circles read.
  F  90–119  Shape-key: Basis → SK_Wide, showing inner ring expand.
  F 120–149  Shape-key: SK_Wide → SK_Spindle, inner ring pinching to point.
  F 150–179  Tilt back to 30°, slow orbit — settle on final ring cyclide.
"""

import bpy, os, math

# ── Paths ─────────────────────────────────────────────────────────────────────
SLUG_DIR = ("python-numpy-dupin-cyclide-ring-horn-spindle"
            "-principal-curvature-circle-poi-webxr")
OUT_DIR  = os.path.join(
    os.path.dirname(bpy.data.filepath),
    f"public/library/videos/scripting/{SLUG_DIR}/")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Scene render settings ─────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps          = 30
scene.frame_start         = 0
scene.frame_end           = 179
scene.render.filepath     = os.path.join(OUT_DIR, "viewport.mp4")

# ── Camera rig ────────────────────────────────────────────────────────────────
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
rig = bpy.context.active_object
rig.name = "CyclideCameraRig"

bpy.ops.object.camera_add()
cam = bpy.context.active_object
cam.name              = "CyclideRecordCam"
cam.parent            = rig
cam.location          = (0.0, -0.30, 0.0)   # 30 cm back
cam.rotation_euler    = (math.pi/2, 0, 0)   # face origin
cam.data.lens         = 85.0
scene.camera          = cam

def key_rig_z(frame, deg):
    rig.rotation_euler[2] = math.radians(deg)
    rig.keyframe_insert("rotation_euler", index=2, frame=frame)

def key_rig_x(frame, deg):
    rig.rotation_euler[0] = math.radians(deg)
    rig.keyframe_insert("rotation_euler", index=0, frame=frame)

# Phase 1: orbit 0–59 (elevation 30°)
rig.rotation_euler[0] = math.radians(30)
key_rig_x(0, 30);  key_rig_x(59, 30)
key_rig_z(0, 0);   key_rig_z(59, 360)
for fcurve in rig.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'LINEAR'

# Phase 2: tilt to equator 60–89
key_rig_x(60, 30);  key_rig_x(89, 5)

# Phase 3 & 4 shape keys 90–149
obj = bpy.data.objects.get("hf_cyclide_poi")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    for k in kb:
        k.value = 0.0

    # SK_Wide: Basis(0)→SK_Wide(1) across 90–119
    kb["SK_Wide"].value = 0.0; kb["SK_Wide"].keyframe_insert("value", frame=90)
    kb["SK_Wide"].value = 1.0; kb["SK_Wide"].keyframe_insert("value", frame=119)

    # SK_Wide(1)→SK_Spindle(1), SK_Wide fades 120–149
    kb["SK_Wide"].value    = 0.0;  kb["SK_Wide"].keyframe_insert("value", frame=149)
    kb["SK_Spindle"].value = 0.0;  kb["SK_Spindle"].keyframe_insert("value", frame=119)
    kb["SK_Spindle"].value = 1.0;  kb["SK_Spindle"].keyframe_insert("value", frame=149)

# Phase 5: settle 150–179
key_rig_x(150, 5);  key_rig_x(179, 30)
key_rig_z(150, 0);  key_rig_z(179, 45)

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(5, -5, 8))
sun = bpy.context.active_object
sun.data.energy = 3.0
sun.data.angle  = math.radians(12)

bpy.ops.object.light_add(type='AREA', location=(-4, 3, 4))
fill = bpy.context.active_object
fill.data.energy = 60.0
fill.data.size   = 4.0

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[holoflow] record.py → ", scene.render.filepath)
