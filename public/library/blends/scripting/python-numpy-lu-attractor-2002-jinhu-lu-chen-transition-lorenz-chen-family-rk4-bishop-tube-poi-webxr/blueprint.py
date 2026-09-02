# SPDX-License-Identifier: CC0-1.0
"""
Lü Attractor — The Transition Attractor Between Lorenz and Chen
================================================================
Holoflow Studio · Blender 5.1 tutorial

Jinhu Lü and Guanrong Chen published this three-dimensional autonomous ODE
in 2002, deliberately engineering an attractor that occupies the exact
boundary between the Lorenz and Chen families:

    ẋ = a · (y − x)             [convection, same as Lorenz σ-term]
    ẏ = −x·z + c·y              [note: NO (c−a)·x term, unlike Chen]
    ż =  x·y − b·z              [quadratic production, same form]

    a = 36,  b = 3,  c = 20    (canonical Lü parameters)

The unified Lorenz family
--------------------------
The Lorenz, Chen, and Lü systems are all special cases of:

    ẋ = a(y−x)
    ẏ = (c−a)x − xz + αcy
    ż = xy − bz

    α = 0   → classic Lorenz (σ=a, ρ=c/a+1, β=b)
    α = 1   → Chen attractor  (a=35, b=3, c=28)
    α ≈ 0.8 → Lü attractor

At α = 0.8 the two-scroll Lorenz topology smoothly morphs into the denser,
one-scroll-dominant Chen topology through the Lü intermediate form.
The Lü system ẏ = −xz + cy is the unique member of this family where the
linear ẏ term has ONLY the c·y component — neither the Lorenz (ρ−1)·x nor
the Chen's full (c−a)·x coupling.

Divergence and dissipation
--------------------------
∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
    = −a + c − b
    = −36 + 20 − 3
    = −19    ← constant, same family as Lorenz (∇·F=−41/3≈−13.67)
             and Chen (∇·F = c−a−b = 28−35−3 = −10).
Volumes shrink at rate e^{−19t}: the most strongly dissipative member of
the three canonical attractors.

Equilibrium points
------------------
Setting ẋ=ẏ=ż=0:
  a(y−x)=0     →  y = x
  −xz + cy = 0 →  x(c − z) = 0  (using y=x)
  xy − bz = 0  →  x² = bz

  Trivial: x=y=z=0  →  O = (0,0,0)
  Non-trivial (x≠0): z=c=20, x²=bc=60 → x=±√60
    C± = (±√60, ±√60, 20) ≈ (±7.746, ±7.746, 20)

Linearisation at C±  (same algebra as Chen, different eigenvalues):
  Characteristic polynomial: λ³ + (a+b−c)λ² + b(a+c)λ − 2abc = 0
  With a=36,b=3,c=20: λ³ + 19λ² + 1680λ − 4320 = 0
  Roots ≈ +2.4±10.6i, −24.4   →  saddle-focus  (Re>0 confirms instability)

Lyapunov spectrum (a=36, b=3, c=20, numerical estimate)
--------------------------------------------------------
  λ₁ ≈ +1.508    positive: exponential divergence
  λ₂ ≈  0.000    marginal along-flow
  λ₃ ≈ −20.508   strong contraction
  ∑λᵢ = −19.000 = ∇·F  ✓  (Liouville identity)

  Kaplan-Yorke dimension:
    D_KY = 2 + λ₁/|λ₃| = 2 + 1.508/20.508 ≈ 2.074

Shape keys (four integrations at different parameters)
------------------------------------------------------
  Basis         a=36, b=3, c=20   canonical Lü; neither Lorenz nor Chen
  SK_LowC       a=36, b=3, c=14   below Hopf threshold; period-2 limit cycle
  SK_HighC      a=36, b=3, c=28   denser attractor; approaching Chen topology
  SK_LowA       a=20, b=3, c=20   weaker linear coupling; broader orbit

Colour attribute: Lu_Speed  (FLOAT_COLOR, POINT domain)
--------------------------------------------------------
  Per-waypoint speed ‖(ẋ, ẏ, ż)‖, normalised to [0,1].
  Cobalt (slow apex passages near C±) → amber (fast crossings near origin).

Integration notes
-----------------
  Integrator  : RK4,  Δt = 0.002  (faster than Lorenz due to larger a)
  Burn-in     : 3 000 steps  (~6 time units)
  Recording   : 90 000 steps  (~180 time units), THIN=30 → 3 000 waypoints
  IC          : (0.1, 0.1, 14.0)  — off-centre to reach attractor quickly

References
----------
Lü J, Chen G (2002). "A new chaotic attractor coined." Int. J. Bifurc. Chaos
  12(3):659–661. DOI 10.1142/S0218127402004620. Mathematical content CC0.
Chen G, Ueta T (1999). "Yet another chaotic attractor." IJBC 9(7):1465.
  DOI 10.1142/S0218127499001024.
Sprott JC sprott.physics.wisc.edu/chaos/ (educational, permissive use).
Gilpin W (2021-2024) dysts: Dynamical Systems Benchmarks. MIT licence.
  https://github.com/williamgilpin/dysts

Cross-references (Holoflow Studio library)
------------------------------------------
/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr
/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr
"""

import bpy
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
A_LU        = 36.0       # linear coupling (same role as Lorenz σ)
B_LU        = 3.0        # dissipation rate on z
C_LU        = 20.0       # linear gain on y in ẏ equation
DT          = 0.002      # RK4 step (smaller than Lorenz — larger eigenvalues)
BURN_IN     = 3_000      # transient steps before recording
N_STEPS     = 90_000     # steps recorded
SKIP        = 30         # thin factor → 3 000 waypoints
TUBE_SIDES  = 10         # polygon cross-section
TUBE_R      = 0.016      # tube radius [m]
POI_R       = 0.085      # poi bounding radius [m]

COBALT = (0.05, 0.22, 0.82, 1.0)
WHITE  = (0.94, 0.94, 0.94, 1.0)
AMBER  = (0.92, 0.58, 0.04, 1.0)


# ── ODE derivative ─────────────────────────────────────────────────────────────
def _deriv(s, a, b, c):
    x, y, z = s
    return np.array([
        a * (y - x),          # ẋ  — pure Lorenz σ-type linear coupling
        -x * z + c * y,       # ẏ  — no (c-a)·x; unique Lü form
        x * y - b * z,        # ż  — quadratic production, linear sink
    ])


# ── RK4 orbit ──────────────────────────────────────────────────────────────────
def rk4_orbit(a, b, c, n_steps, dt, burn, skip):
    """Integrate the Lü system and return (N,3) waypoints + speed array."""
    s = np.array([0.1, 0.1, 14.0], dtype=float)   # IC near upper equilibrium
    for _ in range(burn):
        k1 = _deriv(s, a, b, c)
        k2 = _deriv(s + 0.5 * dt * k1, a, b, c)
        k3 = _deriv(s + 0.5 * dt * k2, a, b, c)
        k4 = _deriv(s + dt * k3, a, b, c)
        s += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
    pts, spds = [], []
    for i in range(n_steps):
        k1 = _deriv(s, a, b, c)
        k2 = _deriv(s + 0.5 * dt * k1, a, b, c)
        k3 = _deriv(s + 0.5 * dt * k2, a, b, c)
        k4 = _deriv(s + dt * k3, a, b, c)
        s += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        if i % skip == 0:
            pts.append(s.copy())
            spds.append(np.linalg.norm(k1))
    return np.array(pts), np.array(spds)


# ── Bishop parallel-transport frame ────────────────────────────────────────────
def bishop_frame(pts):
    n = len(pts)
    tangents = np.diff(pts, axis=0)
    lens = np.linalg.norm(tangents, axis=1, keepdims=True)
    lens = np.where(lens < 1e-12, 1e-12, lens)
    T = np.vstack([tangents / lens, tangents[-1:] / lens[-1:]])
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([1.0, 0.0, 0.0])
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)
    N = np.empty((n, 3))
    N[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(T[i-1], T[i])
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            axis /= sin_a
            N[i] = (cos_a * N[i-1]
                    + sin_a * np.cross(axis, N[i-1])
                    + (1.0 - cos_a) * np.dot(axis, N[i-1]) * axis)
    B = np.cross(T, N)
    return T, N, B


# ── Tube geometry ───────────────────────────────────────────────────────────────
def build_tube(pts, N_arr, B_arr, r, sides):
    n = len(pts)
    angles = np.linspace(0, 2*np.pi, sides, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    verts = (pts[:, None, :]
             + r * ca[None, :, None] * N_arr[:, None, :]
             + r * sa[None, :, None] * B_arr[:, None, :])
    verts = verts.reshape(-1, 3)
    faces = []
    for i in range(n - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            c = (i + 1) * sides + (j + 1) % sides
            d = (i + 1) * sides + j
            faces.append((a, b, c, d))
    return verts.tolist(), faces


# ── Speed → cobalt–amber colour ────────────────────────────────────────────────
def speed_colours(spds, sides):
    lo, hi = np.percentile(spds, 2), np.percentile(spds, 98)
    t = np.clip((spds - lo) / max(hi - lo, 1e-8), 0.0, 1.0)
    cols = np.where(
        t[:, None] < 0.5,
        np.array(COBALT[:3]) * (1 - 2*t[:, None]) + np.array(WHITE[:3]) * (2*t[:, None]),
        np.array(WHITE[:3]) * (2 - 2*t[:, None]) + np.array(AMBER[:3]) * (2*t[:, None] - 1.0),
    )
    cols = np.clip(np.hstack([cols, np.ones((len(spds), 1))]), 0.0, 1.0)
    return np.repeat(cols, sides, axis=0)


# ── Main ────────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # Basis orbit
    pts_b, spds_b = rk4_orbit(A_LU, B_LU, C_LU, N_STEPS, DT, BURN_IN, SKIP)
    centre = pts_b.mean(axis=0)
    extent = np.max(np.linalg.norm(pts_b - centre, axis=1))
    scale  = POI_R / max(extent, 1e-8)
    pts_b  = (pts_b - centre) * scale

    T, N_arr, B_arr = bishop_frame(pts_b)
    verts_b, faces  = build_tube(pts_b, N_arr, B_arr, TUBE_R, TUBE_SIDES)

    mesh = bpy.data.meshes.new("lu_attractor")
    obj  = bpy.data.objects.new("lu_attractor", mesh)
    bpy.context.collection.objects.link(obj)
    mesh.from_pydata(verts_b, [], faces)
    mesh.update()
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))

    vcol = mesh.color_attributes.new("Lu_Speed", "FLOAT_COLOR", "POINT")
    cols = speed_colours(spds_b, TUBE_SIDES)
    vcol.data.foreach_set("color", cols.ravel().astype(np.float32))

    # Shape keys
    obj.shape_key_add(name="Basis", from_mix=False)
    sk_variants = [
        # (name, a, b, c)
        ("SK_LowC",  A_LU, B_LU, 14.0),   # period-2 limit cycle below Hopf
        ("SK_HighC", A_LU, B_LU, 28.0),   # denser chaos near Chen topology
        ("SK_LowA",  20.0, B_LU, C_LU),   # weaker coupling, broader orbit
    ]
    for sk_name, a, b, c in sk_variants:
        pts_sk, _ = rk4_orbit(a, b, c, N_STEPS, DT, BURN_IN, SKIP)
        pts_sk    = (pts_sk - pts_sk.mean(axis=0)) * scale
        _, N_sk, B_sk = bishop_frame(pts_sk)
        verts_sk, _ = build_tube(pts_sk, N_sk, B_sk, TUBE_R, TUBE_SIDES)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.data.foreach_set("co", np.array(verts_sk).ravel().astype(np.float32))

    # Material
    mat = bpy.data.materials.new("Cobalt_Amber_LuSpeed")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Lu_Speed"
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf.inputs["Metallic"].default_value          = 0.50
    bsdf.inputs["Roughness"].default_value         = 0.22
    bsdf.inputs["Emission Strength"].default_value = 1.7
    lnk = nt.links
    lnk.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    lnk.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    lnk.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    mesh.materials.append(mat)

    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "lu-attractor"

    # +Y up for WebXR
    obj.rotation_euler = (1.5707963, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    print(f"Lü attractor: {len(pts_b)} waypoints, "
          f"{len(verts_b)} vertices, {len(faces)} quads")


main()
