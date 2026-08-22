"""
Heat Method for Geodesic Distance — Crane, de Goes, Desbrun & Alliez (2013)
============================================================================
Blender 5.1 | CC0 | Holoflow Studio
Source: "Geodesics in Heat: A Transfer Operator Approach to Geodesic Computation"
ACM Trans. Graphics 32(5), Art. 152 (2013). DOI: 10.1145/2516971.2516977
Algorithm in the public domain; implementation CC0.

Why this matters
----------------
Dijkstra's algorithm gives geodesic distances in O(n log n) but requires
exact nearest-neighbour graph traversal. The Heat Method instead solves two
sparse linear systems — both already assembled from the cotangent Laplacian —
giving a smooth, easily parallelisable distance field on any triangle mesh.
Errors vs exact geodesic are typically < 0.3% on well-shaped triangles.

Three-step pipeline
-------------------
  1. HEAT FLOW   (M - t·L) u = δₛ   — backward-Euler heat from source s
  2. NORMALISE   X = -∇u / |∇u|     — unit vector field pointing away from s
  3. POISSON     L φ = ∇·X          — recover distance from its gradient
"""
import bpy, bmesh, math
import numpy as np
from scipy import sparse
from scipy.sparse.linalg import spsolve

# ── PARAMETERS ──────────────────────────────────────────────────────────────
SOURCE_VERT    = 0        # index of pole vertex (geodesic distance = 0 here)
RING_FREQ      = 18       # number of isodistance rings in the colour map
PLASMA_POWER   = 1.0      # gamma for plasma colormap saturation
N_SHAPE_KEYS   = 5        # wavefront animation shape keys (0..1 distance fade)
GLB_PATH       = "//hf_geodesic_heat.glb"
MESH_SUBDIVS   = 3        # icosphere subdivisions (3 → 642 verts, good balance)
SPHERE_RADIUS  = 0.18     # metres — poi head size

# ── 1. BUILD MESH ────────────────────────────────────────────────────────────
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=MESH_SUBDIVS, radius=SPHERE_RADIUS)
bmesh.ops.triangulate(bm, faces=bm.faces)   # ensure all triangles
bm.verts.ensure_lookup_table()
bm.faces.ensure_lookup_table()

nv = len(bm.verts)
nf = len(bm.faces)

# Snap source to actual top-most vertex (most +Z)
zs = np.array([v.co.z for v in bm.verts])
SOURCE_VERT = int(np.argmax(zs))

# ── 2. COTANGENT LAPLACIAN + LUMPED MASS ─────────────────────────────────────
# For triangle (i,j,k), cotangent weight for edge (i,j) uses angle at k.
# cot α = cos α / sin α = dot(a,b) / |cross(a,b)|
rows, cols, vals = [], [], []
mass_diag = np.zeros(nv)

for f in bm.faces:
    verts = [l.vert.index for l in f.loops]
    pts   = [np.array(bm.verts[vi].co) for vi in verts]
    # Area for mass lumping (Voronoi/barycentric == face_area/3 per vertex)
    e01 = pts[1] - pts[0]; e02 = pts[2] - pts[0]
    area = 0.5 * np.linalg.norm(np.cross(e01, e02))
    for vi in verts:
        mass_diag[vi] += area / 3.0

    # Cotangent weights per edge
    for k in range(3):
        i, j = verts[k], verts[(k+1) % 3]
        opp  = verts[(k+2) % 3]          # opposite vertex to edge (i→j)
        ea   = np.array(bm.verts[i].co) - np.array(bm.verts[opp].co)
        eb   = np.array(bm.verts[j].co) - np.array(bm.verts[opp].co)
        sin_val = np.linalg.norm(np.cross(ea, eb))
        cos_val = np.dot(ea, eb)
        cot     = cos_val / max(sin_val, 1e-8)   # guard degenerate triangles
        w       = 0.5 * cot
        # L[i,j] += -w;  L[i,i] += w  (and symmetric)
        rows += [i, j, i, j]
        cols += [j, i, i, j]
        vals += [-w, -w, w, w]

L = sparse.csr_matrix((vals, (rows, cols)), shape=(nv, nv))
M = sparse.diags(mass_diag, format="csr")

# ── 3. HEAT STEP SIZE — h² where h is mean edge length ──────────────────────
edge_lengths = [
    np.linalg.norm(np.array(e.verts[0].co) - np.array(e.verts[1].co))
    for e in bm.edges
]
h = np.mean(edge_lengths)
t = h * h                                 # Crane's canonical step size

# ── 4. HEAT FLOW: solve (M - t·L) u = δₛ ───────────────────────────────────
delta = np.zeros(nv)
delta[SOURCE_VERT] = 1.0
A_heat = M - t * L                        # positive definite for t > 0
u = spsolve(A_heat, delta)
u = np.maximum(u, 0.0)                   # numerical rounding → clamp

# ── 5. PER-FACE GRADIENT ∇u IN TANGENT PLANE ─────────────────────────────────
# ∇u|_f = (1/2A) Σᵢ uᵢ · (n × eᵢ_opp)
# where eᵢ_opp is the edge opposite vertex i, n is face normal.
grad_u = np.zeros((nf, 3))
face_normals = np.zeros((nf, 3))
face_areas   = np.zeros(nf)

for fi, f in enumerate(bm.faces):
    vidx = [l.vert.index for l in f.loops]
    p    = [np.array(bm.verts[vi].co) for vi in vidx]
    n_raw = np.cross(p[1]-p[0], p[2]-p[0])
    A     = 0.5 * np.linalg.norm(n_raw)
    n     = n_raw / (np.linalg.norm(n_raw) + 1e-14)
    face_normals[fi] = n
    face_areas[fi]   = A
    g = np.zeros(3)
    for k in range(3):
        opp_edge = p[(k+2) % 3] - p[(k+1) % 3]   # edge opposite to vertex k
        perp     = np.cross(n, opp_edge)            # rotate 90° in plane
        g       += u[vidx[k]] * perp
    grad_u[fi] = g / (2.0 * A + 1e-14)

# ── 6. NORMALISE GRADIENT → unit field X ─────────────────────────────────────
mag = np.linalg.norm(grad_u, axis=1, keepdims=True)
X   = -grad_u / (mag + 1e-14)   # negated: X points away from source

# ── 7. DIVERGENCE ∇·X AT VERTICES ───────────────────────────────────────────
# For each face f and its three vertex-edge pairs, accumulate:
# div[v] += 0.5 · (cot α · dot(X_f, e1) + cot β · dot(X_f, e2))
div_vec = np.zeros(nv)

for fi, f in enumerate(bm.faces):
    vidx = [l.vert.index for l in f.loops]
    p    = [np.array(bm.verts[vi].co) for vi in vidx]
    Xf   = X[fi]
    for k in range(3):
        vi  = vidx[k]
        vj  = vidx[(k+1) % 3]
        vopp= vidx[(k+2) % 3]
        # edges from vi
        ej  = p[vj]   - p[vi]      # edge to j
        eopp= p[vopp] - p[vi]      # edge to opp
        # cotangent of angle at the vertex OPPOSITE each edge
        ea  = p[vi]   - p[vopp];  eb = p[vj]   - p[vopp]
        sin1= np.linalg.norm(np.cross(ea, eb)); cos1 = np.dot(ea, eb)
        cot1 = cos1 / max(sin1, 1e-8)
        ec  = p[vi]   - p[vj];    ed = p[vopp] - p[vj]
        sin2= np.linalg.norm(np.cross(ec, ed)); cos2 = np.dot(ec, ed)
        cot2 = cos2 / max(sin2, 1e-8)
        div_vec[vi] += 0.5 * (cot1 * np.dot(Xf, ej) + cot2 * np.dot(Xf, eopp))

# ── 8. POISSON SOLVE: L φ = ∇·X → geodesic distance φ ──────────────────────
# L is singular (kernel = constants) — add small diagonal shift to pin it
eps_reg = 1e-8
L_reg   = L + sparse.eye(nv, format="csr") * eps_reg
phi     = spsolve(L_reg, div_vec)
phi    -= phi[SOURCE_VERT]             # shift so source = 0
phi     = np.abs(phi)                  # distance is non-negative

# ── 9. BUILD BLENDER MESH + VERTEX COLOURS ───────────────────────────────────
mesh = bpy.data.meshes.new("GeodesicPoi")
bm.to_mesh(mesh)
bm.free()

obj = bpy.data.objects.new("GeodesicPoi", mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# Plasma-inspired isoline colour map
phi_max = phi.max() + 1e-9
phi_n   = phi / phi_max                # 0..1 normalised distance

def plasma_rgb(t):
    """Compact plasma approximation: violet→orange rings."""
    r = 0.9 - 0.6 * math.cos(t * math.pi * 2.0)
    g = 0.3 + 0.6 * math.sin(t * math.pi)
    b = 0.8 - 0.8 * t
    return max(0., min(1., r)), max(0., min(1., g)), max(0., min(1., b))

col_attr = mesh.color_attributes.new(
    name="GeodesicDist", type="FLOAT_COLOR", domain="POINT")
for vi, t in enumerate(phi_n):
    iso_t   = (t * RING_FREQ) % 1.0
    r, g, b = plasma_rgb(iso_t)
    col_attr.data[vi].color = (r, g, b, 1.0)

# ── 10. SHAPE KEYS — geodesic wavefront propagation ─────────────────────────
obj.shape_key_add(name="Basis")
for ki in range(1, N_SHAPE_KEYS + 1):
    sk    = obj.shape_key_add(name=f"Wave{ki:02d}")
    front = ki / N_SHAPE_KEYS           # fraction of mesh this wave has passed
    for vi, sk_pt in enumerate(sk.data):
        depth = max(0.0, phi_n[vi] - front)
        push  = min(depth * 4.0, 0.03)  # 3 cm max radial push
        n_v   = np.array(mesh.vertices[vi].co) / (SPHERE_RADIUS + 1e-9)
        sk_pt.co = (
            mesh.vertices[vi].co[0] + n_v[0] * push,
            mesh.vertices[vi].co[1] + n_v[1] * push,
            mesh.vertices[vi].co[2] + n_v[2] * push,
        )

# ── 11. EMISSION MATERIAL ────────────────────────────────────────────────────
mat = bpy.data.materials.new("GeodesicMat")
mat.use_nodes = True
nt  = mat.node_tree
for n in list(nt.nodes): nt.nodes.remove(n)

vcol = nt.nodes.new("ShaderNodeVertexColor"); vcol.layer_name = "GeodesicDist"
em   = nt.nodes.new("ShaderNodeEmission");    em.inputs["Strength"].default_value = 2.5
out  = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(vcol.outputs["Color"], em.inputs["Color"])
nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
mesh.materials.append(mat)

# ── 12. GLB EXPORT ───────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_colors=True,
    export_morph=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)
print(f"✓  geodesic distance max = {phi_max:.4f} m  |  verts = {nv}  |  faces = {nf}")
