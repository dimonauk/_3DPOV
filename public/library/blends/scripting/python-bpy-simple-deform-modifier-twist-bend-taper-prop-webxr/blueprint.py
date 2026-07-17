"""
Holoflow Studio — Python bpy.types.SimpleDeformModifier
TWIST / BEND / TAPER / STRETCH: Three Stylised Props & GLB Export (Blender 5.1)

Technique:
  SimpleDeformModifier deforms a mesh along its LOCAL Z axis using one of four
  analytical operations. Unlike Lattice or MeshDeform (cage-based), these
  operations are parametric: each vertex position is computed from a closed-form
  formula, making them fast, resolution-independent, and trivially animatable.

  We build three props that showcase the four modes in combination:
    1. TWISTED COLUMN  — TWIST around Z, combined with TAPER for a tapered base
    2. BENT HORN       — BEND around Y (via origin-Empty rotation) into a curved spike
    3. STRETCHED SPIKE — TAPER + STRETCH to produce a pulled, elongated crystal form

Blender 5.1 specifics:
  • SimpleDeformModifier unchanged since 3.x — stable API.
  • angle is in RADIANS (common beginner mistake: inputting degrees directly).
  • factor is a SIGNED FLOAT in TAPER/STRETCH, not radians.
  • limits tuple (min, max): range [0.0 .. 1.0] maps to the LOCAL bounding-box
    extent along the deformation axis. 0.0 = bottom face, 1.0 = top face.
  • origin: if set, the Empty's LOCAL axes become the deformation axes —
    this is how you bend in an arbitrary world direction.
  • lock_x / lock_y: pin those axes so deformation is uniaxial.

Author: Holoflow Studio / Dimona
Licence: CC0
"""

import bpy
import bmesh
import math

# ---------------------------------------------------------------------------
# Parameters — edit these before running
# ---------------------------------------------------------------------------

COLUMN_SEGMENTS    = 8       # longitudinal edge loops on the column
COLUMN_SIDES       = 6       # hexagonal cross-section
COLUMN_HEIGHT      = 2.0     # metres
COLUMN_RADIUS      = 0.25    # metres

TWIST_ANGLE        = math.pi * 1.5   # radians — 270° full twist
COLUMN_TAPER_LOWER = -0.6            # negative = narrower at bottom
COLUMN_TAPER_UPPER = 0.0             # no taper at top

HORN_HEIGHT        = 1.8
HORN_BASE_RADIUS   = 0.18
HORN_TIP_RADIUS    = 0.02
HORN_BEND_ANGLE    = math.radians(80)  # 80° outward arc

SPIKE_HEIGHT       = 1.5
SPIKE_BASE_RADIUS  = 0.14
SPIKE_STRETCH      = 0.6    # STRETCH factor; >0 = pulled toward +Z

OUTPUT_PATH        = "//hf_deform_props.glb"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def purge_orphans():
    bpy.ops.outliner.orphans_purge(
        num_deleted=0, do_linked_ids=True, do_local_ids=True, do_recursive=True
    )


def scene_reset():
    """Remove all mesh objects and their data from the scene."""
    for ob in list(bpy.context.scene.objects):
        if ob.type == 'MESH':
            me = ob.data
            bpy.data.objects.remove(ob, do_unlink=True)
            if me.users == 0:
                bpy.data.meshes.remove(me)
    purge_orphans()


def apply_stack(obj):
    """
    Bake the full modifier stack to a new mesh data block via depsgraph.
    Safe in headless/background scripts — does not call bpy.ops.
    """
    dg       = bpy.context.evaluated_depsgraph_get()
    eval_ob  = obj.evaluated_get(dg)
    baked_me = bpy.data.meshes.new_from_object(eval_ob, depsgraph=dg)
    obj.modifiers.clear()
    obj.data = baked_me
    return baked_me


def mark_all_sharp(me):
    """Mark every edge sharp + flat-shade all polys for faceted GLB export."""
    # Flat shading
    for poly in me.polygons:
        poly.use_smooth = False

    # Sharp edge attribute (Blender 5.1)
    attr = me.attributes.get("sharp_edge")
    if attr is None:
        attr = me.attributes.new("sharp_edge", 'BOOLEAN', 'EDGE')
    for datum in attr.data:
        datum.value = True
    me.update()


def add_material(name, r, g, b, roughness=0.6):
    """Create a flat-shaded Principled BSDF material and return it."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


# ---------------------------------------------------------------------------
# Prop 1: Twisted Column
# Technique: TAPER (lower half) + TWIST (full height)
# WHY stacking two mods: TAPER first narrows the base while keeping verts
#   on a predictable cylinder. TWIST then rotates each Z-slice, producing a
#   tapered-and-twisted silhouette. Reversing the order gives a different
#   (often incorrect) result: twist on a uniform cylinder, then taper the
#   twisted form — the taper squashes already-spiralled geometry unevenly.
# ---------------------------------------------------------------------------

def build_twisted_column():
    me = bpy.data.meshes.new("col_mesh")
    bm = bmesh.new()

    # Construct a segmented cylinder with hexagonal cross-section
    # bmesh.ops.create_cone generates a prism with top and bottom caps;
    # we want an open tube so we delete the cap faces afterward.
    result = bmesh.ops.create_cone(
        bm,
        cap_ends      = True,
        cap_tris      = False,
        segments      = COLUMN_SIDES,
        radius1       = COLUMN_RADIUS,
        radius2       = COLUMN_RADIUS,   # equal radii = cylinder
        depth         = COLUMN_HEIGHT,
    )

    # Edge-loop cuts to give SimpleDeformModifier vertices to displace.
    # Without loops, TWIST on a 2-ring prism just rotates the top face as a
    # rigid disk — the lateral edges never actually spiral.
    bmesh.ops.subdivide_edges(
        bm,
        edges   = [e for e in bm.edges if not e.is_boundary],
        cuts    = COLUMN_SEGMENTS,
        use_grid_fill = True,
    )

    bm.to_mesh(me)
    bm.free()
    me.update()

    ob = bpy.data.objects.new("hf_twisted_column", me)
    bpy.context.collection.objects.link(ob)
    ob.location = (-1.5, 0.0, COLUMN_HEIGHT * 0.5)

    # --- Modifier 1: TAPER (narrows the bottom half) ---
    taper = ob.modifiers.new("Taper", 'SIMPLE_DEFORM')
    taper.deform_method = 'TAPER'
    taper.factor        = COLUMN_TAPER_LOWER   # signed: negative = narrow at -Z
    taper.deform_axis   = 'Z'
    # Restrict effect to lower 60% of the column so the top stays full-width.
    # limits is (start, end) as fractions of the bounding-box height.
    taper.limits        = (0.0, 0.60)

    # --- Modifier 2: TWIST (full height) ---
    twist = ob.modifiers.new("Twist", 'SIMPLE_DEFORM')
    twist.deform_method = 'TWIST'
    twist.angle         = TWIST_ANGLE          # radians — 270°
    twist.deform_axis   = 'Z'
    # No limits restriction: apply full-height twist.
    twist.limits        = (0.0, 1.0)

    mat = add_material("col_mat", 0.25, 0.45, 0.72, roughness=0.55)
    ob.data.materials.append(mat)

    baked = apply_stack(ob)
    mark_all_sharp(baked)
    return ob


# ---------------------------------------------------------------------------
# Prop 2: Bent Horn
# Technique: TAPER (global, tip narrowing) + BEND (via rotated Empty)
# WHY an Empty as origin: SimpleDeformModifier always bends along the object's
#   LOCAL Z axis. To bend in world-X, you would need to rotate the object 90°,
#   but then re-apply transform — cumbersome and error-prone when scripting.
#   Using an Empty whose local +Y aligns with the desired bend plane means the
#   modifier reads the Empty's local axes for the deformation frame. The mesh
#   object stays axis-aligned (+Z up); the Empty carries the orientation.
# ---------------------------------------------------------------------------

def build_bent_horn():
    me = bpy.data.meshes.new("horn_mesh")
    bm = bmesh.new()

    # Cone: wide base, narrow tip
    bmesh.ops.create_cone(
        bm,
        cap_ends  = True,
        cap_tris  = False,
        segments  = 8,
        radius1   = HORN_BASE_RADIUS,
        radius2   = HORN_TIP_RADIUS,
        depth     = HORN_HEIGHT,
    )
    # Longitudinal cuts for smooth arc
    bmesh.ops.subdivide_edges(
        bm,
        edges         = [e for e in bm.edges if not e.is_boundary],
        cuts          = 16,
        use_grid_fill = True,
    )
    bm.to_mesh(me)
    bm.free()
    me.update()

    ob = bpy.data.objects.new("hf_bent_horn", me)
    bpy.context.collection.objects.link(ob)
    ob.location = (0.0, 0.0, HORN_HEIGHT * 0.5)

    # Taper modifier (full height) — narrows tip more aggressively
    taper = ob.modifiers.new("TaperHorn", 'SIMPLE_DEFORM')
    taper.deform_method = 'TAPER'
    taper.factor        = -0.4           # negative taper along Z → narrower at +Z
    taper.deform_axis   = 'Z'
    taper.limits        = (0.0, 1.0)

    # Empty to redirect the BEND axis
    # Rotation: 90° around X so the Empty's local Z aligns with world X.
    # BEND then arcs the horn outward in the X direction.
    origin_ob = bpy.data.objects.new("horn_bend_pivot", None)
    bpy.context.collection.objects.link(origin_ob)
    origin_ob.empty_display_type = 'ARROWS'
    origin_ob.rotation_euler     = (0.0, math.radians(90), 0.0)
    origin_ob.location           = ob.location.copy()

    bend = ob.modifiers.new("BendHorn", 'SIMPLE_DEFORM')
    bend.deform_method = 'BEND'
    bend.angle         = HORN_BEND_ANGLE   # 80° arc
    bend.deform_axis   = 'Z'
    bend.origin        = origin_ob         # <-- redirect to Empty's local frame

    mat = add_material("horn_mat", 0.88, 0.68, 0.22, roughness=0.4)
    ob.data.materials.append(mat)

    baked = apply_stack(ob)
    mark_all_sharp(baked)

    # Clean up the pivot Empty after baking (it's not needed in GLB)
    bpy.data.objects.remove(origin_ob, do_unlink=True)
    return ob


# ---------------------------------------------------------------------------
# Prop 3: Stretched Spike
# Technique: TAPER (full) then STRETCH on the upper third
# WHY STRETCH: STRETCH scales a cross-section band inward while pulling
#   vertex rows toward the band's end — like pulling taffy. Factor > 0
#   compresses the cross-section and elongates the form. Combined with TAPER
#   this produces a gem-like pulled crystal form useful as a stylised weapon
#   or architectural spike.
# STRETCH vs TAPER difference:
#   TAPER:   factor scales radius linearly from min_z to max_z limit.
#   STRETCH: factor introduces volume-preserving-ish radial squeeze at the
#            limits boundary, with a cosine-shaped radial profile.
#   Use TAPER for uniform cone narrowing; STRETCH for an organic 'pinch'.
# ---------------------------------------------------------------------------

def build_stretched_spike():
    me = bpy.data.meshes.new("spike_mesh")
    bm = bmesh.new()

    bmesh.ops.create_cone(
        bm,
        cap_ends  = True,
        cap_tris  = False,
        segments  = 8,
        radius1   = SPIKE_BASE_RADIUS,
        radius2   = SPIKE_BASE_RADIUS * 0.05,
        depth     = SPIKE_HEIGHT,
    )
    bmesh.ops.subdivide_edges(
        bm,
        edges         = [e for e in bm.edges if not e.is_boundary],
        cuts          = 20,
        use_grid_fill = True,
    )
    bm.to_mesh(me)
    bm.free()
    me.update()

    ob = bpy.data.objects.new("hf_stretched_spike", me)
    bpy.context.collection.objects.link(ob)
    ob.location = (1.5, 0.0, SPIKE_HEIGHT * 0.5)

    # Taper entire form
    taper = ob.modifiers.new("TaperSpike", 'SIMPLE_DEFORM')
    taper.deform_method = 'TAPER'
    taper.factor        = -0.55
    taper.deform_axis   = 'Z'
    taper.limits        = (0.0, 1.0)

    # STRETCH on the upper 40% — pinches the crystal waist and elongates tip
    stretch = ob.modifiers.new("StretchSpike", 'SIMPLE_DEFORM')
    stretch.deform_method = 'STRETCH'
    stretch.factor        = SPIKE_STRETCH
    stretch.deform_axis   = 'Z'
    stretch.limits        = (0.60, 1.0)   # only affect top 40%

    mat = add_material("spike_mat", 0.62, 0.22, 0.82, roughness=0.3)
    ob.data.materials.append(mat)

    baked = apply_stack(ob)
    mark_all_sharp(baked)
    return ob


# ---------------------------------------------------------------------------
# GLB export
# ---------------------------------------------------------------------------

def export_glb(objects, filepath):
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    for ob in objects:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(filepath),
        use_selection                        = True,
        export_format                        = 'GLB',
        export_apply                         = True,
        export_yup                           = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = 'WEBP',
        export_normals                       = True,
        export_colors                        = False,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

scene_reset()

col   = build_twisted_column()
horn  = build_bent_horn()
spike = build_stretched_spike()

export_glb([col, horn, spike], OUTPUT_PATH)
print("holoflow:done — hf_deform_props.glb written")
