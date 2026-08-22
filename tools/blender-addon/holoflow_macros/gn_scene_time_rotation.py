"""
holoflow_macros/gn_scene_time_rotation.py
Blender 5.1  ·  CC0  ·  Holoflow Studio

Reusable helper: attach a Geometry Nodes modifier to any Blender object that
drives local Z rotation via Scene Time — keyframe-free, non-destructive.

Usage (from the Blender Python console or another script):
    import sys; sys.path.insert(0, '/path/to/holoflow_macros')
    from gn_scene_time_rotation import add_scene_time_rotation

    obj = bpy.context.active_object
    add_scene_time_rotation(obj, angle_per_frame=0.05)    # ~3°/frame CCW

See: blender-tutorial-gn-scene-time-rotation-mechanical-clockwork
"""

import bpy
import math


def add_scene_time_rotation(
    obj,
    angle_per_frame: float,
    axis: str = 'Z',
    phase_rad: float = 0.0,
    mod_name: str = 'SceneTimeRotation',
) -> bpy.types.NodesModifier:
    """
    Add a GN modifier to *obj* that rotates it around *axis* at a constant rate.

    angle_per_frame: radians advanced per frame (negative = clockwise from +Z)
    axis:            'X', 'Y', or 'Z'
    phase_rad:       constant added after the Frame × rate multiply (dephase gears)
    mod_name:        name given to the modifier slot

    Returns the created NodesModifier.

    Requires Blender 4.3+ for FunctionNodeEulerToRotation.
    Requires Blender 4.0+ for tree.interface (replaces deprecated tree.inputs).
    """
    if bpy.app.version < (4, 3, 0):
        raise RuntimeError(
            f'FunctionNodeEulerToRotation requires Blender 4.3+; '
            f'running {bpy.app.version_string}.'
        )

    mod  = obj.modifiers.new(mod_name, 'NODES')
    name = f'GN_ZRotation_{obj.name}'
    tree = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    mod.node_group = tree

    iface = tree.interface
    iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = tree.nodes
    links = tree.links

    gi   = nodes.new('NodeGroupInput');          gi.location   = (-700,  0)
    go   = nodes.new('NodeGroupOutput');         go.location   = ( 600,  0)
    time = nodes.new('GeometryNodeInputSceneTime'); time.location = (-500, 140)
    mul  = nodes.new('ShaderNodeMath');          mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = angle_per_frame; mul.location  = (-300, 140)
    add  = nodes.new('ShaderNodeMath');          add.operation = 'ADD'
    add.inputs[1].default_value = phase_rad;    add.location  = (-100, 140)
    cxyz = nodes.new('ShaderNodeCombineXYZ');   cxyz.location = ( 100, 140)
    e2r  = nodes.new('FunctionNodeEulerToRotation'); e2r.location = ( 300, 140)
    xfrm = nodes.new('GeometryNodeTransform');  xfrm.location = ( 300, -40)

    links.new(time.outputs['Frame'],  mul.inputs[0])
    links.new(mul.outputs[0],         add.inputs[0])
    links.new(add.outputs[0],         cxyz.inputs[axis.upper()])
    links.new(cxyz.outputs['Vector'], e2r.inputs['Euler'])
    links.new(e2r.outputs['Rotation'], xfrm.inputs['Rotation'])
    links.new(gi.outputs['Geometry'],  xfrm.inputs['Geometry'])
    links.new(xfrm.outputs['Geometry'], go.inputs['Geometry'])

    return mod


def add_sinusoidal_rotation(
    obj,
    amplitude_rad: float,
    period_seconds: float,
    axis: str = 'X',
    mod_name: str = 'SinusoidalRotation',
) -> bpy.types.NodesModifier:
    """
    Add a GN modifier that applies sin(Seconds × 2π/period) × amplitude rotation.

    Uses SceneTime.Seconds (not Frame) for FPS-independent behaviour.
    axis: 'X' for pendulum-style forward/back, 'Z' for turntable-style oscillation.
    """
    if bpy.app.version < (4, 3, 0):
        raise RuntimeError(
            f'FunctionNodeEulerToRotation requires Blender 4.3+; '
            f'running {bpy.app.version_string}.'
        )

    mod  = obj.modifiers.new(mod_name, 'NODES')
    tree = bpy.data.node_groups.new(f'GN_Sin_{obj.name}', 'GeometryNodeTree')
    mod.node_group = tree

    iface = tree.interface
    iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = tree.nodes
    links = tree.links

    gi   = nodes.new('NodeGroupInput');          gi.location   = (-700,  0)
    go   = nodes.new('NodeGroupOutput');         go.location   = ( 600,  0)
    time = nodes.new('GeometryNodeInputSceneTime'); time.location = (-500, 140)
    freq = nodes.new('ShaderNodeMath');          freq.operation = 'MULTIPLY'
    freq.inputs[1].default_value = 2.0 * math.pi / period_seconds
    freq.location = (-300, 140)
    sin_ = nodes.new('ShaderNodeMath');          sin_.operation = 'SINE'
    sin_.location = (-100, 140)
    amp  = nodes.new('ShaderNodeMath');          amp.operation = 'MULTIPLY'
    amp.inputs[1].default_value = amplitude_rad; amp.location  = ( 100, 140)
    cxyz = nodes.new('ShaderNodeCombineXYZ');   cxyz.location = ( 280, 140)
    e2r  = nodes.new('FunctionNodeEulerToRotation'); e2r.location = ( 460, 140)
    xfrm = nodes.new('GeometryNodeTransform');  xfrm.location = ( 460, -40)

    links.new(time.outputs['Seconds'], freq.inputs[0])
    links.new(freq.outputs[0],         sin_.inputs[0])
    links.new(sin_.outputs[0],         amp.inputs[0])
    links.new(amp.outputs[0],          cxyz.inputs[axis.upper()])
    links.new(cxyz.outputs['Vector'],  e2r.inputs['Euler'])
    links.new(e2r.outputs['Rotation'], xfrm.inputs['Rotation'])
    links.new(gi.outputs['Geometry'],  xfrm.inputs['Geometry'])
    links.new(xfrm.outputs['Geometry'], go.inputs['Geometry'])

    return mod
