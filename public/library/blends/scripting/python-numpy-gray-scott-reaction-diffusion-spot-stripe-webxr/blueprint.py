"""
Gray-Scott Reaction-Diffusion — Blender 5.1 Blueprint
Holoflow Studio | CC0 | 2026-07-25

Technique (2-3 sentences):
  The Gray-Scott model (P. Gray & S. K. Scott, 1985) couples two chemical species
  U (substrate/food) and V (activator) on a 2-D toroidal lattice.  An explicit
  Euler integrator with a 5-point Laplacian drives the coupled PDEs; the final
  V-concentration field is mapped to vertex Z-displacement, producing an organic
  relief mesh ready for WebXR or 3-D print.

Theory:
  Reactions (keep V autocatalytic, kill it with rate k, refeed U at rate f):
    U + 2V → 3V         autocatalysis
    V      → P          inert sink
  PDEs:
    ∂U/∂t = Du·∇²U − U·V² + f·(1 − U)
    ∂V/∂t = Dv·∇²V + U·V² − (f + k)·V
  Turing-instability prerequisite: Du/Dv > 1  (here 0.16/0.08 = 2).
  Stability of explicit Euler: dt ≤ 1 / (4·Du) = 1.5625 at unit grid spacing.

Pattern families (Pearson 1993 Science 261:189):
  F=0.060, K=0.062  →  Turing spots          ← DEFAULT
  F=0.035, K=0.060  →  stripe labyrinths
  F=0.025, K=0.060  →  self-replicating spots
  F=0.025, K=0.065  →  worm-hole holes

External attribution:
  Pearson, J. E. (1993) "Complex Patterns in a Simple System"
  Science 261:189–192 | mathematical results, no copyright restriction
  https://doi.org/10.1126/science.261.5118.189

  NumPy — numpy.roll, numpy.clip — BSD-3-Clause — NumPy Developers
  https://numpy.org/doc/stable/reference/generated/numpy.roll.html
"""

import bpy
import numpy as np

# ── TUNABLE CONSTANTS ────────────────────────────────────────────────────────
N          = 128        # grid side → N×N lattice (keep power-of-2 for FFT compat)
DU         = 0.16       # substrate diffusivity
DV         = 0.08       # activator diffusivity  (Du/Dv = 2 → Turing instability)
F_RATE     = 0.060      # feed rate  (replenishes U from external reservoir)
K_RATE     = 0.062      # kill rate  (removes V alongside f)
N_STEPS    = 10_000     # integration steps (pattern reaches near-steady at ~8 000)
DT         = 1.0        # timestep — stable while DT ≤ 1/(4·DU) = 1.5625
PATCH_R    = 8          # half-size of central V seed patch (pixels)
DISP_SCALE = 0.40       # Z-extrusion amplitude (metres in Blender)
MESH_NAME  = "hf_gray_scott"
OUTPUT_GLB = "//hf_gray_scott.glb"
SEED       = 42         # RNG seed — change for different symmetry breaks
# ────────────────────────────────────────────────────────────────────────────


# ── SIMULATION ───────────────────────────────────────────────────────────────

def _lap(field: np.ndarray) -> np.ndarray:
    """
    5-point Laplacian on a toroidal lattice via np.roll.
    Periodic BCs prevent edge artefacts that would pin the pattern boundary.
    Cost: 4 roll calls + 1 subtraction per field — O(N²) and cache-friendly.
    """
    return (
        np.roll(field,  1, axis=0) + np.roll(field, -1, axis=0) +
        np.roll(field,  1, axis=1) + np.roll(field, -1, axis=1) -
        4.0 * field
    )


def run_gray_scott() -> np.ndarray:
    """
    Integrate PDEs and return the V field at t = N_STEPS.

    Initial condition: U = 1 everywhere (full food), V = 0 except
    a central PATCH_R×PATCH_R square seeded at V = 0.25 plus small
    noise.  The noise breaks 4-fold symmetry so spots/stripes fill
    the domain rather than growing as a perfect cross.
    """
    u = np.ones((N, N), dtype=np.float64)
    v = np.zeros((N, N), dtype=np.float64)

    cx = cy = N // 2
    r = PATCH_R
    u[cx - r : cx + r, cy - r : cy + r] = 0.50
    v[cx - r : cx + r, cy - r : cy + r] = 0.25

    rng = np.random.default_rng(seed=SEED)
    v += rng.uniform(-0.01, 0.01, (N, N))
    np.clip(v, 0.0, None, out=v)

    for _ in range(N_STEPS):
        uvv = u * v * v                  # shared nonlinear term (avoid computing twice)
        u += DT * (DU * _lap(u) - uvv + F_RATE * (1.0 - u))
        v += DT * (DV * _lap(v) + uvv - (F_RATE + K_RATE) * v)
        # Hard clip prevents blow-up if parameters are pushed past stability
        np.clip(u, 0.0, 1.0, out=u)
        np.clip(v, 0.0, 1.0, out=v)

    return v


# ── MESH CONSTRUCTION ────────────────────────────────────────────────────────

def _build_mesh(v_field: np.ndarray) -> bpy.types.Object:
    """
    Map V[i,j] → vertex (x, y, z) where z = V[i,j] * DISP_SCALE.
    Grid spans [−0.5, +0.5]² so the object fits a unit cube for WebXR.
    Quads are wound CCW (Blender's default winding = correct normals).
    """
    step = 1.0 / (N - 1)
    half = 0.5

    verts = []
    for i in range(N):
        for j in range(N):
            verts.append((
                j * step - half,
                i * step - half,
                float(v_field[i, j]) * DISP_SCALE,
            ))

    faces = []
    for i in range(N - 1):
        for j in range(N - 1):
            a = i * N + j
            faces.append((a, a + 1, (i + 1) * N + (j + 1), (i + 1) * N + j))

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts, [], faces)
    me.update()

    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _add_vertex_colour(obj: bpy.types.Object, v_field: np.ndarray) -> None:
    """
    Encode V as a BYTE_COLOR point attribute named "Col".
    GLTF exporter maps this to COLOR_0 — readable by Three.js vertexColors.
    Colour map: deep blue (V ≈ 0) → amber-gold (V peak, ~0.25).
    """
    me = obj.data
    v_max = float(v_field.max()) or 1.0
    col_attr = me.color_attributes.new(name="Col", type="BYTE_COLOR", domain="POINT")
    flat = v_field.ravel()
    for idx, vert in enumerate(me.vertices):
        c = flat[idx] / v_max          # normalise to [0, 1]
        # blue→gold: R rises, G partial, B falls
        col_attr.data[idx].color = (c ** 0.5, c * 0.55, 1.0 - c, 1.0)


def _shade_and_export(obj: bpy.types.Object) -> None:
    """
    Flat-shade for faceted look (consistent with studio aesthetic), then export.
    Draco level 6 + WebP textures match the holoflow_webxr_exporter convention.
    """
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_flat()
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"✓  {OUTPUT_GLB} written")


# ── ENTRY POINT ──────────────────────────────────────────────────────────────

def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("Running Gray-Scott simulation …")
    v = run_gray_scott()
    print(f"   V ∈ [{v.min():.4f}, {v.max():.4f}]  "
          f"(spots visible when max > 0.15)")

    obj = _build_mesh(v)
    _add_vertex_colour(obj, v)
    _shade_and_export(obj)
    print("Done — hf_gray_scott.glb ready for WebXR.")


main()
