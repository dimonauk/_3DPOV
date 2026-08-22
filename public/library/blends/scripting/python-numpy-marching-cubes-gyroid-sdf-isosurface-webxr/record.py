"""
record.py — viewport animation for Surface Nets / Gyroid tutorial
Outputs: public/library/videos/scripting/python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr/viewport.mp4

Run AFTER blueprint.py (or run standalone; it re-creates the scene first).
Duration: 120 frames @ 24 fps = 5 seconds, one full gyroid rotation.
"""

import bpy, math

# Re-run the blueprint so the scene is clean before we add a camera + lights.
import runpy, pathlib
blueprint = str(pathlib.Path(__file__).with_name("blueprint.py"))
runpy.run_path(blueprint)

# ── Camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -6.5, 2.5))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(72), 0, 0)
bpy.context.scene.camera = cam

# ── Three-point lighting ──────────────────────────────────────────────────────
for name, loc, energy in (
    ("key",  ( 5,  -4,  6), 800),
    ("fill", (-4,  -2,  3), 300),
    ("back", ( 0,   6,  4), 200),
):
    bpy.ops.object.light_add(type='AREA', location=loc)
    L = bpy.context.active_object
    L.name = f"light_{name}"
    L.data.energy = energy
    L.data.size   = 3.0

# ── Rotation animation on the gyroid object ───────────────────────────────────
obj = bpy.data.objects["hf_gyroid"]
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert(data_path="rotation_euler", frame=1)
obj.rotation_euler = (0, 0, math.radians(360))
obj.keyframe_insert(data_path="rotation_euler", frame=120)

# Linear interpolation so the spin is constant-rate
for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine             = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format      = 'MPEG4'
scene.render.ffmpeg.codec       = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x       = 1280
scene.render.resolution_y       = 720
scene.render.fps                = 24
scene.frame_start               = 1
scene.frame_end                 = 120

out_dir = pathlib.Path(__file__).parents[4] / \
    "videos/scripting/python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
out_dir.mkdir(parents=True, exist_ok=True)
scene.render.filepath = str(out_dir / "viewport")

bpy.ops.render.render(animation=True)
print("[record] viewport.mp4 written")
