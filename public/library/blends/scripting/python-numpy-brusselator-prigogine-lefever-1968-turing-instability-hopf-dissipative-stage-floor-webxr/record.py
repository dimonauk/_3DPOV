"""
record.py — viewport-animation recording for Brusselator Stage Floor
=====================================================================
150-frame (30 fps, 5 s) EEVEE Next sequence showing:
  Frames   1– 50  : overhead orbit, Basis (labyrinthine Turing stripes)
  Frames  51–100  : morph Basis → SK_Spots (hexagonal dot array)
  Frames 101–150  : morph SK_Spots → SK_Dense (fine dense labyrinth)

Output folder (create before running):
  public/library/videos/scripting/
    python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr/

Run inside Blender 5.1:
  File → Scripting workspace → Text → Open record.py → ▶ Run Script
"""
import bpy, math

SLUG   = ("python-numpy-brusselator-prigogine-lefever-1968-turing-instability"
          "-hopf-dissipative-stage-floor-webxr")
OUTDIR = f"//../../../../videos/scripting/{SLUG}/"

sc = bpy.context.scene
sc.render.engine                       = "BLENDER_EEVEE_NEXT"
sc.render.image_settings.file_format   = "FFMPEG"
sc.render.ffmpeg.format                = "MPEG4"
sc.render.ffmpeg.codec                 = "H264"
sc.render.ffmpeg.constant_rate_factor  = "MEDIUM"
sc.render.filepath                     = OUTDIR + "viewport"
sc.render.resolution_x                 = 1920
sc.render.resolution_y                 = 1080
sc.render.fps                          = 30
sc.frame_start                         = 1
sc.frame_end                           = 150

# ── Camera ────────────────────────────────────────────────────────────────
cam_data      = bpy.data.cameras.new("RecCam")
cam_data.lens = 85.0
cam_ob        = bpy.data.objects.new("RecCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
sc.camera     = cam_ob

def kf_cam(frame: int, x: float, y: float, z: float,
           rx_deg: float, rz_deg: float = 0.0) -> None:
    cam_ob.location       = (x, y, z)
    cam_ob.rotation_euler = (math.radians(rx_deg), 0.0, math.radians(rz_deg))
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# Gentle oblique pan across the floor, finishing closer for fine-pattern detail
kf_cam(  1, -0.06, -0.38, 0.32,  42,   0)
kf_cam( 50,  0.05, -0.32, 0.30,  36,  -8)
kf_cam(100,  0.00, -0.28, 0.34,  30,   5)
kf_cam(150,  0.00, -0.22, 0.28,  22,   0)

# ── Lighting ─────────────────────────────────────────────────────────────
sun_data        = bpy.data.lights.new("RecSun", type="SUN")
sun_data.energy = 3.0
sun_ob          = bpy.data.objects.new("RecSun", sun_data)
bpy.context.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (math.radians(50), 0.0, math.radians(115))

fill_data        = bpy.data.lights.new("RecFill", type="AREA")
fill_data.energy = 1.8
fill_data.size   = 0.60
fill_ob          = bpy.data.objects.new("RecFill", fill_data)
bpy.context.collection.objects.link(fill_ob)
fill_ob.location = (-0.25, 0.20, 0.22)

# ── Bloom ────────────────────────────────────────────────────────────────
sc.eevee.use_bloom       = True
sc.eevee.bloom_threshold = 0.30
sc.eevee.bloom_intensity = 0.55

# ── World ─────────────────────────────────────────────────────────────────
sc.world.use_nodes = True
bg = sc.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.01, 0.01, 0.03, 1.0)
    bg.inputs["Strength"].default_value = 0.35

# ── Shape-key animation ───────────────────────────────────────────────────
floor_ob = bpy.data.objects.get("Brussel_Floor")
if floor_ob and floor_ob.data.shape_keys:
    keys = floor_ob.data.shape_keys.key_blocks

    for k in keys[1:]:
        k.value = 0.0
        k.keyframe_insert("value", frame=1)

    def morph(name: str, f0: int, fpeak: int, f1: int) -> None:
        k = keys.get(name)
        if not k:
            return
        k.value = 0.0;  k.keyframe_insert("value", frame=f0)
        k.value = 1.0;  k.keyframe_insert("value", frame=fpeak)
        k.value = 0.0;  k.keyframe_insert("value", frame=f1)

    morph("SK_Spots", 1,   75, 100)   # labyrinth → hexagonal spots
    morph("SK_Dense", 100, 132, 150)  # spots → fine dense labyrinth

# ── Render ────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"✓ viewport.mp4 rendered to {OUTDIR}")
