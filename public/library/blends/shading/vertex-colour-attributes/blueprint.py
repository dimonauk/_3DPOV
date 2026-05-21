"""
Vertex Colour Attributes — Blender 5.1 blueprint.

Four-colour directional palette painted onto an icosphere using the
mesh.color_attributes API (CORNER domain, BYTE_COLOR type). The shader
uses a Vertex Color node into Emission BSDF — no UV map, no image texture.
Exports COLOR_0 into the GLB via export_colors=True, compatible with
Three.js vertexColors and WebXR rendering at minimal file size.

Source: docs.blender.org/manual/en/latest/sculpt_paint/vertex_paint/ (CC BY-SA)
        KhronosGroup/glTF-Blender-IO, Apache-2.0

Run:  blender --background --python blueprint.py
Out:  vertex_colour_demo.blend   vertex_colour_demo.glb
"""

import bpy
import bmesh
from pathlib import Path
from mathutils import Vector

# ── Parameters ─────────────────────────────────────────────────────────────────
SCENE_NAME = "vertex_colour_demo"
BLEND_OUT  = Path(__file__).parent / f"{SCENE_NAME}.blend"
GLB_OUT    = Path(__file__).parent / f"{SCENE_NAME}.glb"
ICO_SUBDIV = 2   # 80 triangular faces — enough for clear four-zone palette

# Holoflow studio colour language: warm / cool directional bands.
# Linear 0-1 floats. Blender internally quantises to 0-255 for BYTE_COLOR;
# the quantisation error for these saturated hues is visually indistinguishable.
PALETTE = [
    (0.980, 0.840, 0.120, 1.0),   # amber  — top cap
    (0.120, 0.720, 0.680, 1.0),   # teal   — right equatorial band
    (0.850, 0.220, 0.480, 1.0),   # rose   — left equatorial band
    (0.180, 0.280, 0.820, 1.0),   # indigo — bottom cap
]

_UP    = Vector((0, 0,  1))
_DOWN  = Vector((0, 0, -1))
_RIGHT = Vector((1, 0,  0))


def _pick(normal: Vector) -> tuple:
    """Map a face normal to one palette entry via directional dot products.

    Deterministic: same mesh geometry → same colour map on every run, so
    record.py comparisons stay stable across re-renders.  The 0.4 threshold
    leaves a narrow equatorial band that avoids hard polar cuts looking wrong
    on the ICO_SUBDIV=2 icosphere's imprecise tip normals.
    """
    n = normal.normalized()
    if n.dot(_UP) > 0.4:
        return PALETTE[0]
    if n.dot(_DOWN) > 0.4:
        return PALETTE[3]
    return PALETTE[1] if n.dot(_RIGHT) >= 0.0 else PALETTE[2]


def _build_mesh() -> bpy.types.Mesh:
    """Icosphere via bmesh.ops — headless-safe, no bpy.ops context required."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIV, radius=1.0)

    mesh = bpy.data.meshes.new(SCENE_NAME)
    bm.to_mesh(mesh)
    bm.free()

    # Flat-shade every polygon so each face reads as a solid block.
    # use_smooth=False keeps per-face normals constant across the face —
    # prerequisite for hard colour boundaries between palette zones.
    for poly in mesh.polygons:
        poly.use_smooth = False

    return mesh


def _paint_colour_attribute(mesh: bpy.types.Mesh) -> None:
    """Create a CORNER-domain BYTE_COLOR attribute and fill it per-face.

    CORNER domain means one colour entry per loop index, keyed by the same
    index as mesh.loops.  A face with four corners gets four entries that
    all receive the same tuple, making the face appear as one block of colour.
    Adjacent faces differ because CORNER stores values independently for each
    face-corner — unlike POINT domain, which averages values at shared vertices
    and would produce gradient bleeds between palette zones.

    BYTE_COLOR vs FLOAT_COLOR: BYTE_COLOR → UNSIGNED_BYTE COLOR_0 in the GLB
    (~4 bytes/vertex).  FLOAT_COLOR → FLOAT COLOR_0 (~16 bytes/vertex).  For a
    four-value palette the quantisation loss in BYTE_COLOR is unmeasurable.
    """
    attr = mesh.color_attributes.new(
        name="Col",
        type="BYTE_COLOR",
        domain="CORNER",
    )

    for poly in mesh.polygons:
        colour = _pick(poly.normal)
        for loop_idx in poly.loop_indices:
            attr.data[loop_idx].color = colour

    # Both indices must point at the same attribute for EEVEE, Cycles, and
    # the glTF exporter to agree on which COLOR_0 to write.
    idx = mesh.color_attributes.find("Col")
    mesh.color_attributes.active_color_index = idx
    mesh.color_attributes.render_color_index  = idx


def _make_material() -> bpy.types.Material:
    """Vertex Color → Emission shader — no UV, no image texture.

    Emission BSDF rather than Principled: faceted palette assets must not
    respond to scene lighting — the colour is the colour.  If you need
    light-reactive stylised shading, replace Emission with Principled BSDF
    and wire the vertex colour into Base Color instead.
    """
    mat = bpy.data.materials.new("VertColFaceted")
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
    vcol.layer_name = "Col"   # must match color_attributes name exactly

    links.new(vcol.outputs["Color"],    emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def build_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = SCENE_NAME
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    mesh = _build_mesh()
    _paint_colour_attribute(mesh)

    obj = bpy.data.objects.new(SCENE_NAME, mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(_make_material())

    # ── GLB export ─────────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # export_colors=True writes the COLOR_0 accessor to the GLB.  Without it
    # the accessor is silently omitted even when the attribute exists in the
    # .blend.  This is the single most common cause of "vertex colours missing
    # in Three.js" reports when exporting from Blender 5.x.
    # export_apply=False: no GN modifier on this object, no bake needed.
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_colors=True,
        export_normals=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"[blueprint] GLB   → {GLB_OUT}")
    print(f"[blueprint] .blend → {BLEND_OUT}")


build_scene()
