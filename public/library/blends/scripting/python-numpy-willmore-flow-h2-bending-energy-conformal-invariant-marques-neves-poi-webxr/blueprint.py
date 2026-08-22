# SPDX-License-Identifier: CC0-1.0
"""
Willmore Flow  —  H² Bending Energy, Conformal Invariance
& the Marques-Neves 2π² Theorem  (Blender 5.1)
==========================================================
Holoflow Studio · Blender 5.1 tutorial

The Willmore energy of a smooth closed surface Σ ⊂ R³ is:
    W[Σ] = ∫_Σ H² dA

where H = (κ₁+κ₂)/2 is the mean curvature.  W is invariant under
Möbius transformations of R³ ∪ {∞} (inversion + Euclidean isometries).

Lower bounds:
    W ≥ 4π   for any immersed surface (Li–Yau 1982, equality iff round sphere)
    W ≥ 2π²  for any embedded torus (Willmore conjecture 1965,
               proven Marques & Neves 2012 using min-max theory)

The minimiser at 2π² is the (stereographic projection of the) Clifford torus.

This script implements discrete Willmore gradient descent on a triangulated
torus.  Each step computes ΔH via two passes of the cotangent Laplacian
(position → H scalar → ΔH scalar) and nudges vertices along −ΔH·n.
Five shape keys capture the evolution and a FLOAT_COLOR attribute maps
the Willmore density (H²−K per vertex) to a cobalt–amber gradient.

References
----------
Willmore TJ (1965) Note on embedded surfaces. An. Stiint. Univ. "Al. I. Cuza"
  Iasi Mat. 11B 493–496.
Marques FC & Neves A (2012) Min-max theory and the Willmore conjecture.
  Ann. Math. 179 683–782. https://arxiv.org/abs/1202.6076  (CC BY, free access)
Li P & Yau ST (1982) A new conformal invariant and its applications to the
  Willmore conjecture and the first eigenvalue of compact surfaces.
  Invent. Math. 69 269–291. https://doi.org/10.1007/BF01399507
Crane K, Pinkall U, Schröder P (2013) Robust fairing via conformal curvature
  flow. ACM Trans. Graph. 32(4) article 61. MIT-licenced code + preprint:
  https://www.cs.cmu.edu/~kmcrane/Projects/ConformalWillmoreFlow/
NumPy (BSD-3-Clause) https://numpy.org/

Cross-references (Holoflow Studio)
------------------------------------
/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr
/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr
/tutorials/blender-tutorial-python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr
/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr
"""

import numpy as np
import bpy

# ── Parameters ────────────────────────────────────────────────────────────────
TORUS_R      = 1.0          # major radius (centreline ring)
TORUS_r      = 0.45         # tube radius  — R/r ≠ √2 so W > 2π² at start
NU           = 60           # longitude resolution (u direction)
NV           = 30           # latitude  resolution (v direction)
DT           = 8e-6         # explicit-Euler step for biharmonic flow (CFL ∼ h⁴)
N_STEPS      = 120          # total gradient-descent steps
SNAPSHOTS    = [15, 40, 70, 120]
SK_NAMES     = ["SK_Step015", "SK_Step040", "SK_Step070", "SK_Step120"]
COBALT       = (0.13, 0.35, 0.80, 1.0)   # low Willmore density
AMBER        = (1.00, 0.55, 0.10, 1.0)   # high Willmore density
COLOUR_ATTR  = "Willmore_Density"
OBJ_NAME     = "Willmore_Torus"
LICENCE      = "CC0"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)

# ── Torus parameterisation ────────────────────────────────────────────────────
def _make_torus(R: float, r: float, Nu: int, Nv: int):
    """Regular quadrilateral grid on the torus, triangulated into two fans."""
    u = np.linspace(0.0, 2.0 * np.pi, Nu, endpoint=False)
    v = np.linspace(0.0, 2.0 * np.pi, Nv, endpoint=False)
    uu, vv = np.meshgrid(u, v, indexing="ij")       # Nu × Nv

    X = np.stack([
        (R + r * np.cos(vv)) * np.cos(uu),
        (R + r * np.cos(vv)) * np.sin(uu),
        r * np.sin(vv),
    ], axis=-1).reshape(-1, 3)                       # V × 3

    idx = np.arange(Nu * Nv).reshape(Nu, Nv)
    i  = np.arange(Nu)[:, None];  j  = np.arange(Nv)[None, :]
    i1 = (i + 1) % Nu;            j1 = (j + 1) % Nv
    A  = idx[i, j].ravel();       B  = idx[i1, j].ravel()
    C  = idx[i1, j1].ravel();     D  = idx[i, j1].ravel()
    faces = np.concatenate([
        np.stack([A, B, C], axis=1),   # lower-left triangle
        np.stack([A, C, D], axis=1),   # upper-right triangle
    ], axis=0).astype(np.int32)
    return X.astype(np.float64), faces


# ── Cotangent Laplacian helpers ───────────────────────────────────────────────
def _cot_weights(X: np.ndarray, faces: np.ndarray):
    """
    Returns (I, J, W, A):
      I, J  — edge endpoint indices (2×E each for both directions)
      W     — w_ij = 0.5·(cot α_ij + cot β_ij)  (same weight per direction)
      A     — mixed Voronoi vertex area (approx, using 1/6 face area per tip)
    WHY cotangents? They are the unique weights that discretise the
    Laplace-Beltrami operator on a flat triangulation without bias toward
    short edges.  Meyer et al. 2003.
    """
    V = len(X)
    I_list, J_list, W_list = [], [], []
    A = np.zeros(V, dtype=np.float64)

    for ki in range(3):                             # cycle: each vertex is tip
        tip = faces[:, ki]
        j   = faces[:, (ki + 1) % 3]
        k   = faces[:, (ki + 2) % 3]

        u = X[j] - X[tip]                          # F × 3
        v = X[k] - X[tip]                          # F × 3

        dot_uv  = np.einsum("fi,fi->f", u, v)
        cross_n = np.linalg.norm(np.cross(u, v), axis=1)   # |u×v|
        cot     = dot_uv / (cross_n + 1e-15)
        w       = 0.5 * cot

        # edge (j → k) and (k → j) both get weight w
        I_list += [j, k]
        J_list += [k, j]
        W_list += [w, w]

        # 1/6 of face area to the tip vertex (non-obtuse approximation)
        np.add.at(A, tip, cross_n * (1.0 / 6.0))

    return (np.concatenate(I_list), np.concatenate(J_list),
            np.concatenate(W_list), A)


def _lap_vec(X, I, J, W, A):
    """Cotangent Laplacian of a position field X (V×3).  Returns V×3."""
    LX = np.zeros_like(X)
    np.add.at(LX, I, W[:, None] * (X[J] - X[I]))
    return LX / (2.0 * A[:, None] + 1e-15)


def _lap_scalar(h, I, J, W, A):
    """Cotangent Laplacian of a scalar field h (V,).  Returns V."""
    Lh = np.zeros(len(h), dtype=np.float64)
    np.add.at(Lh, I, W * (h[J] - h[I]))
    return Lh / (2.0 * A + 1e-15)


# ── Gaussian curvature via angle defect ──────────────────────────────────────
def _gaussian_curvature(X, faces, A):
    """K_i = angle_defect_i / A_i   (Gauss-Bonnet discrete K)."""
    V = len(X)
    angle_sum = np.full(V, 2.0 * np.pi, dtype=np.float64)  # start at 2π

    for ki in range(3):
        tip = faces[:, ki]
        j   = faces[:, (ki + 1) % 3]
        k   = faces[:, (ki + 2) % 3]
        u   = X[j] - X[tip]
        v   = X[k] - X[tip]
        cos_a = np.einsum("fi,fi->f", u, v) / (
            np.linalg.norm(u, axis=1) * np.linalg.norm(v, axis=1) + 1e-15)
        theta = np.arccos(np.clip(cos_a, -1.0, 1.0))
        np.add.at(angle_sum, tip, -theta)           # subtract interior angle

    return angle_sum / (A + 1e-15)                 # K_i = defect / A_i


# ── Willmore gradient descent ─────────────────────────────────────────────────
def _willmore_energy(X, faces):
    """Scalar total Willmore energy W = Σ_i H_i² · A_i  (discrete)."""
    I, J, W, A = _cot_weights(X, faces)
    H_vec = _lap_vec(X, I, J, W, A)
    H_mag = np.linalg.norm(H_vec, axis=1)
    return float(np.sum(H_mag ** 2 * A))


def _flow_step(X, faces):
    """
    One explicit-Euler Willmore step: X ← X − DT · ΔH · n̂
    WHY ΔH? The Willmore gradient is (ΔH + 2H(H²-K))n̂; for moderate
    curvatures the ΔH term dominates, giving a stable linearised flow
    that reduces W while staying close to the original torus topology.
    The full gradient adds the 2H(H²−K) reaction term which is smaller
    and not needed for the tutorial energy decrease.
    """
    I, J, W, A = _cot_weights(X, faces)

    H_vec = _lap_vec(X, I, J, W, A)               # mean-curvature vector
    H_mag = np.linalg.norm(H_vec, axis=1)          # scalar H
    n_hat = H_vec / (H_mag[:, None] + 1e-15)       # unit surface normal

    dH    = _lap_scalar(H_mag, I, J, W, A)         # ΔH (biharmonic term)
    return X - DT * dH[:, None] * n_hat            # gradient descent


X, faces = _make_torus(TORUS_R, TORUS_r, NU, NV)
print(f"Vertices {len(X)}  Triangles {len(faces)}")
print(f"Initial W ≈ {_willmore_energy(X, faces):.4f}  (theoretical min 2π² ≈ 19.739)")

snapshots = {0: X.copy()}
for step in range(1, N_STEPS + 1):
    X = _flow_step(X, faces)
    if step in SNAPSHOTS:
        snapshots[step] = X.copy()
        print(f"Step {step:4d}  W ≈ {_willmore_energy(X, faces):.4f}")

# ── Build Blender mesh ────────────────────────────────────────────────────────
mesh = bpy.data.meshes.new(OBJ_NAME)
mesh.from_pydata(snapshots[0].tolist(), [], faces.tolist())
mesh.update()
obj = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ── Shape keys ────────────────────────────────────────────────────────────────
sk_basis = obj.shape_key_add(name="Basis", from_mix=False)
sk_basis.interpolation = "KEY_LINEAR"
for snap_step, sk_name in zip(SNAPSHOTS, SK_NAMES):
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    sk.interpolation = "KEY_LINEAR"
    buf = snapshots[snap_step].ravel().astype(np.float32)
    sk.data.foreach_set("co", buf)
mesh.update()

# ── Willmore density vertex colour (H² − K per vertex, normalised) ────────────
I, J, W, A = _cot_weights(snapshots[0], faces)
H_vec = _lap_vec(snapshots[0], I, J, W, A)
H_mag = np.linalg.norm(H_vec, axis=1)
K_arr = _gaussian_curvature(snapshots[0], faces, A)
W_dens = H_mag ** 2 - K_arr                        # integrand of Willmore energy

lo, hi = W_dens.min(), W_dens.max() + 1e-15
t = np.clip((W_dens - lo) / (hi - lo), 0.0, 1.0)

attr = mesh.color_attributes.new(
    name=COLOUR_ATTR, type="FLOAT_COLOR", domain="POINT"
)
rgba = np.array(COBALT)[None, :] * (1 - t[:, None]) + np.array(AMBER)[None, :] * t[:, None]
attr.data.foreach_set("color", rgba.astype(np.float32).ravel())
mesh.update()

# ── Holoflow GLB export ───────────────────────────────────────────────────────
obj["holoflow:facet"] = True
bpy.ops.export_scene.gltf(
    filepath=f"//{OBJ_NAME.lower()}.glb",
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_morph=True,
    export_colors=True,
    export_yup=True,
    use_selection=False,
)
print("✓ Export complete: willmore_torus.glb")
