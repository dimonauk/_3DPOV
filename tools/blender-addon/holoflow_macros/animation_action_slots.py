"""
holoflow_macros/animation_action_slots.py
Blender 5.1 — Multi-Slot Action Builder Macro

Utility function that builds a multi-slot Action, assigns it to a list
of (object, slot_id_type, slot_name) tuples, and returns the action.
Call from the Scripting workspace or import into a larger add-on.

Usage:
    from holoflow_macros.animation_action_slots import build_multi_slot_action

    action = build_multi_slot_action(
        "perf_01",
        [
            (arm_obj,  "OBJECT", "body_rig"),
            (prop_obj, "OBJECT", "sword_prop"),
            (face_obj.data.shape_keys, "KEY", "face_shape_keys"),
        ]
    )
"""

import bpy
from typing import Sequence


def build_multi_slot_action(
    action_name: str,
    routing: Sequence[tuple],
) -> bpy.types.Action:
    """
    Create an Action with one slot per routing entry.

    Args:
        action_name: Name for the new bpy.data.actions entry.
        routing:     List of (id_block, id_type_str, slot_name) tuples.
                     id_block  — the animatable ID to receive the slot
                                 (bpy.types.Object, bpy.types.Key, etc.)
                     id_type   — RNA short name: "OBJECT", "KEY", "MATERIAL" …
                     slot_name — human label shown in the Dope Sheet

    Returns:
        The created bpy.types.Action.

    Raises:
        AttributeError: If running on Blender < 5.0 where Action.slots
                        does not exist.
    """
    if action_name in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[action_name])

    action = bpy.data.actions.new(action_name)

    for id_block, id_type, slot_name in routing:
        slot = action.slots.new(id_type, slot_name)
        id_block.animation_data_create()
        id_block.animation_data.action      = action
        id_block.animation_data.action_slot = slot

    return action
