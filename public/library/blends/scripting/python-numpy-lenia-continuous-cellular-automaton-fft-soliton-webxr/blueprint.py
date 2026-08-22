"""
blueprint.py — Python numpy: Lenia Continuous Cellular Automaton
Blender 5.1 | CC0 | Holoflow Studio Library
https://holoflow.co.uk/tutorials/blender-tutorial-python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr

TECHNIQUE
─────────
Lenia (Bert Chan, 2019) generalises Conway's Game of Life to a continuous domain:
a single real-valued field A ∈ [0, 1] evolves under an FFT convolution with a
smooth radial kernel K, followed by a Gaussian growth function G that maps
neighbourhood potential U = K * A into a delta-A per timestep.  With the
"Orbium" parameters (R=13, μ=0.135, σ=0.015) the field self-organises into
glider-like solitons — stable, translating structures that recall single-celled
organisms under a microscope.

The critical efficiency trick: K is fixed and periodic, so U = K * A is computed
via pointwise multiplication of the two FFTs (np.fft.fft2), cutting O(N²R²)
pixel loops to O(N² log N) — a 40× win at N=128, R=13.

EXTERNAL ATTRIBUTION
─────────────────────
  Chan, B. W.-C. (2019) "Lenia: Biology of Artificial Life"
  arXiv:1812.05433 [cs.NE] | CC BY 4.0
  https://arxiv.org/abs/1812.05433

  Lenia Python reference — MIT licence — Bert Wang-Chak Chan
  https://github.com/Chakazul/Lenia

  NumPy FFT — BSD-3-Clause — NumPy Developers
  https://numpy.org/doc/stable/reference/routines.fft.html
"""

import bpy
import numpy as np
import math
import os

# ── TUNABLE CONSTANTS ─────────────────────────────────────────────────────────
N          = 128        # grid side (power-of-2; Orbium soliton fits at N ≥ 64)
R          = 13         # kernel radius (px) — "Orbium" uses R=13 regardless of N
DT         = 0.1        # timestep — solitons destabilise above ~0.15
MU         = 0.135      # growth peak — narrow band sustains soliton cores
SIGMA      = 0.015      # growth width — halving this sharpens pattern boundaries
BETA       = 4.0        # kernel sharpness (higher → narrower annular ring)
WARM_UP    = 300        # steps before first snapshot (solitons emerge ~200)
SNAP_EVERY = 50         # steps between saved snapshots
N_SNAPS    = 8          # shape-key frames exported to GLB
DISP_SCALE = 2.0        # Z-displacement amplitude (metres in Blender)
PLANE_SIZE = 10.0       # XY extent of mesh (metres)
MESH_NAME  = "hf_lenia"
OUTPUT_GLB = "//hf_lenia.glb"
SEED       = 7          # RNG seed — change to explore different soliton configs
# ─────────────────────────────────────────────────────────────────────────────


# ── KERNEL ────────────────────────────────────────────────────────────────────

def _build_kernel_fft(N: int, R: int, beta: float) -> "np.ndarray":
    """
    Precompute FFT of the Lenia kernel so convolutions become multiply ops.

    K_core(r) = exp(β − β / (4r(1−r) + ε))  for r ∈ (0, 1)
               0                              otherwise

    r = ‖(x,y)‖ / R, so the kernel spans exactly R pixels.  The bell peaks
    at r = 0.5 (i.e. distance R/2 from origin) and drops smoothly to 0 at r = R
    and at r = 0 — meaning the rule looks at an *annular* shell, not the cell itself.
    Normalising by sum ensures U ∈ [0, 1] when A ∈ [0, 1].
    """
    ax = np.fft.fftfreq(N) * N          # integer offsets centred at 0 in FFT order
    XX, YY = np.meshgrid(ax, ax, indexing="ij")
    r = np.sqrt(XX**2 + YY**2) / R     # normalise to unit shell
    interior = (r > 0.0) & (r < 1.0)
    K = np.zeros((N, N), dtype=np.float64)
    denom = 4.0 * r[interior] * (1.0 - r[interior]) + 1e-12
    K[interior] = np.exp(beta - beta / denom)
    K /= K.sum()                        # normalise: K*1 = 1
    return np.fft.fft2(K)              # precomputed frequency-domain kernel


# ── GROWTH FUNCTION ───────────────────────────────────────────────────────────

def _growth(U: "np.ndarray", mu: float, sigma: float) -> "np.ndarray":
    """
    Gaussian bump mapped to [−1, +1].

    G(U) = 2·exp(−(U − μ)²/(2σ²)) − 1

    Where U ≈ μ the cells grow (+1); everywhere else they decay (−1).
    The narrow σ = 0.015 is WHY solitons exist: only an extremely tight
    neighbourhood density sustains growth, preventing uniform field coverage.
    Widening σ washes out the structure; narrowing it too far kills everything.
    """
    return 2.0 * np.exp(-((U - mu) ** 2) / (2.0 * sigma ** 2)) - 1.0


# ── SIMULATION ────────────────────────────────────────────────────────────────

def run_lenia(seed: int = SEED) -> "list[np.ndarray]":
    """
    Integrate Lenia for WARM_UP + N_SNAPS*SNAP_EVERY steps.
    Returns list of N_SNAPS snapshots of the full A field (float64, shape N×N).
    """
    rng = np.random.default_rng(seed)
    A = np.zeros((N, N), dtype=np.float64)
    # Random seed patch in centre quarter — periodic boundary does the rest
    q = N // 4
    A[q : N - q, q : N - q] = rng.uniform(0.0, 1.0, (N // 2, N // 2))

    K_fft    = _build_kernel_fft(N, R, BETA)
    snapshots: "list[np.ndarray]" = []

    total_steps = WARM_UP + N_SNAPS * SNAP_EVERY
    for step_idx in range(total_steps):
        # Convolution via FFT multiplication — this is the hot path
        U = np.real(np.fft.ifft2(np.fft.fft2(A) * K_fft))
        A = np.clip(A + DT * _growth(U, MU, SIGMA), 0.0, 1.0)

        if step_idx >= WARM_UP and (step_idx - WARM_UP) % SNAP_EVERY == 0:
            snapshots.append(A.copy())
            print(
                f"  snap {len(snapshots)}/{N_SNAPS}  "
                f"A∈[{A.min():.4f},{A.max():.4f}]  ρ={A.mean():.4f}"
            )

    return snapshots


# ── COLOURMAP ─────────────────────────────────────────────────────────────────

def _hot_colour(t: float) -> "tuple[float,float,float,float]":
    """
    'Hot' colourmap: 0→black, 0.33→red, 0.66→orange, 1→white.
    Renders solitons as glowing bodies against a dark void — strong WebXR contrast.
    """
    r = min(1.0, t * 3.0)
    g = min(1.0, max(0.0, t * 3.0 - 1.0))
    b = min(1.0, max(0.0, t * 3.0 - 2.0))
    return (r, g, b, 1.0)


# ── MESH BUILD ────────────────────────────────────────────────────────────────

def _make_grid_mesh() -> bpy.types.Mesh:
    """
    Build flat N×N vertex grid via from_pydata (faster than bmesh for large grids).
    Vertex index = i*N + j  (row-major, i along X, j along Y).
    """
    step = PLANE_SIZE / (N - 1)
    half = PLANE_SIZE / 2.0
    verts = [(-half + i * step, -half + j * step, 0.0)
             for i in range(N) for j in range(N)]
    faces = [(i * N + j, (i + 1) * N + j, (i + 1) * N + (j + 1), i * N + (j + 1))
             for i in range(N - 1) for j in range(N - 1)]
    mesh = bpy.data.meshes.new(MESH_NAME)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh


def _apply_snapshot(
    mesh: bpy.types.Mesh,
    A: "np.ndarray",
    shape_key_name: str,
) -> None:
    """
    Write A values as Z-displacement into a shape key and colour attribute.
    The Basis shape key must exist before any relative keys are added.
    """
    verts = mesh.vertices
    sk = mesh.shape_keys.key_blocks[shape_key_name]
    flat = A.flatten()                  # row-major matches vertex index order
    for idx, v in enumerate(verts):
        z = float(flat[idx]) * DISP_SCALE
        sk.data[idx].co.z = z

    # Write colour attribute — 'hot' colourmap encoding A value
    col_attr = mesh.color_attributes.get("Col")
    if col_attr is None:
        col_attr = mesh.color_attributes.new("Col", type="FLOAT_COLOR", domain="POINT")
    colours = col_attr.data
    for idx in range(len(verts)):
        colours[idx].color = _hot_colour(float(flat[idx]))


# ── MATERIAL ──────────────────────────────────────────────────────────────────

def _add_material(obj: bpy.types.Object) -> None:
    """
    Principled BSDF material reading the 'Col' vertex colour attribute.
    Emission weight = 0.6 so solitons glow without a separate emission shader.
    """
    mat = bpy.data.materials.new(f"{MESH_NAME}_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out    = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf   = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr   = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"

    bsdf.inputs["Roughness"].default_value        = 0.55
    bsdf.inputs["Emission Strength"].default_value = 0.6

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    out.location  = (400, 0)
    bsdf.location = (100, 0)
    attr.location = (-200, 0)

    obj.data.materials.append(mat)


# ── GLB EXPORT ────────────────────────────────────────────────────────────────

def _export_glb(obj: bpy.types.Object) -> None:
    """
    Export with Draco level 6 and WebP textures; include morph targets so the
    shape-key animation plays back natively in Three.js/WebXR runtimes.
    """
    path = bpy.path.abspath(OUTPUT_GLB)
    bpy.ops.export_scene.gltf(
        filepath            = path,
        use_selection       = True,
        export_format       = "GLB",
        export_draco_mesh_compression_enable   = True,
        export_draco_mesh_compression_level    = 6,
        export_image_format = "WEBP",
        export_morph        = True,
        export_morph_normal = False,
        export_colors       = True,
        export_animations   = True,
    )
    print(f"[blueprint] exported → {path}")


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("[blueprint] running Lenia simulation …")
    snapshots = run_lenia(SEED)

    # ── Clean up previous run ─────────────────────────────────────────────────
    for name in [MESH_NAME, f"{MESH_NAME}_mat"]:
        for col in (bpy.data.meshes, bpy.data.materials):
            item = col.get(name)
            if item:
                col.remove(item)

    # ── Build mesh & object ───────────────────────────────────────────────────
    mesh = _make_grid_mesh()
    obj  = bpy.data.objects.new(MESH_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── Shape keys ────────────────────────────────────────────────────────────
    # Basis key (flat — never animated, just the reference)
    obj.shape_key_add(name="Basis", from_mix=False)
    mesh.shape_keys.use_relative = True

    frame_step = max(1, int(round(24 / (1 / DT / SNAP_EVERY))))  # frames per key

    for snap_idx, A in enumerate(snapshots):
        key_name = f"State_{snap_idx:02d}"
        obj.shape_key_add(name=key_name, from_mix=False)
        _apply_snapshot(mesh, A, key_name)

        # Insert value keyframes: 0 at neighbouring frames, 1 at own frame
        frame = (snap_idx + 1) * frame_step
        sk    = mesh.shape_keys.key_blocks[key_name]
        for f, val in [(frame - frame_step, 0.0), (frame, 1.0),
                       (frame + frame_step, 0.0)]:
            sk.value = val
            sk.keyframe_insert("value", frame=f)

    bpy.context.scene.frame_end = (N_SNAPS + 1) * frame_step

    # ── Material & export ─────────────────────────────────────────────────────
    _add_material(obj)
    _export_glb(obj)

    print(f"[blueprint] done — {N_SNAPS} snapshots, {len(mesh.vertices)} vertices")


main()
