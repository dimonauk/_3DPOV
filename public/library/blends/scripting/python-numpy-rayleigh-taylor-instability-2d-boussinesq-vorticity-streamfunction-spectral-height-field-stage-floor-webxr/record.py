"""
record.py — Viewport animation for RTI stage-floor tutorial.
Runs after blueprint.py has built the RTI_Floor object.

Output: public/library/videos/scripting/
  python-numpy-rayleigh-taylor-instability-.../viewport.mp4
Duration: 240 frames @ 24 fps = 10 s
Camera: top-down orbit, WORKBENCH vertex-colour shading.
Shape-key timeline:
  F1–F60    Basis     (t=2.0 linear regime — gentle waves)
  F61–F120  SK_Fingers (t=4.5 — finger competition)
  F121–F180 SK_Mushroom (t=7.0 — fully developed mushrooms)
  F181–F240 SK_HighA  (A=0.85 — rapid high-contrast instability)
"""
import bpy, math, os

# ── OUTPUT PATH ────────────────────────────────────────────────────────────
SLUG     = ("python-numpy-rayleigh-taylor-instability-2d-boussinesq"
            "-vorticity-streamfunction-spectral-height-field-stage-floor-webxr")
OUT_DIR  = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..",
                        "videos", "scripting", SLUG)
os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.render.filepath       = os.path.join(OUT_DIR, "viewport")
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format  = 'MPEG4'
scene.render.ffmpeg.codec   = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.fps            = 24
scene.frame_start           = 1
scene.frame_end             = 240

# ── WORKBENCH SETUP ────────────────────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type         = 'SOLID'
        space.shading.color_type   = 'VERTEX'
        space.shading.light        = 'FLAT'
        space.shading.background_type = 'THEME'
        break

# ── CAMERA ────────────────────────────────────────────────────────────────
ob = bpy.data.objects.get("RTI_Floor")
if ob is None:
    raise RuntimeError("Run blueprint.py first to build RTI_Floor.")

# Floor dimensions (after +Y-up transform)
N        = 64
CELL_M   = 0.09
FLOOR_W  = N * CELL_M          # ≈ 5.76 m
CAM_DIST = FLOOR_W * 1.05      # tight overhead shot
ELEV_DEG = 42                  # slight tilt to show height relief

cam_data = bpy.data.cameras.new("RTI_Cam")
cam_data.lens = 35
cam = bpy.data.objects.new("RTI_Cam", cam_data)
bpy.context.scene.collection.objects.link(cam)
scene.camera = cam

# Animate camera: full 270° orbit
for frame in range(1, 241):
    angle = math.radians(270 * (frame-1) / 239)  # 0 → 270°
    elev  = math.radians(ELEV_DEG)
    cam.location = (
        FLOOR_W/2 + CAM_DIST * math.sin(angle) * math.cos(elev),
        FLOOR_W/2 - CAM_DIST * math.cos(angle) * math.cos(elev),
        CAM_DIST * math.sin(elev),
    )
    # Always look at floor centre
    dx = FLOOR_W/2 - cam.location[0]
    dy = FLOOR_W/2 - cam.location[1]
    dz = 0.0        - cam.location[2]
    import mathutils
    cam.rotation_euler = mathutils.Vector((dx, dy, dz)).to_track_quat(
        '-Z', 'Y').to_euler()
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

# ── SHAPE-KEY ANIMATION ────────────────────────────────────────────────────
keys = bpy.data.objects["RTI_Floor"].data.shape_keys.key_blocks
SK_SCHEDULE = {
    "Basis":       [(1, 1.0), (60, 1.0), (61, 0.0)],
    "SK_Fingers":  [(60, 0.0), (61, 1.0), (120, 1.0), (121, 0.0)],
    "SK_Mushroom": [(120, 0.0), (121, 1.0), (180, 1.0), (181, 0.0)],
    "SK_HighA":    [(180, 0.0), (181, 1.0), (240, 1.0)],
}
for key_name, kf_list in SK_SCHEDULE.items():
    if key_name not in keys:
        continue
    kb = keys[key_name]
    for frame, val in kf_list:
        kb.value = val
        kb.keyframe_insert("value", frame=frame)

# ── RENDER ─────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("record.py — viewport.mp4 written to", OUT_DIR)
