"""
Array Modifier + Curve Deform — Procedural Chain / Rope Along Curve
Blender 5.1  |  CC0  |  Holoflow Studio

TECHNIQUE OVERVIEW
==================
Two modifiers co-operate to produce an infinitely-adjustable chain or rope:

  1. Array  — repeats a single link segment end-to-end.
  2. Curve  — bends the resulting straight strip around an arbitrary Bezier
              curve without distorting individual links.

The key insight is offset type:  Array with Fit Curve mode counts how many
copies fill the curve's arc-length, so when you reshape the curve the link
count updates automatically.  The Curve modifier then deforms the already-
tiled mesh to follow the path.  Neither modifier knows about the other;
they co-operate because bpy applies modifiers in stack order (Array fires
first, Curve fires on the output).

For a chain, the link is a torus-segment (NOT a full torus — a half-arc of
rectangular cross-section) oriented so its X-axis is the travel direction.
Alternating links are rotated 90° around X so they interlock like a real
bicycle chain.  This alternation is baked into a single two-link object
before Array runs.

For a rope, the link is a single short cylinder, twisted 15° per segment;
the cumulative twist approximates a three-strand helical braid.

PARAMETERS (edit here)
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# ── USER PARAMETERS ──────────────────────────────────────────────────────────
PRESET          = "CHAIN"      # "CHAIN" or "ROPE"
LINK_WIDTH      = 0.08         # outer radius of chain link (m)
LINK_THICKNESS  = 0.015        # cross-section radius of wire/rope strand (m)
LINK_GAP        = 0.003        # clearance between interlocked links (m)
LINK_SEGMENTS   = 8            # resolution of each link cross-section
BEVEL_DEPTH     = 0.002        # rope cylinder bevel (cosmetic rounding)
CURVE_POINTS    = [            # control points for the guide path (world-space)
    (0,  0, 0),
    (0,  1.2, 0.4),
    (0,  2.4, 0),
    (0.6, 2.8, 0.2),
    (1.2, 2.4, 0),
]
CURVE_CYCLIC    = False        # True = closed loop (necklace, belt drive)
CHAIN_MAT_COLOR = (0.55, 0.52, 0.48, 1.0)   # warm steel
ROPE_MAT_COLOR  = (0.62, 0.42, 0.24, 1.0)   # manila hemp
# ─────────────────────────────────────────────────────────────────────────────

# ── CLEAN SCENE ──────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

def make_material(name: str, color: tuple) -> bpy.types.Material:
    """Minimal Principled BSDF, metallic for chain, rough for rope."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    if PRESET == "CHAIN":
        bsdf.inputs["Metallic"].default_value  = 0.9
        bsdf.inputs["Roughness"].default_value = 0.35
    else:
        bsdf.inputs["Metallic"].default_value  = 0.0
        bsdf.inputs["Roughness"].default_value = 0.85
    return mat


# ── GUIDE CURVE ──────────────────────────────────────────────────────────────
def make_guide_curve() -> bpy.types.Object:
    """
    Bezier curve in world space.  The curve object's X-axis is the
    deform axis that Curve modifier maps link-objects onto.

    WHY a Bezier rather than NURBS?  Bezier handles are easier to hand-
    edit in viewport and the arc-length calculation used by Array's
    Fit Curve mode is identical for both types.
    """
    curve_data = bpy.data.curves.new("guide_path", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.use_fill_caps = False

    spline = curve_data.splines.new('BEZIER')
    spline.use_cyclic_u = CURVE_CYCLIC
    spline.bezier_points.add(len(CURVE_POINTS) - 1)

    for i, pt in enumerate(CURVE_POINTS):
        bp = spline.bezier_points[i]
        bp.co = Vector(pt)
        # Auto handles — Blender computes smooth tangents automatically
        bp.handle_left_type  = 'AUTO'
        bp.handle_right_type = 'AUTO'

    obj = bpy.data.objects.new("guide_path", curve_data)
    bpy.context.collection.objects.link(obj)
    return obj


# ── CHAIN LINK GEOMETRY ───────────────────────────────────────────────────────
def make_chain_link_pair(mat: bpy.types.Material) -> bpy.types.Object:
    """
    Build a two-link interlock (one horizontal + one vertical).
    Each link is a rectangular-cross-section torus (D-ring style):
      - Major radius  = LINK_WIDTH
      - Minor radius  = LINK_THICKNESS
      - Arc           = π (half torus) to leave gap for the crossing link

    The pair total X-extent equals exactly 2 × link pitch; Array uses
    Constant Offset = link_pitch so the ends meet with LINK_GAP clearance.

    WHY two links in the base unit, not one?  Array copies the object
    as a rigid body.  If we only copy one horizontal link, all copies
    are parallel — no interlocking.  By baking the alternation into the
    unit cell, Array reproduces the correct chain topology for free.
    """
    bm_pair = bmesh.new()

    # Helper: generate a half-torus (π arc) as bmesh geometry
    def add_half_torus(bm: bmesh.types.BMesh,
                       major_r: float,
                       minor_r: float,
                       segs_major: int = 12,
                       segs_minor: int = 8,
                       transform: Matrix = Matrix.Identity(4)):
        """
        Arc from -π/2 to +π/2, oriented so the open ends face ±X.
        Returns a list of added BMVerts so the caller can fill faces.
        """
        verts = []
        for i in range(segs_major + 1):
            # θ sweeps the major arc: -90° to +90°
            theta = -math.pi / 2 + math.pi * i / segs_major
            cx = major_r * math.cos(theta)
            cy = major_r * math.sin(theta)
            for j in range(segs_minor):
                phi = 2 * math.pi * j / segs_minor
                # minor circle centred at (cx, cy)
                nx = math.cos(theta) * math.cos(phi)
                nz = math.sin(phi)
                x = cx + minor_r * nx
                y = cy + minor_r * math.cos(theta) * math.cos(phi)  # tangential
                z = minor_r * nz
                # WHY tangential term for Y? because the minor ring tangent
                # must track the major ring tangent (Frenet–Serret frame).
                # A simpler formula ignores this and produces a twisted tube.
                v = bm.verts.new(transform @ Vector((x, y, z)))
                verts.append(v)
        # Build quad faces along the minor strips
        for i in range(segs_major):
            for j in range(segs_minor):
                j_next = (j + 1) % segs_minor
                a = verts[i       * segs_minor + j]
                b = verts[i       * segs_minor + j_next]
                c = verts[(i + 1) * segs_minor + j_next]
                d = verts[(i + 1) * segs_minor + j]
                bm.faces.new([a, b, c, d])
        return verts

    # Link A — horizontal (lies in XY plane, open ends at ±X)
    # Travel axis = X, so the open face of the torus faces along X
    pitch = 2 * LINK_WIDTH + LINK_GAP   # distance centre-to-centre between links
    half_pitch = pitch / 2

    # Link A sits at X = -half_pitch, centred on Y=0, Z=0
    xform_a = Matrix.Translation(Vector((-half_pitch, 0, 0)))
    add_half_torus(bm_pair, LINK_WIDTH, LINK_THICKNESS,
                   segs_major=LINK_SEGMENTS * 2,
                   segs_minor=LINK_SEGMENTS,
                   transform=xform_a)

    # Link B — same geometry, rotated 90° around X and shifted +half_pitch
    # Rotation 90° about X: Y→Z, Z→-Y (right-hand rule)
    rot90x = Matrix.Rotation(math.pi / 2, 4, 'X')
    xform_b = Matrix.Translation(Vector((half_pitch, 0, 0))) @ rot90x
    add_half_torus(bm_pair, LINK_WIDTH, LINK_THICKNESS,
                   segs_major=LINK_SEGMENTS * 2,
                   segs_minor=LINK_SEGMENTS,
                   transform=xform_b)

    bm_pair.normal_update()
    mesh = bpy.data.meshes.new("chain_link_pair")
    bm_pair.to_mesh(mesh)
    bm_pair.free()
    mesh.materials.append(mat)

    obj = bpy.data.objects.new("chain_link_pair", mesh)
    bpy.context.collection.objects.link(obj)
    return obj, pitch * 2   # return object AND the total X-extent of two links


# ── ROPE SEGMENT ──────────────────────────────────────────────────────────────
def make_rope_segment(mat: bpy.types.Material) -> tuple:
    """
    A single short cylinder (one rope segment).  A 15° cumulative twist
    per copy simulates a three-strand helical braid.

    WHY 15° and not 120° (one full strand revolution)?  120° per copy
    gives correct single-strand repeat but the visual reads as smooth
    rotation.  15° is a smaller angular step that, when accumulated
    across many copies, produces a convincing braid rhythm at the
    viewport framerate of a turntable animation.

    The Relative Offset mode is NOT used here — we use Constant Offset
    along X exactly equal to cylinder height so copies butt against each
    other without gap.
    """
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=LINK_THICKNESS * 3,
        depth=LINK_THICKNESS * 4,
        location=(0, 0, 0),
        rotation=(0, math.pi / 2, 0),   # cylinder axis → X-axis (travel direction)
    )
    seg = bpy.context.active_object
    seg.name = "rope_segment"

    # Bevel edges for cosmetic rounding
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.bevel(offset=BEVEL_DEPTH, segments=2, affect='EDGES')
    bpy.ops.object.mode_set(mode='OBJECT')

    seg.data.materials.append(mat)
    return seg, LINK_THICKNESS * 4   # (object, segment X-length)


# ── MODIFIER STACK ────────────────────────────────────────────────────────────
def apply_modifier_stack(
        obj: bpy.types.Object,
        curve_obj: bpy.types.Object,
        segment_length: float,
        twist_per_copy_deg: float = 0.0,
) -> None:
    """
    Adds Array + Curve modifiers to `obj`.

    ARRAY — Fit Curve mode
    ----------------------
    fit_type = 'FIT_CURVE': the modifier queries the curve's arc-length
    at every depsgraph evaluation and sets count = ceil(arc / segment_length).
    If you reshape the curve in edit mode, the count updates live.

    Constant Offset X = segment_length: copies are placed end-to-end.
    Relative Offset is set to 0 (off) so only our constant offset applies.

    merge_threshold: welds coincident vertices at shared ends.  Vital for
    manifold geometry in 3D-print workflows.  Here disabled so each link
    stays a separate mesh island (necessary for chain gap physics later).

    CURVE — Deform axis X
    ---------------------
    deform_axis = 'POS_X': bends the object's local X-axis to follow the
    curve.  The link pair was built with X as travel axis, so this matches.

    The curve modifier effectively applies a parametric warp: each vertex
    is projected onto the nearest curve point, the tangent provides the
    new X direction, the curve normal provides Y, and the binormal provides
    Z.  This preserves cross-section shape (the torus profile) while
    steering it around corners.

    CRITICAL: both modifiers reference the same curve_obj.  If the curve
    is transformed (moved, scaled), both modifiers are affected.  Best
    practice: reset the curve object's origin to the start of its first
    control point before any transforms.
    """
    # Array
    mod_arr = obj.modifiers.new("Array", 'ARRAY')
    mod_arr.fit_type        = 'FIT_CURVE'
    mod_arr.curve           = curve_obj
    mod_arr.use_constant_offset = True
    mod_arr.constant_offset_displace = (segment_length, 0.0, 0.0)
    mod_arr.use_relative_offset = False
    mod_arr.use_merge_vertices  = False   # keep links separate

    if twist_per_copy_deg != 0.0:
        # Rope: each copy rotates slightly around X via Object Offset
        # We use an empty rotated by twist_per_copy_deg as the offset object.
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
        twist_empty = bpy.context.active_object
        twist_empty.name = "rope_twist_empty"
        twist_empty.rotation_euler.x = math.radians(twist_per_copy_deg)
        twist_empty.location.x = segment_length   # translate by one segment
        mod_arr.use_object_offset  = True
        mod_arr.offset_object      = twist_empty
        mod_arr.use_constant_offset = False        # object offset replaces constant

    # Curve
    mod_crv = obj.modifiers.new("Curve", 'CURVE')
    mod_crv.object       = curve_obj
    mod_crv.deform_axis  = 'POS_X'


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    mat = make_material(
        "chain_steel" if PRESET == "CHAIN" else "rope_hemp",
        CHAIN_MAT_COLOR if PRESET == "CHAIN" else ROPE_MAT_COLOR,
    )
    guide = make_guide_curve()

    if PRESET == "CHAIN":
        link_obj, seg_len = make_chain_link_pair(mat)
        apply_modifier_stack(link_obj, guide, seg_len, twist_per_copy_deg=0.0)
        link_obj.name = "chain_rope"
    else:
        seg_obj, seg_len = make_rope_segment(mat)
        apply_modifier_stack(seg_obj, guide, seg_len, twist_per_copy_deg=15.0)
        seg_obj.name = "chain_rope"

    # ── LIGHTING: sun + rim ──────────────────────────────────────────────
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 8))
    sun = bpy.context.active_object
    sun.data.energy        = 3.5
    sun.rotation_euler.x   = math.radians(45)
    sun.rotation_euler.z   = math.radians(-30)

    bpy.ops.object.light_add(type='AREA', location=(-2, 3, 4))
    rim = bpy.context.active_object
    rim.data.energy = 80.0
    rim.data.size   = 1.5

    # ── CAMERA ───────────────────────────────────────────────────────────
    bpy.ops.object.camera_add(location=(2.2, -2.8, 1.8))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(66), 0, math.radians(38))
    bpy.context.scene.camera = cam

    # ── RENDER SETTINGS (EEVEE Next) ─────────────────────────────────────
    scene = bpy.context.scene
    scene.render.engine              = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.film_transparent     = True
    scene.eevee.taa_render_samples   = 64

    # ── NAME SCENE ROOT FOR HOLOFLOW EXPORT ─────────────────────────────
    bpy.data.objects["chain_rope"]["holoflow:facet"] = False

    # ── GLB EXPORT ───────────────────────────────────────────────────────
    # Apply modifiers so the GLB carries the resolved mesh (no live GN graph).
    import os, pathlib
    out_dir  = pathlib.Path(bpy.path.abspath("//"))
    glb_path = str(out_dir / "chain_rope.glb")

    bpy.ops.export_scene.gltf(
        filepath          = glb_path,
        export_format     = 'GLB',
        export_apply      = True,          # bake Array + Curve into static mesh
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = 'WEBP',
        export_materials  = 'EXPORT',
    )
    print(f"[holoflow] GLB written → {glb_path}")


main()
