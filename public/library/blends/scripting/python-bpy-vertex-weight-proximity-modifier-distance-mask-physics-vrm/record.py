"""
record.py — Viewport animation render for VertexWeightProximity tutorial
Outputs: public/library/videos/scripting/
         python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm/viewport.mp4

Animation shows the body-proxy sphere pulsing (scale 0.8 → 1.2 → 0.8) while the
sash vertex-colour layer transitions from green (low weight, far) to red (high weight,
close), visualising how proximity weights respond to target motion.

Run from Blender's Script Editor after blueprint.py has already been executed.
"""

import bpy
import pathlib

TOTAL_FRAMES = 80            # ~3.3 s at 24 fps
PULSE_PEAK   = 35            # frame where sphere is largest
OUT_DIR = pathlib.Path(
    "//public/library/videos/scripting/"
    "python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm"
)

# ── Scene setup ───────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = TOTAL_FRAMES
scn.render.fps  = 24

# Resolution & format
scn.render.resolution_x        = 1280
scn.render.resolution_y        = 720
scn.render.resolution_percentage = 100
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format      = "MPEG4"
scn.render.ffmpeg.codec       = "H264"
scn.render.ffmpeg.constant_rate_factor = "HIGH"

OUT_DIR.mkdir(parents=True, exist_ok=True)
scn.render.filepath = str(OUT_DIR / "viewport.mp4")

# ── Animate body-proxy sphere scale ──────────────────────────────────────────
body = bpy.data.objects.get("HF_BodyProxy")
if body is None:
    raise RuntimeError("Run blueprint.py first — HF_BodyProxy not found.")

body.keyframe_insert("scale", frame=1)

for f, s in [(1, 0.80), (PULSE_PEAK, 1.20), (TOTAL_FRAMES, 0.80)]:
    body.scale = (s, s, s)
    body.keyframe_insert("scale", frame=f)

# Smooth interpolation on scale fcurves
for fc in body.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ── Camera: look at sash from +X side, elevated ──────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_ob = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
cam_ob.location = (1.85, -0.55, 0.35)
# Point roughly at centre of sash (x ≈ body_r, z ≈ h/2 ≈ 0.28)
from mathutils import Vector
direction = Vector((0.42, 0.0, 0.28)) - cam_ob.location
cam_ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
scn.camera = cam_ob

# ── Vertex-colour material so weights are visible in Eevee render ─────────────
sash = bpy.data.objects.get("HF_Sash")
if sash and "debug_prox" in sash.data.color_attributes:
    mat_name = "rec_vcol_mat"
    mat = bpy.data.materials.get(mat_name) or bpy.data.materials.new(mat_name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out_n  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit   = nt.nodes.new("ShaderNodeEmission")
    vcol   = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "debug_prox"
    nt.links.new(vcol.outputs["Color"],  emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out_n.inputs["Surface"])
    if sash.data.materials:
        sash.data.materials[0] = mat
    else:
        sash.data.materials.append(mat)

# ── World: plain dark background ─────────────────────────────────────────────
scn.world = bpy.data.worlds.new("RecordWorld")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.06, 0.06, 0.08, 1.0)
    bg.inputs["Strength"].default_value = 1.0

# ── Render engine: Eevee Next (Blender 5.1) ──────────────────────────────────
scn.render.engine   = "BLENDER_EEVEE_NEXT"

# ── Fire render ───────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[holoflow] record.py → {scn.render.filepath}")
