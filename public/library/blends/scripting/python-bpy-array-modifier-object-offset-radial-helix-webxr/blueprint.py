"""
bpy.types.ArrayModifier — Object-Offset Radial Crown & Helix Stack for WebXR
Blender 5.1 | CC0

ArrayModifier tiles a source mesh along an accumulating transform chain.
The per-step delta is computed from up to three *additive* offset modes:
  use_relative_offset  — fraction of the source bounding box (on by default)
  use_constant_offset  — fixed metres per step
  use_object_offset    — Empty's local matrix relative to the array origin

The object-offset mode is the least-documented: the per-step transform is
  T_step = inv(T_src_world) @ T_empty_world
so an Empty placed exactly at the source object's world origin with only a
Z rotation of (360°/N) produces a perfect N-fold radial copy with NO
translation. Crucially you must set use_relative_offset=False or the bbox
offset compounds with the rotation and breaks the symmetry.
"""

import bpy
import bmesh
import math
from mathutils import Matrix

# ── Named constants ───────────────────────────────────────────────────────────
GEM_SEGS       = 6       # hexagonal prism; divisible into Draco-efficient tris
GEM_HEIGHT     = 0.28    # m
GEM_BASE_R     = 0.065   # m

CROWN_N        = 8       # spokes; 360°/8 = 45° per step → exact symmetry
CROWN_RING_R   = 0.44    # m — gem base offset from scene origin
CROWN_TILT_DEG = 20.0    # outward tilt baked into gem mesh before array

HELIX_N        = 20      # bead count
HELIX_RING_R   = 0.30    # m — bead orbit radius
HELIX_ROT_DEG  = 18.0    # Z rotation per step (20 × 18° = 360°)
HELIX_RISE_Z   = 0.065   # m Z rise per step → total height = N × HELIX_RISE_Z

GLB_PATH       = "//hf_array_crown_helix.glb"


# ── Source mesh: tapered hexagonal gem ───────────────────────────────────────
def build_gem() -> bpy.types.Object:
    """
    Hex prism shaft topped by a tapered shoulder and apex — all flat faces,
    ideal for the studio's faceted low-poly aesthetic.
    Tilt is baked by transform_apply so every arrayed copy inherits it.
    """
    bm = bmesh.new()
    n  = GEM_SEGS
    r  = GEM_BASE_R
    h  = GEM_HEIGHT
    da = math.tau / n

    cos_a = [math.cos(i * da) for i in range(n)]
    sin_a = [math.sin(i * da) for i in range(n)]

    base      = [bm.verts.new((r * cos_a[i], r * sin_a[i], 0.0))       for i in range(n)]
    mid       = [bm.verts.new((r * cos_a[i], r * sin_a[i], h * 0.52))  for i in range(n)]
    shoulder  = [bm.verts.new((r * 0.42 * cos_a[i],
                                r * 0.42 * sin_a[i], h * 0.80))         for i in range(n)]
    apex      = bm.verts.new((0.0, 0.0, h))
    tip       = bm.verts.new((0.0, 0.0, -0.04))  # short base tip for visual weight

    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([base[j], base[i], tip])              # bottom fan
        bm.faces.new([base[j], base[i], mid[i], mid[j]])   # shaft wall
        bm.faces.new([mid[j],  mid[i],  shoulder[i], shoulder[j]])  # shoulder
        bm.faces.new([shoulder[i], shoulder[j], apex])     # apex fan

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("hf_gem")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("hf_gem", mesh)
    bpy.context.collection.objects.link(obj)

    # Tilt outward: bake so array copies inherit the tilt
    obj.location.x    = CROWN_RING_R
    obj.rotation_euler.y = math.radians(CROWN_TILT_DEG)
    bpy.context.view_layer.objects.active = obj
    with bpy.context.temp_override(selected_objects=[obj]):
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return obj


# ── Pattern A: radial crown using a rotation-only Empty ──────────────────────
def add_crown_array(gem: bpy.types.Object) -> bpy.types.Object:
    """
    Object-offset with Empty at (0,0,0), z-rotation = 360°/CROWN_N.
    Because the Empty is at the scene origin and the gem is at CROWN_RING_R,
    the first copy is rotated 45° around the origin, placing it on the ring —
    pure rotation, zero translation, perfect radial symmetry.

    Key rule: use_relative_offset MUST be False. If left True, Blender adds
    the bounding-box stride to every step, displacing each copy radially
    and breaking the ring geometry.
    """
    empty = bpy.data.objects.new("hf_crown_pivot", None)
    empty.empty_display_type = 'SINGLE_ARROW'
    bpy.context.collection.objects.link(empty)
    empty.location         = (0.0, 0.0, 0.0)          # MUST sit at array origin
    empty.rotation_euler.z = math.tau / CROWN_N        # radians

    mod = gem.modifiers.new("Crown_Array", 'ARRAY')
    mod.fit_type            = 'FIXED_COUNT'
    mod.count               = CROWN_N
    mod.use_relative_offset = False   # ← critical; see docstring above
    mod.use_constant_offset = False
    mod.use_object_offset   = True
    mod.offset_object       = empty
    mod.use_merge_vertices  = False   # gems are discrete — no shared boundary
    return empty


# ── Pattern B: helix bead chain using rotation + translation Empty ────────────
def build_helix_chain() -> tuple[bpy.types.Object, bpy.types.Object]:
    """
    Adding a Z translation to the Empty's matrix makes the radial pattern
    rise with each step — a helix. The total rise is HELIX_N × HELIX_RISE_Z.
    HELIX_ROT_DEG × HELIX_N should equal 360° (or a multiple) for the helix
    to close; 20 × 18° = 360° gives a single closed helical loop.
    """
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    # Scale to a thin bead shape without using bpy.ops (context-free)
    bmesh.ops.scale(bm,
                    vec=(0.048, 0.048, 0.032),
                    verts=bm.verts,
                    space=Matrix.Identity(4))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("hf_bead")
    bm.to_mesh(mesh)
    bm.free()

    bead = bpy.data.objects.new("hf_bead", mesh)
    bpy.context.collection.objects.link(bead)
    bead.location.x = HELIX_RING_R          # place bead on helix ring

    empty = bpy.data.objects.new("hf_helix_pivot", None)
    bpy.context.collection.objects.link(empty)
    # Combine rotation AND translation in one Empty — the modifier applies
    # both simultaneously to each successive copy.
    empty.location         = (0.0, 0.0, HELIX_RISE_Z)
    empty.rotation_euler.z = math.radians(HELIX_ROT_DEG)

    mod = bead.modifiers.new("Helix_Array", 'ARRAY')
    mod.fit_type            = 'FIXED_COUNT'
    mod.count               = HELIX_N
    mod.use_relative_offset = False
    mod.use_object_offset   = True
    mod.offset_object       = empty
    mod.use_merge_vertices  = False
    return bead, empty


# ── Evaluate modifiers → single merged GLB ───────────────────────────────────
def apply_and_export(crown_gem: bpy.types.Object,
                     helix_bead: bpy.types.Object) -> None:
    """
    Evaluated depsgraph snapshot avoids modifying the source objects.
    new_from_object() builds a standalone Mesh from the evaluated state,
    preserving all modifier results without altering the stack.
    """
    dg = bpy.context.evaluated_depsgraph_get()

    def realise(src: bpy.types.Object) -> bpy.types.Object:
        ev   = src.evaluated_get(dg)
        mesh = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
        out  = bpy.data.objects.new(src.name + "_out", mesh)
        bpy.context.collection.objects.link(out)
        out.matrix_world = src.matrix_world.copy()
        return out

    crown_out = realise(crown_gem)
    helix_out = realise(helix_bead)

    # Join both into a single object → one draw call in Three.js / Babylon
    bpy.ops.object.select_all(action='DESELECT')
    crown_out.select_set(True)
    helix_out.select_set(True)
    bpy.context.view_layer.objects.active = crown_out
    with bpy.context.temp_override(
            selected_objects=[crown_out, helix_out],
            active_object=crown_out,
            object=crown_out):
        bpy.ops.object.join()

    merged = bpy.context.active_object
    merged.name = "hf_array_crown_helix"

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=False,
        use_selection=True,
    )
    print(f"[holoflow] exported → {GLB_PATH}")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_recursive=True)

    gem        = build_gem()
    _crown_e   = add_crown_array(gem)
    bead, _h_e = build_helix_chain()

    # Offset the helix chain so crown and helix don't overlap
    bead.location.z = 0.0   # helix rises from z=0; crown sits at z=0 too
    # Separate by shifting helix chain to sit beside the crown
    bead.location.x = CROWN_RING_R + 0.90

    apply_and_export(gem, bead)
