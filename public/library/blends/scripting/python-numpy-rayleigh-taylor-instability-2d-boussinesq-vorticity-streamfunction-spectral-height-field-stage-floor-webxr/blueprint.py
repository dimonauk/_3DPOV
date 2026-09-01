"""
blueprint.py — Rayleigh–Taylor Instability (RTI)
2D Incompressible Boussinesq: Vorticity–Streamfunction, Pseudo-Spectral FFT
Stage-floor height-field + 4 shape keys for WebXR  (Blender 5.1)

Physics — why mushroom fingers form:
  A denser fluid resting atop a lighter one is gravitationally unstable.
  The baroclinic mechanism converts misaligned density and pressure gradients
  into vorticity, rolling the interface into mushroom-cap spikes (heavy fluid
  falling) and rising bubbles (light fluid).  Atwood number A = (ρ₂−ρ₁)/(ρ₂+ρ₁)
  controls the contrast; linear growth rate σ = √(Agk) grows with wavenumber k,
  so all modes are equally unstable in inviscid 2-D (no surface tension).

Governing equations (Boussinesq, gravity in −y direction):
  Dω/Dt  = g·A·∂b/∂x    — baroclinic vorticity generation
  Db/Dt  = 0             — buoyancy b = phase field ∈ [−1,+1]  advected passively
  ∇²ψ   = −ω            — Poisson eq for streamfunction ψ
  u = ∂ψ/∂y,  v = −∂ψ/∂x — velocities from ψ
  Integrated pseudo-spectrally: each ∂/∂x,∂/∂y ↔ i·kx,i·ky in FFT space,
  Poisson solved exactly as ψ̂ = ω̂/|k|².  2/3-rule (Orszag 1971) dealiases.

Sources:
  Lord Rayleigh  1882  "Investigation of the character of the equilibrium of an
    incompressible heavy fluid of variable density"  Proc London Math Soc 14:170.
    Public Domain.
  G. I. Taylor  1950  "The instability of liquid surfaces when accelerated in a
    direction perpendicular to their planes"  Proc R Soc Lond A 201:192–196.
    Public Domain — equations only.
  J. C. Sprott  spectralDNS-style approach  MIT code reference.
"""
import bpy, bmesh, numpy as np

# ── PARAMETERS ─────────────────────────────────────────────────────────────
N         = 64           # grid resolution N×N (doubly periodic domain)
L         = 2.0*np.pi   # domain side length (simulation units)
GRAVITY   = 1.0          # g (simulation units; sets time scale)
ATWOOD_B  = 0.50         # Atwood number for Basis / SK_Fingers / SK_Mushroom
ATWOOD_HI = 0.85         # SK_HighA: stronger density contrast, faster growth
DELTA     = 0.18         # tanh interface half-thickness
N_MODE    = 2            # number of cosine perturbation modes
EPSILON   = 0.08         # perturbation amplitude (fraction of domain half-width)
DT        = 0.025        # RK4 time step (CFL safe for N=64)
T_SNAP    = [2.0, 4.5, 7.0]  # shape-key snapshot times: linear / fingers / mushroom
CELL_M    = 0.09         # Blender metres per simulation cell
HEIGHT_M  = 0.55         # |b|=1 maps to ±HEIGHT_M metres in z
OBJ_NAME  = "RTI_Floor"
COL_NAME  = "hf_rti"

# ── SPECTRAL INFRASTRUCTURE ────────────────────────────────────────────────
# Wavenumber arrays for doubly-periodic domain [0,L]²
_k1d  = np.fft.fftfreq(N) * (N * 2*np.pi / L)    # rad/unit; shape (N,)
KX, KY = np.meshgrid(_k1d, _k1d, indexing='ij')   # (N,N) each
K2  = KX**2 + KY**2
K2[0, 0] = 1.0   # prevent /0 at DC; streamfunction has zero mean anyway

# Orszag 2/3-rule dealiasing: zero modes |k_index| > N/3
_ki   = np.abs(np.fft.fftfreq(N) * N).astype(int) # integer mode index (N,)
DE    = np.outer(_ki <= N//3, _ki <= N//3)          # bool mask (N,N)

IKX   = 1j * KX * DE    # spectral ∂/∂x operator (dealiased)
IKY   = 1j * KY * DE    # spectral ∂/∂y operator

# ── INITIAL CONDITION ──────────────────────────────────────────────────────
def initial_state():
    """Perturbed heavy-over-light interface; ω=0, b=+1 (heavy) above, −1 below."""
    dx = L / N
    x  = np.arange(N) * dx
    XX, YY = np.meshgrid(x, x, indexing='ij')
    # Superpose N_MODE sinusoidal modes for a multi-mode perturbation
    pert = sum(np.cos(m * 2*np.pi * XX / L) for m in range(1, N_MODE+1))
    y_int = L/2 + EPSILON * (L / (2*N_MODE)) * pert
    # Smooth tanh field: b → +1 above interface (heavy), −1 below (light)
    b     = -np.tanh((YY - y_int) / DELTA)
    omega = np.zeros((N, N))
    return omega, b

# ── DYNAMICS ───────────────────────────────────────────────────────────────
def rhs(omega, b, atwood):
    """Boussinesq RTI right-hand side: returns (d_omega/dt, db/dt)."""
    w_hat = np.fft.fft2(omega) * DE
    b_hat = np.fft.fft2(b)    * DE
    # Streamfunction: ψ̂ = ω̂ / |k|²
    psi_hat = w_hat / K2
    psi_hat[0, 0] = 0.0      # enforce zero-mean streamfunction

    # Velocities in physical space
    u = np.real(np.fft.ifft2(IKY * psi_hat))    # u  = ∂ψ/∂y
    v = np.real(np.fft.ifft2(-IKX * psi_hat))   # v  = −∂ψ/∂x

    # Gradient fields (physical space, dealiased)
    dw_dx = np.real(np.fft.ifft2(IKX * w_hat))
    dw_dy = np.real(np.fft.ifft2(IKY * w_hat))
    db_dx = np.real(np.fft.ifft2(IKX * b_hat))
    db_dy = np.real(np.fft.ifft2(IKY * b_hat))

    # Boussinesq vorticity eq: Dω/Dt = g·A·∂b/∂x (baroclinic generation)
    # Sign: ∂b/∂x > 0 where interface tilts heavy-fluid side into light-fluid
    # side going right → generates CCW vorticity that drives mushroom upward.
    d_omega = -(u*dw_dx + v*dw_dy) + GRAVITY * atwood * db_dx
    d_b     = -(u*db_dx + v*db_dy)
    return d_omega, d_b

def rk4_step(omega, b, dt, atwood):
    """Classical 4th-order Runge–Kutta step."""
    k1w, k1b = rhs(omega,           b,           atwood)
    k2w, k2b = rhs(omega+dt/2*k1w, b+dt/2*k1b, atwood)
    k3w, k3b = rhs(omega+dt/2*k2w, b+dt/2*k2b, atwood)
    k4w, k4b = rhs(omega+dt  *k3w, b+dt  *k3b, atwood)
    new_omega = omega + (dt/6)*(k1w + 2*k2w + 2*k3w + k4w)
    new_b     = b     + (dt/6)*(k1b + 2*k2b + 2*k3b + k4b)
    return new_omega, new_b

def simulate_snapshots(t_snaps, atwood):
    """Run from t=0; return list of (omega, b) at each time in t_snaps."""
    omega, b = initial_state()
    t = 0.0
    results = []
    for t_target in sorted(t_snaps):
        while t < t_target - 1e-10:
            step = min(DT, t_target - t)
            omega, b = rk4_step(omega, b, step, atwood)
            t += step
        results.append((omega.copy(), b.copy()))
    return results

# ── MESH CONSTRUCTION ──────────────────────────────────────────────────────
def _sk_co(b_field):
    """Flat float32 list [x0,y0,z0, x1,y1,z1, …] for shape_key foreach_set."""
    i_idx = np.repeat(np.arange(N), N)
    j_idx = np.tile(np.arange(N), N)
    X = (i_idx * CELL_M).astype(np.float32)
    Y = (j_idx * CELL_M).astype(np.float32)
    Z = (b_field.ravel() * HEIGHT_M).astype(np.float32)
    return np.column_stack([X, Y, Z]).ravel().tolist()

def build_floor(b_basis):
    """Create N×N quad mesh with z = b_basis * HEIGHT_M."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    col = bpy.data.collections.new(COL_NAME)
    bpy.context.scene.collection.children.link(col)

    verts, faces = [], []
    Z = b_basis * HEIGHT_M
    for i in range(N):
        for j in range(N):
            verts.append((i*CELL_M, j*CELL_M, float(Z[i, j])))
    for i in range(N-1):
        for j in range(N-1):
            v00, v10 = i*N+j, (i+1)*N+j
            v11, v01 = (i+1)*N+(j+1), i*N+(j+1)
            faces.append((v00, v10, v11, v01))

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(OBJ_NAME, me)
    col.objects.link(ob)
    bpy.context.view_layer.layer_collection.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    return ob

def add_shape_key(ob, name, b_field):
    """Append shape key with z = b_field * HEIGHT_M."""
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set("co", _sk_co(b_field))
    ob.data.shape_keys.key_blocks[name].value = 0.0

def add_vertex_color(ob, omega_field):
    """RTI_Omega FLOAT_COLOR: cobalt (ω<0 CCW) ↔ amber (ω>0 CW)."""
    me = ob.data
    if "RTI_Omega" not in me.color_attributes:
        me.color_attributes.new("RTI_Omega", 'FLOAT_COLOR', 'POINT')
    attr  = me.color_attributes["RTI_Omega"]
    COBALT = np.array([0.06, 0.14, 0.66, 1.0])
    AMBER  = np.array([0.88, 0.52, 0.04, 1.0])
    flat   = omega_field.ravel().astype(float)
    pct    = max(np.percentile(np.abs(flat), 98), 1e-6)
    t      = np.clip(flat / pct, -1.0, 1.0) * 0.5 + 0.5   # [0,1]
    cols   = np.outer(1-t, COBALT) + np.outer(t, AMBER)    # (N², 4)
    attr.data.foreach_set("color", cols.ravel().tolist())

def add_material(ob):
    mat  = bpy.data.materials.new("RTI_Mat")
    mat.use_nodes = True
    nt   = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = "RTI_Omega"
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1.8
    bsdf.inputs['Metallic'].default_value          = 0.30
    bsdf.inputs['Roughness'].default_value         = 0.38
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    ob.data.materials.append(mat)

# ── MAIN ───────────────────────────────────────────────────────────────────
print("RTI: Simulating A=%.2f snapshots at t=%s …" % (ATWOOD_B, T_SNAP))
snaps_b = simulate_snapshots(T_SNAP, ATWOOD_B)           # 3 snapshots
omega0, b0 = snaps_b[0]
omega1, b1 = snaps_b[1]
omega2, b2 = snaps_b[2]

print("RTI: Simulating SK_HighA A=%.2f at t=%.1f …" % (ATWOOD_HI, T_SNAP[1]))
[(omega_hi, b_hi)] = simulate_snapshots([T_SNAP[1]], ATWOOD_HI)

ob = build_floor(b0)

# Basis shape key (mirrors the mesh-build positions)
ob.shape_key_add(name="Basis", from_mix=False)
ob.data.shape_keys.key_blocks["Basis"].data.foreach_set("co", _sk_co(b0))

add_shape_key(ob, "SK_Fingers",  b1)
add_shape_key(ob, "SK_Mushroom", b2)
add_shape_key(ob, "SK_HighA",    b_hi)

# Vertex colour from SK_Mushroom vorticity (most dramatic stage)
add_vertex_color(ob, omega2)
add_material(ob)

# +Y-up for WebXR / holoflow export
ob.rotation_euler = (np.pi/2, 0, 0)
bpy.ops.object.transform_apply(rotation=True)

ob['holoflow:facet']       = False
ob['holoflow:category']    = 'stage-floor'
ob['holoflow:export_name'] = 'rti_floor'

print("RTI blueprint done — %d vertices, %d quads." % (
    len(ob.data.vertices), len(ob.data.polygons)))
