"""
Wigner Semicircle Law — GOE Random Matrix Eigenvalue & Spacing Statistics
Blender 5.1  |  bpy direct-data API  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eugene Wigner (1955) noticed that the neutron resonance level spacings of
heavy nuclei — far too complex to compute from first principles — matched
the spacing statistics of a completely random symmetric matrix.  The key
object is the Gaussian Orthogonal Ensemble (GOE): the ensemble of all real
symmetric N×N matrices H with entries drawn from Gaussians.

Two universal limits emerge as N→∞, independent of the entry distribution:

1. WIGNER SEMICIRCLE LAW
   The empirical eigenvalue density of H = (A + Aᵀ)/√(2N), A_{ij} ~ N(0,1),
   converges weakly to
       ρ_sc(λ) = (1/2π)√(4 − λ²),   |λ| ≤ 2
   This is the matrix analogue of the Central Limit Theorem.

2. LEVEL REPULSION — WIGNER SURMISE
   After unfolding (rescaling each spacing by the local mean spacing
   1/(N·ρ_sc(λᵢ)) so that the global mean spacing = 1), the nearest-
   neighbour spacing distribution follows
       P_GOE(s) ≈ (π/2)s · exp(−πs²/4)
   The linear factor s forces P(0)=0: eigenvalues avoid coincidence.
   Classically-integrable / Poisson systems show P_Pois(s) = e^{−s}
   — levels may cluster; no repulsion.

This blueprint samples N_MAT GOE (or Poisson) matrices of size N, extracts
consecutive (λᵢ, sᵢ) pairs from the bulk, and bins them into a
N_GRID×N_GRID height-field:  x = eigenvalue λ,  y = unfolded spacing s.
The height h(x,y) = log(ε + count) reveals the Wigner ridge at s ≈ 0.9
and the depleted zone at s ≈ 0 (level repulsion).

Four shape keys capture the convergence / contrast story:
  Basis    — N=100, GOE   (clear Wigner ridge, s=0 depleted)
  SK_Small — N=20,  GOE   (noisy, rough Wigner shape)
  SK_Med   — N=50,  GOE   (intermediate)
  SK_Pois  — N=100, Poisson (exponential peak at s=0; no repulsion)

Vertex colour 'WignerCol' FLOAT_COLOR POINT:
  Cobalt (0, 0.38, 0.74) → low density (s=0 void, far bulk edge)
  Amber  (1.0, 0.65, 0)  → high density (Wigner peak at s ≈ 0.9)
"""

import bpy
import numpy as np

# ─── PARAMETERS ────────────────────────────────────────────────────────────
N_SMALL  = 20      # GOE matrix size for SK_Small
N_MEDIUM = 50      # GOE matrix size for SK_Med
N_LARGE  = 100     # GOE matrix size for Basis

N_MAT    = 250     # matrices sampled per shape key
N_GRID   = 120     # grid resolution (both axes → 120×120 mesh)
SEED     = 42      # reproducibility

EIG_MIN, EIG_MAX = -2.3,  2.3   # eigenvalue axis (world x), metres
S_MIN,   S_MAX   =  0.0,  3.5   # unfolded spacing axis (world y)
BULK_CUT         =  1.90        # |λ| < BULK_CUT avoids Tracy–Widom edge

LOG_EPS      = 1.0    # ε in log(ε + count): prevents log(0)
MESH_SCALE   = 6.0    # world-space extent in metres (square floor)
HEIGHT_SCALE = 0.45   # maximum height in metres
OBJ_NAME     = "WignerGOE_Floor"

COBALT = (0.00, 0.38, 0.74, 1.0)
AMBER  = (1.00, 0.65, 0.00, 1.0)


# ─── PHYSICS FUNCTIONS ─────────────────────────────────────────────────────

def rho_sc(lam: np.ndarray) -> np.ndarray:
    """Wigner semicircle density: (1/2π)√(4−λ²) for |λ| ≤ 2, else 0.

    Why this shape? Free probability theory (Voiculescu) identifies the
    semicircle as the free analogue of the Gaussian distribution.  Under
    free convolution — the correct "addition" law for large random matrices —
    the semicircle is the unique attractor, precisely as the Gaussian is the
    attractor under ordinary convolution.
    """
    return np.sqrt(np.maximum(0.0, 4.0 - np.asarray(lam) ** 2)) / (2.0 * np.pi)


def sample_goe(n: int, rng: np.random.Generator) -> np.ndarray:
    """Return sorted eigenvalues of an N×N GOE matrix.

    Scaling convention: A_{ij} ~ N(0,1) iid; H = (A + Aᵀ)/√(2N).
    Off-diagonal entry variance = 1/N; diagonal variance = 2/N.
    This normalisation places the bulk spectrum in [-2, 2] as N→∞.
    np.linalg.eigh exploits symmetry (O(N³/3) vs O(N³)) and returns
    real-valued eigenvalues sorted in ascending order.
    """
    A = rng.standard_normal((n, n))
    H = (A + A.T) / np.sqrt(2.0 * n)
    return np.linalg.eigh(H)[0]


def sample_poisson(n: int, rng: np.random.Generator) -> np.ndarray:
    """Return N sorted uniform-random eigenvalues in [−2, 2].

    Uncorrelated levels model quantum-integrable systems (Berry–Tabor
    conjecture, 1977).  Spacing of i.i.d. uniform points follows P(s)=e^{-s}
    after unfolding with the constant density ρ = 1/4.
    """
    return np.sort(rng.uniform(-2.0, 2.0, n))


# ─── DENSITY COMPUTATION ───────────────────────────────────────────────────

def compute_density(
    n_size: int,
    n_mat: int,
    rng: np.random.Generator,
    poisson: bool = False,
) -> np.ndarray:
    """Sample matrices; bin (λᵢ, sᵢ) pairs into a N_GRID×N_GRID histogram.

    Unfolded spacing: sᵢ = (λᵢ₊₁ − λᵢ) × N × ρ_sc(midᵢ).
    Multiplying the raw spacing by the inverse local mean spacing makes the
    global mean of sᵢ equal to 1 everywhere in the bulk — the Wigner surmise
    then reads off a single universal P(s) independent of position or energy.

    Only bulk eigenvalues (|λ| < BULK_CUT) are included.  Near |λ|≈2, the
    density ρ_sc → 0 so the unfolded spacing → ∞ and the Tracy–Widom edge
    statistics differ from the Wigner surmise — they are excluded here to
    keep the histogram clean.

    Returns: (N_GRID, N_GRID) float array, log-scaled and normalised to [0,1].
    """
    xi = np.linspace(EIG_MIN, EIG_MAX, N_GRID + 1)   # bin edges, λ axis
    si = np.linspace(S_MIN,   S_MAX,   N_GRID + 1)   # bin edges, s axis

    counts = np.zeros((N_GRID, N_GRID), dtype=np.float64)

    for _ in range(n_mat):
        if poisson:
            evals     = sample_poisson(n_size, rng)
            rho_local = np.full(n_size - 1, 0.25)    # 1/4 for uniform [-2,2]
        else:
            evals     = sample_goe(n_size, rng)
            rho_local = np.maximum(
                rho_sc((evals[:-1] + evals[1:]) * 0.5), 1e-9
            )

        raw_d  = evals[1:] - evals[:-1]          # raw consecutive spacing
        s_unf  = raw_d * n_size * rho_local       # unfolded: mean ≈ 1 in bulk
        lam_m  = (evals[:-1] + evals[1:]) * 0.5  # midpoint eigenvalue

        bulk = np.abs(lam_m) < BULK_CUT
        lam_b, s_b = lam_m[bulk], s_unf[bulk]

        ix = np.searchsorted(xi, lam_b, side='right') - 1
        iy = np.searchsorted(si, s_b,   side='right') - 1
        ok = (ix >= 0) & (ix < N_GRID) & (iy >= 0) & (iy < N_GRID)
        np.add.at(counts, (ix[ok], iy[ok]), 1)

    h = np.log(LOG_EPS + counts)
    return h / h.max() if h.max() > 0.0 else h


# ─── MESH CONSTRUCTION ─────────────────────────────────────────────────────

def _make_verts(density: np.ndarray) -> np.ndarray:
    """Return (N_GRID², 3) vertex array for a given density field."""
    xs = np.linspace(-MESH_SCALE * 0.5, MESH_SCALE * 0.5, N_GRID)
    ys = np.linspace(-MESH_SCALE * 0.5, MESH_SCALE * 0.5, N_GRID)
    XX, YY = np.meshgrid(xs, ys, indexing='ij')
    ZZ = density * HEIGHT_SCALE
    return np.stack([XX.ravel(), YY.ravel(), ZZ.ravel()], axis=1)


def build_floor(density: np.ndarray) -> bpy.types.Object:
    """Create stage-floor mesh from the Basis density and link to the scene.

    Vertex index: i*N_GRID + j, where i = eigenvalue bin (outer), j = spacing bin.
    Face generation is vectorised via numpy broadcasting — avoids a Python
    loop over 14 161 quads, which would be ~5 seconds; numpy is ~0.01 seconds.
    """
    verts = _make_verts(density)

    # Vectorised quad face indices
    i = np.arange(N_GRID - 1)[:, None]
    j = np.arange(N_GRID - 1)[None, :]
    a = (i * N_GRID + j).ravel()
    b = ((i + 1) * N_GRID + j).ravel()
    c = ((i + 1) * N_GRID + (j + 1)).ravel()
    d = (i * N_GRID + (j + 1)).ravel()
    faces = np.stack([a, b, c, d], axis=1).tolist()

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    me.update()

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def apply_vertex_colour(ob: bpy.types.Object, density: np.ndarray) -> None:
    """Write Cobalt→Amber FLOAT_COLOR POINT attribute from the Basis density."""
    col = ob.data.attributes.new("WignerCol", 'FLOAT_COLOR', 'POINT')
    h   = density.ravel()
    rgba = np.zeros((N_GRID * N_GRID, 4))
    for ch, (c0, c1) in enumerate(zip(COBALT[:3], AMBER[:3])):
        rgba[:, ch] = c0 + h * (c1 - c0)
    rgba[:, 3] = 1.0
    col.data.foreach_set("color", rgba.ravel())


def add_shape_key(ob: bpy.types.Object, name: str, density: np.ndarray) -> None:
    """Append a shape key encoding a different N or symmetry class.

    foreach_set writes all vertex positions in one C-level call (~40× faster
    than iterating over sk.data[i].co in Python).
    """
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set('co', _make_verts(density).ravel())


def apply_material(ob: bpy.types.Object) -> None:
    """Emission material driven by the WignerCol vertex attribute."""
    mat = bpy.data.materials.new("WignerGOE_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emi  = nt.nodes.new('ShaderNodeEmission')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name  = "WignerCol"
    attr.attribute_type  = 'GEOMETRY'
    emi.inputs['Strength'].default_value = 1.8
    nt.links.new(attr.outputs['Color'],   emi.inputs['Color'])
    nt.links.new(emi.outputs['Emission'], out.inputs['Surface'])
    ob.data.materials.append(mat)
    mat.shadow_method = 'NONE'


# ─── MAIN ──────────────────────────────────────────────────────────────────

def main() -> None:
    import math

    for obj in list(bpy.data.objects):
        if OBJ_NAME in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)

    rng = np.random.default_rng(SEED)

    print("[wigner] Basis  N=100 GOE …")
    d_basis = compute_density(N_LARGE,  N_MAT, rng)
    print("[wigner] SK_Small N=20  GOE …")
    d_small = compute_density(N_SMALL,  N_MAT, rng)
    print("[wigner] SK_Med   N=50  GOE …")
    d_med   = compute_density(N_MEDIUM, N_MAT, rng)
    print("[wigner] SK_Pois  N=100 Poisson …")
    d_pois  = compute_density(N_LARGE,  N_MAT, rng, poisson=True)

    ob = build_floor(d_basis)
    apply_vertex_colour(ob, d_basis)

    ob.shape_key_add(name='Basis',    from_mix=False)
    add_shape_key(ob, 'SK_Small', d_small)
    add_shape_key(ob, 'SK_Med',   d_med)
    add_shape_key(ob, 'SK_Pois',  d_pois)

    apply_material(ob)

    ob["holoflow:facet"]    = True
    ob["holoflow:category"] = "stage-floor"
    ob["holoflow:topic"]    = "wigner-goe-random-matrix"

    ob.rotation_euler = (math.radians(-90), 0.0, 0.0)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(rotation=True)

    print(f"[wigner] {len(ob.data.vertices)} verts  "
          f"{len(ob.data.polygons)} quads  4 shape keys  Done.")


if __name__ == "__main__":
    main()
