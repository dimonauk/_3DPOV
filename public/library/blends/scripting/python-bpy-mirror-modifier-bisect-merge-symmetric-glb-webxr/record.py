"""
record.py — Viewport animation for MirrorModifier tutorial
Outputs: public/library/videos/scripting/python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr/viewport.mp4

Run this AFTER blueprint.py has written hf_clasp_buckle.blend.
Timeline (30 fps, 180 frames = 6 s):
  0 – 30   quarter-piece visible, Mirror_X and Mirror_Y at 0 % influence
  31 – 80  Mirror_X influence ramps 0 → 1 (X-mirror appears)
  81 – 130 Mirror_Y influence ramps 0 → 1 (Y-mirror completes bilateral shape)
  131 – 180 slow orbit around full buckle
"""

import bpy
import math

SLUG   = "python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr"
TOPIC  = "scripting"
OUT    = f"//../../videos/{TOPIC}/{SLUG}/viewport.mp4"
FPS    = 30
FRAMES = 180

# ---- Open .blend written by blueprint.py ----
bpy.ops.wm.open_mainfile(filepath="//hf_clasp_buckle.blend")

scn   = bpy.context.scene
obj   = bpy.data.objects["clasp"]
mod_x = obj.modifiers["Mirror_X"]
mod_y = obj.modifiers["Mirror_Y"]

scn.render.fps          = FPS
scn.frame_start         = 1
scn.frame_end           = FRAMES
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format              = 'MPEG4'
scn.render.ffmpeg.codec               = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.resolution_x               = 1280
scn.render.resolution_y               = 720
scn.render.filepath                   = OUT

# ---- Modifier influence animation via show_render toggle + custom prop ----
# MirrorModifier has no 'factor'; animate show_viewport instead for the reveal
def key_show(mod, frame, show):
    mod.show_viewport = show
    mod.keyframe_insert("show_viewport", frame=frame)

# Frame 1 — only quarter visible
scn.frame_set(1)
key_show(mod_x, 1, False)
key_show(mod_y, 1, False)

# Frame 40 — X mirror appears
scn.frame_set(40)
key_show(mod_x, 40, True)

# Frame 90 — Y mirror appears, full buckle
scn.frame_set(90)
key_show(mod_y, 90, True)

# ---- Camera orbit 100 → 180 ----
cam_data = bpy.data.cameras.new("RecordCam")
cam      = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam)
scn.camera = cam
cam_data.lens = 85

ORBIT_R = 0.30
ORBIT_Z = 0.08
for f in range(100, FRAMES + 1, 10):
    t    = (f - 100) / (FRAMES - 100)
    ang  = math.radians(t * 180)
    cam.location = (ORBIT_R * math.sin(ang), -ORBIT_R * math.cos(ang), ORBIT_Z)
    cam.rotation_euler = (
        math.radians(75),
        0.0,
        math.radians(t * 180),
    )
    cam.keyframe_insert("location",       frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

# ---- Lighting ----
bpy.ops.object.light_add(type='SUN', location=(1, -1, 2))
bpy.context.active_object.data.energy = 3.0

# ---- Render ----
bpy.ops.render.render(animation=True)
print(f"Record done → {OUT}")
