"""
Geometry Nodes — Instance on Points
====================================
Blender 5.1 | Holoflow Studio | CC0

WHY THIS APPROACH
-----------------
The Tissue add-on (see /tutorials/blender-addon-tissue) duplicates a component
mesh onto every face of a target surface by modifying topology.  Geometry
Nodes achieves the same result but stays procedural: the instances live as
lightweight transforms until ``Realize Instances`` collapses them to real
geometry.  The distinction matters for two reasons:

1. Instance count can be enormous without the viewport choking — 100 000
   instances at the same vertex budget as one; the mesh only exists once.
2. The scatter parameters (density, seed, rotation, scale) drive live via
   the modifier panel rather than needing a manual re-tessellate.

The studio's scale-mail and hex-mail panels in the print pipeline use
exactly this pattern: a single scale or hex tile instanced across a curved
target surface.  This blueprint builds the simplest form: a flat diamond
scatter on a grid, one studio-scale tile per distributed point.

BLENDER 5.x SPECIFICS
----------------------
- ``tree.interface.new_socket()`` (4.0+ API) — the legacy
  ``tree.inputs.new()`` / ``tree.outputs.new()`` were removed.
- Node creation: ``bpy.data``, not ``bpy.ops.node.add_node``.
  Operators are context-sensitive and silently fail in --background mode.
- ``Distribute Points on Faces`` requires a geometry input and outputs
  a POINT domain cloud.  In 5.1 the node is in the "Point" category.
- ``Instance on Points`` takes the point cloud as Points, a reference
  geometry as Instance, and outputs an instance geometry.
- ``Realize Instances`` must be called before GLB export because the
  glTF exporter does not serialise Blender instances; it skips them.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
import os
import math

# ── parameters ─────────────────────────────────────────────────────────────
SURFACE_SIZE      = 8.0    # world-space size of the target grid (metres)
SURFACE_VERTS     = 4      # verts per side — coarse grid, instances fill detail
TILE_SCALE        = 0.25   # uniform scale of each instanced tile
TILE_FLAT_RADIUS  = 0.22   # circumradius of the diamond tile
SCATTER_DENSITY   = 6.0    # points per m² — raises with surface area
SCATTER_SEED      = 42     # change to vary the distribution
ROTATE_RANDOM     = True   # randomise Z rotation of each instance
OUTPUT_SUBDIR     = "output"
OUTPUT_NAME       = "instance_scatter.glb"
# ─────────────────────────────────────────────────────────────────────────────


def resolve_output(filename: str) -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(here, OUTPUT_SUBDIR)
    os.makedirs(out_dir, exist_ok=True)
    return os.path.join(out_dir, filename)


def reset_scene() -> None:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for col in list(bpy.data.collections):
        if col.name != bpy.context.scene.collection.name:
            bpy.data.collections.remove(col)


def build_diamond_tile() -> bpy.types.Object:
    """
    A flat diamond (rhombus) in the XY plane — the studio's scale tile.

    Why a diamond over a cube: diamonds scatter into a tight-packed
    pattern when the density is high enough; cubes leave gaps at the
    corners.  The diamond is also thinner, so the z-depth of the scattered
    surface stays visually tight when viewed from above.

    Why bmesh over ``bpy.ops.mesh.primitive_diamond_add``: no such
    operator exists; bmesh.ops.create_uvsphere / convex_hull is the
    right tool.  Here we build the four verts manually — it is four
    vertices, nothing to generalise.
    """
    r = TILE_FLAT_RADIUS
    h = r * 0.12   # thin slab height

    bm = bmesh.new()
    verts = [
        bm.verts.new(( r,  0.0, 0.0)),  # right
        bm.verts.new(( 0.0,  r, 0.0)),  # top
        bm.verts.new((-r,  0.0, 0.0)),  # left
        bm.verts.new(( 0.0, -r, 0.0)),  # bottom
        bm.verts.new(( r,  0.0,  h)),
        bm.verts.new(( 0.0,  r,  h)),
        bm.verts.new((-r,  0.0,  h)),
        bm.verts.new(( 0.0, -r,  h)),
    ]
    # Bottom face
    bm.faces.new([verts[0], verts[3], verts[2], verts[1]])
    # Top face
    bm.faces.new([verts[4], verts[5], verts[6], verts[7]])
    # Side faces
    bm.faces.new([verts[0], verts[1], verts[5], verts[4]])
    bm.faces.new([verts[1], verts[2], verts[6], verts[5]])
    bm.faces.new([verts[2], verts[3], verts[7], verts[6]])
    bm.faces.new([verts[3], verts[0], verts[4], verts[7]])

    # Flat shading via sharp_face attribute (5.x-native)
    mesh = bpy.data.meshes.new("DiamondTile")
    if "sharp_face" not in mesh.attributes:
        mesh.attributes.new("sharp_face", "BOOLEAN", "FACE")
    bm.to_mesh(mesh)
    bm.free()
    mesh.attributes["sharp_face"].data.foreach_set("value", [True] * len(mesh.polygons))
    mesh.update()

    mat = bpy.data.materials.new("TileMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.15, 0.55, 0.90, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.22

    mesh.materials.append(mat)

    obj = bpy.data.objects.new("DiamondTile", mesh)
    # Link into a hidden collection so the GN tree can reference it
    # without it appearing in the final scene render.
    tile_col = bpy.data.collections.new("_tile_source")
    bpy.context.scene.collection.children.link(tile_col)
    tile_col.objects.link(obj)
    obj.hide_render = False  # must be renderable for the GN tree to use it
    return obj


def build_surface() -> bpy.types.Object:
    """Flat grid mesh that the Distribute Points node scatters onto."""
    mesh = bpy.data.meshes.new("ScatterSurface")
    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm,
        x_segments=SURFACE_VERTS,
        y_segments=SURFACE_VERTS,
        size=SURFACE_SIZE / 2,  # ops.create_grid takes half-size
    )
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj = bpy.data.objects.new("ScatterSurface", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_gn_modifier(surface: bpy.types.Object, tile: bpy.types.Object) -> None:
    """
    Build the Geometry Nodes graph entirely via the data API.

    Graph:
      Group Input
        └─ Geometry ──► Distribute Points on Faces
                          └─ Points ──► Instance on Points ──► Realize Instances ──► Group Output
                                                  │
                               tile (Object Info) ┘

    Key node-placement decisions:
    - ``Distribute Points on Faces`` (POISSON mode) uses a min-distance
      algorithm that avoids clumping — more uniform than RANDOM at low
      density.  The ``Density`` input controls points per m².
    - ``Object Info`` retrieves the tile geometry at evaluation time.
      This means the tile can be swapped in the modifier panel without
      rebuilding the graph.
    - ``Random Value`` (FLOAT) fed into ``Rotate Instances`` adds variety
      without needing a GN driver or a Python loop.
    - ``Realize Instances`` collapses the instance tree to actual geometry
      so the GLB exporter can serialise the mesh.
    """
    mod = surface.modifiers.new("ScatterGN", "NODES")
    tree = bpy.data.node_groups.new("ScatterInstances", "GeometryNodeTree")
    mod.node_group = tree

    # ── interface sockets (4.0+ API) ──────────────────────────────────────
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nodes = tree.nodes
    links = tree.links

    # ── node creation ──────────────────────────────────────────────────────
    n_input  = nodes.new("NodeGroupInput")
    n_output = nodes.new("NodeGroupOutput")

    n_dist  = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.distribute_method = "POISSON"   # POISSON = min-distance spacing
    n_dist.inputs["Density Max"].default_value = SCATTER_DENSITY
    n_dist.inputs["Seed"].default_value       = SCATTER_SEED

    n_obj   = nodes.new("GeometryNodeObjectInfo")
    n_obj.inputs["Object"].default_value = tile
    n_obj.transform_space = "RELATIVE"  # keeps the tile at its local scale

    n_inst  = nodes.new("GeometryNodeInstanceOnPoints")
    n_inst.inputs["Scale"].default_value = (TILE_SCALE, TILE_SCALE, TILE_SCALE)

    n_realise = nodes.new("GeometryNodeRealizeInstances")

    # ── optional random rotation ────────────────────────────────────────
    if ROTATE_RANDOM:
        n_rand = nodes.new("FunctionNodeRandomValue")
        n_rand.data_type = "FLOAT"
        n_rand.inputs["Min"].default_value = 0.0
        n_rand.inputs["Max"].default_value = math.tau   # 0 → 2π
        n_rot  = nodes.new("GeometryNodeRotateInstances")
        links.new(n_inst.outputs["Instances"], n_rot.inputs["Instances"])
        links.new(n_rand.outputs[1],           n_rot.inputs["Rotation"])
        links.new(n_rot.outputs["Instances"],  n_realise.inputs["Geometry"])
    else:
        links.new(n_inst.outputs["Instances"], n_realise.inputs["Geometry"])

    # ── main links ─────────────────────────────────────────────────────────
    links.new(n_input.outputs["Geometry"],   n_dist.inputs["Mesh"])
    links.new(n_obj.outputs["Geometry"],     n_inst.inputs["Instance"])
    links.new(n_dist.outputs["Points"],      n_inst.inputs["Points"])
    links.new(n_realise.outputs["Geometry"], n_output.inputs["Geometry"])


def export_glb(surface: bpy.types.Object, filepath: str) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    surface.select_set(True)
    bpy.context.view_layer.objects.active = surface

    bpy.ops.export_scene.gltf(
        filepath=filepath,
        use_selection=True,
        export_format="GLB",
        export_apply=True,   # bakes the GN modifier — collapses Realize Instances
        export_yup=True,
        export_normals=True,
        export_texcoords=True,
        export_materials="EXPORT",
        export_colors=False,
    )


def main() -> None:
    reset_scene()
    tile    = build_diamond_tile()
    surface = build_surface()
    add_gn_modifier(surface, tile)
    # Trigger a depsgraph update so the modifier evaluates before export
    bpy.context.view_layer.update()
    filepath = resolve_output(OUTPUT_NAME)
    export_glb(surface, filepath)
    print(f"[holoflow] instance scatter → {filepath}")


if __name__ == "__main__":
    main()
