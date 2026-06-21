"""
GN Triangulate Mesh — Tri-Safe WebXR GLB Export
Blender 5.1 | Holoflow Studio | CC0

Technique
---------
GeometryNodeTriangulate converts mixed-topology input (quads + n-gons) into a
pure-triangle mesh required by glTF 2.0. The critical decision is quad_method:
  BEAUTY          — minimises angular distortion, highest quality, slowest
  FIXED           — always cuts the same diagonal (predictable but can produce
                    degenerate triangles on non-planar quads)
  FIXED_ALTERNATE — alternates diagonal direction per row, useful for regular
                    grids but visible as diagonal stripes on flat-shaded surfaces
  SHORTEST_DIAGONAL — splits along whichever diagonal is shorter, minimises
                    worst-case aspect ratio, best general-purpose WebXR choice

min_vertices=4 means existing tris are left untouched; only quads and n-gons
are triangulated. This matters when your mesh already has a hand-sculpted or
pre-triangulated reference strip you want to preserve.

Custom split normals are NOT destroyed by Triangulate — each triangulated face
inherits the normals of the split quad corner. Verify in Object Data Properties
→ Geometry Data → Clear Custom Split Normals before/after to see the difference.

Run: Open Scripting workspace, paste, Run Script.
Outputs: tri_safe_demo.blend + tri_safe_demo.glb alongside the .blend file.
"""

import bpy
import bmesh
from mathutils import Vector

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
MESH_NAME    = "tri_safe_demo"
MAT_NAME     = "TriSafe_FlatMat"
GN_MOD_NAME  = "TriSafeExport"
GN_TREE_NAME = "TriSafeExport"
GRID_X       = 6   # columns of quads
GRID_Y       = 4   # rows of quads
EXPORT_PATH  = "//tri_safe_demo.glb"

# Change QUAD_METHOD here to compare outputs:
#   "BEAUTY" | "FIXED" | "FIXED_ALTERNATE" | "SHORTEST_DIAGONAL"
QUAD_METHOD  = "SHORTEST_DIAGONAL"
NGON_METHOD  = "BEAUTY"
MIN_VERTICES = 4   # skip faces that already have fewer than 4 vertices (tris)

# ── 1. CLEAN SCENE ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
bpy.context.scene.unit_settings.system = "METRIC"

# ── 2. BUILD MIXED-TOPOLOGY MESH ───────────────────────────────────────────────
def build_mixed_mesh() -> bpy.types.Mesh:
    """
    Three distinct topology zones in one mesh:
      Left zone (x < -1):    quads — standard subdivision grid
      Centre zone (-1..1):   n-gons — quads dissolved across their shared
                             interior vertical edge, producing 8-sided faces
      Right zone (x > 1):   tris  — pre-triangulated reference strip

    This replicates a real import scenario: a CAD mesh with quads, an organic
    sculpt region with poles dissolved into n-gons, and a section already
    triangulated by a previous export step.
    """
    me = bpy.data.meshes.new(MESH_NAME)
    bm = bmesh.new()

    # Build vertex grid
    verts: dict[tuple[int, int], bmesh.types.BMVert] = {}
    for y in range(GRID_Y + 1):
        for x in range(GRID_X + 1):
            co = Vector((x - GRID_X / 2, y - GRID_Y / 2, 0.0))
            verts[(x, y)] = bm.verts.new(co)

    # Create quad faces
    for y in range(GRID_Y):
        for x in range(GRID_X):
            bm.faces.new([
                verts[(x,     y    )],
                verts[(x + 1, y    )],
                verts[(x + 1, y + 1)],
                verts[(x,     y + 1)],
            ])
    bm.faces.ensure_lookup_table()
    bm.edges.ensure_lookup_table()

    # Dissolve centre column's shared vertical edges → n-gons
    # Columns 2 and 3 share interior vertical edges; dissolving them joins
    # adjacent quads horizontally into 6-sided faces.
    cx_lo = GRID_X // 2 - 1   # left edge of centre zone (column index)
    cx_hi = GRID_X // 2        # right edge

    def is_interior_vertical(edge: bmesh.types.BMEdge) -> bool:
        xs = {int(round(v.co.x + GRID_X / 2)) for v in edge.verts}
        ys = [int(round(v.co.y + GRID_Y / 2)) for v in edge.verts]
        # vertical = both verts share x; interior = not on y boundary
        return (len(xs) == 1
                and xs.pop() in (cx_lo + 1,)
                and all(0 < y < GRID_Y for y in ys))

    dissolve = [e for e in bm.edges if is_interior_vertical(e)]
    bmesh.ops.dissolve_edges(bm, edges=dissolve, use_verts=False)
    bm.faces.ensure_lookup_table()

    # Pre-triangulate right zone (x > cx_hi world-space threshold)
    x_threshold = cx_hi - GRID_X / 2 + 0.5
    right_faces = [f for f in bm.faces
                   if all(v.co.x > x_threshold for v in f.verts)]
    if right_faces:
        bmesh.ops.triangulate(
            bm, faces=right_faces,
            quad_method="SHORTEST_DIAGONAL",
            ngon_method="BEAUTY",
        )

    bm.to_mesh(me)
    bm.free()
    return me


mesh = build_mixed_mesh()

obj = bpy.data.objects.new(MESH_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# Flat shading applied per-polygon so triangulation diagonal is visible
for poly in mesh.polygons:
    poly.use_smooth = False

# ── 3. FLAT-SHADED MATERIAL ────────────────────────────────────────────────────
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True

nt    = mat.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

out  = nodes.new("ShaderNodeOutputMaterial"); out.location  = (400, 0)
bsdf = nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (100, 0)
bsdf.inputs["Base Color"].default_value = (0.85, 0.50, 0.30, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.80
links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
mesh.materials.append(mat)

# ── 4. GEOMETRY NODES MODIFIER ─────────────────────────────────────────────────
ng    = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")
gnn   = ng.nodes
gnl   = ng.links

# Interface (Blender 4.0+ API)
ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

ni = gnn.new("NodeGroupInput");  ni.location  = (-400, 0)
no = gnn.new("NodeGroupOutput"); no.location  = ( 450, 0)

# Triangulate Mesh — converts quads and n-gons to tris
tri = gnn.new("GeometryNodeTriangulate")
tri.location    = (-150, 0)
tri.quad_method = QUAD_METHOD
tri.ngon_method = NGON_METHOD
tri.inputs["Minimum Vertices"].default_value = MIN_VERTICES

# Set Shade Smooth → enforce flat shading after triangulation
shade = gnn.new("GeometryNodeSetShadeSmooth")
shade.location = (150, 0)
shade.domain   = "FACE"
shade.inputs["Shade Smooth"].default_value = False

gnl.new(ni.outputs["Geometry"],     tri.inputs["Mesh"])
gnl.new(tri.outputs["Mesh"],        shade.inputs["Geometry"])
gnl.new(shade.outputs["Geometry"],  no.inputs["Geometry"])

mod = obj.modifiers.new(GN_MOD_NAME, "NODES")
mod.node_group = ng

# ── 5. CAMERA & SUN ────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -9, 6))
cam = bpy.context.active_object
cam.rotation_euler = (1.05, 0, 0)
bpy.context.scene.camera = cam

bpy.ops.object.light_add(type="SUN", location=(3, -4, 7))
sun = bpy.context.active_object
sun.data.energy = 4.0
sun.rotation_euler = (0.8, 0.2, 0.5)

# ── 6. EXPORT GLB ─────────────────────────────────────────────────────────────
# export_apply=True bakes the GN modifier — the triangulated mesh is what glTF
# sees, not the pre-triangulation source. This is mandatory: glTF always needs
# tris; without it, the exporter does its own triangulation, potentially
# ignoring your carefully chosen quad_method.
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_PATH),
    export_format="GLB",
    export_apply=True,
    use_selection=True,
    export_materials="EXPORT",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)
print(f"[TriSafe] GLB → {bpy.path.abspath(EXPORT_PATH)}")

# ── 7. SAVE .BLEND ─────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//tri_safe_demo.blend"))
print("[TriSafe] Saved tri_safe_demo.blend")
