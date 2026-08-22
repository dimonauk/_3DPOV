"""
GN Dual Mesh — Geodesic Hex-Pent Dome
Blender 5.1 | Author: Holoflow Studio | Licence: CC0

TECHNIQUE
─────────
GeometryNodeDualMesh converts a mesh into its topological dual: every face
becomes a vertex, every vertex becomes a face, every edge becomes an edge in
the dual that cuts through the original edge midpoint.

Applied to a subdivided icosphere the result is a geodesic dome with two
face types:
  · Hexagonal faces — from original interior vertices (valence 6)
  · Pentagonal faces — from the 12 original icosahedron corner vertices (valence 5)

Euler's formula (V - E + F = 2) guarantees exactly 12 pentagons regardless
of how many subdivisions you add — adding more subdivisions only produces
more hexagons. At subdiv=4: 12 pent + 30 hex = 42 total faces.

Material assignment uses FaceNeighbors.vertex_count (evaluated in FACE domain
after the dual) to detect pentagon (5) vs hexagon (6) and drives Set Material
Index, giving distinct colours without any manual selection.

WHY this matters for WebXR
──────────────────────────
Dual-mesh topology produces N-gon faces with a flat face normal — ideal for
the studio's holoflow:facet flagging system. Each dome cell is a flat polygon;
the flat-shade / hard-edge look in Three.js is immediate without any added
bevel or split-normal work. Each cell's flat normal also makes it a perfect
anchor for `Align Euler to Vector` scatter instances (e.g. window rivets).
"""

import bpy
import bmesh
from mathutils import Vector

# ─── CONSTANTS ──────────────────────────────────────────────────────────────
DOME_RADIUS       = 1.0          # metres; scale in GN for export variants
ICOSPHERE_SUBDIV  = 4            # 4 = 42 cells (12 pent + 30 hex); try 2–6
DOME_OBJ_NAME     = "geodesic_dome"
MAT_HEX_NAME      = "mat_hex_panel"   # hexagonal cells — studio teal
MAT_PENT_NAME     = "mat_pent_accent" # 12 pentagonal cells — accent colour

# ─── SCENE SETUP ────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def make_materials() -> tuple[bpy.types.Material, bpy.types.Material]:
    """Two Principled BSDF materials: hex teal (index 0) + pent coral (index 1)."""
    def _mat(name: str, base_colour: tuple[float, ...], metallic: float = 0.0,
             roughness: float = 0.4) -> bpy.types.Material:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*base_colour, 1.0)
        bsdf.inputs["Metallic"].default_value   = metallic
        bsdf.inputs["Roughness"].default_value  = roughness
        return mat

    mat_hex  = _mat(MAT_HEX_NAME,  (0.04, 0.55, 0.55), metallic=0.2, roughness=0.35)
    mat_pent = _mat(MAT_PENT_NAME, (0.90, 0.28, 0.24), metallic=0.0, roughness=0.60)
    return mat_hex, mat_pent


def add_icosphere(radius: float, subdivisions: int,
                  mat_hex: bpy.types.Material,
                  mat_pent: bpy.types.Material) -> bpy.types.Object:
    """Add an icosphere with both materials pre-slotted (GN assigns indices)."""
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions,
        radius=radius,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = DOME_OBJ_NAME

    # Slot 0 = hex, slot 1 = pent — GN Set Material Index references these slots
    obj.data.materials.append(mat_hex)
    obj.data.materials.append(mat_pent)
    return obj


# ─── GEOMETRY NODES SETUP ───────────────────────────────────────────────────

def build_gn_modifier(obj: bpy.types.Object) -> None:
    """
    Node graph:
      [Geometry Input]
        → [Dual Mesh]               # topological dual
        → [Merge by Distance]       # fuse coincident verts at seams (low subdiv)
        → [Face Neighbors]          # .vertex_count = 5 (pent) or 6 (hex)
        → [Compare EQUAL / 5]       # Boolean: is this face a pentagon?
        → [Set Material Index = 1]  # accent pentagon slot
        → [Store Named Attribute]   # holoflow:facet = 1.0 for flat WebXR shading
        → [Geometry Output]
    """
    mod = obj.modifiers.new(name="GN_DualMesh", type='NODES')
    ng  = bpy.data.node_groups.new("GN_GeodesicDome", 'GeometryNodeTree')
    mod.node_group = ng

    # ── Interface sockets (Blender 4.0+ API) ────────────────────────────────
    ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = ng.nodes
    links = ng.links

    def N(bl_idname: str, x: float, y: float) -> bpy.types.Node:
        n = nodes.new(bl_idname)
        n.location = (x, y)
        return n

    # Input / Output group nodes
    n_in  = N("NodeGroupInput",  -800, 0)
    n_out = N("NodeGroupOutput",  900, 0)

    # 1. Dual Mesh
    n_dual = N("GeometryNodeDualMesh", -560, 0)
    # keep_boundaries=True preserves the outer rim if you clip to hemisphere;
    # False (default) is correct for a full closed sphere.
    n_dual.inputs["Keep Boundaries"].default_value = False

    # 2. Merge by Distance — icosphere seam verts are coincident post-dual at
    #    very low subdiv; merge_threshold 0.001 is safe up to subdiv=6 at r=1m.
    n_merge = N("GeometryNodeMergeByDistance", -320, 0)
    n_merge.inputs["Distance"].default_value = 0.001

    # 3. Face Neighbors — vertex_count per face (domain = FACE)
    n_fn = N("GeometryNodeInputMeshFaceNeighbors", 0, -180)
    # outputs: [0] Vertex Count (int), [1] Face Count (int)

    # 4. Compare: vertex_count == 5 → True for pentagons
    n_cmp = N("FunctionNodeCompare",  200, -180)
    n_cmp.data_type = 'INT'
    n_cmp.operation = 'EQUAL'
    n_cmp.inputs["B"].default_value = 5       # pentagon threshold

    # 5. Set Material Index = 1 on pentagons (hexagons remain index 0 by default)
    n_smi = N("GeometryNodeSetMaterialIndex", 400, 0)
    n_smi.inputs["Material Index"].default_value = 1

    # 6. Store Named Attribute: holoflow:facet = 1.0 on all faces
    #    Signals the WebXR exporter to force flat shading per cell.
    n_store = N("GeometryNodeStoreNamedAttribute", 640, 0)
    n_store.data_type   = 'FLOAT'
    n_store.domain      = 'FACE'
    n_store.inputs["Name"].default_value  = "holoflow:facet"
    n_store.inputs["Value"].default_value = 1.0

    # ── Wire links ──────────────────────────────────────────────────────────
    links.new(n_in.outputs["Geometry"],           n_dual.inputs["Mesh"])
    links.new(n_dual.outputs["Dual Mesh"],        n_merge.inputs["Geometry"])
    links.new(n_merge.outputs["Geometry"],        n_smi.inputs["Geometry"])
    links.new(n_fn.outputs["Vertex Count"],       n_cmp.inputs["A"])
    links.new(n_cmp.outputs["Result"],            n_smi.inputs["Selection"])
    links.new(n_smi.outputs["Geometry"],          n_store.inputs["Geometry"])
    links.new(n_store.outputs["Geometry"],        n_out.inputs["Geometry"])


# ─── EXPORT ─────────────────────────────────────────────────────────────────

def apply_and_export(obj: bpy.types.Object, glb_path: str) -> None:
    """Apply transforms, apply GN modifier, export GLB."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # Apply transforms so exported mesh has clean identity matrix
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Apply GN modifier → converts to plain mesh for GLB
    bpy.ops.object.modifier_apply(modifier=obj.modifiers[0].name)

    # Shade flat — each dual face is planar; smooth would blur the cell edges
    bpy.ops.object.shade_flat()

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_materials='EXPORT',
        export_apply=False,
        use_selection=True,
    )


# ─── MAIN ───────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    mat_hex, mat_pent = make_materials()
    obj = add_icosphere(DOME_RADIUS, ICOSPHERE_SUBDIV, mat_hex, mat_pent)
    build_gn_modifier(obj)

    # Verify in viewport before export
    bpy.context.scene.frame_set(1)

    glb_path = bpy.path.abspath("//geodesic_dome.glb")
    apply_and_export(obj, glb_path)
    print(f"[holoflow] exported → {glb_path}")


if __name__ == "__main__":
    main()
