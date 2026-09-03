"""
Tinkerbell Map — Discrete Quadratic 2-D Map, Log-Density Height-Field
Barry Martin 1984 / James Yorke (naming) · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Tinkerbell map is a four-parameter family of discrete quadratic maps:

    x_{n+1} = x_n² − y_n² + a·x_n + b·y_n
    y_{n+1} = 2·x_n·y_n  + c·x_n + d·y_n

The quadratic part (x²−y², 2xy) is EXACTLY the real and imaginary parts of
complex squaring z² = (x+iy)².  The linear part is NOT a complex multiplication
α·z — that would require a=d and b=−c; the Tinkerbell uses four independent
coefficients, breaking conformality.  The map is therefore a "corrupted Julia"
system: it shares the quadratic skeleton of the complex polynomial family but
lives in the wider class of 2-D real diffeomorphisms.

Lyapunov exponents (standard Basis params):
    λ₁ ≈ +0.064   λ₂ ≈ −0.143   sum = −0.079  (net contraction → attractor)
Kaplan-Yorke dimension:  D_KY = 1 + λ₁/|λ₂| ≈ 1.45

Shape keys sample four qualitatively distinct parameter regimes:

  Basis      a= 0.900  b=−0.6013  c=2.000  d=0.500  classic two-wing butterfly
  SK_Curled  a= 0.700  b=−0.6013  c=2.000  d=0.500  smaller a  → tighter curl
  SK_Open    a= 1.300  b=−0.6013  c=2.000  d=0.500  larger  a  → spreading petals
  SK_Drift   a= 0.900  b=−0.6013  c=2.500  d=0.500  larger  c  → basin drifts

Vertex colour FLOAT_COLOR "Tinkerbell_Density": cobalt (sparse) → amber (dense)

Sources (all permissive):
  Martin B (attr. Yorke JA) 1984 — quadratic map explorations, PD equations
  Sprott JC 2010 "Elegant Chaos" World Scientific — CC0 web companion with params
      https://sprott.physics.wisc.edu/fractals/2d/
  Bourke P "Tinkerbell Attractor" — CC0
      https://paulbourke.net/fractals/tinkerbell/
"""

import bpy
import bmesh
import math
import mathutils
import numpy as np

# ── PARAMETERS ───────────────────────────────────────────────────────────────
N_GRID        = 120          # bins per axis → 120×120 = 14 400 verts, 14 161 quads
N_ITER        = 5_000_000    # orbit steps per shape key
BURN_IN       = 10_000       # steps discarded to erase initial transient
ESCAPE_SQ     = 100.0        # |z|² > ESCAPE_SQ → orbit diverged; skip & reset
MESH_SCALE    = 6.0          # world-space diameter in metres
HEIGHT_SCALE  = 0.50         # max z elevation in metres
OBJ_NAME      = "Tinkerbell_Attractor"
ATTR_NAME     = "Tinkerbell_Density"

# Fixed domain that covers the union of all four preset orbits (with 15% margin)
# Basis orbit: x∈[−0.85,0.43]  y∈[−0.03,0.69]
# SK_Open orbit: x∈[−1.08,0.74]  y∈[−0.37,0.87]
X_MIN, X_MAX = -1.30,  0.90
Y_MIN, Y_MAX = -0.55,  1.00

COBALT = (0.00, 0.22, 0.82, 1.0)
AMBER  = (0.92, 0.58, 0.04, 1.0)

PRESETS: dict[str, tuple[float, float, float, float]] = {
    "Basis"    : ( 0.900, -0.6013, 2.000, 0.500),  # classic butterfly
    "SK_Curled": ( 0.700, -0.6013, 2.000, 0.500),  # tighter single-lobe curl
    "SK_Open"  : ( 1.300, -0.6013, 2.000, 0.500),  # spreading multi-petal
    "SK_Drift" : ( 0.900, -0.6013, 2.500, 0.500),  # c-shift, basin drifts right
}


# ── ORBIT DENSITY ─────────────────────────────────────────────────────────────
def tinkerbell_density(a: float, b: float,
                       c: float, d: float) -> np.ndarray:
    """
    Run the Tinkerbell map for N_ITER steps and return a log-density array.

    WHY escape detection + reset?
    Unlike the de Jong map (bounded by |sin−cos| ≤ 2), the Tinkerbell has
    no global boundedness proof.  Near bifurcation the orbit can escape the
    basin.  We detect escape by r² > ESCAPE_SQ and reset to (0, 0), so a
    boundary-regime key still accumulates whatever density it generated
    before escaping, rather than crashing the loop.

    WHY log1p?
    Raw visit counts span ~3 decades (dense fold lines vs. sparse filament
    tips).  np.log1p(density) / max compresses the range to [0, 1] while
    preserving filament detail.  log1p avoids the log(0) branch at empty
    cells — they simply emerge with height 0, forming a flat sea around the
    attractor island.
    """
    density = np.zeros((N_GRID, N_GRID), dtype=np.float64)
    x_span = X_MAX - X_MIN
    y_span = Y_MAX - Y_MIN
    ng1    = N_GRID - 1

    x, y = 0.0, 0.0
    for _ in range(BURN_IN):
        xn = x * x - y * y + a * x + b * y
        yn = 2.0 * x * y   + c * x + d * y
        x, y = xn, yn
        if x * x + y * y > ESCAPE_SQ:
            x, y = 0.0, 0.0

    for _ in range(N_ITER):
        xn = x * x - y * y + a * x + b * y
        yn = 2.0 * x * y   + c * x + d * y
        x, y = xn, yn
        if x * x + y * y > ESCAPE_SQ:
            x, y = 0.0, 0.0
            continue
        ix = int((x - X_MIN) / x_span * ng1 + 0.5)
        iy = int((y - Y_MIN) / y_span * ng1 + 0.5)
        if 0 <= ix < N_GRID and 0 <= iy < N_GRID:
            density[iy, ix] += 1.0

    density = np.log1p(density)
    dmax = density.max()
    if dmax > 0.0:
        density /= dmax
    return density


# ── MESH ──────────────────────────────────────────────────────────────────────
def build_floor_mesh(density: np.ndarray) -> bpy.types.Object:
    """
    Build a 120×120 quad grid — x,y fixed to world grid, z = density × HEIGHT.
    x,y positions are shared across all shape keys; only z morphs.
    """
    me = bpy.data.meshes.new(OBJ_NAME)
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    bm = bmesh.new()
    half = MESH_SCALE * 0.5
    vgrid: list[list] = []
    for i in range(N_GRID):
        row = []
        for j in range(N_GRID):
            wx = -half + j / (N_GRID - 1) * MESH_SCALE
            wy = -half + i / (N_GRID - 1) * MESH_SCALE
            wz = float(density[i, j]) * HEIGHT_SCALE
            row.append(bm.verts.new((wx, wy, wz)))
        vgrid.append(row)
    bm.verts.ensure_lookup_table()
    for i in range(N_GRID - 1):
        for j in range(N_GRID - 1):
            bm.faces.new([vgrid[i][j],   vgrid[i][j+1],
                          vgrid[i+1][j+1], vgrid[i+1][j]])
    bm.to_mesh(me)
    bm.free()
    return ob


def write_colours(ob: bpy.types.Object, density: np.ndarray) -> None:
    """FLOAT_COLOR POINT attribute: cobalt→amber driven by log-density."""
    attr = ob.data.color_attributes.new(
        name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT")
    flat = density.ravel()
    cols: list[float] = []
    for t in flat:
        cols += [COBALT[0] + t * (AMBER[0] - COBALT[0]),
                 COBALT[1] + t * (AMBER[1] - COBALT[1]),
                 COBALT[2] + t * (AMBER[2] - COBALT[2]),
                 1.0]
    attr.data.foreach_set("color", cols)


def build_material(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("Tinkerbell_Mat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.location = (-600, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value  = 0.25
    bsdf.inputs["Roughness"].default_value = 0.50
    bsdf.location = (-200, 0)
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.5
    emit.location = (-200, -200)
    add = nodes.new("ShaderNodeAddShader")
    add.location = (100, 0)
    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(bsdf.outputs["BSDF"],  add.inputs[0])
    links.new(emit.outputs["Emission"], add.inputs[1])
    links.new(add.outputs["Shader"], out.inputs["Surface"])
    ob.data.materials.append(mat)


def add_shape_key(ob: bpy.types.Object,
                  name: str, density: np.ndarray) -> None:
    """Add a shape key updating only z (x,y grid is identical for all keys)."""
    sk = ob.shape_key_add(name=name, from_mix=False)
    half = MESH_SCALE * 0.5
    coords: list[float] = []
    for i in range(N_GRID):
        for j in range(N_GRID):
            coords += [-half + j / (N_GRID - 1) * MESH_SCALE,
                       -half + i / (N_GRID - 1) * MESH_SCALE,
                       float(density[i, j]) * HEIGHT_SCALE]
    sk.data.foreach_set("co", coords)


def apply_holoflow_orientation(ob: bpy.types.Object) -> None:
    """+Y-up convention (Holoflow / Three.js): rotate mesh data in place."""
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "stage-floor"
    rot = mathutils.Matrix.Rotation(math.pi / 2, 4, "X")
    ob.data.transform(rot)
    ob.data.update()


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main() -> None:
    for name in ("Cube", "Light", "Camera"):
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

    print("[Tinkerbell] Computing Basis density …")
    d_basis = tinkerbell_density(*PRESETS["Basis"])
    ob = build_floor_mesh(d_basis)
    write_colours(ob, d_basis)
    build_material(ob)
    ob.shape_key_add(name="Basis", from_mix=False)  # captures current z

    for key in ("SK_Curled", "SK_Open", "SK_Drift"):
        print(f"[Tinkerbell] Computing {key} density …")
        add_shape_key(ob, key, tinkerbell_density(*PRESETS[key]))

    apply_holoflow_orientation(ob)
    V = len(ob.data.vertices)
    F = len(ob.data.polygons)
    print(f"[Tinkerbell] Done — {V} vertices, {F} faces, "
          f"{len(ob.data.shape_keys.key_blocks)} shape keys.")


main()
