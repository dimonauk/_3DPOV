"""
record.py  –  Viewport animation recording for holoflow:facet WorkSpaceTool
Blender 5.1  |  CC0
===================================================================
Outputs 180 PNG frames (6 s @ 30 fps) to
  public/library/videos/scripting/python-workspace-tool-custom-toolbar-facet-tag/frames/

Run the printed ffmpeg command afterwards to produce viewport.mp4.

Animation plan
--------------
  Frame   1– 40:  top-down view, checkerboard grid visible in Material Preview
  Frame  41– 80:  diagonal orbit to 45°, grid slowly rotates on Z
  Frame  81–120:  close zoom on top-left 3×3 block, tagged faces pulse orange
  Frame 121–160:  zoom out, full grid visible, slow orbit continues
  Frame 161–180:  hold on 3/4 view for freeze-frame thumbnail

The attribute is baked into the material at build time via the
ShaderNodeAttribute node — no runtime driver needed.
"""

import bpy
import math
import os

# ── constants ─────────────────────────────────────────────────
FPS        = 30
N_FRAMES   = 180
OUT_DIR    = "//../../videos/scripting/python-workspace-tool-custom-toolbar-facet-tag/frames/"
RESOLUTION = (1920, 1080)

# ── ensure demo scene is built ────────────────────────────────
if "facet_demo_grid" not in bpy.data.objects:
    # blueprint.py must have been run first
    raise RuntimeError("Run blueprint.py first to create the demo scene.")

obj = bpy.data.objects["facet_demo_grid"]


# ── camera setup ──────────────────────────────────────────────
def ensure_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_data.lens = 35.0
    bpy.context.scene.camera = cam_obj
    return cam_obj

cam = bpy.data.objects.get("RecordCam") or ensure_camera()


# ── keyframe helpers ──────────────────────────────────────────
def set_cam(frame, location, euler_xyz):
    bpy.context.scene.frame_set(frame)
    cam.location = location
    cam.rotation_euler = [math.radians(a) for a in euler_xyz]
    cam.keyframe_insert("location",        frame=frame)
    cam.keyframe_insert("rotation_euler",  frame=frame)


def set_obj_rot(frame, z_deg):
    bpy.context.scene.frame_set(frame)
    obj.rotation_euler = (0, 0, math.radians(z_deg))
    obj.keyframe_insert("rotation_euler", frame=frame)


# ── camera keyframes ──────────────────────────────────────────
# Top-down hold
set_cam(  1,  (0, 0, 4.5),   (0,  0, 0))
set_cam( 40,  (0, 0, 4.5),   (0,  0, 0))

# Orbit to 45° view
set_cam( 80,  (3.0, -3.5, 3.0), (54, 0, 45))

# Close-up on corner block
set_cam(120,  (0.6, -0.8, 1.8), (55, 0, 30))

# Zoom out + hold
set_cam(160,  (2.8, -3.2, 3.5), (52, 0, 42))
set_cam(180,  (2.8, -3.2, 3.5), (52, 0, 42))

# Grid slow spin
set_obj_rot(  1,   0)
set_obj_rot(180,  20)


# ── render settings ───────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine               = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x         = RESOLUTION[0]
scene.render.resolution_y         = RESOLUTION[1]
scene.render.resolution_percentage = 100
scene.render.fps                  = FPS
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent     = False
scene.frame_start                 = 1
scene.frame_end                   = N_FRAMES
scene.render.filepath             = OUT_DIR

# Material Preview shading for the recording: ensures colours match what
# the tutorial shows without a full Cycles bake.
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces.active.shading.type = 'MATERIAL'
        break

# ── ensure output directory ───────────────────────────────────
abs_out = bpy.path.abspath(OUT_DIR)
os.makedirs(abs_out, exist_ok=True)

# ── render ────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)

# ── ffmpeg command ────────────────────────────────────────────
print("\n[holoflow] Frames rendered. Run:")
print(f"ffmpeg -r {FPS} -i \"{abs_out}%04d.png\" "
      f"-c:v libx264 -crf 18 -pix_fmt yuv420p "
      f"-movflags +faststart viewport.mp4\n")
