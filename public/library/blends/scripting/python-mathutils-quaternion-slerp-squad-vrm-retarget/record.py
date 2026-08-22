# ============================================================
# record.py — viewport render for quaternion SLERP tutorial
# Outputs: public/library/videos/scripting/
#          python-mathutils-quaternion-slerp-squad-vrm-retarget/
#          viewport.mp4
# Blender 5.1 | Holoflow Studio | CC0
# ============================================================
# Run AFTER blueprint.py has been executed in the same session
# (arm object and actions already in bpy.data).
# Timeline: frames 1-14 show SLERP sweep, 15-30 Squad sweep.
# The viewport capture shows the spine chain rotating smoothly.
# ============================================================

import bpy, os

VIDEO_OUT = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos", "scripting",
    "python-mathutils-quaternion-slerp-squad-vrm-retarget",
    "viewport.mp4",
)
VIDEO_OUT = os.path.normpath(VIDEO_OUT)
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

sc = bpy.context.scene

# ── RENDER SETTINGS ───────────────────────────────────────────
sc.render.resolution_x    = 1280
sc.render.resolution_y    = 720
sc.render.resolution_percentage = 100
sc.render.fps             = 24
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format   = "MPEG4"
sc.render.ffmpeg.codec    = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
sc.render.filepath        = VIDEO_OUT

# ── VIEWPORT SHADING ──────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type       = "SOLID"
                space.shading.show_xray  = False
                # Show bone axes to make rotation visible
                arm_obj = bpy.data.objects.get("VRM_Spine")
                if arm_obj and arm_obj.type == "ARMATURE":
                    arm_obj.data.show_axes    = True
                    arm_obj.data.display_type = "STICK"
        break

# ── CAMERA ────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
sc.collection.objects.link(cam_obj)
sc.camera = cam_obj

from mathutils import Vector, Matrix
# Position camera to frame the spine chain (0,0,0)→(0,0,1)
cam_obj.location = Vector((2.5, -3.0, 0.5))
cam_obj.rotation_euler = (1.22, 0.0, 0.69)   # ~70° tilt, side view

# ── FRAME RANGE ───────────────────────────────────────────────
# Capture the SLERP + Squad sweeps (frames 1 → end-2 to skip blend demo)
sc.frame_start = 1
sc.frame_end   = min(sc.frame_end, 30)

# ── RENDER ────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, write_still=False)
print(f"[holoflow] viewport.mp4 → {VIDEO_OUT}")
