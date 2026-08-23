"""
record.py — Weaire-Phelan A15 Foam viewport render (Blender 5.1)
=================================================================
Runs blueprint.py to build the scene, then renders a 10-second
animation showing:
  0 – 59  : slow full-rotation turntable — reveals the foam cage topology
  60 – 99 : morph SK_Tight → SK_Expanded → Basis — "breathing bubbles"
 100 – 119: close fly-in showing the A-B cell boundary (amber/cobalt)
 120 – 149: pull-back to show both cell types side-by-side at 45° elevation
 150 – 179: freeze + gentle pan — institutional hold frame

Output: public/library/videos/scripting/
    python-numpy-scipy-weaire-phelan-a15-kelvin-conjecture-foam-bubble-cage-poi-webxr/
        viewport.mp4
"""

import bpy, math, pathlib

HERE = pathlib.Path(__file__).parent
exec(compile((HERE / "blueprint.py").read_text(), "blueprint.py", "exec"))

scene = bpy.context.scene
scene.render.engine                          = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x                   = 1920
scene.render.resolution_y                   = 1080
scene.render.fps                            = 30
scene.render.image_settings.file_format     = "FFMPEG"
scene.render.ffmpeg.format                  = "MPEG4"
scene.render.ffmpeg.codec                   = "H264"
scene.render.ffmpeg.constant_rate_factor    = "MEDIUM"

TOTAL_F = 180
OUT_DIR = (
    HERE.parents[4] / "videos" / "scripting"
    / "python-numpy-scipy-weaire-phelan-a15-kelvin-conjecture-foam-bubble-cage-poi-webxr"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)
scene.render.filepath   = str(OUT_DIR / "viewport.mp4")
scene.frame_start       = 1
scene.frame_end         = TOTAL_F

foam = bpy.data.objects["hf_weaire_phelan"]
sk   = foam.data.shape_keys

# ── camera ──────────────────────────────────────────────────────────────────
cam_data       = bpy.data.cameras.new("RecordCam")
cam_data.lens  = 50.0
cam            = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam)
scene.camera   = cam

target = bpy.data.objects.new("CamTarget", None)
target.location = (0.0, 0.0, 0.0)
scene.collection.objects.link(target)
track            = cam.constraints.new("TRACK_TO")
track.target     = target
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis    = "UP_Y"

def set_cam(frame: int, radius: float, az: float, el: float):
    """Place camera at spherical coordinates, insert keyframes."""
    scene.frame_set(frame)
    cam.location = (
        radius * math.cos(el) * math.sin(az),
        radius * math.cos(el) * math.cos(az),
        radius * math.sin(el),
    )
    cam.keyframe_insert("location")

R_FAR   = 0.45    # far orbit (m)
R_NEAR  = 0.20    # close fly-in (m)
EL_MID  = 0.35    # elevation ~20°
EL_HIGH = 0.60    # elevation ~35°

# Turntable  0–59
for f in range(1, 61):
    t  = (f - 1) / 59.0
    az = 2 * math.pi * t
    set_cam(f, R_FAR, az, EL_MID)

# Breathing morph  60–99  (camera holds position, shape key animates)
set_cam(60, R_FAR, math.pi * 2, EL_MID)
set_cam(99, R_FAR, math.pi * 2 + math.pi * 0.1, EL_MID)

if sk:
    def sk_kf(frame, tight_v, exp_v):
        scene.frame_set(frame)
        sk.key_blocks["SK_Tight"].value    = tight_v
        sk.key_blocks["SK_Expanded"].value = exp_v
        sk.key_blocks["SK_Tight"].keyframe_insert("value")
        sk.key_blocks["SK_Expanded"].keyframe_insert("value")

    sk_kf(60,  0.0, 0.0)
    sk_kf(72,  1.0, 0.0)   # fully contracted
    sk_kf(84,  0.0, 1.0)   # fully expanded
    sk_kf(96,  0.0, 0.0)   # back to basis
    sk_kf(99,  0.0, 0.0)

# Close fly-in  100–119
for f in range(100, 120):
    t  = (f - 100) / 19.0
    az = math.pi * 2.1 + t * 0.4
    r  = R_FAR + (R_NEAR - R_FAR) * t
    el = EL_MID + (EL_HIGH - EL_MID) * t
    set_cam(f, r, az, el)

# Pull-back 120–149
for f in range(120, 150):
    t  = (f - 120) / 29.0
    az = math.pi * 2.5 + t * 0.3
    r  = R_NEAR + (R_FAR - R_NEAR) * t
    el = EL_HIGH - (EL_HIGH - EL_MID) * t
    set_cam(f, r, az, el)

# Hold  150–179
for f in range(150, 180):
    t  = (f - 150) / 29.0
    az = math.pi * 2.8 + t * 0.15
    set_cam(f, R_FAR, az, EL_MID)

# ── lighting ────────────────────────────────────────────────────────────────
sun_data        = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 3.5
sun             = bpy.data.objects.new("Sun", sun_data)
sun.rotation_euler = (math.radians(50), 0.0, math.radians(-40))
scene.collection.objects.link(sun)

fill_data        = bpy.data.lights.new("Fill", "AREA")
fill_data.energy = 1.2
fill_data.size   = 0.5
fill             = bpy.data.objects.new("Fill", fill_data)
fill.location    = (-0.3, -0.3, 0.2)
scene.collection.objects.link(fill)

# ── world background ─────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value   = (0.04, 0.04, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.15
scene.world = world

# ── render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[record.py] Render complete →", scene.render.filepath)
