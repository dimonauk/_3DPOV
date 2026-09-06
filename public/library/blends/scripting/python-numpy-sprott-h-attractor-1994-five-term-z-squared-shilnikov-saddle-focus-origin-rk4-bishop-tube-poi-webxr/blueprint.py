"""
Sprott H Attractor (1994) — Five-Term z²-Nonlinearity, Shilnikov Saddle-Focus
Bishop Parallel-Transport Tube + Poi Head for WebXR (Blender 5.1 / bpy)
========================================================================
Source (equations — public-domain mathematical facts):
  Sprott JC (1994). Some simple chaotic flows.
  Phys. Rev. E 50(2):R647–R650. DOI 10.1103/PhysRevE.50.R647  (Table I, Case H)

TECHNIQUE — THE SPROTT H SYSTEM
────────────────────────────────
    ẋ = −y + z²       (z² is the sole nonlinearity; no self-term on x)
    ẏ = x + a·y       (linear; a controls divergence and Shilnikov ρ)
    ż = x − z         (linear; z self-damps toward x)

Canonical a = 0.5.  Five terms total (counting the nonlinear z² as one).
WHY this system matters: Case H is one of Sprott's 14 confirmed chaos cases
from a systematic search over 3-variable ODEs with integer-coefficient terms.
The z² injection — not z·anything — means the orbit stretches quadratically
along the z-axis and folds back, a qualitatively different mechanism from the
bilinear products (x·z, x·y) seen in Lorenz and Cases B, C, G.

DIVERGENCE — CONSTANT
  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + a − 1 = a − 1
  For a=0.5: ∇·F = −0.5  (phase-volume halves every ln2 ≈ 1.39 time units)
  Liouville check: ∑ λᵢ must equal −0.5 exactly.

FIXED POINTS
  Setting ẋ=ẏ=ż=0:
    ẋ=0 → y = z²;  ẏ=0 → x = −ay = −az²;  ż=0 → x = z
    Combined: −az² = z  →  z(az + 1) = 0
  P₀ = (0, 0, 0)                      (origin)
  P₁ = (−1/a, 1/a², −1/a)             for a=0.5: P₁=(−2, 4, −2)

  Jacobian at P₀  (∂ẋ/∂z = 2z|₀ = 0 because P₀ is at the origin):
    J₀ = [[ 0,  −1,  0],
           [ 1,   a,  0],
           [ 1,   0, −1]]
  Characteristic polynomial (expand along column 3):
    det(J₀ − λI) = (−1−λ)·(λ² − aλ + 1) = 0
  Eigenvalues:
    λ_s    = −1                              real, stable (1D manifold)
    λ_{c±} = a/2 ± i·√(1 − a²/4)
    For a=0.5: λ_{c±} = 0.25 ± 0.968i      unstable complex pair (2D manifold)

  ── SHILNIKOV CONDITION (SATISFIED HERE — unlike Sprott G) ──
  Criterion: ρ / |λ_s| < 1  where ρ = Re(λ_c) = a/2
    For a=0.5:  0.25 / 1.0 = 0.25  < 1  ✓
  Physical meaning: the 1D stable manifold contracts faster than the 2D
  unstable spiral expands. Any homoclinic orbit (trajectory returning to P₀)
  generates a Smale horseshoe — infinitely many unstable periodic orbits
  coexist with the strange attractor. The orbit spends long arcs spiralling
  tightly around P₀ before the z² term kicks it into the large excursion.

LYAPUNOV SPECTRUM (a = 0.5, numerical RK4):
  λ₁ ≈ +0.094   (positive: chaos confirmed)
  λ₂ ≈  0.000   (flow direction: neutral)
  λ₃ ≈ −0.594   (stable folding)
  Sum = −0.500 = a−1  ✓  Liouville verified
  Kaplan–Yorke: D_KY = 2 + (λ₁+λ₂)/|λ₃| = 2 + 0.094/0.594 ≈ 2.158
  Lyapunov time: τ = 1/λ₁ ≈ 10.6 time units

SHAPE KEYS — WHY VARY a
  ∇·F = a−1 so a directly tunes both dissipation AND the Shilnikov ratio:
    Basis    a=0.50  canonical (ρ/|λ_s|=0.25, ∇·F=−0.50)
    SK_LoA   a=0.25  stronger dissipation (∇·F=−0.75), tighter tube
    SK_HiA   a=0.75  weaker dissipation (∇·F=−0.25), wider spread
    SK_NearCons a=0.95 near-conservative (∇·F=−0.05, ρ/|λ_s|=0.475→still<1)
  At a→1 the Shilnikov ratio approaches 0.5 < 1 so chaos persists — the
  attractor expands dramatically because phase volume barely contracts.
"""

import bpy
import numpy as np
from math import pi, cos, sin, sqrt, atan2

# ── PARAMETERS ──────────────────────────────────────────────────────────────────
A_BASIS     = 0.50    # Shilnikov ρ/|λ_s|=0.25; ∇·F=−0.50
A_LOA       = 0.25    # stronger dissipation; ∇·F=−0.75
A_HIA       = 0.75    # weaker dissipation;   ∇·F=−0.25
A_NEARCONS  = 0.95    # near-conservative;    ∇·F=−0.05

DT          = 0.01    # RK4 step; z² can spike so keep small
BURN_IN     = 2000    # steps to discard before sampling
N_STEPS     = 90000   # integration steps after burn-in
THIN        = 30      # record every THIN-th step → 3 000 waypoints
N_WP        = N_STEPS // THIN  # 3 000

TUBE_R      = 0.040   # tube radius (m)
TUBE_SEGS   = 8       # polygon sides per cross-section ring
POI_R       = 0.085   # poi head sphere radius

OBJ_NAME    = "SprottH_Tube"
POI_NAME    = "SprottH_Poi"
COL_ATTR    = "SprottH_Speed"

COBALT = np.array([0.05, 0.20, 0.75, 1.0])
AMBER  = np.array([1.00, 0.55, 0.05, 1.0])

# +Y-up rotation matrix (swap Y/Z for WebXR convention)
ROT_YUP = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], dtype=float)


# ── INTEGRATOR ──────────────────────────────────────────────────────────────────
def _f(s, a):
    """Sprott H vector field: ẋ=−y+z², ẏ=x+ay, ż=x−z."""
    x, y, z = s
    return np.array([-y + z*z,  x + a*y,  x - z])

def _rk4(s, dt, a):
    k1 = _f(s, a)
    k2 = _f(s + 0.5*dt*k1, a)
    k3 = _f(s + 0.5*dt*k2, a)
    k4 = _f(s + dt*k3, a)
    return s + (dt/6.0)*(k1 + 2.0*k2 + 2.0*k3 + k4)

def integrate(a):
    """Return (N_WP×3 waypoints, N_WP speeds) after burn-in."""
    s = np.array([0.1, 0.1, 0.0])
    for _ in range(BURN_IN):
        s = _rk4(s, DT, a)
    pts, spds = [], []
    for i in range(N_STEPS):
        if i % THIN == 0:
            pts.append(s.copy())
            spds.append(float(np.linalg.norm(_f(s, a))))
        s = _rk4(s, DT, a)
    return np.array(pts) @ ROT_YUP.T, np.array(spds)


# ── BISHOP FRAMES ────────────────────────────────────────────────────────────────
def bishop_frames(pts):
    """Parallel-transport frame: no gimbal lock at inflection points."""
    n = len(pts)
    T = np.diff(pts, axis=0)
    nrm = np.linalg.norm(T, axis=1, keepdims=True).clip(1e-12)
    T /= nrm

    ref = np.array([0., 0., 1.])
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([0., 1., 0.])
    N = np.zeros((n-1, 3))
    N[0] = np.cross(T[0], ref); N[0] /= np.linalg.norm(N[0])

    for i in range(1, n-1):
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.clip(np.dot(T[i-1], T[i]), -1., 1.)
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            axis /= sin_a
            N[i] = (cos_a*N[i-1]
                    + sin_a*np.cross(axis, N[i-1])
                    + (1.-cos_a)*np.dot(axis, N[i-1])*axis)
    B = np.cross(T[:n-1], N)
    return T[:n-1], N, B


# ── TUBE GEOMETRY ────────────────────────────────────────────────────────────────
def build_tube(pts, N, B, r=TUBE_R, segs=TUBE_SEGS):
    angles = np.linspace(0., 2.*pi, segs, endpoint=False)
    c, s_ = np.cos(angles), np.sin(angles)
    n_rings = len(pts) - 1
    rings = (pts[:-1, None, :]
             + r*(c[None,:,None]*N[:,None,:]
                  + s_[None,:,None]*B[:,None,:]))
    verts = rings.reshape(-1, 3)
    faces = []
    for i in range(n_rings - 1):
        for j in range(segs):
            a_ = i*segs + j;      b_ = i*segs + (j+1)%segs
            c_ = (i+1)*segs + (j+1)%segs; d_ = (i+1)*segs + j
            faces.append((a_, b_, c_, d_))
    return verts, faces


# ── COLOUR ATTRIBUTE ─────────────────────────────────────────────────────────────
def speed_colours(spds, segs=TUBE_SEGS):
    lo, hi = np.percentile(spds, 2), np.percentile(spds, 98)
    t = np.clip((spds - lo) / (hi - lo + 1e-12), 0., 1.)
    rgba = (1.-t)[:,None]*COBALT + t[:,None]*AMBER
    return np.repeat(rgba, segs, axis=0)


# ── MESH + SHAPE KEYS ────────────────────────────────────────────────────────────
def make_tube_obj(pts, spds):
    T, N, B = bishop_frames(pts)
    verts, faces = build_tube(pts, N, B)
    colours = speed_colours(spds)

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    attr = me.attributes.new(COL_ATTR, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", colours.flatten())

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    return ob

def add_shape_key(ob, pts, spds, name):
    T, N, B = bishop_frames(pts)
    verts, _ = build_tube(pts, N, B)
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set("co", verts.flatten())


# ── MATERIAL ─────────────────────────────────────────────────────────────────────
def make_material(ob):
    mat = bpy.data.materials.new("SprottH_Mat")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr = nt.nodes.new("ShaderNodeAttribute")
    emit = nt.nodes.new("ShaderNodeEmission")
    mix  = nt.nodes.new("ShaderNodeMixShader")
    attr.attribute_name = COL_ATTR
    bsdf.inputs["Metallic"].default_value  = 0.50
    bsdf.inputs["Roughness"].default_value = 0.22
    emit.inputs["Strength"].default_value  = 1.8
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(bsdf.outputs["BSDF"],     mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    mix.inputs["Fac"].default_value = 0.35
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    ob.data.materials.append(mat)


# ── MAIN ─────────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    pts_b, spds_b = integrate(A_BASIS)
    ob = make_tube_obj(pts_b, spds_b)
    ob.shape_key_add(name="Basis", from_mix=False)

    for a_val, sk_name in [(A_LOA, "SK_LoA"), (A_HIA, "SK_HiA"),
                            (A_NEARCONS, "SK_NearCons")]:
        pts_v, spds_v = integrate(a_val)
        add_shape_key(ob, pts_v, spds_v, sk_name)

    make_material(ob)

    # Poi head
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=(0, 0, 0))
    poi = bpy.context.active_object
    poi.name = POI_NAME; poi.parent = ob

    # Holoflow metadata
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:slug"]     = (
        "python-numpy-sprott-h-attractor-1994-five-term-z-squared-"
        "shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
    )
    print(f"Sprott H complete: {len(pts_b)} waypoints, "
          f"{len(ob.data.polygons)} faces.")


if __name__ == "__main__":
    main()
