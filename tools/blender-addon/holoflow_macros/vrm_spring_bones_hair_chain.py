"""
holoflow_macros/vrm_spring_bones_hair_chain.py
Reusable macro: attach a spring-bone hair chain to an existing armature.
Blender 5.1 · CC0

Usage:
    from holoflow_macros.vrm_spring_bones_hair_chain import add_spring_chain
    add_spring_chain(arm_obj, parent_bone_name='Head', joints=4)
"""

import bpy
from mathutils import Vector

# Defaults match the vrm-spring-bones-hair-chain blueprint
DEFAULTS = dict(
    joints      = 4,
    joint_len   = 0.08,
    joint_arc_y = 0.025,
    stiffness   = 4.0,
    drag        = 0.4,
    hit_radius  = 0.04,
    falloff     = 0.15,   # stiffness taper per joint
    collection  = 'SpringBone_Hair',
    color_set   = 'THEME08',
)


def add_spring_chain(arm_obj: bpy.types.Object,
                     parent_bone_name: str,
                     start_offset: Vector = Vector((0.0, -0.10, 0.0)),
                     **kwargs) -> list[str]:
    """
    Add a linear spring-bone chain to arm_obj parented off parent_bone_name.
    Returns list of bone names created.

    start_offset: local offset from parent tail where the first spring joint head sits.
    kwargs override any key in DEFAULTS.
    """
    cfg = {**DEFAULTS, **kwargs}
    arm = arm_obj.data

    prev_mode = arm_obj.mode
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')

    parent_eb = arm.edit_bones[parent_bone_name]
    chain_start = parent_eb.tail + start_offset

    created: list[str] = []
    prev = parent_eb
    for i in range(1, cfg['joints'] + 1):
        name = f'{cfg["collection"]}_{i}'
        b = arm.edit_bones.new(name)
        drift = Vector((0.0, -cfg['joint_arc_y'] * (i - 1), 0.0))
        b.head = chain_start + drift + Vector((0, 0, -(i - 1) * cfg['joint_len']))
        b.tail = b.head + Vector((0.0, -cfg['joint_arc_y'], -cfg['joint_len']))
        b.parent      = prev
        b.use_connect = False   # free-pivot required for spring solver
        created.append(name)
        prev = b

    bpy.ops.object.mode_set(mode='OBJECT')

    # Bone collection (Blender 4.0+ API)
    if cfg['collection'] not in [c.name for c in arm.collections]:
        coll = arm.collections.new(cfg['collection'])
        coll.color_set = cfg['color_set']
    else:
        coll = arm.collections[cfg['collection']]

    for name in created:
        coll.assign(arm.bones[name])

    # Custom spring properties (taper toward tip)
    for idx, name in enumerate(created):
        bone = arm.bones[name]
        bone['vrm_spring_stiffness']  = round(cfg['stiffness'] * (1 - idx * cfg['falloff']), 2)
        bone['vrm_spring_drag_force'] = cfg['drag']
        bone['vrm_spring_hit_radius'] = cfg['hit_radius']

    bpy.ops.object.mode_set(mode=prev_mode if prev_mode != 'OBJECT' else 'OBJECT')
    return created
