"""
record.py — Dupin Cyclide viewport animation for screen capture
Outputs: public/library/videos/scripting/
         python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr/
         viewport.mp4   (approx. 8 seconds, 30 fps = 240 frames)

Run in Blender 5.1 after blueprint.py has already been executed, so the
cyclide object and its three shape keys are present in the scene.

Sequence:
  Frame   1 – 60   Ring cyclide, camera orbit 0°→ 180°
  Frame  61 – 120  Morph ring → torus (D_RING → D_TORUS via shape key)
  Frame 121 – 180  Morph torus → horn (continue shape key drive)
  Frame 181 – 240  Morph horn → spindle + orbit completes 360°
"""

import bpy, math

OBJ_NAME = "hf_dupin_cyclide"
FPS      = 30
N_FRAMES = 240
OUT_DIR  = "//../../../../videos/scripting/" \
           "python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr/"

# ── Scene / render setup ───────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS

# Render via EEVEE (fastest for preview viewport video)
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath       = OUT_DIR + "viewport.mp4"

# ── Camera: circular orbit at 45° elevation ───────────────────────────────────
cam_data = bpy.data.cameras.new("record_cam")
cam_data.lens = 50.0
cam_obj  = bpy.data.objects.new("record_cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

ORBIT_R  = 1.4          # metres from origin; cyclide fits in ~0.8 m bbox
ELEV_DEG = 35.0         # elevation above equatorial plane
elev_rad = math.radians(ELEV_DEG)

def set_camera_orbit(frame: int) -> None:
    """Keyframe camera on full 360° orbit over N_FRAMES."""
    az = 2.0 * math.pi * (frame - 1) / N_FRAMES
    cam_obj.location = (
        ORBIT_R * math.cos(az) * math.cos(elev_rad),
        ORBIT_R * math.sin(az) * math.cos(elev_rad),
        ORBIT_R * math.sin(elev_rad),
    )
    # Point at origin
    dx, dy, dz = -cam_obj.location[:]
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz) - math.pi,
        0.0,
        math.atan2(dy, dx) + math.pi,
    )
    cam_obj.keyframe_insert("location",        frame=frame)
    cam_obj.keyframe_insert("rotation_euler",  frame=frame)

for f in range(1, N_FRAMES + 1):
    set_camera_orbit(f)

# ── Shape-key animation: ring → torus → horn → spindle ────────────────────────
obj = bpy.data.objects.get(OBJ_NAME)
if obj and obj.data.shape_keys:
    keys = obj.data.shape_keys.key_blocks

    def set_key_value(name: str, val: float, frame: int) -> None:
        if name in keys:
            keys[name].value = val
            keys[name].keyframe_insert("value", frame=frame)

    # Frame 1: pure ring cyclide (basis, no shape-key influence)
    for name in ("Torus", "Horn", "Spindle"):
        set_key_value(name, 0.0, frame=1)

    # Frame 60: begin morphing to Torus
    for name in ("Torus", "Horn", "Spindle"):
        set_key_value(name, 0.0, frame=60)

    # Frame 90: fully Torus
    set_key_value("Torus",   1.0, frame=90)
    set_key_value("Horn",    0.0, frame=90)
    set_key_value("Spindle", 0.0, frame=90)

    # Frame 150: fully Horn
    set_key_value("Torus",   0.0, frame=150)
    set_key_value("Horn",    1.0, frame=150)
    set_key_value("Spindle", 0.0, frame=150)

    # Frame 210: fully Spindle
    set_key_value("Torus",   0.0, frame=210)
    set_key_value("Horn",    0.0, frame=210)
    set_key_value("Spindle", 1.0, frame=210)

    # Frame 240: return to ring (no shape-key influence)
    for name in ("Torus", "Horn", "Spindle"):
        set_key_value(name, 0.0, frame=240)

# ── World: dark background, warm HDR ─────────────────────────────────────────
world = bpy.data.worlds.new("record_world")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.3
scene.world = world

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print("[record] viewport.mp4 written to", OUT_DIR)
