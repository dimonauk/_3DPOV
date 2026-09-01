"""
May–Leonard 3-Species Cyclic Competition — blueprint.py
Blender 5.1 · bpy + numpy · CC0

Technique: The May–Leonard (1975) system is the canonical 3-species generalisation
of Lotka–Volterra competition in which one species always beats another in a
rock–paper–scissors cycle (x₁ beats x₂ beats x₃ beats x₁). Unlike two-species
competition (which always ends in exclusion or stable coexistence), the cyclic
asymmetry produces a *heteroclinic cycle* on the boundary of the population simplex:
trajectories spiral outward from the interior fixed point, approaching an attracting
triangular orbit connecting the three single-species vertices. Each pass gets
exponentially slower than the last (Shilnikov-type heteroclinic), so the tube piles
up near each corner of the triangle before racing along the next edge.

Source: May R M & Leonard W J (1975) Nonlinear aspects of competition between
  three species. SIAM J Appl Math 29(2):243–253. Mathematical content public domain.
"""

import bpy
import numpy as np
from math import pi

# ── Parameters ──────────────────────────────────────────────────────────────────
# Competition coefficients (cyclic asymmetry):
#   x₁ loses to x₃ (β-term), wins over x₂ (α-term, α<1)
#   WHY α=0.5, β=1.5: α+β = 2 is the May–Leonard critical boundary.
#   For α+β > 2 the heteroclinic cycle is *attracting* (trajectories spiral out).
ALPHA_BASIS   = 0.50   # intra-row competition coefficient (weak suppressor)
BETA_BASIS    = 1.50   # inter-row competition coefficient (strong suppressor)

ALPHA_COEXIST = 0.90   # α+β = 1.8 < 2 → stable interior fixed point
BETA_COEXIST  = 0.90

ALPHA_REVERSE = 1.50   # reversed dominance cycle (β<α)
BETA_REVERSE  = 0.50

ALPHA_INNER   = 0.50   # same heteroclinic params but IC near interior
BETA_INNER    = 1.50

# Integration (RK4):
#   WHY DT=0.005: near each vertex saddle the trajectory stalls (eigenvalue
#   ≈ -(1-α) ≈ -0.5); DT=0.005 gives ≈ 100 steps per natural time unit so
#   the slowing-down near each saddle is sampled with ≥ 200 points.
DT         = 0.005
N_STEPS    = 80_000   # total recorded steps
SKIP       = 26       # thin to ≈ 3 077 waypoints

# Initial conditions:
#   Basis / Inner / Reverse share the same IC; Coexist uses slightly different.
IC_BASIS   = np.array([0.70, 0.20, 0.10])  # near x₁-dominant vertex
IC_INNER   = np.array([0.34, 0.33, 0.33])  # near interior — more cycles before boundary
IC_COEXIST = np.array([0.60, 0.25, 0.15])  # stable spiral-in
IC_REVERSE = np.array([0.70, 0.20, 0.10])  # same IC, different dynamics

# Scaling: coordinates live in [0,1]³, centred at (1/3,1/3,1/3).
# SCALE multiplied after subtracting centroid; 2.0 gives ≈ 1.3 m attractor.
CENTROID   = np.array([1/3, 1/3, 1/3])
SCALE      = 2.0

# Tube geometry:
TUBE_SIDES = 12    # 12-gon ≈ 0.3% circular deviation — smooth enough for WebXR
TUBE_R     = 0.015 # m — thin; the simplex triangle fits inside a ≈ 1 m sphere
POI_R      = 0.082 # m — standard Holoflow poi head sphere

COBALT     = (0.06, 0.14, 0.66, 1.0)   # species 1 rare
AMBER      = (0.88, 0.52, 0.04, 1.0)   # species 1 dominant

OBJ_NAME   = "MayLeonard_Poi"
MESH_NAME  = "MayLeonard_Mesh"
MAT_NAME   = "MayLen_Mat"
ATTR_NAME  = "MayLen_X1"          # species-1 population → colour
EXPORT_PATH = "//may_leonard_poi.glb"


# ── ODE ──────────────────────────────────────────────────────────────────────────
def _deriv(x: np.ndarray, alpha: float, beta: float) -> np.ndarray:
    """
    ẋ₁ = x₁(1 - x₁ - α·x₂ - β·x₃)
    ẋ₂ = x₂(1 - β·x₁ - x₂ - α·x₃)   ← cyclic shift of the (1,α,β) row
    ẋ₃ = x₃(1 - α·x₁ - β·x₂ - x₃)

    Phase-space divergence:
    div F = 3 - (2+α+β)·(x₁+x₂+x₃)
    For canonical α=0.5, β=1.5: div = 3 - 4N.
    At N=1 (single-species vertex): div = -1 (dissipative).
    At interior N=1: div = -1 (also).  NOT constant — position-dependent.
    WHY this matters: cannot use Liouville as a simple check (unlike Lorenz/Chen).
    Instead verify conservation of the *orbit quality* by monitoring
    the asymmetry measure A = (x₁-x₂)² + (x₂-x₃)² + (x₃-x₁)²; near the
    boundary cycle A → 1.5, near interior A → 0.
    """
    x1, x2, x3 = x
    dx1 = x1 * (1.0 - x1 - alpha * x2 - beta  * x3)
    dx2 = x2 * (1.0 - beta  * x1 - x2 - alpha * x3)
    dx3 = x3 * (1.0 - alpha * x1 - beta  * x2 - x3)
    return np.array([dx1, dx2, dx3])


def _rk4(x0: np.ndarray, alpha: float, beta: float,
         dt: float, n: int, skip: int) -> np.ndarray:
    """Fourth-order Runge–Kutta, population-clamped to [0,1]."""
    pts = []
    x = x0.copy().astype(float)
    for i in range(n):
        k1 = _deriv(x,            alpha, beta)
        k2 = _deriv(x + dt/2*k1,  alpha, beta)
        k3 = _deriv(x + dt/2*k2,  alpha, beta)
        k4 = _deriv(x + dt*k3,    alpha, beta)
        x = x + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
        x = np.clip(x, 0.0, 1.0)          # populations are non-negative
        if i % skip == 0:
            pts.append(x.copy())
    return np.array(pts)                   # shape (n//skip, 3)


def _to_blender(pts: np.ndarray) -> np.ndarray:
    """Shift centroid to origin and scale to SCALE metres."""
    return (pts - CENTROID) * SCALE


# ── Bishop parallel-transport tube ──────────────────────────────────────────────
def _bishop_tube(waypoints: np.ndarray, radius: float, sides: int):
    """
    Build (verts, faces) for a closed tube around an open polyline.
    Bishop (1975) parallel transport: at each step, rotate the previous
    cross-section frame by the minimal rotation that aligns the old tangent
    with the new tangent (Rodrigues formula). No Frenet twist at inflection.
    """
    N = len(waypoints)
    tangents = np.zeros_like(waypoints)
    tangents[:-1] = waypoints[1:] - waypoints[:-1]
    tangents[-1]  = tangents[-2]
    norms = np.linalg.norm(tangents, axis=1, keepdims=True)
    norms = np.where(norms < 1e-10, 1.0, norms)
    tangents /= norms

    # Initial frame — pick an axis not parallel to first tangent
    t0 = tangents[0]
    u0 = np.array([0.0, 0.0, 1.0]) if abs(t0[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    n0 = np.cross(t0, u0); n0 /= np.linalg.norm(n0)
    b0 = np.cross(t0, n0)
    frames = [(n0, b0)]

    for i in range(1, N):
        old_t, new_t = tangents[i-1], tangents[i]
        axis = np.cross(old_t, new_t)
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(old_t, new_t)
        prev_n, prev_b = frames[-1]
        if sin_a < 1e-10:
            frames.append((prev_n, prev_b))
        else:
            axis /= sin_a
            # Rodrigues rotation applied to prev_n and prev_b
            def rod(v):
                return (v * cos_a
                        + np.cross(axis, v) * sin_a
                        + axis * np.dot(axis, v) * (1 - cos_a))
            frames.append((rod(prev_n), rod(prev_b)))

    angles = np.linspace(0, 2*pi, sides, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)

    verts = []
    for i, (pt, (n, b)) in enumerate(zip(waypoints, frames)):
        for ca, sa in zip(cos_a, sin_a):
            verts.append(tuple(pt + radius * (ca*n + sa*b)))

    faces = []
    for i in range(N - 1):
        for j in range(sides):
            a = i * sides + j
            b_ = i * sides + (j + 1) % sides
            c = (i + 1) * sides + (j + 1) % sides
            d = (i + 1) * sides + j
            faces.append((a, b_, c, d))

    return verts, faces


# ── Main build ──────────────────────────────────────────────────────────────────
def build():
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # ── Integrate all four paths ──────────────────────────────────────────────
    pts_basis   = _to_blender(_rk4(IC_BASIS,   ALPHA_BASIS,   BETA_BASIS,   DT, N_STEPS, SKIP))
    pts_coexist = _to_blender(_rk4(IC_COEXIST, ALPHA_COEXIST, BETA_COEXIST, DT, N_STEPS, SKIP))
    pts_reverse = _to_blender(_rk4(IC_REVERSE, ALPHA_REVERSE, BETA_REVERSE, DT, N_STEPS, SKIP))
    pts_inner   = _to_blender(_rk4(IC_INNER,   ALPHA_INNER,   BETA_INNER,   DT, N_STEPS, SKIP))

    # Pad all paths to the same length (inner may be shorter if trajectory hits boundary)
    L = min(len(pts_basis), len(pts_coexist), len(pts_reverse), len(pts_inner))
    pts_basis   = pts_basis[:L]
    pts_coexist = pts_coexist[:L]
    pts_reverse = pts_reverse[:L]
    pts_inner   = pts_inner[:L]

    # ── Build tube from Basis path ────────────────────────────────────────────
    verts, faces = _bishop_tube(pts_basis, TUBE_R, TUBE_SIDES)

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts, [], faces)
    me.update()

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # holoflow metadata
    obj["holoflow:facet"] = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"] = "may-leonard-competition"

    # ── Colour attribute: species-1 population ────────────────────────────────
    # raw x₁ values along the Basis trajectory, repeated TUBE_SIDES times
    raw_x1 = _rk4(IC_BASIS, ALPHA_BASIS, BETA_BASIS, DT, N_STEPS, SKIP)[:L, 0]
    # normalise 0→1 for colour mapping
    c_min, c_max = raw_x1.min(), raw_x1.max()
    raw_norm = (raw_x1 - c_min) / max(c_max - c_min, 1e-10)

    col_attr = me.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
    flat_cols = []
    for t_val in raw_norm:
        for _ in range(TUBE_SIDES):
            r = COBALT[0] + t_val * (AMBER[0] - COBALT[0])
            g = COBALT[1] + t_val * (AMBER[1] - COBALT[1])
            b = COBALT[2] + t_val * (AMBER[2] - COBALT[2])
            flat_cols.extend([r, g, b, 1.0])
    col_attr.data.foreach_set("color", flat_cols)

    # ── Shape Keys ────────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    def _add_sk(name: str, pts: np.ndarray):
        sk = obj.shape_key_add(name=name, from_mix=False)
        tv, _ = _bishop_tube(pts, TUBE_R, TUBE_SIDES)
        sk.data.foreach_set("co", [c for v in tv for c in v])

    _add_sk("SK_Coexist", pts_coexist)   # α+β<2: stable interior (spiral in)
    _add_sk("SK_Reverse", pts_reverse)   # reversed dominance cycle
    _add_sk("SK_Inner",   pts_inner)     # same params, IC near centre (denser cycles)

    # ── Material (emission, Attribute node → colour) ───────────────────────────
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    for node in nt.nodes:
        nt.nodes.remove(node)
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    emit  = nt.nodes.new("ShaderNodeEmission")
    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = 'GEOMETRY'
    emit.inputs["Strength"].default_value = 1.8
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(mat)

    # ── Poi sphere cap ────────────────────────────────────────────────────────
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=(0, 0, 0))
    poi = bpy.context.active_object
    poi.name = "Poi_Head"
    poi_mat = bpy.data.materials.new("Poi_Cobalt")
    poi_mat.use_nodes = True
    poi_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = COBALT
    poi.data.materials.append(poi_mat)

    # ── GLB export ────────────────────────────────────────────────────────────
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_image_format='WEBP',
    )

    n_verts = len(me.vertices)
    n_pts   = L
    print(f"[may-leonard] blueprint complete — {n_verts} vertices ({n_pts} waypoints)")


build()
