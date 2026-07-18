"""
Blender 5.1 | bpy.types.LaplacianDeformModifier
────────────────────────────────────────────────
LaplacianDeform solves a *differential coordinates* system: every vertex is
described not by its absolute position, but by its Laplacian vector — the
delta between the vertex and the centroid of its one-ring neighbours.  When
you move anchor vertices, the solver distributes the displacement through the
mesh while keeping all inter-vertex relationships (angles, relative distances)
as intact as the system of equations allows.  The result is a smooth, volume-
preserving deformation from a sparse set of handle points — no physics, no
cage mesh, no per-bone weight painting required.

Studio use case: a VRM tail or ear accessory bound to a single root anchor
driven by an Empty.  One bind call; the mesh follows the Empty with realistic
organic flex.  Export static GLB of the posed frame for WebXR staging.

All parameters are collected at the top as named constants.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# ── constants ──────────────────────────────────────────────────────────────
MESH_NAME         = "hf_lapdeform_tail"
MOD_NAME          = "LaplacianDeform"
ANCHOR_GROUP      = "ld_anchors"    # vertex group the modifier binds on
HANDLE_GROUP      = "ld_handle"     # single tip vertex group used to drive deform
RING_SEGS         = 8               # cross-section segments (faceted feel)
LENGTH_SEGS       = 16              # along-axis edge rings
TAIL_LENGTH       = 1.20            # metres — tip-to-root
TAIL_ROOT_R       = 0.08            # root cross-section radius
TAIL_TIP_R        = 0.015           # tip cross-section radius
DEFORM_ANGLE_DEG  = 35.0            # how far the tail tip handle sweeps
EMPTY_NAME        = "hf_tail_handle"
GLB_PATH          = "//hf_lapdeform_tail.glb"

# ── helpers ────────────────────────────────────────────────────────────────

def _clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)


def _build_tapering_cylinder(
    name: str,
    length: float,
    root_r: float,
    tip_r: float,
    segs: int,
    rings: int,
) -> bpy.types.Object:
    """
    Build a linearly-tapered cylinder via bmesh — no operator context.
    Vertices run from Z=0 (root) to Z=length (tip).
    Returns the new Object in the scene collection.
    """
    mesh = bpy.data.meshes.new(name)
    bm   = bmesh.new()

    # Create rings from root to tip
    for ri in range(rings + 1):
        t      = ri / rings            # 0 → 1
        z      = t * length
        radius = root_r + (tip_r - root_r) * t
        for si in range(segs):
            angle = 2 * math.pi * si / segs
            x     = radius * math.cos(angle)
            y     = radius * math.sin(angle)
            bm.verts.new(Vector((x, y, z)))

    bm.verts.ensure_lookup_table()

    # Connect quads between adjacent rings
    for ri in range(rings):
        for si in range(segs):
            si_next = (si + 1) % segs
            v0 = bm.verts[ri       * segs + si]
            v1 = bm.verts[ri       * segs + si_next]
            v2 = bm.verts[(ri + 1) * segs + si_next]
            v3 = bm.verts[(ri + 1) * segs + si]
            bm.faces.new([v0, v1, v2, v3])

    # Cap the root (bottom)
    root_verts = [bm.verts[i] for i in range(segs)]
    bm.faces.new(root_verts[::-1])   # reversed = outward normal

    # Cap the tip (top)
    tip_verts = [bm.verts[rings * segs + i] for i in range(segs)]
    bm.faces.new(tip_verts)

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _assign_vertex_groups(obj: bpy.types.Object) -> None:
    """
    ANCHOR_GROUP  → root two rings (fixed, LaplacianDeform pins these).
    HANDLE_GROUP  → tip top ring (driven by Empty — propagates deformation).

    LaplacianDeform requires ALL vertices to belong to the modifier's vertex
    group for the Laplacian system matrix to be fully assembled.  Here we put
    everything in ANCHOR_GROUP (weight=1) then override the tip vertices with
    weight=0 so only roots are rigidly anchored.  Tip verts with weight<0.5
    become free handles for the solver.

    A separate HANDLE_GROUP (weight=1, tip ring only) is used by the Hook
    modifier that links the Empty, so the two groups serve different roles.
    """
    mesh  = obj.data
    n_v   = len(mesh.vertices)
    rings = LENGTH_SEGS
    segs  = RING_SEGS

    # ANCHOR_GROUP: root two rings = rigid; rest = 0 (free in solve)
    ag = obj.vertex_groups.new(name=ANCHOR_GROUP)
    root_indices = list(range(segs * 2))           # first two rings
    free_indices = list(range(segs * 2, n_v))
    ag.add(root_indices, 1.0, "REPLACE")
    ag.add(free_indices, 0.0, "REPLACE")

    # HANDLE_GROUP: tip ring only — used by HookModifier to bind the Empty
    hg   = obj.vertex_groups.new(name=HANDLE_GROUP)
    tip  = list(range(rings * segs, (rings + 1) * segs))
    hg.add(tip, 1.0, "REPLACE")


def _add_laplacian_deform(obj: bpy.types.Object) -> bpy.types.LaplacianDeformModifier:
    """
    Add and configure LaplacianDeformModifier.

    Key properties in Blender 5.1:
      vertex_group   — name of the vertex group with anchor weights.
                       Vertices at weight=1 are pinned (anchors).
                       Vertices at weight=0 are free deformation handles.
                       The modifier solves a sparse linear system (CHOLMOD or
                       Eigen CG) connecting the two sets via mesh connectivity.
      iterations     — number of CG solver refinement steps.
                       1 = one solve (exact for simple meshes).  Higher values
                       run repeated passes to enforce soft constraints; rarely
                       needed above 3 for organic shapes.
      is_bind        — read-only bool; True after bind call.  Checking before
                       calling bind avoids double-bind errors.
    """
    mod: bpy.types.LaplacianDeformModifier = obj.modifiers.new(
        name=MOD_NAME, type="LAPLACIANDEFORM"
    )
    mod.vertex_group = ANCHOR_GROUP
    mod.iterations   = 1        # single Laplacian solve; 1 is exact for a manifold cylinder
    return mod


def _bind_laplacian_deform(obj: bpy.types.Object, mod_name: str) -> None:
    """
    Bind requires a context where obj is active and visible.
    In Blender 5.1 headless / --background the safest path is
    bpy.context.temp_override(active_object=obj, object=obj).

    CRITICAL: bind must happen BEFORE any deformation is applied.  The
    modifier caches the rest-pose Laplacian matrix at bind time.  Moving
    vertices after bind but before calling meshdeform_bind again re-uses the
    stale matrix → incorrect deformation.  Rebind is cheap (milliseconds for
    <10k verts), so always rebind after topology or rest-pose changes.
    """
    with bpy.context.temp_override(active_object=obj, object=obj):
        bpy.ops.object.laplaciandeform_bind(modifier=mod_name)


def _add_hook_modifier(
    obj: bpy.types.Object,
    empty: bpy.types.Object,
    vgroup: str,
) -> bpy.types.HookModifier:
    """
    A HookModifier translates the HANDLE_GROUP vertices with the Empty.
    It MUST sit ABOVE LaplacianDeformModifier in the stack so the Laplacian
    solver sees the displaced tip position as a soft constraint and propagates
    the bend down the length.

    Stack (top-to-bottom):
      0. HookModifier   — moves tip via Empty
      1. LaplacianDeform — solves full mesh deformation

    Reversed order (Laplacian first, Hook second) produces no deformation
    because the Laplacian sees unmodified geometry and the Hook only shunts
    verts after the solve is finalised.
    """
    hook: bpy.types.HookModifier = obj.modifiers.new(name="TipHook", type="HOOK")
    hook.object       = empty
    hook.vertex_group = vgroup
    hook.strength     = 1.0
    # Move HookModifier to index 0 (before LaplacianDeform)
    bpy.context.view_layer.objects.active = obj
    while obj.modifiers[0].name != hook.name:
        with bpy.context.temp_override(active_object=obj, object=obj):
            bpy.ops.object.modifier_move_up(modifier=hook.name)
    return hook


def _keyframe_arc(obj: bpy.types.Object, empty: bpy.types.Object) -> None:
    """
    Animate the Empty sweeping the tip through DEFORM_ANGLE_DEG in Y.
    Frame 1  = rest (straight up).
    Frame 25 = fully deflected.
    Frame 50 = back to rest.

    The Hook moves the tip; LaplacianDeform propagates the curve.  The visible
    result is a whip-like arc that respects the cylindrical topology.
    """
    angle_rad = math.radians(DEFORM_ANGLE_DEG)
    tip_rest  = Vector((0.0, 0.0, TAIL_LENGTH))
    tip_bent  = Vector((0.0, math.sin(angle_rad) * TAIL_LENGTH,
                        math.cos(angle_rad) * TAIL_LENGTH))

    for frame, loc in ((1, tip_rest), (25, tip_bent), (50, tip_rest)):
        bpy.context.scene.frame_set(frame)
        empty.location = loc
        empty.keyframe_insert("location", frame=frame)


def _export_glb(obj: bpy.types.Object, path: str, frame: int = 25) -> None:
    """
    Export a static GLB snapshot of the deformed pose at frame 25.
    LaplacianDeform is applied via export_apply=True, baking the deformed
    shape into the GLB mesh without modifying the source .blend.

    holoflow conventions: +Y up (export_yup=True), Draco level 6,
    WebP textures, snake_case root name enforced by mesh name already.
    """
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath          = bpy.path.abspath(path),
        use_selection     = True,
        export_apply      = True,       # bakes LaplacianDeform + HookModifier
        export_yup        = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )


# ── main ───────────────────────────────────────────────────────────────────

def build() -> None:
    _clear_scene()

    # 1. Build mesh
    tail = _build_tapering_cylinder(
        MESH_NAME, TAIL_LENGTH, TAIL_ROOT_R, TAIL_TIP_R, RING_SEGS, LENGTH_SEGS
    )

    # 2. Place at origin; root at Z=0
    tail.location = Vector((0, 0, 0))

    # 3. Assign vertex groups (anchors + handle tip)
    _assign_vertex_groups(tail)

    # 4. Create the Empty that drives the tip handle
    empty = bpy.data.objects.new(EMPTY_NAME, None)
    empty.empty_display_type = "SPHERE"
    empty.empty_display_size = 0.04
    empty.location           = Vector((0.0, 0.0, TAIL_LENGTH))
    bpy.context.scene.collection.objects.link(empty)

    # 5. Add HookModifier (tip → Empty) — must be index 0
    _add_hook_modifier(tail, empty, HANDLE_GROUP)

    # 6. Add LaplacianDeformModifier — sits at index 1
    mod = _add_laplacian_deform(tail)

    # 7. Bind (must happen after both modifiers exist and before animating)
    _bind_laplacian_deform(tail, mod.name)

    # 8. Keyframe the Empty arc
    _keyframe_arc(tail, empty)

    # 9. Save .blend
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//hf_lapdeform_tail.blend"))

    # 10. Export posed GLB (frame 25 = max deflection)
    _export_glb(tail, GLB_PATH, frame=25)

    print(f"[holoflow] LaplacianDeform blueprint done — {MESH_NAME}")
    print(f"  mod.is_bind = {mod.is_bind}")
    print(f"  anchors at root rings 0..{RING_SEGS * 2 - 1}")
    print(f"  tip handle via Empty '{EMPTY_NAME}'")


if __name__ == "__main__":
    build()
