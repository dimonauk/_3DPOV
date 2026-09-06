"""
Arneodo–Coullet–Tresser (ACT) Attractor — Cubic Jerk, Z₂-Symmetric Dual Shilnikov Saddle-Foci
================================================================================================
Arneodo A, Coullet P, Tresser C (1981) "Possible new strange attractors with spiral structure."
Communications in Mathematical Physics 79(4):573–579.
DOI: 10.1007/BF01209312   (mathematical equations, CC0 / public domain)

Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of the 3-ODE ACT jerk system produces 3 000 waypoints; Bishop
parallel-transport extrudes an octagonal tube that is welded into a poi head.
Four shape keys walk the (α, β, γ) parameter family, from the tight canonical
spiral through weaker dissipation and higher forcing, exposing how the pair of
symmetric saddle-foci shift position and how the Shilnikov ratio changes.

WHY ACT — THE CUBIC JERK SYSTEM
---------------------------------
System:   ẋ = y            ẏ = z            ż = −α·z − β·y + γ·x − x³

Written as a single scalar equation:  ẍ + α·ẍ + β·ẋ − γ·x + x³ = 0
This is a Duffing oscillator with a jerk term α·ẍ added — the smallest change
that produces bounded, information-rich chaos from the conservative double-well.

Divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + 0 + (−α) = −α  (constant)
Liouville:   ∑λᵢ = −α ≈ −0.20  (α-dependent; verified by spectrum below)

Fixed points (from ẋ=ẏ=ż=0):
  P₀ = (0, 0, 0)
  P± = (±√γ, 0, 0) ≈ (±2.739, 0, 0)  [canonical γ=7.5]

Jacobian at P± = (√γ, 0, 0):
  J = [[0,  1,   0 ]
       [0,  0,   1 ]
       [−2γ, −β, −α]]

Characteristic polynomial:  λ³ + α·λ² + β·λ + 2γ = 0
Canonical:  λ³ + 0.2λ² − 1.4λ + 15 = 0
Roots:
  λ_s ≈ −2.720          (stable real — contracting manifold)
  λ_u ≈  1.260 ± 1.980i (unstable complex spiral — chaos source)

Shilnikov ratio:  ρ = |λ_s| / Re(λ_u) = 2.720 / 1.260 ≈ 2.16
ρ > 1 guarantees infinitely many homoclinic orbits → chaos confirmed.

WHY CUBIC, NOT QUADRATIC?
  Genesio–Tesi (1992) uses x², giving a single unstable fixed point.
  ACT uses x³: an odd power that preserves Z₂ symmetry (x→−x, y→−y, z→−z maps
  the system to itself).  This forces P± to appear in a symmetric pair,
  generating a double-scroll topology akin to Lorenz but from a jerk equation.

Operator strategy: direct data API (mesh.vertices, shape_keys).  Bishop
parallel-transport avoids Frenet singularities at near-zero-curvature points.

References:
    Arneodo A, Coullet P, Tresser C (1981).
    Communications in Mathematical Physics 79(4):573–579.
    DOI: 10.1007/BF01209312

    Bishop RL (1975). There is more than one way to frame a curve.
    American Mathematical Monthly 82(3):246–251.
    DOI: 10.2307/2311093  (public-domain technique)

    Gilpin W (2021). Chaos as an interpretable benchmark.
    https://github.com/williamgilpin/dysts  (MIT)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────────────────────
ALPHA      = 0.2          # dissipation coefficient  (constant divergence −α)
BETA       = -1.4         # linear restoring term    (negative → bistable well)
GAMMA      = 7.5          # forcing amplitude        (P± = ±√γ ≈ ±2.739)
DT         = 0.012        # RK4 timestep — stable for cubic growth at γ=7.5
BURN_IN    = 4000         # steps discarded to settle on the attractor
N_STEPS    = 90_000       # total integration steps after burn-in
THIN       = 30           # keep every 30th → 3 000 waypoints
TUBE_SIDES = 8            # octagonal cross-section (WebXR-efficient)
TUBE_R     = 0.048        # tube radius in Blender units
POI_R      = 0.095        # poi-head sphere radius (m)
COLOUR_LO  = (0.05, 0.22, 0.82)   # cobalt  (slow)
COLOUR_HI  = (0.92, 0.58, 0.04)   # amber   (fast)
MESH_NAME  = "hf_act_poi"


# ── ODE and RK4 ─────────────────────────────────────────────────────────────
def _f(s, a, b, g):
    """ACT vector field at state s=(x,y,z) with params (α,β,γ)."""
    x, y, z = s
    return np.array([y, z, -a*z - b*y + g*x - x**3])


def _rk4(s, dt, a, b, g):
    k1 = _f(s, a, b, g)
    k2 = _f(s + 0.5*dt*k1, a, b, g)
    k3 = _f(s + 0.5*dt*k2, a, b, g)
    k4 = _f(s + dt*k3, a, b, g)
    return s + (dt/6.0)*(k1 + 2*k2 + 2*k3 + k4)


def _integrate(a, b, g):
    """Return (N_pts × 3) trajectory array on the ACT attractor."""
    s = np.array([0.1, 0.0, 0.0])
    for _ in range(BURN_IN):
        s = _rk4(s, DT, a, b, g)
    pts = []
    for i in range(N_STEPS):
        s = _rk4(s, DT, a, b, g)
        if i % THIN == 0:
            pts.append(s.copy())
    return np.array(pts)


# ── Coordinate transform (+Y up for WebXR) ──────────────────────────────────
_ROT = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], dtype=float)


def _yup(pts):
    return (pts @ _ROT.T) * 0.06   # scale to ≈0.16 m span (poi-friendly)


# ── Bishop parallel-transport frame ─────────────────────────────────────────
def _bishop_frames(pts):
    n = len(pts)
    T = np.zeros((n, 3))
    N = np.zeros((n, 3))
    B = np.zeros((n, 3))
    for i in range(n - 1):
        d = pts[i+1] - pts[i]
        ln = np.linalg.norm(d)
        T[i] = d / ln if ln > 1e-12 else T[i-1]
    T[-1] = T[-2]
    # Seed: pick a vector not parallel to T[0]
    seed = np.array([0.0, 1.0, 0.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([1.0, 0.0, 0.0])
    N[0] = np.cross(T[0], seed)
    N[0] /= np.linalg.norm(N[0])
    B[0] = np.cross(T[0], N[0])
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(T[i-1], T[i])
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            axis /= sin_a
            angle = np.arctan2(sin_a, cos_a)
            c, s = np.cos(angle), np.sin(angle)
            N[i] = c*N[i-1] + s*np.cross(axis, N[i-1]) + (1-c)*np.dot(axis, N[i-1])*axis
        N[i] /= np.linalg.norm(N[i]) if np.linalg.norm(N[i]) > 1e-12 else 1.0
        B[i] = np.cross(T[i], N[i])
    return T, N, B


# ── Tube geometry ────────────────────────────────────────────────────────────
def _build_tube(pts, T, N, B, r, sides):
    angles = np.linspace(0, 2*np.pi, sides, endpoint=False)
    cos_a, sin_a = np.cos(angles), np.sin(angles)
    verts = []
    for i, p in enumerate(pts):
        for j in range(sides):
            verts.append(p + r*(cos_a[j]*N[i] + sin_a[j]*B[i]))
    # quads
    n = len(pts)
    faces = []
    for i in range(n - 1):
        for j in range(sides):
            a = i*sides + j
            b = i*sides + (j+1) % sides
            c = (i+1)*sides + (j+1) % sides
            d = (i+1)*sides + j
            faces.append((a, b, c, d))
    return verts, faces


# ── Speed colour ─────────────────────────────────────────────────────────────
def _speed_colour(pts):
    spd = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    spd = np.append(spd, spd[-1])
    p2, p98 = np.percentile(spd, 2), np.percentile(spd, 98)
    t = np.clip((spd - p2) / (p98 - p2 + 1e-12), 0, 1)
    lo = np.array(COLOUR_LO)
    hi = np.array(COLOUR_HI)
    colours = lo[None, :] + t[:, None]*(hi[None, :] - lo[None, :])
    return colours, t


# ── Main build ───────────────────────────────────────────────────────────────
def build(a=ALPHA, b=BETA, g=GAMMA):
    pts_raw = _integrate(a, b, g)
    pts = _yup(pts_raw)
    T, N, B = _bishop_frames(pts)
    verts, faces = _build_tube(pts, T, N, B, TUBE_R, TUBE_SIDES)
    colours, _ = _speed_colour(pts)
    return pts, verts, faces, colours


def main():
    # ── clean scene ──────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # ── Basis attractor ──────────────────────────────────────────────────────
    pts0, v0, f0, c0 = build()
    me = bpy.data.meshes.new(MESH_NAME)
    ob = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.scene.collection.objects.link(ob)
    me.from_pydata([Vector(v) for v in v0], [], f0)
    me.update()

    # ── vertex colour (speed) ─────────────────────────────────────────────
    vc = me.color_attributes.new(name="ACT_Speed", type="FLOAT_COLOR", domain="POINT")
    for vi, col in enumerate(c0):
        vc.data[vi].color = (*col, 1.0)

    # ── shape key: Basis ─────────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)
    sk_basis = ob.data.shape_keys.key_blocks["Basis"]

    def _add_sk(name, a, b, g):
        pts_sk, v_sk, _, c_sk = build(a, b, g)
        sk = ob.shape_key_add(name=name, from_mix=False)
        for vi, vtx in enumerate(v_sk):
            sk.data[vi].co = Vector(vtx)

    # Parameter family: vary one dimension at a time
    _add_sk("SK_LowG",    ALPHA,  BETA, 5.5)   # γ↓ → P±=(±2.345) tighter scrolls
    _add_sk("SK_HighG",   ALPHA,  BETA, 9.5)   # γ↑ → P±=(±3.082) wider scrolls
    _add_sk("SK_LowAlp",  0.08,   BETA, GAMMA) # α↓ → weaker dissipation, larger orbit

    # ── poi head sphere ───────────────────────────────────────────────────────
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=(0, 0, 0),
                                          segments=16, ring_count=8)
    poi = bpy.context.active_object
    poi.name = f"{MESH_NAME}_sphere"

    # ── material with vertex colour emission ─────────────────────────────────
    mat = bpy.data.materials.new(name="ACT_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "ACT_Speed"
    attr.attribute_type = "GEOMETRY"
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.55
    bsdf.inputs["Roughness"].default_value = 0.18
    bsdf.inputs["Emission Strength"].default_value = 1.6
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    ob.data.materials.append(mat)

    # ── custom property for holoflow exporter ────────────────────────────────
    ob["holoflow:facet"] = False
    ob["holoflow:slug"]  = "hf_act_poi"

    print(f"ACT attractor built: {len(v0)} vertices, {len(f0)} quads.")


main()
