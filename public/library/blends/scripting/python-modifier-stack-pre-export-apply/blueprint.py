"""
Python Modifier Stack — Add, Configure, Reorder & Pre-Export Apply
Blender 5.1 | Holoflow Studio | CC0

Technique: bpy.types.Object.modifiers
  Every non-destructive operation Blender can apply to a mesh lives in the
  modifier stack.  The Python API exposes the stack as a typed collection on
  each Object.  Because modifiers evaluate in list order (index 0 first),
  order matters: a Subdivision Surface before a Boolean produces a
  different result than after.  For WebXR / GLB export the stack must be
  applied (baked to a plain mesh) — export_apply=True in the GLTF exporter
  calls bpy.ops.object.modifier_apply() internally, but only on a visible
  object in the active view layer.  Knowing the Python API lets you control
  the order, validate the stack, and apply programmatically in headless
  batch jobs.

WHY direct data API over operators wherever possible:
  ob.modifiers.new() is immediate; it does not need a VIEW_3D area.
  Property assignment (mod.levels = 2) is also immediate.
  Only modifier_apply() needs a valid context — use temp_override().
"""

import bpy
import os

# ── Constants ────────────────────────────────────────────────────────────────
OBJ_NAME     = "HF_ModStack_Demo"
OUTPUT_DIR   = bpy.path.abspath("//output/")
OUTPUT_GLB   = os.path.join(OUTPUT_DIR, "mod_stack_result.glb")

# Subdivision control
SUBSURF_LEVELS_VIEWPORT = 1   # kept low for interactive speed
SUBSURF_LEVELS_RENDER   = 2   # used when applying for export

# Solidify settings — useful for thin-wall architectural props
SOLIDIFY_THICKNESS = 0.04     # metres (about 40 mm wall)
SOLIDIFY_OFFSET    = -1.0     # grow inward only

# Bevel settings — chamfer hard edges, reduces specular pinching in WebXR
BEVEL_WIDTH    = 0.015
BEVEL_SEGMENTS = 2
BEVEL_LIMIT    = "ANGLE"
BEVEL_ANGLE    = 30.0         # degrees — only edges sharper than this get bevelled


def _find_view3d_ctx():
    """Return (window, area, region) for the first VIEW_3D area, or None."""
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type != "VIEW_3D":
                continue
            for region in area.regions:
                if region.type == "WINDOW":
                    return window, area, region
    return None


def _apply_modifier(ob: bpy.types.Object, mod_name: str) -> None:
    """
    Apply a named modifier to ob.  Requires a VIEW_3D area context.
    Raises RuntimeError if no VIEW_3D area is found (headless without display).

    WHY temp_override: modifier_apply() polls for an active object in OBJECT
    mode inside a VIEW_3D.  Without overriding those context keys the operator
    returns CANCELLED silently — a silent failure that corrupts export output.
    """
    ctx_triple = _find_view3d_ctx()
    if ctx_triple is None:
        raise RuntimeError(
            "No VIEW_3D area available — cannot apply modifier in headless mode "
            "without a display.  Run Blender with a UI or call "
            "bpy.ops.object.modifier_apply() after launching with -p and an "
            "EXEC_DEFAULT flag via bpy.ops.object.modifier_apply.poll()."
        )
    window, area, region = ctx_triple
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    with bpy.context.temp_override(window=window, area=area, region=region):
        bpy.ops.object.modifier_apply(modifier=mod_name)


def build_prop_mesh() -> bpy.types.Object:
    """
    Create a simple hard-surface prop (bevelled cube with a hole) using a
    modifier stack built entirely via Python.

    Stack order (low → high index, evaluated top-to-bottom):
      0  BEVEL          — chamfer sharp edges first, before subdiv rounds them
      1  BOOLEAN        — cut a circular hole through the face
      2  SOLIDIFY       — add wall thickness (useful for 3-D print / hollow shell)
      3  SUBSURF        — subdivide last to smooth the result

    Rationale for order:
      Bevel before SubSurf: SubSurf needs support loops to hold sharp edges.
      Bevel provides those loops automatically, so we don't have to add edge
      loops manually — this is the "subdiv-ready bevel" workflow.
      Boolean before Solidify: the cutter should operate on the base mesh face,
      not on the thickened shell (Solidify would double the cutter impact).
      SubSurf last: final smoothing pass over the already-thickened geometry.
    """
    # ── Base mesh: a slightly flattened cube ─────────────────────────────────
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    ob = bpy.context.active_object
    ob.name = OBJ_NAME
    ob.data.name = OBJ_NAME + "_Mesh"
    ob.scale.z = 0.25           # squash to a flat panel

    # Apply scale so modifier measurements are in world-space metres.
    # WHY apply_scale: Solidify thickness and Bevel width are in *local* space.
    # A scale of 0.25 on Z would make SOLIDIFY_THICKNESS appear 4× thinner.
    bpy.ops.object.transform_apply(scale=True)

    # ── Cutter object for Boolean ─────────────────────────────────────────────
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.18, depth=1.0, vertices=24,
        location=(0.0, 0.0, 0.0),
    )
    cutter = bpy.context.active_object
    cutter.name = OBJ_NAME + "_Cutter"
    cutter.display_type = "WIRE"    # invisible fill, shows as wire in viewport
    cutter.hide_render   = True

    # ── Switch back to the prop object ────────────────────────────────────────
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    cutter.select_set(False)

    # ── Modifier 0: BEVEL ─────────────────────────────────────────────────────
    bev: bpy.types.BevelModifier = ob.modifiers.new("HF_Bevel", "BEVEL")
    bev.width          = BEVEL_WIDTH
    bev.segments       = BEVEL_SEGMENTS
    bev.limit_method   = BEVEL_LIMIT
    bev.angle_limit    = BEVEL_ANGLE * (3.14159 / 180.0)   # degrees → radians
    bev.use_clamp_overlap = True   # prevents bevel from overlapping on small faces
    # bev.miter_outer = 'MITER_ARC' would round outer corners; keeping default SHARP
    # for the faceted-panel aesthetic this studio favours.

    # ── Modifier 1: BOOLEAN ───────────────────────────────────────────────────
    bool_mod: bpy.types.BooleanModifier = ob.modifiers.new("HF_Boolean", "BOOLEAN")
    bool_mod.operation  = "DIFFERENCE"
    bool_mod.object     = cutter
    bool_mod.solver     = "EXACT"    # Exact solver: handles co-planar faces
    # WHY EXACT vs FAST: FAST can leave open edges in Boolean result; EXACT
    # handles co-planar geometry correctly at the cost of ~2× compute time.
    # For a static GLB that is evaluated once, always use EXACT.

    # ── Modifier 2: SOLIDIFY ──────────────────────────────────────────────────
    sol: bpy.types.SolidifyModifier = ob.modifiers.new("HF_Solidify", "SOLIDIFY")
    sol.thickness        = SOLIDIFY_THICKNESS
    sol.offset           = SOLIDIFY_OFFSET
    sol.use_even_offset  = True   # constant thickness around curved areas
    sol.use_quality_normals = True
    sol.material_offset  = 1     # inner-wall faces use slot index 1 (allows different mat)

    # ── Modifier 3: SUBSURF ───────────────────────────────────────────────────
    sub: bpy.types.SubsurfModifier = ob.modifiers.new("HF_SubSurf", "SUBSURF")
    sub.subdivision_type     = "CATMULL_CLARK"
    sub.levels               = SUBSURF_LEVELS_VIEWPORT
    sub.render_levels        = SUBSURF_LEVELS_RENDER
    sub.use_limit_surface    = True    # prevents surface from moving beyond control cage
    sub.use_creases          = True    # respects crease weights on edges
    # use_limit_surface is the Blender equivalent of OpenSubdiv's "limit surface"
    # projection — it ensures that the rendered mesh matches what subdiv algorithms
    # would place at the true B-spline limit.  Without it, viewport and export can
    # diverge for high-curvature areas.

    print(f"[HF] Built modifier stack on '{ob.name}':")
    for i, mod in enumerate(ob.modifiers):
        print(f"  [{i}] {mod.type:20s}  name={mod.name}")

    return ob


def reorder_stack_demo(ob: bpy.types.Object) -> None:
    """
    Demonstrate reordering modifiers via bpy.ops.object.modifier_move_to_index().

    In Blender 4.0+ the old modifier_move_up/down are still present but
    modifier_move_to_index() is the canonical one-shot reorder.  It requires
    OBJECT mode with the object active — temp_override is NOT needed here
    because it polls on active_object, not on a VIEW_3D area.

    WHY show this: Modifier order is the most common mistake.  A script that
    adds modifiers in a loop from data (e.g. importing a rig recipe) needs
    an explicit reorder step if the recipe order differs from insertion order.
    """
    # Temporarily move SOLIDIFY to index 0 (before BEVEL), show the stack,
    # then restore.  This produces a different (wrong) visual result as a demo.
    bpy.context.view_layer.objects.active = ob
    print("\n[HF] Reorder demo — moving HF_Solidify to index 0:")
    bpy.ops.object.modifier_move_to_index(modifier="HF_Solidify", index=0)
    for i, mod in enumerate(ob.modifiers):
        print(f"  [{i}] {mod.type:20s}  name={mod.name}")

    # Restore: move back to index 2
    print("[HF] Restoring HF_Solidify to index 2:")
    bpy.ops.object.modifier_move_to_index(modifier="HF_Solidify", index=2)
    for i, mod in enumerate(ob.modifiers):
        print(f"  [{i}] {mod.type:20s}  name={mod.name}")


def read_modifier_properties(ob: bpy.types.Object) -> dict:
    """
    Walk ob.modifiers and collect type + selected properties into a dict.
    Useful for serialising a modifier recipe to JSON for a pipeline config.

    WHY iterate by type: modifier attributes are not uniform across types.
    Attempting to read .width on a SUBSURF raises AttributeError.  Branching
    on mod.type is the safe pattern.
    """
    recipe = {}
    for mod in ob.modifiers:
        if mod.type == "BEVEL":
            recipe[mod.name] = {
                "type": "BEVEL",
                "width": mod.width,
                "segments": mod.segments,
                "limit_method": mod.limit_method,
            }
        elif mod.type == "BOOLEAN":
            recipe[mod.name] = {
                "type": "BOOLEAN",
                "operation": mod.operation,
                "solver": mod.solver,
                "object": mod.object.name if mod.object else None,
            }
        elif mod.type == "SOLIDIFY":
            recipe[mod.name] = {
                "type": "SOLIDIFY",
                "thickness": mod.thickness,
                "offset": mod.offset,
            }
        elif mod.type == "SUBSURF":
            recipe[mod.name] = {
                "type": "SUBSURF",
                "subdivision_type": mod.subdivision_type,
                "levels": mod.levels,
                "render_levels": mod.render_levels,
            }
    return recipe


def pre_export_apply_all(ob: bpy.types.Object) -> None:
    """
    Bake the entire modifier stack to a plain mesh before GLB export.

    Order matters: applying index 0 first ensures subsequent modifiers still
    see the correct topology after each apply.  After apply, index 0 is
    consumed and the old index 1 becomes the new index 0.  We therefore always
    apply modifiers[0] in a loop until none remain.

    Pre-conditions:
      - ob must be a MESH object (not Curve, Lattice, etc.)
      - The Boolean cutter object must be visible (not hidden by viewport or
        render visibility) — EXACT solver requires the cutter to be evaluable.
      - Caller must be in OBJECT mode.

    WHY apply in a loop from index 0 rather than by name:
      After modifier_apply(), index 0 is gone.  Iterating by name over a
      shrinking list causes index errors.  Consuming from the front avoids
      off-by-one errors entirely.
    """
    # Bump render subdiv level before applying so the exported mesh has full
    # subdivision quality.
    if sub := ob.modifiers.get("HF_SubSurf"):
        sub.levels = SUBSURF_LEVELS_RENDER

    count = len(ob.modifiers)
    for _ in range(count):
        if not ob.modifiers:
            break
        mod_name = ob.modifiers[0].name
        print(f"[HF] Applying modifier: {mod_name}")
        _apply_modifier(ob, mod_name)

    print(f"[HF] Stack fully applied. Mesh: {len(ob.data.vertices)} verts, "
          f"{len(ob.data.polygons)} faces.")


def export_glb(ob: bpy.types.Object) -> None:
    """Export the fully-applied mesh as a studio-standard GLB."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    bpy.ops.export_scene.gltf(
        filepath                              = OUTPUT_GLB,
        export_format                         = "GLB",
        use_selection                         = True,
        export_apply                          = True,   # belt-and-braces
        export_yup                            = True,
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = 6,
        export_image_format                   = "WEBP",
    )
    print(f"[HF] Exported: {OUTPUT_GLB}")


# ── Main entry ────────────────────────────────────────────────────────────────
def main():
    # Clear default scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    ob = build_prop_mesh()
    reorder_stack_demo(ob)

    recipe = read_modifier_properties(ob)
    print("\n[HF] Modifier recipe:")
    for k, v in recipe.items():
        print(f"  {k}: {v}")

    # Apply stack and export
    pre_export_apply_all(ob)
    export_glb(ob)


if __name__ == "__main__":
    main()
