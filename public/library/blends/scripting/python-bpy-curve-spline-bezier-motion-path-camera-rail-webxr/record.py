"""
record.py — Viewport animation for
  python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr
Output:
  public/library/videos/scripting/
    python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr/viewport.mp4

Shows the baked cam_fly camera travelling its oval Bezier rail around the
torus prop, recorded from a fixed elevated observer camera over one full
120-frame loop (4 s at 30 fps).

Run headlessly:
  blender --background --python record.py
  (must be run from the directory containing blueprint.py)
"""

import bpy
import math
from mathutils import Vector

OUTPUT_DIR = (
    "//../../../../videos/scripting/"
    "python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr/"
)
FPS    = 30
FRAMES = 120

# Build scene via blueprint — record.py is self-contained
exec(open(bpy.path.abspath("//blueprint.py")).read())   # noqa: S102

sc = bpy.context.scene
sc.render.engine           = 'BLENDER_EEVEE_NEXT'
sc.render.film_transparent = False
sc.render.resolution_x     = 1280
sc.render.resolution_y     = 720
sc.render.fps              = FPS
sc.frame_start             = 1
sc.frame_end               = FRAMES
sc.render.filepath         = OUTPUT_DIR
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format    = 'MPEG4'
sc.render.ffmpeg.codec     = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# Observer camera — elevated wide angle shows the flying cam_fly tracing
# the oval rail around the centred torus prop
obs_data      = bpy.data.cameras.new("ObsCam")
obs_ob        = bpy.data.objects.new("ObsCam", obs_data)
sc.collection.objects.link(obs_ob)
obs_ob.location   = Vector((7.0, -6.0, 6.0))
obs_data.lens     = 35.0         # wide enough to frame the full rail

look_dir          = Vector((0, 0.5, 0)) - obs_ob.location
obs_ob.rotation_euler = look_dir.to_track_quat('-Z', 'Y').to_euler()
sc.camera = obs_ob   # override blueprint's flying camera as render cam

# Three-point lighting rig
def area(name: str, energy: float, loc: tuple) -> None:
    ld  = bpy.data.lights.new(name, 'AREA')
    lob = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lob)
    lob.location       = Vector(loc)
    ld.energy          = energy
    ld.size            = 2.5
    d = Vector((0, 0.5, 0)) - lob.location
    lob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

area("Key",  1400, ( 5.0, -4.0,  7.0))
area("Fill",  400, (-5.0,  2.0,  3.5))
area("Rim",   700, ( 0.0,  5.5,  5.0))

bpy.ops.render.render(animation=True)
print("[holoflow] record.py complete → " + OUTPUT_DIR)
