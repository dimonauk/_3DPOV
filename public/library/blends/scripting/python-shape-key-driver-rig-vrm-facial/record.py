"""
Record: Shape Key Driver Rig viewport animation
================================================
Runs AFTER blueprint.py has written face_driver_rig.blend.
Loads the .blend, positions a camera, renders a 90-frame
OpenGL animation to viewport.mp4.

Output: public/library/videos/scripting/
          python-shape-key-driver-rig-vrm-facial/viewport.mp4
"""

import bpy
import os

# ── output path ────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR  = os.path.normpath(
    os.path.join(SCRIPT_DIR,
                 "../../../../videos/scripting/"
                 "python-shape-key-driver-rig-vrm-facial"))
os.makedirs(VIDEO_DIR, exist_ok=True)
OUT_PATH   = os.path.join(VIDEO_DIR, "viewport")   # Blender appends 0001.mp4

# ── load blend ─────────────────────────────────────────────────────────────
BLEND_PATH = os.path.join(SCRIPT_DIR, "face_driver_rig.blend")
if os.path.exists(BLEND_PATH):
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)


# ── camera ─────────────────────────────────────────────────────────────────
def setup_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85          # portrait focal length: minimal distortion
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location  = (0, -4.5, 0.5)
    cam_obj.rotation_euler = (1.5708, 0, 0)  # looking toward +Y (face)
    bpy.context.scene.camera = cam_obj
    return cam_obj


# ── render settings ────────────────────────────────────────────────────────
def configure_render():
    rd = bpy.context.scene.render
    rd.resolution_x, rd.resolution_y = 1280, 720
    rd.fps             = 30
    rd.image_settings.file_format = 'FFMPEG'
    rd.ffmpeg.format        = 'MPEG4'
    rd.ffmpeg.codec         = 'H264'
    rd.ffmpeg.constant_rate_factor = 'MEDIUM'
    rd.filepath     = OUT_PATH
    rd.use_stamp    = False

    # Solid shading for viewport render — cleaner than material preview
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces[0].shading.type = 'SOLID'
            area.spaces[0].shading.color_type = 'MATERIAL'
            area.spaces[0].shading.show_shadows = True
            break


# ── frame range ─────────────────────────────────────────────────────────────
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 90

# ── run ─────────────────────────────────────────────────────────────────────
setup_camera()
configure_render()
bpy.ops.render.opengl(animation=True, sequencer=False)
print(f"[holoflow] viewport animation written to {OUT_PATH}")
