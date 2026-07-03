"""
holoflow_macros/gn_edges_of_vertex_boundary_detect.py
Reusable factory: add boundary_excess + edge_dir attributes to any open mesh
via a Geometry Nodes modifier.

Licence: CC0 1.0 Universal
Blender: 5.1+
"""

import bpy

__all__ = ["build_boundary_detect_modifier"]


def build_boundary_detect_modifier(
    obj: bpy.types.Object,
    ng_name: str = "HF_BoundaryDetect",
    boundary_th: float = 0.9,
) -> bpy.types.NodesModifier:
    """
    Attach a GN modifier that stores:
      - 'boundary_excess' (POINT, INT):   0=interior, 1=boundary, ≥2=non-manifold
      - 'edge_dir'        (EDGE, FLOAT_VECTOR): unit tangent V1→V2 per edge

    boundary_th (float): EvaluateOnDomain average threshold for edge selection.
    Returns the created modifier.
    """
    ng = bpy.data.node_groups.get(ng_name)
    if ng is None:
        ng = _build_ng(ng_name, boundary_th)

    mod = obj.modifiers.new(ng_name, "NODES")
    mod.node_group = ng
    return mod


def _build_ng(name: str, boundary_th: float) -> bpy.types.GeometryNodeTree:
    ng    = bpy.data.node_groups.new(name, "GeometryNodeTree")
    nodes = ng.nodes
    links = ng.links
    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    def N(t, x=0, y=0):
        n = nodes.new(t); n.location = (x, y); return n

    def L(a, ao, b, bi):
        links.new(a.outputs[ao], b.inputs[bi])

    gin  = N("NodeGroupInput",  -900, 0)
    gout = N("NodeGroupOutput",  900, 0)

    # ── boundary_excess (POINT) ───────────────────────────────────────────────
    eov  = N("GeometryNodeEdgesOfVertex",        -700, 200)
    cov  = N("GeometryNodeCornersOfVertex",       -700, 0)
    sub  = N("ShaderNodeMath",                    -450, 100)
    sub.operation = "SUBTRACT"
    L(eov, "Total", sub, 0)
    L(cov, "Total", sub, 1)

    sav  = N("GeometryNodeStoreNamedAttribute",   -200, 100)
    sav.domain = "POINT"; sav.data_type = "INT"
    sav.inputs["Name"].default_value = "boundary_excess"
    L(gin, "Geometry", sav, "Geometry")
    L(sub, 0,          sav, "Value")

    # ── edge_dir (EDGE) ───────────────────────────────────────────────────────
    voe  = N("GeometryNodeVerticesOfEdge",        -700, -200)
    pos  = N("GeometryNodeInputPosition",         -900, -350)
    fi1  = N("GeometryNodeFieldAtIndex",          -450, -150)
    fi1.domain = "POINT"; fi1.data_type = "FLOAT_VECTOR"
    fi2  = N("GeometryNodeFieldAtIndex",          -450, -350)
    fi2.domain = "POINT"; fi2.data_type = "FLOAT_VECTOR"
    L(voe, "Vertex Index 1", fi1, "Index");  L(pos, "Position", fi1, "Value")
    L(voe, "Vertex Index 2", fi2, "Index");  L(pos, "Position", fi2, "Value")
    vs   = N("ShaderNodeVectorMath",              -200, -250); vs.operation = "SUBTRACT"
    vn   = N("ShaderNodeVectorMath",                 0, -250); vn.operation = "NORMALIZE"
    L(fi2, "Value", vs, 0); L(fi1, "Value", vs, 1); L(vs, "Vector", vn, 0)
    sae  = N("GeometryNodeStoreNamedAttribute",    200, -100)
    sae.domain = "EDGE"; sae.data_type = "FLOAT_VECTOR"
    sae.inputs["Name"].default_value = "edge_dir"
    L(sav, "Geometry", sae, "Geometry"); L(vn, "Vector", sae, "Value")

    L(sae, "Geometry", gout, "Geometry")
    return ng
