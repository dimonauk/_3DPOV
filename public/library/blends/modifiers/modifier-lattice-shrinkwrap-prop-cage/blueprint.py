"""
blueprint.py — Lattice + Shrinkwrap: Non-Destructive Prop Deformation Cage
Blender 5.1  ·  CC0  ·  Holoflow Studio
public/library/blends/modifiers/modifier-lattice-shrinkwrap-prop-cage/

Technique overview
──────────────────
A shoulder pauldron is shaped without editing its topology, using two deform
modifiers evaluated in strict top-to-bottom order:

  1. LATTICE (top)       — Coarse 3×2×3 CV cage controls gross dome silhouette.
                           Edit eight outer control vertices; the prop follows.
  2. SHRINKWRAP (bottom) — Projects inner-contact verts to body_reference surface
                           using NEAREST_SURFACEPOINT + OUTSIDE wrap mode,
                           maintaining a SHRINKWRAP_OFFSET gap to prevent Z-fighting.

Stack order is the critical decision:
  Lattice fires FIRST — it reshapes the prop.
  Shrinkwrap fires SECOND — on the already-shaped mesh, snapping the contact ring
  to whatever body is assigned as the target.

Reversing the order (Shrinkwrap first, Lattice second) breaks the fit: the
lattice would override the surface snap every time you adjust a CV.

Run: Blender 5.1 → Scripting workspace → Run Script.
Outputs: modifier_lattice_shrinkwrap_prop.blend  ·  pauldron_prop.glb
"""

import bpy
import bmesh
import math

# ── Constants ────────────────────────────────────────────────────────────────
BODY_NAME    = "body_reference"
PROP_NAME    = "prop_pauldron"
LATTICE_NAME = "lattice_pauldron"
BLEND_PATH   = "//modifier_lattice_shrinkwrap_prop.blend"
GLB_PATH     = "//pauldron_prop.glb"

BODY_SEGS   = 8
BODY_RINGS  = 6
BODY_RADIUS = 0.5    # 50 cm — representative torso half-height

DOME_SEGS        = 8
DOME_RINGS_TOTAL = 8  # bmesh v_segments; upper hemisphere = 4 rings

LAT_U = 3   # width control vertices
LAT_V = 2   # depth control vertices  (front/back layer only)
LAT_W = 3   # height control vertices

SHRINKWRAP_OFFSET = 0.008   # 8 mm gap — avoids Z-fight at close-up render
VG_INNER = "inner_contact"  # vertex group for Shrinkwrap partial influence


# ── Scene ────────────────────────────────────────────────────────────────────
def _clean_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes):
        bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.lattices):
        bpy.data.lattices.remove(blk)


# ── Reference body ───────────────────────────────────────────────────────────
def _body_reference() -> bpy.types.Object:
    """
    Low-poly ellipsoid torso: guide surface only, never exported.
    Displayed WIRE so it remains visible during modelling without occluding the
    shaded prop.  hide_render prevents accidental appearance in final output.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=BODY_SEGS, ring_count=BODY_RINGS,
        radius=BODY_RADIUS, location=(0.0, 0.0, 0.0)
    )
    body = bpy.context.active_object
    body.name = BODY_NAME
    body.scale = (0.38, 0.22, 0.52)
    bpy.ops.object.transform_apply(scale=True)
    body.display_type = 'WIRE'
    body.hide_render  = True
    return body


# ── Prop mesh ────────────────────────────────────────────────────────────────
def _pauldron_mesh() -> bpy.types.Object:
    """
    Half-dome pauldron via bmesh.

    Steps:
      1. Full UV sphere (DOME_SEGS u × DOME_RINGS_TOTAL v).
      2. Delete every vertex where z < -0.005 — retains the upper hemisphere.
      3. Mark equatorial-ring verts (|z| < 0.028) as VG_INNER — the Shrinkwrap
         target group.  Only these verts snap to the body; the dome curvature
         (outer surface) remains free for the Lattice to control.
    """
    me = bpy.data.meshes.new(PROP_NAME)
    ob = bpy.data.objects.new(PROP_NAME, me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm,
        u_segments=DOME_SEGS,
        v_segments=DOME_RINGS_TOTAL,
        radius=0.22
    )
    bmesh.ops.delete(bm,
        geom=[v for v in bm.verts if v.co.z < -0.005],
        context='VERTS'
    )
    bm.to_mesh(me)
    bm.free()

    ob.location = (0.42, 0.0, 0.36)
    ob.scale    = (1.05, 0.80, 0.68)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    vg = ob.vertex_groups.new(name=VG_INNER)
    vg.add(
        [v.index for v in me.vertices if abs(v.co.z) < 0.028],
        1.0, 'REPLACE'
    )
    return ob


# ── Lattice cage ─────────────────────────────────────────────────────────────
def _lattice(prop: bpy.types.Object) -> bpy.types.Object:
    """
    3×2×3 (U×V×W) lattice centred on the prop.

    Why 3×2×3 and not finer?  Eight outer CVs is the minimum that gives
    meaningful dome-width, depth, and height control without overwhelming the
    artist.  Increasing LAT_U or LAT_W to 4+ adds CVs that are rarely needed
    for a single pauldron — save the resolution for organic forms.

    KEY_BSPLINE interpolation: deformation is smooth through every CV.
    KEY_LINEAR would produce kinks at each CV — suitable only for hard-surface
    Boolean-style deformation.
    """
    bpy.ops.object.add(type='LATTICE', location=prop.location)
    lat = bpy.context.active_object
    lat.name = LATTICE_NAME
    lat.scale = (0.28, 0.20, 0.22)
    bpy.ops.object.transform_apply(scale=True)

    lat.data.points_u = LAT_U
    lat.data.points_v = LAT_V
    lat.data.points_w = LAT_W
    lat.data.interpolation_type_u = 'KEY_BSPLINE'
    lat.data.interpolation_type_v = 'KEY_BSPLINE'
    lat.data.interpolation_type_w = 'KEY_BSPLINE'
    lat.display_type = 'WIRE'
    return lat


def _arch_lattice(lat: bpy.types.Object) -> None:
    """
    Pre-arch the top CVs so the dome peaks above the shoulder.

    3×2×3 lattice point index layout (U=width, V=depth, W=height):
      Index = w*(LAT_U*LAT_V) + v*LAT_U + u
      W=0 (bottom): indices  0-5
      W=1 (mid):    indices  6-11
      W=2 (top):    indices 12-17

    Pushing top-row CV.y backward (–) arches the dome away from the body
    front.  Flaring side CVs (u==0, u==2) widens the shoulder cap laterally.
    """
    pts = lat.data.points
    ARCH_Y  = 0.06   # top CVs pull back 6 cm — dome arches over shoulder
    FLARE_X = 0.04   # side CVs flare outward 4 cm

    for i, pt in enumerate(pts):
        w_layer = i // (LAT_U * LAT_V)
        u_col   = i  % LAT_U
        if w_layer == LAT_W - 1:
            pt.co.y -= ARCH_Y
        if u_col in (0, LAT_U - 1):
            pt.co.x += math.copysign(FLARE_X, pt.co.x)


# ── Modifier stack ───────────────────────────────────────────────────────────
def _modifiers(prop: bpy.types.Object,
               lat:  bpy.types.Object,
               body: bpy.types.Object) -> None:
    """
    Two modifiers, top-to-bottom evaluation order:

    [0] Lattice  — reshapes dome via CV cage; no vertex group restriction, so
                   every prop vertex participates in cage deformation.

    [1] Shrinkwrap — fires on the already-lattice-deformed mesh.  Only verts
                     in VG_INNER (equatorial ring) are snapped to body surface.
                     wrap_mode='OUTSIDE' + positive offset ensures contact verts
                     sit just outside the body at all lattice states.

    Failure mode: if you move modifier [1] above [0] (Shrinkwrap first), the
    contact verts snap to the body — then the Lattice immediately overrides
    those positions.  The prop lifts away from the body whenever a CV is moved.
    """
    bpy.context.view_layer.objects.active = prop

    lat_mod = prop.modifiers.new("Lattice_Cage", 'LATTICE')
    lat_mod.object = lat

    sw_mod = prop.modifiers.new("Shrinkwrap_Body", 'SHRINKWRAP')
    sw_mod.target       = body
    sw_mod.wrap_method  = 'NEAREST_SURFACEPOINT'
    sw_mod.wrap_mode    = 'OUTSIDE'
    sw_mod.offset       = SHRINKWRAP_OFFSET
    sw_mod.vertex_group = VG_INNER


# ── Material ─────────────────────────────────────────────────────────────────
def _material(prop: bpy.types.Object) -> None:
    """Dark gunmetal Principled BSDF — Holoflow Studio spatial-metal palette."""
    mat = bpy.data.materials.new("mat_gunmetal")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial');  out.location = (280, 0)
    pbr = nodes.new('ShaderNodeBsdfPrincipled');  pbr.location = (0, 0)

    pbr.inputs['Base Color'].default_value     = (0.03, 0.035, 0.04, 1.0)
    pbr.inputs['Metallic'].default_value       = 1.0
    pbr.inputs['Roughness'].default_value      = 0.25
    pbr.inputs['Coat Weight'].default_value    = 0.5
    pbr.inputs['Coat Roughness'].default_value = 0.12

    links.new(pbr.outputs['BSDF'], out.inputs['Surface'])
    prop.data.materials.append(mat)


# ── GLB export ───────────────────────────────────────────────────────────────
def _export_glb(prop: bpy.types.Object) -> None:
    """
    Apply modifiers in list order before export.  Modifier application produces
    a static mesh snapshot; the lattice cage and body reference are no longer
    referenced, so they are excluded from the GLB automatically (use_selection).

    Application order: Lattice first (bakes the dome shape), then Shrinkwrap
    (bakes the contact snap).  Reversing this would produce an incorrectly
    snapped mesh because Shrinkwrap needs the lattice-shaped vertex positions.
    """
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = prop
    prop.select_set(True)
    bpy.ops.object.mode_set(mode='OBJECT')

    for mod_name in [m.name for m in list(prop.modifiers)]:
        bpy.ops.object.modifier_apply(modifier=mod_name)

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        use_selection=True,
        export_apply=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[blueprint] GLB → {GLB_PATH}")


# ── Entry point ───────────────────────────────────────────────────────────────
def main() -> None:
    _clean_scene()
    body = _body_reference()
    prop = _pauldron_mesh()
    lat  = _lattice(prop)
    _arch_lattice(lat)
    _modifiers(prop, lat, body)
    _material(prop)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
    _export_glb(prop)
    print("[blueprint] done — modifier_lattice_shrinkwrap_prop.blend + pauldron_prop.glb")


if __name__ == "__main__":
    main()
