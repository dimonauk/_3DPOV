"""
blueprint.py — Corrective Shape Keys + Rotation-Driven Driver Expression
Blender 5.1 | Topic: rigging | Licence: CC0

Technique in brief
------------------
Automatic-weight skinning at a two-bone joint collapses inward when the angle
exceeds ~60°.  A corrective shape key lives in the shape-key pipeline (before
the Armature modifier), so it can add back the lost volume in rest space.
A TRANSFORMS driver reads the forearm bone's local-X rotation — in radians —
and remaps it to 0-1 so the key fades in exactly as the elbow bends.

Pipeline order matters: Blender evaluates
  Basis → Shape Keys (value 0-1) → Armature deform → World space
Because the corrective runs *before* skinning, the nudge must be authored in
rest space — not in the bent pose.  The "feel" of the correction is tuned by
pushing elbow-region vertices toward the posterior elbow (+Z) in rest space;
the amount is calibrated so the deformed result fills the collapse.
"""

import bpy
import bmesh
from mathutils import Vector, Matrix
import math

# ── Constants ─────────────────────────────────────────────────────────────────

ARM_RADIUS         = 0.08          # cylinder radius (m)
ARM_HALF_LENGTH    = 1.0           # each bone segment length (m)
CYLINDER_SEGS      = 12            # ring subdivisions — enough for smooth deform
CYLINDER_RINGS     = 16            # segments along the arm length

BONE_UPPER         = "upper_arm"
BONE_FOREARM       = "forearm"

CORRECTIVE_KEY     = "elbow_corrective"

# Bones point in +Y at rest; the elbow bends the forearm around local +X
# so a downward flex is a NEGATIVE rotation around X (palm faces forward)
FLEX_ANGLE_RAD     = math.radians(-90.0)

# How far each elbow vertex is pushed outward (posterior / +Z) in rest space.
# 0.06 m ≈ 75 % of ARM_RADIUS — empirically fills the ~80% volume loss at 90°.
CORRECTION_MAGNITUDE = 0.06

# Only vertices whose combined upper_arm + forearm weight is in this band are
# considered "elbow" vertices.  Verts owned entirely by one bone don't collapse.
BLEND_WEIGHT_BAND  = (0.20, 0.80)

# ── Scene reset ───────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


# ── Mesh: cylindrical arm ─────────────────────────────────────────────────────

def build_arm_mesh() -> bpy.types.Object:
    """
    Build a cylinder aligned along +Y, total length = 2 * ARM_HALF_LENGTH.
    The elbow joint sits at Y = ARM_HALF_LENGTH exactly.
    We use the bpy.ops cylinder operator then scale — simpler than constructing
    every vertex via bmesh — but immediately apply the resulting scale so the
    Armature modifier receives unit-scale geometry.
    """
    total_length = 2.0 * ARM_HALF_LENGTH

    bpy.ops.mesh.primitive_cylinder_add(
        vertices   = CYLINDER_SEGS,
        depth      = total_length,
        radius     = ARM_RADIUS,
        enter_editmode = False,
        location   = (0.0, ARM_HALF_LENGTH, 0.0),  # centre at elbow Y
    )
    arm_obj = bpy.context.active_object
    arm_obj.name = "arm_mesh"

    # Cylinder axis is +Z by default; rotate to align with +Y
    arm_obj.rotation_euler.x = math.radians(90.0)
    bpy.ops.object.transform_apply(rotation=True)

    # Add loop-cut ring density around the elbow — more rings = more vertices
    # to carry the corrective displacement, finer blend boundary.
    bm = bmesh.new()
    bm.from_mesh(arm_obj.data)

    # Find edges parallel to the cylinder axis (Y), subdivide them near the
    # elbow to give correction authority.  We do this by selecting edges whose
    # midpoint Y is within 20% of ARM_HALF_LENGTH.
    elbow_y    = ARM_HALF_LENGTH
    half_band  = ARM_HALF_LENGTH * 0.20

    ring_edges = [
        e for e in bm.edges
        if abs(((e.verts[0].co + e.verts[1].co) * 0.5).y - elbow_y) < half_band
        and abs(e.verts[0].co.y - e.verts[1].co.y) < 0.01  # ring edge, not axial
    ]
    # Subdivide those edges twice for elbow resolution
    bmesh.ops.subdivide_edges(bm, edges=ring_edges, cuts=2, use_grid_fill=True)

    bm.to_mesh(arm_obj.data)
    bm.free()
    arm_obj.data.update()

    return arm_obj


# ── Armature: two-bone arm ────────────────────────────────────────────────────

def build_armature() -> bpy.types.Object:
    """
    upper_arm: head (0,0,0) → tail (0, ARM_HALF_LENGTH, 0)
    forearm  : head (0, ARM_HALF_LENGTH, 0) → tail (0, 2*ARM_HALF_LENGTH, 0)
    They are connected (forearm's head == upper_arm's tail) so Blender's
    automatic weights will distribute naturally.
    """
    arm_data = bpy.data.armatures.new("arm_rig")
    rig_obj  = bpy.data.objects.new("arm_rig", arm_data)
    bpy.context.collection.objects.link(rig_obj)

    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode='EDIT')

    eb = arm_data.edit_bones

    ub = eb.new(BONE_UPPER)
    ub.head = Vector((0.0, 0.0, 0.0))
    ub.tail = Vector((0.0, ARM_HALF_LENGTH, 0.0))

    fb = eb.new(BONE_FOREARM)
    fb.head = Vector((0.0, ARM_HALF_LENGTH, 0.0))
    fb.tail = Vector((0.0, 2.0 * ARM_HALF_LENGTH, 0.0))
    fb.parent   = ub
    fb.use_connect = True  # physically joined; automatic weights work per-vertex

    bpy.ops.object.mode_set(mode='OBJECT')
    return rig_obj


# ── Skinning: armature modifier + weight groups ───────────────────────────────

def skin_to_armature(arm_obj: bpy.types.Object,
                     rig_obj: bpy.types.Object) -> None:
    """
    Add the Armature modifier and generate automatic weights.
    bpy.ops.object.parent_set(type='ARMATURE_AUTO') works here because we
    explicitly set selection + active context before calling it.
    After parenting, the modifier is on the mesh; we do NOT apply it so the
    rig remains live.
    """
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    rig_obj.select_set(True)
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')


# ── Corrective shape key authoring ────────────────────────────────────────────

def add_corrective_shape_key(arm_obj: bpy.types.Object) -> bpy.types.ShapeKey:
    """
    The corrective key pushes posterior-elbow vertices in +Z rest space.
    Why +Z?  At rest the arm points along +Y.  The posterior of the elbow
    (olecranon) faces +Z.  Pushing verts there in rest space causes the
    armature deform to carry that extra volume *through* the bent pose,
    filling the pinch.

    Authoring logic:
      1. Ensure a Basis key exists.
      2. Create the corrective key.
      3. For each vertex, read its upper_arm and forearm vertex-group weights.
         Verts with a balanced blend (BLEND_WEIGHT_BAND) are at the joint.
         For those verts, push co toward +Z by CORRECTION_MAGNITUDE, modulated
         by proximity to the elbow mid-plane (Gaussian falloff along Y).
    """
    mesh = arm_obj.data
    elbow_y = ARM_HALF_LENGTH

    # Ensure Basis exists
    if not mesh.shape_keys:
        arm_obj.shape_key_add(name="Basis", from_mix=False)

    corrective = arm_obj.shape_key_add(name=CORRECTIVE_KEY, from_mix=False)

    # Vertex group lookup — needed to read blend weights
    vg_upper   = arm_obj.vertex_groups.get(BONE_UPPER)
    vg_forearm = arm_obj.vertex_groups.get(BONE_FOREARM)

    # Build per-vertex weight lookup (O(n) single pass)
    def vg_weight(vg, vi: int) -> float:
        if vg is None:
            return 0.0
        try:
            return vg.weight(vi)
        except RuntimeError:
            return 0.0

    for vi, vert in enumerate(mesh.vertices):
        w_upper   = vg_weight(vg_upper,   vi)
        w_forearm = vg_weight(vg_forearm, vi)
        total_w   = w_upper + w_forearm
        if total_w < 0.01:
            continue  # unweighted vert (e.g. end-cap centre)

        # Normalise blend: how much does the forearm bone influence this vert?
        forearm_fraction = w_forearm / total_w

        # Only vertices in the blend zone collapse
        if not (BLEND_WEIGHT_BAND[0] <= forearm_fraction <= BLEND_WEIGHT_BAND[1]):
            continue

        # Gaussian falloff along Y from the elbow — sharpens at ±15% of arm length
        dist_y = abs(vert.co.y - elbow_y)
        falloff = math.exp(-((dist_y / (ARM_HALF_LENGTH * 0.15)) ** 2))

        # Posterior direction is +Z at rest pose.
        # Blend weight 0.5 = maximum collapse → maximum correction.
        # The parabolic centre-weight keeps correction strongest at the apex.
        blend_strength = 1.0 - abs(forearm_fraction - 0.5) * 2.0

        delta = CORRECTION_MAGNITUDE * falloff * blend_strength

        corrective.data[vi].co = vert.co + Vector((0.0, 0.0, delta))

    corrective.value = 0.0  # will be driven
    return corrective


# ── Pose armature for preview / driver target ─────────────────────────────────

def pose_elbow_flex(rig_obj: bpy.types.Object, angle_rad: float) -> None:
    """
    Set forearm bone to angle_rad around its local X axis.
    Rotation mode must be 'XYZ' for the driver TRANSFORMS variable to read
    rotation_euler correctly (TRANSFORMS type is mode-agnostic, but naming
    helps humans debugging the driver in the UI).
    """
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode='POSE')

    pbone = rig_obj.pose.bones[BONE_FOREARM]
    pbone.rotation_mode = 'XYZ'
    pbone.rotation_euler.x = angle_rad

    bpy.ops.object.mode_set(mode='OBJECT')


# ── Driver: shape key value ← bone local-X rotation ──────────────────────────

def add_rotation_driver(arm_obj: bpy.types.Object,
                        rig_obj: bpy.types.Object) -> None:
    """
    Driver type: SCRIPTED  (allows expression)
    Variable type: TRANSFORMS — reads evaluated pose-bone rotation independent
    of the bone's own rotation_mode.  This is crucial: if the animator later
    switches the bone to QUATERNION, a SINGLE_PROP driver on rotation_euler[0]
    would silently return 0.  TRANSFORMS always gives the correct channel.

    Space: LOCAL_SPACE — measures the angle the forearm makes with its parent
    (upper_arm), not with the world.  If the whole arm swings forward, the
    driver value stays constant and the correction only fires on the actual
    elbow flex.

    Expression: max(0.0, min(1.0, -var / 1.5708))
      • Negate because flex is a negative X rotation (forearm swings toward -Z)
      • Divide by π/2 to map 90° → 1.0
      • Clamp to [0, 1] so over-bending doesn't over-correct
    """
    mesh       = arm_obj.data
    shape_keys = mesh.shape_keys

    # Target the shape key's 'value' property on the key block
    key_block  = shape_keys.key_blocks[CORRECTIVE_KEY]

    # Clear any existing driver
    key_block.driver_remove("value")

    fcurve = key_block.driver_add("value")
    drv    = fcurve.driver
    drv.type       = 'SCRIPTED'
    drv.expression = "max(0.0, min(1.0, -var / 1.5708))"

    var = drv.variables.new()
    var.name = "var"
    var.type = 'TRANSFORMS'

    tgt = var.targets[0]
    tgt.id             = rig_obj
    tgt.bone_target    = BONE_FOREARM
    tgt.transform_type = 'ROT_X'
    tgt.transform_space = 'LOCAL_SPACE'

    # Force the driver to evaluate immediately
    fcurve.driver.is_valid = True


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()

    arm_obj = build_arm_mesh()
    rig_obj = build_armature()

    skin_to_armature(arm_obj, rig_obj)

    # Set corrective shape key (with rig in rest pose)
    add_corrective_shape_key(arm_obj)

    # Wire the driver
    add_rotation_driver(arm_obj, rig_obj)

    # Flex elbow to 90° so the viewport shows the corrected result
    pose_elbow_flex(rig_obj, FLEX_ANGLE_RAD)

    # Place camera and light for a clear elbow view
    bpy.ops.object.camera_add(location=(0.6, 1.0, 0.4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(70), 0.0, math.radians(55))
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(1.0, -0.5, 2.0))
    sun = bpy.context.active_object
    sun.rotation_euler = (math.radians(45), 0.0, math.radians(-30))
    sun.data.energy = 3.0

    # Frame the elbow in the viewport
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.view3d.view_selected(use_all_regions=False) if bpy.context.area else None

    print("[blueprint] Corrective shape keys rig ready.  Forearm at -90° X (local).")
    print(f"  Shape key '{CORRECTIVE_KEY}' driven by '{BONE_FOREARM}' ROT_X LOCAL_SPACE.")
    print("  Adjust CORRECTION_MAGNITUDE and BLEND_WEIGHT_BAND to taste.")


if __name__ == "__main__":
    main()
