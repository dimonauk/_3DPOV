"""Geometry Nodes — Procedural Low-Poly Faceted Terrain
Blender 5.1 | Holoflow Studio | CC0 (public domain)

WHY THIS APPROACH
-----------------
Noise-displaced flat-shaded meshes produce the studio's signature
faceted aesthetic without UV-unwrapping or baked normals. Three
decisions drive the design:

1. Flat shading inside the GN tree (Set Shade Smooth node, Shade Smooth=False)
   rather than via Object Data Properties. The Object Data flag is reset
   on every modifier re-evaluation in Blender 5.1; the node is durable.

2. Noise sampled at POINT domain (per-vertex) and Shade Flat applied to
   FACE domain afterwards. This order is important: flat normals are
   computed from the final displaced vertex positions, not from a
   pre-displacement smooth hull.

3. Entire graph built via bpy.data (node_groups, nodes, links) not
   bpy.ops.node.add_node. Operator calls are UI-context-sensitive and
   silently fail headless. The data API works in --background mode.

Blender 5.x specifics
---------------------
- GN tree I/O sockets: use tree.interface.new_socket() (4.0+ API).
  The legacy tree.inputs.new() / tree.outputs.new() was removed in 4.x.
- Evaluate on Domain node: removed in 4.2. Modern GN uses implicit
  field context — a float socket connected to a vertex attribute is
  automatically evaluated per point.
- NodeSocketFloat vs NodeSocketFloatUnsigned: in 5.x, interface sockets
  use the 'socket_type' string identifier (e.g. 'NodeSocketGeometry').
"""

import bpy
import math

# ── tunable parameters ────────────────────────────────────────────────────
GRID_SIZE         = 10.0   # world-space metres, square
GRID_VERTS        = 48     # verts per side — 48² gives 4 608 tris after triangulation
NOISE_SCALE       = 3.2    # lower = broader landforms; 2–5 works well at 10 m
NOISE_DETAIL      = 4.0    # fBm octave count
NOISE_ROUGHNESS   = 0.65   # Hurst exponent proxy — higher = more fractal
DISPLACEMENT_MAX  = 1.6    # peak height in metres above the grid plane
SEED              = 42     # change for a different terrain with same parameters
EXPORT_PATH       = "//terrain_faceted.glb"   # relative to .blend location
OBJECT_NAME       = "terrain_faceted"          # snake_case per holoflow convention
GN_TREE_NAME      = "GN_FacetedTerrain"


# ── scene setup ──────────────────────────────────────────────────────────

def clear_scene() -> None:
    """Remove all objects so the script is idempotent on re-run."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # purge orphan data blocks left by the delete
    bpy.ops.outliner.orphans_purge(do_recursive=True)


# ── geometry nodes tree ──────────────────────────────────────────────────

def _node(nodes: bpy.types.Nodes, bl_idname: str, col: int, row: int) -> bpy.types.Node:
    """Add a node and place it on a loose grid (220 × 200 px cells)."""
    nd = nodes.new(bl_idname)
    nd.location = (col * 220, row * -200)
    return nd


def build_gn_tree() -> bpy.types.NodeTree:
    """
    Construct the Geometry Nodes tree that produces faceted terrain.

    Graph topology (left → right):

        [Group In] → [Set Shade Smooth (Flat)] ──────────────────────┐
                                                                      ↓
        [Position] → [Noise Tex] → [Map Range] → [Combine XYZ] → [Set Position] → [Group Out]

    Set Shade Smooth is placed before Set Position so flat normals are
    computed from the *displaced* geometry; wiring it after Set Position
    would recompute normals before displacement (same visual result in
    5.1, but the displaced-first order matches the conceptual intent).
    """
    if GN_TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GN_TREE_NAME])

    tree  = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    # I/O interface (Blender 4.0+ API)
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    # ── nodes ─────────────────────────────────────────────────────
    gi    = _node(nodes, "NodeGroupInput",          0, 0)
    go    = _node(nodes, "NodeGroupOutput",         7, 0)

    # shade flat: domain=FACE, Shade Smooth=False
    shade = _node(nodes, "GeometryNodeSetShadeSmooth", 1, 0)
    shade.domain = "FACE"
    shade.inputs["Shade Smooth"].default_value = False

    # per-vertex position — the field that drives the noise look-up
    pos   = _node(nodes, "GeometryNodeInputPosition",  2, 1)

    # noise texture evaluated in 3D at each vertex's world position
    noise = _node(nodes, "ShaderNodeTexNoise",          3, 1)
    noise.noise_dimensions = "3D"
    noise.inputs["Scale"].default_value      = NOISE_SCALE
    noise.inputs["Detail"].default_value     = NOISE_DETAIL
    noise.inputs["Roughness"].default_value  = NOISE_ROUGHNESS
    noise.inputs["Distortion"].default_value = 0.0
    # W drives the seed in 4D; setting it in 3D mode shifts the pattern
    noise.inputs["W"].default_value          = float(SEED) * 0.01

    # remap noise Fac (0..1) → displacement height (0..DISPLACEMENT_MAX)
    remap = _node(nodes, "ShaderNodeMapRange",          4, 1)
    remap.inputs["From Min"].default_value = 0.0
    remap.inputs["From Max"].default_value = 1.0
    remap.inputs["To Min"].default_value   = 0.0
    remap.inputs["To Max"].default_value   = DISPLACEMENT_MAX

    # pack the scalar height into a Z-only offset vector
    combine = _node(nodes, "ShaderNodeCombineXYZ",      5, 1)
    # X and Y stay at their default 0.0 — we only shift Z

    # displace vertices: XY unchanged, Z lifted by the noise height
    # WHY Offset not Position: Offset adds to current XY; Position replaces it,
    # which would collapse all verts to X=0, Y=0 if Combine XYZ X/Y stay at 0.
    set_pos = _node(nodes, "GeometryNodeSetPosition",   6, 0)

    # ── wiring ────────────────────────────────────────────────────
    links.new(gi.outputs["Geometry"],      shade.inputs["Geometry"])
    links.new(shade.outputs["Geometry"],   set_pos.inputs["Geometry"])
    links.new(pos.outputs["Position"],     noise.inputs["Vector"])
    links.new(noise.outputs["Fac"],        remap.inputs["Value"])
    links.new(remap.outputs["Result"],     combine.inputs["Z"])
    links.new(combine.outputs["Vector"],   set_pos.inputs["Offset"])
    links.new(set_pos.outputs["Geometry"], go.inputs["Geometry"])

    return tree


# ── object assembly ───────────────────────────────────────────────────────

def build_terrain() -> bpy.types.Object:
    """
    Add the grid mesh, attach the GN modifier, and tag it for the
    holoflow exporter (holoflow:facet skips smooth-normal baking).
    """
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_VERTS - 1,
        y_subdivisions=GRID_VERTS - 1,
        size=GRID_SIZE,
        enter_editmode=False,
        align="WORLD",
        location=(0.0, 0.0, 0.0),
    )
    obj      = bpy.context.active_object
    obj.name = OBJECT_NAME

    tree = build_gn_tree()
    mod  = obj.modifiers.new("FacetedTerrain", "NODES")
    mod.node_group = tree

    obj["holoflow:facet"] = True   # tells exporter: keep raw face normals
    return obj


# ── export ────────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object) -> None:
    """
    Apply the GN modifier, collapse transforms, export GLB.

    WHY apply before export: the holoflow_webxr_exporter and the
    upstream glTF-Blender-IO exporter both expect a realised mesh with
    identity transform. Unapplied modifiers are evaluated internally
    but the resulting attribute data (custom split normals) may not
    survive the export pipeline correctly unless the modifier is applied.
    """
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.object.modifier_apply(modifier="FacetedTerrain")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_yup=True,
    )
    print(f"[holoflow] exported → {EXPORT_PATH}")


# ── entry point ───────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    obj = build_terrain()
    export_glb(obj)
    print(f"[holoflow] terrain_faceted done — {GRID_VERTS}×{GRID_VERTS} verts, "
          f"scale={NOISE_SCALE}, disp={DISPLACEMENT_MAX} m")


if __name__ == "__main__":
    main()
