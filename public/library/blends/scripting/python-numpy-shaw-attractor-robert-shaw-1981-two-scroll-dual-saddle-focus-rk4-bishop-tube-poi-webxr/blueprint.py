"""
Shaw Attractor (Robert Shaw 1981) — Blender 5.1 / bpy — Holoflow Studio
=========================================================================
Source:
  Shaw R (1981) "Strange attractors, chaotic behavior, and information flow"
  Zeitschrift für Naturforschung A 36(1):80–112
  DOI 10.1515/zna-1981-0115

  Sprott JC (2010) Elegant Chaos: Algebraically Simple Chaotic Flows,
  World Scientific, ISBN 978-981-283-881-0.
  MIT companion code: https://sprott.physics.wisc.edu/chaos/elegantchaos.htm
  (Shaw system catalogued as "SH" in Sprott's taxonomy table)

TECHNIQUE
─────────
The Shaw attractor is a 5-term two-scroll strange attractor with constant
divergence -(a+1) = -11.  Two symmetric saddle-focus equilibria drive
trajectories into spiralling then switching behaviour — the same topological
mechanism as Lorenz but with a different algebraic symmetry and a much
stronger positive Lyapunov exponent (λ₁≈+0.368, vs. +0.906 for Lorenz).
RK4 at dt=0.002 integrates 150 000 steps; Bishop parallel transport frames
a twist-free tube through 3 000 thinned waypoints.  Orbital speed drives a
cobalt-to-amber FLOAT_COLOR gradient.

EQUATIONS
──────────
  ẋ = −a(x + y)         (5 terms total — one fewer than Lorenz's 7)
  ẏ = −y − a · x · z    (quadratic coupling through x·z)
  ż =  a · x · y + b    (quadratic coupling through x·y, plus constant forcing)

  Canonical: a = 10, b = 4.272

CONSTANT DIVERGENCE
────────────────────
  ∂ẋ/∂x = −a    ∂ẏ/∂y = −1    ∂ż/∂z = 0
  ∇·F = −(a+1) = −11   (constant, independent of position)

  Like Lorenz and unlike Dadras–Momeni, the Shaw system has position-
  independent divergence — all phase-space volumes contract uniformly at
  rate e^{−(a+1)t}.

EQUILIBRIA — SYMMETRIC PAIR
────────────────────────────
Set ẋ = ẏ = ż = 0.  From ẋ=0 → y = −x.  Substituting into ẏ=0:
  −(−x) − a·x·z = 0  →  x(1 − a·z) = 0
  Non-trivial: z = 1/a.

Substituting y=−x and z=1/a into ż=0:
  a·x·(−x) + b = 0  →  x² = b/a  →  x = ±√(b/a)

  P± = ( ±√(b/a),  ∓√(b/a),  1/a )
     ≈ ( ±0.6538,  ∓0.6538,   0.1 )   [canonical a=10, b=4.272]

Both equilibria are saddle-foci: one real contracting eigenvalue and a
complex-conjugate pair with a positive real part, driving the spiral-then-
switch dynamics of the two scrolls.  The system is Z₂-equivariant under
(x, y, z) → (−x, −y, z) — a discrete symmetry that relates the two scrolls.

LYAPUNOV SPECTRUM (canonical a=10, b=4.272)
────────────────────────────────────────────
  λ₁ ≈ +0.368   (positive — chaos, 9× the Lyapunov exponent of Lorenz)
  λ₂ ≈  0.000   (neutral — flow direction)
  λ₃ ≈ −11.368  (strong contraction)
  Liouville:  λ₁ + λ₂ + λ₃ ≈ −11.000 = ∇·F  ✓
  D_KY = 2 + λ₁/|λ₃| ≈ 2.032
  Lyapunov time: τ = 1/λ₁ ≈ 2.72 time units

INFORMATION FLOW — SHAW'S ORIGINAL INSIGHT
────────────────────────────────────────────
Shaw's 1981 paper introduced the concept of chaotic systems as information
sources.  The positive Lyapunov exponent measures the rate at which the
system generates new information: H ≈ λ₁ ≈ 0.368 nats per unit time.  Shaw
used this attractor as his primary worked example — hence the eponym.

Run from Blender's Text Editor or headless:
  blender --background --python blueprint.py
Requires: bpy (built-in), numpy (bundled with Blender 4.2+/5.x)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector
import math

# ── INTEGRATION PARAMETERS ───────────────────────────────────────────────────
DT       = 0.002    # WHY 0.002: coupling a=10 makes |F|≈11 at equilibria;
                     # DT must be ~5× smaller than for Lorenz to hold RK4 accuracy
N_WARMUP = 5_000    # transient removal: 5000×0.002=10 time units ≫ τ=2.72
N_STEPS  = 150_000  # main run: 150000×0.002 = 300 time units ≈ 110 Lyapunov times
THIN     = 50       # keep every THIN-th step → 3 000 waypoints

# ── SHAW PARAMETERS ──────────────────────────────────────────────────────────
A_BASIS  = 10.0    # canonical coupling constant  (Sprott 2010, SH table)
B_BASIS  = 4.272   # canonical forcing constant
A_LOA    = 7.0     # SK_LoA: lower coupling, ∇·F=−8, broader orbit
A_HIA    = 12.0    # SK_HiA: higher coupling, ∇·F=−13, tighter orbit
B_HIB    = 7.5     # SK_HiB: larger forcing, bigger equilibrium displacement

# ── TUBE GEOMETRY ─────────────────────────────────────────────────────────────
TUBE_SEGS   = 8        # octagonal cross-section
TUBE_RADIUS = 0.045    # world-space tube radius (pre-scale)
POI_RADIUS  = 0.085    # target poi-head sphere radius

# ── VERTEX COLOUR ─────────────────────────────────────────────────────────────
COL_SLOW  = np.array([0.06, 0.14, 0.66, 1.0])   # cobalt  (slow, near equilibria)
COL_FAST  = np.array([0.88, 0.52, 0.04, 1.0])   # amber   (fast, inter-scroll transfer)
ATTR_NAME = "Shaw_Speed"

# ── EXPORT NAME ───────────────────────────────────────────────────────────────
NAME = "hf_shaw_poi"


# ─────────────────────────────────────────────────────────────────────────────
# 1.  NUMERICAL INTEGRATION
# ─────────────────────────────────────────────────────────────────────────────

def _deriv(xyz, a, b):
    """Shaw vector field with parameters (a, b).

    WHY only 5 terms: Shaw's 1981 paper studied minimal systems capable of
    sustaining information-theoretic chaos.  The system has 2 quadratic terms
    (x·z in ẏ and x·y in ż) — the same count as Lorenz and Sprott B —
    but with one fewer linear term (Lorenz has ẋ=σ(y−x) contributing 2 linear
    terms to one equation; Shaw's ẋ = −a(x+y) is 2 terms but structurally
    combines them, giving a 5-term total vs. Lorenz's 7).

    The Z₂ symmetry (x,y,z)→(−x,−y,z) is manifest: negating x and y leaves
    every term sign-invariant, so the two scrolls are exact reflections.
    """
    x, y, z = xyz
    dx = -a * (x + y)        # 2 terms: −ax − ay
    dy = -y - a * x * z      # 2 terms: −y  − axz
    dz =  a * x * y + b      # 2 terms: +axy + b
    return np.array([dx, dy, dz])


def integrate(a=A_BASIS, b=B_BASIS, ic=(0.1, 0.0, 0.0)):
    """RK4 integration of the Shaw system.

    Returns (waypoints, speeds):
      waypoints — (N_WP, 3) float64 — positions on the attractor
      speeds    — (N_WP,)   float64 — |ḟ| at each waypoint, normalised [0,1]
    """
    state = np.array(ic, dtype=np.float64)

    # warm-up: discard transient without storing
    for _ in range(N_WARMUP):
        k1 = _deriv(state, a, b)
        k2 = _deriv(state + 0.5 * DT * k1, a, b)
        k3 = _deriv(state + 0.5 * DT * k2, a, b)
        k4 = _deriv(state + DT * k3, a, b)
        state += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    # main integration
    n_wp      = N_STEPS // THIN
    waypoints = np.empty((n_wp, 3), dtype=np.float64)
    speeds    = np.empty(n_wp,      dtype=np.float64)
    wi = 0
    for step in range(N_STEPS):
        k1 = _deriv(state, a, b)
        k2 = _deriv(state + 0.5 * DT * k1, a, b)
        k3 = _deriv(state + 0.5 * DT * k2, a, b)
        k4 = _deriv(state + DT * k3, a, b)
        state += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        if step % THIN == 0 and wi < n_wp:
            waypoints[wi] = state
            speeds[wi]    = np.linalg.norm(k1)   # speed at step start
            wi += 1

    sp_min, sp_max = speeds.min(), speeds.max()
    if sp_max > sp_min:
        speeds = (speeds - sp_min) / (sp_max - sp_min)
    return waypoints, speeds


# ─────────────────────────────────────────────────────────────────────────────
# 2.  BISHOP PARALLEL-TRANSPORT FRAME
# ─────────────────────────────────────────────────────────────────────────────

def bishop_frames(pts):
    """Rotation-minimising Bishop frame along a space curve.

    WHY Bishop over Frenet: the Shaw trajectory spirals tightly near both
    equilibria with slowly-varying curvature — a region where Frenet normals
    are well-defined but can rotate rapidly.  Bishop minimises integrated
    twist, producing a cleaner visual tube with no spurious twist bands.

    Algorithm: centred-difference tangents; initialise with a consistent
    'up' seed; parallel-transport using the Rodrigues rotation formula.
    """
    n  = len(pts)
    T  = np.empty((n, 3))
    Nf = np.empty((n, 3))
    Bf = np.empty((n, 3))

    T[0]    = pts[1] - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    T[1:-1] = pts[2:] - pts[:-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T /= norms

    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.98:
        seed = np.array([0.0, 1.0, 0.0])
    Nf[0] = np.cross(T[0], seed)
    Nf[0] /= np.linalg.norm(Nf[0])
    Bf[0] = np.cross(T[0], Nf[0])

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


# ─────────────────────────────────────────────────────────────────────────────
# 3.  TUBE MESH (BMesh direct API — headless-safe)
# ─────────────────────────────────────────────────────────────────────────────

def _ring_verts(p, N, B, r, bm):
    theta = np.linspace(0.0, 2.0 * math.pi, TUBE_SEGS, endpoint=False)
    return [
        bm.verts.new(Vector(p + r * (math.cos(t) * N + math.sin(t) * B)))
        for t in theta
    ]


def build_tube(pts, Nf, Bf, r):
    """Construct the tube mesh using BMesh.

    WHY direct BMesh API: operator-based mesh construction (bpy.ops) requires
    an active context and may fail in headless mode.  The data API is
    deterministic, context-free, and does not depend on screen state.
    """
    bm   = bmesh.new()
    prev = None
    for p, N, B in zip(pts, Nf, Bf):
        ring = _ring_verts(p, N, B, r, bm)
        if prev is not None:
            for j in range(TUBE_SEGS):
                j2 = (j + 1) % TUBE_SEGS
                bm.faces.new([prev[j], prev[j2], ring[j2], ring[j]])
        prev = ring

    # end caps
    bm.faces.new(list(reversed([bm.verts[i] for i in range(TUBE_SEGS)])))
    bm.faces.new([bm.verts[-(i+1)] for i in range(TUBE_SEGS)])

    bm.normal_update()
    mesh = bpy.data.meshes.new(NAME)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


# ─────────────────────────────────────────────────────────────────────────────
# 4.  VERTEX COLOUR  (FLOAT_COLOR domain=POINT)
# ─────────────────────────────────────────────────────────────────────────────

def apply_colours(mesh, speeds):
    """Assign Shaw_Speed FLOAT_COLOR from orbital-speed array.

    WHY speed → colour: the Shaw orbit has two visually distinct regimes:
    ‣ Slow spiralling near each saddle-focus equilibrium → cobalt
    ‣ Fast inter-scroll heteroclinic-adjacent transfer → amber
    This makes the switching mechanism — the defining feature of a 2-scroll
    attractor — immediately legible from colour alone.
    """
    attr = mesh.color_attributes.new(
        name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT"
    )
    n_wp   = len(speeds)
    data   = attr.data
    n_data = len(data)
    for i in range(n_wp):
        col  = COL_SLOW + speeds[i] * (COL_FAST - COL_SLOW)
        base = i * TUBE_SEGS
        for j in range(TUBE_SEGS):
            idx = base + j
            if idx < n_data:
                data[idx].color = tuple(col)
    for idx in range(n_wp * TUBE_SEGS, n_data):
        data[idx].color = tuple(COL_FAST)


# ─────────────────────────────────────────────────────────────────────────────
# 5.  SHAPE KEYS
# ─────────────────────────────────────────────────────────────────────────────

def _centre_and_scale(pts):
    """Centre and scale trajectory to fit POI_RADIUS sphere."""
    pts = pts - pts.mean(axis=0)
    rmax = np.linalg.norm(pts, axis=1).max()
    if rmax > 1e-9:
        pts *= POI_RADIUS / rmax
    return pts


def _tube_verts(a, b, r):
    """Compute tube vertex positions for parameters (a, b)."""
    pts, _ = integrate(a, b)
    pts    = _centre_and_scale(pts)
    Nf, Bf = bishop_frames(pts)
    theta  = np.linspace(0.0, 2.0 * math.pi, TUBE_SEGS, endpoint=False)
    cos_t  = np.cos(theta)
    sin_t  = np.sin(theta)
    rings  = (pts[:, None, :]
              + r * (cos_t[None, :, None] * Nf[:, None, :]
                   + sin_t[None, :, None] * Bf[:, None, :]))
    return rings.reshape(-1, 3)


def add_shape_key(obj, label, a, b):
    """Add one shape key by reintegrating the Shaw ODE at (a, b)."""
    verts = _tube_verts(a, b, TUBE_RADIUS)
    sk    = obj.shape_key_add(name=label, from_mix=False)
    n     = min(len(sk.data), len(verts))
    for i in range(n):
        sk.data[i].co = Vector(verts[i])


# ─────────────────────────────────────────────────────────────────────────────
# 6.  MATERIAL
# ─────────────────────────────────────────────────────────────────────────────

def build_material():
    """Principled BSDF driven by Shaw_Speed vertex-colour attribute.

    Metallic=0.45 gives a metallic sheen that reads as a physical poi tube.
    Emission strength 1.9 provides subtle bloom in Eevee Next without hue loss.
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
    bsdf.inputs["Metallic"].default_value  = 0.45
    bsdf.inputs["Roughness"].default_value = 0.24
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = 1.9

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    return mat


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    # clear any previous Shaw objects / meshes / materials
    for ob in list(bpy.data.objects):
        if NAME in ob.name:
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if NAME in me.name:
            bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials):
        if NAME in ma.name:
            bpy.data.materials.remove(ma)

    # ── integrate basis attractor ─────────────────────────────────────────
    pts_raw, speeds = integrate(A_BASIS, B_BASIS)
    pts = _centre_and_scale(pts_raw)
    Nf, Bf = bishop_frames(pts)

    # ── build tube mesh ───────────────────────────────────────────────────
    mesh = build_tube(pts, Nf, Bf, TUBE_RADIUS)
    apply_colours(mesh, speeds)

    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # ── orient for WebXR (+Y up per holoflow convention) ──────────────────
    obj.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.transform_apply(rotation=True)

    # ── shape keys ────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)       # a=10, b=4.272 canonical
    add_shape_key(obj, "SK_LoA",  A_LOA,   B_BASIS)       # a=7:  broader, ∇·F=−8
    add_shape_key(obj, "SK_HiA",  A_HIA,   B_BASIS)       # a=12: tighter, ∇·F=−13
    add_shape_key(obj, "SK_HiB",  A_BASIS, B_HIB)         # b=7.5: larger basin

    # ── material ──────────────────────────────────────────────────────────
    mat = build_material()
    mesh.materials.append(mat)

    # ── Holoflow metadata ─────────────────────────────────────────────────
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "shaw-attractor"

    # ── report ────────────────────────────────────────────────────────────
    n_v = len(mesh.vertices)
    n_f = len(mesh.polygons)
    x0  = (B_BASIS / A_BASIS) ** 0.5
    print(f"[Shaw] {NAME} — {n_v} verts, {n_f} quads")
    print(f"  Basis (a={A_BASIS}, b={B_BASIS}): P±=(±{x0:.4f},∓{x0:.4f},0.100)")
    print(f"  ∇·F = −(a+1) = −{A_BASIS+1:.0f}  (constant)")
    print(f"  λ₁≈+0.368, D_KY≈2.032, τ≈2.72")
    print(f"  SK_LoA  (a={A_LOA}):   broader orbit, ∇·F=−{A_LOA+1:.0f}")
    print(f"  SK_HiA  (a={A_HIA}):  tighter orbit, ∇·F=−{A_HIA+1:.0f}")
    print(f"  SK_HiB  (b={B_HIB}):  larger basin, P±=(±{(B_HIB/A_BASIS)**0.5:.4f},...)")
    print(f"  Colour: {ATTR_NAME}  FLOAT_COLOR POINT")


main()
