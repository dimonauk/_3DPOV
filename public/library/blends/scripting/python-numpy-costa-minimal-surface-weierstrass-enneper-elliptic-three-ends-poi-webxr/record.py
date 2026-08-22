"""
Costa Minimal Surface — Viewport Recording Script (Blender 5.1)
===============================================================
Run AFTER blueprint.py.  Produces a 10-second Workbench animation at 1280×720
that:
  • Orbits the camera 180° around the Costa surface (frames 1–120)
  • Cross-fades through the three shape keys (frames 80–240)
  • Saves to public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy, math, os

SLUG     = "python-numpy-costa-minimal-surface-weierstrass-enneper-elliptic-three-ends-poi-webxr"
OBJ_NAME = "hf_costa_surface"
FPS      = 24
FRAMES   = 240   # 10 s

OUT_DIR  = os.path.join(
    os.path.dirname(__file__),
    "../../../../videos/scripting",
    SLUG,
)
os.makedirs(OUT_DIR, exist_ok=True)

# ── Scene settings ─────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# Workbench: flat shaded, vertex colour
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light       = "FLAT"
scene.display.shading.color_type  = "VERTEX"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format       = "MPEG4"
scene.render.ffmpeg.codec        = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

# ── Camera orbit ──────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

orbit_radius = 0.40   # metres
orbit_height = 0.08

for f in range(1, FRAMES + 1):
    t   = (f - 1) / (FRAMES - 1)
    ang = math.pi * t  # 180° arc
    cam_obj.location = (
        orbit_radius * math.sin(ang),
        -orbit_radius * math.cos(ang),
        orbit_height + 0.06 * math.sin(math.pi * t),
    )
    # Point at origin
    dx = -cam_obj.location[0]
    dy = -cam_obj.location[1]
    dz = -cam_obj.location[2]
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), abs(dz)) if dz > 0 else math.pi / 2,
        0.0,
        math.atan2(dx, -dy) + math.pi,
    )
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ── Shape-key animation ───────────────────────────────────────────────────
obj = bpy.data.objects.get(OBJ_NAME)
if obj and obj.data.shape_keys:
    keys = obj.data.shape_keys.key_blocks
    names = [k.name for k in keys]

    def set_keys_at(frame, values):
        for kname, val in zip(names, values):
            keys[kname].value = val
            keys[kname].keyframe_insert("value", frame=frame)

    # Basis → Wide → Tall → Basis
    set_keys_at(1,   [1.0, 0.0, 0.0])
    set_keys_at(80,  [1.0, 0.0, 0.0])
    set_keys_at(120, [0.0, 1.0, 0.0])
    set_keys_at(160, [0.0, 1.0, 0.0])
    set_keys_at(200, [0.0, 0.0, 1.0])
    set_keys_at(240, [0.0, 0.0, 1.0])

    for kname in names:
        for fcu in (obj.data.shape_keys.animation_data.action.fcurves
                    if obj.data.shape_keys.animation_data else []):
            for kp in fcu.keyframe_points:
                kp.interpolation = "BEZIER"

# ── World (dark background) ────────────────────────────────────────────────
bpy.data.worlds["World"].node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.02, 1.0)

# ── Render ────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"✓ Video saved → {scene.render.filepath}")
