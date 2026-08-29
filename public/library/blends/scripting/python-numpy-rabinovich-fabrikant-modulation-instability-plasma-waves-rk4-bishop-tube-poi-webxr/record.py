"""
record.py — Rabinovich–Fabrikant Attractor poi light trail: viewport-animation recording
Blender 5.1 · Holoflow Studio

Output: public/library/videos/scripting/
        python-numpy-rabinovich-fabrikant-modulation-instability-plasma-waves-rk4-bishop-tube-poi-webxr/
        viewport.mp4

Duration: 10 s @ 30 fps = 300 frames
Technique: Camera orbits 300° around the poi head revealing the scroll-sheet
           topology.  Mid-sequence the shape keys morph:
           Basis (chaotic scroll) → SK_PeriodTwo (tight limit cycle) →
           SK_WeakChaos (broader mild chaos) → Basis.
Renderer: Eevee Next, bloom on — vertex-colour emission glows vividly.

Run from Blender's Scripting workspace AFTER blueprint.py (objects
hf_rf_poi and hf_rf_poi_pole must be present in the scene).
"""

import bpy, math

SLUG  = "python-numpy-rabinovich-fabrikant-modulation-instability-plasma-waves-rk4-bishop-tube-poi-webxr"
OUT   = f"//../../../../videos/scripting/{SLUG}/viewport"

FRAMES      = 300       # 10 s at 30 fps
FPS         = 30
CAM_DIST    = 0.24      # metres — poi diameter 0.12 m, so ~2× away
ELEV_START  = math.radians(50)
ELEV_END    = math.radians(20)

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAMES
scn.render.fps  = FPS
scn.render.filepath = OUT
scn.render.image_settings.file_format  = "FFMPEG"
scn.render.ffmpeg.format               = "MPEG4"
scn.render.ffmpeg.codec                = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
scn.render.resolution_x = 1920
scn.render.resolution_y = 1080

# ── Eevee Next settings ───────────────────────────────────────────────────────
scn.render.engine = "BLENDER_EEVEE_NEXT"
eevee = scn.eevee
eevee.bloom_threshold  = 0.30
eevee.bloom_intensity  = 0.22
eevee.bloom_radius     = 6.5
eevee.taa_render_samples = 16

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scn.camera = cam_obj

# ── Key frames: orbit + elevation sweep ──────────────────────────────────────
def cam_pos(frame):
    t     = (frame - 1) / max(FRAMES - 1, 1)
    angle = math.radians(30) + t * math.radians(300)   # 300° sweep
    elev  = ELEV_START + t * (ELEV_END - ELEV_START)
    x     = CAM_DIST * math.cos(elev) * math.cos(angle)
    y     = CAM_DIST * math.cos(elev) * math.sin(angle)
    z     = CAM_DIST * math.sin(elev)
    return x, y, z


for f in range(1, FRAMES + 1, 5):
    x, y, z = cam_pos(f)
    cam_obj.location = (x, y, z)
    cam_obj.keyframe_insert("location", frame=f)

# Track-to constraint so camera always looks at origin
tc = cam_obj.constraints.new("TRACK_TO")
tc.target       = bpy.data.objects.get("hf_rf_poi")
tc.track_axis   = "TRACK_NEGATIVE_Z"
tc.up_axis      = "UP_Y"

# ── Shape key animation ───────────────────────────────────────────────────────
poi = bpy.data.objects.get("hf_rf_poi")
if poi and poi.data.shape_keys:
    sk = poi.data.shape_keys.key_blocks

    def set_sk(name, val, frame):
        if name in sk:
            sk[name].value = val
            sk[name].keyframe_insert("value", frame=frame)

    # Reset all to 0 at frame 1
    for nm in ["SK_PeriodTwo", "SK_WeakChaos"]:
        set_sk(nm, 0.0, 1)

    # Frame 80-120: morph to SK_PeriodTwo
    set_sk("SK_PeriodTwo", 0.0, 70)
    set_sk("SK_PeriodTwo", 1.0, 110)

    # Frame 140-180: return + cross to SK_WeakChaos
    set_sk("SK_PeriodTwo", 0.0, 160)
    set_sk("SK_WeakChaos", 0.0, 150)
    set_sk("SK_WeakChaos", 1.0, 200)

    # Frame 240-280: return to Basis
    set_sk("SK_WeakChaos", 0.0, 265)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"record.py: rendered {FRAMES} frames → {OUT}.mp4")
