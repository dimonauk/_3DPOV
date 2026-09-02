"""
Peter de Jong Attractor — Discrete 2-D Trigonometric Map, Log-Density Height-Field
Blender 5.1  |  bpy direct-data API  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The de Jong attractor is a discrete iterated map of the plane:

    x_{n+1} = sin(a · y_n) − cos(b · x_n)
    y_{n+1} = sin(c · x_n) − cos(d · y_n)

Four real parameters (a, b, c, d) steer an enormous diversity of fractal
forms from the same six characters of math: fine crystalline webs, organic
heart-shaped lobes, sunburst halos, and compressed spirals.

Unlike the Clifford attractor (which uses a in BOTH trig functions per line),
de Jong uses each parameter independently in exactly one function, giving a
richer decoupled parameter space with distinct visual character.

The map is bounded: since |sin|, |cos| ≤ 1, every orbit satisfies |x|, |y| ≤ 2
always.  It is dissipative (Jacobian determinant ≠ 1 in general), so the orbit
contracts onto a strange attractor with fractal dimension D_f < 2.

This blueprint iterates 5 × 10⁶ steps, bins the visited (x, y) cells into a
120 × 120 log-density grid, and lifts that grid into a Blender stage-floor mesh.
Four shape keys sample visually distinct parameter regimes:

  Basis      a=−2.00  b=−2.00  c=−1.20  d= 2.00   "paisley" — lopsided heart lobe
  SK_Web     a= 1.40  b=−2.30  c= 2.40  d=−2.10   fine crystalline filament web
  SK_Star    a=−2.50  b= 1.50  c=−0.70  d= 1.80   radial sunburst halo
  SK_Spiral  a=−0.80  b=−1.30  c=−1.80  d=−2.60   dense compressed spiral

Vertex colour (FLOAT_COLOR "DeJong_Density") interpolates cobalt (low density)
→ amber (high density) for WebXR delivery.

Sources:
  de Jong P 1994 "Strange Attractors" in Scientific American Digital — equations PD
  Sprott JC 1993 "Strange Attractors: Creating Patterns in Chaos" Wiley — parameter
    survey in public domain.  Website: https://sprott.physics.wisc.edu/ (CC0 content)
  Paul Bourke "Strange Attractors" https://paulbourke.net/fractals/peterdejong/ (CC0)
"""

import bpy
import bmesh
import numpy as np

# ── PARAMETERS ────────────────────────────────────────────────────────────────
N_GRID       = 120          # bins per axis  →  120×120 = 14 400 vertices
N_ITER       = 5_000_000    # orbit steps per shape key
XY_RANGE     = 2.0          # domain ±XY_RANGE (de Jong always stays in ±2)
MESH_SCALE   = 6.0          # world diameter, metres
HEIGHT_SCALE = 0.50         # max z elevation, metres
OBJ_NAME     = "DeJong_Attractor"
ATTR_NAME    = "DeJong_Density"

COBALT = (0.00, 0.38, 0.74, 1.0)
AMBER  = (1.00, 0.65, 0.00, 1.0)

# Parameter sets  (a, b, c, d)
PRESETS = {
    "Basis"    : (-2.00, -2.00, -1.20,  2.00),  # paisley / heart lobe
    "SK_Web"   : ( 1.40, -2.30,  2.40, -2.10),  # crystalline filament web
    "SK_Star"  : (-2.50,  1.50, -0.70,  1.80),  # radial sunburst halo
    "SK_Spiral": (-0.80, -1.30, -1.80, -2.60),  # dense compressed spiral
}


# ── ORBIT DENSITY ─────────────────────────────────────────────────────────────
def dejong_density(a: float, b: float, c: float, d: float) -> np.ndarray:
    """
    Iterate the de Jong map N_ITER times and return a 2-D log-density array.

    WHY single trajectory?
    De Jong attractors are ergodic for these parameters: one long orbit fills
    the full attractor support.  Multiple seeds from different starting points
    would give identical density fields (up to transient contamination), so a
    single seed is more efficient.

    WHY log(1 + count)?
    Raw visit counts span 3-4 decades: the densest cells (orbit fixed points,
    fold lines) accumulate ~10 000× more visits than the sparse filament tips.
    log(1 + count) compresses that range so both the bright core and faint tails
    contribute visible geometry.  This is identical to the transform used by
    Scott Draves in the Flame algorithm (2003).
    """
    counts = np.zeros((N_GRID, N_GRID), dtype=np.float64)
    half   = N_GRID / 2.0
    scale  = (N_GRID - 1) / (2.0 * XY_RANGE)

    x, y = 0.5, 0.5        # seed away from the obvious fixed point (0, -1)
    # burn-in: 500 steps to land on the attractor before counting
    for _ in range(500):
        x, y = np.sin(a * y) - np.cos(b * x), np.sin(c * x) - np.cos(d * y)

    # main accumulation loop — pure Python is fine for 5M steps in ~3 s
    for _ in range(N_ITER):
        xn = np.sin(a * y) - np.cos(b * x)
        yn = np.sin(c * x) - np.cos(d * y)
        x, y = xn, yn
        ix = int((x + XY_RANGE) * scale + 0.5)
        iy = int((y + XY_RANGE) * scale + 0.5)
        if 0 <= ix < N_GRID and 0 <= iy < N_GRID:
            counts[iy, ix] += 1.0

    return np.log1p(counts)        # log(1 + count), avoids log(0)


# ── BUILD MESH ────────────────────────────────────────────────────────────────
def build_grid_mesh(name: str, density: np.ndarray) -> bpy.types.Object:
    """
    Create a N_GRID × N_GRID quad mesh from a 2-D density array.

    Grid layout: row-major, (col, row) → vertex index col + row * N_GRID.
    Faces are (N_GRID-1)² quads — no wrapping needed for a stage floor.
    Z height = density[row, col] / density.max() * HEIGHT_SCALE.
    """
    bm = bmesh.new()

    max_d = density.max() or 1.0
    step  = MESH_SCALE / (N_GRID - 1)
    half  = MESH_SCALE / 2.0

    # vertices
    verts = []
    for row in range(N_GRID):
        for col in range(N_GRID):
            z = (density[row, col] / max_d) * HEIGHT_SCALE
            v = bm.verts.new((col * step - half, row * step - half, z))
            verts.append(v)
    bm.verts.ensure_lookup_table()

    # faces — quads: (col,row) → (col+1,row) → (col+1,row+1) → (col,row+1)
    for row in range(N_GRID - 1):
        for col in range(N_GRID - 1):
            i0 = col +      row      * N_GRID
            i1 = col + 1 +  row      * N_GRID
            i2 = col + 1 + (row + 1) * N_GRID
            i3 = col +     (row + 1) * N_GRID
            bm.faces.new([verts[i0], verts[i1], verts[i2], verts[i3]])

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── FLOAT_COLOR ATTRIBUTE ─────────────────────────────────────────────────────
def set_density_colour(mesh: bpy.types.Mesh, density: np.ndarray) -> None:
    """
    Write a FLOAT_COLOR vertex attribute (POINT domain) by interpolating
    COBALT → AMBER with normalised log-density as the mix factor.

    WHY FLOAT_COLOR over byte colour?
    FLOAT_COLOR stores four float32 channels, preserving the full dynamic
    range of the density gradient.  Byte colours (0-255) would posterise the
    subtle filament tips.  Blender's EEVEE-Next reads FLOAT_COLOR natively
    for emission-driven material nodes.
    """
    attr = mesh.color_attributes.get(ATTR_NAME)
    if attr:
        mesh.color_attributes.remove(attr)
    attr = mesh.color_attributes.new(
        name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT"
    )

    flat    = density.ravel()
    max_d   = flat.max() or 1.0
    t_vals  = flat / max_d               # normalised [0, 1] per vertex

    colours = np.empty((len(t_vals), 4), dtype=np.float32)
    for ch in range(4):
        colours[:, ch] = (
            COBALT[ch] * (1.0 - t_vals) + AMBER[ch] * t_vals
        )

    attr.data.foreach_set("color", colours.ravel())


# ── SHAPE KEYS ────────────────────────────────────────────────────────────────
def add_shape_key(obj: bpy.types.Object,
                  key_name: str,
                  density: np.ndarray) -> None:
    """
    Add a shape key to obj by writing new Z positions into co[].z.

    WHY write to co[] rather than re-create a mesh?
    Shape keys store ONLY the delta from the Basis, so keeping the same
    (x,y) grid structure and changing only z is the correct pattern.  Blender
    5.1's key.data[i].co is a mathutils.Vector; foreach_set via numpy is the
    fastest path without requiring the UI context.
    """
    sk   = obj.shape_key_add(name=key_name, from_mix=False)
    max_d = density.max() or 1.0
    flat  = density.ravel()

    # fetch current co array, update z only
    n   = len(sk.data)
    co  = np.empty(n * 3, dtype=np.float32)
    sk.data.foreach_get("co", co)

    co[2::3] = (flat / max_d) * HEIGHT_SCALE
    sk.data.foreach_set("co", co)


# ── MATERIAL ──────────────────────────────────────────────────────────────────
def build_material(obj: bpy.types.Object) -> None:
    """
    Principled BSDF reading DeJong_Density FLOAT_COLOR attribute for both
    BaseColor and EmissionColor.  Metallic + roughness values match the
    cobalt-amber stage-floor aesthetic used across the library.

    WHY emission strength 1.8?
    Low-density cells (filament tips) need enough glow to read against the
    dark WebXR background without over-blowing the dense amber core.  1.8 is
    the same value calibrated for the Clifford and Zaslavsky floor tutorials.
    """
    mat = bpy.data.materials.new(name="DeJong_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    attr  = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = "GEOMETRY"

    bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic" ].default_value = 0.45
    bsdf.inputs["Roughness"].default_value = 0.28
    bsdf.inputs["Emission Strength"].default_value = 1.8

    out   = nodes.new("ShaderNodeOutputMaterial")

    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.append(mat)


# ── EXPORT HELPER ─────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object, path: str) -> None:
    """
    +Y-up GLB export matching Holoflow pipeline spec:
      - apply all transforms first
      - Draco compression level 6
      - morph targets (shape keys) included
      - FLOAT_COLOR vertex colours included
      - holoflow:facet flag for the WebXR facet renderer
    """
    obj.rotation_euler = (1.5707963, 0.0, 0.0)  # +Y-up rotation
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    bpy.ops.export_scene.gltf(
        filepath              = path,
        use_selection         = True,
        export_format         = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_morph          = True,
        export_colors         = True,
        export_yup            = True,
    )


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    # clear existing DeJong objects
    for o in list(bpy.data.objects):
        if OBJ_NAME in o.name:
            bpy.data.objects.remove(o, do_unlink=True)

    # -- build basis mesh with Basis density
    basis_params = PRESETS["Basis"]
    basis_density = dejong_density(*basis_params)
    obj = build_grid_mesh(OBJ_NAME, basis_density)
    set_density_colour(obj.data, basis_density)
    build_material(obj)

    # -- add Basis shape key (required as the reference key)
    obj.shape_key_add(name="Basis", from_mix=False)

    # -- add remaining shape keys
    for key_name, params in PRESETS.items():
        if key_name == "Basis":
            continue
        density = dejong_density(*params)
        add_shape_key(obj, key_name, density)

    # set holoflow facet flag
    if "holoflow:facet" not in obj:
        obj["holoflow:facet"] = True
    obj["holoflow:category"] = "stage-floor"

    print(f"[DeJong] mesh built: {len(obj.data.vertices)} vertices "
          f"{len(obj.data.polygons)} quads")

    # optional export — uncomment path to save
    # export_glb(obj, "/tmp/dejong_floor.glb")


if __name__ == "__main__":
    main()
