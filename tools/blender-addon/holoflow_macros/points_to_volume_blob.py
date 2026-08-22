# tools/blender-addon/holoflow_macros/points_to_volume_blob.py
# Blender 5.1 | CC0
#
# Reusable helper: convert a point cloud (or mesh vertices) into a fused
# organic blob mesh via the OpenVDB volume pipeline.
# Callers supply an existing Geometry Nodes tree; this function appends the
# four-node volume chain and returns the VolumeToMesh node for further wiring.

import bpy


def add_volume_blob_chain(
    ng: bpy.types.GeometryNodeTree,
    points_output,            # output socket that carries a Points geometry
    voxel_size: float = 0.06,
    point_radius: float = 0.32,
    threshold_default: float = 0.08,
    adaptivity_default: float = 0.45,
    expose_sockets: bool = True,
) -> bpy.types.Node:
    """
    Append PointsToVolume → VolumeToMesh → SetShadeSmooth to `ng`.

    Returns the SetShadeSmooth node so callers can wire its Geometry output
    to GroupOutput or further processing.

    If `expose_sockets=True`, adds 'Threshold' and 'Adaptivity' group input
    sockets and wires them to the VolumeToMesh node.

    Rule: POINT_RADIUS must be >= VOXEL_SIZE * 3 to avoid marching-cubes
    staircase artefacts.  The caller is responsible for honouring this.
    """
    nodes = ng.nodes
    links = ng.links

    n_ptv = nodes.new("GeometryNodePointsToVolume")
    n_ptv.resolution_mode = "VOXEL_SIZE"
    n_ptv.inputs["Voxel Size"].default_value = voxel_size
    n_ptv.inputs["Density"].default_value    = 1.0
    n_ptv.inputs["Radius"].default_value     = point_radius

    n_vtm = nodes.new("GeometryNodeVolumeToMesh")
    n_vtm.resolution_mode = "GRID"

    n_smooth = nodes.new("GeometryNodeSetShadeSmooth")
    n_smooth.domain = "FACE"
    n_smooth.inputs["Shade Smooth"].default_value = False

    links.new(points_output,          n_ptv.inputs[0])
    links.new(n_ptv.outputs["Volume"], n_vtm.inputs[0])
    links.new(n_vtm.outputs["Mesh"],   n_smooth.inputs[0])

    if expose_sockets:
        s_thresh = ng.interface.new_socket(
            "Threshold", in_out="INPUT", socket_type="NodeSocketFloat"
        )
        s_thresh.default_value = threshold_default
        s_thresh.min_value     = 0.001
        s_thresh.max_value     = 2.0

        s_adapt = ng.interface.new_socket(
            "Adaptivity", in_out="INPUT", socket_type="NodeSocketFloat"
        )
        s_adapt.default_value = adaptivity_default
        s_adapt.min_value     = 0.0
        s_adapt.max_value     = 1.0

        # Locate the GroupInput node to get the new socket outputs
        n_in = next(
            n for n in nodes if n.type == "GROUP_INPUT"
        )
        links.new(n_in.outputs["Threshold"],  n_vtm.inputs[1])
        links.new(n_in.outputs["Adaptivity"], n_vtm.inputs[2])
    else:
        n_vtm.inputs[1].default_value = threshold_default
        n_vtm.inputs[2].default_value = adaptivity_default

    return n_smooth
