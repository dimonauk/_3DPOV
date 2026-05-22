"""
holoflow_macros/animation_drivers_parametric_shader.py
=======================================================
Blender 5.1 | Holoflow Studio | CC0

Reusable helper: wire a custom property on an Object to one or more
node socket default_values via SCRIPTED drivers.

Usage:
    from holoflow_macros.animation_drivers_parametric_shader import wire_prop_to_socket

    wire_prop_to_socket(
        obj=bpy.data.objects["crystal_shard"],
        prop_name="energy_level",
        node=mat.node_tree.nodes["Emission"],
        socket_name="Strength",
        expression="energy * 4.0",
        var_name="energy",
    )
"""

import bpy


def add_custom_prop(obj: bpy.types.Object, prop_name: str,
                    default: float = 0.0, min_val: float = 0.0,
                    max_val: float = 1.0) -> None:
    """Add a custom property with UI slider metadata."""
    obj[prop_name] = default
    ui = obj.id_properties_ui(prop_name)
    ui.update(min=min_val, max=max_val, soft_min=min_val, soft_max=max_val,
              default=default)


def wire_prop_to_socket(
    obj: bpy.types.Object,
    prop_name: str,
    node: bpy.types.ShaderNode,
    socket_name: str,
    expression: str,
    var_name: str = "prop",
) -> bpy.types.FCurve:
    """
    Add a SCRIPTED driver on node.inputs[socket_name].default_value that
    reads obj[prop_name] and evaluates expression.

    Returns the FCurve so the caller can set fcurve.driver.use_self or
    add FCurve modifiers if needed.

    Example expression mapping 0-1 → 0-4:  "prop * 4.0"
    Example expression clamped:             "max(0.0, min(1.0, prop))"
    """
    socket = node.inputs[socket_name]
    fcurve = socket.driver_add("default_value")

    drv = fcurve.driver
    drv.type       = 'SCRIPTED'
    drv.expression = expression

    var = drv.variables.new()
    var.name = var_name
    var.type = 'SINGLE_PROP'

    tgt = var.targets[0]
    tgt.id_type   = 'OBJECT'          # explicit: do NOT rely on default
    tgt.id        = obj
    tgt.data_path = f'["{prop_name}"]'

    return fcurve


def animate_prop(obj: bpy.types.Object, prop_name: str,
                 keyframes: list[tuple[int, float]],
                 interpolation: str = 'BEZIER',
                 easing: str = 'EASE_IN_OUT') -> None:
    """
    Insert keyframes on a custom property.

    keyframes: list of (frame, value) tuples.

    Note: these keyframes are on the Object, NOT on the material socket.
    They animate obj[prop_name], which the driver reads each frame.
    They do NOT automatically export to glTF — see KHR_animation_pointer.
    """
    for frame, value in keyframes:
        obj[prop_name] = value
        obj.keyframe_insert(data_path=f'["{prop_name}"]', frame=frame)

    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            if fc.data_path == f'["{prop_name}"]':
                for kp in fc.keyframe_points:
                    kp.interpolation = interpolation
                    kp.easing        = easing
