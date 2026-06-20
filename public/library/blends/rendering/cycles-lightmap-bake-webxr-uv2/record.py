"""
record.py — viewport render for cycles-lightmap-bake-webxr-uv2
Renders 120 frames (5 s @ 24 fps) of a camera orbiting the baked scene.
Run AFTER blueprint.py so packed lightmap images are present in the .blend.

Usage:
  blender --background lightmap_room.blend --python record.py
"""
import bpy, math, pathlib

HERE   = pathlib.Path(__file__).parent
FRAMES = 120
FPS    = 24
OUT    = str(
    HERE.parents[3]
    / "videos/rendering/cycles-lightmap-bake-webxr-uv2/viewport.mp4"
)

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = FRAMES
sc.render.fps  = FPS
sc.render.resolution_x = 1280
sc.render.resolution_y = 720
sc.render.image_settings.file_format      = "FFMPEG"
sc.render.ffmpeg.format                   = "MPEG4"
sc.render.ffmpeg.codec                    = "H264"
sc.render.ffmpeg.constant_rate_factor     = "MEDIUM"
sc.render.filepath = OUT

# Keep samples low for the record render — baking already happened at SAMPLES=128.
# The baked lightmaps are packed into the blend so the scene renders fast.
sc.cycles.samples = 32
sc.cycles.use_denoising = True

# Orbit around the room centre (0, 0, 1.0)
cam    = sc.camera
pivot  = (0.0, 0.0, 1.0)
origin = cam.location.copy()
radius = math.sqrt(
    (origin.x - pivot[0])**2 + (origin.y - pivot[1])**2
)

for f in range(1, FRAMES + 1):
    t     = (f - 1) / FRAMES
    angle = 2 * math.pi * t
    cam.location.x = pivot[0] + radius * math.cos(angle)
    cam.location.y = pivot[1] + radius * math.sin(angle - 0.5)
    cam.location.z = 2.8 + 0.4 * math.sin(math.pi * t)
    cam.keyframe_insert(data_path="location", frame=f)
    # Re-aim at pivot each frame
    dx = pivot[0] - cam.location.x
    dy = pivot[1] - cam.location.y
    dz = pivot[2] - cam.location.z
    cam.rotation_euler[0] = math.atan2(
        -dz, math.sqrt(dx * dx + dy * dy)
    ) + math.pi / 2
    cam.rotation_euler[2] = math.atan2(dx, -dy)
    cam.keyframe_insert(data_path="rotation_euler", frame=f)

pathlib.Path(OUT).parent.mkdir(parents=True, exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"Encoded → {OUT}")
