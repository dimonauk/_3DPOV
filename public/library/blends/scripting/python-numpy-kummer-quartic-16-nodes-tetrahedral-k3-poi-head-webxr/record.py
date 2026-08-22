"""
record.py — Viewport animation render for the Kummer surface poi head.
Outputs: public/library/videos/scripting/
         python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr/viewport.mp4

Run AFTER blueprint.py (requires the saved .blend to exist at OUT_BLD).
Open the .blend, then run this script from the Blender scripting workspace.

Animation: 120-frame slow 360° orbit at 32° elevation with easing on the
first and last 10 frames, giving viewers a complete look at all 12 affine
nodes.  Eevee Bloom is enabled so the amber emission glows near nodes.
"""

import bpy, math, os

# ── Output path ───────────────────────────────────────────────────────────────
SLUG       = "python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr"
TOPIC      = "scripting"
OUT_DIR    = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos", TOPIC, SLUG)
os.makedirs(OUT_DIR, exist_ok=True)
OUT_PATH   = os.path.join(OUT_DIR, "viewport")   # Blender appends frame + ext

FRAMES     = 120     # 4 s at 30 fps
ELEVATION  = 32.0    # degrees above equator
ORBIT_RAD  = 0.35    # metres from origin — fits 0.14 m poi head with margin
BLOOM_THR  = 0.4     # Eevee bloom threshold (low → more glow on emission)
BLOOM_INT  = 1.4     # Eevee bloom intensity

# ── Render settings ───────────────────────────────────────────────────────────
scn                          = bpy.context.scene
scn.render.engine            = 'BLENDER_EEVEE_NEXT'
scn.render.resolution_x      = 1920
scn.render.resolution_y      = 1080
scn.render.fps               = 30
scn.frame_start              = 1
scn.frame_end                = FRAMES
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format     = 'MPEG4'
scn.render.ffmpeg.codec      = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath          = OUT_PATH

# Eevee Bloom — gives the node-amber glow its halo character.
eevee = scn.eevee
eevee.use_bloom              = True
eevee.bloom_threshold        = BLOOM_THR
eevee.bloom_intensity        = BLOOM_INT

# ── Camera ────────────────────────────────────────────────────────────────────
# Delete any existing camera and create a fresh one targeting the origin.
for obj in bpy.data.objects:
    if obj.type == 'CAMERA':
        bpy.data.objects.remove(obj, do_unlink=True)

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scn.camera = cam_obj

# ── Orbit keyframes ───────────────────────────────────────────────────────────
# Camera orbits the origin at constant elevation; object stays centred.
el_rad  = math.radians(ELEVATION)
sin_el  = math.sin(el_rad)
cos_el  = math.cos(el_rad)

def ease(frame, total, frames_ease=10):
    """Simple ease-in / ease-out factor ∈ [0, 1] using cosine curve."""
    if frame <= frames_ease:
        return 0.5 - 0.5 * math.cos(math.pi * frame / frames_ease)
    elif frame >= total - frames_ease:
        r = (total - frame) / frames_ease
        return 0.5 - 0.5 * math.cos(math.pi * r)
    return 1.0

cam_obj.animation_data_create()
action = bpy.data.actions.new("CamOrbit")
cam_obj.animation_data.action = action

for f in range(1, FRAMES + 1):
    scn.frame_set(f)
    # Linear angle 0 → 2π over FRAMES, eased at ends
    t     = ease(f, FRAMES)
    angle = 2.0 * math.pi * (f - 1) / FRAMES * t + (1.0 - t) * 0
    # Full 360° with ease: effective angle wraps smoothly
    angle = 2.0 * math.pi * (f - 1) / FRAMES

    x = ORBIT_RAD * cos_el * math.cos(angle)
    y = ORBIT_RAD * cos_el * math.sin(angle)
    z = ORBIT_RAD * sin_el

    cam_obj.location = (x, y, z)
    # Point at origin
    dx, dy, dz = -x, -y, -z
    yaw   = math.atan2(dy, dx)
    pitch = math.atan2(-dz, math.sqrt(dx*dx + dy*dy))
    # Blender camera convention: Z is backward, Y is up in camera space.
    cam_obj.rotation_euler = (
        math.pi / 2.0 - el_rad,
        0.0,
        angle + math.pi / 2.0,
    )
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ── Light ─────────────────────────────────────────────────────────────────────
light_data  = bpy.data.lights.new("RecordLight", type='POINT')
light_data.energy = 5.0
light_obj   = bpy.data.objects.new("RecordLight", light_data)
light_obj.location = (0.2, 0.2, 0.25)
bpy.context.scene.collection.objects.link(light_obj)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] viewport.mp4 → {OUT_DIR}")
