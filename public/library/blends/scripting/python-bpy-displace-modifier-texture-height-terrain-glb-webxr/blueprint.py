"""
DisplaceModifier + bpy.data.textures — Procedural Height-Field Terrain & GLB Export
Blender 5.1 · Holoflow Studio · CC0

TECHNIQUE
---------
Blender's DisplaceModifier evaluates a Texture data block at each vertex and
moves that vertex along a chosen direction by (texture_value - mid_level) *
strength.  The Texture data block (bpy.data.textures) is the *same* legacy
system used for particles, volumes, and world backgrounds — it is completely
separate from material shader nodes.  This pipeline is ideal for terrain
because it produces clean, evaluate-time geometry with no baked intermediate.

Stack law: SubSurf MUST precede Displace.  DisplaceModifier reads vertex
density at modifier-entry time; a 2×2 m plane with 1 subdivision has only
9 vertices, which cannot resolve noise at scale 0.5.  SubSurf at level 5
gives 1089 vertices — enough for smooth height curvature.

KEY GOTCHAS
-----------
- texture_coords='GLOBAL'  → noise tiles in world-space regardless of object
  transform; correct for terrain that must seamlessly tile.
- texture_coords='LOCAL'   → noise stretches with non-uniform object scale.
- texture_coords='UV'      → requires a UV map; allows artist-driven layout.
- mid_level=0.5 (default)  → texture value 0.5 = zero displacement.
  Set mid_level=0.0 for all-positive terrain (hills only, no pits below base).
- direction='Z'            → moves vertices along +Z only.  'NORMAL' follows
  local normals — correct for spherical displacement (planets, etc.).
- apply_modifiers DOES NOT exist on bpy.ops.object in 5.1.  Use
  evaluated_get(depsgraph) + bpy.data.meshes.new_from_object() instead.
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
TERRAIN_SIZE    = 4.0       # metres, world-space tile
SUBSURF_LEVEL   = 5         # viewport & render subdivision level (1089 verts)
NOISE_SCALE     = 0.8       # lower = bigger features, higher = finer
NOISE_DEPTH     = 6         # octaves of detail (Blender 'Clouds' depth)
DISPLACE_STR    = 0.6       # peak excursion from mid-level in metres
DISPLACE_MID    = 0.0       # zero-crossing: 0.0 = all positive (terrain)
SMOOTH_ANGLE    = math.radians(25)   # SBA threshold for facet edges
OUTPUT_BLEND    = "//hf_displace_terrain.blend"
OUTPUT_GLB      = "//hf_displace_terrain.glb"
OBJ_NAME        = "hf_terrain"

# ── 0. Clean slate ────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for name in list(bpy.data.meshes.keys()):
    bpy.data.meshes.remove(bpy.data.meshes[name])
for name in list(bpy.data.textures.keys()):
    bpy.data.textures.remove(bpy.data.textures[name])

# ── 1. Base plane ─────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=TERRAIN_SIZE)
obj = bpy.context.active_object
obj.name = OBJ_NAME
obj.data.name = OBJ_NAME + "_mesh"

# ── 2. Procedural Texture data block ──────────────────────────────────────────
# 'CLOUDS' is the standard fractal-Brownian-motion noise in Blender's legacy
# Texture system.  It produces values in [0, 1] — ideal for height fields.
tex = bpy.data.textures.new("HF_Noise", 'CLOUDS')
tex.noise_scale  = NOISE_SCALE
tex.noise_depth  = NOISE_DEPTH
# 'BLENDER_ORIGINAL': Perlin-like, continuous, no hard borders
tex.noise_basis  = 'BLENDER_ORIGINAL'
# noise_type 'HARD_NOISE' produces sharper ridges; 'SOFT_NOISE' (default) is
# smoother.  For terrain readable in WebXR at a distance, SOFT is preferable.
tex.noise_type   = 'SOFT_NOISE'

# ── 3. Modifier stack: SubSurf → SmoothByAngle → Displace ─────────────────────

# 3a. Subdivision Surface — MUST be first so Displace sees dense geometry
ss = obj.modifiers.new("SubSurf", 'SUBSURF')
ss.subdivision_type = 'CATMULL_CLARK'
ss.levels           = SUBSURF_LEVEL
ss.render_levels    = SUBSURF_LEVEL
# uv_smooth='PRESERVE_CORNERS': prevents UV distortion at border corners
ss.uv_smooth        = 'PRESERVE_CORNERS'

# 3b. Smooth by Angle — sits between SubSurf and Displace so it sees the
# subdivided cage before displacement moves vertices.  After Displace, normals
# are recomputed anyway, so this order is correct for the smoothing intent.
sba = obj.modifiers.new("Smooth by Angle", 'SMOOTH_BY_ANGLE')
sba.angle           = SMOOTH_ANGLE
sba.keep_sharp_edges = True

# 3c. DisplaceModifier
disp = obj.modifiers.new("Displace", 'DISPLACE')
disp.texture         = tex
# GLOBAL: texture evaluated in world-space → tiling independent of obj xform
disp.texture_coords  = 'GLOBAL'
disp.direction       = 'Z'          # displace along world Z
disp.strength        = DISPLACE_STR
# mid_level 0.0: every vertex lifts by (value * strength); base plane stays flat
disp.mid_level       = DISPLACE_MID

# ── 4. Material ───────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("HF_Terrain_Mat")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

out_node   = nodes.new('ShaderNodeOutputMaterial')
bsdf       = nodes.new('ShaderNodeBsdfPrincipled')
vert_col   = nodes.new('ShaderNodeVertexColor')   # placeholder for vertex paint

# Neutral warm grey for WebXR presentation; vertex colour can be swapped in later
bsdf.inputs['Base Color'].default_value    = (0.72, 0.65, 0.54, 1.0)
bsdf.inputs['Roughness'].default_value     = 0.85
bsdf.inputs['Metallic'].default_value      = 0.0

links.new(bsdf.outputs['BSDF'],    out_node.inputs['Surface'])

out_node.location  = (300, 0)
bsdf.location      = (0, 0)
vert_col.location  = (-200, -100)

obj.data.materials.append(mat)

# ── 5. Apply modifier stack via depsgraph ─────────────────────────────────────
# bpy.ops.object.modifier_apply() requires the object to be active and in
# OBJECT mode, but also requires a VIEW_3D context in many Blender versions.
# The safe headless pattern: evaluate the depsgraph and bake to a new mesh.

scene = bpy.context.scene
depsgraph = bpy.context.evaluated_depsgraph_get()
obj_eval  = obj.evaluated_get(depsgraph)

baked_mesh = bpy.data.meshes.new_from_object(obj_eval, depsgraph=depsgraph)
baked_mesh.name = OBJ_NAME + "_baked"

# Replace the object's data with the baked version
old_mesh      = obj.data
obj.data      = baked_mesh
obj.modifiers.clear()          # modifiers no longer needed
bpy.data.meshes.remove(old_mesh)

# Normalise the terrain — translate so Z-min == 0 for clean WebXR floor
zmin = min(v.co.z for v in baked_mesh.vertices)
for v in baked_mesh.vertices:
    v.co.z -= zmin
baked_mesh.update()

# ── 6. Holoflow export conventions ───────────────────────────────────────────
# +Y up is Three.js / WebXR convention; Blender is +Z up.
# The gltf exporter handles the +Y-up conversion automatically.
obj.name     = "hf_terrain"           # snake_case root name (holoflow rule)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))

# Select only the terrain for export
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath      = bpy.path.abspath(OUTPUT_GLB),
    use_selection = True,
    export_format = 'GLB',
    export_apply  = True,       # apply any remaining modifiers (none here)
    export_normals = True,
    export_yup    = True,       # +Y up for Three.js / WebXR
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_texcoords    = True,
    export_colors       = True,
)

print(f"[HF] Terrain blueprint done → {OUTPUT_GLB}")
print(f"[HF] Vertices in baked mesh: {len(baked_mesh.vertices)}")
