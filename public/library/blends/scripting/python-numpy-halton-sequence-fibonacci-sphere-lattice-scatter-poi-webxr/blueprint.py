"""
Python numpy — Halton Low-Discrepancy Sequence & Fibonacci Sphere Lattice (Blender 5.1)
========================================================================================
Monte Carlo places points with expected discrepancy ∝ √(log N / N), producing visible
clumps and voids at any finite N.  A low-discrepancy sequence trades pseudo-randomness
for provably even coverage:  discrepancy O((log N)^s / N) in s dimensions.

Two strategies are implemented and compared against uniform random:

  Halton (van der Corput 1935)
    The base-b van der Corput sequence reflects the integer index across the
    decimal point in base b.  Index 6 in base 2 is 110₂ → 0.011₂ = 3/8.
    Halton₃ uses base-2 for u and base-3 for v, maps (u,v) → sphere via the
    area-preserving inverse-CDF:  cos θ = 1 − 2u,  φ = 2π v.

  Fibonacci sphere (Vogel 1979)
    Place N points so the k-th sits at z_k = 1 − (2k+1)/N and azimuth
    φ_k = k · φ_golden, where φ_golden = π(3 − √5) ≈ 137.508°.  The golden
    angle is maximally irrational (continued-fraction coefficients all 1),
    so the azimuthal gaps never repeat — every annular band of the sphere gets
    exactly the same density as every other.

The three N_POINTS=144 clusters sit at Y offsets {-5, 0, +5} m so you can
compare them side-by-side in the viewport.  Each cluster's poi-head spheres
(tiny icospheres) carry a distinct flat colour.  A single GLB is exported.
"""

import bpy
import bmesh
import numpy as np

# ── parameters ───────────────────────────────────────────────────────────────
N_POINTS       = 144     # samples per method (12² keeps a clean visual grid)
SPHERE_RADIUS  = 2.0     # radius of the distribution sphere (metres)
HEAD_RADIUS    = 0.045   # radius of each poi-head icosphere
HEAD_SUB       = 1       # ico subdivision level (1 = 20 faces, adequate at this scale)
CLUSTER_GAP    = 5.0     # Y separation between the three clusters
RANDOM_SEED    = 42

# material colours  (linear RGBA)
COL_HALTON    = (0.04, 0.28, 0.90, 1.0)   # deep blue
COL_FIBONACCI = (0.95, 0.76, 0.06, 1.0)   # golden
COL_RANDOM    = (0.85, 0.14, 0.40, 1.0)   # coral pink
GLB_PATH      = "//hf_scatter.glb"
# ─────────────────────────────────────────────────────────────────────────────


# ── quasi-random generators ──────────────────────────────────────────────────

def _van_der_corput(n: int, base: int) -> np.ndarray:
    """Vectorised base-b van der Corput sequence for indices 0..n-1.

    Digit-reversal trick: accumulate the fractional part digit-by-digit using
    repeated integer division.  This avoids a Python loop over digits by looping
    over digit *positions* (at most log_b(n) ≈ 8-12 iterations for n ≤ 10000).
    Each pass contributes one base-b digit to the reflected fraction.
    """
    seq    = np.zeros(n, dtype=np.float64)
    denom  = 1.0
    digits = np.arange(n, dtype=np.int64)
    while digits.any():
        denom    *= base
        remainder = digits % base      # current least-significant digit
        seq      += remainder / denom
        digits   //= base              # shift right in base b
    return seq


def _halton_sphere(n: int) -> np.ndarray:
    """N × 3 float64 array of points on the unit sphere via Halton₂₃.

    u = H₂  →  cos θ = 1 − 2u  (uniform area in z — same as the inverse-CDF
    of the marginal density dA ∝ dz on a sphere of unit radius)
    v = H₃  →  φ = 2π v
    """
    u = _van_der_corput(n, 2)
    v = _van_der_corput(n, 3)
    cos_theta = 1.0 - 2.0 * u           # ∈ [-1, 1]
    sin_theta = np.sqrt(1.0 - cos_theta ** 2)
    phi       = 2.0 * np.pi * v
    return np.column_stack([
        sin_theta * np.cos(phi),
        sin_theta * np.sin(phi),
        cos_theta,
    ])


def _fibonacci_sphere(n: int) -> np.ndarray:
    """N × 3 float64 array via the Vogel (1979) golden-angle sunflower lattice.

    z_k = 1 − (2k + 1) / n  places samples at equal-area zone boundaries.
    The golden angle φ_g = π(3 − √5) is the most irrational angle in [0, 2π),
    guaranteeing the minimum angular gap between any two consecutive azimuths
    grows as slowly as possible — perfectly even coverage.
    """
    phi_golden = np.pi * (3.0 - np.sqrt(5.0))   # ≈ 2.39996 rad ≈ 137.508°
    k          = np.arange(n, dtype=np.float64)
    z          = 1.0 - (2.0 * k + 1.0) / n
    r          = np.sqrt(np.maximum(0.0, 1.0 - z * z))
    phi        = k * phi_golden
    return np.column_stack([r * np.cos(phi), r * np.sin(phi), z])


def _random_sphere(n: int, seed: int = RANDOM_SEED) -> np.ndarray:
    """N × 3 float64 via area-preserving Monte Carlo (same inverse-CDF as Halton).

    Using the same mapping as _halton_sphere ensures the only difference between
    the three clusters is the discrepancy of the (u,v) distribution, not the
    sphere mapping itself — a fair comparison.
    """
    rng = np.random.default_rng(seed)
    u   = rng.uniform(0.0, 1.0, n)
    v   = rng.uniform(0.0, 1.0, n)
    cos_theta = 1.0 - 2.0 * u
    sin_theta = np.sqrt(1.0 - cos_theta ** 2)
    phi       = 2.0 * np.pi * v
    return np.column_stack([
        sin_theta * np.cos(phi),
        sin_theta * np.sin(phi),
        cos_theta,
    ])


# ── scene utilities ──────────────────────────────────────────────────────────

def _clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)


def _make_material(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = False
    mat.diffuse_color = colour
    return mat


def _build_head_mesh() -> bpy.types.Mesh:
    """Single shared icosphere mesh for all poi heads (no duplication)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=HEAD_SUB, radius=HEAD_RADIUS)
    me = bpy.data.meshes.new("HF_PoiHead")
    bm.to_mesh(me)
    bm.free()
    return me


def _scatter_cluster(
    directions: np.ndarray,
    head_mesh: bpy.types.Mesh,
    mat: bpy.types.Material,
    name: str,
    y_offset: float,
) -> bpy.types.Object:
    """Create one empty cluster object; add each poi head as a linked mesh child.

    Using a shared mesh + per-object offsets avoids duplicating geometry:
    all N heads in a cluster reference the same bpy.types.Mesh data block.
    """
    coll = bpy.context.collection
    root = bpy.data.objects.new(f"HF_{name}_Root", None)  # empty
    root.empty_display_size = SPHERE_RADIUS
    root.location = (0.0, y_offset, 0.0)
    coll.objects.link(root)

    for i, d in enumerate(directions):
        pos = d * SPHERE_RADIUS          # unit direction → world position
        obj = bpy.data.objects.new(f"HF_{name}_{i:03d}", head_mesh)
        obj.location = (float(pos[0]), float(pos[1]), float(pos[2]))
        obj.data.materials.clear()
        obj.data = head_mesh             # shared; materials set on object level below
        coll.objects.link(obj)
        obj.parent = root
        # per-instance material slot override — flat unlit colour
        if obj.material_slots:
            obj.material_slots[0].material = mat
        else:
            obj.data.materials.append(mat)

    return root


def _export_glb() -> None:
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_extras=True,
    )
    print(f"[HF] GLB → {GLB_PATH}")


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    _clear_scene()

    mat_h = _make_material("HF_Halton",    COL_HALTON)
    mat_f = _make_material("HF_Fibonacci", COL_FIBONACCI)
    mat_r = _make_material("HF_Random",    COL_RANDOM)

    head_me = _build_head_mesh()

    dirs_h = _halton_sphere(N_POINTS)
    dirs_f = _fibonacci_sphere(N_POINTS)
    dirs_r = _random_sphere(N_POINTS)

    _scatter_cluster(dirs_h, head_me, mat_h, "Halton",    y_offset=-CLUSTER_GAP)
    _scatter_cluster(dirs_f, head_me, mat_f, "Fibonacci", y_offset=0.0)
    _scatter_cluster(dirs_r, head_me, mat_r, "Random",    y_offset=+CLUSTER_GAP)

    # Wire-frame guide spheres so the distribution shell is visible
    for name, y in [("Halton", -CLUSTER_GAP), ("Fibonacci", 0.0), ("Random", CLUSTER_GAP)]:
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=SPHERE_RADIUS, segments=32, ring_count=16,
            location=(0.0, y, 0.0),
        )
        guide = bpy.context.object
        guide.name = f"HF_{name}_Guide"
        guide.display_type = "WIRE"
        guide.hide_render   = True

    _export_glb()
    print("[HF] Halton/Fibonacci/Random scatter — done.")


main()
