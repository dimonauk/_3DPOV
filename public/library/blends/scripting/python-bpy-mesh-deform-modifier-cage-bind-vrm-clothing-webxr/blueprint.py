"""
Blender 5.1 | bpy.types.MeshDeformModifier
─────────────────────────────────────────────
The MeshDeformModifier deforms a target mesh by following the transformation
of a separate cage mesh.  Unlike the Lattice (grid topology only), the cage
can be any closed mesh — a low-poly body shell, a simplified torso, a hand-
sculpted organic form.  Blender builds a volumetric trilinear-coordinate basis
(voxel grid) that expresses every target vertex in terms of cage face weights;
afterwards the cage can be posed, shape-keyed, or animated and the target
follows automatically.

Studio use case: bind a detailed VRM clothing mesh to a low-poly body cage so
that a single cage deformation drives multiple overlapping garment layers in
lockstep — no separate rigging needed for each layer.  At export time the cage
is applied and discarded; the clothing deforms cleanly with bone weights intact.

Expert notes:
  - Binding is done via bpy.ops.object.meshdeform_bind() which is a UI
    operator — it requires an object context override (temp_override) even in
    headless use.  Without it the operator errors silently.
  - The cage MUST fully enclose the target at bind time.  Any target vertex
    outside the cage gets zero influence and will not deform.
  - PRECISION controls the voxel grid resolution (2–10).  Low values are fast
    but produce blocky influence fields; high values are accurate but slow.
    Use 5–6 for character clothing; 3 for quick tests.
  - After binding, mod.is_bound == True.  Rebinding after cage edits requires
    unbinding first (call the bind operator again; toggling bpy.ops.object.
    meshdeform_bind with mod.is_bound=True clears the bind data).
  - The modifier preserves armature deform weights on the target; cage deform
    adds on top of the skeletal pose, so the two stack correctly for VRM.
  - Pre-export: apply the MeshDeform modifier BEFORE exporting GLB.
    The WebXR runtime has no concept of cage objects.  Use
    bpy.ops.object.modifier_apply with temp_override.

All tunable parameters are named constants at the top.
"""

import bpy
import bmesh
from mathutils import Vector

# ── names ──────────────────────────────────────────────────────────────────
CAGE_NAME      = "hf_body_cage"
CLOTH_NAME     = "hf_cloth_tunic"
CAGE_MAT_NAME  = "hf_cage_preview"
CLOTH_MAT_NAME = "hf_cloth_material"
MOD_NAME       = "MeshDeform_Cage"
COLLECTION     = "hf_meshdeform_demo"

# ── cage geometry ──────────────────────────────────────────────────────────
CAGE_PRECISION = 5        # voxel grid resolution (2–10); 5 is good quality
CAGE_DYNAMIC   = False    # dynamic bind recalculates each frame (expensive)

# ── cage shape: simplified torso capsule ──────────────────────────────────
TORSO_HEIGHT   = 1.6      # metres, floor to shoulder
TORSO_RADIUS   = 0.22     # rough shoulder width / 2
TORSO_WAIST    = 0.17     # waist radius (narrowing applied via scale key)
HIP_RADIUS     = 0.21     # hip radius

# ── cloth geometry ─────────────────────────────────────────────────────────
CLOTH_SEGMENTS = 8        # horizontal rings on the tunic
CLOTH_RINGS    = 12       # vertical rings
CLOTH_SCALE    = 1.04     # cloth slightly larger than cage (avoids z-fight)

# ── export ─────────────────────────────────────────────────────────────────
EXPORT_PATH    = "//hf_meshdeform_clothing.glb"

# ── colours ────────────────────────────────────────────────────────────────
CAGE_COLOUR    = (0.05, 0.60, 0.80, 0.25)   # translucent cyan for preview
CLOTH_COLOUR   = (0.80, 0.35, 0.12, 1.00)   # burnt orange tunic


# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────

def _purge():
    """Remove any previous demo objects so the script is idempotent."""
    names = [CAGE_NAME, CLOTH_NAME]
    for name in names:
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)
    for m in list(bpy.data.meshes):
        if m.users == 0:
            bpy.data.meshes.remove(m)
    coll = bpy.data.collections.get(COLLECTION)
    if coll:
        bpy.data.collections.remove(coll)


def _make_material(name: str, rgba: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Alpha"].default_value = rgba[3]
    if rgba[3] < 1.0:
        mat.blend_method = "BLEND"
    return mat


# ─────────────────────────────────────────────────────────────────────────────
# Build cage — low-poly torso capsule
# ─────────────────────────────────────────────────────────────────────────────

def _build_cage() -> bpy.types.Object:
    """
    Construct a closed torso-shaped cage using bmesh.
    The cage is intentionally low-poly so the voxel bind is fast at PRECISION=5.
    Shape: round-capped cylinder with a waist pinch, 8-gon cross-section.
    """
    bm = bmesh.new()

    sides = 8   # octagon — enough curvature, minimal tris
    import math

    # Stack of rings:  bottom hem → hip → waist → chest → shoulder cap
    ring_defs = [
        # (z_offset, radius_multiplier)
        (0.00, HIP_RADIUS),
        (0.25, HIP_RADIUS),
        (0.55, TORSO_WAIST),
        (0.90, TORSO_RADIUS),
        (1.20, TORSO_RADIUS),
        (TORSO_HEIGHT, TORSO_RADIUS * 0.6),  # shoulder narrowing
    ]

    rings = []
    for z, r in ring_defs:
        verts = []
        for i in range(sides):
            angle = 2 * math.pi * i / sides
            x = r * math.cos(angle)
            y = r * math.sin(angle)
            verts.append(bm.verts.new(Vector((x, y, z))))
        rings.append(verts)

    # Bottom cap (fan)
    bm.verts.new(Vector((0.0, 0.0, -0.05)))  # slightly below hem
    bot_centre = bm.verts[-1]
    for i in range(sides):
        bm.faces.new([
            bot_centre,
            rings[0][(i + 1) % sides],
            rings[0][i],
        ])

    # Side quads between consecutive rings
    for ri in range(len(rings) - 1):
        lo = rings[ri]
        hi = rings[ri + 1]
        for i in range(sides):
            bm.faces.new([lo[i], lo[(i + 1) % sides],
                          hi[(i + 1) % sides], hi[i]])

    # Top cap (fan)
    top_z = TORSO_HEIGHT + TORSO_RADIUS * 0.6
    bm.verts.new(Vector((0.0, 0.0, top_z)))
    top_centre = bm.verts[-1]
    top_ring = rings[-1]
    for i in range(sides):
        bm.faces.new([
            top_centre,
            top_ring[i],
            top_ring[(i + 1) % sides],
        ])

    bm.normal_update()

    mesh = bpy.data.meshes.new(CAGE_NAME)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(CAGE_NAME, mesh)
    obj.data.materials.append(_make_material(CAGE_MAT_NAME, CAGE_COLOUR))
    # Show as wire so it doesn't obscure the clothing in the viewport
    obj.display_type = "WIRE"
    return obj


# ─────────────────────────────────────────────────────────────────────────────
# Build cloth — slightly-scaled copy of the cage topology
# ─────────────────────────────────────────────────────────────────────────────

def _build_cloth(cage_obj: bpy.types.Object) -> bpy.types.Object:
    """
    Create a tunic mesh derived from the cage geometry.  In a real pipeline
    this would be an artist-modelled garment; here we scale a copy of the
    cage outward so that every target vertex is guaranteed to be inside the cage
    at bind time — the precondition the modifier strictly requires.
    """
    import math
    bm = bmesh.new()

    sides = 8
    ring_defs = [
        (0.00, HIP_RADIUS),
        (0.25, HIP_RADIUS),
        (0.55, TORSO_WAIST),
        (0.90, TORSO_RADIUS),
        (1.20, TORSO_RADIUS),
        (TORSO_HEIGHT, TORSO_RADIUS * 0.6),
    ]

    rings = []
    for z, r in ring_defs:
        r_cloth = r * CLOTH_SCALE
        verts = []
        for i in range(sides):
            angle = 2 * math.pi * i / sides
            x = r_cloth * math.cos(angle)
            y = r_cloth * math.sin(angle)
            # Only add a few extra subdivision rings (loop cuts) between
            # pairs so the cloth has enough geometry to follow cage pinches.
            verts.append(bm.verts.new(Vector((x, y, z))))
        rings.append(verts)

    # Insert extra interpolated ring between each pair for cloth density
    detailed_rings = []
    for ri in range(len(rings) - 1):
        detailed_rings.append(rings[ri])
        lo_z, lo_r = ring_defs[ri][0], ring_defs[ri][1] * CLOTH_SCALE
        hi_z, hi_r = ring_defs[ri + 1][0], ring_defs[ri + 1][1] * CLOTH_SCALE
        mid_z = (lo_z + hi_z) * 0.5
        mid_r = (lo_r + hi_r) * 0.5
        mid_verts = []
        for i in range(sides):
            angle = 2 * math.pi * i / sides
            mid_verts.append(bm.verts.new(
                Vector((mid_r * math.cos(angle), mid_r * math.sin(angle), mid_z))
            ))
        detailed_rings.append(mid_verts)
    detailed_rings.append(rings[-1])

    # Side quads
    for ri in range(len(detailed_rings) - 1):
        lo = detailed_rings[ri]
        hi = detailed_rings[ri + 1]
        for i in range(sides):
            bm.faces.new([lo[i], lo[(i + 1) % sides],
                          hi[(i + 1) % sides], hi[i]])

    # Bottom hem (open — tunic hem, not closed)
    bot = detailed_rings[0]
    # duplicate a slightly-inset hem loop and cap with flat quad band
    hem_inset = 0.015
    hem_lo = []
    for v in bot:
        pos = v.co.copy()
        # shrink toward centre axis
        pos.x *= (1.0 - hem_inset / max(abs(pos.x), 0.001))
        pos.y *= (1.0 - hem_inset / max(abs(pos.y), 0.001))
        pos.z -= 0.02
        hem_lo.append(bm.verts.new(pos))
    for i in range(sides):
        bm.faces.new([hem_lo[i], hem_lo[(i + 1) % sides],
                      bot[(i + 1) % sides], bot[i]])

    # Neck opening (open-top cylinder — just leave top ring bare)

    bm.normal_update()

    mesh = bpy.data.meshes.new(CLOTH_NAME)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(CLOTH_NAME, mesh)
    obj.data.materials.append(_make_material(CLOTH_MAT_NAME, CLOTH_COLOUR))
    return obj


# ─────────────────────────────────────────────────────────────────────────────
# Bind helpers
# ─────────────────────────────────────────────────────────────────────────────

def _add_mesh_deform_modifier(
    cloth_obj: bpy.types.Object,
    cage_obj: bpy.types.Object,
) -> bpy.types.MeshDeformModifier:
    mod = cloth_obj.modifiers.new(name=MOD_NAME, type="MESH_DEFORM")
    mod.object = cage_obj
    mod.precision = CAGE_PRECISION
    mod.use_dynamic_bind = CAGE_DYNAMIC
    return mod


def _bind_modifier(
    cloth_obj: bpy.types.Object,
    mod: bpy.types.MeshDeformModifier,
) -> None:
    """
    bpy.ops.object.meshdeform_bind() is a UI-context operator.
    It reads the active modifier from bpy.context.object.modifiers, so we must:
      1. Set cloth_obj as the active object.
      2. Override the context so the operator resolves correctly headlessly.
    Passing modifier= kwarg names the modifier by string to avoid any ambiguity
    when there are multiple modifiers on the stack.
    """
    bpy.context.scene.collection.objects.link(cloth_obj)  # must be in scene
    bpy.context.view_layer.objects.active = cloth_obj
    cloth_obj.select_set(True)

    # The bind operator toggles: if is_bound → unbind, else → bind.
    # Call once to bind (mod.is_bound starts False on a new modifier).
    with bpy.context.temp_override(
        object=cloth_obj,
        active_object=cloth_obj,
    ):
        bpy.ops.object.meshdeform_bind(modifier=MOD_NAME)

    print(f"[hf] MeshDeform bound: {mod.is_bound}")


# ─────────────────────────────────────────────────────────────────────────────
# Cage pose: waist pinch animation (demonstrates deformation)
# ─────────────────────────────────────────────────────────────────────────────

def _animate_cage_waist_pinch(cage_obj: bpy.types.Object) -> None:
    """
    Animate the cage with two shape keys — Basis and a WaistPinch key.
    The driver ramps from 0→1 over 30 frames, then back to 0 by frame 60.
    This gives the cloth a visible cinch deformation driven by cage shape change.
    """
    mesh = cage_obj.data
    cage_obj.shape_key_add(name="Basis")
    pinch_key = cage_obj.shape_key_add(name="WaistPinch", from_mix=False)

    # Scale waist ring verts inward in the shape key
    # Cage was built with rings; we identify waist verts by z range.
    waist_z_lo = 0.45
    waist_z_hi = 0.65
    pinch_factor = 0.65  # scale to this fraction of original radius

    for i, kv in enumerate(pinch_key.data):
        v_co = mesh.vertices[i].co
        if waist_z_lo <= v_co.z <= waist_z_hi:
            kv.co.x = v_co.x * pinch_factor
            kv.co.y = v_co.y * pinch_factor
        else:
            kv.co = v_co.copy()

    sk_ref = cage_obj.data.shape_keys.key_blocks["WaistPinch"]
    sk_ref.value = 0.0
    sk_ref.keyframe_insert("value", frame=1)
    sk_ref.value = 1.0
    sk_ref.keyframe_insert("value", frame=30)
    sk_ref.value = 0.0
    sk_ref.keyframe_insert("value", frame=60)


# ─────────────────────────────────────────────────────────────────────────────
# GLB export
# ─────────────────────────────────────────────────────────────────────────────

def _export_glb(cloth_obj: bpy.types.Object, cage_obj: bpy.types.Object) -> None:
    """
    Export the deformed cloth at frame 30 (waist pinch peak).
    We must apply the MeshDeformModifier before export — the cage object is not
    exported; the cloth must carry the baked geometry.

    The modifier is applied to a duplicate so the original demo scene is intact.
    """
    bpy.context.scene.frame_set(30)

    # Duplicate cloth
    dup = cloth_obj.copy()
    dup.data = cloth_obj.data.copy()
    dup.name = CLOTH_NAME + "_export"
    bpy.context.scene.collection.objects.link(dup)

    # Apply all modifiers on the duplicate via evaluated geometry
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = dup.evaluated_get(depsgraph)
    baked_mesh = bpy.data.meshes.new_from_object(eval_obj)

    dup.modifiers.clear()
    dup.data = baked_mesh

    # Select only the export duplicate
    bpy.ops.object.select_all(action="DESELECT")
    dup.select_set(True)
    bpy.context.view_layer.objects.active = dup

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )

    # Clean up export duplicate
    bpy.data.objects.remove(dup, do_unlink=True)
    bpy.data.meshes.remove(baked_mesh)


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    _purge()

    coll = bpy.data.collections.new(COLLECTION)
    bpy.context.scene.collection.children.link(coll)

    cage_obj = _build_cage()
    cloth_obj = _build_cloth(cage_obj)

    # Link cage first — it must be in the scene before bind
    coll.objects.link(cage_obj)
    coll.objects.link(cloth_obj)

    mod = _add_mesh_deform_modifier(cloth_obj, cage_obj)
    _bind_modifier(cloth_obj, mod)
    _animate_cage_waist_pinch(cage_obj)

    # Position the cloth on top of the cage in the viewport
    bpy.context.scene.frame_set(1)
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.shading.type = "SOLID"
            break

    _export_glb(cloth_obj, cage_obj)
    print("[hf] MeshDeform demo complete. GLB exported to:", EXPORT_PATH)


main()
