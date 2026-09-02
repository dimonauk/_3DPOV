"""
Kuramoto–Sivashinsky PDE (1977) — Spatiotemporal Flame-Front Chaos
Stage-Floor Height-Field for WebXR (Blender 5.1 / bpy)
=============================================================
Sources (equations — public-domain mathematical facts):
  Kuramoto Y, Tsuzuki T (1976). Persistent propagation of concentration waves
  in dissipative media far from thermal equilibrium.
  Prog. Theor. Phys. 55(2):356–369. DOI 10.1143/PTP.55.356
  Sivashinsky GI (1977). Nonlinear analysis of hydrodynamic instability in
  laminar flames I — Derivation of basic equations. Acta Astronautica
  4(11-12):1177–1206. DOI 10.1016/0094-5765(77)90096-0
  Kassam AK, Trefethen LN (2005). Fourth-order time-stepping for stiff PDEs.
  SIAM J. Sci. Comput. 26(4):1214–1233. (ETDRK4 reference; Chebfun MIT)

TECHNIQUE — KS EQUATION AND SPECTRAL RK4
──────────────────────────────────────────
The Kuramoto–Sivashinsky equation:

    u_t + u·u_x + u_xx + u_xxxx = 0     on [0, L] periodic

has four terms, each indispensable:

  − u_xx      negative viscosity  → energy injection near k* = 1/√2
  + u_xxxx    hyperdiffusion      → energy sink at high k (surface tension)
  + u·u_x     nonlinear advection → energy cascade across scales

Linear stability: σ(k) = k² − k⁴.  Maximum growth at k* = 1/√2, rate σ* = 1/4.
Turbulence develops for L > 2π (first unstable mode k=2π/L < 1).

NUMERICAL METHOD — SPECTRAL RK4
 Represent u(x,t) by its real-FFT û_k(t) = rfft(u)[k].
 The KS ODE in Fourier space is:
    dû_k/dt = (k² − k⁴)û_k − ik · rfft(u²/2)
 WHY u²/2: the nonlinear term u·u_x = ∂(u²/2)/∂x; taking the derivative
 spectrally (multiply by ik) avoids an aliased convolution.
 RK4 is applied directly; timestep Δt < 2.79/max|k⁴−k²| ≈ 0.017 for N=128.
 This explicit scheme is sufficient because max|Lk| is modest at N=128.

MESH — SPACE-TIME HEIGHT FIELD
 Axes:  column index → x (space), row index → t (time).
 Height: u(x,t)·HEIGHT_SC gives the classic "wavy cell" pattern.
 Shape keys let the viewer scrub through different regimes without re-running.

Shape keys:
  Basis    L=36π, t_rec=100  canonical turbulence (~12 active modes)
  SK_Early L=36π, t_rec=30   developing turbulence (cells just forming)
  SK_SmL   L=16π, t_rec=100  near-onset, quasi-periodic modulated waves
  SK_LgL   L=72π, t_rec=100  large-domain, hierarchical multi-scale chaos

holoflow: stage-floor | facet=False | category=scripting
"""

import bpy
import numpy as np
from numpy.fft import rfft, irfft

# ── PARAMETERS ─────────────────────────────────────────────────────────────────
N         = 128            # spatial Fourier modes (power-of-2 for FFT)
L_BASIS   = 36.0 * np.pi  # canonical L; ~12.7 unstable wavelengths
L_SMALL   = 16.0 * np.pi  # near-onset; ~5 wavelengths → quasi-periodic
L_LARGE   = 72.0 * np.pi  # large domain; ~25 wavelengths → complex patterns
DT        = 0.015          # RK4 Δt; CFL limit ≈ 0.0174 for L_BASIS, N=128
T_WARMUP  = 100.0          # transient to discard [problem units]
T_REC_B   = 100.0          # recording window for Basis/SK_SmL/SK_LgL
T_REC_E   = 30.0           # recording window for SK_Early
N_SNAP    = 128            # time snapshots → 128×128 mesh
CELL_X    = 0.09           # x mesh spacing [m]
CELL_T    = 0.06           # t mesh spacing [m]
HEIGHT_SC = 0.38           # height scale [m]
OBJ_NAME  = "ks_floor"
# Cobalt→Amber colour ramp (negative u → positive u)
COBALT    = np.array([0.02, 0.10, 0.55, 1.0], dtype=np.float32)
AMBER     = np.array([0.95, 0.60, 0.00, 1.0], dtype=np.float32)


# ── SPECTRAL SOLVER ────────────────────────────────────────────────────────────
def wavenum(L):
    """Real-FFT wavenumbers k_n = 2π·n / L for n = 0 … N/2."""
    return 2.0 * np.pi / L * np.arange(N // 2 + 1)

def ks_rhs(u_hat, k):
    """KS right-hand side in Fourier space.
    Linear:    (k²−k⁴)·û  — bandpass instability.
    Nonlinear: −ik·FT(u²/2)  — pseudo-spectral to minimise aliasing.
    """
    u  = irfft(u_hat, n=N)
    nl = rfft(0.5 * u * u)
    return (k * k - k**4) * u_hat - 1j * k * nl

def rk4_step(u_hat, k):
    f1 = ks_rhs(u_hat,              k)
    f2 = ks_rhs(u_hat + .5*DT * f1, k)
    f3 = ks_rhs(u_hat + .5*DT * f2, k)
    f4 = ks_rhs(u_hat +    DT * f3, k)
    return u_hat + (DT / 6.0) * (f1 + 2*f2 + 2*f3 + f4)

def simulate(L, t_warmup, t_rec, seed=42):
    """Integrate KS, return (N_SNAP, N) space-time snapshot matrix."""
    k    = wavenum(L)
    rng  = np.random.default_rng(seed)
    u_h  = rng.standard_normal(N // 2 + 1).astype(complex)
    u_h *= 0.02                       # small-amplitude IC
    u_h[0]       = 0.0               # enforce zero mean
    u_h[N // 4:] = 0.0               # keep only long-wave modes in IC

    # Burn-in: discard transient approach to attractor
    for _ in range(int(t_warmup / DT)):
        u_h = rk4_step(u_h, k)

    # Record snapshots uniformly in time
    n_rec  = int(t_rec / DT)
    stride = max(1, n_rec // N_SNAP)
    snaps  = []
    for i in range(n_rec):
        u_h = rk4_step(u_h, k)
        if i % stride == 0 and len(snaps) < N_SNAP:
            snaps.append(irfft(u_h, n=N).astype(np.float32))

    return np.array(snaps[:N_SNAP])   # (N_SNAP, N)


# ── MESH GEOMETRY ──────────────────────────────────────────────────────────────
def make_verts(u_mat):
    """Vectorised (N_SNAP*N, 3) float32 vertex positions."""
    n_t, n_x = u_mat.shape
    it = np.repeat(np.arange(n_t), n_x)
    ix = np.tile(  np.arange(n_x), n_t)
    return np.column_stack([
        ix * CELL_X, it * CELL_T, u_mat.ravel() * HEIGHT_SC
    ]).astype(np.float32)

def make_quads(n_t, n_x):
    """Vectorised (n_t-1)*(n_x-1) quad face array."""
    it = np.repeat(np.arange(n_t - 1), n_x - 1)
    ix = np.tile(  np.arange(n_x - 1), n_t - 1)
    a  = it * n_x + ix
    return np.column_stack([a, a + 1, (it+1)*n_x+ix+1, (it+1)*n_x+ix]).tolist()

def set_colour(mesh, u_mat):
    """FLOAT_COLOR POINT attribute: cobalt (u<0) → amber (u>0)."""
    uv = u_mat.ravel()
    lo = float(np.percentile(uv, 2)); hi = float(np.percentile(uv, 98))
    t  = np.clip((uv - lo) / max(hi - lo, 1e-9), 0.0, 1.0)
    c  = (np.outer(1 - t, COBALT) + np.outer(t, AMBER)).astype(np.float32)
    attr = mesh.color_attributes.new("KS_Value", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", c.ravel())


# ── MATERIAL ───────────────────────────────────────────────────────────────────
def make_material():
    m  = bpy.data.materials.new(OBJ_NAME + "_mat")
    m.use_nodes = True
    nt = m.node_tree
    pb = nt.nodes.get("Principled BSDF")
    att = nt.nodes.new("ShaderNodeAttribute")
    att.attribute_name = "KS_Value"
    nt.links.new(att.outputs["Color"], pb.inputs["Base Color"])
    nt.links.new(att.outputs["Color"], pb.inputs["Emission Color"])
    pb.inputs["Emission Strength"].default_value = 1.6
    pb.inputs["Roughness"].default_value         = 0.72
    pb.inputs["Metallic"].default_value          = 0.18
    return m


# ── MAIN ───────────────────────────────────────────────────────────────────────
def main():
    # Clean slate
    for o in list(bpy.data.objects):
        if o.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        if m.name.startswith(OBJ_NAME):
            bpy.data.meshes.remove(m)

    print("[KS] Simulating Basis (L=36π, t_rec=100)…")
    mat_b = simulate(L_BASIS, T_WARMUP, T_REC_B, seed=42)
    print("[KS] Simulating SK_Early (L=36π, t_rec=30)…")
    mat_e = simulate(L_BASIS, T_WARMUP, T_REC_E, seed=42)
    print("[KS] Simulating SK_SmL  (L=16π, t_rec=100)…")
    mat_s = simulate(L_SMALL, T_WARMUP, T_REC_B, seed=42)
    print("[KS] Simulating SK_LgL  (L=72π, t_rec=100)…")
    mat_l = simulate(L_LARGE, T_WARMUP, T_REC_B, seed=7)

    # Build Basis mesh
    mesh = bpy.data.meshes.new(OBJ_NAME)
    v0   = make_verts(mat_b)
    mesh.from_pydata(v0.tolist(), [], make_quads(*mat_b.shape))
    mesh.update()
    set_colour(mesh, mat_b)

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Shape keys — Basis first, then variants
    obj.shape_key_add(name="Basis", from_mix=False)
    nb = len(mesh.vertices)
    for sk_name, mat in [("SK_Early", mat_e), ("SK_SmL", mat_s), ("SK_LgL", mat_l)]:
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        co = make_verts(mat)
        n  = len(co)
        if n > nb: co = co[:nb]
        elif n < nb:
            co = np.vstack([co, np.zeros((nb - n, 3), dtype=np.float32)])
        sk.data.foreach_set("co", co.ravel())

    # Material
    mat_bl = make_material()
    obj.data.materials.append(mat_bl)

    # +Y-up convention: stage floor lies in XZ plane → rotate −90° around X
    obj.rotation_euler = (np.pi / 2, 0, 0)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="MEDIAN")
    obj.location = (0, 0, 0)

    # Set custom property for holoflow exporter
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "stage-floor"

    # GLB export
    import os
    blend_dir = os.path.dirname(bpy.data.filepath) or "/tmp"
    out_glb   = os.path.join(blend_dir, "ks_floor.glb")
    bpy.ops.export_scene.gltf(
        filepath                              = out_glb,
        export_format                         = "GLB",
        use_selection                         = True,
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = 6,
        export_morph                          = True,
        export_colors                         = True,
        export_yup                            = True,
    )
    print(f"[KS] ✓ Exported → {out_glb}")

main()
