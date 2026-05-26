#!/usr/bin/env python3
"""
blueprint.py — GN Raycast Shadow Mask for Cel Shading
Blender 5.1 | CC0 | Holoflow Studio

Technique: the Raycast node casts one ray per vertex in a configurable world
direction, testing intersection against an external "blocker" object. The Is Hit
boolean output is true when the blocker intercepts the ray — equivalently, when
a virtual light at the ray's far end cannot see that vertex. Negating the boolean
yields a shadow_mask: 1.0 on fully lit surfaces, 0.0 wherever the occluder
casts a shadow.

This blueprint places a 1.2 m radius IcoSphere 2.5 m above a 15×15 ground grid.
Rays fire straight up (+Z, "sun directly overhead"). Vertices below the sphere's
footprint receive Is Hit = True → shadow_mask = 0.0; those outside receive
Is Hit = False → shadow_mask = 1.0. A two-tone Emission material reads
shadow_mask via a Named Attribute node and mixes a warm sunlit colour with a
cool blue-grey shadow — classic cel-shading without a single lamp in the scene.

Why Raycast instead of EEVEE shadow maps for stylised work:
  - shadow_mask bakes into vertex attributes → survives GLB export
  - Deterministic at export time; no runtime rendering budget
  - WebXR headsets read _SHADOW_MASK from the glTF vertex buffer and drive
    a custom ShaderMaterial without any light-sampling overhead

Geometry pipe: GroupInput → StoreNamedAttribute → SetShadeSmooth → GroupOutput
Field nodes:   ObjectInfo → Raycast → Switch → StoreNamedAttribute.Value

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
from mathutils import Vector
from pathlib import Path

# ============================================================
# Parameters — edit here, nowhere else
# ============================================================
SLUG         = "gn-raycast-shadow-mask"
TOPIC        = "geometry-nodes"
MESH_NAME    = "raycast_shadow_grid"
BLOCKER_NAME = "shadow_blocker"
ATTR_NAME    = "shadow_mask"

HERE      = Path(__file__).parent
BLEND_OUT = HERE / f"{MESH_NAME}.blend"
GLB_OUT   = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)

GRID_SIZE      = 4.0    # full span X and Y (±2 m from origin)
GRID_DIVS      = 15     # edge divisions → 16×16 vertices, 225 quads
BLOCKER_RADIUS = 1.2    # m — IcoSphere occluder radius
BLOCKER_HEIGHT = 2.5    # m — centre height above grid (Z)
BLOCKER_SUBDIV = 3      # IcoSphere subdivisions (shape stays convex)

RAY_DIR_VEC  = (0.0, 0.0, 1.0)   # straight upward — sun directly overhead
RAY_LENGTH   = 6.0                # m; must exceed BLOCKER_HEIGHT + BLOCKER_RADIUS

LIT_COLOUR    = (1.00, 0.88, 0.65, 1.0)   # warm sunlit amber (linear RGBA)
SHADOW_COLOUR = (0.12, 0.18, 0.32, 1.0)   # cool blue-grey shadow (linear RGBA)
EMIT_STRENGTH = 1.6                        # Emission strength — bright for WebXR

# ============================================================
# Scene reset
# ============================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ============================================================
# Blocker IcoSphere — the shadow caster
# An IcoSphere (not a UV sphere) avoids poles and produces
# a rounder shadow footprint at low subdivision counts.
# ============================================================
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=BLOCKER_SUBDIV,
    radius=BLOCKER_RADIUS,
    location=(0.0, 0.0, BLOCKER_HEIGHT),
)
blocker_obj = bpy.context.active_object
blocker_obj.name = BLOCKER_NAME
blocker_obj.display_type = 'WIRE'   # invisible in render, visible in viewport

# ============================================================
# Ground grid mesh — built with bmesh for precise control
# A flat XY grid; each vertex has a unique world position so
# the Raycast Is Hit varies per vertex.
# ============================================================
bm = bmesh.new()
half = GRID_SIZE / 2.0
step = GRID_SIZE / GRID_DIVS
verts = {}
for i in range(GRID_DIVS + 1):
    for j in range(GRID_DIVS + 1):
        x = -half + i * step
        y = -half + j * step
        verts[(i, j)] = bm.verts.new(Vector((x, y, 0.0)))

for i in range(GRID_DIVS):
    for j in range(GRID_DIVS):
        bm.faces.new([
            verts[(i,   j)],
            verts[(i+1, j)],
            verts[(i+1, j+1)],
            verts[(i,   j+1)],
        ])

grid_mesh = bpy.data.meshes.new(f"{MESH_NAME}_base")
bm.to_mesh(grid_mesh)
bm.free()

grid_obj = bpy.data.objects.new(MESH_NAME, grid_mesh)
scene.collection.objects.link(grid_obj)

# ============================================================
# GN tree — Raycast shadow mask
# ============================================================
gn = bpy.data.node_groups.new("RaycastShadowMaskGN", "GeometryNodeTree")

gn.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
gn.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

gi = gn.nodes.new("NodeGroupInput")
go = gn.nodes.new("NodeGroupOutput")
gi.location = (-700, 0)
go.location  = (500, 0)

# --  ObjectInfo: bring blocker geometry into modifier-object local space.
#     transform_space='RELATIVE' is mandatory — 'ORIGINAL' ignores the
#     blocker's world translation and the Raycast sees it at (0,0,0).
n_obj = gn.nodes.new("GeometryNodeObjectInfo")
n_obj.transform_space = 'RELATIVE'
n_obj.inputs[0].default_value = blocker_obj
n_obj.inputs[1].default_value = False   # As Instance=False → real geometry
n_obj.location = (-400, -200)

# -- CombineXYZ: sun direction vector (world-space +Z = straight overhead)
n_xyz = gn.nodes.new("ShaderNodeCombineXYZ")
n_xyz.inputs[0].default_value = RAY_DIR_VEC[0]
n_xyz.inputs[1].default_value = RAY_DIR_VEC[1]
n_xyz.inputs[2].default_value = RAY_DIR_VEC[2]
n_xyz.location = (-400, -350)

# -- Raycast: cast one ray per vertex toward the sun.
#    Source Position left unconnected → auto-uses POINT domain position.
#    Is Hit = True when the ray intersects the blocker sphere.
n_ray = gn.nodes.new("GeometryNodeRaycast")
n_ray.data_type = 'FLOAT'   # attribute type doesn't matter; we only use Is Hit
n_ray.inputs[0].default_value = None  # Target Geometry — linked below
n_ray.inputs[4].default_value = RAY_LENGTH
n_ray.location = (-200, -250)

# -- Switch: convert Is Hit (bool) → shadow_mask (float).
#    False path (no hit) → 1.0 (lit).
#    True path (hit) → 0.0 (shadowed).
#    We negate here so the shader can simply mix A=shadow/B=lit via the mask.
n_sw = gn.nodes.new("GeometryNodeSwitch")
n_sw.input_type = 'FLOAT'
n_sw.inputs[1].default_value = 1.0   # False → lit
n_sw.inputs[2].default_value = 0.0   # True  → shadowed
n_sw.location = (0, -250)

# -- StoreNamedAttribute: write shadow_mask to POINT domain.
#    After export_apply=True the attribute lands in the GLB vertex buffer
#    as _SHADOW_MASK (glTF custom attribute underscore prefix).
n_store = gn.nodes.new("GeometryNodeStoreNamedAttribute")
n_store.data_type = 'FLOAT'
n_store.domain    = 'POINT'
n_store.inputs[2].default_value = ATTR_NAME
n_store.location = (150, 0)

# -- SetShadeSmooth: flat shading for cel look.
#    shade_smooth=False on FACE domain = Mark Sharp on every face.
n_flat = gn.nodes.new("GeometryNodeSetShadeSmooth")
n_flat.domain = 'FACE'
n_flat.inputs[2].default_value = False
n_flat.location = (350, 0)

# -- Links
lk = gn.links.new
lk(n_obj.outputs['Geometry'], n_ray.inputs[0])    # blocker → target
lk(n_xyz.outputs['Vector'],   n_ray.inputs[3])    # sun direction
lk(n_ray.outputs[0],          n_sw.inputs[0])     # Is Hit → Switch bool
lk(n_sw.outputs[0],           n_store.inputs[3])  # shadow_mask float → Value
lk(gi.outputs[0],             n_store.inputs[0])  # Geometry pipe in
lk(n_store.outputs[0],        n_flat.inputs[0])   # → SetShadeSmooth
lk(n_flat.outputs[0],         go.inputs[0])       # → output

# Add modifier to grid object
mod = grid_obj.modifiers.new("RaycastShadowMask", "NODES")
mod.node_group = gn

# ============================================================
# Cel-shader material — two-tone Emission driven by shadow_mask
# ============================================================
mat = bpy.data.materials.new("CelShadowMaskMat")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

n_attr = nt.nodes.new("ShaderNodeAttribute")
n_attr.attribute_type = 'GEOMETRY'
n_attr.attribute_name = ATTR_NAME   # "shadow_mask"
n_attr.location = (-400, 0)

# ShaderNodeMix data_type='RGBA': Factor 0→A (shadow), 1→B (lit)
n_mix = nt.nodes.new("ShaderNodeMix")
n_mix.data_type  = 'RGBA'
n_mix.blend_type = 'MIX'
n_mix.inputs[6].default_value = SHADOW_COLOUR
n_mix.inputs[7].default_value = LIT_COLOUR
n_mix.location = (-200, 0)

n_emit = nt.nodes.new("ShaderNodeEmission")
n_emit.inputs[1].default_value = EMIT_STRENGTH
n_emit.location = (0, 0)

n_out = nt.nodes.new("ShaderNodeOutputMaterial")
n_out.location = (200, 0)

ml = nt.links.new
ml(n_attr.outputs['Fac'],      n_mix.inputs[0])    # shadow_mask → Factor
ml(n_mix.outputs[2],           n_emit.inputs[0])   # colour → Emission
ml(n_emit.outputs['Emission'], n_out.inputs[0])    # → Surface

grid_obj.data.materials.append(mat)

# ============================================================
# Camera (top-down, slightly tilted for depth read)
# ============================================================
cam_data = bpy.data.cameras.new("Cam")
cam_obj  = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (3.0, -3.5, 6.5)
cam_obj.rotation_euler = (0.85, 0.0, 0.60)  # radians

# ============================================================
# Export GLB snapshot — evaluate GN at current frame (1)
# ============================================================
bpy.ops.export_scene.gltf(
    filepath                             = str(GLB_OUT),
    export_format                        = 'GLB',
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_yup                           = True,
    use_active_collection                = False,
    export_extras                        = True,
)

# ============================================================
# Save .blend
# ============================================================
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

print(f"[blueprint] Done. Blend → {BLEND_OUT}")
print(f"[blueprint]        GLB  → {GLB_OUT}")
