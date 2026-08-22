"""
blueprint.py — IFS Chaos Game: Barnsley Fern, Sierpinski & 3D Dragon Curve
Blender 5.1  |  CC0  |  Holoflow Studio
──────────────────────────────────────────────────────────────────────────
Iterated Function System (IFS) theory: a finite set of contractive affine
maps {f₁,…,fₙ} on ℝⁿ has a unique non-empty compact attractor A (Hutchinson
1981) satisfying A = f₁(A) ∪ … ∪ fₙ(A).  The chaos game samples A by
iterating xₙ₊₁ = fₖ(xₙ) with k chosen at random with probability pₖ ∝ |det fₖ|.
Consecutive points in this walk are always nearby (each fₖ is contractive),
so each CHUNK_SIZE-point window forms a natural brushstroke — directly usable
as a NURBS spline without any nearest-neighbour sort.
"""

import bpy
import numpy as np

# ── parameters ───────────────────────────────────────────────────────────────
N_POINTS   = 30_000   # chaos-game iterations per fractal (after warm-up)
WARM_UP    = 50       # discard transient before attractor is reached
CHUNK_SIZE = 150      # points per NURBS brushstroke spline
BEVEL_DPTH = 0.003   # tube radius (metres)
SCALE      = 0.10    # world scale (IFS units → metres)
EXPORT_GLB = True

OUT = "//public/library/blends/scripting/" \
      "python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr/"

# ── IFS rule tables ──────────────────────────────────────────────────────────
# Row format: [a, b, c, d, e, f, p]
# Transform:  x' = a·x + b·y + e
#             y' = c·x + d·y + f
#             p  = selection probability (proportional to |det [a b; c d]|)

# Barnsley (1988): four affine maps whose attractor is the Barnsley Fern.
# Probabilities match the area scaling of each map (|det| values:
#   f1→0.000, f2→0.7225, f3→0.100, f4→0.100; renormalised to {0.01,0.85,0.07,0.07}).
BARNSLEY_FERN = np.array([
    # a      b      c      d      e     f     p
    [0.000,  0.000, 0.000, 0.160, 0.00, 0.00, 0.01],  # stem (maps entire fern to base)
    [0.850,  0.040,-0.040, 0.850, 0.00, 1.60, 0.85],  # successive leaflets
    [0.200, -0.260, 0.230, 0.220, 0.00, 1.60, 0.07],  # left leaflet rotation
    [-0.150, 0.280, 0.260, 0.240, 0.00, 0.44, 0.07],  # right leaflet rotation
], dtype=np.float64)

# Sierpinski triangle: three maps, each contracting by 1/2 toward a triangle vertex.
# |det| = 0.25 per map → equal probability.  Vertices at (0,0), (1,0), (0.5,0.5).
SIERPINSKI = np.array([
    [0.50, 0.00, 0.00, 0.50,  0.000, 0.000, 0.333],
    [0.50, 0.00, 0.00, 0.50,  0.500, 0.000, 0.333],
    [0.50, 0.00, 0.00, 0.50,  0.250, 0.500, 0.334],
], dtype=np.float64)

# Dragon curve: two maps. |det| = 0.5 per map → equal probability.
# The 2-D attractor tiles ℝ² under reflections; adding a Z helix per step
# converts the flat fractal into a poi-style 3-D light trail.
DRAGON_CURVE = np.array([
    [ 0.500,-0.500, 0.500, 0.500, 0.000, 0.000, 0.50],
    [-0.500, 0.500,-0.500,-0.500, 1.000, 0.000, 0.50],
], dtype=np.float64)

Z_HELIX_PER_STEP = 0.004   # metres accumulated per chaos-game iteration (pre-scale)


def chaos_game(rules: np.ndarray, n: int, z_per_step: float = 0.0) -> np.ndarray:
    """
    Run the chaos game for the IFS defined by `rules`.

    Returns (n, 3) float64 array in IFS coordinate space.
    `z_per_step` adds a cumulative Z offset — turning any 2-D IFS into a
    3-D helix that wraps through space (used for the Dragon Curve).
    """
    K = len(rules)
    # normalised cumulative probabilities for np.searchsorted lookup
    cdf = np.cumsum(rules[:, 6])
    cdf /= cdf[-1]

    rng       = np.random.default_rng(0)
    rand_vals = rng.random(n + WARM_UP)

    pts = np.empty((n + WARM_UP, 3), dtype=np.float64)
    x = y = z = 0.0

    for i in range(n + WARM_UP):
        k = int(np.searchsorted(cdf, rand_vals[i]))
        k = min(k, K - 1)
        a, b, c, d, e, f, _ = rules[k]
        x, y = a * x + b * y + e, c * x + d * y + f
        z += z_per_step
        pts[i, 0] = x
        pts[i, 1] = y
        pts[i, 2] = z

    return pts[WARM_UP:]


def make_curves(name: str, pts3d: np.ndarray, rgb: tuple) -> bpy.types.Object:
    """
    Pack the point array into NURBS brushstroke splines (CHUNK_SIZE pts each),
    add a bevel for tube rendering, and assign an emission material.
    """
    if name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

    scaled = pts3d * SCALE

    cd = bpy.data.curves.new(name, "CURVE")
    cd.dimensions       = "3D"
    cd.bevel_depth      = BEVEL_DPTH
    cd.bevel_resolution = 2
    cd.use_fill_caps    = True

    n_chunks = len(scaled) // CHUNK_SIZE
    for ci in range(n_chunks):
        chunk = scaled[ci * CHUNK_SIZE : (ci + 1) * CHUNK_SIZE]
        sp = cd.splines.new("NURBS")
        sp.points.add(len(chunk) - 1)
        for j, (px, py, pz) in enumerate(chunk):
            sp.points[j].co = (px, py, pz, 1.0)  # NURBS: 4-D homogeneous w=1
        sp.order_u        = min(4, len(chunk))
        sp.use_endpoint_u = True

    obj = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(obj)

    # emission material
    mn = f"_mat_{name}"
    if mn in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[mn])
    mat = bpy.data.materials.new(mn)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    em  = tree.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value    = (*rgb, 1.0)
    em.inputs["Strength"].default_value = 3.5
    tree.links.new(em.outputs["Emission"], out.inputs["Surface"])
    cd.materials.append(mat)

    return obj


def export_glb(obj: bpy.types.Object, fname: str) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=OUT + fname,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        use_selection=True,
    )
    print(f"[hf_ifs] → {fname}")


def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # ── Barnsley Fern (IFS Y is height — remap to Blender +Z)
    fern_pts = chaos_game(BARNSLEY_FERN, N_POINTS)
    fern_pts = fern_pts[:, [0, 2, 1]]          # swap Y↔Z so fern stands upright
    fern_pts[:, 0] -= fern_pts[:, 0].mean()    # centre laterally
    fern_obj = make_curves("hf_ifs_fern", fern_pts, (0.10, 0.90, 0.15))

    # ── Sierpinski Triangle (2-D in XY plane)
    sier_pts = chaos_game(SIERPINSKI, N_POINTS)
    sier_pts[:, 0] -= 0.5                       # centre at origin
    sier_pts[:, 1] -= 0.25
    sier_obj = make_curves("hf_ifs_sierpinski", sier_pts, (1.00, 0.38, 0.05))

    # ── Dragon Curve (3-D helix via Z accumulation)
    drag_pts = chaos_game(DRAGON_CURVE, N_POINTS, z_per_step=Z_HELIX_PER_STEP)
    drag_pts[:, 0] -= 0.5                       # centre the dragon attractor
    drag_obj = make_curves("hf_ifs_dragon", drag_pts, (0.25, 0.15, 1.00))

    # position side-by-side
    fern_obj.location.x = -2.0
    sier_obj.location.x =  0.0
    drag_obj.location.x =  2.0

    bpy.context.view_layer.update()
    print("[hf_ifs] Scene built — Barnsley Fern · Sierpinski · Dragon 3D")

    if EXPORT_GLB:
        export_glb(fern_obj, "hf_ifs_fern.glb")
        export_glb(sier_obj, "hf_ifs_sierpinski.glb")
        export_glb(drag_obj, "hf_ifs_dragon_3d.glb")


main()
