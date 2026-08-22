"""
holoflow_macros.gn_uv_unwrap_pack
Blender 5.1 — reusable helper for procedural UV inside GN modifier stacks.

Usage
-----
    from holoflow_macros.gn_uv_unwrap_pack import add_uv_unwrap_pack_chain

    add_uv_unwrap_pack_chain(
        ng,
        upstream_geo_output,   # NodeSocket — flat-shaded geometry out
        store_geo_input,       # NodeSocket — StoreNamedAttribute geometry in
        seam_angle_deg=42.0,
        uv_margin=0.003,
        island_margin=0.005,
        uv_attr_name="UVMap",
        x_offset=0,
        y_offset=0,
    )

Adds the following nodes to ng and returns the StoreNamedAttribute node:
    EdgeAngle → GREATER_THAN(seam) → UVUnwrap → PackUVIslands → StoreNamedAttribute

The caller wires StoreNamedAttribute.outputs["Geometry"] to GroupOutput.
"""

import bpy
import math


def add_uv_unwrap_pack_chain(
    ng,
    upstream_geo_output,
    store_geo_input,
    seam_angle_deg: float = 42.0,
    uv_margin: float = 0.003,
    island_margin: float = 0.005,
    uv_attr_name: str = "UVMap",
    x_offset: float = 0.0,
    y_offset: float = 0.0,
):
    """Wire UV Unwrap + Pack Islands chain into node group ng.

    Flat shading on the upstream geometry is the caller's responsibility —
    EdgeAngle reads geometric face normals and works correctly regardless,
    but the final mesh should be flat-shaded before this chain is called
    so the CORNER seam splits are visible in the rendered result.
    """
    lk = ng.links.new
    X = x_offset
    Y = y_offset

    # Edge angle — EDGE domain field.
    edge_angle = ng.nodes.new("GeometryNodeEdgeAngle")
    edge_angle.location = (X + 200, Y - 100)

    # Convert degrees → radians for GREATER_THAN comparison.
    deg2rad = ng.nodes.new("ShaderNodeMath")
    deg2rad.operation = "RADIANS"
    deg2rad.location = (X + 200, Y - 280)
    deg2rad.inputs[0].default_value = math.radians(seam_angle_deg)

    gt_seam = ng.nodes.new("ShaderNodeMath")
    gt_seam.operation = "GREATER_THAN"
    gt_seam.location = (X + 420, Y - 100)
    lk(edge_angle.outputs["Unsigned Angle"], gt_seam.inputs[0])
    lk(deg2rad.outputs["Value"], gt_seam.inputs[1])

    # UV Unwrap — field node, no Geometry socket.
    uv_unwrap = ng.nodes.new("GeometryNodeUVUnwrap")
    uv_unwrap.method = "ANGLE_BASED"
    uv_unwrap.location = (X + 640, Y + 100)
    uv_unwrap.inputs["Margin"].default_value = uv_margin
    lk(gt_seam.outputs["Value"], uv_unwrap.inputs["Seam"])

    # Pack UV Islands — field node.
    pack_uv = ng.nodes.new("GeometryNodePackUVIslands")
    pack_uv.location = (X + 880, Y + 100)
    pack_uv.inputs["Margin"].default_value = island_margin
    pack_uv.inputs["Rotate"].default_value = True
    lk(uv_unwrap.outputs["UV"], pack_uv.inputs["UV"])

    # Store Named Attribute — geometry-socket node that anchors the field chain.
    store_uv = ng.nodes.new("GeometryNodeStoreNamedAttribute")
    store_uv.domain = "CORNER"
    store_uv.data_type = "FLOAT2"
    store_uv.location = (X + 1120, Y + 100)
    store_uv.inputs["Name"].default_value = uv_attr_name
    lk(pack_uv.outputs["UV"], store_uv.inputs["Value"])

    # Geometry spine: upstream → StoreNamedAttribute.
    lk(upstream_geo_output, store_geo_input)

    return store_uv
