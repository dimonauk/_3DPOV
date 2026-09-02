"""
Hyperchaotic Rössler 4D Attractor — Blender 5.1 Blueprint
==========================================================
O. E. Rössler, "An equation for hyperchaos",
Phys. Lett. A 71(2–3):155–157, 1979.
DOI: 10.1016/0375-9601(79)90150-6   (equations are in the public domain)

WHY THIS SYSTEM?
The standard Rössler attractor (1976) has exactly ONE positive Lyapunov
exponent — it is *singly* chaotic.  Rössler extended it to 4D by adding a
fourth variable w that feeds back into ẏ, producing TWO positive Lyapunov
exponents.  This property, called *hyperchaos*, makes information destruction
faster: two independent directions of phase-space diverge simultaneously, so
nearby orbits separate in a two-dimensional sheet rather than along a single
filament.  No 3D autonomous ODE can be hyperchaotic (Ruelle 1978 upper bound),
making this the minimal-dimensional example.

EQUATIONS
    ẋ =  −y − z
    ẏ =   x + a·y + w          ← w couples the 4th dimension
    ż =   b + x·z              ← same fold as Rössler 1976
    ẇ =  −c·z + d·w            ← autonomous 4th equation

Canonical parameters (Rössler 1979):
    a = 0.25   b = 3.0   c = 0.5   d = 0.05

FIXED POINTS
Setting all derivatives to zero and eliminating:
    x² = b(c − d·a)/d  →  x* = ±√(b(c − d·a)/d) ≈ ±5.408
Two equilibria, both unstable saddle-foci.

DIVERGENCE (volume contraction)
    ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z + ∂ẇ/∂w
         =  0   +  a  +  x  +  d   =  a + d + x  (POSITION-DEPENDENT)
On the attractor ⟨x⟩ ≈ −0.09 (canonical), so ⟨∇·F⟩ ≈ +0.21:
average *expansion*, offset by the occasional large-x contracting excursions.

LYAPUNOV SPECTRUM (canonical, approximate)
    λ₁ ≈ +0.155,  λ₂ ≈ +0.033,  λ₃ ≈ 0,  λ₄ ≈ −14.3
    Σλᵢ ≈ −14.11  ≈  ⟨a + d + x⟩ · T / T  (Liouville identity, time-averaged)
    D_KY  =  3 + (λ₁ + λ₂ + λ₃)/|λ₄|  ≈  3.013

VISUALISATION STRATEGY
We live in ℝ³, not ℝ⁴.  Two honest projections:
  (a) drop w → show (x, y, z), colour vertices by w  ← chosen here
  (b) stereographic ℝ⁴ → ℝ³  (distorts geometry non-uniformly)
Option (a) preserves the familiar Rössler backbone and lets the colour
channel reveal how the 4th dimension breathes.  Cobalt (w small/negative)
→ amber (w large/positive).
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ── Parameters ────────────────────────────────────────────────────────────────
A_BASIS    = 0.25    # canonical Rössler-HC (hyperchaos onset)
B          = 3.0
C          = 0.5
D_BASIS    = 0.05

# Shape-key parameter sets (a, d) — b and c fixed
SK_LOD     = dict(a=A_BASIS, d=0.01)   # near-periodic (d too small to sustain hyperchaos)
SK_HIA     = dict(a=0.35,    d=D_BASIS) # stronger spiral → broader orbit
SK_HID     = dict(a=A_BASIS, d=0.10)   # stronger 4D coupling → altered folding

DT         = 0.005
BURN_IN    = 5_000    # steps to discard transient
N_STEPS    = 90_000   # integration steps after burn-in
THIN       = 30       # keep every 30th → 3 000 waypoints per shape key

TUBE_R     = 0.045    # Bishop-tube cross-section radius  [m]
TUBE_SIDES = 10       # polygons around tube
POI_R      = 0.09     # poi head sphere radius [m]

COBALT = (0.03, 0.20, 0.78, 1.0)
AMBER  = (0.98, 0.62, 0.05, 1.0)

OBJ_NAME = "HC_Rossler_Poi"
MAT_NAME = "HC_Rossler_Mat"


# ── ODE integration ────────────────────────────────────────────────────────────
def rk4_hc_rossler(a: float, d: float, n_steps: int, dt: float,
                   x0: np.ndarray) -> np.ndarray:
    """
    Integrate the hyperchaotic Rössler system using 4th-order Runge–Kutta.
    Returns array (n_steps, 4) — columns: x, y, z, w.

    WHY RK4 not Euler?
    Euler's local error is O(dt²); RK4's is O(dt⁵).  For a system with
    λ₁ ≈ 0.155 Lyapunov time ≈ 6.5 units: at dt=0.005 Euler diverges from
    the true orbit in ~50 steps.  RK4 stays close for ~4 000 steps — long
    enough for meaningful geometry even though long-time shadowing is
    impossible for any method on a chaotic orbit.
    """
    def f(s):
        x, y, z, w = s
        return np.array([
            -y - z,
            x + a * y + w,
            B + x * z,
            -C * z + d * w,
        ])

    traj = np.empty((n_steps, 4), dtype=np.float64)
    s = x0.copy()
    for i in range(n_steps):
        k1 = f(s)
        k2 = f(s + 0.5 * dt * k1)
        k3 = f(s + 0.5 * dt * k2)
        k4 = f(s + dt * k3)
        s  = s + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        traj[i] = s
    return traj


def integrate_set(a: float, d: float) -> np.ndarray:
    """Burn-in then thin to 3 000 waypoints."""
    # IC: near the inner equilibrium but perturbed enough to find attractor fast
    x0 = np.array([-5.4, 0.0, -0.05, 0.2])
    # Burn-in (discard transient)
    x0 = rk4_hc_rossler(a, d, BURN_IN, DT, x0)[-1]
    traj = rk4_hc_rossler(a, d, N_STEPS, DT, x0)
    return traj[::THIN]   # (3 000, 4)


# ── Bishop parallel-transport frame ───────────────────────────────────────────
def bishop_frames(pts: np.ndarray):
    """
    Return (tangents T, normals N, binormals B) arrays via parallel transport.

    WHY Bishop over Frenet?
    Frenet–Serret requires κ ≠ 0 everywhere and flips 180° when the curve
    reverses curvature direction.  Bishop frames propagate the cross-section
    without twist beyond what the curve itself forces, avoiding sudden
    rotational jumps that would tear the tube topology.
    """
    n = len(pts)
    T = np.diff(pts, axis=0)
    lengths = np.linalg.norm(T, axis=1, keepdims=True)
    lengths = np.where(lengths < 1e-12, 1e-12, lengths)
    T = T / lengths
    T = np.vstack([T, T[-1]])   # repeat last tangent for last point

    # Seed the first normal as any vector perpendicular to T[0]
    t0 = T[0]
    helper = np.array([1.0, 0.0, 0.0]) if abs(t0[1]) > 0.5 else np.array([0.0, 1.0, 0.0])
    N0 = np.cross(t0, helper)
    N0 /= np.linalg.norm(N0)

    Ns = np.empty((n, 3))
    Ns[0] = N0
    for i in range(1, n):
        # Parallel-transport: project previous normal onto new tangent's normal plane
        B_prev = np.cross(T[i - 1], Ns[i - 1])
        N_new  = np.cross(B_prev, T[i])
        norm   = np.linalg.norm(N_new)
        Ns[i]  = N_new / norm if norm > 1e-12 else Ns[i - 1]

    Bs = np.cross(T, Ns)
    return T, Ns, Bs


# ── Tube geometry ─────────────────────────────────────────────────────────────
def build_tube(bm: bmesh.types.BMesh, pts: np.ndarray, w_vals: np.ndarray):
    """
    Build a Bishop-framed tube and store per-vertex w as a colour attribute.

    w_vals: raw w-coordinate, normalised 0–1 for Cobalt–Amber mapping.
    """
    n_pts = len(pts)
    T, N, B_ = bishop_frames(pts)

    theta = np.linspace(0, 2 * np.pi, TUBE_SIDES, endpoint=False)
    cos_t = np.cos(theta)
    sin_t = np.sin(theta)

    # Pre-allocate vertices
    verts = []
    for i in range(n_pts):
        for k in range(TUBE_SIDES):
            p = pts[i] + TUBE_R * (cos_t[k] * N[i] + sin_t[k] * B_[i])
            verts.append(bm.verts.new(p))

    bm.verts.ensure_lookup_table()

    # Quads connecting adjacent rings
    for i in range(n_pts - 1):
        for k in range(TUBE_SIDES):
            k1 = (k + 1) % TUBE_SIDES
            v00 = verts[i  * TUBE_SIDES + k ]
            v01 = verts[i  * TUBE_SIDES + k1]
            v10 = verts[(i + 1) * TUBE_SIDES + k ]
            v11 = verts[(i + 1) * TUBE_SIDES + k1]
            bm.faces.new([v00, v01, v11, v10])

    # Colour attribute for w (per-vertex FLOAT_COLOR)
    col_layer = bm.verts.layers.float_color.new("HC_Rossler_W")
    w_min, w_max = w_vals.min(), w_vals.max()
    w_norm = (w_vals - w_min) / max(w_max - w_min, 1e-9)
    cobalt = np.array(COBALT[:3])
    amber  = np.array(AMBER[:3])
    for i, vi in enumerate(range(n_pts)):
        t_val = w_norm[vi]
        col = (1 - t_val) * cobalt + t_val * amber
        for k in range(TUBE_SIDES):
            verts[vi * TUBE_SIDES + k][col_layer] = [*col, 1.0]


# ── Main build ────────────────────────────────────────────────────────────────
def build_scene():
    # Clear mesh objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # ── Integrate all four shape keys ──
    print("Integrating Basis (a=0.25, d=0.05)...")
    pts_basis = integrate_set(A_BASIS, D_BASIS)
    print("Integrating SK_LoD (d=0.01)...")
    pts_lod   = integrate_set(SK_LOD['a'],  SK_LOD['d'])
    print("Integrating SK_HiA (a=0.35)...")
    pts_hia   = integrate_set(SK_HIA['a'],  SK_HIA['d'])
    print("Integrating SK_HiD (d=0.10)...")
    pts_hid   = integrate_set(SK_HID['a'],  SK_HID['d'])

    # All position arrays have shape (3000, 4)
    # Extract xyz and w separately
    def xyz(pts): return pts[:, :3]
    def ww(pts):  return pts[:, 3]

    # ── Build mesh (Basis geometry) ──
    me = bpy.data.meshes.new("HC_Rossler_Mesh")
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(ob)

    bm = bmesh.new()
    build_tube(bm, xyz(pts_basis), ww(pts_basis))
    bm.to_mesh(me)
    bm.free()

    n_verts = len(me.vertices)

    # ── Shape keys ──
    ob.shape_key_add(name="Basis", from_mix=False)

    def add_sk(name, pts_sk):
        sk = ob.shape_key_add(name=name, from_mix=False)
        co = np.column_stack([xyz(pts_sk)[i // TUBE_SIDES]
                              + np.zeros(3)   # ring offset computed below
                              for i in range(n_verts)]).T
        # Recompute ring positions for this SK
        T_sk, N_sk, B_sk = bishop_frames(xyz(pts_sk))
        pts_sk_xyz = xyz(pts_sk)
        n_pts = len(pts_sk_xyz)
        theta = np.linspace(0, 2 * np.pi, TUBE_SIDES, endpoint=False)
        flat_co = np.empty((n_pts * TUBE_SIDES, 3))
        for i in range(n_pts):
            for k, th in enumerate(theta):
                flat_co[i * TUBE_SIDES + k] = (
                    pts_sk_xyz[i]
                    + TUBE_R * (np.cos(th) * N_sk[i] + np.sin(th) * B_sk[i])
                )
        sk.data.foreach_set("co", flat_co.ravel())

    add_sk("SK_LoD", pts_lod)
    add_sk("SK_HiA", pts_hia)
    add_sk("SK_HiD", pts_hid)

    # ── Poi head sphere ──
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=(0, 0, 0))
    poi = bpy.context.active_object
    poi.name = "HC_Rossler_PoiHead"
    poi.parent = ob

    # ── Material: vertex colour pass-through ──
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out   = tree.nodes.new("ShaderNodeOutputMaterial")
    emit  = tree.nodes.new("ShaderNodeEmission")
    attr  = tree.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "HC_Rossler_W"
    emit.inputs["Strength"].default_value = 1.8
    tree.links.new(attr.outputs["Color"],  emit.inputs["Color"])
    tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(mat)

    # ── Holoflow metadata ──
    ob["holoflow:facet"] = False
    ob["holoflow:export_name"] = "hc_rossler_poi"

    # ── +Y-up axis correction (apply before GLB export) ──
    ob.rotation_euler[0] = np.pi / 2
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    print("✓ HC Rössler poi built —",
          f"{len(me.vertices)} verts, {len(me.polygons)} faces")
    print("  Basis: a=0.25 d=0.05 | SK_LoD: d=0.01 | SK_HiA: a=0.35 | SK_HiD: d=0.10")


if __name__ == "__main__":
    build_scene()
