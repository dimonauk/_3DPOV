"""
Laplace-Beltrami Eigenmodes on a Poi Head Sphere
Spectral Mesh Decomposition, Fiedler Vector Partitioning & Shape-Key WebXR GLB
Blender 5.1 · Holoflow Studio

The Laplace-Beltrami operator Δ_M on a triangulated surface is the discrete
analogue of the familiar flat Laplacian ∇² lifted to curved geometry. Its
eigenfunctions φ₀, φ₁, φ₂, ... are the "shape harmonics" of the surface:
  - φ₀  constant, eigenvalue λ₀ = 0  (DC component — always trivial)
  - φ₁  Fiedler vector, λ₁ = λ_min > 0  — partitions the mesh by minimal cut
  - φ₂+ higher modes, increasing spatial frequency across the surface

We discretise Δ_M with the cotangent-weight scheme (Meyer et al. 2003): for
each triangle edge (i,j), the weight w_ij = (cot α_ij + cot β_ij)/2 where
α_ij and β_ij are the angles opposite that edge in the two adjacent triangles.
Paired with a lumped barycentric mass matrix M_lump (M_ii = one-third of the
sum of adjacent triangle areas), this gives the symmetric generalised eigenvalue
problem  L φ = λ M_lump φ  whose solutions are orthonormal with respect to the
mesh area metric.

scipy.sparse.linalg.eigsh solves the problem using the ARPACK implicitly
restarted Lanczos method, requesting the K_MODES lowest-frequency modes. Each
eigenvector is then mapped onto a shape key that displaces vertices along their
analytic sphere normals, making the modal decomposition directly visible as a
choreography of surface breathing — a poi-head that vibrates in its natural modes.

Sources used:
  Meyer, Desbrun, Schröder, Barr (2003) "Discrete Differential-Geometry
  Operators for Triangulated 2-Manifolds". Vis. and Math. 2003.
  Available free at https://www.cs.jhu.edu/~misha/Fall09/Meyer02.pdf
  (Mathematical content in the public domain; no licence on the notation itself.)

  scipy: BSD-3-Clause.  Blender Python API: CC-BY-SA 4.0 Blender Foundation.
"""

import sys
import subprocess

for _pkg in ("numpy", "scipy"):
    try:
        __import__(_pkg)
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", _pkg])

import numpy as np
from scipy.sparse import lil_matrix, diags
from scipy.sparse.linalg import eigsh
import bpy
import bmesh

# ── Parameters ────────────────────────────────────────────────────────────────
SUBDIVISIONS = 3        # icosphere subdivisions: 3 → 162 verts, fast and clean
RADIUS       = 0.15     # sphere radius in metres (poi-head scale)
K_MODES      = 8        # number of eigenmodes to extract (skip mode 0)
DISP_SCALE   = 0.045    # max radial displacement per mode (metres)
EMIT         = 5.0      # emission strength for the glowing material
DRACO_LVL    = 6        # Draco mesh compression, level 0–10

OUTPUT_GLB  = "//hf_lbo_poi.glb"
COLLECTION  = "HF_LBO"

# Colour palette cycling across the K shape keys (sRGB)
PALETTE = [
    (0.95, 0.30, 0.10),  # warm red  — mode 1 (Fiedler)
    (0.20, 0.60, 0.95),  # sky blue
    (0.15, 0.90, 0.45),  # spring green
    (0.90, 0.75, 0.10),  # gold
    (0.75, 0.25, 0.90),  # violet
    (0.95, 0.55, 0.10),  # amber
    (0.10, 0.80, 0.80),  # teal
    (0.95, 0.20, 0.60),  # magenta
]

# ── Scene setup ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.bloom_threshold = 0.20
scene.eevee.bloom_intensity = 1.8
scene.eevee.bloom_radius    = 5.0
scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.0, 0.0, 0.0)

coll = bpy.data.collections.new(COLLECTION)
scene.collection.children.link(coll)

# ── Build icosphere ───────────────────────────────────────────────────────────
mesh = bpy.data.meshes.new("poi_head")
obj  = bpy.data.objects.new("poi_head", mesh)
coll.objects.link(obj)

bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=SUBDIVISIONS, radius=RADIUS)
bm.to_mesh(mesh)
bm.free()
N = len(mesh.vertices)
print(f"Mesh: {N} vertices, {len(mesh.polygons)} faces")

# ── Cotangent Laplacian ───────────────────────────────────────────────────────
# L[i,j] = -w_ij for i≠j  (off-diagonal, negative cotangent weights)
# L[i,i] = Σ_j w_ij        (diagonal, positive row-sum for positive semi-definite)
# w_ij = (cot α_ij + cot β_ij)/2  summed over the two triangles sharing edge (i,j)
L_acc = lil_matrix((N, N), dtype=np.float64)  # accumulates w_ij (positive)
M_area = np.zeros(N, dtype=np.float64)         # lumped barycentric area

vco = np.array([v.co[:] for v in mesh.vertices])

for face in mesh.polygons:
    vi = list(face.vertices)  # 3 vertex indices (icosphere is all tris)
    area = face.calc_area()
    # Barycentric mass: each vertex of a triangle owns 1/3 of its area
    for idx in vi:
        M_area[idx] += area / 3.0
    # Cotangent weights: for each vertex k, the angle at k contributes
    # cot(angle_k)/2 to the weight of the OPPOSITE edge (k+1, k+2)
    for k in range(3):
        i_opp = vi[(k + 1) % 3]
        j_opp = vi[(k + 2) % 3]
        # Vectors from vertex k toward i and j
        u = vco[i_opp] - vco[vi[k]]
        v = vco[j_opp] - vco[vi[k]]
        cos_a = float(np.dot(u, v))
        sin_a = float(np.linalg.norm(np.cross(u, v)))
        cot   = cos_a / sin_a if sin_a > 1e-14 else 0.0
        # Each edge gets half the contribution from each of its two adjacent tris
        L_acc[i_opp, j_opp] += cot * 0.5
        L_acc[j_opp, i_opp] += cot * 0.5

# Build final Laplacian: off-diag = -w_ij, diag = +Σ w_ij
L_csr = L_acc.tocsr()
diag_vals = np.array(L_acc.sum(axis=1)).ravel()
L_csr = diags(diag_vals) - L_csr  # now L is symmetric PSD

# Lumped mass matrix (diagonal)
M_lump = diags(M_area)

# ── Solve generalised eigenvalue problem L φ = λ M φ ─────────────────────────
# Request K_MODES+1 because mode 0 (eigenvalue ≈ 0) is trivial and discarded.
# 'SM' = smallest magnitude; sigma=0.0 not used because L has a near-null space
# (the constant mode) — eigsh handles this reliably for small meshes.
K_REQ = K_MODES + 1
eigenvalues, eigenvectors = eigsh(
    L_csr, M=M_lump, k=K_REQ, which="SM", tol=1e-8, maxiter=10_000
)
# Sort by eigenvalue (ARPACK may return them unsorted)
order = np.argsort(eigenvalues)
eigenvalues  = eigenvalues[order]
eigenvectors = eigenvectors[:, order]
print("Eigenvalues:", np.round(eigenvalues[:K_REQ], 4))
# Mode 0: eigenvalue should be ≈ 0 (numerical zero, constant eigenvector)
# Modes 1..K_MODES: the shape harmonics we want

# ── Shape keys from eigenmodes ────────────────────────────────────────────────
# Basis shape key (required by Blender for any shape-key driven deformation)
sk_basis = obj.shape_key_add(name="Basis")

# Vertex normals on a unit sphere are just the normalised positions
vnormals = vco / (np.linalg.norm(vco, axis=1, keepdims=True) + 1e-14)

for m in range(1, K_MODES + 1):
    ev = eigenvectors[:, m]
    # Normalise to [-1, 1] range for consistent DISP_SCALE across all modes
    ev_norm = ev / (np.max(np.abs(ev)) + 1e-14)
    name = f"Mode_{m:02d}_lam{eigenvalues[m]:.3f}"
    sk = obj.shape_key_add(name=name)
    # Copy displaced positions into the shape key
    displace = vnormals * (ev_norm[:, None] * DISP_SCALE)
    for i, skp in enumerate(sk.data):
        skp.co = (vco[i, 0] + displace[i, 0],
                  vco[i, 1] + displace[i, 1],
                  vco[i, 2] + displace[i, 2])

# ── Material (emission, cycling palette across shape keys) ───────────────────
mat = bpy.data.materials.new("lbo_emit")
mat.use_nodes = True
nodes = mat.node_tree.nodes
nodes.clear()
emit = nodes.new("ShaderNodeEmission")
emit.inputs["Strength"].default_value = EMIT
r, g, b = PALETTE[0]  # default to mode-1 colour; record.py cycles these
emit.inputs["Color"].default_value = (r, g, b, 1.0)
out = nodes.new("ShaderNodeOutputMaterial")
mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
obj.data.materials.append(mat)

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0.0, -0.50, 0.08)
cam_obj.rotation_euler = (1.48, 0.0, 0.0)

# ── Export GLB ────────────────────────────────────────────────────────────────
for o in bpy.context.scene.objects:
    o.select_set(o in coll.objects[:])
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    use_selection=True,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LVL,
    export_yup=True,
    export_apply=False,   # keep shape keys intact (apply would bake them away)
    export_morph=True,    # write shape keys as morph targets in GLB
    export_morph_normal=False,
)
print(f"Saved: {OUTPUT_GLB}")
