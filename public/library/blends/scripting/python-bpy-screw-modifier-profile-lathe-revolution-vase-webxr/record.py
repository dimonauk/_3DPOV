"""
record.py — Viewport animation for ScrewModifier lathe vase.

Run via:
  blender --background hf_lathe_vase.blend --python record.py

Output:
  public/library/videos/scripting/
    python-bpy-screw-modifier-profile-lathe-revolution-vase-webxr/
      viewport.mp4   (5 s · 30 fps · 1920×1080 · H.264)

The camera makes one full orbit around the vase, rising from base level
to above the lip, so the complete lathe profile is visible.
"""
import bpy
import math
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SLUG    = "python-bpy-screw-modifier-profile-lathe-revolution-vase-webxr"
TOPIC   = "scripting"
OUT_DIR = (
    Path(bpy.path.abspath("//")).parents[3]
    / "videos" / TOPIC / SLUG
)
OUT_DIR.mkdir(parents=True, exist_ok=True)

FPS      = 30
SECONDS  = 5
FRAMES   = FPS * SECONDS
R        = 2.8     # orbit radius (metres)
Z_START  = 0.4     # camera height at frame 1
Z_END    = 1.8     # camera height at final frame
TARGET_Z = 0.75    # look-at point height (belly of vase)

# ---------------------------------------------------------------------------
# Scene
# ---------------------------------------------------------------------------
scene             = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# ---------------------------------------------------------------------------
# Camera + orbit keyframes
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50   # 50 mm — natural perspective

cam_ob = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera = cam_ob

# Look-at target (empty at vase belly height)
target = bpy.data.objects.new("CamTarget", None)
target.location = (0.0, 0.0, TARGET_Z)
bpy.context.collection.objects.link(target)

track             = cam_ob.constraints.new('TRACK_TO')
track.target      = target
track.track_axis  = 'TRACK_NEGATIVE_Z'
track.up_axis     = 'UP_Y'

for f in range(1, FRAMES + 1):
    t     = (f - 1) / max(FRAMES - 1, 1)
    angle = math.tau * t
    cam_ob.location = (
        R * math.cos(angle),
        R * math.sin(angle),
        Z_START + (Z_END - Z_START) * t,
    )
    cam_ob.keyframe_insert("location", frame=f)

# ---------------------------------------------------------------------------
# Lighting — three-point to highlight facet planes
# ---------------------------------------------------------------------------
sun_data        = bpy.data.lights.new("Key", 'SUN')
sun_data.energy = 3.5
sun_data.angle  = math.radians(5)   # sharp shadow for facet contrast
sun_ob          = bpy.data.objects.new("Key", sun_data)
sun_ob.rotation_euler = (math.radians(55), 0, math.radians(35))
bpy.context.collection.objects.link(sun_ob)

fill_data        = bpy.data.lights.new("Fill", 'AREA')
fill_data.energy = 60.0
fill_data.size   = 2.0
fill_ob          = bpy.data.objects.new("Fill", fill_data)
fill_ob.location       = (-1.8, -1.8, 1.5)
fill_ob.rotation_euler = (math.radians(40), 0, math.radians(-135))
bpy.context.collection.objects.link(fill_ob)

rim_data        = bpy.data.lights.new("Rim", 'SPOT')
rim_data.energy = 200.0
rim_data.spot_size = math.radians(45)
rim_ob          = bpy.data.objects.new("Rim", rim_data)
rim_ob.location       = (0, 2.5, 2.5)
rim_ob.rotation_euler = (math.radians(-45), 0, 0)
bpy.context.collection.objects.link(rim_ob)

# ---------------------------------------------------------------------------
# Render settings — EEVEE Next, MP4/H.264
# ---------------------------------------------------------------------------
scene.render.engine               = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x         = 1920
scene.render.resolution_y         = 1080
scene.render.filepath             = str(OUT_DIR / "viewport_####")
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format        = 'MPEG4'
scene.render.ffmpeg.codec         = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.audio_codec   = 'NONE'

bpy.ops.render.render(animation=True)
print(f"[holoflow] Render done → {OUT_DIR}")
