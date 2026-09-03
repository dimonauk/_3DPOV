"""
Lozi Map — Piecewise-Linear Strange Attractor, Log-Density Height-Field
René Lozi 1978 / Misiurewicz SRB Measure 1980 · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Lozi map (1978) is the piecewise-linear cousin of the Hénon map:

    x_{n+1} = 1 − a·|x_n| + y_n
    y_{n+1} = b·x_n

Replacing Hénon's smooth quadratic x² with the non-smooth |x| produces two
crucial properties absent from almost every other strange attractor:

  1. CONSTANT JACOBIAN DETERMINANT — det J = −b everywhere (the kink at x=0
     makes J undefined there, but both half-planes each give det J = −b).
     This means every region in phase space shrinks by exactly |b| per step —
     a cleaner dissipation statement than Hénon's identical formula but same
     fact, and far simpler than position-dependent maps like Tinkerbell.

  2. RIGOROUS SRB MEASURE — Misiurewicz (1980) proved existence of a Sinai–
     Ruelle–Bowen invariant measure for the Lozi map at a=1.7, b=0.5.  This is
     the first complete proof of a strange attractor for a non-invertible map
     of the plane, predating any such result for Hénon by ~18 years (Benedicks
     & Carleson 1991 for Hénon).  The piecewise-linear structure replaces
     delicate quadratic estimates with exact cone arguments.

Mathematical details (a=1.7, b=0.5, canonical chaotic regime):
  Jacobian (x≠0):  J = [[-a·sgn(x), 1], [b, 0]]
  det J            = −b = −0.5  (constant; log-contraction = log|b| ≈ −0.693)
  Fixed point P₊:  x* = 1/(1+a−b) ≈ 0.4545,  y* = bx* ≈ 0.2273  (x*>0)
  Fixed point P₋:  x* = 1/(1−a−b) ≈ −0.8333, y* = bx* ≈ −0.4167  (x*<0)
  Lyapunov sum:    λ₁ + λ₂ = log|b| ≈ −0.693  (exact, from constant det J)
  Typical values:  λ₁ ≈ +0.43,  λ₂ ≈ −1.12,  D_KY ≈ 1.38

Shape keys cover four dynamically distinct parameter regimes:

  Basis     a=1.70 b=0.50  canonical Misiurewicz chaos
  SK_LowA   a=1.40 b=0.50  near bifurcation boundary, sparser structure
  SK_HiA    a=2.00 b=0.50  stronger stretching, broader attractor support
  SK_LowB   a=1.70 b=0.30  weaker contraction (|b|<0.5), thinner leaves

Vertex colour FLOAT_COLOR "Lozi_Density": cobalt (sparse) → amber (dense)

Sources (all permissive):
  Lozi R (1978) "Un attracteur étrange(?) du type attracteur de Hénon"
      J. Phys. Colloq. 39:C5-9 — public domain equations
  Misiurewicz M (1980) "Strange attractors for the Lozi mappings"
      Ann. New York Acad. Sci. 357:348-358 — PD; SRB proof for a=1.7 b=0.5
  Sprott JC (2010) "Elegant Chaos" web companion — CC0
      https://sprott.physics.wisc.edu/fractals/2d/
  Bourke P "Lozi Attractor" — CC0
      https://paulbourke.net/fractals/lozi/
"""

import bpy
import bmesh
import math
import mathutils
import numpy as np

# ── PARAMETERS ───────────────────────────────────────────────────────────────
N_GRID        = 120           # bins per axis → 120×120 = 14 400 verts, 14 161 quads
N_ITER        = 5_000_000     # orbit steps per shape key
BURN_IN       = 10_000        # steps to discard (erase initial transient)
MESH_SCALE    = 6.0           # world-space diameter in metres
HEIGHT_SCALE  = 0.50          # max z elevation in metres
OBJ_NAME      = "Lozi_Attractor"
ATTR_NAME     = "Lozi_Density"

# Domain covers all four presets with 15 % margin each side
X_MIN, X_MAX = -2.0,  1.4
Y_MIN, Y_MAX = -1.1,  0.75

COBALT = (0.00, 0.22, 0.82, 1.0)
AMBER  = (0.92, 0.58, 0.04, 1.0)

PRESETS: dict[str, tuple[float, float]] = {
    "Basis"   : (1.70, 0.50),   # Misiurewicz canonical chaotic attractor
    "SK_LowA" : (1.40, 0.50),   # near bifurcation onset
    "SK_HiA"  : (2.00, 0.50),   # stronger stretching, wider attractor
    "SK_LowB" : (1.70, 0.30),   # weaker dissipation, thinner leaves
}


# ── ORBIT DENSITY ─────────────────────────────────────────────────────────────
def lozi_density(a: float, b: float) -> np.ndarray:
    """
    Run the Lozi map N_ITER steps and return a normalised log-density array.

    WHY no escape detection?
    Unlike the Tinkerbell or Burning Ship, the Lozi map at |b|<1, a>0 has
    an explicit trapping region: the convex hull of certain corner points
    maps strictly inside itself.  Misiurewicz's proof exploits this.
    No orbit will diverge at the parameters we use, so no reset is needed.

    WHY log1p?
    Dense fold lines near x=0 accumulate ~3–4 decades more visits than
    sparse outer filaments.  Raw count as height produces a featureless
    central plateau; log1p(count) compresses the range so both the bright
    core and hair-thin edges contribute legible geometry.
    """
    density  = np.zeros((N_GRID, N_GRID), dtype=np.float64)
    x_span   = X_MAX - X_MIN
    y_span   = Y_MAX - Y_MIN
    ng1      = N_GRID - 1

    x, y = 0.0, 0.0
    for _ in range(BURN_IN):
        x, y = 1.0 - a * abs(x) + y, b * x

    for _ in range(N_ITER):
        xn   = 1.0 - a * abs(x) + y
        yn   = b * x
        x, y = xn, yn
        ix   = int((x - X_MIN) / x_span * ng1 + 0.5)
        iy   = int((y - Y_MIN) / y_span * ng1 + 0.5)
        if 0 <= ix < N_GRID and 0 <= iy < N_GRID:
            density[iy, ix] += 1.0

    density = np.log1p(density)
    dmax    = density.max()
    if dmax > 0.0:
        density /= dmax
    return density


# ── MESH ──────────────────────────────────────────────────────────────────────
def build_floor_mesh(density: np.ndarray) -> bpy.types.Object:
    """
    120×120 quad grid — x,y fixed to world grid, z = density × HEIGHT_SCALE.
    All shape keys share the same x,y layout; only z morphs between keys.
    """
    me = bpy.data.meshes.new(OBJ_NAME)
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    bm   = bmesh.new()
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
            bm.faces.new([vgrid[i][j],    vgrid[i][j + 1],
                          vgrid[i + 1][j + 1], vgrid[i + 1][j]])
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
    mat = bpy.data.materials.new("Lozi_Mat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    attr           = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.location  = (-600, 0)
    bsdf           = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value  = 0.20
    bsdf.inputs["Roughness"].default_value = 0.55
    bsdf.location  = (-200, 0)
    emit           = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.4
    emit.location  = (-200, -220)
    add            = nodes.new("ShaderNodeAddShader")
    add.location   = (100, 0)
    out            = nodes.new("ShaderNodeOutputMaterial")
    out.location   = (300, 0)
    links.new(attr.outputs["Color"],      bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"],      emit.inputs["Color"])
    links.new(bsdf.outputs["BSDF"],       add.inputs[0])
    links.new(emit.outputs["Emission"],   add.inputs[1])
    links.new(add.outputs["Shader"],      out.inputs["Surface"])
    ob.data.materials.append(mat)


def add_shape_key(ob: bpy.types.Object,
                  name: str, density: np.ndarray) -> None:
    """Add a shape key updating only z (x,y grid is shared across all keys)."""
    sk   = ob.shape_key_add(name=name, from_mix=False)
    half = MESH_SCALE * 0.5
    coords: list[float] = []
    for i in range(N_GRID):
        for j in range(N_GRID):
            coords += [-half + j / (N_GRID - 1) * MESH_SCALE,
                       -half + i / (N_GRID - 1) * MESH_SCALE,
                       float(density[i, j]) * HEIGHT_SCALE]
    sk.data.foreach_set("co", coords)


def apply_holoflow_orientation(ob: bpy.types.Object) -> None:
    """+Y-up convention (Holoflow / Three.js): rotate mesh data in-place."""
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

    print("[Lozi] Computing Basis density …")
    d_basis = lozi_density(*PRESETS["Basis"])
    ob = build_floor_mesh(d_basis)
    write_colours(ob, d_basis)
    build_material(ob)
    ob.shape_key_add(name="Basis", from_mix=False)   # pins current z

    for key in ("SK_LowA", "SK_HiA", "SK_LowB"):
        print(f"[Lozi] Computing {key} density …")
        add_shape_key(ob, key, lozi_density(*PRESETS[key]))

    apply_holoflow_orientation(ob)
    V = len(ob.data.vertices)
    F = len(ob.data.polygons)
    print(f"[Lozi] Done — {V} vertices, {F} faces, "
          f"{len(ob.data.shape_keys.key_blocks)} shape keys.")


main()
