"""
MirrorModifier — Bisect, Merge & Bilateral Symmetry
Faceted Sci-Fi Clasp Buckle · Blender 5.1 · CC0

Technique:
  bpy.types.MirrorModifier mirrors geometry across an axis defined by the
  object's local origin (or a reference mirror_object).  Two modifiers are
  stacked: the first mirrors across X (use_axis[0]=True, use_bisect_axis[0]=True)
  to create a clean flat seam at X=0; the second mirrors the result across Y
  with no bisect.  merge_threshold=0.0001 m welds coincident boundary vertices.

  Bisect vs clip:
    use_bisect_axis — clips geometry that crosses the mirror plane before
                      mirroring, producing a geometrically clean flat seam.
                      Required when the source half overlaps the mirror plane.
    use_clip        — locks mirror-plane vertices so they can't be moved
                      past the plane during interactive modelling. Harmless
                      in a headless script but set it anyway for .blend reuse.
    use_mirror_merge + merge_threshold — after mirroring, any source vertex
                      within merge_threshold of its reflection is collapsed
                      to a single vertex at the boundary (seam weld).

  Mirror object:
    Assigning mod.mirror_object = empty_obj moves the mirror plane to the
    Empty's origin and orientation — essential when the mesh pivot differs
    from the desired symmetry centre.  Demonstrated in the "off-origin boss"
    sub-section of this file.

  Pre-export apply:
    GLB exporters require real mesh data.  Modifiers are applied to a
    throw-away duplicate so the original .blend object keeps its live stack.

Author: Holoflow Studio · CC0
Source: https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/mirror.html
"""

import bpy
import bmesh
import math

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
CLASP_W     = 0.060   # half-width before mirror (full width = 0.120 m)
CLASP_D     = 0.040   # half-depth before mirror (full depth = 0.080 m)
CLASP_H     = 0.010   # thickness
BOSS_R      = 0.018   # hex boss circumradius
BOSS_H      = 0.004   # boss raise above top face
TAB_W       = 0.012   # tab width (corner extrusion)
TAB_D       = 0.010   # tab depth
BEVEL_W     = 0.0015  # chamfer on all hard edges
BEVEL_SEGS  = 1

MERGE_EPS   = 0.0001  # mirror merge threshold (m)

BASE_CLR    = (0.08, 0.12, 0.22, 1.0)   # deep navy
BOSS_CLR    = (0.56, 0.60, 0.72, 1.0)   # silver-blue
ROUGHNESS   = 0.28
METALLIC    = 0.85

EXPORT_GLB  = "//hf_clasp_buckle.glb"
EXPORT_BLD  = "//hf_clasp_buckle.blend"

# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for blk in list(bpy.data.meshes) + list(bpy.data.materials):
    blk.user_clear()
    blk.use_fake_user = False

# ---------------------------------------------------------------------------
# Helper: add_mirror_modifier
# ---------------------------------------------------------------------------
def add_mirror(obj, axis_x=True, axis_y=False,
               bisect_x=True, bisect_y=False,
               mirror_obj=None, name="Mirror"):
    """
    Attaches a MirrorModifier to obj.

    use_bisect_axis: set to True on any mirrored axis whose source geometry
    may cross the mirror plane — prevents Z-fighting artefacts at the seam.
    use_clip prevents interactive editing past the plane; safe to set in
    headless scripts for .blend reuse.
    """
    mod = obj.modifiers.new(name=name, type='MIRROR')

    # Axis selection — mod.use_axis is a 3-tuple bpy_prop_array
    mod.use_axis[0]          = axis_x
    mod.use_axis[1]          = axis_y
    mod.use_axis[2]          = False

    # Bisect: clip geometry at the mirror plane before reflecting
    mod.use_bisect_axis[0]   = bisect_x
    mod.use_bisect_axis[1]   = bisect_y
    mod.use_bisect_axis[2]   = False

    # Flip: False = keep original side; True = keep mirrored side only
    mod.use_bisect_flip_axis[0] = False
    mod.use_bisect_flip_axis[1] = False
    mod.use_bisect_flip_axis[2] = False

    # Merge seam vertices within merge_threshold
    mod.use_mirror_merge    = True
    mod.merge_threshold     = MERGE_EPS

    # Lock mirror-plane verts from crossing (useful in .blend sessions)
    mod.use_clip            = True

    if mirror_obj is not None:
        mod.mirror_object   = mirror_obj

    return mod


# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------
def make_material(name, base_colour, roughness, metallic):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = base_colour
    bsdf.inputs["Roughness"].default_value  = roughness
    bsdf.inputs["Metallic"].default_value   = metallic
    return mat

mat_base = make_material("clasp_base", BASE_CLR, ROUGHNESS, METALLIC)
mat_boss = make_material("clasp_boss", BOSS_CLR, ROUGHNESS * 0.6, METALLIC)


# ---------------------------------------------------------------------------
# 1. Build the quarter-piece (right-top quadrant, X+ Y+)
# ---------------------------------------------------------------------------
# The source lives entirely in X ≥ 0, Y ≥ 0; both mirrors bisect at 0.
# A flat plate plus a raised hexagonal boss plus extruded corner tabs.

me = bpy.data.meshes.new("clasp_quarter")
obj = bpy.data.objects.new("clasp", me)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

bm = bmesh.new()

# --- Base plate (right-top quadrant in XY, thickness along Z) ---
verts_base = [
    bm.verts.new((0.0,    0.0,    0.0)),
    bm.verts.new((CLASP_W, 0.0,    0.0)),
    bm.verts.new((CLASP_W, CLASP_D, 0.0)),
    bm.verts.new((0.0,    CLASP_D, 0.0)),
    bm.verts.new((0.0,    0.0,    CLASP_H)),
    bm.verts.new((CLASP_W, 0.0,    CLASP_H)),
    bm.verts.new((CLASP_W, CLASP_D, CLASP_H)),
    bm.verts.new((0.0,    CLASP_D, CLASP_H)),
]
# Bottom, top, 4 sides
bm.faces.new([verts_base[0], verts_base[1], verts_base[2], verts_base[3]])
top_face = bm.faces.new([verts_base[7], verts_base[6], verts_base[5], verts_base[4]])
bm.faces.new([verts_base[0], verts_base[4], verts_base[5], verts_base[1]])  # front (Y-)
bm.faces.new([verts_base[1], verts_base[5], verts_base[6], verts_base[2]])  # right (X+)
bm.faces.new([verts_base[2], verts_base[6], verts_base[7], verts_base[3]])  # back (Y+)
bm.faces.new([verts_base[3], verts_base[7], verts_base[4], verts_base[0]])  # left (X=0, mirror seam)

# --- Hexagonal boss (centred at origin, spanning both quadrants) ---
# Only add the +X/+Y quadrant here; mirrors expand it to full hex.
# A hex with flat-top orientation: vertex at angle k * 60° for k in 0..5.
# We only need vertices at angles 0°–90° (quadrant), keeping those in X+,Y+.
# Use a full hex disc inset on the top face instead.
boss_verts_top  = []
boss_verts_base = []
for k in range(6):
    a = math.radians(k * 60.0)
    x, y = BOSS_R * math.cos(a), BOSS_R * math.sin(a)
    boss_verts_top.append( bm.verts.new((x, y, CLASP_H + BOSS_H)))
    boss_verts_base.append(bm.verts.new((x, y, CLASP_H)))

# Boss top face and side walls
bm.faces.new(boss_verts_top)
for i in range(6):
    j = (i + 1) % 6
    bm.faces.new([boss_verts_base[i], boss_verts_base[j],
                  boss_verts_top[j],  boss_verts_top[i]])

# --- Corner tab (X+ corner at (CLASP_W, CLASP_D)) ---
tab_verts = [
    bm.verts.new((CLASP_W,           CLASP_D,           0.0)),
    bm.verts.new((CLASP_W + TAB_W,   CLASP_D,           0.0)),
    bm.verts.new((CLASP_W + TAB_W,   CLASP_D + TAB_D,   0.0)),
    bm.verts.new((CLASP_W,           CLASP_D + TAB_D,   0.0)),
    bm.verts.new((CLASP_W,           CLASP_D,           CLASP_H)),
    bm.verts.new((CLASP_W + TAB_W,   CLASP_D,           CLASP_H)),
    bm.verts.new((CLASP_W + TAB_W,   CLASP_D + TAB_D,   CLASP_H)),
    bm.verts.new((CLASP_W,           CLASP_D + TAB_D,   CLASP_H)),
]
bm.faces.new([tab_verts[0], tab_verts[1], tab_verts[2], tab_verts[3]])
bm.faces.new([tab_verts[7], tab_verts[6], tab_verts[5], tab_verts[4]])
bm.faces.new([tab_verts[0], tab_verts[4], tab_verts[5], tab_verts[1]])
bm.faces.new([tab_verts[1], tab_verts[5], tab_verts[6], tab_verts[2]])
bm.faces.new([tab_verts[2], tab_verts[6], tab_verts[7], tab_verts[3]])
# Inner face shared with plate: omit (Mirror will provide the matching quad)

bm.normal_update()
bm.to_mesh(me)
bm.free()

# ---------------------------------------------------------------------------
# 2. Assign base material
# ---------------------------------------------------------------------------
obj.data.materials.append(mat_base)
obj.data.materials.append(mat_boss)

# ---------------------------------------------------------------------------
# 3. Stack Mirror Modifiers
# ---------------------------------------------------------------------------
# Mirror X first (bisect = True so the quarter-piece seam at X=0 is clean)
mirror_x = add_mirror(obj, axis_x=True, axis_y=False,
                      bisect_x=True, bisect_y=False, name="Mirror_X")

# Mirror Y second (bisect = True so Y=0 seam is clean)
mirror_y = add_mirror(obj, axis_x=False, axis_y=True,
                      bisect_x=False, bisect_y=True, name="Mirror_Y")

# ---------------------------------------------------------------------------
# 4. Bevel modifier — chamfer all non-seam hard edges
# ---------------------------------------------------------------------------
bev = obj.modifiers.new("Bevel", type='BEVEL')
bev.width        = BEVEL_W
bev.segments     = BEVEL_SEGS
bev.limit_method = 'ANGLE'
bev.angle_limit  = math.radians(30)
bev.profile      = 0.62
bev.harden_normals = True

# ---------------------------------------------------------------------------
# 5. Demonstrate mirror_object (off-origin symmetry)
# ---------------------------------------------------------------------------
# An Empty positioned at X=0.08 would mirror around that offset plane.
# This shows the pattern without cluttering the final export.
"""
pivot = bpy.data.objects.new("clasp_pivot", None)
bpy.context.collection.objects.link(pivot)
pivot.location = (0.08, 0.0, 0.0)
demo_mod = add_mirror(obj, axis_x=True, mirror_obj=pivot, name="Mirror_OffCentre")
obj.modifiers.remove(demo_mod)   # remove demo — not part of final mesh
"""

# ---------------------------------------------------------------------------
# 6. Export — apply to duplicate so original keeps live modifier stack
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.duplicate()
dup = bpy.context.active_object

# Apply each modifier in order using temp_override (Blender 5.1 headless)
for mod in list(dup.modifiers):
    with bpy.context.temp_override(
        active_object=dup,
        selected_objects=[dup],
        selected_editable_objects=[dup],
    ):
        bpy.ops.object.modifier_apply(modifier=mod.name)

# Rename root for holoflow:facet WebXR convention
dup.name = "hf_clasp_buckle"
if "holoflow:facet" not in dup.data:
    dup.data["holoflow:facet"] = True

bpy.ops.object.select_all(action='DESELECT')
dup.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=EXPORT_GLB,
    export_format='GLB',
    use_selection=True,
    export_apply=False,          # already applied on dup
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
)

# Remove duplicate; keep original with live stack
bpy.data.objects.remove(dup, do_unlink=True)

# Save .blend
bpy.ops.wm.save_as_mainfile(filepath=EXPORT_BLD)

print("Done — hf_clasp_buckle.glb + .blend written.")
