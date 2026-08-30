"""
Zaslavsky Stochastic Web — Kicked Oscillator, q-Fold Quasi-Crystal Corridors
Blender 5.1  |  bpy direct-data API  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A 2-D harmonic oscillator subjected to periodic δ-function kicks evolves by:

    x' =  x·cos α + (y + K·sin x)·sin α
    y' = −x·sin α + (y + K·sin x)·cos α

where α = 2π/q is the cyclotron rotation angle between kicks and K is
kick strength.  When α satisfies the resonance condition ωT = 2π/q
(q ∈ ℤ), a stochastic web with exact q-fold symmetry emerges in the
(x, y) phase plane.  The web is a fractal network of corridors through
which particles diffuse anomalously: ⟨r²⟩ ∝ t^μ, μ > 1 (Lévy transport).

Key cases:
  q=4: square lattice corridors   (α = π/2)
  q=3: triangular lattice         (α = 2π/3)
  q=6: honeycomb / hexagonal      (α = π/3)
  q=5: quasi-crystal web          (α = 2π/5) — NOT periodic, 5-fold rotational
       symmetry without translational periodicity (same class as Penrose tiling)

This blueprint samples N_IC trajectories for N_ITER steps, bins the visited
(x,y) cells into an N_GRID×N_GRID log-density height field, and builds a
stage-floor mesh.  Four shape keys sweep q ∈ {4,3,6,5}.  Cobalt vertex
colour encodes low-density open zones; amber marks dense web strands.

Source: Zaslavsky, Zakharov, Sagdeev, Usikov, Chernikov (1986)
        Zh. Eksp. Teor. Fiz. 91:500 [Sov. Phys. JETP 64:294] — equations PD
"""

import bpy
import bmesh
import numpy as np

# ── PARAMETERS ────────────────────────────────────────────────────────────
N_GRID     = 180       # grid bins per axis  (N_GRID² vertices = 32 400)
N_IC       = 100       # independent trajectories per run
N_ITER     = 18_000    # map steps per trajectory
XY_RANGE   = 4.5 * np.pi   # plot domain ±XY_RANGE (captures ~2 web cells)
K_KICK     = 0.6       # kick strength — strong enough for visible web corridors

MESH_SCALE   = 6.0     # world diameter, metres
HEIGHT_SCALE = 0.50    # max z elevation, metres
OBJ_NAME     = "Zaslavsky_Web"

COBALT = (0.00, 0.38, 0.74, 1.0)
AMBER  = (1.00, 0.65, 0.00, 1.0)

RNG_SEED = 42          # reproducible orbit density

# ── ORBIT DENSITY ─────────────────────────────────────────────────────────
def web_density(q: int, K: float = K_KICK) -> np.ndarray:
    """
    Run N_IC trajectories under the Zaslavsky web map for given q and return
    a (N_GRID, N_GRID) log-density array.

    Why vectorise over trajectories, not grid cells?
    Each trajectory independently explores the stochastic web via the simple
    nonlinear map — no ODE integration needed.  Running N_IC in parallel as
    numpy arrays is dramatically faster than N_IC nested Python loops.

    The log(1 + counts) transform compresses the 4-decade dynamic range
    of the density: open KAM regions have 0-5 hits, web strands have 100-5000.
    """
    alpha = 2.0 * np.pi / q
    c, s  = np.cos(alpha), np.sin(alpha)

    rng = np.random.default_rng(RNG_SEED)
    # Seed uniformly over ±XY_RANGE — some seeds land in web, some in islands.
    x = rng.uniform(-XY_RANGE, XY_RANGE, N_IC)
    y = rng.uniform(-XY_RANGE, XY_RANGE, N_IC)

    counts = np.zeros((N_GRID, N_GRID), dtype=np.float64)

    inv_cell = N_GRID / (2.0 * XY_RANGE)   # pixels per unit length

    for _ in range(N_ITER):
        # map step
        yK = y + K * np.sin(x)
        xn = x * c + yK * s
        yn = -x * s + yK * c
        x, y = xn, yn

        # bin into grid (reject out-of-range escapes)
        xi = ((x + XY_RANGE) * inv_cell).astype(np.int32)
        yi = ((y + XY_RANGE) * inv_cell).astype(np.int32)
        ok = (xi >= 0) & (xi < N_GRID) & (yi >= 0) & (yi < N_GRID)
        np.add.at(counts, (xi[ok], yi[ok]), 1)

    # log normalise to [0, 1]
    h = np.log1p(counts)
    h /= h.max() if h.max() > 0 else 1.0
    return h   # shape (N_GRID, N_GRID), row=x-axis, col=y-axis


# ── MESH CONSTRUCTION ─────────────────────────────────────────────────────
def build_floor(h_basis: np.ndarray,
                h_q3:    np.ndarray,
                h_q6:    np.ndarray,
                h_q5:    np.ndarray) -> bpy.types.Object:
    """
    Build a flat stage-floor mesh from the basis density, then attach three
    shape keys for q=3, q=6, q=5.

    Why one mesh, not four?  Shape keys share topology, so the viewer can
    blend between any pair of webs in real time (morph targets in WebXR).
    The vertex colours are those of the basis (q=4) — a single FLOAT_COLOR
    attribute is sufficient because the web strand positions are similar
    enough across q values.
    """
    ng = N_GRID

    # ── clear scene ───────────────────────────────────────────────────────
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    # ── build base mesh (q=4 density) ─────────────────────────────────────
    verts, faces = [], []
    half = MESH_SCALE / 2.0
    for r in range(ng):
        for c in range(ng):
            vx = -half + c * MESH_SCALE / (ng - 1)
            vy = -half + r * MESH_SCALE / (ng - 1)
            vz = float(h_basis[r, c]) * HEIGHT_SCALE
            verts.append((vx, vy, vz))

    for r in range(ng - 1):
        for c in range(ng - 1):
            i0, i1 = r * ng + c, r * ng + c + 1
            i2, i3 = (r + 1) * ng + c + 1, (r + 1) * ng + c
            faces.append((i0, i1, i2, i3))

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts, [], faces)
    me.validate()
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(ob)

    # ── shape keys ────────────────────────────────────────────────────────
    sk_basis = ob.shape_key_add(name="Basis", from_mix=False)
    sk_basis.interpolation = 'KEY_LINEAR'

    for label, h_alt in [("SK_Q3", h_q3), ("SK_Q6", h_q6), ("SK_Q5", h_q5)]:
        sk = ob.shape_key_add(name=label, from_mix=False)
        sk.interpolation = 'KEY_LINEAR'
        for r in range(ng):
            for c in range(ng):
                i = r * ng + c
                vx = sk_basis.data[i].co.x
                vy = sk_basis.data[i].co.y
                vz = float(h_alt[r, c]) * HEIGHT_SCALE
                sk.data[i].co = (vx, vy, vz)

    # ── vertex colours (FLOAT_COLOR = Blender 5.1 preferred) ──────────────
    attr = me.color_attributes.new(
        name="ZaslavWeb_Density",
        type='FLOAT_COLOR',
        domain='POINT',
    )
    flat = h_basis.ravel()                          # row-major, matches verts
    col_flat = np.empty(len(verts) * 4, dtype=np.float32)
    t = flat                                        # [0,1] density
    col_flat[0::4] = COBALT[0] * (1 - t) + AMBER[0] * t   # R
    col_flat[1::4] = COBALT[1] * (1 - t) + AMBER[1] * t   # G
    col_flat[2::4] = COBALT[2] * (1 - t) + AMBER[2] * t   # B
    col_flat[3::4] = 1.0                                    # A
    attr.data.foreach_set("color", col_flat.tolist())

    return ob


# ── MATERIAL ──────────────────────────────────────────────────────────────
def make_material(ob: bpy.types.Object) -> None:
    """
    Attribute-driven emission material — reads ZaslavWeb_Density vertex colour,
    drives emission strength so the densest web strands glow amber.
    No UV needed; colour is already baked into vertex attributes.
    """
    mat = bpy.data.materials.new(name="Mat_ZaslavWeb")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "ZaslavWeb_Density"
    attr.attribute_type = 'GEOMETRY'

    emit.inputs["Strength"].default_value = 2.4
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    ob.data.materials.append(mat)


# ── SCENE & CAMERA ────────────────────────────────────────────────────────
def setup_scene() -> None:
    """Top-down orthographic camera, EEVEE Next, white world background."""
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_EEVEE_NEXT'

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = MESH_SCALE * 1.25
    cam_ob = bpy.data.objects.new("Cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_ob)
    cam_ob.location = (0, 0, 8)
    cam_ob.rotation_euler = (0, 0, 0)
    scn.camera = cam_ob

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.04
    scn.world = world


# ── HOLOFLOW EXPORT METADATA ───────────────────────────────────────────────
def tag_object(ob: bpy.types.Object) -> None:
    """Apply the holoflow:facet custom property required by the exporter."""
    ob["holoflow:facet"] = False          # smooth floor, not faceted
    ob["holoflow:export_root"] = OBJ_NAME


# ── MAIN ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Computing web densities …")
    h4 = web_density(q=4)   # Basis — square lattice
    h3 = web_density(q=3)   # SK_Q3 — triangular
    h6 = web_density(q=6)   # SK_Q6 — hexagonal
    h5 = web_density(q=5)   # SK_Q5 — quasi-crystal (non-periodic)
    print("Building mesh …")
    ob = build_floor(h4, h3, h6, h5)
    make_material(ob)
    setup_scene()
    tag_object(ob)
    print(f"Done — {len(ob.data.vertices)} vertices, 4 shape keys.")
