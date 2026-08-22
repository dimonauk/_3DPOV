"""
Record script — 150-frame camera orbit around the Enneper surface.
Output: public/library/videos/scripting/
        python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr/viewport.mp4

Run AFTER blueprint.py with enneper_surface.blend open in Blender 5.1.
Blender renders the EEVEE Next viewport animation to an MP4 via FFmpeg.
Duration: 5 s at 30 fps.  Resolution: 1280×720.
"""

import bpy, math

OUTPUT_PATH = (
    "//../../videos/scripting"
    "/python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
    "/viewport"
)
FRAMES  = 150
RADIUS  = 7.5
HEIGHT  = 3.2

sc = bpy.context.scene

# ── render settings ───────────────────────────────────────────────────────────
sc.render.engine                        = 'BLENDER_EEVEE_NEXT'
sc.render.image_settings.file_format    = 'FFMPEG'
sc.render.ffmpeg.format                 = 'MPEG4'
sc.render.ffmpeg.codec                  = 'H264'
sc.render.ffmpeg.constant_rate_factor   = 'HIGH'
sc.render.ffmpeg.audio_codec            = 'NONE'
sc.render.filepath                      = bpy.path.abspath(OUTPUT_PATH)
sc.render.resolution_x                  = 1280
sc.render.resolution_y                  = 720
sc.render.resolution_percentage         = 100
sc.render.fps                           = 30
sc.frame_start                          = 1
sc.frame_end                            = FRAMES

# ── locate camera ─────────────────────────────────────────────────────────────
cam_ob = sc.camera
if cam_ob is None:
    raise RuntimeError("[record] no camera found — run blueprint.py first")

surface_ob = sc.objects.get("enneper_surface")
if surface_ob is None:
    raise RuntimeError("[record] enneper_surface not in scene — run blueprint.py first")

# ── keyframe orbit ────────────────────────────────────────────────────────────
# Orbit one full revolution.  The TRACK_TO constraint locks the lens at the
# origin each frame so no rotation keyframes are needed.
for f in range(1, FRAMES + 1):
    angle = 2.0 * math.pi * (f - 1) / FRAMES
    cam_ob.location = (
        RADIUS * math.cos(angle),
        RADIUS * math.sin(angle),
        HEIGHT,
    )
    cam_ob.keyframe_insert(data_path="location", frame=f)

# ── point camera at surface ───────────────────────────────────────────────────
if not any(c.type == 'TRACK_TO' for c in cam_ob.constraints):
    con             = cam_ob.constraints.new(type='TRACK_TO')
    con.target      = surface_ob
    con.track_axis  = 'TRACK_NEGATIVE_Z'
    con.up_axis     = 'UP_Y'

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[record] done — {OUTPUT_PATH}.mp4")
