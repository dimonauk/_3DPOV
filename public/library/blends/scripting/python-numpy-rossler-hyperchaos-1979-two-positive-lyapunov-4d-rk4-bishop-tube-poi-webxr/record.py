"""
record.py — Rössler Hyperchaos Viewport Animation
Outputs: public/library/videos/scripting/
         python-numpy-rossler-hyperchaos-1979-two-positive-lyapunov-4d-rk4-bishop-tube-poi-webxr/
         viewport.mp4

Run AFTER blueprint.py has saved rossler_hyperchaos_poi.blend.
Duration: 240 frames @ 30 fps = 8 seconds.

Technique shown:
  Frames  1- 80 — Basis (canonical hyperchaos, d=0.05, cobalt→amber)
  Frames 60- 90 — crossfade into SK_WeakHyper (barely above threshold)
  Frames 90-140 — hold SK_WeakHyper; camera completes 180° arc
  Frames140-170 — crossfade into SK_Regular (single positive LE)
  Frames170-210 — hold SK_Regular; camera descends
  Frames210-240 — crossfade back to Basis; final orbit frame
"""

import math
import bpy

# ─── Scene ──────────────────────────────────────────────────────────────────
scene       = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 240
scene.render.fps  = 30
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.engine   = "BLENDER_EEVEE_NEXT"
scene.render.filepath = (
    "//../../videos/scripting/"
    "python-numpy-rossler-hyperchaos-1979-two-positive-lyapunov-4d-rk4-bishop-tube-poi-webxr/"
    "viewport.mp4"
)
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"

# EEVEE bloom (emphasises the emission gradient on dark background) ──────────
eevee = scene.eevee
eevee.use_bloom            = True
eevee.bloom_threshold      = 0.30
eevee.bloom_intensity      = 0.35
eevee.bloom_radius         = 4.0

# ─── Camera ─────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera = cam_ob

CAM_RADIUS = 0.38   # metres; attractor normalised to POI_RADIUS=0.12
CAM_ELEV   = 0.06   # slight upward tilt

def set_cam(frame: int, angle_deg: float, elev: float = CAM_ELEV):
    angle = math.radians(angle_deg)
    cam_ob.location = (
        CAM_RADIUS * math.cos(angle),
        CAM_RADIUS * math.sin(angle),
        elev,
    )
    cam_ob.rotation_euler = (math.pi/2 - math.atan2(elev, CAM_RADIUS),
                              0, angle + math.pi/2)
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# Slow 270° orbit with descent ───────────────────────────────────────────────
set_cam(1,   0,    CAM_ELEV)
set_cam(80,  90,   CAM_ELEV)
set_cam(140, 180,  CAM_ELEV)
set_cam(200, 240,  CAM_ELEV * 0.4)
set_cam(240, 270,  CAM_ELEV * 0.4)

# ─── Shape-key animation ───────────────────────────────────────────────────
ob = bpy.data.objects.get("Rossler_HC")
if ob and ob.data.shape_keys:
    keys = ob.data.shape_keys.key_blocks
    def sk_val(name): return keys[name] if name in keys else None

    def set_sk(frame: int, vals: dict):
        for n, v in vals.items():
            k = sk_val(n)
            if k:
                k.value = v
                k.keyframe_insert("value", frame=frame)

    # Basis (d=0.05 canonical hyperchaos) ────────────────────────────────
    set_sk(1,   {"SK_WeakHyper": 0.0, "SK_Regular": 0.0, "SK_StrongHyper": 0.0})
    set_sk(60,  {"SK_WeakHyper": 0.0, "SK_Regular": 0.0, "SK_StrongHyper": 0.0})
    # Crossfade → WeakHyper (barely hyperchaotic) ─────────────────────────
    set_sk(90,  {"SK_WeakHyper": 1.0, "SK_Regular": 0.0, "SK_StrongHyper": 0.0})
    set_sk(140, {"SK_WeakHyper": 1.0, "SK_Regular": 0.0, "SK_StrongHyper": 0.0})
    # Crossfade → Regular (single positive LE) ────────────────────────────
    set_sk(170, {"SK_WeakHyper": 0.0, "SK_Regular": 1.0, "SK_StrongHyper": 0.0})
    set_sk(210, {"SK_WeakHyper": 0.0, "SK_Regular": 1.0, "SK_StrongHyper": 0.0})
    # Return to Basis ──────────────────────────────────────────────────────
    set_sk(240, {"SK_WeakHyper": 0.0, "SK_Regular": 0.0, "SK_StrongHyper": 0.0})

# ─── World (dark background) ────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.01, 0.01, 0.02, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
scene.world = world

bpy.ops.render.render(animation=True)
print("record.py: render complete.")
