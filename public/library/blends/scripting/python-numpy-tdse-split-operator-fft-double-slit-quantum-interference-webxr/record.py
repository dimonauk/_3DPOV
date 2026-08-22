"""
record.py — TDSE Split-Operator FFT: shape-key animation across 10 snapshots
Blender 5.1 / numpy  (Holoflow Studio — CC0)

Runs the simulation in 10 equal chunks of N_STEPS/N_SNAPS steps each,
captures |ψ|² height at each chunk boundary, and stores them as shape
keys on a flat 64×64 mesh.  Phase colouring (arg ψ) is taken from the
midpoint snapshot (snap 5) and held fixed — vertex colours do not animate.
"""

import bpy
import bmesh
import numpy as np

# ── shared constants (keep in sync with blueprint.py) ─────────────────────────
N          = 64
L          = 2 * np.pi
DT         = 0.01
N_TOTAL    = 40            # same total steps as blueprint
N_SNAPS    = 10            # shape-key snapshots
K0         = 8.0
SIGMA      = 0.5
X0         = L / 4
Y0         = L / 2
BARRIER_X  = L / 2
BARRIER_W  = 2
V0         = 500.0
SLIT_W     = L / 12
SLIT_SEP   = L / 4
DISP_SCALE = 0.04
MESH_SCALE = 0.28
MESH_NAME  = "hf_tdse_anim"

# ── animation ─────────────────────────────────────────────────────────────────
N_STEPS_PER_SNAP = N_TOTAL // N_SNAPS   # 4 steps per snapshot
FRAMES_PER_SNAP  = 30                   # 30 frames of hold per shape key
OUTPUT_PATH      = "//../../videos/scripting/python-numpy-tdse-split-operator-fft-double-slit-quantum-interference-webxr/viewport"

# ══════════════════════════════════════════════════════════════════════════════

def make_grid():
    dx = L / N
    x = np.arange(N) * dx
    return np.meshgrid(x, x, indexing="ij")


def init_wavepacket(XX, YY):
    dx = L / N
    psi = np.exp(-((XX - X0)**2 + (YY - Y0)**2) / (4 * SIGMA**2)).astype(complex)
    psi *= np.exp(1j * K0 * XX)
    return psi / np.sqrt((np.abs(psi)**2).sum() * dx**2)


def make_barrier(XX, YY):
    dx = L / N
    V = np.zeros((N, N))
    wall  = np.abs(XX - BARRIER_X) < BARRIER_W * dx
    s1    = np.abs(YY - (Y0 - SLIT_SEP / 2)) < SLIT_W / 2
    s2    = np.abs(YY - (Y0 + SLIT_SEP / 2)) < SLIT_W / 2
    V[wall & ~(s1 | s2)] = V0
    return V


def build_propagators(V):
    dx = L / N
    k1 = 2 * np.pi * np.fft.fftfreq(N, d=dx)
    KX, KY = np.meshgrid(k1, k1, indexing="ij")
    exp_T = np.exp(-1j * (KX**2 + KY**2) * DT)
    exp_V = np.exp(-1j * V * DT / 2)
    return exp_T, exp_V


def step(psi, exp_T, exp_V):
    psi  = psi * exp_V
    psi  = np.fft.ifft2(np.fft.fft2(psi) * exp_T)
    return psi * exp_V


def simulate_snapshots(psi0, exp_T, exp_V):
    psi    = psi0.copy()
    snaps  = [psi0.copy()]            # include t=0
    for _ in range(N_SNAPS - 1):
        for _ in range(N_STEPS_PER_SNAP):
            psi = step(psi, exp_T, exp_V)
        snaps.append(psi.copy())
    return snaps                      # list of N_SNAPS complex arrays (N, N)


def _hsv_to_rgb(H, S, Vv):
    h6  = (H * 6.0) % 6.0
    idx = np.floor(h6).astype(int)
    f   = h6 - np.floor(h6)
    p   = Vv * (1.0 - S)
    q   = Vv * (1.0 - f * S)
    t   = Vv * (1.0 - (1.0 - f) * S)
    RGB = np.zeros((*H.shape, 3), dtype=np.float32)
    for c, (r, g, b) in enumerate([
        (Vv,t,p),(q,Vv,p),(p,Vv,t),(p,q,Vv),(t,p,Vv),(Vv,p,q)
    ]):
        m = (idx == c)
        RGB[m,0]=r[m]; RGB[m,1]=g[m]; RGB[m,2]=b[m]
    return RGB


def colour_from_snap(psi_mid, V):
    amp  = np.abs(psi_mid)
    val  = amp / (amp.max() + 1e-12)
    hue  = (np.angle(psi_mid) / (2*np.pi) + 0.5) % 1.0
    RGB  = _hsv_to_rgb(hue, np.ones_like(hue), val)
    rgba = np.ones((N, N, 4), dtype=np.float32)
    rgba[:,:,:3] = RGB
    rgba[V > 0, :3] = 0.35
    return rgba.reshape(-1, 4).ravel().tolist()


def snap_height(psi):
    prob = np.abs(psi)**2
    return prob / (prob.max() + 1e-12) * DISP_SCALE


def build_anim_mesh(XX, YY, snaps, V):
    scale = MESH_SCALE / L
    base_xy = np.column_stack([
        (XX.ravel() - L/2) * scale,
        (YY.ravel() - L/2) * scale,
    ])
    faces = [(i*N+j, i*N+j+1, (i+1)*N+j+1, (i+1)*N+j)
             for i in range(N-1) for j in range(N-1)]

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    me = bpy.data.meshes.new(MESH_NAME)
    basis_z = snap_height(snaps[0])
    basis_verts = np.column_stack([base_xy, basis_z.ravel()]).tolist()
    me.from_pydata(basis_verts, [], faces)
    me.update()

    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # colour from mid-point snapshot
    mid  = snaps[N_SNAPS // 2]
    cols = colour_from_snap(mid, V)
    attr = me.color_attributes.new(name="Col", type="BYTE_COLOR", domain="POINT")
    attr.data.foreach_set("color", cols)

    bpy.ops.object.shade_flat()

    # Basis shape key (required before adding others)
    obj.shape_key_add(name="Basis", from_mix=False)

    # Add one shape key per snapshot
    for si, snap in enumerate(snaps):
        sk = obj.shape_key_add(name=f"S{si:02d}", from_mix=False)
        hz = snap_height(snap)
        co = np.column_stack([base_xy, hz.ravel()])
        sk.data.foreach_set("co", co.ravel().tolist())

    return obj


def animate_shape_keys(obj):
    key = obj.data.shape_keys
    key.use_relative = True
    n_frames = FRAMES_PER_SNAP * N_SNAPS
    for si in range(N_SNAPS):
        sk = key.key_blocks[f"S{si:02d}"]
        peak_frame = si * FRAMES_PER_SNAP + FRAMES_PER_SNAP // 2
        for f in range(n_frames + 1):
            sk.value = 1.0 if f == peak_frame else 0.0
            sk.keyframe_insert("value", frame=f)

    for fc in key.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def setup_render(n_frames):
    sc = bpy.context.scene
    sc.frame_start = 0
    sc.frame_end   = n_frames - 1
    sc.render.fps  = 30
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format              = "MPEG4"
    sc.render.ffmpeg.codec               = "H264"
    sc.render.filepath                   = bpy.path.abspath(OUTPUT_PATH)


# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=== record.py — TDSE snapshots ===")
    XX, YY  = make_grid()
    psi0    = init_wavepacket(XX, YY)
    V       = make_barrier(XX, YY)
    exp_T, exp_V = build_propagators(V)

    print(f"Running {N_SNAPS} snapshots × {N_STEPS_PER_SNAP} steps each …")
    snaps   = simulate_snapshots(psi0, exp_T, exp_V)

    obj     = build_anim_mesh(XX, YY, snaps, V)
    n_frames = FRAMES_PER_SNAP * N_SNAPS
    animate_shape_keys(obj)
    setup_render(n_frames)

    print(f"Animation: {N_SNAPS} shape keys, {n_frames} frames @ 30fps")
    print("Run Record Animation (Ctrl+F12) or Render > Render Animation.")
    print("=== done ===")
