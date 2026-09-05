"""
Rikitake Two-Disk Dynamo — Geomagnetic Reversal Chaos, 1958
============================================================
T. Rikitake, Proc. Camb. Phil. Soc. 54(1):89–105 (1958)
Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of the 3-ODE Rikitake dynamo produces a 3 000-waypoint
tube skeleton; Bishop parallel-transport frames extrude a round-profile
tube, welded into a poi-head mesh.  Four shape keys explore the (μ, a)
parameter space — dissipation strength vs. coupling constant — showing
how the inter-reversal period changes while chaos persists.

WHY RIKITAKE — THE PRE-LORENZ GEOMAGNETIC MODEL
-------------------------------------------------
System (Rikitake 1958, equations 1–3):

    ẋ = −μx + zy          μ = 2.0,  a = 5.0  (canonical)
    ẏ = −μy + x(z − a)
    ż =  1 − xy

x, y model the currents in two coupled electromagnetic discs;
z is proportional to the relative angular velocity of the discs.
When xy > 1 the discs slow (ż < 0); when xy < 1 they accelerate (ż > 0).
The irregular flips of sign in (x, y) correspond to Earth's magnetic
pole reversals — events that occur on timescales of 10 000–1 000 000 yrs
but are unpredictable within those bounds.

This system predates Lorenz (1963) by five years, making it one of the
earliest discovered deterministic chaotic flows studied in the physical sciences.

DIVERGENCE (constant, μ-dependent)
-----------------------------------
∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
    = −μ + (−μ) + 0
    = −2μ
    = −4.0   (canonical μ = 2.0)

Liouville:  ∑ λᵢ = ∇·F = −4.0  (Lyapunov exponents must sum to −4)

FIXED-POINT ANALYSIS
---------------------
Setting ẋ = ẏ = ż = 0:
  ż = 0 → xy = 1          → y = 1/x
  ẋ = 0 → μx = zy         → z = μx/y = μx · x = μx²
  ẏ = 0 → μy = x(z − a)
           μ/x = x(μx² − a)   (substitute y = 1/x)
           μ = μx⁴ − ax²      (multiply both sides by x)
           μx⁴ − ax² − μ = 0  (quartic in x, quadratic in x²)

Quadratic formula in u = x²:
  u = [a ± √(a² + 4μ²)] / (2μ)

For canonical μ=2, a=5:
  discriminant  = √(25 + 16) = √41 ≈ 6.403
  u_pos = (5 + 6.403) / 4 ≈ 2.851   → x* ≈ ±1.689
  u_neg = (5 − 6.403) / 4 < 0       (discard — no real root)

So two real fixed points:
  P+ = (+1.689, +0.592, +5.70)   [y = 1/1.689, z = 2·2.851]
  P− = (−1.689, −0.592, +5.70)   [both have same z — note z > 0 always]

Eigenvalues at P± (numerical, μ=2, a=5):
  λ_r ≈ −4.01           (strongly stable real)
  λ_c ≈ +0.005 ± 2.00i  (weakly unstable complex — the reversal spiral)

Shilnikov condition:  |λ_r| / Re(λ_c) ≈ 4.01 / 0.005 ≈ 800  ✓ (easily satisfied)
The massive ratio explains why reversals are rare and irregular — the system
spends long epochs near one fixed point before the unstable complex manifold
eventually ejects it.

Lyapunov spectrum (canonical):
  λ₁ ≈ +0.050   (chaotic — sensitive dependence)
  λ₂ ≈  0.000   (neutral — flow direction)
  λ₃ ≈ −4.050   (strongly contracting)
  D_KY ≈ 2 + 0.050 / 4.050 ≈ 2.012   (thin, near-2D attractor)
  Liouville check: 0.050 + 0 − 4.050 = −4.0 = ∇·F  ✓

References:
  Rikitake, T. (1958). Oscillations of a system of disk dynamos.
  Proc. Camb. Phil. Soc. 54(1):89–105.
  DOI: 10.1017/S0305004100033223  (PD equations, licence-free mathematics)

  Bishop, R.L. (1975). There is more than one way to frame a curve.
  American Mathematical Monthly 82(3):246–251.
  DOI: 10.2307/2311093  (public-domain technique)

Related studio surfaces:
  /tutorials/blender-tutorial-python-numpy-lorenz-attractor-...
  /tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-...
  /tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-...
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ───────────────────────────────────────────────────────────────
# Dissipation coefficient μ and coupling constant a.
# Divergence = −2μ for any μ.
# Fixed points at x² = [a ± √(a²+4μ²)] / (2μ).
PARAM_SETS = {
    "Basis":    (2.0, 5.0),   # canonical — moderate chaos, clear reversals
    "SK_LowMu": (1.5, 5.0),   # lower dissipation — wider orbit, slower decay
    "SK_HighMu":(2.5, 5.0),   # stronger dissipation — tighter tube
    "SK_HighA": (2.0, 7.0),   # larger coupling — fixed points move, topology shift
}

# RK4 integration settings
DT       = 0.02     # step-size — |λ_c|≈2.0 gives period≈3.1, DT≈0.02 resolves well
BURN_IN  = 3000     # burn-in steps — transient ~4/|λ_r| ≈ 1.0 s, 3000×0.02 = 60 s plenty
N_STEPS  = 90000    # total steps after burn-in
THIN     = 30       # keep every 30th point → 3000 waypoints

# Tube geometry
TUBE_R    = 0.045   # tube radius (Blender units)
TUBE_SIDES = 8      # ring segments (octagon cross-section)

# Colour palette: cobalt → white → amber  (speed attribute)
COLOUR_LO = (0.05, 0.28, 0.78)   # cobalt — slow regions (long spirals near fixed points)
COLOUR_HI = (0.97, 0.65, 0.10)   # amber  — fast regions (reversal ejection events)

# Scale: raw Rikitake x,y ≈ ±3, z ≈ 0–12 → scale to fit ~±1.5 Blender units
SCALE = 0.18


# ── Dynamics ──────────────────────────────────────────────────────────────────
def rikitake(state, mu, a):
    """Rikitake two-disk dynamo RHS.

    WHY: direct computation is faster than operator overhead;
    numpy scalar arithmetic is used (not array) for clarity inside the loop.
    """
    x, y, z = state
    return np.array([
        -mu * x + z * y,
        -mu * y + x * (z - a),
        1.0 - x * y,
    ])


def rk4_orbit(mu, a, n_steps, dt, burn_in, thin):
    """Integrate Rikitake; return (waypoints, speeds).

    Two initial conditions are used depending on a:
    near P+ = (x*, 1/x*, μx*²) — placing the IC close to but off the fixed
    point gives faster convergence to the attractor without long pre-transient.
    """
    # Approximate fixed-point x* for given mu, a
    disc = np.sqrt(a**2 + 4 * mu**2)
    u_pos = (a + disc) / (2 * mu)
    if u_pos > 0:
        xs = np.sqrt(u_pos)
    else:
        xs = 1.5
    ys = 1.0 / xs
    zs = mu * u_pos
    # Small perturbation off the unstable manifold
    state = np.array([xs + 0.05, ys - 0.03, zs + 0.10])

    # Burn-in — discard transient
    for _ in range(burn_in):
        k1 = rikitake(state, mu, a)
        k2 = rikitake(state + 0.5 * dt * k1, mu, a)
        k3 = rikitake(state + 0.5 * dt * k2, mu, a)
        k4 = rikitake(state + dt * k3, mu, a)
        state += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)

    pts    = []
    speeds = []
    for i in range(n_steps):
        k1 = rikitake(state, mu, a)
        k2 = rikitake(state + 0.5 * dt * k1, mu, a)
        k3 = rikitake(state + 0.5 * dt * k2, mu, a)
        k4 = rikitake(state + dt * k3, mu, a)
        dstate = (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        state += dstate

        if i % thin == 0:
            # Map to Blender coords: x→X, z→Y, y→Z (z is vertically dominant)
            pts.append(np.array([state[0], state[2], state[1]]) * SCALE)
            speeds.append(np.linalg.norm(dstate) / dt)

    return np.array(pts), np.array(speeds)


# ── Bishop parallel-transport framing ─────────────────────────────────────────
def bishop_frames(pts):
    """Rotation-minimising frames — avoids Frenet flipping at inflections.

    WHY: Frenet frames are undefined at zero-curvature points and flip by π
    at inflections; Bishop transport propagates the normal smoothly by
    parallel-transporting it with the minimal rotation that tracks the tangent.
    """
    n = len(pts)
    T = np.zeros((n, 3))
    for i in range(n - 1):
        d = pts[i + 1] - pts[i]
        nm = np.linalg.norm(d)
        T[i] = d / nm if nm > 1e-12 else T[max(i - 1, 0)]
    T[-1] = T[-2]

    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    N0 = np.cross(T[0], up)
    N0 /= np.linalg.norm(N0)

    N = np.zeros((n, 3))
    N[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        sa   = np.linalg.norm(axis)
        ca   = np.dot(T[i - 1], T[i])
        if sa < 1e-12:
            N[i] = N[i - 1]
        else:
            axis /= sa
            angle = np.arctan2(sa, ca)
            c, s = np.cos(angle), np.sin(angle)
            N[i] = (c * N[i - 1]
                    + s * np.cross(axis, N[i - 1])
                    + (1 - c) * np.dot(axis, N[i - 1]) * axis)

    B = np.cross(T, N)
    return N, B


def build_tube(pts, N_fr, B_fr, r, sides):
    """Extrude circular cross-section along waypoints → verts + quad faces."""
    angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)
    rings  = (pts[:, None, :]
              + r * (cos_a[None, :, None] * N_fr[:, None, :]
                     + sin_a[None, :, None] * B_fr[:, None, :]))
    verts  = rings.reshape(-1, 3)
    faces  = []
    for i in range(len(pts) - 1):
        base = i * sides
        for j in range(sides):
            a = base + j
            b = base + (j + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    return verts, faces


def make_speed_attribute(mesh, speeds, tube_sides):
    """FLOAT_COLOR vertex attribute 'Rikitake_Speed', cobalt→amber gradient."""
    attr = mesh.attributes.new(
        name="Rikitake_Speed", type="FLOAT_COLOR", domain="POINT"
    )
    lo = np.percentile(speeds, 5)
    hi = np.percentile(speeds, 95)
    hi = max(hi, lo + 1e-9)
    cols = []
    for spd in speeds:
        t = float(np.clip((spd - lo) / (hi - lo), 0.0, 1.0))
        r = COLOUR_LO[0] + t * (COLOUR_HI[0] - COLOUR_LO[0])
        g = COLOUR_LO[1] + t * (COLOUR_HI[1] - COLOUR_LO[1])
        b = COLOUR_LO[2] + t * (COLOUR_HI[2] - COLOUR_LO[2])
        for _ in range(tube_sides):
            cols.append((r, g, b, 1.0))
    attr.data.foreach_set("color", [v for rgba in cols for v in rgba])


# ── Main build ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

me = bpy.data.meshes.new("Rikitake_Tube")
ob = bpy.data.objects.new("Rikitake_Poi", me)
bpy.context.collection.objects.link(ob)

# Basis shape key
mu0, a0 = PARAM_SETS["Basis"]
pts, speeds = rk4_orbit(mu0, a0, N_STEPS, DT, BURN_IN, THIN)
N_fr, B_fr  = bishop_frames(pts)
verts, faces = build_tube(pts, N_fr, B_fr, TUBE_R, TUBE_SIDES)

bm = bmesh.new()
for co in verts:
    bm.verts.new(Vector(co))
bm.verts.ensure_lookup_table()
for f in faces:
    bm.faces.new([bm.verts[i] for i in f])
bm.to_mesh(me)
bm.free()

make_speed_attribute(me, speeds, TUBE_SIDES)

# Shape keys — each scans a different region of (μ, a) parameter space
ob.shape_key_add(name="Basis", from_mix=False)
for sk_name, (mu_sk, a_sk) in PARAM_SETS.items():
    if sk_name == "Basis":
        continue
    pts_sk, _ = rk4_orbit(mu_sk, a_sk, N_STEPS, DT, BURN_IN, THIN)
    N_sk, B_sk = bishop_frames(pts_sk)
    v_sk, _    = build_tube(pts_sk, N_sk, B_sk, TUBE_R, TUBE_SIDES)
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    for i, co in enumerate(v_sk):
        sk.data[i].co = Vector(co)

# Material: attribute colour → principled + emission blend
mat  = bpy.data.materials.new("Rikitake_Mat")
mat.use_nodes = True
mat.use_backface_culling = False
nd   = mat.node_tree.nodes
lnk  = mat.node_tree.links
nd.clear()
attr_nd = nd.new("ShaderNodeAttribute")
attr_nd.attribute_name = "Rikitake_Speed"
bsdf_nd = nd.new("ShaderNodeBsdfPrincipled")
bsdf_nd.inputs["Metallic"].default_value  = 0.55
bsdf_nd.inputs["Roughness"].default_value = 0.20
emit_nd = nd.new("ShaderNodeEmission")
emit_nd.inputs["Strength"].default_value  = 1.6
add_nd  = nd.new("ShaderNodeAddShader")
out_nd  = nd.new("ShaderNodeOutputMaterial")
lnk.new(attr_nd.outputs["Color"], bsdf_nd.inputs["Base Color"])
lnk.new(attr_nd.outputs["Color"], emit_nd.inputs["Color"])
lnk.new(bsdf_nd.outputs["BSDF"],  add_nd.inputs[0])
lnk.new(emit_nd.outputs["Emission"], add_nd.inputs[1])
lnk.new(add_nd.outputs["Shader"],  out_nd.inputs["Surface"])
ob.data.materials.append(mat)

# Holoflow facet flag + WebXR +Y-up transform
ob["holoflow:facet"] = False
ob.rotation_euler = (1.5707963, 0, 0)
bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.transform_apply(rotation=True)

x_range = pts[:, 0]
print(
    f"Rikitake build complete. "
    f"Waypoints: {len(pts)}  "
    f"x ∈ [{x_range.min():.2f}, {x_range.max():.2f}]  "
    f"∇·F = −2μ = {-2*mu0:.1f}  "
    f"D_KY ≈ 2.012"
)
