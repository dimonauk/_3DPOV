"""
Lozi Map (1978) — Piecewise-Linear Strange Attractor, Log-Density Height-Field
René Lozi 1978 / Misiurewicz proof 1980 · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Lozi map is the piecewise-linear analogue of the Hénon map:

    x_{n+1} = 1 − a|x_n| + y_n
    y_{n+1} = b · x_n

Replace Hénon's smooth x² fold with the V-shaped |x| tent fold; the qualitative
topology is identical but the analysis becomes tractable.  Misiurewicz (1980)
proved rigorously that the Lozi attractor is a genuine strange attractor — the
first such proof for a 2-D invertible map.  Benedicks and Carleson would not
give the analogous Hénon proof until 1991.

WHY |x| instead of x²?
The Jacobian of the Lozi map is piecewise-constant:
    x > 0:  J = [[-a, 1], [b, 0]]   det = −b
    x < 0:  J = [[+a, 1], [b, 0]]   det = −b
|det J| = b everywhere.  Constant dissipation makes orbit-density estimates
tractable via explicit hyperbolicity bounds on the unstable manifold — exactly
what Misiurewicz exploited.

Fixed points (a=1.7, b=0.5):
    P+ (x>0):  x* =  1/(1+a−b) ≈ +0.4545   y* = b·x* ≈ +0.2273
    P− (x<0):  x* =  1/(1−a−b) ≈ −0.8333   y* = b·x* ≈ −0.4167

Eigenvalues at P+ (J = [[-a,1],[b,0]], char. poly. λ²+aλ−b = 0):
    λ₊ = (−a + √(a²+4b))/2 ≈ +0.256   λ₋ = −1.956   (saddle)

Eigenvalues at P− (J = [[+a,1],[b,0]], char. poly. λ²−aλ−b = 0):
    λ₊ = ( a + √(a²+4b))/2 ≈ +1.956   λ₋ = −0.256   (saddle)

Lyapunov exponents (Basis params):
    λ₁ ≈ +0.470   λ₂ ≈ −1.163
    Sum = −0.693 = log(b) = log(0.5)   ✓ Liouville
Kaplan-Yorke dimension:  D_KY = 1 + λ₁/|λ₂| = 1 + 0.470/1.163 ≈ 1.404

Shape keys sample four (a, b) regimes:

  Basis     a=1.7  b=0.5   canonical Lozi, Misiurewicz-proven strange attractor
  SK_LowA   a=1.4  b=0.5   broader attractor, more open wing geometry
  SK_HighA  a=2.0  b=0.5   compressed/tighter geometry, steeper ridges
  SK_LowB   a=1.7  b=0.3   stronger dissipation → thinner fractal with sharper creases

Vertex colour FLOAT_COLOR "Lozi_Density": cobalt (sparse filaments) → amber (dense ridges)

Sources (all permissive):
  Lozi R (1978) "Un attracteur étrange du type attracteur de Hénon"
      J. Physique Colloque C5, Suppl. 8, 39, C5-9.  Equations PD (mathematical).
  Misiurewicz M (1980) "Strange attractors for the Lozi mappings"
      Ann. NY Acad. Sci. 357, 348-358.  Proof PD (mathematical).
  Sprott JC (2010) "Elegant Chaos" World Scientific — CC0 web companion
      https://sprott.physics.wisc.edu/fractals/2d/
  Bourke P "Lozi Attractor" — CC0 reference
      https://paulbourke.net/fractals/lozi/
"""

import bpy
import bmesh
import math
import numpy as np

# ── PARAMETERS ───────────────────────────────────────────────────────────────
N_GRID       = 120           # bins per axis → 120×120 = 14 400 verts, 14 161 quads
N_ITER       = 5_000_000     # orbit steps per shape key
BURN_IN      = 10_000        # discard initial transient
MESH_SCALE   = 6.0           # world-space diameter in metres
HEIGHT_SCALE = 0.50          # max z elevation in metres
OBJ_NAME     = "Lozi_Attractor"
ATTR_NAME    = "Lozi_Density"

# Domain covering the union of all four preset orbits with 15 % margin
X_MIN, X_MAX = -1.40,  1.20
Y_MIN, Y_MAX = -0.85,  0.80

COBALT = (0.00, 0.22, 0.82, 1.0)
AMBER  = (0.92, 0.58, 0.04, 1.0)

# (a, b) presets; see header for analysis
PRESETS: dict[str, tuple[float, float]] = {
    "Basis"   : (1.7, 0.5),   # canonical Misiurewicz proof parameters
    "SK_LowA" : (1.4, 0.5),   # lower a → broader wing, less folding per step
    "SK_HighA": (2.0, 0.5),   # higher a → tighter, more compressed geometry
    "SK_LowB" : (1.7, 0.3),   # lower b → stronger dissipation, sharper ridges
}


# ── ORBIT DENSITY ─────────────────────────────────────────────────────────────
def lozi_density(a: float, b: float) -> np.ndarray:
    """
    Run the Lozi map for N_ITER steps, bin visits into an N_GRID×N_GRID array,
    and return a log1p-normalised density field.

    WHY not escape detection?
    The Lozi attractor is bounded for the parameter ranges used here.
    Misiurewicz (1980) gives explicit bounding boxes; the orbit never escapes
    to infinity for a in [1.4, 2.0], b in [0.3, 0.5].  No reset logic needed.
    """
    x_bins = np.linspace(X_MIN, X_MAX, N_GRID + 1)
    y_bins = np.linspace(Y_MIN, Y_MAX, N_GRID + 1)

    # Accumulate in chunks for memory efficiency
    counts = np.zeros((N_GRID, N_GRID), dtype=np.int64)

    CHUNK = 250_000
    x, y = 0.1, 0.1   # arbitrary interior starting point

    # Burn-in: advance past transient
    for _ in range(BURN_IN):
        x, y = 1.0 - a * abs(x) + y, b * x

    steps_left = N_ITER
    chunk_x = np.empty(CHUNK)
    chunk_y = np.empty(CHUNK)

    while steps_left > 0:
        n = min(CHUNK, steps_left)
        for k in range(n):
            x, y = 1.0 - a * abs(x) + y, b * x
            chunk_x[k] = x
            chunk_y[k] = y

        # Vectorised binning — fast even in Python loop outer
        ix = np.searchsorted(x_bins, chunk_x[:n], side="right") - 1
        iy = np.searchsorted(y_bins, chunk_y[:n], side="right") - 1

        valid = (ix >= 0) & (ix < N_GRID) & (iy >= 0) & (iy < N_GRID)
        np.add.at(counts, (ix[valid], iy[valid]), 1)
        steps_left -= n

    # log1p maps wide dynamic range to perceptually uniform colour gradient
    density = np.log1p(counts.astype(np.float64))
    mx = density.max()
    if mx > 0:
        density /= mx
    return density


# ── COLOUR LERP ──────────────────────────────────────────────────────────────
def lerp_colour(t: float) -> tuple[float, float, float, float]:
    """
    WHY lerp in linear space?
    FLOAT_COLOR attributes in Blender 5.1 are stored in linear light;
    interpolating in linear space and letting Blender's colour-management
    handle display is more accurate than lerping sRGB values.
    """
    return tuple(COBALT[i] + t * (AMBER[i] - COBALT[i]) for i in range(4))


# ── MESH BUILDER ─────────────────────────────────────────────────────────────
def build_height_field(name: str, density: np.ndarray) -> bpy.types.Object:
    """
    Create the base 120×120 quad grid from scratch (no subdiv operator).
    Vertices are laid out in row-major order: vert[i*cols + j].
    WHY direct bmesh.from_pydata-equivalent?  Operators require an active
    context; bpy.data API is context-free and safe in headless/script mode.
    """
    rows = cols = N_GRID + 1   # 121 × 121 = 14 641 verts for 120×120 quads
    # We only emit 120×120 = 14 400 interior quad verts (drop the +1 boundary row/col):
    # Actually we need (N_GRID+1)^2 verts.  Vertex (i,j) maps to grid bin (i,j)
    # for i in [0,N_GRID], j in [0,N_GRID].  Height from density[i,j] via bilinear.

    # Vertex positions
    xs = np.linspace(-MESH_SCALE / 2, MESH_SCALE / 2, cols)
    ys = np.linspace(-MESH_SCALE / 2, MESH_SCALE / 2, rows)

    # Pad density by one row/col so every vertex has a bin reference
    # (the rightmost vertex column reuses the last bin)
    d_pad = np.pad(density, ((0, 1), (0, 1)), mode="edge")

    verts = []
    for i in range(rows):
        for j in range(cols):
            z = float(d_pad[i, j]) * HEIGHT_SCALE
            verts.append((xs[j], ys[i], z))

    faces = []
    for i in range(N_GRID):
        for j in range(N_GRID):
            v0 = i * cols + j
            v1 = v0 + 1
            v2 = v0 + cols + 1
            v3 = v0 + cols
            faces.append((v0, v1, v2, v3))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def add_vertex_colours(obj: bpy.types.Object, density: np.ndarray,
                       attr_name: str) -> None:
    """
    Write FLOAT_COLOR attribute on POINT domain.
    FLOAT_COLOR vs BYTE_COLOR: FLOAT_COLOR preserves the full HDR range
    needed for EXR bakes and colour-correct WebXR export via the
    holoflow_webxr_exporter.  BYTE_COLOR would quantise the gradient.
    """
    mesh = obj.data
    attr = mesh.color_attributes.new(
        name=attr_name,
        type="FLOAT_COLOR",
        domain="POINT",
    )

    rows = cols = N_GRID + 1
    d_pad = np.pad(density, ((0, 1), (0, 1)), mode="edge")

    flat = []
    for i in range(rows):
        for j in range(cols):
            t = float(d_pad[i, j])
            flat.extend(lerp_colour(t))

    # Blender's foreach_set expects a flat sequence of RGBA floats
    attr.data.foreach_set("color", flat)


def add_shape_key(obj: bpy.types.Object, key_name: str,
                  density: np.ndarray) -> None:
    """
    Add a shape key by writing its vertex positions directly.
    WHY not bpy.ops.object.shape_key_add?  That operator requires an active
    object in the scene context and is brittle in headless scripting.
    The data API (obj.data.shape_keys) is always available.
    """
    sk_block = obj.shape_key_add(name=key_name, from_mix=False)

    rows = cols = N_GRID + 1
    d_pad = np.pad(density, ((0, 1), (0, 1)), mode="edge")
    xs = np.linspace(-MESH_SCALE / 2, MESH_SCALE / 2, cols)
    ys = np.linspace(-MESH_SCALE / 2, MESH_SCALE / 2, rows)

    positions = []
    for i in range(rows):
        for j in range(cols):
            z = float(d_pad[i, j]) * HEIGHT_SCALE
            positions.append((xs[j], ys[i], z))

    sk_block.data.foreach_set(
        "co", [c for p in positions for c in p]
    )


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main() -> None:
    # Clear existing Lozi objects to allow re-running
    for obj in list(bpy.data.objects):
        if obj.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(obj, do_unlink=True)

    print("[Lozi] Computing Basis density …")
    basis_density = lozi_density(*PRESETS["Basis"])

    obj = build_height_field(OBJ_NAME, basis_density)
    add_vertex_colours(obj, basis_density, ATTR_NAME)

    # Basis shape key (mandatory first key for the shape key block)
    obj.shape_key_add(name="Basis", from_mix=False)

    # Remaining shape keys
    for key_name, params in list(PRESETS.items())[1:]:
        print(f"[Lozi] Computing {key_name} density …")
        d = lozi_density(*params)
        add_shape_key(obj, key_name, d)

    # Smooth shading — important for the height-field gradient read
    for poly in obj.data.polygons:
        poly.use_smooth = True

    # Position flat on the scene floor (z=0 at grid minimum)
    obj.location = (0.0, 0.0, 0.0)

    print(f"[Lozi] Done — '{OBJ_NAME}' with {len(obj.data.vertices)} vertices.")
    print(f"         Shape keys: {[sk.name for sk in obj.data.shape_keys.key_blocks]}")


main()
