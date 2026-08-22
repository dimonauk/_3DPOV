"""
bpy.types.ScrewModifier — Profile-to-Lathe Revolution (Blender 5.1)
Holoflow Studio · CC0

A 2D profile mesh (vertices + edges in the XZ plane) is spun around the Z
axis by ScrewModifier to produce a watertight revolution surface.  Output:
a faceted 12-gon low-poly vase in hf_lathe_vase.blend / hf_lathe_vase.glb.
"""
import bpy
import bmesh
import math
from pathlib import Path

# ---------------------------------------------------------------------------
# Parameters — adjust before running
# ---------------------------------------------------------------------------
OUTPUT_DIR   = Path(bpy.path.abspath("//"))
BLEND_NAME   = "hf_lathe_vase.blend"
GLB_NAME     = "hf_lathe_vase.glb"

SCREW_AXIS   = 'Z'         # axis of revolution
SCREW_ANGLE  = math.tau    # 2π = full 360° revolution
SCREW_STEPS  = 12          # angular subdivisions → 12-gon cross-section

# Vase silhouette — (radius, height) pairs measured in metres.
# Each pair becomes one vertex in the XZ plane (Y=0).
# The ScrewModifier revolves these around Z to create the surface.
PROFILE = [
    (0.00, 0.00),   # 0 — centre of base (sits on the revolution axis)
    (0.28, 0.00),   # 1 — outer base rim
    (0.32, 0.12),   # 2 — base-shoulder flare
    (0.22, 0.35),   # 3 — lower waist
    (0.38, 0.70),   # 4 — belly bulge
    (0.36, 1.00),   # 5 — upper belly
    (0.16, 1.25),   # 6 — neck narrow
    (0.24, 1.45),   # 7 — lip flare
    (0.20, 1.55),   # 8 — lip top edge
]

VASE_COLOUR  = (0.18, 0.55, 0.72, 1.0)   # base diffuse (teal)

# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------
bpy.ops.wm.read_homefile(use_empty=True)
bpy.context.scene.unit_settings.system      = 'METRIC'
bpy.context.scene.unit_settings.length_unit = 'METERS'

# ---------------------------------------------------------------------------
# Build the 2D profile mesh (vertices + edges, no faces)
#
# WHY no faces: ScrewModifier revolves edges into quad strips.  If you add
# a face the modifier revolves the whole polygon into a solid that obscures
# the interior.  Edges-only gives an open shell — correct for a vase.
# ---------------------------------------------------------------------------
verts_3d = [(r, 0.0, h) for (r, h) in PROFILE]
edges    = [(i, i + 1) for i in range(len(PROFILE) - 1)]

profile_me = bpy.data.meshes.new("vase_profile")
profile_me.from_pydata(verts_3d, edges, [])
profile_me.update()

profile_ob = bpy.data.objects.new("vase_profile", profile_me)
bpy.context.collection.objects.link(profile_ob)

# ---------------------------------------------------------------------------
# ScrewModifier — revolution engine
# ---------------------------------------------------------------------------
screw = profile_ob.modifiers.new("Screw", 'SCREW')

screw.axis         = SCREW_AXIS
screw.angle        = SCREW_ANGLE
screw.steps        = SCREW_STEPS
screw.render_steps = SCREW_STEPS    # match viewport to avoid render surprise

# WHY screw_offset=0: non-zero values shift each ring up the axis as they
# rotate, creating a helix (useful for screws, springs, DNA).  Zero gives
# a clean symmetric revolution.
screw.screw_offset = 0.0

# WHY use_merge_vertices=True: at 2π the final ring lands exactly on the
# first ring.  Merge collapses duplicate vertices at that seam so there is
# no visible crease in the GLB at the 0° / 360° join.
screw.use_merge_vertices  = True

# WHY use_normal_calculate=True: the axis vertex (radius=0) is shared by
# every triangle of the base fan.  Winding-order normals can be inconsistent
# there; recalculation uses the surrounding face area to produce a stable
# average.
screw.use_normal_calculate = True
screw.use_normal_flip      = False
screw.iterations           = 1

# ---------------------------------------------------------------------------
# Apply modifier via depsgraph — headless-safe, no bpy.ops required
#
# bpy.ops.object.modifier_apply() requires an active VIEW_3D context that
# is absent in background (--background) mode.  evaluated_get() + new_from_object()
# evaluates the full modifier stack through the dependency graph and snapshots
# the resulting mesh geometry into a new permanent data block.
# ---------------------------------------------------------------------------
depsgraph = bpy.context.evaluated_depsgraph_get()
eval_ob   = profile_ob.evaluated_get(depsgraph)
baked_me  = bpy.data.meshes.new_from_object(eval_ob)

vase_ob = bpy.data.objects.new("hf_lathe_vase", baked_me)
bpy.context.collection.objects.link(vase_ob)

bpy.data.objects.remove(profile_ob, do_unlink=True)

# ---------------------------------------------------------------------------
# Flat shading — every polygon explicitly set to smooth=False.
# ScrewModifier sometimes inherits the profile's shading state inconsistently;
# iterating polygons directly is the reliable path.
# ---------------------------------------------------------------------------
for poly in baked_me.polygons:
    poly.use_smooth = False

# ---------------------------------------------------------------------------
# Sharp edges — mark every edge so the GLTF exporter splits normals at each
# ring boundary, preserving the faceted silhouette.
#
# Blender 5.1 stores sharpness as a boolean mesh attribute named "sharp_edge"
# on the EDGE domain.  The older MeshEdge.use_edge_sharp wrapper still exists
# but writing the attribute directly is the recommended path in 5.x.
# ---------------------------------------------------------------------------
sharp_attr = baked_me.attributes.get("sharp_edge")
if sharp_attr is None:
    sharp_attr = baked_me.attributes.new("sharp_edge", 'BOOLEAN', 'EDGE')
for datum in sharp_attr.data:
    datum.value = True
baked_me.update()

# ---------------------------------------------------------------------------
# Material
# ---------------------------------------------------------------------------
mat  = bpy.data.materials.new("vase_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = VASE_COLOUR
bsdf.inputs["Roughness"].default_value  = 0.7
bsdf.inputs["Metallic"].default_value   = 0.0
vase_ob.data.materials.append(mat)

# ---------------------------------------------------------------------------
# Transform apply (Holoflow convention: applied scale, +Y up)
# ---------------------------------------------------------------------------
bpy.context.view_layer.objects.active = vase_ob
vase_ob.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---------------------------------------------------------------------------
# Save .blend
# ---------------------------------------------------------------------------
blend_path = str(OUTPUT_DIR / BLEND_NAME)
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

# ---------------------------------------------------------------------------
# Export GLB — Draco 6, WebP, normals exported for faceted display
# ---------------------------------------------------------------------------
glb_path = str(OUTPUT_DIR / GLB_NAME)
bpy.ops.export_scene.gltf(
    filepath                             = glb_path,
    export_format                        = 'GLB',
    use_selection                        = False,
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_materials                     = 'EXPORT',
    export_normals                       = True,
    export_colors                        = False,
)

print(f"[holoflow] Saved blend: {blend_path}")
print(f"[holoflow] Saved GLB:   {glb_path}")
