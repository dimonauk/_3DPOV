"""
record.py — viewport-animation recording for Gray-Scott RD Poi
==============================================================
Renders a 150-frame (30 fps, 5 s) EEVEE Next sequence showing:
  Frames   1–50  : steady orbit, Basis (leopard spots)
  Frames  51–100 : morph Basis → SK_Stripes (zebra)
  Frames 101–150 : morph SK_Stripes → SK_Labyrinth, close-up pan

Output folder (create before running):
  public/library/videos/scripting/
    python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr/

Run inside Blender 5.1:
  File → Scripting workspace → Text → Open record.py → ▶ Run Script
"""
import bpy, math

# ── Output path ───────────────────────────────────────────────────────────
SLUG   = ("python-numpy-gray-scott-reaction-diffusion-turing-spots-"
          "stripes-sphere-poi-webxr")
OUTDIR = f"//../../../../videos/scripting/{SLUG}/"

sc = bpy.context.scene
sc.render.engine                         = "BLENDER_EEVEE_NEXT"
sc.render.image_settings.file_format     = "FFMPEG"
sc.render.ffmpeg.format                  = "MPEG4"
sc.render.ffmpeg.codec                   = "H264"
sc.render.ffmpeg.constant_rate_factor    = "MEDIUM"
sc.render.filepath                       = OUTDIR + "viewport"
sc.render.resolution_x                   = 1920
sc.render.resolution_y                   = 1080
sc.render.fps                            = 30
sc.frame_start                           = 1
sc.frame_end                             = 150

# ── Camera ────────────────────────────────────────────────────────────────
cam_data       = bpy.data.cameras.new("RecCam")
cam_data.lens  = 85.0
cam_ob         = bpy.data.objects.new("RecCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
sc.camera      = cam_ob

def kf_cam(frame, x, y, z, rx_deg, rz_deg=0):
    cam_ob.location       = (x, y, z)
    cam_ob.rotation_euler = (math.radians(rx_deg), 0.0, math.radians(rz_deg))
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# Start: 45° elevation oblique view  →  mid: slight pan  →  end: top-down
kf_cam( 1,   0.00, -0.32, 0.28, 50,   0)
kf_cam(50,   0.10, -0.28, 0.30, 45,  -5)
kf_cam(100,  0.00, -0.22, 0.34, 35,   8)
kf_cam(150,  0.00,  0.00, 0.38,  0,   0)

# ── Lighting ─────────────────────────────────────────────────────────────
sun_data        = bpy.data.lights.new("RecSun", type="SUN")
sun_data.energy = 3.2
sun_ob          = bpy.data.objects.new("RecSun", sun_data)
bpy.context.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (math.radians(48), 0, math.radians(110))

fill_data        = bpy.data.lights.new("RecFill", type="AREA")
fill_data.energy = 2.0
fill_data.size   = 0.6
fill_ob          = bpy.data.objects.new("RecFill", fill_data)
bpy.context.collection.objects.link(fill_ob)
fill_ob.location = (-0.28, 0.22, 0.25)

# ── Bloom (EEVEE Next) ────────────────────────────────────────────────────
sc.eevee.use_bloom       = True
sc.eevee.bloom_threshold = 0.32
sc.eevee.bloom_intensity = 0.55

# ── World background ───────────────────────────────────────────────────────
sc.world.use_nodes = True
bg = sc.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.4

# ── Shape-key animation ───────────────────────────────────────────────────
poi_ob = bpy.data.objects.get("HF_GrayScott_RD_Poi")
if poi_ob and poi_ob.data.shape_keys:
    keys = poi_ob.data.shape_keys.key_blocks

    # Zero all non-basis keys at frame 1
    for k in keys[1:]:
        k.value = 0.0
        k.keyframe_insert("value", frame=1)

    def morph(name, f0, fpeak, f1):
        k = keys.get(name)
        if not k:
            return
        k.value = 0.0;  k.keyframe_insert("value", frame=f0)
        k.value = 1.0;  k.keyframe_insert("value", frame=fpeak)
        k.value = 0.0;  k.keyframe_insert("value", frame=f1)

    # Frames 51-110: fade in zebra stripes
    morph("SK_Stripes",   1,  80, 110)
    # Frames 115-150: fade in labyrinthine pattern
    morph("SK_Labyrinth", 110, 138, 150)

# ── Render animation ──────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"✓ viewport.mp4 rendered to {OUTDIR}")
