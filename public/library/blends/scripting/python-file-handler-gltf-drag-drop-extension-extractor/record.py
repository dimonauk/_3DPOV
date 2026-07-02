"""
record.py — viewport animation for:
  Python bpy.types.FileHandler — GLB Drag-Drop Extension Extractor

WHAT THIS RENDERS
─────────────────
Frame 0–10   : empty viewport with a large arrow annotation sweeping down onto
               the 3D Viewport (mimics dragging a file from the OS).
Frame 11–40  : a placeholder mesh (Suzanne) appears, representing the freshly
               imported GLB.  A text object showing 'hf:facet = True' fades in
               above the object (custom property applied by the addon).
Frame 41–60  : camera orbits 45 ° around the object.

OUTPUT
──────
  public/library/videos/scripting/
    python-file-handler-gltf-drag-drop-extension-extractor/viewport.mp4

RUN (local machine with Blender 5.1 on PATH)
─────────────────────────────────────────────
  blender --background --python record.py
"""

import bpy
import math
from mathutils import Vector, Euler

OUTPUT = "//../../videos/scripting/python-file-handler-gltf-drag-drop-extension-extractor/viewport.mp4"
TOTAL_FRAMES = 60
FPS          = 24

# ── scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath     = OUTPUT

# ── world background: dark studio ─────────────────────────────────────────────
world = bpy.data.worlds.new("StudioWorld")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.04, 0.04, 0.06, 1.0)
scene.world = world

# ── light ─────────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(4, -4, 8))
sun = bpy.context.active_object
sun.data.energy = 3.0
sun.rotation_euler = Euler((math.radians(45), 0, math.radians(30)))

# ── camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -6, 2))
cam = bpy.context.active_object
cam.data.lens = 35
scene.camera = cam
cam.rotation_euler = Euler((math.radians(75), 0, 0))

# ── imported object: Suzanne as stand-in GLB mesh ─────────────────────────────
bpy.ops.mesh.primitive_monkey_add(size=1.6, location=(0, 0, 0))
monkey = bpy.context.active_object
monkey.name = "holoflow_prop"

mat = bpy.data.materials.new("HF_Toon")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.12, 0.55, 0.9, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.8
bsdf.inputs["Metallic"].default_value   = 0.0
monkey.data.materials.append(mat)

# Hidden at frame 1, visible from frame 11 (simulates import completing)
monkey.hide_viewport = True
monkey.hide_render   = True
monkey.keyframe_insert("hide_viewport", frame=1)
monkey.keyframe_insert("hide_render",   frame=1)
monkey.hide_viewport = False
monkey.hide_render   = False
monkey.keyframe_insert("hide_viewport", frame=11)
monkey.keyframe_insert("hide_render",   frame=11)

# ── custom-property label (3-D text object) ────────────────────────────────────
bpy.ops.object.text_add(location=(0, 0, 1.4))
txt_obj = bpy.context.active_object
txt_obj.data.body  = "hf:facet = True"
txt_obj.data.size  = 0.18
txt_obj.data.align_x = "CENTER"

txt_mat = bpy.data.materials.new("HF_TextMat")
txt_mat.use_nodes = True
txt_emit = txt_mat.node_tree.nodes.new("ShaderNodeEmission")
txt_emit.inputs["Color"].default_value    = (0.95, 0.95, 0.3, 1.0)
txt_emit.inputs["Strength"].default_value = 2.5
txt_out = txt_mat.node_tree.nodes["Material Output"]
txt_mat.node_tree.links.new(txt_emit.outputs["Emission"], txt_out.inputs["Surface"])
txt_obj.data.materials.append(txt_mat)

# Fade in: scale from 0 at frame 11 to full at frame 30
txt_obj.scale = (0, 0, 0)
txt_obj.keyframe_insert("scale", frame=11)
txt_obj.scale = (1, 1, 1)
txt_obj.keyframe_insert("scale", frame=30)

# ── camera orbit (frames 41–60) ───────────────────────────────────────────────
# Reparent camera to an empty at origin, animate the empty's Z rotation
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
pivot = bpy.context.active_object
pivot.name = "CamPivot"
cam.parent = pivot
cam.parent_type = "OBJECT"

pivot.rotation_euler.z = 0
pivot.keyframe_insert("rotation_euler", frame=41)
pivot.rotation_euler.z = math.radians(45)
pivot.keyframe_insert("rotation_euler", frame=60)

# ── interpolation: smooth all fcurves ─────────────────────────────────────────
for obj in [monkey, txt_obj, pivot]:
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
