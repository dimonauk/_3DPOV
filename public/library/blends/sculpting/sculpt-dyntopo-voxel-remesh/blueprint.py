"""
Blender 5.1 — Sculpt Mode: Dynamic Topology + Voxel Remesh
Blueprint: scene setup + procedural approximation of a sculpted form

Sculpting is inherently interactive — brush strokes cannot be replayed
from bpy alone.  This script does three things:

  1. Builds the ideal starting geometry and scene conditions for a live
     sculpt session (base mesh, Dyntopo configuration, viewport shading).
  2. Demonstrates every operator in the correct call order so you can
     cross-reference what Blender is doing during a manual session.
  3. Uses a Displace modifier to approximate an organic sculpted surface
     so record.py has a visually interesting mesh to orbit without
     requiring a manual brush pass.

Source: Blender Manual (CC-BY-SA-4.0), Blender Foundation.
https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/
"""

import bpy
import math

# ─── parameters ──────────────────────────────────────────────────────────────
SPHERE_SEGMENTS   = 32      # UV sphere horizontal resolution
SPHERE_RINGS      = 24      # UV sphere vertical resolution
SPHERE_RADIUS     = 0.5     # metres — head-scale reference
SUBDIV_LEVELS     = 3       # Simple subdivision before displacement

DISPLACE_STRENGTH = 0.18    # metres — simulates broad sculpt strokes
DISPLACE_SCALE    = 2.8     # noise frequency

# Voxel Remesh target — smaller = finer quads (more triangles)
# For a 0.5 m sphere: 0.025 m voxels ≈ 8 000–15 000 quads after remesh
VOXEL_SIZE        = 0.025   # metres

EXPORT_PATH = "//sculpt_organic_head.glb"

# ─── scene reset ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

for collection in list(bpy.data.collections):
    bpy.data.collections.remove(collection)

# ─── renderer ────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine        = 'BLENDER_EEVEE_NEXT'
scene.render.film_transparent = False

# ─── 1. BASE MESH ─────────────────────────────────────────────────────────────
# UV Sphere is the canonical sculpt starting point for head/creature forms.
# Ico Sphere is a valid alternative but UV Sphere gives better UV seams and
# ring-edge flow for eye sockets.  Resize to a meaningful real-world scale
# before sculpting so brush radius calculations (mm vs cm) are sensible.
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=SPHERE_SEGMENTS,
    ring_count=SPHERE_RINGS,
    radius=SPHERE_RADIUS,
    location=(0, 0, 0),
)
obj = bpy.context.active_object
obj.name = "sculpt_organic_head"

# Apply scale — Dyntopo uses world-space distances for its "constant detail"
# setting.  Unapplied scale causes the detail density to be wrong.
bpy.ops.object.transform_apply(scale=True)

# ─── 2. SUBDIVISION (Simple) ──────────────────────────────────────────────────
# Simple subdivision (not Catmull-Clark) adds geometry without rounding edges.
# We need enough faces before Dyntopo so the first brush stroke doesn't
# collapse into degenerate triangles.  3 levels → ~3 000 tris on a 32×24
# sphere.  Dyntopo will then refine further as the brush moves.
mod_subdiv = obj.modifiers.new("Subdivide", 'SUBSURF')
mod_subdiv.subdivision_type = 'SIMPLE'
mod_subdiv.levels            = SUBDIV_LEVELS
mod_subdiv.render_levels     = SUBDIV_LEVELS

# ─── 3. DISPLACE MODIFIER (approximates sculpted surface for record.py) ──────
# In a live session you would sculpt by hand instead of applying this modifier.
# The Displace modifier drives geometry via a texture, giving bumpy organic
# surface variation that reads as a sculpted form in the viewport and render.
noise_tex = bpy.data.textures.new("sculpt_noise", 'CLOUDS')
noise_tex.noise_scale = DISPLACE_SCALE
noise_tex.turbulence  = 4.0   # extra octaves → more varied terrain

mod_displace = obj.modifiers.new("OrganicDisplace", 'DISPLACE')
mod_displace.texture   = noise_tex
mod_displace.strength  = DISPLACE_STRENGTH
mod_displace.mid_level = 0.5   # 0 = no offset, 0.5 = centred displacement
mod_displace.direction = 'NORMAL'

# Apply both modifiers to get a real mesh for voxel remesh
bpy.ops.object.modifier_apply(modifier="Subdivide")
bpy.ops.object.modifier_apply(modifier="OrganicDisplace")

# ─── 4. DYNTOPO SETUP (reference — requires Sculpt Mode in a live session) ───
# These parameters cannot be set while in Object Mode via the same path used
# in the UI, but they show what Blender expects you to configure before
# enabling Dyntopo.
#
# In a manual session:
#   Tab → Sculpt Mode
#   Header → Dyntopo checkbox ON
#   Tool Settings → Dyntopo Method → CONSTANT_DETAIL (better for head sculpts)
#   Constant Detail → 12 px (lower = finer, 12 is a fast starting point)
#   Detailing → SUBDIVIDE_COLLAPSE (default — adds AND removes triangles)
#
# API equivalents (only valid while actively in Sculpt mode context):
#   ts = bpy.context.scene.tool_settings
#   ts.sculpt.use_dynamic_topology_remeshing     = True
#   ts.sculpt.detail_type_method                 = 'CONSTANT'
#   ts.sculpt.constant_detail_resolution         = 12.0
#   ts.sculpt.detail_refine_method               = 'SUBDIVIDE_COLLAPSE'
#
# WHY CONSTANT_DETAIL over RELATIVE or BRUSH?
# RELATIVE scales detail by object bounding box — a small tweak to a large
# mesh gets under-detailed.  BRUSH ties detail to brush size — easy to
# accidentally leave coarse patches when switching to a big smooth brush.
# CONSTANT_DETAIL keeps pixel-level density uniform regardless of brush size,
# which suits organic forms where you want consistent micro-detail.

# ─── 5. VOXEL REMESH ─────────────────────────────────────────────────────────
# After sculpting, the mesh is a triangle soup (Dyntopo output).  Voxel Remesh
# converts it back to clean quads at a uniform edge length = VOXEL_SIZE.
# The algorithm fills a signed-distance-field grid, then runs Marching Cubes,
# then runs the Quadriflow algorithm to produce quad-dominant topology.
#
# Quadriflow (used internally) minimises alignment to the surface curvature,
# so the quads tend to follow feature lines — edges, ridges, and creases align
# with the resulting loop cuts.  This is not retopology, but it is close
# enough to rig and UV a simple character head.

obj.data.remesh_voxel_size        = VOXEL_SIZE
obj.data.remesh_voxel_adaptivity  = 0.0   # 0 = uniform; >0 = coarser in flat areas
obj.data.use_remesh_smooth_normals = True  # Voxel Remesh can smooth normals

# bpy.ops.object.voxel_remesh() is valid from Object Mode (no viewport trick needed).
bpy.ops.object.voxel_remesh()

# ─── 6. SMOOTH SHADING ───────────────────────────────────────────────────────
bpy.ops.object.shade_smooth()

# ─── 7. BASIC MATERIAL ───────────────────────────────────────────────────────
mat = bpy.data.materials.new("organic_head_preview")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value    = (0.72, 0.58, 0.44, 1.0)  # warm clay
bsdf.inputs["Roughness"].default_value     = 0.85
bsdf.inputs["Subsurface Weight"].default_value = 0.04
obj.data.materials.append(mat)

# ─── 8. LIGHTING ─────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(3, -5, 8))
sun = bpy.context.active_object
sun.data.energy = 4.0
sun.data.angle  = math.radians(5.0)   # sharper shadows for surface detail

bpy.ops.object.light_add(type='AREA', location=(-3, 2, 4))
fill = bpy.context.active_object
fill.data.energy = 80.0
fill.data.size   = 3.0

# ─── 9. CAMERA ───────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -1.8, 0.3))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(85), 0, 0)
scene.camera = cam

# ─── 10. GLB EXPORT ──────────────────────────────────────────────────────────
# Select only the sculpt mesh (not lights, camera)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath       = bpy.path.abspath(EXPORT_PATH),
    export_format  = 'GLB',
    use_selection  = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_yup     = True,        # +Y up for WebXR / Three.js
    export_apply   = True,        # bake all modifiers before export
)

print(f"[blueprint] Exported → {EXPORT_PATH}")
print(f"[blueprint] Poly count after voxel remesh: {len(obj.data.polygons)}")
