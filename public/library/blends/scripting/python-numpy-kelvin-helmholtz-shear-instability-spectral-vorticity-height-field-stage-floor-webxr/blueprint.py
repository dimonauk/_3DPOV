"""
Kelvin–Helmholtz Shear Instability — Blender 5.1 Blueprint
===========================================================
Pure bpy + numpy.  Run via Text Editor ▸ Run Script, or headlessly:
    blender --background --python blueprint.py

WHY THIS TECHNIQUE
------------------
Two fluid layers with opposing velocities share an interface under zero
surface tension.  Any perturbation creates a horizontal pressure gradient
that feeds back into the perturbation — positive feedback drives exponential
growth at rate σ(k) = k·U₀/2 for a step-profile shear layer (Kelvin 1871).
A smoothed tanh profile suppresses short-wave growth; the most-unstable
wavenumber is k* ≈ 0.45/δ where δ is the shear-layer thickness (Michalke 1964).

Miles–Howard criterion (1961): instability requires the bulk Richardson
number Ri = N²/(∂U/∂y)² < 0.25 somewhere in the flow.  This simulation
has Ri = 0 everywhere (neutral stratification), so the entire shear layer
is unstable and rolls up into cat's-eye billows.

NUMERICAL METHOD: 2-D inviscid Euler, vorticity–streamfunction form.
  Material conservation of vorticity:   Dω/Dt = 0
  Poisson relation (stream function):   ∇²ψ  = −ω
  Velocity recovery:                    u = ∂ψ/∂y,  v = −∂ψ/∂x
Spatial discretisation: pseudo-spectral FFT (Cooley–Tukey, O(N²logN)).
Dealiasing: Orszag 2/3 rule — zero the outer third of Fourier modes before
each physical-space multiplication to avoid aliasing error accumulation.
Time integration: classical RK4 with fixed step Δt = 0.025.

OUTPUT
------
128×128 = 16 384-vertex height-field stage floor.
Vertex attribute KH_Vorticity FLOAT_COLOR (cobalt = CCW, amber = CW).
Four shape keys: Basis (t=0) → SK_t20 → SK_t40 → SK_t60.
"""

import bpy, bmesh, math
import numpy as np

# ─── Named constants ────────────────────────────────────────────────────────

NX, NY    = 128, 128                # grid resolution; must be even for FFT
LX, LY    = 4 * math.pi, 2 * math.pi  # periodic domain [0,Lx]×[-Ly/2,Ly/2]
U0        = 1.0                     # shear velocity half-amplitude [model units]
DELTA     = 0.2                     # tanh shear-layer half-thickness
EPS       = 1e-3                    # initial perturbation amplitude
DT        = 0.025                   # RK4 time step (CFL ≈ 0.25 at NX=128)
SNAP_T    = [0.0, 20.0, 40.0, 60.0]  # simulation times for shape keys
MESH_SZ   = 4.0                     # Blender stage floor half-extent [m]
Z_SCALE   = 0.35                    # maximum height excursion [m]
OBJ_NAME  = "KH_StageFloor"
# Cobalt (CCW vorticity, ω < 0) and Amber (CW vorticity, ω > 0) — studio palette
COBALT    = (0.03, 0.15, 0.58, 1.0)
AMBER     = (1.00, 0.65, 0.00, 1.0)

# ─── Spectral infrastructure ────────────────────────────────────────────────

def make_wavenumbers():
    """Wavenumber arrays and Orszag 2/3-rule dealiasing mask."""
    # fftfreq gives cycles/sample; multiply by 2π and divide by spacing
    kx = np.fft.fftfreq(NX) * NX * (2 * math.pi / LX)
    ky = np.fft.fftfreq(NY) * NY * (2 * math.pi / LY)
    KX, KY = np.meshgrid(kx, ky, indexing='ij')
    K2 = KX**2 + KY**2
    K2[0, 0] = 1.0           # guard: DC Poisson mode set to 1 (ψ̂₀₀ = 0 below)
    # 2/3 rule: discard wavenumbers |k| > (N/2)·(2/3) = N/3
    mask = (np.abs(KX) <= NX * math.pi / LX * (2.0 / 3.0)) & \
           (np.abs(KY) <= NY * math.pi / LY * (2.0 / 3.0))
    return KX, KY, K2, mask


# ─── Simulation ─────────────────────────────────────────────────────────────

def initial_vorticity():
    """
    Base flow:  U(y) = U₀·tanh(y/δ)  →  ω₀ = −∂U/∂y = −U₀/(δ·cosh²(y/δ))
    Perturbation: one full wavelength in x with Gaussian envelope in y.
    Fastest-growing inviscid mode: k_max·δ ≈ 0.45 (Michalke 1964),
    here seeded by kx = 2π/Lx (one wavelength across the domain).
    """
    x = np.linspace(0, LX, NX, endpoint=False)
    y = np.linspace(-LY / 2, LY / 2, NY, endpoint=False)
    X, Y = np.meshgrid(x, y, indexing='ij')
    omega = -U0 / (DELTA * np.cosh(Y / DELTA)**2)
    omega += EPS * np.sin(2 * math.pi * X / LX) * np.exp(-Y**2 / (2 * DELTA**2))
    return omega


def spectral_rhs(omega_hat, KX, KY, K2, mask):
    """
    Euler vorticity RHS in spectral space.

    ψ̂ = ω̂ / k²                    (Poisson solve: one FFT division)
    û  = ik_y ψ̂,  v̂ = −ik_x ψ̂   (velocity from streamfunction)
    ∂ω̂/∂x = ik_x ω̂,  ∂ω̂/∂y = ik_y ω̂
    advection = IFFT(û·mask)·IFFT(∂ω/∂x·mask) + IFFT(v̂·mask)·IFFT(∂ω/∂y·mask)
    RHS = −FFT(advection) · mask          (apply dealiasing after transform)
    """
    psi_hat  = omega_hat / K2
    psi_hat[0, 0] = 0.0                            # zero mean streamfunction
    u   = np.fft.ifft2(np.where(mask, 1j * KY * psi_hat,  0.0)).real
    v   = np.fft.ifft2(np.where(mask, -1j * KX * psi_hat, 0.0)).real
    dwx = np.fft.ifft2(np.where(mask, 1j * KX * omega_hat, 0.0)).real
    dwy = np.fft.ifft2(np.where(mask, 1j * KY * omega_hat, 0.0)).real
    adv = np.fft.fft2(u * dwx + v * dwy)
    return np.where(mask, -adv, 0.0)


def rk4_advance(omega_hat, KX, KY, K2, mask, dt):
    """One RK4 step.  All operations in spectral space except advection."""
    k1 = spectral_rhs(omega_hat,            KX, KY, K2, mask)
    k2 = spectral_rhs(omega_hat + 0.5*dt*k1, KX, KY, K2, mask)
    k3 = spectral_rhs(omega_hat + 0.5*dt*k2, KX, KY, K2, mask)
    k4 = spectral_rhs(omega_hat +     dt*k3, KX, KY, K2, mask)
    return omega_hat + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def run_to(omega_hat, KX, KY, K2, mask, t_end, t_now=0.0, dt=DT):
    """Integrate from t_now to t_end with fixed step dt."""
    t = t_now
    while t < t_end - 1e-10:
        step = min(dt, t_end - t)
        omega_hat = rk4_advance(omega_hat, KX, KY, K2, mask, step)
        t += step
    return omega_hat


def gather_snapshots():
    """Integrate to each SNAP_T; return list of physical-space vorticity arrays."""
    KX, KY, K2, mask = make_wavenumbers()
    omega0   = initial_vorticity()
    omega_hat = np.fft.fft2(omega0)
    snaps, t_prev = [], 0.0
    for t_target in SNAP_T:
        if t_target > t_prev:
            omega_hat = run_to(omega_hat, KX, KY, K2, mask, t_target, t_prev)
            t_prev = t_target
        snaps.append(np.fft.ifft2(omega_hat).real.copy())
    return snaps                                   # list of NX×NY arrays


# ─── Blender mesh ───────────────────────────────────────────────────────────

def to_height(omega):
    """Map vorticity array to height in [−Z_SCALE/2, +Z_SCALE/2]."""
    lo, hi = omega.min(), omega.max()
    return (omega - lo) / max(hi - lo, 1e-9) * Z_SCALE - Z_SCALE / 2.0


def build_scene(snaps):
    """Delete existing objects; create grid mesh with shape keys and colour."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bm   = bmesh.new()
    xs   = np.linspace(-MESH_SZ / 2, MESH_SZ / 2, NX)
    ys   = np.linspace(-MESH_SZ / 2, MESH_SZ / 2, NY)
    z0   = to_height(snaps[0])

    # Build vertex grid — row-major: vi = i*NY + j
    grid = [[bm.verts.new((xs[i], ys[j], float(z0[i, j])))
             for j in range(NY)] for i in range(NX)]
    bm.verts.ensure_lookup_table()

    # Quad faces: (NX−1)×(NY−1) quads
    for i in range(NX - 1):
        for j in range(NY - 1):
            bm.faces.new((grid[i][j], grid[i+1][j],
                          grid[i+1][j+1], grid[i][j+1]))
    bm.to_mesh(mesh)
    bm.free()

    # ── Shape keys ──────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    sk_names = ["SK_t20", "SK_t40", "SK_t60"]
    for snap, sname in zip(snaps[1:], sk_names):
        sk = obj.shape_key_add(name=sname, from_mix=False)
        zn = to_height(snap)
        for vi in range(NX * NY):
            i, j = divmod(vi, NY)
            sk.data[vi].co = (xs[i], ys[j], float(zn[i, j]))

    # ── FLOAT_COLOR attribute ────────────────────────────────────────────────
    # WHY FLOAT_COLOR and not BYTE_COLOR: float preserves HDR range needed for
    # emission; Principled BSDF + Emission feeds into bloom in Eevee Next.
    attr    = mesh.attributes.new("KH_Vorticity", 'FLOAT_COLOR', 'POINT')
    omega0f = snaps[0].flatten(order='C')          # row-major matches vi=i*NY+j
    lo, hi  = omega0f.min(), omega0f.max()
    span    = max(hi - lo, 1e-9)
    for vi in range(NX * NY):
        t = (omega0f[vi] - lo) / span              # 0 (cobalt) → 1 (amber)
        attr.data[vi].color = tuple(
            COBALT[c] * (1 - t) + AMBER[c] * t for c in range(4))

    return obj


def setup_shader(obj):
    """KH_Vorticity → Base Color + Emission on Principled BSDF (Eevee Next)."""
    mat = bpy.data.materials.new("KH_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = "KH_Vorticity"
    attr.attribute_type = 'GEOMETRY'
    attr.location = (-400, 200)

    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value   = 0.20
    bsdf.inputs['Roughness'].default_value  = 0.55
    bsdf.inputs['Emission Strength'].default_value = 1.4
    bsdf.location = (-100, 200)

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (300, 200)

    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Emission Color'])
    nt.links.new(bsdf.outputs['BSDF'],  out.inputs['Surface'])

    obj.data.materials.append(mat)


def main():
    print("KH blueprint: gathering simulation snapshots…")
    snaps = gather_snapshots()
    print("KH blueprint: building mesh in Blender…")
    obj = build_scene(snaps)
    setup_shader(obj)
    print(f"KH blueprint: complete — '{obj.name}' ready for export.")


main()
