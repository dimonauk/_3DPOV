"""
holoflow_macros/vertex_colour_attributes.py

Reusable utility: paint a per-face colour palette onto any mesh using
the Blender 5.x mesh.color_attributes API (CORNER domain, BYTE_COLOR).

Import pattern:
    import sys
    sys.path.insert(0, str(Path(__file__).parents[2]))
    from holoflow_macros.vertex_colour_attributes import paint_face_palette

Blender version: 5.1+
Licence: CC0
"""

from __future__ import annotations
from typing import Callable, Sequence
import bpy
from mathutils import Vector

Colour = tuple[float, float, float, float]   # (R, G, B, A) linear 0-1


def paint_face_palette(
    mesh: bpy.types.Mesh,
    palette: Sequence[Colour],
    picker: Callable[[Vector], Colour],
    *,
    attr_name: str = "Col",
    domain: str = "CORNER",
    data_type: str = "BYTE_COLOR",
) -> bpy.types.Attribute:
    """Create or replace a Color Attribute and fill it per-face.

    Parameters
    ----------
    mesh:
        Target mesh. Must already have its polygons populated.
    palette:
        Sequence of (R, G, B, A) tuples in linear 0-1 space.  Passed to
        `picker` for reference; this function does not index palette directly.
    picker:
        Callable(face_normal: Vector) -> Colour.  Called once per polygon.
        The palette argument is available in the closure if needed.
    attr_name:
        Name of the Color Attribute to create.  Any existing attribute with
        this name is removed first to avoid duplicate entries.
    domain:
        "CORNER" (one entry per loop — hard face boundaries) or
        "POINT" (one entry per vertex — smooth gradients).
        CORNER is correct for cel-shaded faceted meshes.
    data_type:
        "BYTE_COLOR" (compact, 4 bytes/vertex, slight quantisation) or
        "FLOAT_COLOR" (lossless, 16 bytes/vertex).

    Returns
    -------
    The created bpy.types.Attribute.  Caller can inspect .data directly.
    """
    # Remove existing attribute of the same name to avoid duplicates on re-run.
    existing = mesh.color_attributes.get(attr_name)
    if existing is not None:
        mesh.color_attributes.remove(existing)

    attr = mesh.color_attributes.new(
        name=attr_name,
        type=data_type,
        domain=domain,
    )

    if domain == "CORNER":
        for poly in mesh.polygons:
            colour = picker(poly.normal)
            for loop_idx in poly.loop_indices:
                attr.data[loop_idx].color = colour
    elif domain == "POINT":
        for poly in mesh.polygons:
            colour = picker(poly.normal)
            for vert_idx in poly.vertices:
                attr.data[vert_idx].color = colour
    else:
        raise ValueError(f"Unsupported domain: {domain!r}. Use 'CORNER' or 'POINT'.")

    # Register as active and render attribute so EEVEE and the glTF exporter
    # both see the same attribute without manual panel interaction.
    idx = mesh.color_attributes.find(attr_name)
    mesh.color_attributes.active_color_index = idx
    mesh.color_attributes.render_color_index  = idx

    return attr


def make_vertex_colour_emission_material(
    attr_name: str = "Col",
    mat_name: str = "VertColFaceted",
) -> bpy.types.Material:
    """Vertex Color → Emission node chain — no UV, no texture.

    Creates a fresh material with use_nodes=True and populates a minimal
    three-node tree.  Any existing material with mat_name is replaced.

    The `attr_name` parameter must match the string used in paint_face_palette.
    ShaderNodeVertexColor.layer_name is case-sensitive.
    """
    existing = bpy.data.materials.get(mat_name)
    if existing is not None:
        bpy.data.materials.remove(existing)

    mat = bpy.data.materials.new(mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    emit = nodes.new("ShaderNodeEmission")
    emit.location = (200, 0)
    vcol = nodes.new("ShaderNodeVertexColor")
    vcol.location = (0, 0)
    vcol.layer_name = attr_name

    links.new(vcol.outputs["Color"],    emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat
