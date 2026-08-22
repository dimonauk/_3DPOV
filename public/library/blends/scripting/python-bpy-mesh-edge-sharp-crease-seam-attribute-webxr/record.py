"""
record.py — Viewport Animation: Faceted Dome Edge Attribute Demo
Blender 5.1  |  Holoflow Studio  |  CC0

Renders a 150-frame Workbench turntable showing the faceted dome with
sharp-edge boundaries clearly visible as hard shading breaks.

Output: public/library/videos/scripting/
        python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr/viewport.mp4

Run: blender --background --python record.py
     (record.py calls blueprint.py internally)
"""

import bpy, math
from mathutils import Vector, Euler

SLUG      = "python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
VIDEO_OUT = f"//public/library/videos/scripting/{SLUG}/viewport.mp4"
FPS       = 30
FRAMES    = 150

# ── Build scene via blueprint ─────────────────────────────────────────────────
import os
script_dir = bpy.path.abspath("//")
bp_path    = os.path.join(script_dir, "blueprint.py")
with open(bp_path) as _f:
    exec(compile(_f.read(), bp_path, 'exec'), {"__file__": bp_path})

ob = bpy.data.objects["faceted_dome"]
scene = bpy.context.scene

# ── Timeline ──────────────────────────────────────────────────────────────────
scene.render.fps  = FPS
scene.frame_start = 1
scene.frame_end   = FRAMES

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data        = bpy.data.cameras.new("RecordCam")
cam_data.lens   = 60
cam             = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam)
scene.camera    = cam
cam.location    = Vector((0.0, -3.8, 1.6))
cam.rotation_euler = Euler((math.radians(72), 0.0, 0.0), 'XYZ')

# ── Key + fill lights ─────────────────────────────────────────────────────────
def _area(name, energy, size, loc, rot_deg):
    d = bpy.data.lights.new(name, type='AREA')
    d.energy, d.size = energy, size
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location       = Vector(loc)
    o.rotation_euler = Euler([math.radians(a) for a in rot_deg], 'XYZ')
    return o

_area("Key",  500, 2.0, ( 3.0, -2.5,  4.5), (45, 0,  50))
_area("Fill", 120, 3.0, (-3.0, -1.5,  2.5), (55, 0, -40))

# ── Turntable animation ───────────────────────────────────────────────────────
# One full Y-rotation over 150 frames with a slight X-tilt added mid-way
# to show the dome from multiple elevation angles.
ob.rotation_mode = 'XYZ'
ob.rotation_euler = Euler((0.0, 0.0, 0.0), 'XYZ')
ob.keyframe_insert("rotation_euler", frame=1)

ob.rotation_euler = Euler((math.radians(12), 0.0, math.radians(180)), 'XYZ')
ob.keyframe_insert("rotation_euler", frame=75)

ob.rotation_euler = Euler((0.0, 0.0, math.radians(360)), 'XYZ')
ob.keyframe_insert("rotation_euler", frame=FRAMES)

action = ob.animation_data.action
for fc in action.fcurves:
    for kf in fc.keyframe_points:
        kf.interpolation = 'LINEAR'

# ── Render settings ───────────────────────────────────────────────────────────
scene.render.engine           = 'BLENDER_WORKBENCH'
scene.display.shading.type    = 'SOLID'
scene.display.shading.light   = 'STUDIO'
scene.display.shading.color_type = 'MATERIAL'
# Edge angle overlay is UI-only — not available in headless render, but sharp
# edges create visible hard shading breaks in the Workbench material preview.

scene.render.image_settings.file_format   = 'FFMPEG'
scene.render.ffmpeg.format                = 'MPEG4'
scene.render.ffmpeg.codec                 = 'H264'
scene.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.filepath     = VIDEO_OUT

bpy.ops.render.render(animation=True, use_viewport=False)
print(f"[record] written → {VIDEO_OUT}")
