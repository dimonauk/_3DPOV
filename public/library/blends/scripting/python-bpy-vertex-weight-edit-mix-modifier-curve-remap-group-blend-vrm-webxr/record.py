"""
record.py — viewport animation render for vertex-weight-edit-mix tutorial
Outputs: public/library/videos/scripting/python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr/viewport.mp4

WHAT THIS RECORDS:
Three-phase camera orbit around the pauldron. The vertex-colour attribute
"debug_result" is driven by the evaluated cloth_result group weights:
  Phase 1 (frames  1-30):  orbital spin with 'flat' (raw proximity)  display — raw linear gradient
  Phase 2 (frames 31-60):  modifier stack flips to show S-curve remapped weights
  Phase 3 (frames 61-90):  VertexWeightMix applied — green→red shows final pin mask
The modifier enable keyframes toggle the VWEdit / VWMix modifiers so the viewer
sees the progression of each stage in a single pass.
"""

import bpy
import math
import pathlib
from mathutils import Vector, Matrix

SLUG      = "hf_vwedit_pauldron"
OUT_DIR   = pathlib.Path(
    "//public/library/videos/scripting/"
    "python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr/"
)
FPS       = 24
FRAMES    = 90        # 3.75 s total
ORBIT_R   = 1.0       # camera orbit radius
ORBIT_H   = 0.35      # camera height above origin

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps    = FPS
scene.frame_start   = 1
scene.frame_end     = FRAMES
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format  = 'MPEG4'
scene.render.ffmpeg.codec   = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.filepath = str(OUT_DIR / "viewport.mp4")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Re-run blueprint to recreate the pauldron ────────────────────────────────
# (blueprint.py must live alongside this file)
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
if here not in sys.path:
    sys.path.insert(0, here)

exec(open(os.path.join(here, "blueprint.py")).read())   # noqa: S102

ob = bpy.data.objects.get(SLUG)
if ob is None:
    raise RuntimeError("blueprint.py did not create SLUG object")

# ── Vertex-colour material for display ───────────────────────────────────────
mat = bpy.data.materials.new("vcol_display")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out_n  = nt.nodes.new("ShaderNodeOutputMaterial")
vc     = nt.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "debug_result"
emit   = nt.nodes.new("ShaderNodeEmission")
emit.inputs["Strength"].default_value = 1.0
nt.links.new(vc.outputs["Color"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out_n.inputs["Surface"])
ob.data.materials[0] = mat

# ── Modifier visibility keyframes ────────────────────────────────────────────
vwedit = ob.modifiers.get("VWEdit")
vwmix  = ob.modifiers.get("VWMix")

# Phase 1 (1-30): no modifiers active — show raw proximity gradient
if vwedit:
    vwedit.show_viewport = False
    vwedit.keyframe_insert("show_viewport", frame=1)
if vwmix:
    vwmix.show_viewport = False
    vwmix.keyframe_insert("show_viewport", frame=1)

# Phase 2 (31-60): VWEdit on, VWMix off — S-curve remapped
if vwedit:
    vwedit.show_viewport = True
    vwedit.keyframe_insert("show_viewport", frame=31)
    vwedit.keyframe_insert("show_viewport", frame=60)
if vwmix:
    vwmix.show_viewport = False
    vwmix.keyframe_insert("show_viewport", frame=31)

# Phase 3 (61-90): both on — final multiply result
if vwedit:
    vwedit.show_viewport = True
    vwedit.keyframe_insert("show_viewport", frame=61)
if vwmix:
    vwmix.show_viewport = True
    vwmix.keyframe_insert("show_viewport", frame=61)

# Set all fcurve interpolation to CONSTANT so the switch is instant per phase
for fc in ob.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'CONSTANT'

# ── Camera orbit ─────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Full 360° orbit over FRAMES frames
for f in range(1, FRAMES + 1):
    t     = (f - 1) / max(FRAMES - 1, 1)
    angle = 2 * math.pi * t
    x = ORBIT_R * math.cos(angle)
    y = ORBIT_R * math.sin(angle)
    z = ORBIT_H + 0.20 * math.sin(2 * math.pi * t)  # gentle bob
    cam_obj.location = Vector((x, y, z))
    # Always face the pauldron centre (Z=PLATE_H/2)
    target  = Vector((0, 0, 0.14))
    forward = (target - cam_obj.location).normalized()
    up      = Vector((0, 0, 1))
    right   = forward.cross(up).normalized()
    up2     = right.cross(forward).normalized()
    rot_mat = Matrix([
        [right.x,   right.y,   right.z,   0],
        [up2.x,     up2.y,     up2.z,     0],
        [-forward.x,-forward.y,-forward.z, 0],
        [0,         0,         0,         1],
    ]).to_3x3().to_euler()
    cam_obj.rotation_euler = rot_mat
    cam_obj.keyframe_insert("location", frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ── World / lighting ─────────────────────────────────────────────────────────
world = bpy.data.worlds.new("W")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.05, 0.05, 0.08, 1.0)
    bg.inputs["Strength"].default_value = 0.5
scene.world = world

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print("[holoflow] record.py done →", scene.render.filepath)
