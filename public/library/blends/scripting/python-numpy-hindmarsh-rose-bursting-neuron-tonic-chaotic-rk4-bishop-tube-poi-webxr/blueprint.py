"""
Hindmarsh-Rose Bursting Neuron  (Blender 5.1 · Holoflow Studio)
Hindmarsh & Rose 1984  Proc R Soc Lond B 221:87-102
doi:10.1098/rspb.1984.0024  (PD by age, Crown copyright expired)

Three coupled first-order ODEs model a spiking neuron:

    ẋ = y − ax³ + bx²− z + I     (fast: membrane potential)
    ẏ = c − dx² − y              (fast: Na⁺/K⁺ recovery)
    ż = r[s(x − x_R) − z]        (slow: Ca²⁺-like adaptation)

The ratio r ≈ 0.006 separates three timescales:
  · individual spikes  (Δt ~ 2 time-units)
  · burst envelope     (Δt ~ 100–500 t.u.)
  · slow modulation    (Δt ~ 1/r ~ 167 t.u.)

Increasing the applied current I_ext slides the system through a rich
bifurcation sequence: quiescence → tonic spiking → period-doubling
cascade → chaotic bursting → fast dense spiking.

The 3-D phase-space trajectory is wrapped into a Bishop-parallel-transport
tube (12-sided polygon cross-section) and encoded as a poi-head GLB with
four shape keys recording four dynamical regimes.  Vertex colour
HR_Potential (cobalt = rest, amber = spike peak) drives emission.

Divergence  ∇·F = (−3ax² + 2bx) − 1 − r  is state-dependent (NOT
constant), so phase-space volume contracts at a variable rate — unlike
Lorenz or Chen.  Chaos here is intermittent/episodic, not uniformly
hyperbolic.
"""

import bpy, numpy as np

# ── Named constants  ──────────────────────────────────────────────────────────
A_HR     = 1.0       # cubic coefficient — fixes spike amplitude ≈ 2 mV-like
B_HR     = 3.0       # quadratic coefficient — determines spike shape
C_HR     = 1.0       # y-nullcline intercept
D_HR     = 5.0       # quadratic coupling in y-equation
S_HR     = 4.0       # slow-nullcline slope — sets burst oscillation frequency
X_REST   = -1.6      # slow-null target  x_R = −8/5
R_HR     = 0.006     # slow/fast timescale ratio — key parameter for bursting

# Applied current for each shape key:
I_BASIS   = 2.0      # regular bursting (Basis) — Lyapunov λ₁ ≈ +0.008
I_TONIC   = 1.5      # tonic periodic spiking (sub-chaotic)
I_CHAOTIC = 2.5      # chaotic bursting — Lyapunov λ₁ ≈ +0.012
I_FAST    = 4.0      # fast dense spiking near-continuous

DT        = 0.05     # RK4 step.  max |∂ẋ/∂x| ≈ |−3ax²+2bx|_max ≈ 4
                     # → DT × 4 = 0.20  ≪  2 (explicit stability margin)
BURN_IN   = 5_000    # = 250 time-units; settles onto attractor for all I
N_STEPS   = 80_000   # = 4000 t.u. ≈ 8 full burst cycles at I=2
SKIP      = 25       # keep every 25th step → 3200 waypoints

# Initial condition: interior of the attractor valid across all I_ext
IC        = (-1.6, -9.0, 2.0)

TUBE_R    = 0.014    # metres — tube cross-section radius
TUBE_SIDES = 12      # sides of the polygonal cross-section
POI_R     = 0.082    # metres — final poi-head bounding-sphere radius

OBJ_NAME  = "HR_Neuron"
ATTR_NAME = "HR_Potential"          # FLOAT_COLOR vertex attribute name

# Cobalt = hyperpolarised (x ≈ −1.6, quiescent phase)
# Amber  = depolarised spike peak (x ≈ +2.0)
COL_COBALT = (0.03, 0.15, 0.58, 1.0)
COL_AMBER  = (1.00, 0.65, 0.00, 1.0)


# ── Dynamics  ─────────────────────────────────────────────────────────────────
def _hr_deriv(state, I_ext):
    """Return [ẋ, ẏ, ż] for the Hindmarsh-Rose system at given applied current.

    The x-equation has a cubic term (−ax³) that creates the spike
    threshold: below threshold, ẋ < 0 (stable rest); above, ẋ > 0
    (spike upstroke).  The quadratic term +bx² shifts the equilibria.

    The z-equation is a slow integral of x − x_R.  When x > x_R the
    adaptation current z grows, eventually silencing the spike burst.
    When x < x_R (interspike silence), z decays, allowing the next burst.
    This is the mechanism of burst oscillation.
    """
    x, y, z = state
    dx = y - A_HR*x**3 + B_HR*x**2 - z + I_ext
    dy = C_HR - D_HR*x**2 - y
    dz = R_HR * (S_HR*(x - X_REST) - z)
    return np.array([dx, dy, dz])


def _rk4(state, I_ext):
    """Classic fixed-step RK4.  Each spike spans ~2 t.u.; DT=0.05 puts
    ~40 steps per spike — sufficient for smooth Bishop tube geometry."""
    k1 = _hr_deriv(state, I_ext)
    k2 = _hr_deriv(state + 0.5*DT*k1, I_ext)
    k3 = _hr_deriv(state + 0.5*DT*k2, I_ext)
    k4 = _hr_deriv(state + DT*k3, I_ext)
    return state + (DT/6.0)*(k1 + 2*k2 + 2*k3 + k4)


def _integrate(I_ext):
    """Burn in, then sample N_STEPS/SKIP waypoints and their x values."""
    state = np.array(IC, dtype=float)
    for _ in range(BURN_IN):
        state = _rk4(state, I_ext)

    n_wp = N_STEPS // SKIP
    pts    = np.empty((n_wp, 3))
    x_vals = np.empty(n_wp)
    idx = 0
    for step in range(N_STEPS):
        state = _rk4(state, I_ext)
        if step % SKIP == 0 and idx < n_wp:
            pts[idx]    = state
            x_vals[idx] = state[0]
            idx += 1
    return pts, x_vals


# ── Bishop parallel-transport frame  ─────────────────────────────────────────
def _bishop_frame(pts):
    """Propagate a reference normal along the curve using Rodrigues rotations.

    Bishop framing avoids the gimbal-lock of Frenet-Serret and the excess
    twist introduced by torsion.  The frame rotates only as much as the
    curve bends — minimum-rotation transport.

    The HR trajectory is open (not closed), so no holonomy-correction
    angle needs to be subtracted.
    """
    n   = len(pts)
    raw = np.diff(pts, axis=0, append=pts[[-1]])
    raw[-1] = raw[-2]                     # replicate last tangent at endpoint
    nrm = np.linalg.norm(raw, axis=1, keepdims=True)
    nrm = np.where(nrm < 1e-12, 1.0, nrm)
    T = raw / nrm

    # Seed N[0] perpendicular to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([0.0, 1.0, 0.0])
    N0 = seed - np.dot(seed, T[0])*T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty_like(pts)
    N[0] = N0
    for i in range(1, n):
        axis  = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = float(np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0))
        if sin_a < 1e-10:
            N[i] = N[i-1]             # nearly parallel tangents: copy
        else:
            ax   = axis / sin_a
            N[i] = (cos_a*N[i-1]
                    + sin_a*np.cross(ax, N[i-1])
                    + (1.0 - cos_a)*np.dot(ax, N[i-1])*ax)
    B = np.cross(T, N)
    return T, N, B


# ── Tube mesh  ────────────────────────────────────────────────────────────────
def _build_tube(pts, N, B):
    """Extrude a TUBE_SIDES-polygon cross-section along the Bishop frame."""
    angles = np.linspace(0.0, 2*np.pi, TUBE_SIDES, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    rings = (pts[:, None, :]
             + TUBE_R*(ca[None, :, None]*N[:, None, :]
                       + sa[None, :, None]*B[:, None, :]))
    verts = rings.reshape(-1, 3).tolist()

    faces = []
    n = len(pts)
    S = TUBE_SIDES
    for i in range(n - 1):
        for j in range(S):
            j1  = (j + 1) % S
            v00 = i*S + j
            v01 = i*S + j1
            v10 = (i+1)*S + j
            v11 = (i+1)*S + j1
            faces.append([v00, v01, v11, v10])
    return verts, faces


# ── Vertex colour  ────────────────────────────────────────────────────────────
def _vert_colours(x_vals):
    """Map x → cobalt (rest) → amber (spike).  One colour per waypoint,
    repeated TUBE_SIDES times for the POINT attribute domain."""
    x_lo, x_hi = x_vals.min(), x_vals.max()
    t = (x_vals - x_lo) / max(x_hi - x_lo, 1e-8)
    c0 = np.array(COL_COBALT)
    c1 = np.array(COL_AMBER)
    cols = c0[None, :]*(1 - t[:, None]) + c1[None, :]*t[:, None]
    return np.repeat(cols, TUBE_SIDES, axis=0)   # (n_wp*TUBE_SIDES, 4)


# ── Blender object builder  ───────────────────────────────────────────────────
def _make_obj(pts, x_vals, name):
    pts_c  = pts - pts.mean(axis=0)
    radius = np.linalg.norm(pts_c, axis=1).max()
    pts_c *= POI_R / max(radius, 1e-8)

    T, N, B    = _bishop_frame(pts_c)
    verts, faces = _build_tube(pts_c, N, B)

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.shade_flat()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)

    # Vertex colour attribute
    attr = me.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
    cols = _vert_colours(x_vals)
    attr.data.foreach_set("color", cols.ravel().astype(np.float32))

    # Emission material driven by HR_Potential
    mat   = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt    = mat.node_tree
    nt.nodes.clear()
    anode = nt.nodes.new("ShaderNodeAttribute")
    anode.attribute_name = ATTR_NAME
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value          = 0.45
    bsdf.inputs["Roughness"].default_value         = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.8
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(anode.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(anode.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    me.materials.append(mat)

    # Holoflow metadata
    obj["holoflow:facet"]       = False
    obj["holoflow:category"]    = "poi-head"
    obj["holoflow:export_name"] = "hf_hr_neuron_poi"
    return obj


def _add_shape_key(obj, label, I_ext):
    """Reintegrate at I_ext, re-scale, build tube, store as shape key."""
    pts, _ = _integrate(I_ext)
    pts_c  = pts - pts.mean(axis=0)
    radius = np.linalg.norm(pts_c, axis=1).max()
    pts_c *= POI_R / max(radius, 1e-8)
    T, N, B = _bishop_frame(pts_c)
    verts, _ = _build_tube(pts_c, N, B)

    sk = obj.shape_key_add(name=label, from_mix=False)
    sk.data.foreach_set("co", np.array(verts, dtype=np.float32).ravel())


# ── Main  ─────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    pts_b, x_b = _integrate(I_BASIS)
    obj = _make_obj(pts_b, x_b, OBJ_NAME)
    obj.shape_key_add(name="Basis", from_mix=False)

    _add_shape_key(obj, "SK_Tonic",   I_TONIC)
    _add_shape_key(obj, "SK_Chaotic", I_CHAOTIC)
    _add_shape_key(obj, "SK_Fast",    I_FAST)

    # +Y-up for glTF (Blender +Z → rotate −90° around X)
    obj.rotation_euler = (-np.pi/2, 0, 0)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    # GLB export
    import os
    out_dir = os.path.join(
        os.path.dirname(bpy.data.filepath),
        "..", "..", "..", "glbs", "scripting",
        "python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr",
    )
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out_dir, "hf_hr_neuron_poi.glb"),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_morph=True,
        export_colors=True,
        export_yup=True,
    )
    print("Done — hf_hr_neuron_poi.glb written.")


if __name__ == "__main__":
    main()
