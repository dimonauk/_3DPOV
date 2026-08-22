"""
record.py — viewport animation for Face-Tag Picker tutorial
Holoflow Studio | CC0 | 2026-07-26

Sets up a UV sphere with a pre-stamped holoflow_facet pattern, a material that
reads the attribute and colours tagged faces amber, and a slow rotation.
Run this script from the Scripting workspace; Ctrl+F12 renders viewport.mp4.
"""

import bpy
import bmesh
import math

# ── PARAMETERS ─────────────────────────────────────────────────────────────────
FRAME_START = 1
FRAME_END   = 150
FPS         = 30
OUT_PATH    = "//../../videos/scripting/python-bpy-modal-face-tag-picker-bvh-raycast-gpu-overlay/viewport.mp4"

# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene

# ── Mesh ──────────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=1.0, segments=16, ring_count=8,
    location=(0, 0, 0),
)
ob = bpy.context.active_object
ob.name = "TagDemo"

# Pre-stamp a pattern: every third face tagged
bm = bmesh.new()
bm.from_mesh(ob.data)
bm.faces.ensure_lookup_table()
layer = bm.faces.layers.int.new("holoflow_facet")
for i, face in enumerate(bm.faces):
    face[layer] = 1 if (i % 3 == 0) else 0
bm.to_mesh(ob.data)
bm.free()

# ── Material: attribute-driven colour ─────────────────────────────────────────
mat = bpy.data.materials.new("FaceTagDemo")
mat.use_nodes = True
ob.data.materials.append(mat)
nt = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new('ShaderNodeOutputMaterial')
bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
attr = nt.nodes.new('ShaderNodeAttribute')
mix  = nt.nodes.new('ShaderNodeMixRGB')

attr.attribute_name = "holoflow_facet"
attr.attribute_type = 'GEOMETRY'
mix.blend_type = 'MIX'
mix.inputs[1].default_value = (0.06, 0.06, 0.10, 1)  # dark navy base
mix.inputs[2].default_value = (1.00, 0.40, 0.08, 1)  # amber tag

nt.links.new(attr.outputs['Fac'],  mix.inputs[0])
nt.links.new(mix.outputs[0],       bsdf.inputs['Base Color'])
nt.links.new(bsdf.outputs[0],      out.inputs[0])
ob.data.materials[0] = mat

# ── Animate rotation ───────────────────────────────────────────────────────────
ob.rotation_euler = (0, 0, 0)
ob.keyframe_insert("rotation_euler", frame=FRAME_START)
ob.rotation_euler.z = math.radians(360)
ob.keyframe_insert("rotation_euler", frame=FRAME_END)
for fc in ob.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Camera ─────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(3.8, -3.2, 2.0))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(65), 0, math.radians(50))
scene.camera = cam

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(4, 4, 6))
bpy.context.active_object.data.energy = 4.0

bpy.ops.object.light_add(type='AREA', location=(-3, -2, 3))
fill = bpy.context.active_object
fill.data.energy = 60.0
fill.data.shape = 'DISK'
fill.data.size  = 4.0

# ── Render ────────────────────────────────────────────────────────────────────
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec  = 'H264'
scene.render.filepath      = OUT_PATH
scene.render.engine        = 'BLENDER_EEVEE'

# Set Material Preview in any VIEW_3D
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
