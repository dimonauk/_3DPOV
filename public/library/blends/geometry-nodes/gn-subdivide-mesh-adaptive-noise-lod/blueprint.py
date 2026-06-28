"""
GN Subdivide Mesh — Selective Subdivision via Noise Field
Blender 5.1 | CC0 | Holoflow Studio

Technique: GeometryNodeSubdivideMesh subdivides every face in the mesh uniformly;
it has no selection input. To subdivide SELECTIVELY — e.g., only the faces where
a noise field exceeds a threshold — you must Separate Geometry into two subsets
BEFORE the Subdivide node, subdivide the hot subset, then Join the two halves back.
This tutorial builds a low-poly terrain whose patches of high-frequency detail are
driven by an independent Perlin noise field, producing a result that looks like
photogrammetric LOD falloff but is entirely procedural.

WHY split before subdivide instead of using a mask post-subdivision?
  A post-subdivision mask could assign a material per patch, but it cannot remove
  the extra geometry from the sparse areas. Splitting first keeps the dense patches
  at Catmull-Clark smoothed density and the sparse areas at the raw grid resolution
  — exactly what a performance-budgeted WebXR scene needs.

WHY two separate noise fields (height and density)?
  Using the same noise for both would mean the tallest peaks always become the
  densest — a plausible earth-science relationship, but artistically limiting.
  Separate fields let you put high detail on flat shallow areas (e.g. a riverbed
  with fine gravel) while leaving high peaks at coarse resolution.
"""

import bpy
import math

# ─── constants ────────────────────────────────────────────────────────────────
GRID_SIZE            = 4.0      # world-space side length (metres)
GRID_VERTS           = 9        # vertices per axis → 8×8 = 64 base quads
TERRAIN_HEIGHT       = 0.6      # peak-to-trough displacement amplitude
HEIGHT_NOISE_SCALE   = 1.4      # Perlin scale for height displacement
HEIGHT_DETAIL        = 7.0      # octaves for height noise
DENSITY_NOISE_SCALE  = 2.2      # Perlin scale for subdivision selection
DENSITY_THRESHOLD    = 0.55     # faces where noise > threshold get subdivided
SUBDIVIDE_LEVEL      = 2        # each pass multiplies face count ×4
MAT_SPARSE  = (0.28, 0.32, 0.25, 1.0)   # muted sage green
MAT_DENSE   = (0.55, 0.41, 0.28, 1.0)   # warm earth brown
EXPORT_PATH = "//adaptive_terrain.glb"
OBJ_NAME    = "adaptive_terrain"

# ─── scene reset ──────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)

# ─── materials ────────────────────────────────────────────────────────────────
def make_mat(name, base_col, roughness=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = base_col
    bsdf.inputs["Roughness"].default_value = roughness
    return m

mat_sparse = make_mat("terrain_sparse", MAT_SPARSE)
mat_dense  = make_mat("terrain_dense",  MAT_DENSE)

# ─── mesh object ──────────────────────────────────────────────────────────────
mesh = bpy.data.meshes.new(OBJ_NAME + "_mesh")
obj  = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

obj.data.materials.append(mat_sparse)   # slot 0 — coarse patches
obj.data.materials.append(mat_dense)    # slot 1 — subdivided patches

# ─── geometry nodes modifier ──────────────────────────────────────────────────
mod  = obj.modifiers.new("AdaptiveLOD", "NODES")
tree = bpy.data.node_groups.new("adaptive_terrain_lod", "GeometryNodeTree")
mod.node_group = tree

nodes = tree.nodes
links = tree.links

def N(bl_idname, x, y):
    n = nodes.new(bl_idname)
    n.location = (x, y)
    return n

# I/O sockets
tree.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
tree.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
n_in  = nodes["Group Input"]
n_out = nodes["Group Output"]
n_in.location  = (-1400, 0)
n_out.location = (1000, 0)

# ── 1: base grid ──────────────────────────────────────────────────────────────
n_grid = N("GeometryNodeMeshGrid", -1200, 100)
n_grid.inputs["Size X"].default_value    = GRID_SIZE
n_grid.inputs["Size Y"].default_value    = GRID_SIZE
n_grid.inputs["Vertices X"].default_value = GRID_VERTS
n_grid.inputs["Vertices Y"].default_value = GRID_VERTS

# ── 2: height displacement via noise ─────────────────────────────────────────
n_pos_h  = N("GeometryNodeInputPosition", -1000, 280)
n_noise_h = N("ShaderNodeTexNoise",        -800, 280)
n_noise_h.noise_dimensions              = '3D'
n_noise_h.inputs["Scale"].default_value  = HEIGHT_NOISE_SCALE
n_noise_h.inputs["Detail"].default_value = HEIGHT_DETAIL
n_noise_h.inputs["Roughness"].default_value = 0.65
n_noise_h.inputs["Distortion"].default_value = 0.2

n_mul_h = N("ShaderNodeMath", -600, 280)
n_mul_h.operation                  = 'MULTIPLY'
n_mul_h.inputs[1].default_value    = TERRAIN_HEIGHT

n_comb_h = N("ShaderNodeCombineXYZ", -450, 280)    # only Z offset for height

n_setpos = N("GeometryNodeSetPosition", -250, 100)

links.new(n_pos_h.outputs["Position"],  n_noise_h.inputs["Vector"])
links.new(n_noise_h.outputs["Fac"],     n_mul_h.inputs[0])
links.new(n_mul_h.outputs["Value"],     n_comb_h.inputs["Z"])
links.new(n_grid.outputs["Mesh"],       n_setpos.inputs["Geometry"])
links.new(n_comb_h.outputs["Vector"],   n_setpos.inputs["Offset"])
# NOTE: inputs[0] on Math-Multiply is the variable input; inputs[1] is the
# constant TERRAIN_HEIGHT scale. Swapping them has no effect (commutative) but
# the convention keeps the named constant on the right for readability.

# ── 3: density selection field ────────────────────────────────────────────────
# A second noise evaluated at face position drives the split.
n_pos_d  = N("GeometryNodeInputPosition", -1000, -120)
n_noise_d = N("ShaderNodeTexNoise",        -800, -120)
n_noise_d.noise_dimensions               = '3D'
n_noise_d.inputs["Scale"].default_value   = DENSITY_NOISE_SCALE
n_noise_d.inputs["Detail"].default_value  = 3.0
n_noise_d.inputs["Roughness"].default_value = 0.5
n_noise_d.inputs["Distortion"].default_value = 0.0

n_cmp = N("FunctionNodeCompare", -600, -120)
n_cmp.data_type  = 'FLOAT'
n_cmp.operation  = 'GREATER_THAN'
n_cmp.inputs[1].default_value = DENSITY_THRESHOLD   # index 1 = B threshold

links.new(n_pos_d.outputs["Position"],   n_noise_d.inputs["Vector"])
links.new(n_noise_d.outputs["Fac"],      n_cmp.inputs[0])   # A

# ── 4: split geometry by the selection field ──────────────────────────────────
n_sep = N("GeometryNodeSeparateGeometry", -50, 0)
n_sep.domain = 'FACE'
# WHY FACE domain: we want whole faces classified as dense or sparse, not
# individual vertices that would leave sub-face boundaries unresolved and
# create mismatching edge loops when the halves are joined back.

links.new(n_setpos.outputs["Geometry"],  n_sep.inputs["Geometry"])
links.new(n_cmp.outputs["Result"],       n_sep.inputs["Selection"])
# n_sep.outputs[0] = "Selection"  (faces where noise > threshold = DENSE)
# n_sep.outputs[1] = "Inverted"   (faces where noise ≤ threshold = SPARSE)

# ── 5: subdivide the dense subset ────────────────────────────────────────────
n_sub = N("GeometryNodeSubdivideMesh", 200, 100)
n_sub.inputs["Level"].default_value = SUBDIVIDE_LEVEL
links.new(n_sep.outputs[0], n_sub.inputs["Mesh"])
# Level 2 → each original face becomes 4² = 16 quads.
# The sparse subset stays at 1 quad per original face.
# Combined face count ≈ 64 × (0.45×1 + 0.55×16) ≈ 589 — cheap enough for
# WebXR at 60 fps, but visually reads as high-detail patches.

# ── 6: assign dense material (slot 1) ────────────────────────────────────────
n_mat = N("GeometryNodeSetMaterialIndex", 400, 100)
n_mat.inputs["Material Index"].default_value = 1   # mat_dense
links.new(n_sub.outputs["Mesh"], n_mat.inputs["Geometry"])
# Sparse faces stay at index 0 (mat_sparse) — no node needed because
# the grid is initialised with index 0 on all faces.

# ── 7: join dense + sparse ────────────────────────────────────────────────────
n_join = N("GeometryNodeJoinGeometry", 650, 0)
links.new(n_mat.outputs["Geometry"],    n_join.inputs["Geometry"])  # dense
links.new(n_sep.outputs[1],             n_join.inputs["Geometry"])  # sparse

links.new(n_join.outputs["Geometry"], n_out.inputs["Geometry"])

# ── 8: smooth shading + apply ─────────────────────────────────────────────────
bpy.ops.object.shade_smooth()

# ── 9: GLB export ─────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_PATH),
    use_selection=True,
    export_format='GLB',
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_materials='EXPORT',
    export_colors=False,
)

print("Blueprint complete: adaptive_terrain.glb written.")
print(f"  Grid: {GRID_VERTS}×{GRID_VERTS} verts, {(GRID_VERTS-1)**2} base quads")
print(f"  Dense patches (noise > {DENSITY_THRESHOLD}): subdivide level {SUBDIVIDE_LEVEL}")
print(f"  Dense face count ≈ base_quads × {4**SUBDIVIDE_LEVEL} per dense face")
