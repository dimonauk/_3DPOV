# ─────────────────────────────────────────────────────────────────────────────
# Ikeda Map  —  Laser-Cavity Attractor  (Blender 5.1 / Holoflow Studio)
# ─────────────────────────────────────────────────────────────────────────────
# The Ikeda map models a monochromatic field amplitude z ∈ ℂ completing round
# trips inside an optical ring cavity filled with a Kerr-nonlinear medium.
# Each iteration contracts and rotates z by the intensity-dependent phase τ:
#
#   τ(z)  = C₀ − C₁ / (1 + |z|²)          Kerr phase-shift  (C₀=0.4  C₁=6)
#   z'    = 1 + μ · z · exp(i·τ(z))        next round-trip field
#
# In real co-ordinates  (z = x + iy):
#   τ  = 0.4 − 6 / (1 + x² + y²)
#   x' = 1 + μ·(x·cos τ − y·sin τ)
#   y' = μ·(x·sin τ + y·cos τ)
#
# At μ < 0.61  →  single stable fixed point (optical bistability).
# μ ≈ 0.61–0.83  →  Feigenbaum period-doubling cascade.
# μ ≥ 0.9   →  fully developed strange attractor: flame/comb topology.
#
# λ₁ ≈ +0.505 bit/iter, λ₂ ≈ −1.85  →  D_KY ≈ 1 + 0.505/1.85 ≈ 1.27
# The map is invertible (det J = μ² everywhere), so it is a diffeomorphism.
#
# Source:  Ikeda K (1979) Opt Comm 30(2):257–261. DOI 10.1016/0030-4018(79)90090-7
#          Equations are public-domain mathematics.
# ─────────────────────────────────────────────────────────────────────────────

import bpy, bmesh, math, numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
MU_BASIS  = 0.90   # canonical chaotic flame attractor
MU_HIGH   = 0.95   # denser flame with finer filaments
MU_MID    = 0.85   # intermediate topology, fewer scrolls
MU_LOW    = 0.70   # period-4 basin — quasi-ordered orbit

N_ITER      = 8_000_000   # iterates recorded into the density grid
BURN_IN     = 10_000      # transient steps discarded before recording
ESCAPE_SQ   = 2500.0      # discard if x²+y² > 50² (numerical runaway guard)

N_GRID   = 120            # 120×120 = 14 400 vertices, 14 161 quads
X_MIN, X_MAX = -2.8, 5.0  # world bounds  (attractor lives in ≈ (−1, 4)×(−3, 3))
Y_MIN, Y_MAX = -4.2, 4.2

MESH_SCALE   = 5.5   # floor half-extent in Blender units
HEIGHT_SCALE = 0.55  # max peak height in BU

COBALT = np.array([0.04, 0.20, 0.78, 1.0])  # deep-blue low density
AMBER  = np.array([0.92, 0.58, 0.04, 1.0])  # warm-gold high density

ATTR_NAME = "Ikeda_Density"  # FLOAT_COLOR attribute referenced by material
MAT_NAME  = "Ikeda_Density_Mat"
OBJ_NAME  = "ikeda_floor"


# ── Density computation ───────────────────────────────────────────────────────
def ikeda_density(mu: float) -> np.ndarray:
    """
    Return a (N_GRID, N_GRID) float array of log1p-normalised hit counts.
    We do NOT use numpy vectorised batches here because the map is sequential
    (each step depends on the previous output), so a plain Python loop is used
    but kept tight.  For 8 M iterations this completes in ~15 s in CPython.

    Why log1p?  Raw counts at high-μ span 4+ decades; log-compression brings
    low-density filaments into a comparable visual range with the dense core.
    """
    dx = (X_MAX - X_MIN) / (N_GRID - 1)
    dy = (Y_MAX - Y_MIN) / (N_GRID - 1)
    grid = np.zeros((N_GRID, N_GRID), dtype=np.float64)

    x, y = 0.1, 0.1  # arbitrary interior start
    for _ in range(BURN_IN):
        tau = 0.4 - 6.0 / (1.0 + x * x + y * y)
        c, s = math.cos(tau), math.sin(tau)
        x, y = 1.0 + mu * (x * c - y * s), mu * (x * s + y * c)

    for _ in range(N_ITER):
        tau = 0.4 - 6.0 / (1.0 + x * x + y * y)
        c, s = math.cos(tau), math.sin(tau)
        x, y = 1.0 + mu * (x * c - y * s), mu * (x * s + y * c)

        if x * x + y * y > ESCAPE_SQ:
            x, y = 0.1, 0.1  # reset after stray iterate
            continue

        xi = int((x - X_MIN) / dx + 0.5)
        yi = int((y - Y_MIN) / dy + 0.5)
        if 0 <= xi < N_GRID and 0 <= yi < N_GRID:
            grid[yi, xi] += 1.0

    log_grid = np.log1p(grid)
    mx = log_grid.max()
    if mx > 0:
        log_grid /= mx
    return log_grid


# ── Mesh builder ─────────────────────────────────────────────────────────────
def build_floor_mesh(density: np.ndarray) -> tuple:
    """
    Build a (N_GRID × N_GRID) height-field mesh.
    Returns (vertices, faces) in lists suitable for bm.verts.new / bm.faces.new.

    World XY is centred at origin, scaled to ±MESH_SCALE.
    Z = density[row, col] * HEIGHT_SCALE.
    """
    step = 2.0 * MESH_SCALE / (N_GRID - 1)
    verts = []
    for i in range(N_GRID):
        wy = -MESH_SCALE + i * step
        for j in range(N_GRID):
            wx = -MESH_SCALE + j * step
            wz = float(density[i, j]) * HEIGHT_SCALE
            verts.append((wx, wy, wz))

    faces = []
    for i in range(N_GRID - 1):
        for j in range(N_GRID - 1):
            a = i * N_GRID + j
            b = a + 1
            c = a + N_GRID + 1
            d = a + N_GRID
            faces.append((a, b, c, d))

    return verts, faces


def density_to_rgba(density: np.ndarray) -> np.ndarray:
    """Per-vertex RGBA: linear interpolation COBALT→AMBER by density value."""
    flat = density.ravel()                       # row-major → matches vert order
    t    = flat[:, None]                         # (N_GRID², 1)
    rgba = (1.0 - t) * COBALT + t * AMBER       # (N_GRID², 4)
    return rgba.astype(np.float32)


# ── Scene build ───────────────────────────────────────────────────────────────
def clean_scene() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(OBJ_NAME):
            bpy.data.meshes.remove(me)


def build_object(density: np.ndarray, name: str) -> tuple:
    """Create and return (object, mesh) from density array."""
    verts, faces = build_floor_mesh(density)
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        bm.faces.new([bm_verts[i] for i in f])
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob, me


def write_colours(me, rgba: np.ndarray) -> None:
    """Write FLOAT_COLOR attribute to mesh (Blender 5.1 attribute API)."""
    n = len(me.vertices)
    attr = me.attributes.get(ATTR_NAME)
    if attr:
        me.attributes.remove(attr)
    attr = me.attributes.new(name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", rgba.ravel())


def add_material(ob) -> None:
    """Attribute-driven emission shader: Ikeda_Density → base colour + glow."""
    mat = bpy.data.materials.get(MAT_NAME)
    if mat:
        bpy.data.materials.remove(mat)
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    add  = tree.nodes.new("ShaderNodeAddShader")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    emit = tree.nodes.new("ShaderNodeEmission")
    attr = tree.nodes.new("ShaderNodeAttribute")

    attr.attribute_name = ATTR_NAME
    bsdf.inputs["Metallic"].default_value    = 0.45
    bsdf.inputs["Roughness"].default_value   = 0.25
    emit.inputs["Strength"].default_value    = 1.6

    tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    tree.links.new(attr.outputs["Color"], emit.inputs["Color"])
    tree.links.new(bsdf.outputs["BSDF"],   add.inputs[0])
    tree.links.new(emit.outputs["Emission"], add.inputs[1])
    tree.links.new(add.outputs["Shader"],  out.inputs["Surface"])

    ob.data.materials.append(mat)


# ── Shape-key helper ──────────────────────────────────────────────────────────
def apply_shape_key(ob, density: np.ndarray, sk_name: str) -> None:
    """
    Add a shape key that modifies only the Z coordinate (density height).
    All four variants share the same XY layout, so only z differs.
    """
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    coords = np.array([v.co.copy() for v in ob.data.vertices])
    flat   = density.ravel()
    coords[:, 2] = flat * HEIGHT_SCALE   # update Z column
    sk.data.foreach_set("co", coords.ravel())


# ── Holoflow metadata ─────────────────────────────────────────────────────────
def tag_holoflow(ob) -> None:
    ob["holoflow:facet"]   = False
    ob["holoflow:category"] = "stage-floor"
    ob["holoflow:slug"]    = OBJ_NAME


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    clean_scene()

    # Basis density (MU_BASIS = 0.90) — the canonical chaotic attractor
    d_basis = ikeda_density(MU_BASIS)
    ob, me  = build_object(d_basis, OBJ_NAME)

    # Basis shape key (required by Blender for morph targets to work at export)
    ob.shape_key_add(name="Basis", from_mix=False)

    # Shape key: μ=0.95 — denser flame, finer Cantor-set filaments
    d_high = ikeda_density(MU_HIGH)
    apply_shape_key(ob, d_high, "SK_MuHigh")

    # Shape key: μ=0.85 — intermediate — fewer scrolling filaments
    d_mid = ikeda_density(MU_MID)
    apply_shape_key(ob, d_mid, "SK_MuMid")

    # Shape key: μ=0.70 — period-4 orbit; near-ordered sparse peaks
    d_low = ikeda_density(MU_LOW)
    apply_shape_key(ob, d_low, "SK_MuLow")

    # Vertex colours on the basis geometry
    rgba = density_to_rgba(d_basis)
    write_colours(me, rgba)

    add_material(ob)
    tag_holoflow(ob)

    # +Y-up re-orientation for WebXR export (studio convention)
    import mathutils
    rot = mathutils.Matrix.Rotation(math.pi / 2, 4, "X")
    ob.data.transform(rot)
    ob.data.update()

    print(f"[Ikeda] Built {OBJ_NAME}: {len(me.vertices)} verts, {len(me.polygons)} quads")
    print(f"[Ikeda] Shape keys: {[sk.name for sk in ob.data.shape_keys.key_blocks]}")


main()
