"""
Lorenz-96 Atmospheric Ring Model — N-Variable Chaotic ODE & Lyapunov Spectrum
Blender 5.1  |  bpy direct-data API  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Edward Lorenz designed this system in 1996 (published 1998 with Kerry Emanuel)
as the simplest N-dimensional ODE that reproduces key properties of atmospheric
turbulence: advection, damping, and external forcing on a latitude circle.

    dXᵢ/dt = (Xᵢ₊₁ − Xᵢ₋₂)·Xᵢ₋₁ − Xᵢ + F      i = 0 … N−1  (indices mod N)

The three terms have physical meaning:
  • quadratic  (Xᵢ₊₁ − Xᵢ₋₂)·Xᵢ₋₁  — westward energy advection around ring
  • linear     −Xᵢ                   — mechanical damping / internal dissipation
  • constant   +F                    — uniform external forcing (solar heating)

Conservation law: d/dt Σ Xᵢ² is bounded only by F; no exact first integral
exists for F > 0, so the system is dissipative with a compact attractor.

Dynamical phases (N = 8):
  F < 1    : X_i → F (fixed point, all equal)
  F ≈ 1    : pitchfork bifurcation → two fixed points
  1 < F < 5.76 : periodic / quasi-periodic (limit cycle)
  F ≈ 5.76 : first Hopf to chaos
  F = 8    : two positive Lyapunov exponents; canonical benchmark for EnKF
  F = 16   : four positive exponents; sub-grid scale turbulence regime

For visualisation the 3-D projection onto (X₀, X₁, X₂) yields a compact
strange attractor whose orbit is rendered as a Bishop parallel-transport tube.
Four shape keys vary the forcing to sweep from near-Hopf regularity through
the two chaotic regimes, giving a clear visual story of increasing disorder.
"""

import bpy, bmesh, numpy as np
from mathutils import Vector

# ── PARAMETERS ───────────────────────────────────────────────────────────────
N_VARS    = 8        # variables on the atmospheric ring (8 canonical; must ≥ 4)
DT        = 0.005    # RK4 time step; L96 correlation time ~0.1 → 20 steps/τ
N_WARMUP  = 4000     # steps discarded (transient to attractor)
N_STEPS   = 50000    # steps integrated after warmup
N_SKIP    = 16       # subsample → ≈ 3125 tube waypoints (memory + triangle count)

TUBE_R    = 0.016    # tube cross-section radius in metres
N_SIDES   = 10       # polygon cross-section sides (10-gon looks smooth but fast)
POI_R     = 0.082    # target poi-head sphere radius (m); attractor scaled to fit

OBJ_NAME  = "Lorenz96_Poi"

COBALT = (0.03, 0.15, 0.58, 1.0)   # low-speed vertex colour
AMBER  = (1.00, 0.65, 0.00, 1.0)   # high-speed vertex colour

# Forcing values for the four shape keys
F_VALUES = {
    "Basis":     8.00,   # canonical chaos — 2 positive Lyapunov exponents
    "SK_Hopf":   5.00,   # near-Hopf onset — organised, quasi-periodic loops
    "SK_Onset":  5.76,   # exact bifurcation threshold (Ott et al. 2003)
    "SK_Strong": 16.00,  # strong turbulence — dense, rapidly entangled orbit
}


# ── LORENZ-96 ODE ─────────────────────────────────────────────────────────────
def l96_deriv(X: np.ndarray, F: float) -> np.ndarray:
    """Vectorised L96 right-hand side.

    np.roll shifts the array — roll(X, -1) gives X[i+1], roll(X, 2) gives X[i-2].
    Why roll(X, 2) for i-2?  Positive roll shifts right so index i moves to i+2,
    which means position i now holds what was at i-2.
    """
    Xm2 = np.roll(X, 2)   # X[i-2]
    Xm1 = np.roll(X, 1)   # X[i-1]
    Xp1 = np.roll(X, -1)  # X[i+1]
    return (Xp1 - Xm2) * Xm1 - X + F


def integrate(F: float, seed: int = 0) -> np.ndarray:
    """RK4 integration; returns (M, 3) array of (X0, X1, X2) waypoints.

    Initial condition: X = F everywhere except one site perturbed by 0.01.
    This breaks the ring symmetry so the orbit leaves the fixed point and
    explores the attractor rather than collapsing to a uniform state.
    """
    rng = np.random.default_rng(seed)
    X = np.full(N_VARS, F, dtype=float)
    X[0] += 0.01 * rng.standard_normal()

    # warmup — discard transient
    for _ in range(N_WARMUP):
        k1 = l96_deriv(X, F)
        k2 = l96_deriv(X + DT/2*k1, F)
        k3 = l96_deriv(X + DT/2*k2, F)
        k4 = l96_deriv(X + DT*k3,   F)
        X += DT/6*(k1 + 2*k2 + 2*k3 + k4)

    pts = []
    for step in range(N_STEPS):
        k1 = l96_deriv(X, F)
        k2 = l96_deriv(X + DT/2*k1, F)
        k3 = l96_deriv(X + DT/2*k2, F)
        k4 = l96_deriv(X + DT*k3,   F)
        X += DT/6*(k1 + 2*k2 + 2*k3 + k4)
        if step % N_SKIP == 0:
            pts.append(X[:3].copy())

    return np.array(pts)


# ── BISHOP PARALLEL TRANSPORT ─────────────────────────────────────────────────
def bishop_frames(pts: np.ndarray):
    """Minimal-rotation (Bishop) frame along the tube centreline.

    Why Bishop over Frenet?  The Frenet frame is undefined at inflection points
    where curvature vanishes; Bishop propagates the normal by the smallest
    rotation that keeps it perpendicular to the tangent, avoiding the torsion
    singularity entirely.  Result: smooth tube with no sudden twists.
    """
    n = len(pts)
    T = np.zeros((n, 3))
    for i in range(n - 1):
        d = pts[i+1] - pts[i]
        nd = np.linalg.norm(d)
        T[i] = d / nd if nd > 1e-12 else T[i-1]
    T[-1] = T[-2]

    # seed the first normal by finding a vector not parallel to T[0]
    ref = np.array([0., 0., 1.])
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([1., 0., 0.])
    N0 = np.cross(T[0], ref)
    N0 /= np.linalg.norm(N0)

    normals = np.zeros((n, 3))
    normals[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        s = np.linalg.norm(axis)
        if s < 1e-12:
            normals[i] = normals[i-1]
        else:
            axis /= s
            angle = np.arctan2(s, np.dot(T[i-1], T[i]))
            c, sc = np.cos(angle), np.sin(angle)
            normals[i] = (c * normals[i-1]
                          + sc * np.cross(axis, normals[i-1])
                          + (1-c) * np.dot(axis, normals[i-1]) * axis)
    binormals = np.cross(T, normals)
    return T, normals, binormals


# ── TUBE GEOMETRY ─────────────────────────────────────────────────────────────
def make_tube(pts: np.ndarray, T, N, B) -> tuple:
    """Return (verts, faces) for an open N_SIDES-polygon tube along pts."""
    angles = np.linspace(0, 2*np.pi, N_SIDES, endpoint=False)
    cos_a, sin_a = np.cos(angles), np.sin(angles)

    verts = []
    for i, p in enumerate(pts):
        for a, (ca, sa) in enumerate(zip(cos_a, sin_a)):
            v = p + TUBE_R * (ca * N[i] + sa * B[i])
            verts.append(v.tolist())

    faces = []
    n_pts = len(pts)
    for i in range(n_pts - 1):
        for j in range(N_SIDES):
            j_next = (j + 1) % N_SIDES
            a = i * N_SIDES + j
            b = i * N_SIDES + j_next
            c = (i+1) * N_SIDES + j_next
            d = (i+1) * N_SIDES + j
            faces.append((a, b, c, d))
    return verts, faces


# ── SCALE TO POI SPHERE ───────────────────────────────────────────────────────
def scale_pts(pts: np.ndarray) -> np.ndarray:
    """Centre and uniformly scale trajectory to fit inside POI_R sphere."""
    centre = pts.mean(axis=0)
    pts = pts - centre
    r_max = np.max(np.linalg.norm(pts, axis=1))
    return pts * (POI_R / r_max)


# ── VERTEX COLOUR ─────────────────────────────────────────────────────────────
def speed_colours(pts: np.ndarray) -> list:
    """Per-vertex speed colour (cobalt → amber) based on trajectory velocity."""
    speeds = np.linalg.norm(np.diff(pts, axis=0, prepend=pts[:1]), axis=1)
    v_min, v_max = speeds.min(), speeds.max()
    t = (speeds - v_min) / max(v_max - v_min, 1e-12)
    colours = []
    for i, ti in enumerate(t):
        c = tuple(COBALT[k] * (1-ti) + AMBER[k] * ti for k in range(4))
        colours.extend([c] * N_SIDES)
    return colours


# ── BUILD MESH ────────────────────────────────────────────────────────────────
def build_mesh(pts_dict: dict) -> None:
    """Build the base mesh from Basis coordinates, apply shape keys, vertex colour."""
    basis_name = "Basis"
    pts_b = scale_pts(integrate(F_VALUES[basis_name]))
    T, N, B = bishop_frames(pts_b)
    verts, faces = make_tube(pts_b, T, N, B)

    mesh = bpy.data.meshes.new(OBJ_NAME)
    mesh.from_pydata([Vector(v) for v in verts], [], faces)
    mesh.validate()

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # vertex colour ─────────────────────────────────────────────────────────
    vcol = mesh.color_attributes.new(name="Lorenz96_V", type='FLOAT_COLOR',
                                     domain='POINT')
    colours = speed_colours(pts_b)
    for i, c in enumerate(colours):
        vcol.data[i].color = c

    # shape keys ────────────────────────────────────────────────────────────
    obj.shape_key_add(name=basis_name, from_mix=False)

    for sk_name, F in F_VALUES.items():
        if sk_name == basis_name:
            continue
        pts_sk = scale_pts(integrate(F))
        T_sk, N_sk, B_sk = bishop_frames(pts_sk)
        verts_sk, _ = make_tube(pts_sk, T_sk, N_sk, B_sk)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for i, v in enumerate(verts_sk):
            sk.data[i].co = Vector(v)

    # material ──────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new("L96_Cobalt")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = COBALT
    bsdf.inputs["Roughness"].default_value = 0.4
    bsdf.inputs["Metallic"].default_value = 0.25
    obj.data.materials.append(mat)

    # holoflow metadata ─────────────────────────────────────────────────────
    obj["holoflow:category"]    = "poi-head"
    obj["holoflow:facet"]       = True
    obj["holoflow:export_name"] = "lorenz96_poi"
    obj["holoflow:space"]       = "Lorenz-96 N=8"

    print(f"[L96] Mesh built — {len(verts)} verts, {len(faces)} faces")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
for ob in list(bpy.data.objects):
    if ob.name.startswith(OBJ_NAME):
        bpy.data.objects.remove(ob, do_unlink=True)

build_mesh({})
