"""
Chirikov–Taylor Standard Map — KAM Breakdown & Greene's Critical Threshold
Blender 5.1  |  bpy direct-data API  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The standard map is the canonical area-preserving twist map on the 2-torus T²:

    p_{n+1} = p_n + K·sin(θ_n)   (mod 2π)
    θ_{n+1} = θ_n + p_{n+1}       (mod 2π)

Its Jacobian is [[1, K·cos θ], [1, 1+K·cos θ]] with det = 1 everywhere —
the map is symplectic and area-preserving for all K.

KAM theory guarantees that for small K most invariant tori survive, but as K
increases, rational-winding tori break into alternating stable/unstable island
chains (Poincaré–Birkhoff theorem).  The critical threshold K_c ≈ 0.971635...
(Greene 1979) is the value at which the last invariant curve — the noble torus
with winding number (√5−1)/2 — collapses.  Above K_c, global transport across
the phase space becomes possible.

This blueprint produces a 180×180 stage-floor height-field whose height at
each (θ, p) cell encodes the log-density of orbits visiting that cell.  KAM
tori appear as dense ridges; the chaotic sea fills in uniformly.  Four shape
keys capture the four dynamical regimes.

Vertex colour channel 'Col':
    Cobalt  (0,0.38,0.74) → low-density chaotic sea
    Amber   (1.0,0.65,0) → high-density KAM ridges and island cores
"""

import bpy
import bmesh
import numpy as np

# ── PARAMETERS (change these) ──────────────────────────────────────────────
K_NEAR_INT = 0.10       # nearly integrable — almost all tori survive
K_INTACT   = 0.50       # typical KAM: clear island chains, most tori intact
K_CRITICAL = 0.971635   # Greene's threshold — last KAM curve (golden-ratio ω)
K_CHAOTIC  = 2.00       # mostly stochastic sea, only small island remnants

N_GRID = 180            # phase-space bins per axis (180×180 mesh)
N_IC   = 200            # initial conditions per run (θ₀ ∈ [0,2π), p₀ spaced)
N_ITER = 6000           # map iterations per trajectory
LOG_EPS = 1.0           # ε in log(ε + count) — controls contrast

MESH_SCALE   = 6.0      # world-space diameter in metres
HEIGHT_SCALE = 0.45     # maximum z in metres
OBJ_NAME     = "StandardMap_KAM"

COBALT = (0.00, 0.38, 0.74, 1.0)
AMBER  = (1.00, 0.65, 0.00, 1.0)


# ── ORBIT DENSITY ──────────────────────────────────────────────────────────
def orbit_density(K: float) -> np.ndarray:
    """Return a normalised log-density height field for parameter K.

    Why sample from θ=0 only?  Because the map is twist-type: trajectories
    starting from the Poincaré section θ=0 densely fill their invariant set.
    A set of evenly-spaced p₀ values seeds the full dynamical portrait in one
    pass.  Parallel numpy iteration is safe here because all N_IC trajectories
    are independent; we accumulate into the same count array using np.add.at
    which correctly handles index collisions.
    """
    TAU = 2.0 * np.pi
    p  = np.linspace(0.0, TAU, N_IC, endpoint=False)   # seed: p₀ ∈ [0,2π)
    th = np.zeros(N_IC)                                  # seed: θ₀ = 0

    counts = np.zeros((N_GRID, N_GRID), dtype=np.float64)

    for _ in range(N_ITER):
        p  = (p  + K * np.sin(th)) % TAU
        th = (th + p) % TAU
        # Bin each trajectory point into the N_GRID×N_GRID phase-space grid.
        # Integer cast is faster than np.digitize for uniform grids.
        ti = (th * (N_GRID / TAU)).astype(np.int32) % N_GRID   # θ-axis
        pi = (p  * (N_GRID / TAU)).astype(np.int32) % N_GRID   # p-axis
        np.add.at(counts, (ti, pi), 1)

    h = np.log(LOG_EPS + counts)
    # Normalise to [0,1] so HEIGHT_SCALE drives absolute height independently.
    return h / max(h.max(), 1e-9)


# ── MESH BUILDER ───────────────────────────────────────────────────────────
def build_floor_mesh(heights: np.ndarray, name: str) -> bpy.types.Object:
    """Create a flat N×N quad mesh with z driven by heights[i,j].

    Why direct API instead of bpy.ops?  Operators require an active scene
    context and create intermediary primitives.  The foreach_set path is ~10×
    faster, operator-independent, and leaves no undo noise.
    """
    N, M = heights.shape
    dx = MESH_SCALE / (N - 1)
    dy = MESH_SCALE / (M - 1)

    xs = (np.arange(N) - (N - 1) / 2.0) * dx   # centred on origin
    ys = (np.arange(M) - (M - 1) / 2.0) * dy
    xx, yy = np.meshgrid(xs, ys, indexing='ij')  # shape (N,M)
    zz = heights * HEIGHT_SCALE

    # Flatten to flat vertex list: x,y,z interleaved
    verts = np.stack([xx.ravel(), yy.ravel(), zz.ravel()], axis=1).ravel()

    # Quad faces: (i,j) vertex index = i*M + j
    i_idx = np.arange(N - 1)
    j_idx = np.arange(M - 1)
    ii, jj = np.meshgrid(i_idx, j_idx, indexing='ij')
    v0 = (ii     * M + jj    ).ravel()
    v1 = ((ii+1) * M + jj    ).ravel()
    v2 = ((ii+1) * M + (jj+1)).ravel()
    v3 = (ii     * M + (jj+1)).ravel()
    faces = np.stack([v0, v1, v2, v3], axis=1).ravel()

    n_verts = N * M
    n_faces = (N - 1) * (M - 1)

    me = bpy.data.meshes.new(name)
    me.vertices.add(n_verts)
    me.vertices.foreach_set("co", verts)
    me.loops.add(n_faces * 4)
    me.polygons.add(n_faces)
    me.polygons.foreach_set("loop_start", np.arange(n_faces, dtype=np.int32) * 4)
    me.polygons.foreach_set("loop_total", np.full(n_faces, 4, dtype=np.int32))
    me.loops.foreach_set("vertex_index", faces.astype(np.int32))
    me.update()
    me.validate()

    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── VERTEX COLOUR ──────────────────────────────────────────────────────────
def paint_vertex_colour(obj: bpy.types.Object, heights: np.ndarray) -> None:
    """Assign per-vertex FLOAT_COLOR attribute 'Col' (Cobalt→Amber by height).

    FLOAT_COLOR stores linear-light float values.  This is the correct domain
    for Blender 4.2+ colour attributes; byte-colour 'BYTE_COLOR' would clamp
    HDR values and lose precision for shader-driven emission.
    """
    me = obj.data
    if "Col" not in me.color_attributes:
        me.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
    attr = me.color_attributes["Col"]

    h_flat = heights.ravel()
    t = h_flat[:, None]   # (N*M, 1) interpolation parameter
    cols = np.array(COBALT[:3])[None, :] * (1.0 - t) + np.array(AMBER[:3])[None, :] * t
    rgba = np.concatenate([cols, np.ones((len(h_flat), 1))], axis=1)
    attr.data.foreach_set("color", rgba.ravel())


# ── SHAPE KEYS ─────────────────────────────────────────────────────────────
def add_shape_key(obj: bpy.types.Object, name: str, heights: np.ndarray) -> None:
    """Add a shape key to obj with z-coordinates driven by heights.

    Why not use bpy.ops.object.shape_key_add?  That operator requires the
    object to be active and the context to be in Object mode.  The direct
    API — creating the key on me.shape_keys — is context-free and reentrant.
    """
    me = obj.data
    if me.shape_keys is None:
        # First key must be 'Basis'.
        sk_basis = obj.shape_key_add(name="Basis", from_mix=False)
        sk_basis.interpolation = 'KEY_LINEAR'

    sk = obj.shape_key_add(name=name, from_mix=False)
    sk.interpolation = 'KEY_LINEAR'

    N, M = heights.shape
    dx = MESH_SCALE / (N - 1)
    dy = MESH_SCALE / (M - 1)
    xs = (np.arange(N) - (N - 1) / 2.0) * dx
    ys = (np.arange(M) - (M - 1) / 2.0) * dy
    xx, yy = np.meshgrid(xs, ys, indexing='ij')
    zz = heights * HEIGHT_SCALE
    coords = np.stack([xx.ravel(), yy.ravel(), zz.ravel()], axis=1).ravel()
    sk.data.foreach_set("co", coords)


# ── MATERIAL ───────────────────────────────────────────────────────────────
def make_material(name: str) -> bpy.types.Material:
    """Emission material driven by the 'Col' vertex-colour attribute."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"
    attr.location = (-400, 0)

    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.8
    em.location = (-100, 0)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)

    nt.links.new(attr.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── MAIN ───────────────────────────────────────────────────────────────────
def main() -> None:
    # Purge previous run if re-running
    for ob in list(bpy.data.objects):
        if ob.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(OBJ_NAME):
            bpy.data.meshes.remove(me)

    print(f"[StandardMap] Computing orbit density for K={K_CRITICAL:.6f}...")
    h_basis = orbit_density(K_CRITICAL)

    obj = build_floor_mesh(h_basis, OBJ_NAME)
    obj.name = OBJ_NAME
    paint_vertex_colour(obj, h_basis)

    # Basis shape key embedded in the mesh itself (coincident with mesh verts).
    obj.shape_key_add(name="Basis", from_mix=False)

    for label, K in [
        ("SK_Integrable", K_NEAR_INT),
        ("SK_Intact",     K_INTACT),
        ("SK_Chaotic",    K_CHAOTIC),
    ]:
        print(f"[StandardMap] Computing density K={K}...")
        h = orbit_density(K)
        add_shape_key(obj, label, h)

    mat = make_material(f"{OBJ_NAME}_Mat")
    obj.data.materials.append(mat)

    # Apply +Y-up convention and scale for WebXR export
    obj.scale = (1.0, 1.0, 1.0)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    print("[StandardMap] Done — object:", obj.name,
          "| vertices:", len(obj.data.vertices),
          "| shape keys:", len(obj.data.shape_keys.key_blocks))


if __name__ == "__main__":
    main()
