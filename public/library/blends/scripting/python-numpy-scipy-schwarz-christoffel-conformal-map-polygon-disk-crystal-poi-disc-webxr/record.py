"""
record.py — Schwarz–Christoffel Crystal Poi Disc  (Blender 5.1)
================================================================
Animates the SC crystal disc through its five polygon shape keys:

  Act 1  F001–F060  Orbit 360° — Basis (pentagon)
  Act 2  F061–F100  Morph pentagon → triangle (Poly_03)
  Act 3  F101–F140  Morph triangle → square   (Poly_04)
  Act 4  F141–F180  Morph square   → hexagon  (Poly_06)
  Act 5  F181–F240  Morph hexagon  → octagon  (Poly_08), orbit returns

Render:  Workbench, SOLID mode, vertex-colour TEXTURE, studio lighting,
         720×720 px, 30 fps → 8 s viewport.mp4

Run after blueprint.py:
    blender hf_sc_crystal_disc.blend --background --python record.py
"""

import bpy
import math

# ── Helpers ───────────────────────────────────────────────────────────────────

def set_key(obj, frame, **kw_values):
    """Insert shape-key value keyframes."""
    bpy.context.scene.frame_set(frame)
    for name, val in kw_values.items():
        obj.data.shape_keys.key_blocks[name].value = val
        obj.data.shape_keys.key_blocks[name].keyframe_insert("value", frame=frame)

def set_cam(cam_obj, frame, elevation_deg, azimuth_deg, dist=0.22):
    """Position camera on spherical arc, point at origin."""
    el = math.radians(elevation_deg)
    az = math.radians(azimuth_deg)
    cam_obj.location = (
        dist * math.cos(el) * math.sin(az),
        -dist * math.cos(el) * math.cos(az),
        dist * math.sin(el),
    )
    cam_obj.keyframe_insert("location", frame=frame)
    # rotation via track-to constraint — set once
    if not cam_obj.constraints:
        con = cam_obj.constraints.new('TRACK_TO')
        con.target   = bpy.data.objects.get("SC_CrystalDisc")
        con.track_axis  = 'TRACK_NEGATIVE_Z'
        con.up_axis     = 'UP_Y'


# ── Scene setup ───────────────────────────────────────────────────────────────

scene = bpy.context.scene
scene.frame_start  = 1
scene.frame_end    = 240
scene.render.fps   = 30

# Output
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.filepath = "//public/library/videos/scripting/" \
    "python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr/viewport.mp4"

# Workbench shading
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.display.shading.show_shadows = False

# Camera
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

disc = bpy.data.objects.get("SC_CrystalDisc")
if disc is None:
    raise RuntimeError("Run blueprint.py first — SC_CrystalDisc not found.")

sk = disc.data.shape_keys.key_blocks
KEYS = ["Basis", "Poly_03", "Poly_04", "Poly_06", "Poly_08"]

# Zero all shape keys at frame 1
bpy.context.scene.frame_set(1)
for k in KEYS:
    sk[k].value = 0.0
    sk[k].keyframe_insert("value", frame=1)
sk["Basis"].value = 1.0
sk["Basis"].keyframe_insert("value", frame=1)

# ── Act 1: 360° orbit at pentagon ────────────────────────────────────────────
for f in range(1, 61):
    az = (f / 60) * 360
    set_cam(cam_obj, f, elevation_deg=35, azimuth_deg=az)

# ── Act 2: morph pentagon → triangle  F61–F100 ────────────────────────────────
set_key(disc, 60,   Basis=1.0, Poly_03=0.0)
set_key(disc, 100,  Basis=0.0, Poly_03=1.0)
set_cam(cam_obj, 100, elevation_deg=50, azimuth_deg=100)

# ── Act 3: morph triangle → square  F101–F140 ─────────────────────────────────
set_key(disc, 101,  Poly_03=1.0, Poly_04=0.0)
set_key(disc, 140,  Poly_03=0.0, Poly_04=1.0)
set_cam(cam_obj, 140, elevation_deg=30, azimuth_deg=200)

# ── Act 4: morph square → hexagon  F141–F180 ──────────────────────────────────
set_key(disc, 141,  Poly_04=1.0, Poly_06=0.0)
set_key(disc, 180,  Poly_04=0.0, Poly_06=1.0)
set_cam(cam_obj, 180, elevation_deg=40, azimuth_deg=280)

# ── Act 5: morph hexagon → octagon + return orbit  F181–F240 ─────────────────
set_key(disc, 181,  Poly_06=1.0, Poly_08=0.0)
set_key(disc, 210,  Poly_06=0.0, Poly_08=1.0)
for f in range(210, 241):
    az = 280 + (f - 210) / 30 * 80
    set_cam(cam_obj, f, elevation_deg=35, azimuth_deg=az)

# ── Smooth camera interpolation ───────────────────────────────────────────────
if cam_obj.animation_data and cam_obj.animation_data.action:
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.easing = 'AUTO'

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, use_viewport=True)
print("[SC record] Done → viewport.mp4")
