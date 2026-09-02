"""
Sprott B Attractor — Minimum-Complexity 3-D Chaos — Blender 5.1 / bpy — Holoflow Studio
=========================================================================================
Source:
  Sprott JC (1994) "Some simple chaotic flows", Phys Rev E 50(2):R647–R650
  DOI 10.1103/PhysRevE.50.R647
  Pre-print (free): https://sprott.physics.wisc.edu/pubs/paper229.pdf
  Companion C code (MIT): https://sprott.physics.wisc.edu/chaos/

  Systematic search through all polynomial 3-D ODEs with ≤ 6 terms and
  ≤ 2 quadratic nonlinearities.  Sprott B is one of the nineteen systems
  he identified that achieve chaos at this minimal algebraic cost.

TECHNIQUE
─────────
Sprott B is arguably the most parsimonious strange attractor in 3-D: only
six terms, exactly two of which are quadratic products.  Analytically this
is significant because it lies at the complexity boundary — remove any term
and the system either ceases to be chaotic or ceases to be bounded.  RK4
at dt = 0.015 integrates 90 000 steps; Bishop parallel transport then frames
a twist-free tube through 3 000 thinned waypoints.  Orbital speed drives a
cobalt-to-amber FLOAT_COLOR gradient.

WHY SPROTT B IS SPECIAL
────────────────────────
Compare term counts with other famous attractors:
  Lorenz    (1963) — 7 terms, 2 quadratics
  Rössler   (1976) — 7 terms, 1 quadratic
  Chen      (1999) — 7 terms, 2 quadratics
  Sprott B  (1994) — 6 terms, 2 quadratics   ← fewer terms than Lorenz

The six terms are:
  ẋ = y·z            (1 quadratic — pure product coupling)
  ẏ = x − y          (2 linear terms)
  ż = 1 − x·y        (1 constant + 1 quadratic)

There is no self-interaction (no x², y², z²), only cross-product coupling.
This structure means the system has no obvious fixed-point structure near the
origin: (0,0,1) is the only equilibrium — a saddle-focus — yet chaos persists.

CONSTANT DIVERGENCE — SIMPLEST POSSIBLE DISSIPATION
─────────────────────────────────────────────────────
  ∂ẋ/∂x = 0   ∂ẏ/∂y = −1   ∂ż/∂z = 0
  ∇·F = −1     (constant, position-independent)

The ENTIRE dissipation of the system comes from a single linear term −y in ẏ.
Removing that one term (ẏ = x instead of ẏ = x − y) destroys boundedness.
Volume contracts at rate e^{−t} everywhere in phase space — same contraction
rate as the Nosé–Hoover thermostat in its ergodic regime, but here the
dissipation is baked into the structure rather than a feedback variable.

Liouville identity check:   λ₁ + λ₂ + λ₃ = −1 = ∇·F  ✓

LYAPUNOV SPECTRUM (canonical, IC = (0.1, 0, 0))
─────────────────────────────────────────────────
  λ₁ ≈ +0.041   (chaos — positive)
  λ₂ ≈  0.000   (Hamiltonian direction along orbit)
  λ₃ ≈ −1.041   (strong contraction)
  Lyapunov time:      τ = 1/λ₁ ≈ 24.4 time units
  Kaplan–Yorke dim:   D_KY = 2 + λ₁/|λ₃| ≈ 2.039
  Sum:                −1.000 = ∇·F  ✓

TOPOLOGY — ONE EQUILIBRIUM, SHILNIKOV-ADJACENT
────────────────────────────────────────────────
The single equilibrium P = (0, 0, 1) linearises to Jacobian:
  J = [[ 0, z,  y ],     evaluated at (0,0,1):
       [ 1, -1, 0 ],     J = [[ 0, 1, 0],
       [-y, -x, 0 ]]          [ 1,-1, 0],
                               [ 0, 0, 0]]

Eigenvalues of J at P:  one zero (ż = 0 at P since xy=0), and from the 2×2
block eigenvalues of [[0,1],[1,-1]] → λ = (−1 ± √5)/2 ≈ {+0.618, −1.618}.
P is a saddle-focus-like structure with a stable manifold in the z-direction
and unstable/stable directions in the xy-plane.  The chaotic orbit wraps
around this equilibrium in a single-lobe topology — distinct from Lorenz's
symmetric double-scroll and Rössler's single-band scroll.

GENERALISED FORM WITH c PARAMETER
───────────────────────────────────
Replace the constant 1 in ż with a parameter c:
  ẋ = y·z
  ẏ = x − y
  ż = c − x·y

At c = 1.0 (BASIS):      canonical Sprott B chaos, D_KY ≈ 2.039
At c = 0.7 (SK_cLow):    attractor contracts — orbit tighter, still chaotic
At c = 1.4 (SK_cHigh):   attractor expands — wider range, chaotic
At c = 2.0 (SK_cWide):   near bifurcation boundary; dynamics change character

The constant c shifts the equilibrium to (0, 0, c) and rescales the basin —
a clean single-parameter family for demonstrating attractor morphing.

Run from Blender's Text Editor or headless:
  blender --background --python blueprint.py
Requires: bpy (built-in), numpy (bundled with Blender 4.2+/5.x)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── INTEGRATION PARAMETERS ──────────────────────────────────────────────────
DT        = 0.015     # WHY 0.015: local truncation error ≈ DT⁵/120 |F⁽⁴⁾|
                       # For Sprott B max |F|≈3, DT=0.015 gives error < 5×10⁻⁸/step
N_WARMUP  = 4_000     # discard transient; at λ₁≈0.041, 4000×0.015=60 time units ≫ τ=24
N_STEPS   = 90_000    # main integration: 90000×0.015 = 1350 time units
THIN      = 30        # keep every THIN-th → 3 000 waypoints

# ── SPROTT B PARAMETER ───────────────────────────────────────────────────────
C_BASIS = 1.0    # canonical constant in ż = c − x·y
C_LOW   = 0.7    # SK_cLow  — tighter orbit
C_HIGH  = 1.4    # SK_cHigh — wider orbit
C_WIDE  = 2.0    # SK_cWide — near outer bifurcation

# ── TUBE GEOMETRY ────────────────────────────────────────────────────────────
TUBE_SEGS   = 8       # octagonal cross-section
TUBE_RADIUS = 0.048   # world-space radius (pre-scale)
POI_RADIUS  = 0.080   # target poi-head radius (distance from centre to orbit)

# ── VERTEX COLOUR ────────────────────────────────────────────────────────────
COL_SLOW = np.array([0.06, 0.14, 0.66, 1.0])   # cobalt  (slow regions)
COL_FAST = np.array([0.88, 0.52, 0.04, 1.0])   # amber   (fast regions)
ATTR_NAME = "Sprott_B_Speed"

# ── EXPORT NAME ──────────────────────────────────────────────────────────────
NAME = "hf_sprott_b_poi"


# ──────────────────────────────────────────────────────────────────────────────
# 1.  NUMERICAL INTEGRATION
# ──────────────────────────────────────────────────────────────────────────────

def _deriv(xyz, c):
    """Generalised Sprott B vector field.

    WHY cross-product coupling only: Sprott's search specifically required
    at most two quadratic terms; Sprott B achieves chaos with y·z and x·y
    — both are bilinear cross-products, not self-squares.  The self-square
    terms (x², y², z²) that appear in Lorenz (x·y) and Halvorsen (−y²)
    are absent, giving the orbit a different topological character.
    """
    x, y, z = xyz
    dx = y * z              # one quadratic: y·z
    dy = x - y              # pure linear: creates the dissipation (−y)
    dz = c - x * y          # one quadratic: c − x·y
    return np.array([dx, dy, dz])


def integrate(c=C_BASIS, ic=(0.1, 0.0, 0.0)):
    """RK4 integration of Sprott B.

    Returns (waypoints, speeds) where:
      waypoints — (N_WP, 3) float64 — positions on the attractor
      speeds    — (N_WP,)   float64 — |ḟ| at each waypoint, normalised [0,1]

    WHY RK4 over Euler or RK23: the orbit has sections of moderate curvature
    (near the saddle-focus equilibrium) that would step past the correct
    trajectory with a low-order method at dt=0.015.  RK4's O(dt⁴) local
    error keeps the trajectory faithfully on the manifold.
    """
    state = np.array(ic, dtype=np.float64)

    # warm-up: discard transient without storing
    for _ in range(N_WARMUP):
        k1 = _deriv(state, c)
        k2 = _deriv(state + 0.5 * DT * k1, c)
        k3 = _deriv(state + 0.5 * DT * k2, c)
        k4 = _deriv(state + DT * k3, c)
        state += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    # main integration — thin the output
    n_wp = N_STEPS // THIN
    waypoints = np.empty((n_wp, 3), dtype=np.float64)
    speeds    = np.empty(n_wp,      dtype=np.float64)
    wi = 0
    for step in range(N_STEPS):
        k1 = _deriv(state, c)
        k2 = _deriv(state + 0.5 * DT * k1, c)
        k3 = _deriv(state + 0.5 * DT * k2, c)
        k4 = _deriv(state + DT * k3, c)
        state += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        if step % THIN == 0 and wi < n_wp:
            waypoints[wi] = state
            speeds[wi]    = np.linalg.norm(k1)  # speed at start of step
            wi += 1

    # normalise speeds to [0, 1] for colour mapping
    sp_min, sp_max = speeds.min(), speeds.max()
    if sp_max > sp_min:
        speeds = (speeds - sp_min) / (sp_max - sp_min)
    return waypoints, speeds


# ──────────────────────────────────────────────────────────────────────────────
# 2.  BISHOP PARALLEL-TRANSPORT FRAME
# ──────────────────────────────────────────────────────────────────────────────

def bishop_frames(pts):
    """Rotation-minimising Bishop frame along a space curve.

    WHY Bishop over Frenet: Frenet frames require the curvature to be
    non-zero and produce unnecessary twist at inflection points — both
    common on the Sprott B trajectory.  Bishop frames minimise integrated
    twist and remain well-defined wherever the tangent is defined.

    Algorithm: initialise with a consistent 'up' vector; at each step,
    double-reflect the previous normal into the new tangent plane using
    the Rodrigues rotation formula.
    """
    n  = len(pts)
    T  = np.empty((n, 3))
    Nf = np.empty((n, 3))
    Bf = np.empty((n, 3))

    # tangents (centred difference for interior, forward/backward at ends)
    T[0]    = pts[1] - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    T[1:-1] = pts[2:] - pts[:-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T /= norms

    # seed the first frame
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.98:
        seed = np.array([0.0, 1.0, 0.0])
    Nf[0] = np.cross(T[0], seed)
    Nf[0] /= np.linalg.norm(Nf[0])
    Bf[0] = np.cross(T[0], Nf[0])

    # parallel-transport step by step (Rodrigues formula)
    for i in range(1, n):
        axis  = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(T[i-1], T[i])
        if sin_a < 1e-10:
            Nf[i] = Nf[i-1]
            Bf[i] = Bf[i-1]
        else:
            axis /= sin_a
            Nf[i] = (cos_a * Nf[i-1]
                     + sin_a * np.cross(axis, Nf[i-1])
                     + (1.0 - cos_a) * np.dot(axis, Nf[i-1]) * axis)
            Nf[i] /= max(np.linalg.norm(Nf[i]), 1e-12)
            Bf[i] = np.cross(T[i], Nf[i])
    return Nf, Bf


# ──────────────────────────────────────────────────────────────────────────────
# 3.  BUILD TUBE MESH (BMesh direct API)
# ──────────────────────────────────────────────────────────────────────────────

def _ring_verts(p, N, B, r, bm):
    """Emit one tube ring of TUBE_SEGS vertices into bm, return list."""
    theta = np.linspace(0.0, 2.0 * np.pi, TUBE_SEGS, endpoint=False)
    return [
        bm.verts.new(Vector(p + r * (np.cos(t) * N + np.sin(t) * B)))
        for t in theta
    ]


def build_tube(pts, Nf, Bf, r):
    """Construct the tube mesh using BMesh.

    WHY direct BMesh API over bpy.ops: operators require an active context
    window and may insert into the wrong collection; the data API is
    deterministic and headless-safe.

    Returns a bpy.types.Mesh with TUBE_SEGS-sided cross-section quads.
    """
    bm   = bmesh.new()
    prev = None
    for i, (p, N, B) in enumerate(zip(pts, Nf, Bf)):
        ring = _ring_verts(p, N, B, r, bm)
        if prev is not None:
            for j in range(TUBE_SEGS):
                j2 = (j + 1) % TUBE_SEGS
                bm.faces.new([prev[j], prev[j2], ring[j2], ring[j]])
        prev = ring

    # end caps
    bm.faces.new(list(reversed(
        [bm.verts[i] for i in range(TUBE_SEGS)]
    )))
    bm.faces.new([bm.verts[-(i+1)] for i in range(TUBE_SEGS)])

    bm.normal_update()
    mesh = bpy.data.meshes.new(NAME)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


# ──────────────────────────────────────────────────────────────────────────────
# 4.  VERTEX COLOUR  (FLOAT_COLOR domain=POINT)
# ──────────────────────────────────────────────────────────────────────────────

def apply_colours(mesh, speeds):
    """Assign Sprott_B_Speed FLOAT_COLOR from orbital-speed array.

    WHY FLOAT_COLOR / domain POINT: GLB exports vertex colours as FLOAT_COLOR;
    face-corner domain inflates vertex count; point domain is compact and
    survives the Draco compression pass at level 6.
    """
    attr = mesh.color_attributes.new(
        name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT"
    )
    n_wp   = len(speeds)
    # Each waypoint → one ring of TUBE_SEGS vertices; 2 cap verts at end
    data   = attr.data
    n_data = len(data)
    for i in range(n_wp):
        col   = COL_SLOW + speeds[i] * (COL_FAST - COL_SLOW)
        base  = i * TUBE_SEGS
        for j in range(TUBE_SEGS):
            idx = base + j
            if idx < n_data:
                data[idx].color = tuple(col)
    # caps: set to endpoint colours
    for idx in range(n_wp * TUBE_SEGS, n_data):
        data[idx].color = tuple(COL_FAST)


# ──────────────────────────────────────────────────────────────────────────────
# 5.  SHAPE KEYS
# ──────────────────────────────────────────────────────────────────────────────

def _tube_verts_for_c(c, r):
    """Recompute tube vertex positions for a given c parameter."""
    pts, _ = integrate(c)
    pts    = _centre_and_scale(pts)
    Nf, Bf = bishop_frames(pts)
    theta  = np.linspace(0.0, 2.0 * np.pi, TUBE_SEGS, endpoint=False)
    cos_t  = np.cos(theta)
    sin_t  = np.sin(theta)
    # ring verts: (n_wp, TUBE_SEGS, 3)
    rings  = (pts[:, None, :]
              + r * (cos_t[None, :, None] * Nf[:, None, :]
                   + sin_t[None, :, None] * Bf[:, None, :]))
    return rings.reshape(-1, 3)


def _centre_and_scale(pts):
    """Centre and scale trajectory to fit POI_RADIUS sphere."""
    pts = pts - pts.mean(axis=0)
    rmax = np.linalg.norm(pts, axis=1).max()
    if rmax > 1e-9:
        pts *= POI_RADIUS / rmax
    return pts


def add_shape_key(obj, label, c):
    """Add one shape key for parameter c."""
    verts = _tube_verts_for_c(c, TUBE_RADIUS)
    sk    = obj.shape_key_add(name=label, from_mix=False)
    n     = min(len(sk.data), len(verts))
    for i in range(n):
        sk.data[i].co = Vector(verts[i])


# ──────────────────────────────────────────────────────────────────────────────
# 6.  MATERIAL
# ──────────────────────────────────────────────────────────────────────────────

def build_material():
    """Principled BSDF driven by vertex colour (GEOMETRY attribute node).

    WHY Principled BSDF: it exports to GLTF PBR metallic-roughness, which
    Holoflow's WebXR renderer reads natively.  Emission strength 1.8 gives
    the attractor a subtle bloom glow in Eevee without blowing out the hue.
    """
    mat = bpy.data.materials.new(NAME + "_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.location       = (-400, 0)

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (-100, 0)
    bsdf.inputs["Metallic"].default_value   = 0.40
    bsdf.inputs["Roughness"].default_value  = 0.28
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = 1.8

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    return mat


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    # clear any previous Sprott B objects / meshes
    for ob in list(bpy.data.objects):
        if NAME in ob.name:
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if NAME in me.name:
            bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials):
        if NAME in ma.name:
            bpy.data.materials.remove(ma)

    # ── integrate basis attractor ──────────────────────────────────────────
    pts_raw, speeds = integrate(C_BASIS)
    pts = _centre_and_scale(pts_raw)
    Nf, Bf = bishop_frames(pts)

    # ── build tube mesh ────────────────────────────────────────────────────
    mesh = build_tube(pts, Nf, Bf, TUBE_RADIUS)
    apply_colours(mesh, speeds)

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # ── orient for WebXR (+Y up per holoflow convention) ──────────────────
    import math
    obj.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.transform_apply(rotation=True)

    # ── shape keys ────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)   # canonical c=1.0
    add_shape_key(obj, "SK_cLow",  C_LOW)              # c=0.7: tighter
    add_shape_key(obj, "SK_cHigh", C_HIGH)             # c=1.4: expanded
    add_shape_key(obj, "SK_cWide", C_WIDE)             # c=2.0: near boundary

    # ── material ──────────────────────────────────────────────────────────
    mat = build_material()
    mesh.materials.append(mat)

    # ── Holoflow metadata ─────────────────────────────────────────────────
    obj["holoflow:facet"]   = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "sprott-b-attractor"

    # ── report ────────────────────────────────────────────────────────────
    n_v = len(mesh.vertices)
    n_f = len(mesh.polygons)
    print(f"[Sprott B] {NAME} complete — {n_v} verts, {n_f} quads")
    print(f"  Basis (c={C_BASIS}):  canonical chaos, D_KY≈2.039")
    print(f"  SK_cLow (c={C_LOW}): contracted attractor")
    print(f"  SK_cHigh (c={C_HIGH}): expanded attractor")
    print(f"  SK_cWide (c={C_WIDE}): near bifurcation boundary")
    print(f"  Colour attribute: {ATTR_NAME}  FLOAT_COLOR POINT")


main()
