"""
Feigenbaum Bifurcation Disc — Blender 5.1 Blueprint
====================================================
Technique: the logistic map f_r(x) = r·x·(1−x), a one-parameter family of
interval maps, exhibits a universal route to chaos through successive
period-doubling bifurcations.  The parameter r at which the nth period-
doubling occurs forms a geometric sequence converging to r∞ ≈ 3.5699...
The ratio of consecutive bifurcation gaps converges to
    δ = lim (r_n − r_{n-1}) / (r_{n+1} − r_n) ≈ 4.66920160910...
This is the first Feigenbaum constant, proved universal for ALL unimodal maps
with a quadratic maximum (Feigenbaum 1978/79).  The vertical scaling constant
    α ≈ −2.50290787509...
governs the self-similar reduction in x-amplitude at each bifurcation.

GEOMETRY
The disc's radial axis encodes the r parameter [R_MIN, R_MAX].
Each ring is one r-value; the angular axis encodes x ∈ [0,1] → θ = 2π·x.
Height Z(r, x) = (visit density of orbit at r landing in bin x) × H_SCALE.
Period-1 → one narrow spike per ring.
Period-2 → two antipodal spikes.
Chaos   → broad smear of moderate-height spikes.
Period-3 window (r ≈ 3.833) → three spikes emerge inside the chaotic sea.
"""

import bpy
import numpy as np

# ─── NAMED CONSTANTS ────────────────────────────────────────────────────────
SLUG      = "hf_feigenbaum_poi"
OBJ_NAME  = "Feigenbaum_Bifurcation_Disc"
MAT_NAME  = "Feigenbaum_Mat"
ATTR_NAME = "Feigenbaum_Density"

N_R     = 200          # rings along radial axis (r-parameter resolution)
N_THETA = 180          # sectors (x ∈ [0,1] → θ ∈ [0,2π])
WARM_UP = 1_000        # transient steps discarded per r value
N_ORBIT = 800          # orbit points collected per r value

RAD_INNER = 0.08       # inner disc radius (m) — hole for tether clip
RAD_OUTER = 0.46       # outer disc radius (m)
H_SCALE   = 0.14       # max height (m) at normalised density = 1.0

# Feigenbaum landmark r-values (for annotation / shape key windows)
R_BIFURC_1 = 3.000     # period-1 → period-2
R_BIFURC_2 = 3.449     # period-2 → period-4
R_BIFURC_3 = 3.544     # period-4 → period-8
R_CHAOS    = 3.570     # accumulation point (chaos onset)
R_PERIOD3  = 3.833     # period-3 window centre (Li-Yorke 1975)

# Shape-key windows (name, r_min, r_max)
# Each zooms into a different parameter sub-range while the disc geometry
# (radii, angular layout) stays identical — only Z heights change.
WINDOWS = [
    ("Basis",           2.80, 4.00),   # full bifurcation diagram
    ("SK_FirstBifurc",  2.95, 3.15),   # period-1 → period-2 transition
    ("SK_Cascade",      3.40, 3.58),   # period-doubling cascade
    ("SK_ChaoticOnset", 3.55, 3.65),   # chaos onset / intermittency
    ("SK_Period3Win",   3.82, 3.88),   # period-3 window (r ≈ 3.833)
]

COL_AMBER  = (0.88, 0.52, 0.04, 1.0)  # visited orbit state
COL_COBALT = (0.06, 0.14, 0.66, 1.0)  # forbidden (non-attractor) state


# ─── ORBIT DENSITY ──────────────────────────────────────────────────────────
def compute_density(r_min: float, r_max: float) -> "np.ndarray":
    """
    Return row-normalised density[N_R, N_THETA] (float32).
    All N_R logistic chains iterate in parallel via numpy broadcasting —
    the burn-in and collection loops are O(WARM_UP + N_ORBIT) numpy ops,
    not Python loops over ring indices.
    WHY vectorise: 200 chains × 1800 iterations = 360 000 map evaluations
    per window; vectorised version runs in <0.1 s vs ~15 s for a Python loop.
    """
    r_arr = np.linspace(r_min, r_max, N_R, dtype=np.float64)  # (N_R,)
    x     = np.full(N_R, 0.5, dtype=np.float64)

    # burn-in — transient depends on r (near bifurcation points it is long)
    for _ in range(WARM_UP):
        x = r_arr * x * (1.0 - x)

    density = np.zeros((N_R, N_THETA), dtype=np.float32)
    idx_r   = np.arange(N_R, dtype=np.int32)

    for _ in range(N_ORBIT):
        x = r_arr * x * (1.0 - x)
        # clip guards against fp overflow near r=4, x~0 or x~1
        j = np.clip((x * N_THETA).astype(np.int32), 0, N_THETA - 1)
        np.add.at(density, (idx_r, j), 1.0)

    # 3-tap circular smoothing along θ: reduces salt-pepper noise in chaotic
    # bands without blurring periodic spikes into their neighbours
    d       = density
    density = 0.5 * d + 0.25 * np.roll(d, 1, axis=1) + 0.25 * np.roll(d, -1, axis=1)

    # row-normalise: each r-value contributes equal visual weight regardless
    # of how clustered or spread the attractor is
    row_max = density.max(axis=1, keepdims=True)
    row_max[row_max == 0.0] = 1.0
    return (density / row_max).astype(np.float32)


# ─── GEOMETRY BUILDERS ──────────────────────────────────────────────────────
def ring_radii() -> "np.ndarray":
    """Linear map from ring index to physical radius (same for all shape keys)."""
    t = np.linspace(0.0, 1.0, N_R)
    return (RAD_INNER + t * (RAD_OUTER - RAD_INNER)).astype(np.float32)


def make_vertex_positions(density: "np.ndarray") -> "np.ndarray":
    """
    Flat (N_R*N_THETA, 3) vertex array.
    x, y from polar grid; z = density × H_SCALE.
    indexing='ij' → row i = ring i (constant radius across all N_THETA cols).
    """
    radii        = ring_radii()                                  # (N_R,)
    theta        = np.linspace(0.0, 2.0 * np.pi, N_THETA, endpoint=False)
    RR, TT       = np.meshgrid(radii, theta, indexing="ij")     # (N_R, N_THETA)
    X            = RR * np.cos(TT)
    Y            = RR * np.sin(TT)
    Z            = density * H_SCALE
    return np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=-1).astype(np.float32)


def make_quad_faces() -> list:
    """
    Quad face list connecting adjacent rings with circular closure in θ.
    CCW winding viewed from +Z → outward normals (Blender convention).
    WHY closure via % N_THETA: the last sector wraps back to sector 0
    so the disc is topologically a cylinder (open at inner/outer edges).
    """
    faces = []
    for i in range(N_R - 1):
        for j in range(N_THETA):
            j1 = (j + 1) % N_THETA
            a  =  i      * N_THETA + j
            b  = (i + 1) * N_THETA + j
            c  = (i + 1) * N_THETA + j1
            d  =  i      * N_THETA + j1
            faces.append((a, b, c, d))
    return faces


# ─── VERTEX COLOURS ─────────────────────────────────────────────────────────
def apply_vertex_colours(mesh: "bpy.types.Mesh", density: "np.ndarray") -> None:
    """
    FLOAT_COLOR POINT attribute on the mesh.
    Amber where density > threshold (orbit visits this state),
    cobalt where density ≈ 0 (forbidden / non-attractor state).
    The binary amber/cobalt map makes the period-doubling cascade
    immediately legible: rings split from one amber arc to two, then four.
    """
    d_flat  = density.ravel()                          # (N_R*N_THETA,)
    visited = (d_flat > 0.02).astype(np.float32)      # 0 or 1
    amber   = np.array(COL_AMBER,  dtype=np.float32)
    cobalt  = np.array(COL_COBALT, dtype=np.float32)
    colours = cobalt + visited[:, None] * (amber - cobalt)  # (N_V, 4)

    attr = mesh.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", colours.ravel())


# ─── MATERIAL ───────────────────────────────────────────────────────────────
def make_material() -> "bpy.types.Material":
    mat = bpy.data.materials.get(MAT_NAME)
    if mat:
        bpy.data.materials.remove(mat)
    mat            = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes  = True
    nt             = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type  = "GEOMETRY"          # reads POINT domain colour

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    bsdf.inputs["Roughness"].default_value = 0.32
    bsdf.inputs["Metallic"].default_value  = 0.08

    out.location  = (400, 0)
    bsdf.location = (100, 0)
    attr.location = (-200, 0)
    return mat


# ─── SHAPE KEY UTILITY ──────────────────────────────────────────────────────
def add_shape_key(obj: "bpy.types.Object", name: str,
                  positions: "np.ndarray") -> None:
    """
    Add a shape key from absolute vertex positions.
    foreach_set expects co[i] = absolute position of vertex i in this key.
    WHY not from_mix=True: we want a clean override per window, not a blend
    of whatever the active-key stack currently contains.
    """
    sk = obj.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set("co", positions.ravel())


# ─── MAIN ───────────────────────────────────────────────────────────────────
def build() -> None:
    # ── Cleanup ──
    for o in list(bpy.data.objects):
        if o.name.startswith(OBJ_NAME) or o.name.startswith(SLUG):
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        if m.name.startswith(OBJ_NAME):
            bpy.data.meshes.remove(m)

    # ── Base mesh from Basis window ──
    density_basis = compute_density(*WINDOWS[0][1:])
    verts_np      = make_vertex_positions(density_basis)
    faces         = make_quad_faces()

    mesh = bpy.data.meshes.new(OBJ_NAME)
    mesh.from_pydata(verts_np.tolist(), [], faces)
    mesh.update()

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── Vertex colours ──
    apply_vertex_colours(mesh, density_basis)

    # ── Material ──
    obj.data.materials.append(make_material())

    # ── Shape keys ──
    # Index 0 must be Basis (created from current vertex positions)
    obj.shape_key_add(name="Basis", from_mix=False)
    for name, r_min, r_max in WINDOWS[1:]:
        d  = compute_density(r_min, r_max)
        vp = make_vertex_positions(d)
        add_shape_key(obj, name, vp)

    # ── Studio metadata ──
    obj.name              = SLUG
    obj["holoflow:facet"] = True

    # Flat shading — faceted look matches studio aesthetic
    for poly in mesh.polygons:
        poly.use_smooth = False

    n_v = len(verts_np)
    n_f = len(faces)
    print(f"[Feigenbaum] {n_v} vertices, {n_f} faces, "
          f"{len(WINDOWS)} shape keys.  "
          f"δ ≈ 4.66920  α ≈ −2.50291")


build()
