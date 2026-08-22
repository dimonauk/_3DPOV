"""
holoflow_macros/constraint_export_pipeline.py
Blender 5.1 | CC0 2026

Reusable helpers for the Holoflow export pipeline.
Mutes bone constraints, applies visual transforms, and restores
after GLB export — so the source .blend rig survives intact.

Usage:
    from holoflow_macros.constraint_export_pipeline import (
        mute_all, restore_all, apply_visual_transforms, export_glb_clean
    )

    arm_obj = bpy.context.active_object
    states  = mute_all(arm_obj)
    apply_visual_transforms(arm_obj)
    export_glb_clean(arm_obj, "//output/char.glb")
    restore_all(arm_obj, states)
"""

import bpy


def all_constraints(arm_obj: bpy.types.Object) -> list[bpy.types.Constraint]:
    """Flat list of every pose-bone constraint on the armature."""
    return [c for pb in arm_obj.pose.bones for c in pb.constraints]


def mute_all(arm_obj: bpy.types.Object) -> list[bool]:
    """
    Snapshot mute states, then mute every constraint.
    Returns states list for restore_all().
    """
    cons   = all_constraints(arm_obj)
    states = [c.mute for c in cons]
    for c in cons:
        c.mute = True
    return states


def restore_all(arm_obj: bpy.types.Object, states: list[bool]) -> None:
    """Restore constraint mute states from a snapshot."""
    for c, was_muted in zip(all_constraints(arm_obj), states):
        c.mute = was_muted


def apply_visual_transforms(arm_obj: bpy.types.Object) -> bool:
    """
    Apply visual transforms to all selected pose bones.
    Returns True on success, False in headless context (no VIEW_3D area).
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')

    area = next(
        (a for a in bpy.context.screen.areas if a.type == 'VIEW_3D'), None
    )
    if area is None:
        bpy.ops.object.mode_set(mode='OBJECT')
        return False

    region = next(r for r in area.regions if r.type == 'WINDOW')
    with bpy.context.temp_override(area=area, region=region,
                                   active_object=arm_obj):
        bpy.ops.pose.visual_transform_apply()

    bpy.ops.object.mode_set(mode='OBJECT')
    return True


def export_glb_clean(arm_obj: bpy.types.Object, path: str) -> None:
    """Export armature as GLB with Holoflow defaults (Draco 6, WebP)."""
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


def audit_constraints(arm_obj: bpy.types.Object, label: str = "") -> None:
    """Print constraint table — call before export to catch surprises."""
    if label:
        print(f"\n=== {label} ===")
    print(f"{'Bone':<18} {'Constraint':<22} {'Type':<20} Inf   Muted")
    print("─" * 76)
    for pb in arm_obj.pose.bones:
        for c in pb.constraints:
            print(
                f"{pb.name:<18} {c.name:<22} {c.type:<20} "
                f"{c.influence:.2f}  {'Y' if c.mute else 'N'}"
            )
