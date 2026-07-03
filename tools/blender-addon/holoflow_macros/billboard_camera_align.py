"""
holoflow_macros/billboard_camera_align.py
Camera-facing billboard setup for GN instance trees (Blender 5.1)

Adds the Active Camera → Separate Matrix → Align Euler to Vector → Rotate
Instances chain to an existing GeometryNodeTree, grafting onto an existing
Instances socket. Exposed as a macro because this pattern recurs across
particle-effect, foliage, and HUD-element GN trees.

Usage
-----
from holoflow_macros.billboard_camera_align import graft_billboard_camera_align

# mode='global'   — all instances rotate identically (parallel to image plane)
# mode='per_sprite' — each instance faces the camera from its own position
ng = bpy.data.node_groups["MyTree"]
graft_billboard_camera_align(ng, instances_socket, mode="global")
"""

import bpy


def graft_billboard_camera_align(
    ng: bpy.types.NodeTree,
    instances_socket: bpy.types.NodeSocket,
    mode: str = "global",
) -> bpy.types.NodeSocket:
    """
    Graft camera-facing rotation onto an existing Instances socket.

    Parameters
    ----------
    ng                : the GeometryNodeTree to modify
    instances_socket  : the output socket carrying the Instances geometry
    mode              : 'global' (all sprites rotate identically, screen-aligned)
                        'per_sprite' (each sprite independently faces camera pos)

    Returns
    -------
    The Instances output socket of the final Rotate Instances node, ready to
    wire into Group Output or the next stage of the tree.
    """
    lk = ng.links.new

    if mode == "global":
        return _graft_global(ng, lk, instances_socket)
    elif mode == "per_sprite":
        return _graft_per_sprite(ng, lk, instances_socket)
    else:
        raise ValueError(f"Unknown billboard mode: {mode!r}. Use 'global' or 'per_sprite'.")


def _graft_global(
    ng: bpy.types.NodeTree,
    lk,
    instances_socket: bpy.types.NodeSocket,
) -> bpy.types.NodeSocket:
    """
    Globally-aligned billboard: all instances share one rotation derived from
    the camera matrix. Parallel-to-image-plane; standard game-engine billboard.
    """
    # Active Camera → world 4×4 matrix
    n_cam = ng.nodes.new("GeometryNodeInputActiveCamera")

    # Separate Matrix → Column 3 (camera +Z backward axis in world space)
    n_sep = ng.nodes.new("FunctionNodeSeparateMatrix")
    lk(n_cam.outputs["Camera"], n_sep.inputs["Matrix"])

    # Negate to get camera forward (viewing) direction
    n_neg = ng.nodes.new("ShaderNodeVectorMath")
    n_neg.operation = "SCALE"
    n_neg.inputs["Scale"].default_value = -1.0
    lk(n_sep.outputs[2], n_neg.inputs["Vector"])  # outputs[2] = Column 3

    # Align local +Z of each instance to the camera viewing direction
    n_aev = ng.nodes.new("FunctionNodeAlignEulerToVector")
    n_aev.axis       = "Z"
    n_aev.pivot_axis = "AUTO"
    lk(n_neg.outputs["Vector"], n_aev.inputs["Vector"])

    # Apply rotation to the incoming instances
    n_rot = ng.nodes.new("GeometryNodeRotateInstances")
    n_rot.inputs["Local Space"].default_value = False
    lk(instances_socket,           n_rot.inputs["Instances"])
    lk(n_aev.outputs["Rotation"],  n_rot.inputs["Rotation"])

    return n_rot.outputs["Instances"]


def _graft_per_sprite(
    ng: bpy.types.NodeTree,
    lk,
    instances_socket: bpy.types.NodeSocket,
) -> bpy.types.NodeSocket:
    """
    Per-sprite billboard: each instance independently faces the camera from its
    own world position. Correct when camera is close or FOV is wide.

    Formula:  facing_dir = normalize(camera_pos - sprite_pos)
    """
    # Active Camera matrix
    n_cam = ng.nodes.new("GeometryNodeInputActiveCamera")

    # Extract camera world position = Column 4 (outputs[3])
    n_sep = ng.nodes.new("FunctionNodeSeparateMatrix")
    lk(n_cam.outputs["Camera"], n_sep.inputs["Matrix"])

    # Sprite position (per-instance, evaluated in instance domain)
    n_pos = ng.nodes.new("GeometryNodeInputPosition")

    # Vector: camera_pos − sprite_pos
    n_sub = ng.nodes.new("ShaderNodeVectorMath")
    n_sub.operation = "SUBTRACT"
    lk(n_sep.outputs[3], n_sub.inputs[0])  # camera position (Column 4)
    lk(n_pos.outputs["Position"], n_sub.inputs[1])

    # Normalize → unit vector from sprite toward camera
    n_nrm = ng.nodes.new("ShaderNodeVectorMath")
    n_nrm.operation = "NORMALIZE"
    lk(n_sub.outputs["Vector"], n_nrm.inputs["Vector"])

    # Align local +Z of each instance to its unique facing direction
    n_aev = ng.nodes.new("FunctionNodeAlignEulerToVector")
    n_aev.axis       = "Z"
    n_aev.pivot_axis = "AUTO"
    lk(n_nrm.outputs["Vector"], n_aev.inputs["Vector"])

    # Apply rotation
    n_rot = ng.nodes.new("GeometryNodeRotateInstances")
    n_rot.inputs["Local Space"].default_value = False
    lk(instances_socket,          n_rot.inputs["Instances"])
    lk(n_aev.outputs["Rotation"], n_rot.inputs["Rotation"])

    return n_rot.outputs["Instances"]
