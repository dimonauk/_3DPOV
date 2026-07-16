"""
Python bpy.types.ShrinkwrapModifier — Surface Project & Decal Conform Pipeline
Technique: subdivided UV quad → PROJECT/-Z/ABOVE_SURFACE → conform to dome
terrain → apply → recalculate normals → GLB export for WebXR scene dressing.

WHY ShrinkwrapModifier over manual BVHTree raycast:
  mathutils.bvhtree.BVHTree.find_nearest() is the right choice when you need to
  query surface positions at scale inside a custom Python tool.  But for a
  one-shot mesh deformation — "conform this panel to that wall" —
  ShrinkwrapModifier wins: it handles concave targets via BVH internally,
  respects sharp-crease edges, preserves UV layout, and is non-destructive
  until apply().  The cost is one modifier-apply pass; the benefit is every
  vertex is independently projected with no manual looping overhead.

Blender 5.1 notes:
  ShrinkwrapModifier.wrap_method:
    'NEAREST_SURFACEPOINT' — BVH nearest-surface; no axis bias; can wander on
                             concave surfaces where multiple surface points are
                             equidistant.
    'PROJECT'              — ray along a configurable axis; predictable direction;
                             best for decals, floor stickers, wall panels.
    'NEAREST_VERTEX'       — snaps to nearest TARGET vertex, not surface face.
                             Produces a faceted conform; use for low-poly snap.
    'TARGET_PROJECT'       — ray along TARGET surface normals; best for wrapping
                             flat label onto a VRM character body without pinching.
  ShrinkwrapModifier.wrap_mode:
    'ON_SURFACE'     — lands exactly on surface; offset 0 clips into target.
    'ABOVE_SURFACE'  — OFFSET measured along the hit normal, not world Z.
                       Lifts decal uniformly away from tilted faces.  Required
                       for WebXR decals to prevent Z-fighting in Three.js.
    'OUTSIDE'        — offset along world axis; uniform only on horizontal faces.
  use_project_z + use_negative_direction:
    Both flags must be True together.  use_project_z selects the Z axis;
    use_negative_direction inverts to -Z (downward).  Positive direction shoots
    up — fine for ceilings but misses a dome you're standing above.
  use_invert_cull:
    When True, skips backfaces of the target (faces whose normal points away from
    the ray).  Disable for thin shell targets (a dome has inward-facing backfaces
    that would be skipped otherwise if cull were on — leave off for safety).
"""

import bpy
import bmesh
import math

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
SLUG              = "hf_shrinkwrap_decal"
DOME_SUBDIVISIONS = 4          # icosphere subdiv level; 4 → 1 280 tris
DOME_RADIUS       = 1.40       # dome outer radius (m)
DOME_NOISE_SCALE  = 0.45       # clouds texture noise scale
DOME_NOISE_DEPTH  = 4          # clouds octave depth
DOME_DISP_STRENGTH = 0.20      # displacement amplitude (m)
DECAL_HALF        = 0.32       # half-extent of flat quad (m)
DECAL_CUTS        = 8          # grid subdivisions per side; 8 → 81 verts
DECAL_LIFT_Z      = 0.12       # start height above dome apex (m); ray must clear
OFFSET            = 0.002      # above-surface normal lift for Z-fight prevention
EXPORT_PATH       = "//hf_shrinkwrap_decal.glb"


# ── SCENE SETUP ───────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.textures):
        for blk in list(col):
            col.remove(blk)


# ── DOME TARGET ───────────────────────────────────────────────────────────────

def make_dome() -> bpy.types.Object:
    """
    Half-icosphere dome — the ShrinkwrapModifier target.

    WHY icosphere over UV sphere:
      UV spheres have dense poles that compress the BVH tree unevenly.  Rays
      near the apex find many closely-packed tris; rays near the equator find
      coarser quads.  Icosphere subdivisions are uniform — every triangle has
      the same area, so the BVH spatial queries are equally fast everywhere.

    WHY noise displacement on the target:
      A smooth hemisphere conforms trivially.  Adding CLOUDS displacement (old-
      style texture, still present in Blender 5.1 and supported by DisplaceModifier)
      creates organic variation that demonstrates the modifier handling non-planar
      targets with arbitrary curvature — the practical case in a scene.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=DOME_SUBDIVISIONS,
        radius=DOME_RADIUS,
        location=(0.0, 0.0, 0.0),
    )
    dome = bpy.context.active_object
    dome.name = "hf_dome_target"

    # Clip to upper hemisphere — verts below the equator are removed.
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(dome.data)
    bm.verts.ensure_lookup_table()
    below = [v for v in bm.verts if v.co.z < -0.001]
    bmesh.ops.delete(bm, geom=below, context='VERTS')
    bmesh.update_edit_mesh(dome.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Noise displacement — bake to mesh before shrinkwrap.
    tex = bpy.data.textures.new("dome_noise", 'CLOUDS')
    tex.noise_scale = DOME_NOISE_SCALE
    tex.noise_depth = DOME_NOISE_DEPTH

    disp = dome.modifiers.new("Noise", 'DISPLACE')
    disp.texture        = tex
    disp.strength       = DOME_DISP_STRENGTH
    disp.texture_coords = 'LOCAL'   # LOCAL avoids world-scale jitter on move

    bpy.context.view_layer.objects.active = dome
    with bpy.context.temp_override(selected_objects=[dome]):
        bpy.ops.object.modifier_apply(modifier="Noise")

    return dome


# ── DECAL QUAD ────────────────────────────────────────────────────────────────

def make_decal_quad() -> bpy.types.Object:
    """
    Subdivided flat quad with planar UV.  Placed above the dome apex so
    downward (-Z) rays have a clear path to the dome surface.

    WHY subdivide before shrinkwrap:
      PROJECT mode snaps each VERTEX independently along the ray.  A plain quad
      has only 4 verts; the face interior stays flat because no intermediate
      verts exist to be projected.  DECAL_CUTS=8 produces 81 verts; each maps
      to its own dome surface hit → the decal drapes naturally over curvature.

    WHY planar UV before conform:
      UV coordinates are not affected by the ShrinkwrapModifier — they stay as
      authored.  Setting the UV in object space BEFORE conform means the texture
      maps correctly post-deformation.  If you set UV after conform you must work
      in the deformed coordinate space, which is awkward.
    """
    bm = bmesh.new()
    # create_grid size = HALF-extent (each axis spans -size … +size)
    bmesh.ops.create_grid(
        bm, x_segments=DECAL_CUTS, y_segments=DECAL_CUTS, size=DECAL_HALF
    )
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        face.smooth = True
        for loop in face.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (
                (co.x + DECAL_HALF) / (2.0 * DECAL_HALF),
                (co.y + DECAL_HALF) / (2.0 * DECAL_HALF),
            )
    bm.normal_update()
    mesh = bpy.data.meshes.new("hf_decal_mesh")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("hf_decal", mesh)
    bpy.context.collection.objects.link(obj)
    # Start above dome apex: DOME_RADIUS + DECAL_LIFT_Z ensures rays clear apex
    obj.location = (0.0, 0.0, DOME_RADIUS + DECAL_LIFT_Z)
    return obj


# ── SHRINKWRAP MODIFIER ───────────────────────────────────────────────────────

def apply_shrinkwrap(decal: bpy.types.Object,
                     target: bpy.types.Object) -> None:
    """
    Core conform step — PROJECT/-Z/ABOVE_SURFACE pattern.

    Why PROJECT over NEAREST_SURFACEPOINT:
      On a concave dome, several surface points can be equidistant from a vert
      near the interior — nearest-surface is ambiguous and can flip between
      iterations.  PROJECT shoots along -Z and takes the first (nearest) hit;
      the direction is always predictable regardless of curvature.

    Why ABOVE_SURFACE over ON_SURFACE + offset:
      With ON_SURFACE, 'offset' is added along WORLD +Z — uniform only on
      flat horizontal faces.  A 45° sloped face pushed 0.002 m in world +Z ends
      up 0.0014 m above the face (cos 45° × 0.002), not 0.002 m.  ABOVE_SURFACE
      measures OFFSET along the LOCAL HIT NORMAL, so the lift is exactly OFFSET
      metres perpendicular to the dome face, regardless of slope.
    """
    bpy.context.view_layer.objects.active = decal
    mod = decal.modifiers.new("Shrinkwrap_Conform", 'SHRINKWRAP')
    mod.wrap_method            = 'PROJECT'
    mod.target                 = target
    mod.offset                 = OFFSET
    mod.wrap_mode              = 'ABOVE_SURFACE'
    mod.use_project_z          = True
    mod.use_negative_direction = True   # downward (-Z)
    mod.use_positive_direction = False  # do not shoot upward
    mod.use_invert_cull        = False  # test both faces of thin dome

    with bpy.context.temp_override(selected_objects=[decal]):
        bpy.ops.object.modifier_apply(modifier="Shrinkwrap_Conform")

    # Recalculate normals after conform — pre-conform normals point +Z (flat
    # quad default); post-conform they should follow the dome curvature outward.
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(decal.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    bmesh.update_edit_mesh(decal.data)
    bpy.ops.object.mode_set(mode='OBJECT')


# ── DECAL MATERIAL ────────────────────────────────────────────────────────────

def make_decal_material(obj: bpy.types.Object) -> None:
    """
    Emissive teal ground-marker material.

    blend_method='BLEND' + shadow_method='NONE':
      The decal quad is paper-thin; casting shadows from it produces incorrect
      artefacts (a faint copy of the dome displaced slightly).  NONE removes
      shadow contribution.  BLEND allows the base pass to show through if the
      dome surface is visible beneath the decal edge — cleaner compositing in
      EEVEE and more accurate in Three.js.

    Alpha handled via mix shader (Principled base α=0 + Emission strength=2.5):
      WebXR EEVEE / Three.js prefers a single mix of a transparent base and an
      emissive layer over using Principled Alpha, because Principled transmission
      and emission interact inconsistently across renderers.
    """
    mat = bpy.data.materials.new("hf_decal_mat")
    mat.use_nodes     = True
    mat.blend_method  = 'BLEND'
    mat.shadow_method = 'NONE'
    tree  = mat.node_tree
    nodes = tree.nodes
    links = tree.links
    nodes.clear()

    out   = nodes.new('ShaderNodeOutputMaterial')
    bsdf  = nodes.new('ShaderNodeBsdfPrincipled')
    emit  = nodes.new('ShaderNodeEmission')
    mix   = nodes.new('ShaderNodeMixShader')
    col   = nodes.new('ShaderNodeRGB')

    col.outputs[0].default_value = (0.08, 0.90, 0.40, 1.0)
    bsdf.inputs['Alpha'].default_value    = 0.0
    emit.inputs['Strength'].default_value = 2.5
    mix.inputs['Fac'].default_value       = 0.85

    links.new(col.outputs[0],  emit.inputs['Color'])
    links.new(bsdf.outputs[0], mix.inputs[1])
    links.new(emit.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0],  out.inputs['Surface'])

    obj.data.materials.append(mat)


# ── EXPORT ────────────────────────────────────────────────────────────────────

def export_glb(dome: bpy.types.Object,
               decal: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    dome.select_set(True)
    decal.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=False,   # modifier already applied
        export_yup=True,
    )
    print(f"[holoflow] exported → {EXPORT_PATH}")


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    dome  = make_dome()
    decal = make_decal_quad()
    apply_shrinkwrap(decal, dome)
    make_decal_material(decal)
    export_glb(dome, decal)
    print(f"[holoflow] {SLUG} complete")


if __name__ == "__main__":
    main()
