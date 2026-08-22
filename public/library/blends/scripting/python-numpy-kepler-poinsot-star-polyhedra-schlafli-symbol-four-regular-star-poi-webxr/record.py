"""
Kepler-Poinsot Star Polyhedra — Viewport Recording Script (Blender 5.1)
=======================================================================
Run AFTER blueprint.py has built the scene.  Animates a 300-frame
turntable of the Small Stellated Dodecahedron poi head, with two
intercalated close-up passes on the spike geometry.

Output: public/library/videos/scripting/
        python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr/
        viewport.mp4
"""

import bpy
import math
from mathutils import Euler
from pathlib import Path

# ── Output path ────────────────────────────────────────────────────────────────
SLUG = (
    "python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-"
    "four-regular-star-poi-webxr"
)
VIDEO_DIR = Path(__file__).parents[4] / "videos" / "scripting" / SLUG
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = str(VIDEO_DIR / "viewport.mp4")

# ── Scene / render settings ────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start  = 1
scene.frame_end    = 300
scene.render.fps   = 30
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.filepath      = OUT_PATH
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ── Find SSD object ────────────────────────────────────────────────────────────
ssd = bpy.data.objects.get("hf_ssd")
if ssd is None:
    raise RuntimeError("Run blueprint.py first — hf_ssd object not found.")

# ── Clear existing animation ───────────────────────────────────────────────────
ssd.animation_data_clear()

# ── Camera already placed by blueprint.py ─────────────────────────────────────
cam = scene.camera

# ── Keyframe helper ────────────────────────────────────────────────────────────
def key_rot(obj, frame, rz):
    scene.frame_set(frame)
    obj.rotation_euler = Euler((0, 0, math.radians(rz)), "XYZ")
    obj.keyframe_insert("rotation_euler", index=2, frame=frame)


def key_cam(cam_obj, frame, loc, rot_x_deg):
    scene.frame_set(frame)
    cam_obj.location          = loc
    cam_obj.rotation_euler    = Euler((math.radians(rot_x_deg), 0, 0), "XYZ")
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)


# ── Phase 1: Slow turntable 0°→360° (frames 1-180) ───────────────────────────
# Full revolution so the viewer sees all 12 spike tips of the SSD
key_rot(ssd,   1,   0)
key_rot(ssd, 180, 360)

# ── Phase 2: Close-up on three spike clusters (frames 180-240) ───────────────
# Camera zooms in to show facet detail
key_cam(cam, 180, (0,  -0.30,  0.12), 70)
key_cam(cam, 210, (0,  -0.14,  0.05), 78)   # zoom in tight
key_cam(cam, 240, (0,  -0.30,  0.12), 70)   # pull back

# Slow rotation continues
key_rot(ssd, 240, 540)

# ── Phase 3: Elevation sweep (frames 240-300) — see top and bottom spikes ────
key_cam(cam, 240, (0,  -0.30,  0.12), 70)
key_cam(cam, 270, (0.04, -0.22, 0.26), 85)   # tilt up to pole view
key_cam(cam, 300, (0,   -0.30,  0.12), 70)   # return to equatorial

key_rot(ssd, 300, 720)

# ── Smooth interpolation ───────────────────────────────────────────────────────
for fc in (ssd.animation_data.action.fcurves if ssd.animation_data else []):
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"
if cam.animation_data:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

# ── Add sun lamp for crisp spike shadows ──────────────────────────────────────
sun = bpy.data.lights.new("SunKP", "SUN")
sun.energy = 2.5
sun.angle  = math.radians(3)   # narrow angular diameter → sharp shadows
sun_obj = bpy.data.objects.new("SunKP", sun)
bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = Euler((math.radians(55), 0, math.radians(-30)), "XYZ")

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport.mp4 → {OUT_PATH}")
