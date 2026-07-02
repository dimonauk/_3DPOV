"""
Python bpy.types.PoseBone.constraints — Constraint Management & Export-Safe Bake
=================================================================================
Blender 5.1 | CC0 1.0 Universal

Bone constraints (IK, Damped Track, Copy Location, etc.) drive procedural rigs
beautifully but GLB/VRM exporters see them as redundant data. The exporter can
only include the base rest-pose transforms; constraints are stripped silently.
If you export a constrained rig without first baking, the exported armature poses
in the wrong position. Two strategies solve this:

  Strategy A — NLA Bake: bpy.ops.nla.bake() samples the visual transform on
  every frame across a range and writes it to a new Action. The constraints are
  then removed (clear_constraints=True). The resulting .blend keeps only the
  frozen animation; good for final delivery, destructive to the rig.

  Strategy B — Mute → Apply → Export → Restore: for a still-pose export you
  mute every constraint, apply the current visual transform to matrix_basis,
  export, then restore. The rig constraints survive in the .blend unchanged.

This blueprint demonstrates a two-bone arm that tracks an animated Empty via
Damped Track + Copy Location, and exercises both strategies end-to-end.

References:
  Robert Guetzkow — blender-python-examples (MIT)
  https://github.com/robertguetzkow/blender-python-examples
  Sibling resources in the same repo: operator, panel, property group patterns.

Author: Holoflow Studio / CC0 2026
"""

import bpy
import mathutils

# ─── Parameters ───────────────────────────────────────────────────────────────
ARM_NAME       = "ConstraintRig"
TARGET_NAME    = "LookTarget"
BONE_ROOT_LEN  = 0.5
BONE_CHILD_LEN = 0.4
OUTPUT_GLB     = "//output/constraint_rig_baked.glb"
BAKE_START     = 1
BAKE_END       = 60


# ─── Scene setup ──────────────────────────────────────────────────────────────

def purge_orphans() -> None:
    bpy.ops.outliner.orphans_purge(do_recursive=True)


def build_two_bone_arm() -> tuple[bpy.types.Object, bpy.types.Armature]:
    """
    Two-bone hierarchy: Root at origin, Child directly above it.
    use_connect=True keeps them touching at head/tail so IK and track
    constraints solve correctly without a gap translation error.
    """
    arm_data = bpy.data.armatures.new(ARM_NAME)
    arm_obj  = bpy.data.objects.new(ARM_NAME, arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root = eb.new("Root")
    root.head = (0.0, 0.0, 0.0)
    root.tail = (0.0, 0.0, BONE_ROOT_LEN)

    child = eb.new("Child")
    child.head       = root.tail.copy()
    child.tail       = child.head + mathutils.Vector((0.0, 0.0, BONE_CHILD_LEN))
    child.parent     = root
    child.use_connect = True

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj, arm_data


def make_animated_target() -> bpy.types.Object:
    """
    Sphere empty that moves in a triangle over 60 frames.
    The constrained rig will track it, giving the NLA bake something
    non-trivial to capture.
    """
    bpy.ops.object.empty_add(type='SPHERE', location=(1.0, 0.0, 0.5))
    tgt = bpy.context.active_object
    tgt.name = TARGET_NAME

    keyframes = [
        (1,  (1.0,  0.0, 0.5)),
        (20, (0.0,  1.5, 0.8)),
        (40, (-1.0, 0.0, 0.3)),
        (60, (1.0,  0.0, 0.5)),
    ]
    for frame, loc in keyframes:
        tgt.location = loc
        tgt.keyframe_insert("location", frame=frame)
    return tgt


# ─── Constraint management ────────────────────────────────────────────────────

def add_damped_track(arm_obj: bpy.types.Object,
                     bone_name: str,
                     target: bpy.types.Object,
                     track_axis: str = 'TRACK_Y') -> bpy.types.Constraint:
    """
    Damped Track solves the shortest-arc rotation from the bone's local
    track_axis toward the target. Unlike Track To it has no 'up' vector,
    so it never flips at 180°. Ideal for eye rigs and look-at helpers.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')

    con = arm_obj.pose.bones[bone_name].constraints.new(type='DAMPED_TRACK')
    con.name       = "DT_LookAt"
    con.target     = target
    con.track_axis = track_axis

    bpy.ops.object.mode_set(mode='OBJECT')
    return con


def add_copy_location(arm_obj: bpy.types.Object,
                      bone_name: str,
                      target: bpy.types.Object) -> bpy.types.Constraint:
    """
    Copy Location in WORLD space, Y-axis excluded so the bone only
    follows the XZ plane of the target. A common pattern for character
    feet that must stay grounded while following a control empty.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')

    pb  = arm_obj.pose.bones[bone_name]
    con = pb.constraints.new(type='COPY_LOCATION')
    con.name         = "CopyLoc"
    con.target       = target
    con.use_y        = False
    con.target_space = 'WORLD'
    con.owner_space  = 'WORLD'

    bpy.ops.object.mode_set(mode='OBJECT')
    return con


def all_constraints(arm_obj: bpy.types.Object) -> list[bpy.types.Constraint]:
    return [c for pb in arm_obj.pose.bones for c in pb.constraints]


def mute_all(arm_obj: bpy.types.Object) -> list[bool]:
    """Snapshot mute states, then mute every constraint."""
    cons   = all_constraints(arm_obj)
    states = [c.mute for c in cons]
    for c in cons:
        c.mute = True
    return states


def restore_all(arm_obj: bpy.types.Object, states: list[bool]) -> None:
    for c, was_muted in zip(all_constraints(arm_obj), states):
        c.mute = was_muted


def apply_visual_transforms(arm_obj: bpy.types.Object) -> None:
    """
    Absorb the current visual transform into matrix_basis for every
    selected pose bone. Requires a VIEW_3D area; skips gracefully in
    headless renders where no screen exists.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')

    area = next((a for a in bpy.context.screen.areas
                 if a.type == 'VIEW_3D'), None)
    if area is None:
        bpy.ops.object.mode_set(mode='OBJECT')
        return

    region = next(r for r in area.regions if r.type == 'WINDOW')
    with bpy.context.temp_override(area=area, region=region,
                                   active_object=arm_obj):
        bpy.ops.pose.visual_transform_apply()

    bpy.ops.object.mode_set(mode='OBJECT')


# ─── Strategy A — NLA bake ────────────────────────────────────────────────────

def bake_to_action(arm_obj: bpy.types.Object,
                   start: int, end: int,
                   name: str = "Baked") -> bpy.types.Action | None:
    """
    visual_keying=True: key the post-constraint transform, not the local rest.
    clear_constraints=True: destructive — removes all constraints after bake.
    Set to False if you want to keep the rig but add a frozen action on top.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')

    bpy.ops.nla.bake(
        frame_start=start,
        frame_end=end,
        only_selected=True,
        visual_keying=True,
        clear_constraints=True,
        use_current_action=False,
        bake_types={'POSE'},
    )
    action = arm_obj.animation_data.action
    if action:
        action.name = name
    bpy.ops.object.mode_set(mode='OBJECT')
    return action


# ─── Export ───────────────────────────────────────────────────────────────────

def export_glb(arm_obj: bpy.types.Object, path: str) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(path),
        use_selection=True,
        export_apply=True,
        export_animations=True,
        export_optimize_animation_size=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )


# ─── Audit ────────────────────────────────────────────────────────────────────

def audit(arm_obj: bpy.types.Object, label: str = "") -> None:
    if label:
        print(f"\n=== {label} ===")
    print(f"{'Bone':<18} {'Name':<22} {'Type':<20} Inf   Muted")
    print("─" * 74)
    for pb in arm_obj.pose.bones:
        for c in pb.constraints:
            print(f"{pb.name:<18} {c.name:<22} {c.type:<20} "
                  f"{c.influence:.2f}  {'Y' if c.mute else 'N'}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    purge_orphans()
    arm_obj, _  = build_two_bone_arm()
    target      = make_animated_target()

    add_damped_track(arm_obj,  "Child", target, track_axis='TRACK_Y')
    add_copy_location(arm_obj, "Root",  target)

    audit(arm_obj, "Before export")

    # ── Strategy B (non-destructive still-pose export) ──
    bpy.context.scene.frame_set(1)
    states = mute_all(arm_obj)
    apply_visual_transforms(arm_obj)
    export_glb(arm_obj, OUTPUT_GLB)
    restore_all(arm_obj, states)
    print(f"\nGLB written: {bpy.path.abspath(OUTPUT_GLB)}")

    audit(arm_obj, "After restore (constraints intact)")

    # ── Strategy A (destructive bake — uncomment to run) ──
    # bake_to_action(arm_obj, BAKE_START, BAKE_END, name="Baked")
    # export_glb(arm_obj, OUTPUT_GLB)


if __name__ == "__main__":
    main()
