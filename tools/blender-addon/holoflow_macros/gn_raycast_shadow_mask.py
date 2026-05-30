#!/usr/bin/env python3
"""
gn_raycast_shadow_mask.py — reusable macro
Blender 5.1 | CC0 | Holoflow Studio

Builds the Raycast shadow-mask subgraph inside an existing GN tree.
Returns the StoreNamedAttribute node so the caller can wire geometry through it.

Usage:
    import gn_raycast_shadow_mask as rsm

    n_store = rsm.build(
        tree         = mod.node_group,
        blocker_obj  = bpy.data.objects["my_occluder"],
        attr_name    = "shadow_mask",
        ray_dir      = (0.0, 0.0, 1.0),
        ray_length   = 6.0,
        x_offset     = 0.0,  # optional layout X shift
    )
    # wire your geometry into n_store.inputs[0] and out of n_store.outputs[0]
"""

import bpy
from typing import Tuple


def build(
    tree: bpy.types.NodeTree,
    blocker_obj: bpy.types.Object,
    attr_name: str = "shadow_mask",
    ray_dir: Tuple[float, float, float] = (0.0, 0.0, 1.0),
    ray_length: float = 6.0,
    x_offset: float = 0.0,
) -> bpy.types.Node:
    """Return the StoreNamedAttribute node after wiring the Raycast subgraph."""

    lk = tree.links.new

    n_obj = tree.nodes.new("GeometryNodeObjectInfo")
    n_obj.transform_space = 'RELATIVE'
    n_obj.inputs[0].default_value = blocker_obj
    n_obj.inputs[1].default_value = False        # As Instance=False
    n_obj.location = (x_offset - 400, -200)

    n_xyz = tree.nodes.new("ShaderNodeCombineXYZ")
    n_xyz.inputs[0].default_value = ray_dir[0]
    n_xyz.inputs[1].default_value = ray_dir[1]
    n_xyz.inputs[2].default_value = ray_dir[2]
    n_xyz.location = (x_offset - 400, -360)

    n_ray = tree.nodes.new("GeometryNodeRaycast")
    n_ray.data_type = 'FLOAT'
    n_ray.inputs[4].default_value = ray_length
    n_ray.location = (x_offset - 200, -260)

    n_sw = tree.nodes.new("GeometryNodeSwitch")
    n_sw.input_type = 'FLOAT'
    n_sw.inputs[1].default_value = 1.0   # no hit → lit
    n_sw.inputs[2].default_value = 0.0   # hit    → shadow
    n_sw.location = (x_offset, -260)

    n_store = tree.nodes.new("GeometryNodeStoreNamedAttribute")
    n_store.data_type = 'FLOAT'
    n_store.domain    = 'POINT'
    n_store.inputs[2].default_value = attr_name
    n_store.location = (x_offset + 200, 0)

    lk(n_obj.outputs['Geometry'], n_ray.inputs[0])
    lk(n_xyz.outputs['Vector'],   n_ray.inputs[3])
    lk(n_ray.outputs[0],          n_sw.inputs[0])
    lk(n_sw.outputs[0],           n_store.inputs[3])

    return n_store
