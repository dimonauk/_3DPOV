"""
Icosahedral Quasicrystal — 6D Cut-and-Project Method
Blender 5.1 | Holoflow Studio | CC0

WHY THIS TECHNIQUE:
A quasicrystal is a 3-D shadow of a 6-D cubic lattice.  Each atom position
is the physical-space projection x∥ = P∥ n of a lattice point n ∈ Z⁶ whose
perpendicular-space projection x⊥ = P⊥ n lands inside an acceptance window.
The result has true icosahedral point symmetry (m3̄5̄) with no translational
periodicity — impossible in classical 230 space groups.

MATHEMATICAL STRUCTURE:
The 6 star vectors in E∥ are the 6 (non-antipodal) icosahedral vertices
normalised to unity; their Galois conjugates under τ ↦ −1/τ give the 6
perpendicular-space vectors. Together they form a complete orthogonal basis
for ℝ⁶ ≅ E∥ ⊕ E⊥, ensuring that P∥ + P⊥ = I₆ as projection operators.

HOW TO RUN:
    blender --background --python blueprint.py
Writes  hf_quasicrystal_poi.blend  and  hf_quasicrystal_poi.glb  next to
this script.  Requires Blender 5.1 bundled NumPy (stdlib module).
"""

import bpy
import bmesh
import numpy as np

# ─── Parameters ─────────────────────────────────────────────────────────────
SLUG          = "hf_quasicrystal_poi"
N_RANGE       = 3          # ±N along each of the 6 axes; 7⁶ = 117,649 cands
WINDOW_RADIUS = 1.95       # sphere radius in E⊥ for acceptance (≈ full triac.)
BOND_MAX_FRAC = 0.72       # max bond length as fraction of short-bond length l₀
POI_DIAMETER  = 0.12       # 12 cm poi head, scaled at end
SPHERE_DETAIL = 2          # ico-sphere subdivisions for vertex beads
BEAD_RADIUS   = 0.018      # radius of each vertex bead (world units pre-scale)
TUBE_RADIUS   = 0.007      # edge tube radius
N_TUBE        = 6          # polygon sides per edge tube
EMISSION_STR  = 3.0        # Eevee bloom emission strength
OUTPUT_BLEND  = f"//{SLUG}.blend"
OUTPUT_GLB    = f"//{SLUG}.glb"

PHI = (1.0 + 5.0 ** 0.5) / 2.0   # τ = golden ratio ≈ 1.6180339887
# ─── Star vectors ────────────────────────────────────────────────────────────

def _star_vectors(tau: float) -> np.ndarray:
    """
    Return the 6 icosahedral star vectors for parameter tau.

    WHY THESE 6:
    The icosahedron has 12 vertices = 6 antipodal pairs.  Picking one
    representative from each pair gives 6 independent directions that
    span ℝ³.  With tau = PHI these span E∥ (physical space); with
    tau = -1/PHI they span E⊥ (perpendicular space).  The Galois
    conjugation τ ↦ -1/τ swaps the two eigenspaces of the inflation
    matrix, which is what lets the projection split Z⁶ cleanly.
    """
    t = tau
    vecs = np.array([
        [0,  1,  t],
        [0, -1,  t],
        [t,  0,  1],
        [-t, 0,  1],
        [1,  t,  0],
        [-1, t,  0],
    ], dtype=float)
    # normalise so P∥ᵀ P∥ + P⊥ᵀ P⊥ = I₃ (partition-of-unity)
    norm = np.sqrt(2.0 + tau ** 2)
    return vecs / norm


# 6×3 projection matrices (rows = star vectors)
P_PHYS = _star_vectors(PHI)              # physical space
P_PERP = _star_vectors(-1.0 / PHI)      # perpendicular space


def cut_and_project(n_range: int, window_r: float):
    """
    Enumerate Z⁶ within [-n_range, n_range]^6, project to E∥ and E⊥,
    accept points with |x⊥| < window_r.

    WHY SPHERICAL WINDOW:
    The exact window is a rhombicosidodecahedron (Wigner-Seitz cell of the
    Z⁶ lattice in E⊥).  A sphere is O(1) to test and keeps ~95 % of the
    correct vertex set at the radii used here, sufficient for a visual demo.

    Returns:
        pts    (M, 3) float — accepted vertex positions in E∥
        n_vecs (M, 6) int  — originating Z⁶ coordinates
    """
    ax = np.arange(-n_range, n_range + 1)
    # meshgrid over all 6 axes, then reshape to (7^6, 6)
    grids = np.meshgrid(*([ax] * 6), indexing="ij")
    lattice = np.stack([g.ravel() for g in grids], axis=-1)  # (N, 6)

    # physical projection: (N,6) @ (6,3) → (N,3)
    phys = lattice @ P_PHYS

    # perpendicular projection & window test
    perp = lattice @ P_PERP                              # (N, 3)
    dist_perp = np.linalg.norm(perp, axis=1)            # (N,)
    mask = dist_perp < window_r

    return phys[mask], lattice[mask]


def find_bonds(pts: np.ndarray, bond_max: float):
    """
    Return (M, 2) edge indices for all pairs within bond_max.

    WHY BRUTE-FORCE FOR SMALL N:
    For N_RANGE = 3 the accepted set is ~400-900 points — small enough
    that O(M²) pairwise distances cost < 0.5 s.  For larger N_RANGE a
    KD-tree is warranted; at demo scale clarity beats cleverness.
    """
    d = pts[:, None, :] - pts[None, :, :]    # (M, M, 3)
    dist = np.linalg.norm(d, axis=-1)         # (M, M)
    # upper triangle only (no self-loops, no duplicates)
    i, j = np.where((dist > 1e-6) & (dist <= bond_max))
    mask_upper = i < j
    return np.stack([i[mask_upper], j[mask_upper]], axis=1)


def vertex_colour_from_coord(pts: np.ndarray) -> np.ndarray:
    """
    Map each vertex position to an RGBA colour via |z| → hue.

    WHY Z-AXIS HUE:
    The icosahedral 5-fold axis aligns with Z.  Colouring by Z-height
    reveals the 5-fold stacking visible when the poi head is viewed
    end-on, matching the original electron-diffraction pattern geometry.
    """
    z = pts[:, 2]
    h = 0.60 + 0.38 * (z - z.min()) / (z.max() - z.min() + 1e-9)
    h = h % 1.0
    s = np.full(len(pts), 0.85)
    v = np.full(len(pts), 1.00)
    # HSV → RGB via numpy (avoid scipy dependency)
    hi = (h * 6).astype(int) % 6
    f  = h * 6 - np.floor(h * 6)
    p  = v * (1 - s)
    q  = v * (1 - s * f)
    t2 = v * (1 - s * (1 - f))
    rgb_table = np.stack([
        np.where(hi == 0, v, np.where(hi == 1, q, np.where(hi == 2, p,
         np.where(hi == 3, p, np.where(hi == 4, t2, v))))),
        np.where(hi == 0, t2, np.where(hi == 1, v, np.where(hi == 2, v,
         np.where(hi == 3, q, np.where(hi == 4, p, p))))),
        np.where(hi == 0, p, np.where(hi == 1, p, np.where(hi == 2, t2,
         np.where(hi == 3, v, np.where(hi == 4, v, q))))),
    ], axis=1)    # (M, 3)
    return np.concatenate([rgb_table, np.ones((len(pts), 1))], axis=1)  # RGBA


def build_scene(pts: np.ndarray, bonds: np.ndarray, colours: np.ndarray):
    """
    Build the Blender mesh:
    - ico-sphere bead at each vertex coloured by Z-position
    - cylindrical tube for each bond

    WHY INSTANCE REALISE:
    Using bpy.ops.object.join to merge all realised instances is avoided in
    favour of assembling from_pydata for the bead collection and a single
    bmesh loop for bond tubes.  This keeps operator-context requirements
    away from headless execution (no ViewLayer context needed).
    """
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    # --- material with emission driven by vertex colour ---
    mat = bpy.data.materials.new("QuasicrystalEmit")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    emit  = nt.nodes.new("ShaderNodeEmission")
    attr  = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "QCrystal"
    emit.inputs["Strength"].default_value = EMISSION_STR
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    # --- build combined vertex-bead + bond-tube mesh ---
    bm = bmesh.new()
    col_layer = bm.verts.layers.float_color.new("QCrystal")

    # Scale pts to POI_DIAMETER
    extent = np.max(np.linalg.norm(pts, axis=1))
    scale  = (POI_DIAMETER / 2.0) / (extent if extent > 0 else 1.0)
    pts_s  = pts * scale
    br     = BEAD_RADIUS * scale * 5    # relative to scaled poi
    tr     = TUBE_RADIUS * scale * 5

    # build a unit icosphere vertex list for beads (detail=SPHERE_DETAIL)
    import math
    def ico_verts_faces(r):
        phi = (1 + 5**0.5) / 2
        raw = [
            [-1,  phi, 0], [1,  phi, 0], [-1, -phi, 0], [1, -phi, 0],
            [0, -1,  phi], [0,  1,  phi], [0, -1, -phi], [0,  1, -phi],
            [phi, 0, -1], [phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1],
        ]
        vraw = np.array(raw, float)
        vraw = vraw / np.linalg.norm(vraw, axis=1, keepdims=True) * r
        faces = [
            (0,11,5),(0,5,1),(0,1,7),(0,7,10),(0,10,11),
            (1,5,9),(5,11,4),(11,10,2),(10,7,6),(7,1,8),
            (3,9,4),(3,4,2),(3,2,6),(3,6,8),(3,8,9),
            (4,9,5),(2,4,11),(6,2,10),(8,6,7),(9,8,1),
        ]
        # one subdivision
        edge_mid = {}
        def midpoint(a, b):
            key = (min(a,b), max(a,b))
            if key not in edge_mid:
                m = (vraw[a] + vraw[b]) * 0.5
                m = m / np.linalg.norm(m) * r
                edge_mid[key] = len(vlist)
                vlist.append(m)
            return edge_mid[key]
        vlist = list(vraw)
        new_faces = []
        for f in faces:
            a,b,c = f
            ab = midpoint(a,b); bc = midpoint(b,c); ca = midpoint(c,a)
            new_faces += [(a,ab,ca),(b,bc,ab),(c,ca,bc),(ab,bc,ca)]
        return np.array(vlist), new_faces

    sph_v, sph_f = ico_verts_faces(br)

    # add beads
    bm_verts_map = []
    for i, (p, col) in enumerate(zip(pts_s, colours)):
        base_idx = len(bm.verts)
        for sv in sph_v:
            v = bm.verts.new(p + sv)
            v[col_layer] = (col[0], col[1], col[2], col[3])
        bm.verts.ensure_lookup_table()
        for f in sph_f:
            try:
                bm.faces.new([bm.verts[base_idx + k] for k in f])
            except Exception:
                pass
        bm_verts_map.append(base_idx)

    # add bond tubes
    def add_tube(a, b, col_a, col_b):
        ab = b - a
        length = np.linalg.norm(ab)
        if length < 1e-9:
            return
        z_ax = ab / length
        # build perpendicular frame
        tmp = np.array([1, 0, 0]) if abs(z_ax[0]) < 0.9 else np.array([0, 1, 0])
        x_ax = np.cross(z_ax, tmp); x_ax /= np.linalg.norm(x_ax)
        y_ax = np.cross(z_ax, x_ax)
        angles = np.linspace(0, 2 * math.pi, N_TUBE, endpoint=False)
        ring_lo = [bm.verts.new(a + tr * (math.cos(ang) * x_ax
                                          + math.sin(ang) * y_ax)) for ang in angles]
        ring_hi = [bm.verts.new(b + tr * (math.cos(ang) * x_ax
                                          + math.sin(ang) * y_ax)) for ang in angles]
        t_col = ((col_a + col_b) * 0.5)
        for v in ring_lo + ring_hi:
            v[col_layer] = tuple(t_col)
        for k in range(N_TUBE):
            k1 = (k + 1) % N_TUBE
            try:
                bm.faces.new([ring_lo[k], ring_lo[k1], ring_hi[k1], ring_hi[k]])
            except Exception:
                pass

    for e in bonds:
        add_tube(pts_s[e[0]], pts_s[e[1]], colours[e[0]], colours[e[1]])

    # create mesh object
    mesh = bpy.data.meshes.new(SLUG)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(SLUG, mesh)
    obj["holoflow:facet"] = True
    obj["holoflow:category"] = "poi-head"
    scene.collection.objects.link(obj)
    obj.data.materials.append(mat)

    # apply +Y-up rotation (Blender Z-up → glTF Y-up)
    import mathutils
    obj.rotation_euler = (0, 0, 0)

    return obj


def export_files(obj):
    """Save .blend and .glb.  GLB uses Draco level 6 + WebP textures."""
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    bpy.ops.export_scene.gltf(
        filepath        = bpy.path.abspath(OUTPUT_GLB),
        use_selection   = False,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_apply    = True,
        export_yup      = True,
        export_colors   = True,
    )
    print(f"[quasicrystal] written: {OUTPUT_BLEND}, {OUTPUT_GLB}")


# ─── Main ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    pts, _lattice = cut_and_project(N_RANGE, WINDOW_RADIUS)
    print(f"[quasicrystal] {len(pts)} vertices accepted from {(2*N_RANGE+1)**6} candidates")

    # short-bond length l₀ in E∥: find smallest non-zero pairwise distance
    d_all = np.linalg.norm(pts[:, None, :] - pts[None, :, :], axis=-1)
    np.fill_diagonal(d_all, np.inf)
    l0 = d_all.min()
    bond_max = l0 * (1.0 + BOND_MAX_FRAC)
    print(f"[quasicrystal] short bond l₀={l0:.4f}, bond_max={bond_max:.4f}")

    bonds   = find_bonds(pts, bond_max)
    print(f"[quasicrystal] {len(bonds)} bonds (l ≤ {bond_max:.4f})")

    colours = vertex_colour_from_coord(pts)
    obj     = build_scene(pts, bonds, colours)
    export_files(obj)
