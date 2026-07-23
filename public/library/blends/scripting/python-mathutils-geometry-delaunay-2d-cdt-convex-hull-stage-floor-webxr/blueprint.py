"""
mathutils.geometry — Delaunay 2D CDT + Convex Hull
====================================================
Poi Stage Floor: Phyllotaxis Dancer Positions → Faceted Mosaic for WebXR
Blender 5.1  ·  CC0  ·  Holoflow Studio

TECHNIQUE
─────────
Delaunay triangulation maximises the minimum angle across all triangles by
enforcing the circumscribed-circle property: no input point may lie inside
the circumscribed circle of any triangle.  This suppresses the "sliver"
triangles that dominate naive fan or grid triangulations of an irregular
point cloud.

mathutils.geometry.delaunay_2d_cdt(coords, edges, faces, output_type, eps)
  · output_type 0 → CDT_FULL: all Delaunay triangles inside convex hull
  · output_type 3 → CDT_INSIDE: triangles inside constraint polygon only
  · Returns (verts_out, edges_out, faces_out) — faces are index triples.

mathutils.geometry.convex_hull_2d(points)
  · Returns CCW-ordered indices into `points` forming the convex hull.

WHY PHYLLOTAXIS + DELAUNAY
──────────────────────────
Vogel's phyllotaxis spiral spaces N points with a constant angular step of
137.508° (the "golden angle").  This prevents any two points from clustering
on the same radial spoke, so the resulting Delaunay triangles have uniform
area and angular distribution — a near-isotropic mosaic with no pathological
slivers, even near the boundary.  Random point sets require either Steiner
points or post-processing to achieve the same regularity.

WHAT WE BUILD
─────────────
28 dancer positions from the Vogel spiral → Delaunay triangulation inside
their convex hull → per-face colour keyed to circumradius (the Delaunay
quality metric) → flat-shaded stage-floor GLB for WebXR placement.
A separate boundary-ring object marks the convex hull of the performance
envelope.
"""

import bpy, bmesh, math
import mathutils
from mathutils import Matrix, Vector
from mathutils.geometry import delaunay_2d_cdt, convex_hull_2d

# ─── Parameters ─────────────────────────────────────────────────────────────
N_DANCERS    = 28          # phyllotaxis samples
STAGE_RADIUS = 4.0         # metres — performance-circle radius
CDT_EPSILON  = 1e-5        # vertex-merge tolerance for CDT
OUTPUT_TYPE  = 0           # 0 = CDT_FULL: all triangles inside convex hull
RING_THICK   = 0.06        # boundary ring tube radius (m)
MESH_FLOOR   = "hf_stage_floor"
MESH_RING    = "hf_stage_ring"
MAT_FLOOR    = "hf_stage_floor_mat"
MAT_RING     = "hf_stage_ring_mat"
# Colour ramp: compact (small circumradius) → spread (large circumradius)
COL_TIGHT    = (0.05, 0.05, 0.09, 1.0)
COL_WIDE     = (0.20, 0.14, 0.28, 1.0)
DRACO_LEVEL  = 6
EXPORT_PATH  = "//hf_stage_floor.glb"

# ─── 1. Phyllotaxis dancer positions ────────────────────────────────────────
# Golden angle: 360° × (1 − 1/φ) ≈ 137.508°.  Using square-root radius
# gives uniform area density — the inner region is not starved of points.
PHI_ANGLE = math.pi * (3.0 - math.sqrt(5.0))   # ≈ 2.3999 rad

def phyllotaxis_disk(n: int, r: float) -> list[tuple[float, float]]:
    """Vogel / golden-angle spiral on a disk of radius r."""
    pts = []
    for i in range(n):
        # sqrt distributes points uniformly in area, not along the radius
        radius = r * math.sqrt((i + 0.5) / n)
        angle  = PHI_ANGLE * i
        pts.append((radius * math.cos(angle), radius * math.sin(angle)))
    return pts

points_2d = phyllotaxis_disk(N_DANCERS, STAGE_RADIUS)

# ─── 2. Delaunay 2D CDT ─────────────────────────────────────────────────────
# No constraint edges — we want the full unconstrained Delaunay on all
# dancer positions.  CDT_FULL returns every triangle that lies inside the
# convex hull of the input point set.
verts_out, _edges_out, faces_out = delaunay_2d_cdt(
    points_2d, [], [], OUTPUT_TYPE, CDT_EPSILON
)

if not faces_out:
    raise RuntimeError(
        "CDT returned no faces — try increasing CDT_EPSILON (e.g. 1e-4) "
        "or reducing N_DANCERS to remove near-coincident points."
    )

# ─── 3. Circumradius per triangle (Delaunay quality metric) ─────────────────
def circumradius_2d(a: tuple, b: tuple, c: tuple) -> float:
    """
    Circumradius R of triangle abc.
    Delaunay property: no other input point lies inside circle of radius R.
    Small R (relative to side length) → compact, well-conditioned triangle.
    Large R → nearly co-linear points → potential numerical issues in shaders.
    Formula: R = (|ab| · |bc| · |ca|) / (4 · Area)
    """
    ax, ay = a;  bx, by = b;  cx, cy = c
    # Side lengths
    lab = math.sqrt((bx-ax)**2 + (by-ay)**2)
    lbc = math.sqrt((cx-bx)**2 + (cy-by)**2)
    lca = math.sqrt((ax-cx)**2 + (ay-cy)**2)
    # Signed area × 2  (cross-product formula)
    area2 = abs((bx-ax)*(cy-ay) - (cx-ax)*(by-ay))
    if area2 < 1e-14:
        return 1e9   # degenerate — colour as worst case
    return (lab * lbc * lca) / (2.0 * area2)

radii = [
    circumradius_2d(verts_out[tri[0]], verts_out[tri[1]], verts_out[tri[2]])
    for tri in faces_out
]
r_min = min(radii)
r_max = max(r for r in radii if r < 1e8)   # ignore degenerate triangles

def lerp_col(t: float) -> tuple:
    t = max(0.0, min(1.0, t))
    return tuple(COL_TIGHT[i] + t * (COL_WIDE[i] - COL_TIGHT[i]) for i in range(4))

# ─── 4. Build floor bmesh ────────────────────────────────────────────────────
bm = bmesh.new()
col_lay = bm.loops.layers.float_color.new("Col")

# Lay flat in XY (Z=0); will be rotated to XZ for glTF +Y-up later
bm_verts = [bm.verts.new(Vector((v[0], v[1], 0.0))) for v in verts_out]
bm.verts.ensure_lookup_table()

for idx, tri in enumerate(faces_out):
    try:
        face = bm.faces.new([bm_verts[tri[0]], bm_verts[tri[1]], bm_verts[tri[2]]])
    except ValueError:
        continue   # duplicate face from numerical CDT boundary degeneration

    # Map circumradius to colour: tight triangles → dark slate, spread → warm purple
    t   = (radii[idx] - r_min) / (r_max - r_min + 1e-9)
    col = lerp_col(t)
    for loop in face.loops:
        loop[col_lay][:] = col

bm.normal_update()
for face in bm.faces:
    face.smooth = False   # flat shading = faceted look

# ─── 5. Convex hull → boundary ring ─────────────────────────────────────────
# convex_hull_2d returns CCW-ordered indices into points_2d
hull_idxs = convex_hull_2d(points_2d)
hull_pts  = [points_2d[i] for i in hull_idxs]

# ─── 6. Rotate XY → XZ (glTF +Y-up) ────────────────────────────────────────
# glTF/WebXR: +Y is up, floor plane is XZ.
# Our geometry lives in XY (Z=0 plane, normal = +Z).
# Rotating −90° around the X axis maps the XY plane → XZ plane.
ROT_XZ = Matrix.Rotation(-math.pi / 2, 3, 'X')
bmesh.ops.rotate(bm, verts=list(bm.verts), cent=(0, 0, 0), matrix=ROT_XZ)

# ─── 7. Write floor mesh ─────────────────────────────────────────────────────
floor_mesh = bpy.data.meshes.new(MESH_FLOOR)
bm.to_mesh(floor_mesh)
bm.free()

floor_obj = bpy.data.objects.new(MESH_FLOOR, floor_mesh)
bpy.context.collection.objects.link(floor_obj)
floor_obj["holoflow:facet"] = True

# ─── 8. Floor material ────────────────────────────────────────────────────────
mat = bpy.data.materials.new(MAT_FLOOR)
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

attr  = nt.nodes.new("ShaderNodeAttribute")
bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
mout  = nt.nodes.new("ShaderNodeOutputMaterial")

attr.attribute_name = "Col"
attr.attribute_type = "GEOMETRY"
bsdf.inputs["Roughness"].default_value = 0.88

nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],  mout.inputs["Surface"])

floor_mesh.materials.append(mat)

# ─── 9. Boundary-ring object from convex hull ────────────────────────────────
bm2 = bmesh.new()
# Hull ring in XY then rotate
hull_3d = [bm2.verts.new(Vector((x, y, 0.0))) for (x, y) in hull_pts]
bm2.verts.ensure_lookup_table()
n_h = len(hull_3d)
for k in range(n_h):
    bm2.edges.new([hull_3d[k], hull_3d[(k + 1) % n_h]])
# Extrude into a thin quad strip so it's a visible closed ring
bmesh.ops.extrude_edge_loop(bm2, edges=list(bm2.edges), use_normal_flip=False)
# Pull extruded verts up slightly in Z
new_v = [v for v in bm2.verts if v.co.z == 0.0 and not any(e.is_boundary for e in v.link_edges)]
for v in bm2.verts[n_h:]:
    v.co.z = RING_THICK   # thin upstanding rim

bmesh.ops.rotate(bm2, verts=list(bm2.verts), cent=(0, 0, 0), matrix=ROT_XZ)
bm2.normal_update()

ring_mesh = bpy.data.meshes.new(MESH_RING)
bm2.to_mesh(ring_mesh)
bm2.free()

ring_obj = bpy.data.objects.new(MESH_RING, ring_mesh)
bpy.context.collection.objects.link(ring_obj)

ring_mat = bpy.data.materials.new(MAT_RING)
ring_mat.use_nodes = True
rnt = ring_mat.node_tree
rnt.nodes.clear()
rbsdf = rnt.nodes.new("ShaderNodeBsdfPrincipled")
rout  = rnt.nodes.new("ShaderNodeOutputMaterial")
rbsdf.inputs["Base Color"].default_value = (0.35, 0.22, 0.50, 1.0)
rbsdf.inputs["Roughness"].default_value  = 0.55
rnt.links.new(rbsdf.outputs["BSDF"], rout.inputs["Surface"])
ring_mesh.materials.append(ring_mat)

# ─── 10. Export as GLB ───────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
floor_obj.select_set(True)
ring_obj.select_set(True)
bpy.context.view_layer.objects.active = floor_obj

bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(EXPORT_PATH),
    use_selection                        = True,
    export_format                        = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO_LEVEL,
    export_image_format                  = "WEBP",
    export_colors                        = True,
    export_yup                           = True,
)

print(
    f"[holoflow] CDT stage floor: {len(verts_out)} verts, "
    f"{len(faces_out)} triangles, convex hull {len(hull_idxs)} pts → {EXPORT_PATH}"
)
