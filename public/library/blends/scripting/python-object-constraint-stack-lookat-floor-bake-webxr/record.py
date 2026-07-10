# ============================================================
# RECORD — Viewport animation: constraint bake demonstration
# Outputs: public/library/videos/scripting/
#          python-object-constraint-stack-lookat-floor-bake-webxr/viewport.mp4
# Run AFTER blueprint.py in the same Blender session.
# ============================================================

import bpy
import math
from pathlib import Path

OUTPUT_DIR  = "//../../../../public/library/videos/scripting/python-object-constraint-stack-lookat-floor-bake-webxr/"
OUTPUT_FILE = "viewport"
FRAME_START = 1
FRAME_END   = 60
FPS         = 24

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Position: elevated side angle that shows both the sphere and the circling target.
cam_obj.location = (4.5, -3.5, 3.2)
cam_obj.rotation_euler = (math.radians(58), 0, math.radians(52))

# ── EEVEE Next render preset (fast, no path-tracing) ─────────────────────────
scene.render.engine = 'BLENDER_EEVEE_NEXT'
eevee = scene.eevee
eevee.taa_render_samples = 16    # quick preview quality
if hasattr(eevee, 'use_gtao'):
    eevee.use_gtao = True

# ── Materials ─────────────────────────────────────────────────────────────────
def make_mat(name: str, base_colour: tuple, roughness: float = 0.4) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (*base_colour, 1.0)
    bsdf.inputs["Roughness"].default_value   = roughness
    return mat

mat_head   = make_mat("HF_Head",   (0.2, 0.6, 1.0))
mat_ground = make_mat("HF_Ground", (0.15, 0.15, 0.15), roughness=0.9)

for obj in bpy.data.objects:
    if "hf_head" in obj.name.lower():
        obj.data.materials.clear()
        obj.data.materials.append(mat_head)
    elif "hf_ground" in obj.name.lower():
        obj.data.materials.clear()
        obj.data.materials.append(mat_ground)

# ── Add a key light ───────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("RecordSun", type='SUN')
sun_data.energy = 3.0
sun_obj  = bpy.data.objects.new("RecordSun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0, math.radians(30))

# ── Output settings ───────────────────────────────────────────────────────────
scene.render.filepath        = bpy.path.abspath(OUTPUT_DIR + OUTPUT_FILE)
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format          = 'MPEG4'
scene.render.ffmpeg.codec           = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# ── Render animation ──────────────────────────────────────────────────────────
print(f"[holoflow] Rendering {FRAME_END - FRAME_START + 1} frames → {OUTPUT_DIR}{OUTPUT_FILE}.mp4")
bpy.ops.render.render(animation=True)
print("[holoflow] record.py complete.")
