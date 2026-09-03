"""
Burning Ship Fractal — Michelitsch & Rössler (1992) Absolute-Value Escape-Time
Blender 5.1  |  bpy direct-data API  |  numpy  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Burning Ship fractal modifies the Mandelbrot iteration with an absolute-
value fold applied before each squaring:

    z₀ = 0
    z_{n+1} = (|Re(z_n)| + i·|Im(z_n)|)² + c

The absolute values force the trajectory into the first quadrant of ℂ prior
to each squaring, introducing a non-analytic fold that breaks the rotational
symmetry present in the Mandelbrot set.  The result is a figure resembling a
burning ship when drawn with Im(c) increasing downward (the standard fractal
orientation flips the y-axis to bring the "mast" to the top).

WHY this differs from the Mandelbrot set:
  – z → z² is an analytic map; the composition c → |Re(z)| + i|Im(z)| is not.
  – Trajectories cannot escape to negative-real infinity; the fold redirects
    them back toward the origin before squaring, producing denser "rigging"
    structures along the real axis.
  – The main body (the "hull") sits near c ≈ (−1.75, −0.03).
  – The boundary is connected (proven) but possibly not locally connected
    (open question as of 2025).

Smooth iteration count (fractional escape time):
    n_smooth = n − log₂(log₂|z|)  at the step where |z| > BAIL

This removes the discrete "banding" artifact by interpolating within an escape
level using the magnitude of the escaping iterate.  Result is mapped through a
Bernstein-polynomial colour ramp (cobalt → sky-blue → amber) written as a
FLOAT_COLOR vertex attribute.

Shape keys
──────────
  Basis   : full view  Re ∈ [−2.5, 1.0]  Im ∈ [−2.0, 0.5]  MAX_ITER=256
  SK_Ship : hull zoom  Re ∈ [−1.90, −1.60]  Im ∈ [−0.10, 0.05]  MI=512
  SK_Mast : mast detail  Re ∈ [−1.775, −1.740]  Im ∈ [−0.040, −0.010]  MI=768
  SK_Julia: Julia variant  c=(−1.755,−0.028)  z₀ ∈ [−1.8,1.8]×[−1.8,1.8]  MI=512

Sources:
  Michelitsch M & Rössler O (1992) "The 'burning ship' and its quasi-Julia sets."
    Comput & Graphics 16(4):435–438.  DOI 10.1016/0097-8493(92)90007-3.
    Mathematical content (equations, algorithm): public domain.
  Mandelbrot B (1982) "The Fractal Geometry of Nature."  W.H. Freeman.
    Context for escape-time fractals and smooth colouring theory: PD equations.
"""

import bpy
import bmesh
import numpy as np

# ── PARAMETERS ────────────────────────────────────────────────────────────
NX        = 120          # horizontal grid points
NY        = 120          # vertical grid points  → 14 400 vertices, 14 161 quads
CELL_SIZE = 0.07         # metres per cell at default extent
HEIGHT_SCL = 0.55        # z-scale: max height in metres
BAIL_SQ   = 4.0          # escape radius² — use exactly 4 for smooth iteration
OBJ_NAME  = "BurningShip"
ATTR_NAME = "BS_Escape"  # FLOAT_COLOR vertex attribute

# ── REGION DEFINITIONS ─────────────────────────────────────────────────────
# Each entry: (re_min, re_max, im_min, im_max, max_iter)
# im-axis is flipped (im_min drawn at top) to place the "mast" upright.
REGIONS = {
    "Basis":   (-2.5,  1.0, -2.0,  0.5, 256),
    "SK_Ship": (-1.90, -1.60, -0.10,  0.05, 512),
    "SK_Mast": (-1.775, -1.740, -0.040, -0.010, 768),
    "SK_Julia": (-1.8, 1.8, -1.8, 1.8, 512),
}
JULIA_C = complex(-1.755, -0.028)   # parameter for SK_Julia

# ── COLOUR MAP ──────────────────────────────────────────────────────────────
# Smooth iteration count ∈ [0, 1] → RGBA via Bernstein cubic polynomial.
# t=0 (inside / max-iter) → deep cobalt; t=1 (fast escape) → warm amber.
def smooth_to_rgba(t: np.ndarray) -> np.ndarray:
    """
    Bernstein cubic colour ramp.
    t is normalised smooth escape in [0, 1].
    Uses the cobalt–amber studio palette.
    """
    t  = np.clip(t, 0.0, 1.0)
    t2 = t  * t
    t3 = t2 * t
    s  = 1.0 - t
    s2 = s  * s
    s3 = s2 * s
    # Control points: cobalt (0) → sky-blue (1/3) → warm-amber (2/3) → amber (1)
    p0 = np.array([0.00, 0.38, 0.74, 1.0])  # cobalt
    p1 = np.array([0.25, 0.62, 0.85, 1.0])  # sky-blue
    p2 = np.array([0.85, 0.55, 0.10, 1.0])  # warm-amber
    p3 = np.array([1.00, 0.70, 0.00, 1.0])  # amber
    rgba = (s3[:, None]*p0 + 3*s2[:, None]*t[:, None]*p1
            + 3*s[:, None]*t2[:, None]*p2 + t3[:, None]*p3)
    return rgba.astype(np.float32)


def compute_burning_ship(nx: int, ny: int, region: tuple) -> np.ndarray:
    """
    Vectorised escape-time computation for the Burning Ship fractal.

    Returns smooth_n ∈ [0, 1] for each of the nx*ny grid points.
    Inside points → 0.0.

    WHY vectorised over complex-plane rows?
    numpy broadcasts elementwise arithmetic over full 2D grids efficiently.
    We track 'alive' (not-yet-escaped) cells and only update those each iter,
    avoiding redundant arithmetic on already-escaped points.
    """
    re_min, re_max, im_min, im_max, max_iter = region

    # Build coordinate grids.  im-axis flipped: row 0 = im_max (ship top).
    re = np.linspace(re_min, re_max, nx, dtype=np.float64)
    im = np.linspace(im_max, im_min, ny, dtype=np.float64)   # flipped
    CR, CI = np.meshgrid(re, im)          # shape (ny, nx)
    CR = CR.ravel(); CI = CI.ravel()      # flat (ny*nx,)

    ZR = np.zeros_like(CR)
    ZI = np.zeros_like(CI)
    n_smooth = np.zeros(len(CR), dtype=np.float64)
    alive    = np.ones(len(CR),  dtype=bool)
    n_iter   = np.zeros(len(CR), dtype=np.int32)

    for i in range(max_iter):
        # Burning Ship iteration: z → (|Re(z)| + i|Im(z)|)² + c
        # Expand the square of a complex number (a + ib)²:
        #   Re = a² − b²,   Im = 2ab
        # where a = |ZR|, b = |ZI|
        aR = np.abs(ZR[alive])
        aI = np.abs(ZI[alive])
        new_ZR = aR*aR - aI*aI + CR[alive]
        new_ZI = 2.0*aR*aI    + CI[alive]
        ZR[alive] = new_ZR
        ZI[alive] = new_ZI

        mag2 = ZR[alive]**2 + ZI[alive]**2
        escaped = mag2 > BAIL_SQ

        # Smooth iteration: n_smooth = n − log₂(log₂|z|)
        # Requires |z| > bail (= 2.0) so log is well-defined.
        idx = np.where(alive)[0][escaped]
        log_log_z = np.log2(np.log2(np.sqrt(mag2[escaped])))
        n_smooth[idx] = (i + 1) - log_log_z
        n_iter[idx]   = i + 1
        alive[idx]    = False
        if not alive.any():
            break

    # Normalise to [0, 1]; inside points remain 0.0
    outside = n_iter > 0
    if outside.any():
        n_smooth[outside] = np.clip(n_smooth[outside] / max_iter, 0.0, 1.0)

    return n_smooth.reshape(ny, nx)


def compute_julia(nx: int, ny: int, region: tuple, c: complex) -> np.ndarray:
    """
    Julia variant of the Burning Ship: same absolute-value iteration but with
    fixed parameter c and variable starting point z₀ = grid position.

    J_c is the set of z₀ for which the orbit under z → (|Re|+i|Im|)²+c
    remains bounded.  The boundary structure inherits the "burning" texture
    of the Burning Ship fractal itself.
    """
    re_min, re_max, im_min, im_max, max_iter = region

    re = np.linspace(re_min, re_max, nx, dtype=np.float64)
    im = np.linspace(im_max, im_min, ny, dtype=np.float64)
    ZR, ZI = np.meshgrid(re, im)
    ZR = ZR.ravel(); ZI = ZI.ravel()
    CR = np.full_like(ZR, c.real)
    CI = np.full_like(ZI, c.imag)

    n_smooth = np.zeros(len(ZR), dtype=np.float64)
    alive    = np.ones(len(ZR), dtype=bool)
    n_iter   = np.zeros(len(ZR), dtype=np.int32)

    for i in range(max_iter):
        aR = np.abs(ZR[alive])
        aI = np.abs(ZI[alive])
        new_ZR = aR*aR - aI*aI + CR[alive]
        new_ZI = 2.0*aR*aI    + CI[alive]
        ZR[alive] = new_ZR
        ZI[alive] = new_ZI
        mag2 = ZR[alive]**2 + ZI[alive]**2
        escaped = mag2 > BAIL_SQ
        idx = np.where(alive)[0][escaped]
        log_log_z = np.log2(np.log2(np.sqrt(mag2[escaped])))
        n_smooth[idx] = (i + 1) - log_log_z
        n_iter[idx]   = i + 1
        alive[idx]    = False
        if not alive.any():
            break

    outside = n_iter > 0
    if outside.any():
        n_smooth[outside] = np.clip(n_smooth[outside] / max_iter, 0.0, 1.0)
    return n_smooth.reshape(ny, nx)


# ── BUILD MESH ──────────────────────────────────────────────────────────────
def build_mesh(escape_grid: np.ndarray, cell_m: float, height_m: float,
               name: str) -> bpy.types.Object:
    """
    Build a stage-floor grid mesh from a 2D escape grid.

    WHY direct data API over bpy.ops?  Operators require a valid UI context
    (VIEW_3D area, active scene).  Direct mesh construction via bpy.data +
    foreach_set works in any execution context, including headless runs via
    `blender --background --python blueprint.py`.

    Vertex layout: row-major, row 0 at y=0, column 0 at x=0.
    """
    ny, nx = escape_grid.shape
    verts  = []
    for row in range(ny):
        for col in range(nx):
            x = col * cell_m
            y = row * cell_m
            z = float(escape_grid[row, col]) * height_m
            verts.append((x, y, z))

    faces = []
    for row in range(ny - 1):
        for col in range(nx - 1):
            i0 = row * nx + col
            i1 = i0 + 1
            i2 = i0 + nx + 1
            i3 = i0 + nx
            faces.append((i0, i1, i2, i3))

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def set_vertex_colours(ob: bpy.types.Object, escape_grid: np.ndarray) -> None:
    """
    Write per-vertex FLOAT_COLOR attribute from smooth escape values.

    FLOAT_COLOR (linear-light float RGBA) is the preferred vertex colour type
    in Blender 5.x.  The 'POINT' domain means one colour per vertex.
    """
    ny, nx = escape_grid.shape
    t_flat = escape_grid.ravel()
    rgba   = smooth_to_rgba(t_flat)       # (n_verts, 4)

    me = ob.data
    if ATTR_NAME in me.attributes:
        me.attributes.remove(me.attributes[ATTR_NAME])
    attr = me.attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    # foreach_set requires a flat sequence of RGBA values
    attr.data.foreach_set("color", rgba.ravel().tolist())


def add_emission_material(ob: bpy.types.Object) -> None:
    """Vertex-colour emission material so colours appear in Eevee/Cycles."""
    mat = bpy.data.materials.new(name=f"{OBJ_NAME}_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type  = 'GEOMETRY'

    links.new(attr.outputs["Color"], emit.inputs["Color"])
    emit.inputs["Strength"].default_value = 1.2
    links.new(emit.outputs["Emission"], out.inputs["Surface"])

    ob.data.materials.append(mat)


def add_shape_key(ob: bpy.types.Object, key_name: str,
                  new_z: np.ndarray) -> None:
    """
    Add a shape key by computing new Z coordinates from a different escape
    grid and writing them via foreach_set on the shape key data block.
    """
    me = ob.data
    # Ensure Basis exists
    if ob.data.shape_keys is None:
        ob.shape_key_add(name="Basis", from_mix=False)

    sk = ob.shape_key_add(name=key_name, from_mix=False)
    ny, nx = new_z.shape
    cell_m = CELL_SIZE
    coords = []
    for row in range(ny):
        for col in range(nx):
            x = col * cell_m
            y = row * cell_m
            z = float(new_z[row, col]) * HEIGHT_SCL
            coords.append((x, y, z))
    flat = [v for xyz in coords for v in xyz]
    sk.data.foreach_set("co", flat)


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main() -> None:
    # Remove stale object
    if OBJ_NAME in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[OBJ_NAME], do_unlink=True)

    print("Computing Basis (full Burning Ship) …")
    basis_grid = compute_burning_ship(NX, NY, REGIONS["Basis"])

    ob = build_mesh(basis_grid, CELL_SIZE, HEIGHT_SCL, OBJ_NAME)
    set_vertex_colours(ob, basis_grid)
    add_emission_material(ob)

    # Basis shape key
    ob.shape_key_add(name="Basis", from_mix=False)

    print("Computing SK_Ship (hull zoom) …")
    ship_grid = compute_burning_ship(NX, NY, REGIONS["SK_Ship"])
    add_shape_key(ob, "SK_Ship", ship_grid)

    print("Computing SK_Mast (mast detail) …")
    mast_grid = compute_burning_ship(NX, NY, REGIONS["SK_Mast"])
    add_shape_key(ob, "SK_Mast", mast_grid)

    print("Computing SK_Julia (Julia variant) …")
    julia_grid = compute_julia(NX, NY, REGIONS["SK_Julia"], JULIA_C)
    add_shape_key(ob, "SK_Julia", julia_grid)

    # Centre the mesh
    ob.location = (-(NX * CELL_SIZE) / 2, -(NY * CELL_SIZE) / 2, 0.0)

    print(f"Done — {OBJ_NAME} created: {NX*NY} verts, {(NX-1)*(NY-1)} faces.")


main()
