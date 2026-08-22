"""
BevelModifier — Edge-Weight Chamfer, Profile & Harden Normals
Hard-Surface Equipment Panel · Blender 5.1 · CC0

Technique:
  bpy.types.BevelModifier chamfers tagged edges by inserting face-loop
  strips.  limit_method='WEIGHT' reads the 'bevel_weight_edge' float
  attribute (Blender 4.0+ API — the old BMEdge.bevel_weight was removed).
  Edges with higher weight receive proportionally wider chamfers; weight 0.0
  skips the edge entirely.

  Key parameters:
    profile_type / profile  — SUPERELLIPSE 0.5 = arc, >0.5 = convex
    miter_outer             — PATCH inserts a clean corner fill polygon
    harden_normals          — aligns strip normals to incident flat face,
                              producing a machined-metal specular seam
    use_clamp_overlap        — prevents strips crossing on thin geometry

  Bevel weight in Blender 4.0+:
    bm.edges.layers.float.get("bevel_weight_edge")
                    or .new("bevel_weight_edge")

Author: Holoflow Studio · CC0
"""

import bpy
import bmesh
import math
import mathutils

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PANEL_W    = 0.30    # metres
PANEL_D    = 0.20
PANEL_H    = 0.022
INSET_T    = 0.040   # inset border thickness on top face
RAISE_H    = 0.006   # raised-centre platform height above top face

BW_TOP_RIM  = 1.0    # bevel_weight_edge: top outer rim — widest chamfer
BW_VERT     = 0.65   # vertical slab edges — medium chamfer
BW_INNER    = 0.35   # inner inset rim — narrow chamfer
BW_BOTTOM   = 0.0    # bottom rim — no chamfer

BEVEL_W    = 0.006   # world-space chamfer width at weight = 1.0
BEVEL_SEGS = 2
PROFILE    = 0.62    # > 0.5 → convex arc (machined-bevel look)

BASE_CLR   = (0.13, 0.17, 0.26, 1.0)
ROUGHNESS  = 0.32
METALLIC   = 0.72

EXPORT_GLB   = "//hf_bevel_panel.glb"
EXPORT_BLEND = "//hf_bevel_panel.blend"

# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for blk in list(bpy.data.meshes) + list(bpy.data.materials):
    if blk.users == 0:
        blk.user_clear()
        bpy.data.batch_remove(ids=[blk])

# ---------------------------------------------------------------------------
# Material
# ---------------------------------------------------------------------------
mat = bpy.data.materials.new("hf_panel")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    bsdf.inputs['Base Color'].default_value = BASE_CLR
    bsdf.inputs['Roughness'].default_value  = ROUGHNESS
    bsdf.inputs['Metallic'].default_value   = METALLIC

# ---------------------------------------------------------------------------
# Build mesh
# ---------------------------------------------------------------------------
me = bpy.data.meshes.new("hf_panel_me")
bm = bmesh.new()

# Create unit cube then scale — avoids manual vertex arithmetic
bmesh.ops.create_cube(bm, size=1.0)
bmesh.ops.scale(
    bm,
    vec=(PANEL_W, PANEL_D, PANEL_H),
    verts=bm.verts,
    space=mathutils.Matrix.Identity(4),
)

bm.faces.ensure_lookup_table()

# Find the top face (highest average Z)
top_face = max(bm.faces, key=lambda f: f.calc_center_median().z)

# Inset the top face to create a border ring + inner platform base
inset_result = bmesh.ops.inset_individual(
    bm,
    faces=[top_face],
    thickness=INSET_T,
    depth=0.0,
    use_even_offset=True,
    use_interpolate=True,
)
inner_face = inset_result['faces'][0]

# Extrude the inner face upward to form the raised platform
extr = bmesh.ops.extrude_face_region(bm, geom=[inner_face], use_keep_orig=False)
raised_verts = [e for e in extr['geom'] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(
    bm, verts=raised_verts, vec=mathutils.Vector((0, 0, RAISE_H))
)

bm.normal_update()

# ---------------------------------------------------------------------------
# Mark bevel weights on edge groups
# Blender 4.0+ stores bevel weight as float attribute "bevel_weight_edge".
# BevelModifier with limit_method='WEIGHT' reads this attribute directly.
# weight 0.0 = no chamfer; weight 1.0 = full mod.width chamfer.
# ---------------------------------------------------------------------------
bw_layer = (bm.edges.layers.float.get("bevel_weight_edge")
            or bm.edges.layers.float.new("bevel_weight_edge"))

top_z    =  PANEL_H * 0.5
bot_z    = -PANEL_H * 0.5
raise_z  =  PANEL_H * 0.5 + RAISE_H
z_tol    = 0.001

for edge in bm.edges:
    zs = [v.co.z for v in edge.verts]
    z_min, z_max = min(zs), max(zs)

    if all(abs(z - raise_z) < z_tol for z in zs):
        # top rim of raised platform — medium chamfer to define the step
        edge[bw_layer] = BW_INNER
    elif all(abs(z - top_z) < z_tol for z in zs):
        # outer top rim and inset border edges — widest chamfer
        edge[bw_layer] = BW_TOP_RIM
    elif all(abs(z - bot_z) < z_tol for z in zs):
        # bottom face edges — no chamfer (hidden face)
        edge[bw_layer] = BW_BOTTOM
    else:
        # vertical slab edges — medium chamfer defines the panel silhouette
        edge[bw_layer] = BW_VERT

bm.to_mesh(me)
bm.free()
me.update()

ob = bpy.data.objects.new("hf_bevel_panel", me)
bpy.context.collection.objects.link(ob)
me.materials.append(mat)

# shade_smooth is required: flat shading discards custom normals silently,
# making harden_normals produce no visible effect in the viewport.
with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.shade_smooth()

# ---------------------------------------------------------------------------
# BevelModifier
# ---------------------------------------------------------------------------
bev = ob.modifiers.new("Bevel", 'BEVEL')

# limit_method='WEIGHT' reads 'bevel_weight_edge' attribute on edges.
# Only edges with weight > 0 are chamfered; weight scales width proportionally.
# Contrast with 'ANGLE' (auto-detects sharp dihedral) and 'NONE' (every edge).
bev.limit_method = 'WEIGHT'
bev.width        = BEVEL_W
bev.segments     = BEVEL_SEGS

# profile_type='SUPERELLIPSE' expresses the cross-section as a superellipse
# parameterised by `profile`:
#   0.5  → perfect circular arc — cleanest highlight curve
#   >0.5 → convex outward, increasingly square  (mechanical / stamped look)
#   <0.5 → concave inward (decorative / sculpted edge)
#   1.0  → fully flat / zero curvature (same as straight bevel in old UI)
bev.profile_type = 'SUPERELLIPSE'
bev.profile      = PROFILE

# miter_outer='MITER_PATCH' — at convex corners where three bevel strips meet,
# insert a concave "patch" fill face.  Cleaner silhouette than MITER_SHARP
# (which gives a star-burst spike) and cheaper than MITER_ARC (extra arc loops).
bev.miter_outer = 'MITER_PATCH'

# miter_inner='MITER_SHARP' — concave inner corners stay sharp.
# MITER_ARC on concave corners rarely adds value and triples loop count.
bev.miter_inner = 'MITER_SHARP'

# harden_normals assigns a Custom Split Normal to each bevel-strip face so its
# normal aligns to the adjacent flat-face normal rather than interpolating.
# Without it: smooth gradient across the strip (plasticky look).
# With it: crisp specular seam line at the strip boundary (machined metal).
# Requires shade_smooth on the mesh; no effect on flat-shaded geometry.
bev.harden_normals = True

# use_clamp_overlap prevents bevel strips from crossing when panel thickness
# is small.  At PANEL_H=0.022 m opposing vertical edges could each request a
# 0.006 m chamfer — total 0.012 m > 0.022 m panel.  Clamp halves each strip
# proportionally so they share the available space without overlap.
bev.use_clamp_overlap = True

# loop_slide=True slides the bevel edge-loop along adjacent topology instead
# of projecting it strictly orthogonally.  Eliminates skewed bevel faces near
# vertices where incident edges are not coplanar.
bev.loop_slide = True

# face_strength_mode='NEW' marks new bevel-strip faces as WEAK.  A downstream
# WeightedNormalModifier with face_influence=True suppresses WEAK faces in the
# normal blend, reinforcing the harden_normals crisp-seam effect.
bev.face_strength_mode = 'NEW'

# ---------------------------------------------------------------------------
# Camera & lighting
# ---------------------------------------------------------------------------
bpy.ops.object.camera_add(location=(0.0, -0.42, 0.20))
cam = bpy.context.object
cam.name = "Cam"
cam.rotation_euler = (math.radians(56), 0.0, 0.0)
cam.data.lens = 85.0   # telephoto flattens perspective for prop shots
bpy.context.scene.camera = cam

bpy.ops.object.light_add(type='SUN', location=(0.25, -0.35, 0.55))
sun = bpy.context.object
sun.name = "KeyLight"
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(52), 0.0, math.radians(28))

bpy.ops.object.light_add(type='AREA', location=(-0.15, 0.10, 0.25))
fill = bpy.context.object
fill.name = "FillLight"
fill.data.energy = 30.0
fill.data.size   = 0.6
fill.rotation_euler = (math.radians(68), 0.0, math.radians(-50))

# ---------------------------------------------------------------------------
# Save .blend + export GLB
# ---------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=EXPORT_BLEND)

for o in bpy.data.objects:
    o.select_set(o is ob)
bpy.context.view_layer.objects.active = ob

# export_apply=True evaluates the full modifier stack (BevelModifier included)
# at export time; export_normals=True writes the harden_normals custom normals
# into the NORMAL accessor verbatim.
bpy.ops.export_scene.gltf(
    filepath            = EXPORT_GLB,
    use_selection       = True,
    export_format       = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_apply        = True,
    export_normals      = True,
)
print("[holoflow] Exported →", EXPORT_GLB)
