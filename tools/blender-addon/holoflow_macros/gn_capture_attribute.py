"""
holoflow_macros/gn_capture_attribute.py
One-shot helper: add a Capture→Store→Realize attribute pipeline to an
existing Geometry Nodes tree.  | Blender 5.1 | CC0 | Holoflow Studio

Usage:
    from holoflow_macros.gn_capture_attribute import add_capture_store_chain
    add_capture_store_chain(
        tree,
        source_geometry_socket,   # NodeSocket — the geometry carrying the points
        value_socket,             # NodeSocket — the field to capture (Float)
        instance_socket,          # NodeSocket — the geometry to instance
        material,                 # bpy.types.Material — assigned before instancing
        attr_name="colour_phase", # name for StoreNamedAttribute
    )
    # Returns: (realize_out, capture_attr_out)
    # realize_out    — NodeSocket to feed GroupOutput.Geometry
    # capture_attr_out — NodeSocket (captured float, also available upstream)
"""
from __future__ import annotations
import bpy


def add_capture_store_chain(
    tree: bpy.types.NodeTree,
    source_geometry_socket: bpy.types.NodeSocket,
    value_socket: bpy.types.NodeSocket,
    instance_socket: bpy.types.NodeSocket,
    material: bpy.types.Material,
    attr_name: str = "colour_phase",
    shade_smooth: bool = False,
) -> tuple[bpy.types.NodeSocket, bpy.types.NodeSocket]:
    """
    Inserts the canonical Capture Attribute → Instance on Points →
    Store Named Attribute → Realize Instances chain into an existing GN tree.

    Returns (realize_geometry_out, capture_attribute_out) so the caller can
    either pipe the geometry to GroupOutput or continue the chain.
    """
    nodes = tree.nodes
    links = tree.links

    # 1. CaptureAttribute — freeze the value field at POINT domain
    n_cap = nodes.new("GeometryNodeCaptureAttribute")
    n_cap.data_type = "FLOAT"
    n_cap.domain    = "POINT"
    links.new(source_geometry_socket, n_cap.inputs[0])
    links.new(value_socket,           n_cap.inputs[1])

    # 2. SetMaterial on the instance template
    n_smat = nodes.new("GeometryNodeSetMaterial")
    n_smat.inputs[2].default_value = material
    links.new(instance_socket, n_smat.inputs[0])

    # 3. InstanceOnPoints — one instance per scatter point
    n_iop = nodes.new("GeometryNodeInstanceOnPoints")
    links.new(n_cap.outputs[0],  n_iop.inputs[0])   # captured cloud → Points
    links.new(n_smat.outputs[0], n_iop.inputs[2])   # sphere+mat     → Instance

    # 4. StoreNamedAttribute — name the captured value on INSTANCE domain
    n_store = nodes.new("GeometryNodeStoreNamedAttribute")
    n_store.data_type = "FLOAT"
    n_store.domain    = "INSTANCE"
    n_store.inputs[2].default_value = attr_name
    links.new(n_iop.outputs[0],  n_store.inputs[0])
    links.new(n_cap.outputs[1],  n_store.inputs[3])

    # 5. RealizeInstances — INSTANCE attrs → POINT attrs on expanded mesh
    n_real = nodes.new("GeometryNodeRealizeInstances")
    links.new(n_store.outputs[0], n_real.inputs[0])

    # 6. Optional flat shading
    if not shade_smooth:
        n_ssm = nodes.new("GeometryNodeSetShadeSmooth")
        n_ssm.domain = "FACE"
        n_ssm.inputs[2].default_value = False
        links.new(n_real.outputs[0], n_ssm.inputs[0])
        return n_ssm.outputs[0], n_cap.outputs[1]

    return n_real.outputs[0], n_cap.outputs[1]


def build_colour_phase_material(
    name: str = "ColourPhaseEmission",
    emission_strength: float = 3.0,
) -> bpy.types.Material:
    """
    Construct the ColourPhaseEmission material: ShaderNodeAttribute →
    6-stop rainbow ColorRamp → Emission.  Returns the material.
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mn = mat.node_tree.nodes
    ml = mat.node_tree.links
    mn.clear()

    n_attr              = mn.new("ShaderNodeAttribute")
    n_attr.attribute_type  = "GEOMETRY"
    n_attr.attribute_name  = "colour_phase"

    n_ramp              = mn.new("ShaderNodeValToRGB")
    ramp                = n_ramp.color_ramp
    stops               = [
        (0.00, (1.0, 0.0, 0.0, 1.0)),
        (0.20, (1.0, 1.0, 0.0, 1.0)),
        (0.40, (0.0, 1.0, 0.0, 1.0)),
        (0.60, (0.0, 1.0, 1.0, 1.0)),
        (0.80, (0.0, 0.0, 1.0, 1.0)),
        (1.00, (1.0, 0.0, 1.0, 1.0)),
    ]
    ramp.elements[0].position = stops[0][0]; ramp.elements[0].color = stops[0][1]
    ramp.elements[1].position = stops[1][0]; ramp.elements[1].color = stops[1][1]
    for pos, col in stops[2:]:
        el = ramp.elements.new(pos); el.color = col

    n_emit              = mn.new("ShaderNodeEmission")
    n_emit.inputs[1].default_value = emission_strength

    n_out               = mn.new("ShaderNodeOutputMaterial")
    ml.new(n_attr.outputs[2], n_ramp.inputs[0])
    ml.new(n_ramp.outputs[0], n_emit.inputs[0])
    ml.new(n_emit.outputs[0], n_out.inputs[0])
    return mat
