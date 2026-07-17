"""
Python bpy.types.NormalEditModifier — Radial Fake Spherical Normals
Cel-shade faceted gem: smooth toon lighting on flat-polygon geometry.

Technique: NormalEditModifier in RADIAL mode replaces each vertex's normal
with a vector pointing radially away from a target object's origin.  A flat
polygon face shades as if it were a smooth sphere — the core technique
behind anime-style toon cel-shading on low-poly characters and props.

WHY this over Smooth by Angle (SMOOTH_BY_ANGLE):
  SBA averages adjacent face normals at shared vertices — it can only soften
  the shading at topology boundaries; it cannot produce normals that aim
  towards a geometric centre when the source faces are flat.  NormalEdit
  overrides the normal direction entirely, decoupling visual smoothness from
  polygon count and adjacency.

WHY this over custom split normals (normals_split_custom_set):
  Non-destructive — the modifier can be toggled, reordered, or adjusted
  without touching the mesh data block.  The target Empty drives the sphere
  centre live; moving it updates all normals without re-baking.
  mix_factor + vertex_group gives per-vertex fade from flat to spherical.

Blender 5.1 critical requirements:
  1. shade_smooth=True (or SMOOTH_BY_ANGLE in stack) must be active.
     Flat-shaded geometry ignores custom normals — the pipeline clamps every
     loop normal to its face normal before rasterisation.
  2. export_normals=True in the GLB exporter is mandatory.  Without it,
     Three.js recomputes face normals from geometry at load time and discards
     the baked sphere normals with no warning.
  3. Target object must exist and be in the same scene/view-layer.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
SLUG             = "hf_normal_edit_gem"
GEM_SCALE_Z      = 1.35          # elongate icosphere → taller gem silhouette
DISSOLVE_ANGLE   = math.radians(20.0)  # limited_dissolve merges near-coplanar tris
MIX_FACTOR       = 0.90          # 0 = raw face normals, 1 = pure sphere normals
                                  # 0.9 retains a subtle facet at silhouette edges
BASE_Z_THRESHOLD = -0.10         # verts below this Z are assigned BASE weight
BASE_GRP_WEIGHT  = 0.20          # crown-base verts → mostly flat normals
TOP_GRP_WEIGHT   = 1.00          # mid + top verts → full sphere normals
EXPORT_PATH      = "//hf_normal_edit_gem.glb"


# ─── SCENE SETUP ──────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for blk in list(bpy.data.meshes):   bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.materials): bpy.data.materials.remove(blk)
    for blk in list(bpy.data.objects):  bpy.data.objects.remove(blk)


# ─── GEOMETRY — FACETED GEM ───────────────────────────────────────────────────

def build_gem():
    """
    Build a low-poly gem from a level-1 icosphere.

    limited_dissolve at 20° collapses the 20 original triangles into
    approximately 8–12 larger polygons — a typical gem silhouette.
    Scaling Z to 1.35 elongates the shape without adding topology.
    The result is shade-smooth so custom normals take effect.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.7, location=(0, 0, 0))
    gem = bpy.context.active_object
    gem.name = SLUG

    # Scale into gem silhouette in edit mode to preserve origin at centre
    bm = bmesh.new()
    bm.from_mesh(gem.data)
    bmesh.ops.scale(bm, vec=(1.0, 1.0, GEM_SCALE_Z), verts=bm.verts)
    bmesh.ops.limited_dissolve(bm, verts=bm.verts, angle_limit=DISSOLVE_ANGLE)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(gem.data)
    bm.free()

    # shade_smooth is mandatory — flat shading ignores custom normals entirely
    gem.data.shade_smooth()
    return gem


# ─── NORMAL TARGET EMPTY ──────────────────────────────────────────────────────

def build_normal_target():
    """
    Place an Empty at world origin — the gem is centred here.

    NormalEditModifier RADIAL mode computes each vertex normal as:
        (vertex_world_pos - target_origin).normalized()
    An Empty at the gem's geometric centre produces perfect sphere normals.
    If you move the Empty off-centre, normals tilt toward/away from the new
    centre, creating an asymmetric soft-lighting effect useful for face rigs.
    """
    bpy.ops.object.empty_add(type='SPHERE', location=(0, 0, 0))
    empty = bpy.context.active_object
    empty.name = "normal_target"
    empty.empty_display_size = 0.15
    return empty


# ─── VERTEX GROUP — MIX GRADIENT ──────────────────────────────────────────────

def assign_mix_group(gem):
    """
    Build a 'NE_Mix' vertex group to drive mix_factor per-vertex.

    Base verts (Z < BASE_Z_THRESHOLD) get low weight → stay mostly flat.
    Upper verts get full weight → full sphere normals.

    WHY: a gem sitting on a surface looks odd if its bottom face has the
    same rounded normals as its crown — the ground-contact edge would shade
    as if it were the bottom of a floating sphere.  Fading the weight to 0.2
    at the base keeps a subtle flat ground indication while the crown glows.
    """
    grp = gem.vertex_groups.new(name="NE_Mix")
    mesh = gem.data

    base_idxs = [v.index for v in mesh.vertices if v.co.z < BASE_Z_THRESHOLD]
    top_idxs  = [v.index for v in mesh.vertices if v.co.z >= BASE_Z_THRESHOLD]

    grp.add(base_idxs, BASE_GRP_WEIGHT, 'REPLACE')
    grp.add(top_idxs,  TOP_GRP_WEIGHT,  'REPLACE')
    return grp


# ─── NORMAL EDIT MODIFIER ─────────────────────────────────────────────────────

def add_normal_edit_modifier(gem, empty, vgroup_name):
    """
    Add NormalEditModifier in RADIAL mode.

    mode='RADIAL':
        Each vertex normal points radially away from target.location.
        The result mimics normals of a sphere centred at the Empty.

    mode='DIRECTIONAL':
        All vertex normals point in the same direction (towards target).
        Good for fake-planar projection normals, e.g. billboards or
        ground-plane reflections.

    mix_mode='COPY' (default):
        At mix_factor=0.0 → original normals untouched.
        At mix_factor=1.0 → fully replaced by spherical normals.
        Intermediate values interpolate via vector Lerp + normalise.

    mix_limit (radians):
        Only apply the mix if the angle between original and computed normals
        is below this limit.  Default math.pi (no restriction).
        Set to math.radians(90) to restrict to front-facing hemisphere only.

    use_flat_normals=True:
        Base the interpolation on face normals (flat) rather than pre-smooth
        vertex normals.  Use when you want facet edges to remain hard while
        only the per-face shade changes.  Default False (uses smooth normals).

    no_polynors_fix=False (default):
        Allows the modifier to correct winding inconsistencies in the result.
        Leave False unless you intentionally have back-facing polygons.
    """
    mod = gem.modifiers.new("NormalEdit", 'NORMAL_EDIT')
    mod.mode           = 'RADIAL'
    mod.target         = empty
    mod.mix_factor     = MIX_FACTOR
    mod.mix_mode       = 'COPY'
    mod.mix_limit      = math.pi          # no angular restriction
    mod.use_flat_normals   = False        # start from smooth vertex normals
    mod.no_polynors_fix    = False
    mod.vertex_group   = vgroup_name
    mod.invert_vertex_group = False
    # offset: XYZ shift of the computed origin in LOCAL space.
    # Leave at (0,0,0) — our Empty is already at the gem's world centre.
    mod.offset = (0.0, 0.0, 0.0)
    return mod


# ─── MATERIAL ─────────────────────────────────────────────────────────────────

def add_material(gem):
    """Principled BSDF material — base colour only, no textures for GLB clarity."""
    mat = bpy.data.materials.new(name=SLUG + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value    = (0.12, 0.45, 0.72, 1.0)
    bsdf.inputs["Metallic"].default_value      = 0.0
    bsdf.inputs["Roughness"].default_value     = 0.18
    bsdf.inputs["Specular IOR Level"].default_value = 0.85
    gem.data.materials.append(mat)


# ─── BAKE VIA DEPSGRAPH (HEADLESS-SAFE) ──────────────────────────────────────

def bake_normals(gem):
    """
    Evaluate the modifier stack and write computed normals into the mesh.

    evaluated_get(depsgraph) returns a read-only evaluated object.
    new_from_object() collapses the full modifier stack (including
    NormalEditModifier) into a new Mesh with normals pre-computed.
    We swap the data block and clear the modifier list — the exported
    GLB contains the baked spherical normals as static NORMAL data.

    IMPORTANT: do NOT call bpy.ops.object.modifier_apply() in headless
    scripts — it requires an active VIEW_3D context and raises RuntimeError.
    The depsgraph path is the only reliable headless-safe bake route.
    """
    scene     = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    obj_eval  = gem.evaluated_get(depsgraph)

    baked = bpy.data.meshes.new_from_object(obj_eval, depsgraph=depsgraph)
    old   = gem.data
    gem.data = baked
    gem.modifiers.clear()
    bpy.data.meshes.remove(old)
    baked.update()
    return baked


# ─── GLB EXPORT ───────────────────────────────────────────────────────────────

def export_glb(gem):
    """
    Export as a Draco-compressed, +Y-up GLB.

    export_normals=True writes the custom (sphere) normals to the NORMAL
    accessor.  Omitting this flag makes Three.js recompute flat normals from
    geometry — the entire NormalEdit pass is silently discarded.

    export_apply=False because we already baked the modifier stack above;
    the mesh data block contains the final geometry and normals.
    """
    gem.select_set(True)
    bpy.context.view_layer.objects.active = gem

    bpy.ops.export_scene.gltf(
        filepath      = bpy.path.abspath(EXPORT_PATH),
        use_selection = True,
        export_format = 'GLB',
        export_apply  = False,          # stack already baked
        export_normals = True,          # CRITICAL — write sphere normals
        export_yup    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
    )
    print(f"[holoflow] exported {EXPORT_PATH}")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    clear_scene()
    gem   = build_gem()
    empty = build_normal_target()
    grp   = assign_mix_group(gem)
    add_normal_edit_modifier(gem, empty, grp.name)
    add_material(gem)
    bake_normals(gem)
    export_glb(gem)
    print(f"[holoflow] blueprint complete — {len(gem.data.vertices)} verts, "
          f"{len(gem.data.polygons)} faces")


if __name__ == "__main__":
    main()
