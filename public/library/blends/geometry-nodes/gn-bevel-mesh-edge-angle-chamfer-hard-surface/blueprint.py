"""
Blender 5.1  –  GN Bevel Mesh + Edge-Angle Limit
Selective hard-surface chamfer: the Bevel Mesh node bevels only edges whose
dihedral angle exceeds ANGLE_THRESHOLD, leaving shallow topology faces untouched.

Source: Blender Manual – Bevel Mesh node
        https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/bevel_mesh.html
        © Blender Foundation, CC-BY-SA 4.0
Licence: CC0
"""

import bpy
import bmesh
import math
import os

# ── constants ────────────────────────────────────────────────────────────────
BEVEL_WIDTH      = 0.018              # world-space chamfer width (metres)
ANGLE_THRESHOLD  = math.radians(25.0) # edges with dihedral < 25° stay unmodified
SEGMENTS         = 2                   # loop-cuts per bevel strip (2 = visible curve)
PROFILE          = 1.0                 # 1.0 = flat chamfer plane; 0.5 = convex bead
OUTPUT_GLB       = "//hs_control_panel.glb"

# ── 1. reset ─────────────────────────────────────────────────────────────────
# Direct bpy.data API prevents context-dependency that bpy.ops carries.
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)
for ng in list(bpy.data.node_groups):
    bpy.data.node_groups.remove(ng)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat)

scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.length_unit = 'METERS'

# ── 2. build control-panel mesh via bmesh ─────────────────────────────────────
# Hard-surface slab (2 m × 1.2 m × 0.1 m) with a recessed inner cluster.
# The 90° corners between outer walls are the target edges for the bevel.
# The ~170° face-to-face angle on flat top surfaces is < threshold → NOT bevelled.
me = bpy.data.meshes.new("control_panel")
ob = bpy.data.objects.new("control_panel", me)
scene.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

bm = bmesh.new()

# outer slab
bmesh.ops.create_box(bm, size=1.0)
for v in bm.verts:
    v.co.x *= 2.0    # 2 m wide
    v.co.y *= 1.2    # 1.2 m deep
    v.co.z *= 0.10   # 0.1 m tall

# top-face inset → raised border frame with 90° inner step (perfect bevel target)
bm.faces.ensure_lookup_table()
top = max(bm.faces, key=lambda f: f.calc_center_median().z)
bmesh.ops.inset_individual(
    bm,
    faces=[top],
    thickness=0.14,       # border frame width
    depth=-0.022,         # recess depth: negative = sink below top surface
    use_even_offset=True,
    use_relative_offset=False,
)

bm.to_mesh(me)
bm.free()
me.update()

# ── 3. material – flat Emission for WebXR ────────────────────────────────────
# Emission shading produces a constant-luminance surface in EEVEE and glTF;
# it reads consistently across WebXR runtimes without needing scene lighting.
mat = bpy.data.materials.new("panel_emit")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

out_node  = nt.nodes.new('ShaderNodeOutputMaterial')
emit_node = nt.nodes.new('ShaderNodeEmission')
emit_node.inputs['Color'].default_value    = (0.08, 0.14, 0.22, 1.0)  # midnight-slate
emit_node.inputs['Strength'].default_value = 1.5
out_node.location  = (300, 0)
emit_node.location = (0, 0)
nt.links.new(emit_node.outputs['Emission'], out_node.inputs['Surface'])
me.materials.append(mat)

# ── 4. geometry nodes modifier: Bevel Mesh + Angle Limit ─────────────────────
# WHY GN rather than the Bevel modifier?
#   The Bevel modifier runs after all GN modifiers in the stack, so downstream
#   GN nodes see un-bevelled topology. Bevel Mesh inside GN lets subsequent
#   nodes (Merge by Distance, Triangulate, etc.) receive the chamfered mesh.
#   The ANGLE limit method uses the per-edge dihedral angle as a boolean gate:
#   edges below the threshold produce zero-width bevels, i.e. stay untouched.

mod = ob.modifiers.new("BevelAngle_GN", 'NODES')
ng  = bpy.data.node_groups.new("BevelEdgeAngle", 'GeometryNodeTree')
mod.node_group = ng

iface = ng.interface

# interface sockets – Blender 5.x uses ng.interface (not legacy ng.inputs)
sock_geo_in  = iface.new_socket("Geometry",        in_out='INPUT',  socket_type='NodeSocketGeometry')
sock_amount  = iface.new_socket("Bevel Width",     in_out='INPUT',  socket_type='NodeSocketFloat')
sock_angle   = iface.new_socket("Angle Threshold", in_out='INPUT',  socket_type='NodeSocketFloat')
sock_segs    = iface.new_socket("Segments",        in_out='INPUT',  socket_type='NodeSocketInt')
sock_geo_out = iface.new_socket("Geometry",        in_out='OUTPUT', socket_type='NodeSocketGeometry')

# socket defaults and limits
sock_amount.default_value = BEVEL_WIDTH
sock_amount.min_value     = 0.0
sock_amount.max_value     = 0.5
sock_angle.default_value  = ANGLE_THRESHOLD
sock_angle.min_value      = 0.0
sock_angle.max_value      = math.pi
sock_segs.default_value   = SEGMENTS
sock_segs.min_value       = 1
sock_segs.max_value       = 8

# nodes
nodes = ng.nodes
links = ng.links

grp_in  = nodes.new('NodeGroupInput');  grp_in.location  = (-700, 0)
grp_out = nodes.new('NodeGroupOutput'); grp_out.location = ( 600, 0)

# Bevel Mesh – mode and limit_method are node PROPERTIES, not sockets.
# mode='EDGES' preserves vertex star topology; 'VERTICES' rounds vertex corners.
# limit_method='ANGLE' exposes the Angle socket. NONE bevels every edge.
bevel = nodes.new('GeometryNodeBevelMesh')
bevel.location     = (-150, 0)
bevel.mode         = 'EDGES'
bevel.limit_method = 'ANGLE'

# Set Shade Smooth – applies smooth normals to every face.
# Flat polygon faces look identical under smooth or flat shading (no curvature),
# so applying smooth globally is safe and lets the bevelled strips interpolate.
smooth = nodes.new('GeometryNodeSetShadeSmooth')
smooth.location = (150, 0)
smooth.domain   = 'FACE'

# Boolean true constant so shade_smooth input is wired (not left default)
true_node = nodes.new('FunctionNodeInputBool')
true_node.boolean  = True
true_node.location = (150, -140)

# wire geometry
links.new(grp_in.outputs['Geometry'],        bevel.inputs['Mesh'])
links.new(grp_in.outputs['Bevel Width'],     bevel.inputs['Amount'])
links.new(grp_in.outputs['Angle Threshold'], bevel.inputs['Angle'])
links.new(grp_in.outputs['Segments'],        bevel.inputs['Segments'])
links.new(bevel.outputs['Mesh'],             smooth.inputs['Geometry'])
links.new(true_node.outputs['Boolean'],      smooth.inputs['Shade Smooth'])
links.new(smooth.outputs['Geometry'],        grp_out.inputs['Geometry'])

# set modifier inputs by interface-socket identifier (stable across reloads)
mod[sock_amount.identifier] = BEVEL_WIDTH
mod[sock_angle.identifier]  = ANGLE_THRESHOLD
mod[sock_segs.identifier]   = SEGMENTS

# ── 5. camera + directional light ─────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_ob   = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob
cam_ob.location       = (2.8, -2.8, 2.0)
cam_ob.rotation_euler = (math.radians(58), 0.0, math.radians(45))

sun_data = bpy.data.lights.new("Sun", 'SUN')
sun_ob   = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun_ob)
sun_ob.location    = (4.0, 1.0, 6.0)
sun_data.energy    = 3.0

# ── 6. render settings ────────────────────────────────────────────────────────
scene.render.engine          = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.frame_start            = 1
scene.frame_end              = 60

# ── 7. export GLB ─────────────────────────────────────────────────────────────
# export_apply=True bakes all modifiers including the GN Bevel Mesh into the GLB.
# Draco level 6 gives ~60% vertex-buffer compression with imperceptible quality loss.
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    use_selection=False,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_apply=True,
    export_yup=True,
)

print(f"[blueprint] bevel width {BEVEL_WIDTH*100:.1f} cm | threshold {math.degrees(ANGLE_THRESHOLD):.1f}° | segments {SEGMENTS}")
print(f"[blueprint] exported → {OUTPUT_GLB}")
