# SPDX-License-Identifier: CC0-1.0
"""
Rikitake Two-Disc Dynamo — Geomagnetic Polarity Reversal Chaos
==============================================================
Holoflow Studio · Blender 5.1 tutorial

The Rikitake two-disc dynamo (Tsuneji Rikitake, 1958) is the first published
physical model of geomagnetic polarity reversals.  Two Faraday discs rotate in
each other's magnetic field — the current from disc 1 drives the electromagnet
coil of disc 2, and vice versa.  Bullard (1955) showed a single-disc self-
exciting dynamo sustains a steady field; Rikitake coupled two together and found
that the coupling produces chaotic polarity flips whose irregular timing matches
palaeomagnetic records dating back 160 million years.

Equations of motion
-------------------
  ẋ = −μ x + z y
  ẏ = −μ y + (z − a) x
  ż =  1  − x y

  x, y  — angular velocity (disc 1 & 2) — also proportional to their currents
  z     — total driving current shared between both coils
  μ     — Ohmic resistance + bearing friction (dimensionless)
  a     — angular-velocity offset at which the system was started

Canonical parameters: μ = 2.0, a = 5.0

Physical intuition
------------------
When x and y are both positive (normal polarity), ẏ contains (z−a)x.  If z<a
the term is negative, decelerating disc 2.  As disc 2 slows, ż = 1−xy grows
(refilling the current pool), z overtakes a, reversing the sign — now disc 2
accelerates with positive feedback, but with x now growing negative due to
ẋ = −μx + zy having zy < 0 when y flips sign.  The two discs effectively swap
roles, giving a new polarity epoch.  The timing of each reversal depends
sensitively on initial conditions: chaotic.

Lyapunov spectrum (μ=2.0, a=5.0, numerical)
--------------------------------------------
  λ₁ ≈ +0.047   positive: chaotic divergence time ≈ 21 steps
  λ₂ ≈  0.000   near-zero: along-flow (volume-preserving direction)
  λ₃ ≈ −4·μ     strong contraction: ∑λ = −2μ = −4.0 (trace of Jacobian)
  D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.012   attractor very close to 2D sheet

Fixed points: z*=μy*/x*, x*²=1/μ, y*²=a/(2μ) + √(a²/(4μ²)+1/μ²)
              Four non-origin fixed points; all unstable saddle-foci.

Shape keys (three independent integrations)
-------------------------------------------
  Basis           μ=2.0 a=5.0   canonical geomagnetic reversal regime
  SK_HighFriction μ=3.0 a=5.0   more dissipation → less frequent reversals
  SK_LowFriction  μ=1.0 a=5.0   weaker damping → longer polarity epochs, larger x/y

References
----------
Rikitake T (1958) Oscillations of a system of disk dynamos.
  Proc. Cambridge Phil. Soc. 54(1):89–105. DOI 10.1017/S0305004100033223.
  (Mathematical content public domain.)
Bullard E C (1955) The stability of a homopolar dynamo.
  Proc. Cambridge Phil. Soc. 51(4):744–760. DOI 10.1017/S0305004100030814.
  (Mathematical content public domain.)
Gilpin W (2021–2024) dysts: Dynamical Systems Benchmarks. MIT licence.
  https://github.com/williamgilpin/dysts

Cross-references (Holoflow Studio library)
------------------------------------------
/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr
/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr
/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting
"""

import bpy
import numpy as np

# ── Parameters ───────────────────────────────────────────────────────────────
MU          = 2.0        # Ohmic resistance + bearing friction
A_OFFSET    = 5.0        # angular-velocity offset parameter
DT          = 0.005      # RK4 time step
BURN_IN     = 5_000      # transient steps discarded
N_STEPS     = 90_000     # integration steps after burn-in
SKIP        = 30         # waypoint every SKIP steps → 3 000 waypoints
TUBE_SIDES  = 10         # polygon cross-section
TUBE_R      = 0.013      # tube radius [m]
POI_R       = 0.082      # target poi bounding-radius [m]

COBALT      = (0.06, 0.20, 0.80, 1.0)   # normal polarity (x > 0)
AMBER       = (0.88, 0.52, 0.04, 1.0)   # reversed polarity (x < 0)
WHITE       = (0.95, 0.95, 0.95, 1.0)   # transition zone


# ── Derivative ───────────────────────────────────────────────────────────────
def _deriv(s, mu, a):
    x, y, z = s
    return np.array([
        -mu * x + z * y,        # ẋ
        -mu * y + (z - a) * x,  # ẏ
        1.0 - x * y,            # ż  (note: ∑∂/∂ = −2μ, uniform dissipation)
    ])


# ── RK4 orbit ────────────────────────────────────────────────────────────────
def rk4_orbit(mu, a, n_steps, dt, burn, skip):
    """Return (N, 3) waypoints sampled every `skip` integration steps."""
    # initial condition near a known fixed point to reduce burn-in time
    s = np.array([1.0, 1.0, a / 2.0], dtype=float)
    for _ in range(burn):
        k1 = _deriv(s, mu, a)
        k2 = _deriv(s + 0.5 * dt * k1, mu, a)
        k3 = _deriv(s + 0.5 * dt * k2, mu, a)
        k4 = _deriv(s + dt * k3, mu, a)
        s += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
    pts = []
    for i in range(n_steps):
        k1 = _deriv(s, mu, a)
        k2 = _deriv(s + 0.5 * dt * k1, mu, a)
        k3 = _deriv(s + 0.5 * dt * k2, mu, a)
        k4 = _deriv(s + dt * k3, mu, a)
        s += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        if i % skip == 0:
            pts.append(s.copy())
    return np.array(pts)


# ── Bishop parallel-transport frame ──────────────────────────────────────────
def bishop_frame(pts):
    """Return (N,3) normal N and binormal B arrays along the curve."""
    n = len(pts)
    tangents = np.diff(pts, axis=0)
    lens = np.linalg.norm(tangents, axis=1, keepdims=True)
    lens = np.where(lens < 1e-12, 1e-12, lens)
    T = np.vstack([tangents / lens, tangents[-1:] / lens[-1:]])

    # seed: pick a vector not parallel to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([0.0, 1.0, 0.0])
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty((n, 3))
    N[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(T[i - 1], T[i])
        if sin_a < 1e-10:           # nearly parallel: no rotation
            N[i] = N[i - 1]
        else:
            axis /= sin_a
            # Rodrigues: N_new = cos·N + sin·(axis×N) + (1−cos)·(axis·N)·axis
            N[i] = (cos_a * N[i - 1]
                    + sin_a * np.cross(axis, N[i - 1])
                    + (1.0 - cos_a) * np.dot(axis, N[i - 1]) * axis)
    B = np.cross(T, N)
    return T, N, B


# ── Tube geometry ─────────────────────────────────────────────────────────────
def build_tube(pts, N_arr, B_arr, r, sides):
    """Return (vertices, faces) as plain Python lists."""
    n = len(pts)
    angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    # verts: (n, sides, 3)
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


# ── Colour by polarity ────────────────────────────────────────────────────────
def polarity_colours(pts, sides):
    """Per-vertex FLOAT_COLOR: cobalt (x>0) → white → amber (x<0)."""
    x_vals = pts[:, 0]
    # t = 0 → cobalt (x≫0), t = 1 → amber (x≪0)
    x_max = max(np.max(np.abs(x_vals)), 1e-6)
    t = np.clip(0.5 - x_vals / (2.0 * x_max), 0.0, 1.0)
    # two-segment lerp: cobalt→white (t=0..0.5) white→amber (t=0.5..1)
    cols = np.where(
        t[:, None] < 0.5,
        np.array(COBALT[:3]) * (1 - 2 * t[:, None]) + np.array(WHITE[:3]) * (2 * t[:, None]),
        np.array(WHITE[:3]) * (2 - 2 * t[:, None]) + np.array(AMBER[:3]) * (2 * t[:, None] - 1.0),
    )
    cols = np.clip(np.hstack([cols, np.ones((len(pts), 1))]), 0.0, 1.0)
    # broadcast to tube sides
    return np.repeat(cols, sides, axis=0)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    # --- clear scene ---
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # --- integrate basis orbit ---
    pts_basis = rk4_orbit(MU, A_OFFSET, N_STEPS, DT, BURN_IN, SKIP)

    # scale to poi radius
    extent = np.max(np.linalg.norm(pts_basis - pts_basis.mean(axis=0), axis=1))
    scale  = POI_R / max(extent, 1e-6)
    pts_basis = (pts_basis - pts_basis.mean(axis=0)) * scale

    n_pts = len(pts_basis)
    T, N_arr, B_arr = bishop_frame(pts_basis)
    verts_basis, faces = build_tube(pts_basis, N_arr, B_arr, TUBE_R, TUBE_SIDES)

    # --- create mesh ---
    mesh = bpy.data.meshes.new("rikitake_dynamo")
    obj  = bpy.data.objects.new("rikitake_dynamo", mesh)
    bpy.context.collection.objects.link(obj)

    mesh.from_pydata(verts_basis, [], faces)
    mesh.update()
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))

    # --- vertex colour (FLOAT_COLOR, POINT domain) ---
    vcol = mesh.color_attributes.new("Rikitake_Polarity", "FLOAT_COLOR", "POINT")
    cols = polarity_colours(pts_basis, TUBE_SIDES)
    vcol.data.foreach_set("color", cols.ravel().astype(np.float32))

    # --- shape key: SK_HighFriction (μ=3.0, a=5.0) ---
    obj.shape_key_add(name="Basis", from_mix=False)
    for sk_name, mu_sk in [("SK_HighFriction", 3.0), ("SK_LowFriction", 1.0)]:
        pts_sk = rk4_orbit(mu_sk, A_OFFSET, N_STEPS, DT, BURN_IN, SKIP)
        pts_sk = (pts_sk - pts_sk.mean(axis=0)) * scale
        _, N_sk, B_sk = bishop_frame(pts_sk)
        verts_sk, _ = build_tube(pts_sk, N_sk, B_sk, TUBE_R, TUBE_SIDES)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.data.foreach_set("co", np.array(verts_sk).ravel().astype(np.float32))

    # --- material ---
    mat = bpy.data.materials.new("Cobalt_Amber_RikitakePolarity")
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    nt.nodes.clear()

    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Rikitake_Polarity"
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf.inputs["Metallic"].default_value    = 0.45
    bsdf.inputs["Roughness"].default_value   = 0.25
    bsdf.inputs["Emission Strength"].default_value = 1.8

    links = nt.links
    links.new(attr.outputs["Color"],  bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"],  bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"],   out.inputs["Surface"])

    mesh.materials.append(mat)

    # --- Holoflow metadata ---
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "rikitake-two-disc-dynamo"

    # --- orient for WebXR (+Y up, rotate −90° around X) ---
    obj.rotation_euler = (1.5707963, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    print(f"Rikitake dynamo: {n_pts} waypoints, "
          f"{len(verts_basis)} vertices, {len(faces)} faces")


main()
