"""
record.py — Enneper Surface viewport render (Blender 5.1 bpy)
=============================================================
Run this AFTER blueprint.py inside the same .blend session.
Outputs: public/library/videos/scripting/
         python-numpy-enneper-surface-.../viewport.mp4

Animation design (150 frames @ 30 fps = 5.0 s):
  F  0–59   Orbit 360° around the saddle at elevation 28°
             showing all four arms and the self-intersection.
  F 60–89   Push in to the centre; curvature gradient reads deepest cobalt.
  F 90–119  Shape-key morph: SK_Tight (0) → SK_Wide (1) → back to Basis.
  F120–149  Parameter-rotate: Basis → SK_Rotate45 and back.
"""

import bpy, os, math

# ── Scene setup ──────────────────────────────────────────────────────────────
SLUG_DIR = ("python-numpy-enneper-surface-weierstrass-representation"
            "-minimal-gauss-curvature-saddle-poi-webxr")
OUT_DIR  = os.path.join(os.path.dirname(bpy.data.filepath),
                        f"public/library/videos/scripting/{SLUG_DIR}/")
os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.render.engine          = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format   = 'MPEG4'
scene.render.ffmpeg.codec    = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.fps             = 30
scene.frame_start            = 0
scene.frame_end              = 149
scene.render.filepath        = os.path.join(OUT_DIR, "viewport.mp4")

# ── Camera rig (empty → camera child) ────────────────────────────────────────
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
rig = bpy.context.active_object
rig.name = "CameraRig"

bpy.ops.object.camera_add()
cam_obj = bpy.context.active_object
cam_obj.name  = "RecordCam"
cam_obj.parent = rig
cam_obj.location        = (0.0, -0.22, 0.0)   # 22 cm back
cam_obj.rotation_euler  = (math.pi/2, 0, 0)   # face the origin
cam_obj.data.lens       = 85.0                 # tight lens, minimal distortion

scene.camera = cam_obj

# Elevation tilt on rig (28° above equator)
rig.rotation_euler[0] = math.radians(28)

def keyframe_rig_z(frame, deg):
    rig.rotation_euler[2] = math.radians(deg)
    rig.keyframe_insert("rotation_euler", index=2, frame=frame)

def keyframe_cam_dist(frame, dist):
    cam_obj.location[1] = -dist
    cam_obj.keyframe_insert("location", index=1, frame=frame)

# ── Phase 1: orbit 0–59 ──────────────────────────────────────────────────────
keyframe_rig_z(0, 0)
keyframe_rig_z(59, 360)

# Set interpolation to linear for smooth spin
for fcurve in rig.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Phase 2: push in 60–89 ───────────────────────────────────────────────────
keyframe_cam_dist(60, 0.22)
keyframe_cam_dist(89, 0.10)

# ── Phase 3: shape key Basis→SK_Tight→SK_Wide 90–119 ────────────────────────
obj = bpy.data.objects.get("enneper_poi")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    # Reset all to 0
    for k in kb:
        k.value = 0.0
    # Tight in at frame 105, out at 119
    kb["SK_Tight"].value = 0.0; kb["SK_Tight"].keyframe_insert("value", frame=90)
    kb["SK_Tight"].value = 1.0; kb["SK_Tight"].keyframe_insert("value", frame=105)
    kb["SK_Tight"].value = 0.0; kb["SK_Tight"].keyframe_insert("value", frame=119)
    # Wide out at frame 112
    kb["SK_Wide"].value = 0.0;  kb["SK_Wide"].keyframe_insert("value", frame=90)
    kb["SK_Wide"].value = 1.0;  kb["SK_Wide"].keyframe_insert("value", frame=119)
    kb["SK_Wide"].value = 0.0;  kb["SK_Wide"].keyframe_insert("value", frame=129)

    # ── Phase 4: rotate saddle 120–149 ──────────────────────────────────────
    kb["SK_Rotate45"].value = 0.0; kb["SK_Rotate45"].keyframe_insert("value", frame=120)
    kb["SK_Rotate45"].value = 1.0; kb["SK_Rotate45"].keyframe_insert("value", frame=134)
    kb["SK_Rotate45"].value = 0.0; kb["SK_Rotate45"].keyframe_insert("value", frame=149)

# ── Lighting ─────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
sun = bpy.context.active_object
sun.data.energy = 4.0
sun.data.angle  = math.radians(10)

bpy.ops.object.light_add(type='AREA', location=(-3, 2, 3))
fill = bpy.context.active_object
fill.data.energy = 80.0
fill.data.size   = 3.0

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[holoflow] record.py render complete →", scene.render.filepath)
