"""
record.py — Mandelbulb Power-8 viewport animation (Blender 5.1)
================================================================
Runs after blueprint.py. Renders a 150-frame EEVEE_NEXT sequence
that orbits the fractal through 300° while morphing between
Basis (power 8) → SK_Power6 → SK_Power4 → Basis.

Output: public/library/videos/scripting/
        python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr/
        viewport.mp4   (assembled from /tmp/mandelbulb_frames/)

Run in Blender's Script Editor AFTER blueprint.py has built the object.
"""

import bpy, math, os

# ── Settings ──────────────────────────────────────────────────────────────────
SLUG      = "python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr"
FRAMES    = 150
FPS       = 24
CAM_DIST  = 1.15          # metres from origin
CAM_ELEV  = 0.28          # radians above equator
ORBIT_DEG = 300           # total camera orbit
LENS      = 85            # mm focal length

# Shape-key morph schedule (frame ranges, inclusive)
# Basis → SK_Power6 → SK_Power4 → Basis
SK_SCHEDULE = [
    ('Basis',    1,   40, 0.0, 0.0),
    ('SK_Power6', 41, 80, 0.0, 1.0),
    ('SK_Power6', 81, 110, 1.0, 1.0),
    ('SK_Power6', 111, 130, 1.0, 0.0),
    ('SK_Power4', 130, 150, 0.0, 1.0),
]
OUT_DIR  = f"/tmp/mandelbulb_frames"
VIDEO_OUT = os.path.join(
    os.path.dirname(bpy.data.filepath) or os.getcwd(),
    "public", "library", "videos", "scripting", SLUG, "viewport.mp4",
)

# ── Scene setup ───────────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine          = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x    = 1920
sc.render.resolution_y    = 1080
sc.render.fps             = FPS
sc.frame_start            = 1
sc.frame_end              = FRAMES
sc.eevee.bloom_threshold  = 0.30
sc.eevee.bloom_intensity  = 0.25
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath        = OUT_DIR + "/"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = LENS
cam_ob   = bpy.data.objects.new("RecCam", cam_data)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob

for f in range(1, FRAMES + 1):
    t   = (f - 1) / (FRAMES - 1)
    ang = math.radians(ORBIT_DEG) * t
    cam_ob.location = (
        CAM_DIST * math.cos(CAM_ELEV) * math.sin(ang),
       -CAM_DIST * math.cos(CAM_ELEV) * math.cos(ang),
        CAM_DIST * math.sin(CAM_ELEV),
    )
    # Point at origin
    dx, dy, dz = -cam_ob.location
    cam_ob.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), -dz),
        0,
        math.atan2(dx, dy),
    )
    cam_ob.keyframe_insert(data_path='location',       frame=f)
    cam_ob.keyframe_insert(data_path='rotation_euler', frame=f)

# ── Shape-key keyframes ───────────────────────────────────────────────────────
ob = bpy.data.objects.get("mandelbulb_poi")
if ob and ob.data.shape_keys:
    kb = ob.data.shape_keys.key_blocks
    for sk_name, f0, f1, v0, v1 in SK_SCHEDULE:
        if sk_name in kb:
            kb[sk_name].value = v0; kb[sk_name].keyframe_insert('value', frame=f0)
            kb[sk_name].value = v1; kb[sk_name].keyframe_insert('value', frame=f1)

# ── World / lighting ──────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new('ShaderNodeBackground')
bg.inputs['Color'].default_value    = (0.02, 0.02, 0.04, 1.0)  # near-black blue
bg.inputs['Strength'].default_value = 0.5

# ── Render all frames ─────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)

# ── Assemble MP4 via ffmpeg ───────────────────────────────────────────────────
import subprocess
cmd = [
    "ffmpeg", "-y", "-r", str(FPS),
    "-i", f"{OUT_DIR}/%04d.png",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-crf", "20", VIDEO_OUT,
]
subprocess.run(cmd, check=True)
print(f"[record.py] viewport.mp4 → {VIDEO_OUT}")
