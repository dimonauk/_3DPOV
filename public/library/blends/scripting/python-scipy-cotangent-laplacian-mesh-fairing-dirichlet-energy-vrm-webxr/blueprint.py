"""
Python bpy + scipy.sparse — Cotangent Laplacian Mesh Fairing (Blender 5.1)
===========================================================================
Explicit Laplacian smoothing averages each vertex with its neighbours, but
the weights determine what geometry you actually minimise.  The *umbrella*
(uniform) Laplacian treats all neighbours equally, which biases vertices
toward the barycentre of their valence ring — causing volume shrinkage.
The *cotangent* Laplacian weights each edge (i,j) by (cot α + cot β)/2,
where α and β are the angles opposite to that edge in the two adjacent
triangles.  This emerges from the discrete exterior calculus (Pinkall &
Polthier 1993; Meyer et al. 2003): the cotangent Laplacian discretises the
continuous Laplace-Beltrami operator, minimising Dirichlet energy ∫|∇f|² dA
rather than a purely combinatorial average.  It is the correct operator for
mesh fairing, mean-curvature flow, and spectral geometry.

We compare three smoothed variants stored as shape keys:
  Basis     — original noisy sphere
  Taubin    — alternating +λ / −μ explicit steps (Taubin 1995)
  Implicit  — solve (I − dt·L)x = x₀ once (Desbrun 1999)
"""

import bpy
import bmesh
import numpy as np
from mathutils.noise import fractal_vector3
from scipy.sparse import csr_matrix, eye as speye
from scipy.sparse.linalg import spsolve

# ── parameters ──────────────────────────────────────────────────────────────
SUBDIVISIONS   = 3       # icosphere; sub=3 → 162 verts, sub=4 → 642
NOISE_AMP      = 0.24    # fBm displacement amplitude (world units)
NOISE_FREQ     = 4.7     # spatial frequency of noise

TAUBIN_LAMBDA  =  0.50   # smoothing pass scale (positive)
TAUBIN_MU      = -0.53   # inflation pass scale (negative); |μ| > λ prevents DC decay
TAUBIN_ROUNDS  =  8      # each round = λ step + μ step

IMPLICIT_DT    =  1.0    # implicit time-step; large = heavy fairing
GLB_PATH       = "//hf_fairing.glb"
# ────────────────────────────────────────────────────────────────────────────


def _clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)


def _build_noisy_sphere() -> bpy.types.Object:
    """Icosphere with 3-octave fBm displacement — purposely not smooth."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=SUBDIVISIONS, radius=1.0, calc_uvs=False)
    for v in bm.verts:
        # fractal_vector3: Blender's Musgrave fBm noise; returns Vector3
        disp = fractal_vector3(v.co * NOISE_FREQ, 0.5, 2.0, 3, noise_type="PERLIN_ORIGINAL")
        v.co += v.normal * (disp.x * NOISE_AMP)
    me = bpy.data.meshes.new("HF_Fairing")
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new("HF_Fairing", me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_flat()
    return obj


def _extract_vf(me: bpy.types.Mesh) -> tuple:
    """Return (N,3) float64 vertex positions and (F,3) int32 face indices."""
    N = len(me.vertices)
    V = np.empty(N * 3, dtype=np.float64)
    me.vertices.foreach_get("co", V)
    V = V.reshape(N, 3)
    # keep only triangles; icosphere primitives are all tris
    F = np.array([list(p.vertices) for p in me.polygons if len(p.vertices) == 3],
                 dtype=np.int32)
    return V, F


def _cotangent_laplacian(V: np.ndarray, F: np.ndarray) -> csr_matrix:
    """
    Symmetric cotangent-weight Laplacian L, shape (N, N).

    For each triangle (i,j,k), the angle at vertex k has cotangent:
        cot(k) = dot(e_ki, e_kj) / |e_ki × e_kj|
    Edge (i,j) accumulates half the cot from angle k, plus half from the
    opposing triangle's angle — giving (cot α_ij + cot β_ij) / 2.
    Convention: L_ij = -w_ij (off-diagonal), L_ii = Σ_j w_ij (row sum = 0).
    This makes L positive semi-definite with a null space spanned by constants.
    """
    N = V.shape[0]
    rows, cols, vals = [], [], []

    for tri in F:
        for k_local in range(3):
            # k is opposite to edge (i, j)
            i = int(tri[(k_local + 1) % 3])
            j = int(tri[(k_local + 2) % 3])
            k = int(tri[k_local])
            e_ki = V[i] - V[k]
            e_kj = V[j] - V[k]
            dot_v  = float(np.dot(e_ki, e_kj))
            cross_mag = float(np.linalg.norm(np.cross(e_ki, e_kj)))
            cot_k  = dot_v / (cross_mag + 1e-12)  # +eps: degenerate-tri guard
            w = 0.5 * cot_k  # half because the other adjacent tri contributes w too
            # -w on off-diagonals i↔j; +w on diagonals i,i and j,j (row-sum = 0)
            rows += [i, j, i, j]
            cols += [j, i, i, j]
            vals += [-w, -w, w, w]

    return csr_matrix((vals, (rows, cols)), shape=(N, N))


def _taubin_smooth(V: np.ndarray, L: csr_matrix) -> np.ndarray:
    """
    Taubin (1995) λ/μ filter.  Alternating positive (shrink) and negative
    (expand) scale factors.  Because |μ| > λ the inflation pass slightly
    over-compensates each round, cancelling the low-frequency drift while
    high-frequency bumps are genuinely removed.
    """
    X = V.copy()
    for _ in range(TAUBIN_ROUNDS):
        X = X + TAUBIN_LAMBDA * (L @ X)   # smoothing: Δ pushes inward
        X = X + TAUBIN_MU     * (L @ X)   # inflation: Δ pushes outward
    return X


def _implicit_fair(V: np.ndarray, L: csr_matrix) -> np.ndarray:
    """
    Desbrun 1999 implicit Laplacian flow: solve (I − dt·L)x = x₀.
    Unconditionally stable for any dt — a large dt gives heavy fairing in
    one solve instead of many small explicit steps.  The factored sparse
    system is reused for all three coordinate directions.
    """
    N = V.shape[0]
    A = speye(N, format="csr") - IMPLICIT_DT * L
    return np.column_stack([spsolve(A, V[:, c]) for c in range(3)])


def _add_shape_key(obj: bpy.types.Object, name: str, coords: np.ndarray) -> None:
    if obj.data.shape_keys is None:
        obj.shape_key_add(name="Basis", from_mix=False)
    sk = obj.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set("co", coords.astype(np.float32).ravel())


def _add_deviation_attr(obj: bpy.types.Object, name: str,
                         V_orig: np.ndarray, V_fair: np.ndarray) -> None:
    """Per-vertex Euclidean displacement stored as a POINT float attribute."""
    attr = obj.data.attributes.new(f"dev_{name}", "FLOAT", "POINT")
    devs = np.linalg.norm(V_fair - V_orig, axis=1).astype(np.float32)
    attr.data.foreach_set("value", devs)


def _add_material(obj: bpy.types.Object) -> None:
    """Emission shader mapping Taubin deviation → blue (low) to amber (high)."""
    mat = bpy.data.materials.new("HF_Fairing_Viz")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    attr = nt.nodes.new("ShaderNodeAttribute");  attr.attribute_name = "dev_taubin"
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.02, 0.04, 0.30, 1)   # deep blue
    ramp.color_ramp.elements[1].color = (0.95, 0.40, 0.08, 1)   # amber
    emit = nt.nodes.new("ShaderNodeEmission");  emit.inputs["Strength"].default_value = 4.0
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Fac"],     ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"],   emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    obj.data.materials.append(mat)


# ── entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    _clear_scene()
    obj    = _build_noisy_sphere()
    me     = obj.data
    V, F   = _extract_vf(me)
    L      = _cotangent_laplacian(V, F)
    V_taub = _taubin_smooth(V, L)
    V_impl = _implicit_fair(V, L)

    _add_shape_key(obj, "Taubin",   V_taub)
    _add_shape_key(obj, "Implicit", V_impl)
    _add_deviation_attr(obj, "taubin",   V, V_taub)
    _add_deviation_attr(obj, "implicit", V, V_impl)
    _add_material(obj)

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        export_morph=True,
        export_image_format="WEBP",
        export_yup=True,
    )
    print("Fairing done — shape keys: Basis | Taubin | Implicit")
