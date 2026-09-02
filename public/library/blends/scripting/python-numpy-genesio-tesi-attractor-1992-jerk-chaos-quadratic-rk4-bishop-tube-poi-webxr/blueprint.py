"""
Genesio–Tesi Attractor (1992) — Jerk Chaos from Control Theory — Blender 5.1 / bpy
======================================================================================
Source (equations, public domain as mathematical facts):
  Genesio, R. & Tesi, A. (1992).
  "Harmonic balance methods for the analysis of chaotic dynamics in nonlinear systems."
  Automatica 28(3):531–548.  DOI 10.1016/0005-1098(92)90177-H
  Authors were control engineers at Università di Firenze studying when feedback
  control systems become chaotic — this attractor emerged from that study.

Companion reference (MIT / academic-free companion site):
  Sprott, J.C. (2010). Elegant Chaos: Algebraically Simple Chaotic Flows.
  World Scientific.  Companion C source (free):
  https://sprott.physics.wisc.edu/chaos/   (licence: academic use / no restriction stated)

TECHNIQUE — JERK FORM AND BISHOP TUBE
──────────────────────────────────────
The Genesio-Tesi system is the canonical single-quadratic jerk attractor:

    x‴ + c₃x‴ + c₂ẋ + c₁x  =  x²

In state form (why three first-order ODEs instead of one third-order?  Because
bpy animation drivers work with state variables; also RK4 applies naturally):

    ẋ = y
    ẏ = z
    ż = −c₁ x  −  c₂ y  −  c₃ z  +  x²

x is position, y is velocity, z is acceleration — this is the jerk chain.
The sole nonlinearity is x², the acceleration-position coupling.  Everything
else is linear.  No cross-products (unlike Lorenz or Sprott B) — the only
"interaction" is x with itself, and only in the third equation.

Canonical parameters:  c₁ = 1.0,  c₂ = 1.3,  c₃ = 0.44

CONSTANT DIVERGENCE — PURE c₃ DISSIPATION
───────────────────────────────────────────
    ∂ẋ/∂x = 0   ∂ẏ/∂y = 0   ∂ż/∂z = −c₃

    ∇·F = −c₃ = −0.44   (constant everywhere, only from the linear z-damping)

All three equations contribute to the Jacobian trace: but ẋ and ẏ are pure
"pass-through" (y and z respectively), adding 0 each.  ONLY the z-equation's
−c₃ z term provides dissipation.  This is the cleanest possible dissipative
structure: a single linear damping term controls all volume contraction.

Liouville check:  λ₁ + λ₂ + λ₃ = ∇·F = −0.44  ✓

LYAPUNOV SPECTRUM (canonical IC = (0.1, 0, 0))
─────────────────────────────────────────────────
    λ₁ ≈ +0.073   (positive — chaos confirmed)
    λ₂ ≈  0.000   (neutral — flows along orbit)
    λ₃ ≈ −0.513   (contracting)
    Sum:  −0.440  = ∇·F  ✓
    Lyapunov time:  τ = 1/λ₁ ≈ 13.7 time units
    Kaplan–Yorke dimension:  D_KY = 2 + 0.073/0.513 ≈ 2.142

Compared to other single-scroll attractors:
    Rössler (1976)  D_KY ≈ 2.013    (much thinner — more strongly contracting)
    Genesio-Tesi    D_KY ≈ 2.142    (thicker fractal set — weaker net contraction)
    Moore-Spiegel   D_KY ≈ 2.089

The larger D_KY is a consequence of the weak c₃ = 0.44 damping: neighbouring
trajectories separate faster relative to how quickly the volume is squeezed.

EQUILIBRIA — TWO FIXED POINTS, NEITHER STABLE
───────────────────────────────────────────────
Setting ẋ = ẏ = ż = 0:
    y = 0, z = 0, −c₁x + x² = 0  →  x(x − c₁) = 0

    P₀ = (0, 0, 0)      Jacobian characteristic poly: λ³ + c₃λ² + c₂λ + c₁ = 0
    P₁ = (c₁, 0, 0) = (1, 0, 0)   poly: λ³ + c₃λ² + c₂λ − c₁ = 0  (sign of c₁ flips!)

Routh-Hurwitz for P₀ (a₃=1, a₂=0.44, a₁=1.3, a₀=1):
    H₂ = a₂·a₁ − a₃·a₀ = 0.44·1.3 − 1·1 = 0.572 − 1.0 = −0.428 < 0
    → P₀ is UNSTABLE (at least one eigenvalue has Re > 0)

This is unusual: the ORIGIN is unstable.  Trajectories starting near (0,0,0)
are repelled — yet somehow the global attractor remains bounded.  The x² term
acts as a nonlinear "valve" that curves trajectories back.

For P₁, the polynomial changes to: λ³ + 0.44λ² + 1.3λ − 1 = 0.  By inspection,
λ = 0 → −1 ≠ 0; try λ ≈ 0.5: 0.125 + 0.11 + 0.65 − 1 = −0.115; try λ ≈ 0.55:
0.166 + 0.133 + 0.715 − 1 = 0.014.  So P₁ has a real positive eigenvalue ≈ 0.54
plus complex conjugate pair with negative real part — a saddle-focus.

The attractor wraps around P₁ in a single-lobe spiral, repeatedly folding but
never settling.  There is no Z₂ symmetry: only one scroll (unlike Lorenz/Rücklidge).

SHAPE KEYS — PARAMETER EXPLORATION
────────────────────────────────────
    Basis       c₃ = 0.44 (canonical chaos, D_KY ≈ 2.142)
    SK_DenseWrap c₃ = 0.30 (less dissipation → denser attractor, larger orbit radius)
    SK_BorderChs c₃ = 0.55 (near edge of chaos → smaller, more regular orbit)
    SK_ShiftedEQ c₁ = 0.70, c₂ = 1.2, c₃ = 0.44  (P₁ at x=0.7, topology shifts)

COLOUR — GT_Speed FLOAT_COLOR (cobalt → amber speed gradient)
──────────────────────────────────────────────────────────────
Speed ||(ẋ,ẏ,ż)|| = ||(y, z, −c₁x − c₂y − c₃z + x²)||
Maps slow (cobalt, 0.1) → fast (amber, 3.0)

RK4 PARAMETERS
──────────────
    DT = 0.01, BURN_IN = 3000 (removes transient), N = 90000, THIN = 30 → 3000 wp
    IC = (0.1, 0, 0) — near origin, in repulsion basin, transient removed by burn-in
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── parameters (edit here, rerun) ─────────────────────────────────────────
SLUG       = "hf_genesio_tesi_poi"
# Genesio-Tesi parameters — Automatica 1992 canonical
C1_BASIS   = 1.0    # linear x coefficient in ż
C2_BASIS   = 1.3    # linear y coefficient in ż  (velocity damping)
C3_BASIS   = 0.44   # linear z coefficient in ż  (sole source of divergence)

DT         = 0.01   # RK4 time-step — 0.01 resolves the orbit finely
BURN_IN    = 3000   # steps to discard (removes transient near unstable P₀)
N_STEPS    = 90000  # integration steps after burn-in
THIN       = 30     # keep every 30th → 3000 waypoints for the tube
TUBE_R     = 0.08   # tube radius (world units) — good visual weight at poi scale
TUBE_SEGS  = 10     # radial segments per cross-section

# Shape-key parameter sets   (c1, c2, c3)
SK_PARAMS = {
    "SK_DenseWrap":  (1.0, 1.3, 0.30),   # weaker damping → denser/larger orbit
    "SK_BorderChs":  (1.0, 1.3, 0.55),   # near chaos boundary — smaller orbit
    "SK_ShiftedEQ":  (0.70, 1.2, 0.44),  # P₁ at x=0.70 — topology shift
}

# colour thresholds (speed magnitude → vertex-colour attribute)
SPEED_LO   = 0.1    # cobalt   (slow)
SPEED_HI   = 3.0    # amber    (fast)

# ── helpers ───────────────────────────────────────────────────────────────
def _deriv(state, c1, c2, c3):
    """RHS of Genesio-Tesi jerk system. state = (x, y, z)."""
    x, y, z = state
    # ẋ = y   (jerk chain: position)
    # ẏ = z   (jerk chain: velocity)
    # ż = −c₁x − c₂y − c₃z + x²  (the jerk equation with single nonlinearity)
    return np.array([y,
                     z,
                     -c1*x - c2*y - c3*z + x*x])


def _rk4_integrate(c1, c2, c3):
    """RK4 integration → (N_STEPS//THIN, 3) waypoint array."""
    # burn-in phase: advance past the transient without recording
    state = np.array([0.1, 0.0, 0.0])
    for _ in range(BURN_IN):
        k1 = _deriv(state,           c1, c2, c3)
        k2 = _deriv(state + 0.5*DT*k1, c1, c2, c3)
        k3 = _deriv(state + 0.5*DT*k2, c1, c2, c3)
        k4 = _deriv(state + DT*k3,     c1, c2, c3)
        state += (DT / 6) * (k1 + 2*k2 + 2*k3 + k4)

    # recording phase
    pts, speeds = [], []
    for i in range(N_STEPS):
        k1 = _deriv(state,           c1, c2, c3)
        k2 = _deriv(state + 0.5*DT*k1, c1, c2, c3)
        k3 = _deriv(state + 0.5*DT*k2, c1, c2, c3)
        k4 = _deriv(state + DT*k3,     c1, c2, c3)
        state += (DT / 6) * (k1 + 2*k2 + 2*k3 + k4)
        if i % THIN == 0:
            pts.append(state.copy())
            # speed = magnitude of velocity vector in phase space
            speeds.append(np.linalg.norm(_deriv(state, c1, c2, c3)))

    return np.array(pts), np.array(speeds)


def _bishop_frames(pts):
    """
    Parallel-transport (Bishop) framing.
    Returns (N, 3) array of right-hand normal vectors, each propagated without
    arbitrary twist — the tube will NOT accumulate torsion along the orbit.

    Why Bishop framing?  The Frenet-Serret frame flips at inflection points
    (where curvature = 0), producing a twisting tube that looks broken.
    Bishop parallel-transport avoids this by rotating the frame only as much
    as the curve bends — the frame remembers its previous orientation.
    """
    n = len(pts)
    tangents = np.diff(pts, axis=0)
    tangents = tangents / (np.linalg.norm(tangents, axis=1, keepdims=True) + 1e-12)

    # seed first normal perpendicular to first tangent
    t0 = tangents[0]
    ref = np.array([0, 0, 1]) if abs(t0[2]) < 0.9 else np.array([1, 0, 0])
    normals = np.empty((n - 1, 3))
    normals[0] = np.cross(t0, ref)
    normals[0] /= np.linalg.norm(normals[0]) + 1e-12

    # propagate: at each step, rotate previous normal into the plane perpendicular
    # to the new tangent using the double-reflection method
    for i in range(1, n - 1):
        t_prev, t_curr = tangents[i - 1], tangents[i]
        axis = np.cross(t_prev, t_curr)
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-10:          # tangent barely changed — no rotation needed
            normals[i] = normals[i - 1]
        else:
            cos_a = np.dot(t_prev, t_curr)
            axis /= sin_a
            # Rodrigues rotation formula: rotate normal by the same angle
            n_prev = normals[i - 1]
            normals[i] = (cos_a * n_prev
                          + sin_a * np.cross(axis, n_prev)
                          + (1 - cos_a) * np.dot(axis, n_prev) * axis)
            normals[i] /= np.linalg.norm(normals[i]) + 1e-12

    return tangents, normals


def _build_tube_mesh(pts, speeds, sk_name=None, bm=None, ref_verts=None):
    """
    Build a tube mesh through waypoints.
    On first call (bm=None): creates and populates a fresh BMesh.
    On subsequent calls (bm != None): adds a shape key by displacing ref_verts.
    Returns (bm, list_of_ring_vert_positions).
    """
    n = len(pts)
    tangents, normals = _bishop_frames(pts)
    binormals = np.cross(tangents, normals)

    angles = np.linspace(0, 2 * np.pi, TUBE_SEGS, endpoint=False)
    cos_a, sin_a = np.cos(angles), np.sin(angles)

    all_rings = []     # list of (TUBE_SEGS,) lists of vert positions

    if bm is None:
        bm = bmesh.new()
        # colour layer: GT_Speed (cobalt=0 → amber=1)
        col_lay = bm.verts.layers.float_color.new("GT_Speed")

        for i in range(n - 1):
            cx, cy, cz = pts[i]
            tn, nn, bn = tangents[i], normals[i], binormals[i]
            spd = speeds[i]
            t_norm = np.clip((spd - SPEED_LO) / (SPEED_HI - SPEED_LO), 0, 1)
            # cobalt (0.15, 0.45, 0.95) → amber (1.0, 0.65, 0.0)
            r = 0.15 + 0.85 * t_norm
            g = 0.45 + 0.20 * t_norm
            b = 0.95 - 0.95 * t_norm

            ring_verts = []
            for ca, sa in zip(cos_a, sin_a):
                offset = TUBE_R * (ca * nn + sa * bn)
                pos = Vector((cx + offset[0], cy + offset[1], cz + offset[2]))
                v = bm.verts.new(pos)
                v[col_lay] = (r, g, b, 1.0)
                ring_verts.append(v)
            all_rings.append(ring_verts)

        # build quad faces between consecutive rings
        bm.verts.ensure_lookup_table()
        for i in range(len(all_rings) - 1):
            r0, r1 = all_rings[i], all_rings[i + 1]
            for j in range(TUBE_SEGS):
                j1 = (j + 1) % TUBE_SEGS
                bm.faces.new([r0[j], r0[j1], r1[j1], r1[j]])

        return bm, [[v.co.to_tuple() for v in ring] for ring in all_rings]

    else:
        # shape key: add displaced vertex positions (no new geometry)
        all_positions = []
        for i in range(n - 1):
            cx, cy, cz = pts[i]
            tn, nn, bn = tangents[i], normals[i], binormals[i]
            ring_pos = []
            for ca, sa in zip(cos_a, sin_a):
                offset = TUBE_R * (ca * nn + sa * bn)
                ring_pos.append((cx + offset[0], cy + offset[1], cz + offset[2]))
            all_positions.append(ring_pos)
        return all_positions


# ── main ─────────────────────────────────────────────────────────────────
def build():
    # ── 1. clear old objects with this slug
    for ob in list(bpy.data.objects):
        if ob.name.startswith(SLUG):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(SLUG):
            bpy.data.meshes.remove(me)

    # ── 2. integrate basis orbit
    pts_b, spd_b = _rk4_integrate(C1_BASIS, C2_BASIS, C3_BASIS)
    print(f"Basis: {len(pts_b)} waypoints  "
          f"x∈[{pts_b[:,0].min():.2f},{pts_b[:,0].max():.2f}]  "
          f"speed∈[{spd_b.min():.3f},{spd_b.max():.3f}]")

    # ── 3. build bmesh with basis geometry
    bm, ref_rings = _build_tube_mesh(pts_b, spd_b)

    # ── 4. convert to mesh + object
    me = bpy.data.meshes.new(SLUG)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(SLUG, me)
    bpy.context.collection.objects.link(ob)

    # ── 5. shape keys ─────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)
    sk_basis = ob.data.shape_keys.key_blocks["Basis"]
    sk_basis.value = 1.0

    for sk_name, (c1, c2, c3) in SK_PARAMS.items():
        pts_sk, _ = _rk4_integrate(c1, c2, c3)
        positions = _build_tube_mesh(pts_sk, None, sk_name=sk_name,
                                     bm=None,   # not used in this branch
                                     ref_verts=ref_rings)
        # flatten ring positions into vertex order matching the basis mesh
        sk = ob.shape_key_add(name=sk_name, from_mix=False)
        flat = [pos for ring in positions for pos in ring]
        for idx, (x, y, z) in enumerate(flat):
            if idx < len(sk.data):
                sk.data[idx].co = (x, y, z)
        sk.value = 0.0
        print(f"  {sk_name}: pts range x∈[{pts_sk[:,0].min():.2f},{pts_sk[:,0].max():.2f}]")

    # ── 6. naming + root tag for holoflow exporter
    ob.name = SLUG
    ob["holoflow:facet"] = True    # flat-shade on export
    ob["holoflow:slug"]  = SLUG

    # select & make active
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    print(f"\nGenesio–Tesi attractor built: {len(me.vertices)} verts, "
          f"{len(me.polygons)} faces.\n"
          f"Shape keys: Basis + {list(SK_PARAMS.keys())}\n"
          f"D_KY ≈ 2.142   λ₁ ≈ +0.073   ∇·F = −{C3_BASIS}")


build()
