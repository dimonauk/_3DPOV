"""
TDSE Split-Operator FFT — Double-Slit Quantum Interference on a Flat Mesh
Blender 5.1 / numpy  (Holoflow Studio — CC0)

Physics (ℏ = 1, m = 0.5 → ℏ²/(2m) = 1):
  iℏ ∂ψ/∂t = [−ℏ²/(2m) ∇² + V] ψ

Strang splitting for one timestep DT:
  ψ(t+DT) ≈ e^{−iV·DT/2} · IFFT2[ e^{−ik²·DT} · FFT2(ψ) ] · e^{−iV·DT/2}

The kinetic operator in momentum space: K̂ψ̂ = k²ψ̂  (with ℏ²/2m = 1).
Each of the three sub-steps is exactly unitary, so norm is conserved to
machine precision on any time-step size — no CFL stability constraint.

Output: probability density |ψ|² as vertex height, wave phase arg(ψ) as
        HSV hue → vertex colour (BYTE_COLOR), exported as hf_tdse.glb.
"""

import bpy
import bmesh
import numpy as np

# ── grid & physics ────────────────────────────────────────────────────────────
N          = 64            # grid size (N×N verts, (N-1)² quad faces)
L          = 2 * np.pi    # domain length; periodic BCs via FFT
DT         = 0.01          # timestep in natural units (ℏ=1, m=0.5)
N_STEPS    = 40            # integration steps  (t_final = DT×N_STEPS = 0.40)
LOG_EVERY  = 10            # console output interval

# ── initial wavepacket ────────────────────────────────────────────────────────
K0         = 8.0           # rightward momentum → group velocity vg = 2·K0·(ℏ/m) = 16
SIGMA      = 0.5           # Gaussian half-width in domain units
X0         = L / 4        # packet starts at 1/4 domain, heading right
Y0         = L / 2        # centred on y-axis

# ── double-slit barrier (thin vertical wall at x = BARRIER_X) ────────────────
BARRIER_X  = L / 2        # barrier at domain midpoint
BARRIER_W  = 2             # wall half-thickness in grid cells
V0         = 500.0         # barrier height  (>> KE = K0² = 64 → nearly opaque)
SLIT_W     = L / 12       # each slit full-width  ≈ 0.524  (< λ = 2π/K0 ≈ 0.785)
SLIT_SEP   = L / 4        # slit centre separation ≈ 1.571  (≈ 2λ)

# ── mesh & export ─────────────────────────────────────────────────────────────
DISP_SCALE = 0.04          # |ψ|² peak height in metres (4 cm)
MESH_SCALE = 0.28          # physical xy extent of mesh (0.28 m × 0.28 m)
MESH_NAME  = "hf_tdse"
OUTPUT_GLB = "//hf_tdse.glb"

# ══════════════════════════════════════════════════════════════════════════════

def make_grid():
    dx = L / N
    x = np.arange(N) * dx
    y = np.arange(N) * dx
    return np.meshgrid(x, y, indexing="ij")   # XX[i,j] = x[i], YY[i,j] = y[j]


def init_wavepacket(XX, YY):
    dx = L / N
    psi = np.exp(-((XX - X0)**2 + (YY - Y0)**2) / (4 * SIGMA**2)).astype(complex)
    psi *= np.exp(1j * K0 * XX)
    norm = np.sqrt((np.abs(psi)**2).sum() * dx**2)
    return psi / norm


def make_barrier(XX, YY):
    dx = L / N
    V = np.zeros((N, N))
    wall = np.abs(XX - BARRIER_X) < BARRIER_W * dx
    slit1 = np.abs(YY - (Y0 - SLIT_SEP / 2)) < SLIT_W / 2
    slit2 = np.abs(YY - (Y0 + SLIT_SEP / 2)) < SLIT_W / 2
    V[wall & ~(slit1 | slit2)] = V0
    return V


def build_propagators(V):
    dx = L / N
    kx_1d = 2 * np.pi * np.fft.fftfreq(N, d=dx)
    KX, KY = np.meshgrid(kx_1d, kx_1d, indexing="ij")
    K2 = KX**2 + KY**2
    exp_T = np.exp(-1j * K2 * DT)          # kinetic full-step (m=0.5 → ℏ²/2m=1)
    exp_V = np.exp(-1j * V * DT / 2)       # potential half-step
    return exp_T, exp_V


def step(psi, exp_T, exp_V):
    psi = psi * exp_V
    psi_k = np.fft.fft2(psi)
    psi_k = psi_k * exp_T
    psi = np.fft.ifft2(psi_k)
    psi = psi * exp_V
    return psi


def simulate(psi0, V):
    exp_T, exp_V = build_propagators(V)
    dx = L / N
    psi = psi0.copy()
    for i in range(N_STEPS):
        psi = step(psi, exp_T, exp_V)
        if i % LOG_EVERY == LOG_EVERY - 1:
            norm = (np.abs(psi)**2).sum() * dx**2
            pk   = (np.abs(psi)**2).max()
            print(f"  step {i+1:3d}/{N_STEPS}  norm = {norm:.8f}  peak|ψ|² = {pk:.5f}")
    return psi


def _hsv_to_rgb(H, S, V_val):
    """Vectorised HSV → RGB. All inputs: ndarrays in [0, 1]. Returns (..., 3)."""
    h6 = (H * 6.0) % 6.0
    i  = np.floor(h6).astype(int)
    f  = h6 - np.floor(h6)
    p  = V_val * (1.0 - S)
    q  = V_val * (1.0 - f * S)
    t  = V_val * (1.0 - (1.0 - f) * S)
    RGB = np.zeros((*H.shape, 3), dtype=np.float32)
    for idx, (r, g, b) in enumerate([
        (V_val, t, p), (q, V_val, p), (p, V_val, t),
        (p, q, V_val), (t, p, V_val), (V_val, p, q)
    ]):
        m = (i == idx)
        RGB[m, 0] = r[m]; RGB[m, 1] = g[m]; RGB[m, 2] = b[m]
    return RGB


def phase_colour(psi, V):
    amp   = np.abs(psi)
    value = amp / (amp.max() + 1e-12)
    hue   = (np.angle(psi) / (2 * np.pi) + 0.5) % 1.0   # [-π,π] → [0,1]
    sat   = np.ones_like(hue)
    RGB   = _hsv_to_rgb(hue, sat, value)           # (N, N, 3)
    rgba  = np.ones((N, N, 4), dtype=np.float32)
    rgba[:, :, :3] = RGB
    # override barrier cells with medium grey so the wall is visible
    grey = (V > 0)
    rgba[grey, :3] = 0.35
    return rgba                                    # (N, N, 4) float in [0,1]


def build_mesh(XX, YY, psi, V):
    prob   = np.abs(psi)**2
    height = prob / (prob.max() + 1e-12) * DISP_SCALE
    scale  = MESH_SCALE / L
    verts  = np.column_stack([
        (XX.ravel() - L / 2) * scale,
        (YY.ravel() - L / 2) * scale,
        height.ravel(),
    ])                           # (N², 3)
    faces = [(i * N + j, i * N + j + 1, (i+1)*N + j+1, (i+1)*N + j)
             for i in range(N - 1) for j in range(N - 1)]
    rgba   = phase_colour(psi, V)                 # (N, N, 4)
    colours = rgba.reshape(-1, 4).ravel().tolist()

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    me.update()

    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    attr = me.color_attributes.new(name="Col", type="BYTE_COLOR", domain="POINT")
    attr.data.foreach_set("color", colours)

    bpy.ops.object.shade_flat()
    return obj


def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,
        export_attributes=True,
    )
    print(f"Exported → {OUTPUT_GLB}")


# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=== TDSE Split-Operator FFT (Blender 5.1) ===")
    XX, YY = make_grid()
    psi0   = init_wavepacket(XX, YY)
    V      = make_barrier(XX, YY)
    dx     = L / N
    print(f"Grid {N}×{N}  dx={dx:.4f}  λ={2*np.pi/K0:.4f}  slit_w={SLIT_W:.4f}")
    print(f"Initial norm = {(np.abs(psi0)**2).sum()*dx**2:.8f}")
    print(f"Barrier cells: {(V > 0).sum()}")

    psi = simulate(psi0, V)

    print(f"Final  norm = {(np.abs(psi)**2).sum()*dx**2:.8f}  (exact = 1.0)")
    obj = build_mesh(XX, YY, psi, V)
    export_glb(obj)
    print("=== done ===")
