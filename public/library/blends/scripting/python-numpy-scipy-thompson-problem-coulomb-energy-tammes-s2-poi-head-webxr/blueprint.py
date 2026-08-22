"""
Thompson's Problem — Coulomb Energy Minimisation on S²  (Blender 5.1)
======================================================================
The Thomson problem asks: how should N point charges be arranged on a unit
sphere to minimise the total electrostatic potential energy?

    E = Σᵢ<ⱼ  1 / |pᵢ − pⱼ|

For small N the answer is exact and beautiful:
  N=4  → regular tetrahedron       N=6  → regular octahedron
  N=8  → square antiprism          N=12 → regular icosahedron
  N=20 → nearly dodecahedral       N=60 → truncated icosahedron (C₆₀ buckyball)

This blueprint minimises E for N=32 charges using Riemannian projected gradient
descent on S², initialised from a Fibonacci (golden-angle) sphere lattice — the
best non-iterative near-uniform placement on S². The descent trajectory is stored
as three Blender shape keys so the morph from disordered to crystalline can be
animated or scrubbed interactively. The convex hull of the optimal configuration
produces a faceted poi-head mesh with vertex colours encoding per-vertex energy.
Exported as Draco-6 GLB for WebXR.

Algorithm (projected gradient descent on S²):
  ∂E/∂pᵢ = Σⱼ≠ᵢ  −(pᵢ − pⱼ) / |pᵢ − pⱼ|³          (Euclidean gradient)
  Riemannian gradient: g_t = ∂E/∂p − (∂E/∂p · p̂) p̂   (remove radial component)
  Update:  pᵢ ← pᵢ − α g_t,   then   pᵢ ← pᵢ / |pᵢ|  (retract to sphere)

Outside sources:
  Thomson, J.J. (1904). Phil. Mag. 7, 237. — PD mathematical content.
  Sloane, N.J.A. et al. "Tammes / sphere packings" neilsloane.com/packings/ — CC0 data.
  NumPy — BSD-3-Clause  https://numpy.org
  SciPy — BSD-3-Clause  https://scipy.org  (ConvexHull from scipy.spatial)
"""

import bpy
import bmesh
import numpy as np
from scipy.spatial import ConvexHull

# ── Parameters ─────────────────────────────────────────────────────────────────
N            = 32       # number of charges (try 12=icosahedron, 42=football)
N_STEPS_FAST = 1200     # gradient descent steps stored as mid-energy shape key
N_STEPS_FULL = 6000     # total steps for the fully converged minimum
LR           = 0.025    # initial learning rate
LR_DECAY     = 0.9994   # per-step exponential decay (halves every ≈1155 steps)
SEED         = 13       # RNG seed for reproducible random initial state
POI_RADIUS   = 0.075    # metres — poi head bounding sphere
OBJ_NAME     = "hf_thompson_poi"
GLB_PATH     = "//hf_thompson_poi.glb"

# ── Sphere initialisation ───────────────────────────────────────────────────────
def fibonacci_sphere(n: int) -> np.ndarray:
    """Quasi-uniform placement via golden-angle longitude + area-uniform latitude.

    Spacing points in cos(θ) — not θ — gives equal-area latitude strips.
    The irrational golden angle φ = 2π/Φ² ≈ 137.507° guarantees that no two
    meridians align for any finite N, avoiding spoke-pattern clustering that
    ruins gradient descent convergence from random initialisations.
    This is Vogel's method extended to 3D, also called the Tammes grid."""
    i    = np.arange(n, dtype=np.float64)
    cosT = 1.0 - (2.0 * i + 1.0) / n          # area-uniform cos(θ) spacing
    sinT = np.sqrt(np.clip(1.0 - cosT**2, 0, 1))
    phi  = np.pi * (1.0 + np.sqrt(5.0)) * i   # golden angle accumulation
    return np.column_stack([sinT * np.cos(phi), sinT * np.sin(phi), cosT])


def random_sphere(n: int, rng: np.random.Generator) -> np.ndarray:
    """Uniform random points on S² via Muller normalised Gaussian."""
    pts = rng.standard_normal((n, 3))
    pts /= np.linalg.norm(pts, axis=1, keepdims=True)
    return pts


# ── Energy computation ─────────────────────────────────────────────────────────
def coulomb_energy(pts: np.ndarray) -> float:
    """Total Coulomb potential E = Σᵢ<ⱼ 1/|pᵢ−pⱼ|."""
    diff = pts[:, None, :] - pts[None, :, :]
    r    = np.linalg.norm(diff, axis=2)
    r[np.arange(len(pts)), np.arange(len(pts))] = np.inf   # mask self-pairs
    return 0.5 * np.nansum(1.0 / r)   # 0.5 because pair (i,j) appears twice


def per_vertex_energy(pts: np.ndarray) -> np.ndarray:
    """Per-vertex energy contribution Vᵢ = Σⱼ≠ᵢ 1/|pᵢ−pⱼ| (unnormalised)."""
    diff = pts[:, None, :] - pts[None, :, :]
    r    = np.linalg.norm(diff, axis=2)
    r[np.arange(len(pts)), np.arange(len(pts))] = np.inf
    return np.sum(1.0 / r, axis=1)


# ── Riemannian gradient descent on S² ─────────────────────────────────────────
def gradient_descent(pts: np.ndarray, n_steps: int,
                     snapshot_at: int | None = None) -> tuple:
    """Project Euclidean gradient onto the tangent plane at each point, step,
    then retract back to the sphere by normalisation.

    Returns (final_pts, snapshot) where snapshot is pts at step `snapshot_at`
    if provided, otherwise None."""
    pts      = pts.copy()
    snapshot = None
    n        = len(pts)
    idx      = np.arange(n)
    for step in range(n_steps):
        if snapshot_at is not None and step == snapshot_at:
            snapshot = pts.copy()
        alpha = LR * (LR_DECAY ** step)
        diff  = pts[:, None, :] - pts[None, :, :]    # (N,N,3): pᵢ−pⱼ
        r     = np.linalg.norm(diff, axis=2)          # (N,N) distances
        r[idx, idx] = np.inf                           # exclude self-pair
        inv_r3 = 1.0 / r**3                            # (N,N)
        # Euclidean gradient ∂E/∂pᵢ = −Σⱼ (pᵢ−pⱼ)/rᵢⱼ³
        # The sign: increasing rᵢⱼ lowers 1/rᵢⱼ, so gradient points toward pⱼ
        eucl_grad = -np.sum(diff * inv_r3[:, :, None], axis=1)   # (N,3)
        # Riemannian gradient: subtract the radial (normal-to-sphere) component
        radial    = np.sum(eucl_grad * pts, axis=1, keepdims=True)
        riem_grad = eucl_grad - radial * pts           # (N,3), tangential
        # Gradient descent step + retraction (normalise back to unit sphere)
        pts = pts - alpha * riem_grad
        pts /= np.linalg.norm(pts, axis=1, keepdims=True)
    return pts, snapshot


# ── Mesh construction ──────────────────────────────────────────────────────────
def build_scene(opt_pts: np.ndarray, mid_pts: np.ndarray,
                rand_pts: np.ndarray) -> bpy.types.Object:
    """Build the convex hull of the optimal configuration, add shape keys for
    the mid-energy (partially converged) and random initial states."""
    opt  = opt_pts  * POI_RADIUS
    mid  = mid_pts  * POI_RADIUS
    rand = rand_pts * POI_RADIUS

    # Convex hull of optimal config defines the face topology
    hull = ConvexHull(opt)

    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()
    verts = [bm.verts.new(opt[vi]) for vi in range(N)]
    bm.verts.index_update()
    for simplex in hull.simplices:
        try:
            bm.faces.new([verts[i] for i in simplex])
        except ValueError:
            pass   # skip any accidental duplicate faces
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)

    # Shape keys — basis = optimal; morph to mid-energy, then to random
    ob.shape_key_add(name="Optimal",    from_mix=False)
    sk_mid  = ob.shape_key_add(name="Mid_Energy",  from_mix=False)
    sk_rand = ob.shape_key_add(name="Random",      from_mix=False)
    for vi in range(N):
        sk_mid.data[vi].co  = mid[vi]
        sk_rand.data[vi].co = rand[vi]
    ob.data.shape_keys.use_relative = True

    # Per-vertex energy as FLOAT_COLOR attribute
    e_vals = per_vertex_energy(opt_pts)
    e_norm = (e_vals - e_vals.min()) / (e_vals.ptp() + 1e-9)
    attr   = me.attributes.new("energy_col", "FLOAT_COLOR", "POINT")
    for vi, val in enumerate(e_norm):
        # cyan (evenly spaced) → magenta (crowded near-neighbours)
        attr.data[vi].color = (val, 1.0 - val, 1.0, 1.0)

    # Material — Principled BSDF wired to vertex colour
    mat  = bpy.data.materials.new(OBJ_NAME + "_mat")
    mat.use_nodes = True
    nt   = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    vcol = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "energy_col"
    bsdf.inputs["Roughness"].default_value = 0.25
    bsdf.inputs["Metallic"].default_value  = 0.75
    nt.links.new(vcol.outputs["Color"],  bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],   out.inputs["Surface"])
    me.materials.append(mat)

    # Camera + key light
    bpy.ops.object.camera_add(location=(0, -0.32, 0.02))
    bpy.context.object.rotation_euler = (1.5708, 0, 0)
    bpy.context.scene.camera = bpy.context.object
    bpy.ops.object.light_add(type="SUN", location=(1.2, -1.2, 2.0))
    bpy.context.object.data.energy = 4.0

    return ob


# ── GLB export ─────────────────────────────────────────────────────────────────
def export_glb(ob: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath    = bpy.path.abspath(GLB_PATH),
        use_selection                       = True,
        export_draco_mesh_compression_enable= True,
        export_draco_mesh_compression_level = 6,
        export_image_format                 = "WEBP",
        export_materials                    = "EXPORT",
        export_apply                        = True,
        export_morph                        = True,
    )
    print(f"[thompson] GLB → {GLB_PATH}")


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    rng      = np.random.default_rng(SEED)
    rand_pts = random_sphere(N, rng)
    fib_pts  = fibonacci_sphere(N)

    print(f"[thompson] N={N} on S²")
    print(f"[thompson] E(random)    = {coulomb_energy(rand_pts):.4f}")
    print(f"[thompson] E(fibonacci) = {coulomb_energy(fib_pts):.4f}")

    # Run optimisation from Fibonacci start; snapshot mid-way
    opt_pts, mid_pts = gradient_descent(fib_pts, N_STEPS_FULL,
                                        snapshot_at=N_STEPS_FAST)
    print(f"[thompson] E(mid @{N_STEPS_FAST})  = {coulomb_energy(mid_pts):.4f}")
    print(f"[thompson] E(optimal)   = {coulomb_energy(opt_pts):.6f}")

    ob = build_scene(opt_pts, mid_pts, rand_pts)
    export_glb(ob)
    print(f"[thompson] Done — poi head hf_thompson_poi.glb written.")


main()
