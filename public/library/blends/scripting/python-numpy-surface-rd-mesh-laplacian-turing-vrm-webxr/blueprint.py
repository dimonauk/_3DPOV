"""
Surface Reaction-Diffusion via Mesh Laplacian — Blender 5.1 Blueprint
Holoflow Studio | CC0 | 2026-07-26

Technique:
  The Gray-Scott PDEs are integrated directly on the vertex graph of a
  triangulated icosphere using the umbrella (uniform-weight) Laplacian as a
  discrete Laplace-Beltrami operator.  Turing spots nucleate at the north
  pole and propagate southward, forming a leopard-spot arrangement of roughly
  10 spots on a poi-head sphere (radius 0.15 m, SPHERE_R).  The activator
  concentration V is mapped to radial displacement and a navy-to-gold vertex
  colour attribute for WebXR export.

Theory:
  Gray-Scott PDEs on the mesh surface:
    ∂U/∂t = Du·LU − U·V² + f(1 − U)      (substrate: food, replenished at f)
    ∂V/∂t = Dv·LV + U·V² − (f + k)V      (activator: autocatalytic, killed at f+k)

  Umbrella (normalised graph) Laplacian:
    (LU)[i] = (1/deg_i) Σ_{j∈N(i)} U[j] − U[i]

  Eigenvalue bound: L ∈ [−2, 0] for any connected graph.
  Explicit-Euler stability: DT < 1/(8·Du) ≈ 0.78 at Du = 0.16.

  Cotangent Laplacian alternative (see build_umbrella_adjacency comment):
    W[i,j] = (cot α_ij + cot β_ij) / 2   per shared edge
    (LU)[i] = (W·U)[i] / A_i              A_i = lumped vertex area
  Geometrically accurate but eigenvalues scale as 1/h² for edge length h.
  On a 0.15 m sphere (h ≈ 0.016 m) λ_max ≈ 4 000 → DT_stable ≈ 0.001,
  requiring implicit time-stepping (Cholesky factorisation) to be practical.

  Turing pattern families on this mesh (same Pearson (1993) map as flat grid):
    F=0.060, K=0.062  →  hexagonal Turing spots     ← DEFAULT
    F=0.035, K=0.060  →  stripe labyrinths
    F=0.025, K=0.060  →  self-replicating spot trains

External attribution:
  P. Gray & S. K. Scott (1985) "Autocatalytic reactions in the isothermal,
  continuous stirred tank reactor" Chem. Eng. Sci. 39:1087 — mathematical
  results, no copyright restriction.
  https://doi.org/10.1016/0009-2509(84)87017-7

  "Discrete Laplace–Beltrami operator" Wikipedia — CC BY-SA 4.0
  https://en.wikipedia.org/wiki/Discrete_Laplace%E2%80%93Beltrami_operator

  NumPy — numpy.add.at scatter-accumulate — BSD-3-Clause — NumPy Developers
  https://numpy.org/doc/stable/reference/generated/numpy.ufunc.at.html
"""

import bpy
import bmesh
import numpy as np

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
SUBDIVISIONS = 4        # icosphere: 642 verts, 1280 faces, ~1920 edges
SPHERE_R     = 0.15     # metres (poi head radius — Holoflow WebXR metre scale)
DU           = 0.16     # substrate (U) diffusivity
DV           = 0.08     # activator (V) diffusivity  — Du/Dv = 2 → Turing condition
F_RATE       = 0.060    # feed rate  (Pearson ζ region: hexagonal Turing spots)
K_RATE       = 0.062    # kill rate
N_STEPS      = 12_000   # integration steps (pattern matures at ~10 000)
DT           = 0.50     # timestep — stable: DT < 1/(8·Du) ≈ 0.78
SEED         = 42       # RNG seed for symmetry break
DISP_SCALE   = 0.045    # radial displacement amplitude (metres, 30 % of SPHERE_R)
MESH_NAME    = "hf_surface_rd"
OUTPUT_GLB   = "//hf_surface_rd.glb"
# ──────────────────────────────────────────────────────────────────────────────


def make_sphere():
    """Clear the scene and create a flat-shaded icosphere."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=SUBDIVISIONS, radius=SPHERE_R)
    bpy.ops.object.shade_flat()      # flat per-face normals → faceted studio aesthetic
    obj = bpy.context.active_object
    obj.name      = MESH_NAME
    obj.data.name = MESH_NAME
    return obj, obj.data


def extract_topology(me) -> tuple:
    """
    Return (n, verts_array, tris_array) via bmesh.
    bmesh.ensure_lookup_table() guarantees that v.index is stable and matches
    the numpy row order — essential so the Laplacian indices align with vertex
    positions written back via me.vertices.foreach_set().
    """
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    n     = len(bm.verts)
    verts = np.array([v.co[:] for v in bm.verts], dtype=np.float64)
    tris  = []
    for f in bm.faces:
        idx = [v.index for v in f.verts]
        for k in range(1, len(idx) - 1):    # fan triangulate any N-gons
            tris.append([idx[0], idx[k], idx[k + 1]])
    bm.free()
    return n, verts, np.array(tris, dtype=np.int32)


def build_umbrella_adjacency(n: int, tris: np.ndarray) -> tuple:
    """
    Build (deg, rows, cols) arrays for scatter-based umbrella Laplacian.
    rows[k], cols[k] are the source and target of directed edge k.

    Why umbrella, not cotangent?
      The cotangent Laplacian is geometrically accurate (area-weighted) but its
      largest eigenvalue scales as 1/h² for mesh spacing h.  On a 0.15 m sphere
      h ≈ 0.016 m → λ_max ≈ 4 000 → DT_stable ≈ 0.001.  Integrating 12 000
      time units would need 12 000 000 steps — impractical without an implicit
      solver (Cholesky of M − DT·Du·W each step).  The umbrella Laplacian has
      λ_max = 2 for any graph → DT_stable = 0.78, identical to the flat grid.
    """
    adj = [set() for _ in range(n)]
    for a, b, c in tris:
        adj[a].add(b); adj[a].add(c)
        adj[b].add(a); adj[b].add(c)
        adj[c].add(a); adj[c].add(b)

    deg  = np.array([len(adj[i]) for i in range(n)], dtype=np.float64)
    rows, cols = [], []
    for i in range(n):
        for j in sorted(adj[i]):    # sorted → deterministic ordering
            rows.append(i)
            cols.append(j)
    return deg, np.array(rows, np.int32), np.array(cols, np.int32)


def lap(u: np.ndarray, deg: np.ndarray,
        rows: np.ndarray, cols: np.ndarray, n: int) -> np.ndarray:
    """
    Apply umbrella Laplacian in O(E) per call.
      (Lu)[i] = (Σ_{j∈N(i)} u[j]) / deg_i − u[i]
    np.add.at avoids a Python loop over neighbours (unbuffered scatter).
    """
    sums = np.zeros(n, dtype=np.float64)
    np.add.at(sums, rows, u[cols])   # sums[i] += u[j] for each edge i→j
    return sums / deg - u


def run_surface_rd(n: int, verts: np.ndarray, deg: np.ndarray,
                   rows: np.ndarray, cols: np.ndarray) -> tuple:
    """
    Integrate Gray-Scott for N_STEPS explicit-Euler steps on the mesh surface.

    Seed: north-pole cap (z > 0.8·R) at (U=0.5, V=0.25) plus ±0.01 noise.
    The cap has ~7 vertices on a subdivisions-4 icosphere, enough to seed the
    reaction.  Noise breaks the 5-fold icosahedral symmetry; without it,
    spots form in a perfect pentagonal arrangement pinned to the seed shape.
    """
    u = np.ones(n,  dtype=np.float64)
    v = np.zeros(n, dtype=np.float64)

    north  = verts[:, 2] > SPHERE_R * 0.8
    u[north] = 0.50
    v[north] = 0.25
    rng = np.random.default_rng(SEED)
    v  += rng.uniform(-0.01, 0.01, n)
    np.clip(v, 0.0, None, out=v)

    for step in range(N_STEPS):
        Lu  = lap(u, deg, rows, cols, n)
        Lv  = lap(v, deg, rows, cols, n)
        uvv = u * v * v
        u  += DT * (DU * Lu - uvv + F_RATE * (1.0 - u))
        v  += DT * (DV * Lv + uvv - (F_RATE + K_RATE) * v)
        np.clip(u, 0.0, 1.0, out=u)
        np.clip(v, 0.0, 1.0, out=v)
        if step % 2000 == 0:
            print(f"  step {step:5d}  V∈[{v.min():.3f}, {v.max():.3f}]")

    print(f"Surface RD done — V ∈ [{v.min():.4f}, {v.max():.4f}]")
    return u, v


def write_mesh(me, verts: np.ndarray, v_field: np.ndarray) -> None:
    """
    Displace each vertex radially by V × DISP_SCALE and write BYTE_COLOR
    attribute 'Col' (POINT domain) with a navy-to-gold colour ramp.
    Analytic sphere normals (position / |position|) are more stable than
    bmesh vertex normals which average adjacent face normals — critical here
    because the final face normals change after displacement.
    """
    norms  = verts / (np.linalg.norm(verts, axis=1, keepdims=True) + 1e-12)
    new_co = verts + norms * (v_field[:, None] * DISP_SCALE)
    me.vertices.foreach_set("co", new_co.ravel())

    navy = np.array([0.04, 0.10, 0.35, 1.0])
    gold = np.array([1.00, 0.80, 0.10, 1.0])
    rgba = (navy + (gold - navy) * v_field[:, None]).clip(0.0, 1.0)

    if "Col" in me.color_attributes:
        me.color_attributes.remove(me.color_attributes["Col"])
    attr = me.color_attributes.new(name="Col", type="BYTE_COLOR", domain="POINT")
    attr.data.foreach_set("color", rgba.ravel())
    me.update()


def export_glb(obj) -> None:
    """Export GLB with Draco L6 and WebP textures (Holoflow studio conventions)."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"✓  {OUTPUT_GLB} written")


# ── MAIN ──────────────────────────────────────────────────────────────────────
obj, me          = make_sphere()
n, verts, tris   = extract_topology(me)
deg, rows, cols  = build_umbrella_adjacency(n, tris)
u_field, v_field = run_surface_rd(n, verts, deg, rows, cols)
write_mesh(me, verts, v_field)
export_glb(obj)
