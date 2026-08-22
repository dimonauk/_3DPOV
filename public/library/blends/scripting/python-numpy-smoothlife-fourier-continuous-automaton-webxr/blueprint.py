"""
blueprint.py — Python numpy: SmoothLife Fourier-Domain Continuous Cellular Automaton
Blender 5.1 | CC0 | Holoflow Studio Library
https://holoflow.co.uk/tutorials/blender-tutorial-python-numpy-smoothlife-fourier-continuous-automaton-webxr

TECHNIQUE — SmoothLife (Rafler 2011, arXiv:1111.1567)
─────────────────────────────────────────────────────
Conway's Game of Life is a binary cellular automaton: each cell is either dead
(0) or alive (1), and the neighbourhood is the 8 immediately adjacent squares.
SmoothLife lifts both constraints simultaneously:

  1. STATE: real-valued  s ∈ [0, 1]  — a cell can be 0.63 alive.
  2. NEIGHBOURHOOD: two concentric disks with continuous radii
       inner disk  r < ri    → average = n  ("the cell itself")
       annular ring ri ≤ r < ra → average = m  ("the surroundings")
  3. TRANSITION: smooth sigmoid arithmetic instead of rule tables.

The neighbourhood averages n(x,y) and m(x,y) are circular-window CONVOLUTIONS
of s.  Convolutions are pointwise multiplications in frequency space, so two
FFTs replace O(N⁴) pixel-loop convolutions with O(N² log N) — essential once
the grid exceeds ~64×64 cells.

UPDATE RULE (exact Rafler formulation)
───────────────────────────────────────
  σ(x, a, α) = 1 / (1 + exp(-4*(x − a)/α))     smooth step at x=a, width α
  σ2(x, a, b, α) = σ(x,a,α) · (1 − σ(x,b,α))   smooth window in [a, b]

  alive = σ(n, 0.5, ALPHA_N)                    is this cell currently "alive"?
  f  = lerp(σ2(m, B1, B2, ALPHA_M),             birth field  (was dead, surr. full)
            σ2(m, S1, S2, ALPHA_M), alive)       survival field (was alive, surr. right)
  s_new = clamp(s + DT · (2·f − 1), 0, 1)       Euler step; +1 = grow, −1 = die

With the default parameters the system self-organises into perpetually moving
glider-like structures, pulsing blobs, and annular rings — far richer than
Game of Life because every cell carries continuous "aliveness" memory.

WHY FFT CONVOLUTION?
Naively convolving a 256×256 grid with a disk of radius 21 costs 256²·π·21²
≈ 360 M multiply-adds per step.  FFT convolution costs 3·256²·log₂(256²)
≈ 9.4 M — 38× faster, and the relative gain grows as O(N²/log N) with grid size.

OUTPUT
  hf_smoothlife.blend — displaced plane mesh with shape-key timeline
  hf_smoothlife.glb   — exported, Draco level 6, WebP colour texture
"""

import bpy
import numpy as np
import os

# ── Parameters ───────────────────────────────────────────────────────────────
GRID_W      = 128          # grid width (must be power of 2 for fastest FFT)
GRID_H      = 128          # grid height
RI          = 7.0          # inner disk radius (cells)
RA_FACTOR   = 3.0          # outer radius = RA_FACTOR * RI
B1, B2      = 0.278, 0.365 # birth window: outer avg m that turns dead → alive
S1, S2      = 0.267, 0.445 # survival window: outer avg m that keeps alive alive
ALPHA_N     = 0.028        # sigmoid softness for inner state (n threshold)
ALPHA_M     = 0.147        # sigmoid softness for outer neighbourhood (m threshold)
DT          = 0.10         # Euler step (stable while DT < 0.5 for these params)
WARM_STEPS  = 600          # steps before first keyframe capture
KEY_STEPS   = 400          # steps between keyframe captures
N_KEYFRAMES = 8            # number of shape-key snapshots (Blender timeline)
SEED        = 42           # RNG seed for reproducible initial pattern
DISP_SCALE  = 0.45         # Z-displacement multiplier in Blender units
MESH_SIZE   = 10.0         # XY extent of plane in Blender units
EXPORT_NAME = "hf_smoothlife.glb"

# ── Helper: smooth step / window functions ────────────────────────────────────
def _sigma(x, a, alpha):
    return 1.0 / (1.0 + np.exp(-4.0 * (x - a) / alpha))

def _sigma2(x, a, b, alpha):
    return _sigma(x, a, alpha) * (1.0 - _sigma(x, b, alpha))

def _lerp(a_arr, b_arr, t):
    return a_arr * (1.0 - t) + b_arr * t

# ── Radial kernel construction ────────────────────────────────────────────────
def _make_kernels(h, w, ri, ra):
    """
    Returns (k_inner_fft, k_outer_fft) — FFTs of the two normalised kernels.
    Both are built once and reused every step: inner disk sums n, annulus sums m.
    The frequency-domain representation has the same dtype as the input grid so
    multiplications remain float64 throughout.
    """
    cy, cx = h // 2, w // 2
    y_idx  = np.arange(h, dtype=np.float64) - cy
    x_idx  = np.arange(w, dtype=np.float64) - cx
    # Grid of distances from centre (broadcast)
    dist   = np.sqrt(x_idx[np.newaxis, :]**2 + y_idx[:, np.newaxis]**2)

    k_inner        = (dist < ri).astype(np.float64)
    k_outer        = ((dist >= ri) & (dist < ra)).astype(np.float64)

    # Normalise so that summing the convolution gives the average density
    k_inner       /= k_inner.sum()
    k_outer       /= k_outer.sum()

    # np.roll shifts the kernel so its origin is at (0,0) — FFT convention
    k_inner_shift  = np.roll(np.roll(k_inner, -cy, axis=0), -cx, axis=1)
    k_outer_shift  = np.roll(np.roll(k_outer, -cy, axis=0), -cx, axis=1)

    return np.fft.rfft2(k_inner_shift), np.fft.rfft2(k_outer_shift)

# ── SmoothLife step ───────────────────────────────────────────────────────────
def _step(s, ki_fft, ko_fft):
    """Single Euler step.  s is modified in-place and the new grid is returned."""
    s_fft  = np.fft.rfft2(s)
    n_avg  = np.fft.irfft2(s_fft * ki_fft, s=s.shape)  # inner disk average
    m_avg  = np.fft.irfft2(s_fft * ko_fft, s=s.shape)  # outer ring average

    alive  = _sigma(n_avg, 0.5, ALPHA_N)
    f_b    = _sigma2(m_avg, B1, B2, ALPHA_M)   # birth probability field
    f_s    = _sigma2(m_avg, S1, S2, ALPHA_M)   # survival probability field
    f      = _lerp(f_b, f_s, alive)

    # Euler update: positive f → grow toward 1, negative f → decay toward 0
    np.clip(s + DT * (2.0 * f - 1.0), 0.0, 1.0, out=s)
    return s

# ── Initial condition ─────────────────────────────────────────────────────────
def _init_state(h, w, ri):
    """
    Seed: a few random blobs of radius ~ri, then low-amplitude uniform noise.
    Small blobs let coherent structures self-assemble from scratch within ~600 steps.
    Without the blobs a uniform random field takes thousands of steps to organise.
    """
    rng = np.random.default_rng(seed=SEED)
    s   = np.zeros((h, w), dtype=np.float64)
    for _ in range(12):
        cy  = rng.integers(int(ri), h - int(ri))
        cx  = rng.integers(int(ri), w - int(ri))
        for dy in range(-int(ri), int(ri) + 1):
            for dx in range(-int(ri), int(ri) + 1):
                if dx*dx + dy*dy < ri*ri:
                    s[(cy + dy) % h, (cx + dx) % w] = rng.uniform(0.5, 1.0)
    # Symmetry-breaking noise prevents crystalline lock-in
    s += rng.uniform(-0.01, 0.01, (h, w))
    np.clip(s, 0.0, 1.0, out=s)
    return s

# ── Run simulation; collect snapshots ────────────────────────────────────────
def run_smoothlife():
    s       = _init_state(GRID_H, GRID_W, RI)
    ki, ko  = _make_kernels(GRID_H, GRID_W, RI, RI * RA_FACTOR)
    frames  = []

    # Warm-up: let the automaton reach an interesting attractor before recording
    for _ in range(WARM_STEPS):
        s = _step(s, ki, ko)

    for i in range(N_KEYFRAMES):
        frames.append(s.copy())
        for _ in range(KEY_STEPS):
            s = _step(s, ki, ko)

    return frames

# ── Build or replace mesh ─────────────────────────────────────────────────────
def build_mesh(frames):
    # Remove previous mesh if re-running
    old = bpy.data.objects.get("SmoothLife")
    if old:
        bpy.data.objects.remove(old, do_unlink=True)

    # Subdivided plane: GRID_W × GRID_H vertices
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_W - 1,
        y_subdivisions=GRID_H - 1,
        size=MESH_SIZE,
        location=(0, 0, 0),
    )
    obj  = bpy.context.active_object
    obj.name = "SmoothLife"
    mesh = obj.data
    mesh.name = "SmoothLife_mesh"

    # Reorder: Blender's grid_add emits rows in +Y→−Y order, columns +X→−X
    # The SmoothLife grid is indexed [row, col] with row 0 at top.
    # Verify by printing verts[0].co.y — should be positive (top row).
    verts = mesh.vertices

    # Basis shape key (rest pose at frame 0 state)
    mesh.shape_keys_from_data()
    if not mesh.shape_keys:
        obj.shape_key_add(name="Basis", from_mix=False)
    key_basis = mesh.shape_keys.key_blocks["Basis"]

    STEP_X = MESH_SIZE / (GRID_W - 1)
    STEP_Y = MESH_SIZE / (GRID_H - 1)

    def _frame_to_z(frame_idx):
        f = frames[frame_idx]
        z_arr = np.zeros(GRID_H * GRID_W, dtype=np.float64)
        for row in range(GRID_H):
            for col in range(GRID_W):
                vert_idx = row * GRID_W + col
                z_arr[vert_idx] = f[row, col] * DISP_SCALE
        return z_arr

    # Shape keys for each snapshot
    for ki_idx in range(N_KEYFRAMES):
        sk = obj.shape_key_add(name=f"State_{ki_idx:02d}", from_mix=False)
        z_arr = _frame_to_z(ki_idx)
        for vi, vert in enumerate(sk.data):
            vert.co.z = z_arr[vi]

    # Keyframe shape-key values: each key active for ANIM_FRAMES_PER_KEY frames
    ANIM_FPK = 24
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = N_KEYFRAMES * ANIM_FPK

    for ki_idx in range(N_KEYFRAMES):
        frame_num = ki_idx * ANIM_FPK + 1
        scene.frame_set(frame_num)
        for sk_idx, sk in enumerate(mesh.shape_keys.key_blocks):
            if sk.name == "Basis":
                continue
            is_active = (int(sk.name.split("_")[1]) == ki_idx)
            sk.value = 1.0 if is_active else 0.0
            sk.keyframe_insert("value", frame=frame_num)

    # Vertex colour attribute from final frame concentration
    if "Col" not in mesh.attributes:
        mesh.attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
    col_attr = mesh.attributes["Col"].data
    final_frame = frames[-1]
    for row in range(GRID_H):
        for col in range(GRID_W):
            vi  = row * GRID_W + col
            v   = float(final_frame[row, col])
            col_attr[vi].color = (v, v * 0.55, 1.0 - v, 1.0)

    return obj

# ── Export GLB ────────────────────────────────────────────────────────────────
def export_glb(obj):
    blend_path = bpy.data.filepath
    if not blend_path:
        blend_path = os.path.join(os.path.expanduser("~"), "smoothlife.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    out_path = os.path.join(os.path.dirname(blend_path), EXPORT_NAME)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_apply=False,           # keep shape keys in GLB for animation
        export_morph=True,
        export_morph_normal=False,    # normals are recomputed client-side
        export_morph_tangent=False,
    )
    print(f"[SmoothLife] Exported → {out_path}")

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("[SmoothLife] Running simulation …")
    frames = run_smoothlife()
    print(f"[SmoothLife] Captured {N_KEYFRAMES} snapshots. Building mesh …")
    obj = build_mesh(frames)
    export_glb(obj)
    print("[SmoothLife] Done.")
