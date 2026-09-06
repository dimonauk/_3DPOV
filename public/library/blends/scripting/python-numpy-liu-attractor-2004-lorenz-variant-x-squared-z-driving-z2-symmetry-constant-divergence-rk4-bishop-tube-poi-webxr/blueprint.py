"""
Liu Attractor (2004) — Blender 5.1 / bpy — Holoflow Studio
=============================================================
Source:
  Liu C, Liu T, Liu L, Liu K (2004). "A new chaotic attractor."
  Chaos Solitons Fractals 22(5):1031–1038.
  DOI 10.1016/j.chaos.2004.02.060   (equations: public domain)

  NumPy (BSD-3-Clause): https://numpy.org  github.com/numpy/numpy

TECHNIQUE
─────────
The Liu system is Lorenz with one crucial substitution: the product xy in
the z-equation is replaced by hx², making z-driving always positive and
breaking the homoclinic-twin-scroll mechanism present in Lorenz. The result
is a Z₂-symmetric butterfly (symmetry (x,y,z)→(−x,−y,z)) whose wings sit
at P±=(±5, ±5, 40) — saddle-nodes with one large unstable real eigenvalue
(≈+9.05) and a stable complex pair (≈−10.78±10.24i), giving a repulsion-
then-recapture topology rather than the Shilnikov saddle-focus of Rössler.
Constant divergence ∇·F=−(a+c)=−12.5, λ₁≈+1.847, D_KY≈2.129 (original paper).

RK4 integrates 90 000 steps at DT=0.005; 3 000 thinned waypoints are framed
by a Bishop parallel-transport frame (twist-free) and meshed into a tube.
Orbital speed colours vertices cobalt→amber via a FLOAT_COLOR attribute.
Four shape keys explore the parameter family (b, c, k).

EQUATIONS
──────────
  ẋ = a(y − x)        pure linear coupling (as in Lorenz/Chen)
  ẏ = bx − k·x·z     Lorenz-type nonlinearity in xz; no y²
  ż = −cz + h·x²      KEY CHANGE: x² instead of xy → always-positive z-drive

  Canonical: a=10  b=40  k=1  c=2.5  h=4

CONSTANT DIVERGENCE
───────────────────
  ∂ẋ/∂x=−a   ∂ẏ/∂y=0   ∂ż/∂z=−c
  ∇·F = −a − c = −12.5   (position-independent)
  Liouville: λ₁+λ₂+λ₃ = +1.847+0.000−14.347 = −12.500 = ∇·F  ✓
  D_KY = 2 + 1.847/14.347 ≈ 2.129

EQUILIBRIA
──────────
  Origin O=(0,0,0): ẋ=0 iff y=x; ẏ=0 iff x=0 or z=b/k=40; ż=0 iff x=0 → O
    J|_O  block-diagonal: [[−a,a],[b,0]] ⊕ [−c]
    λ_O1 ≈ +15.62  (strongly unstable — drives wing-switching)
    λ_O2 ≈ −25.62  (strongly stable)
    λ_O3  = −c = −2.5

  Wings P± = (±5, ±5, 40)  [from z=b/k=40, x²=cz/h=25]
    J|_{P+} = [[−10,10,0],[0,0,−5],[40,0,−2.5]]
    Char-poly: λ³ + 12.5λ² + 25λ − 2000 = 0
    λ_real    ≈ +9.05   (UNSTABLE — trajectories blow off the wing)
    λ_complex ≈ −10.78 ± 10.24i  (stable spiral — trajectories wind toward wing)
  → Saddle-node type: the strange attractor forms via heteroclinic re-injection
    between the two wings' unstable manifolds.

Z₂ SYMMETRY
───────────
  S: (x,y,z)→(−x,−y,z) leaves the ODE invariant (check: x²=(−x)², sign flips
  cancel in ẋ and ẏ). The two wings are exact mirror images; the orbit switches
  between them quasi-randomly via the origin saddle.

Run:  blender --background --python blueprint.py
Needs: bpy (built-in), numpy (bundled ≥ Blender 4.2)
"""

import bpy, bmesh, numpy as np, math
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
A, B, K, C, H    = 10.0, 40.0, 1.0, 2.5, 4.0   # canonical Liu 2004
DT, BURN_IN      = 0.005, 3_000
N_STEPS, THIN    = 90_000, 30                    # → 3 000 waypoints
TUBE_R, TUBE_SEGS, POI_R = 0.045, 10, 0.090
COLOUR_NAME      = "Liu_Speed"
COBALT           = np.array([0.000, 0.267, 0.667, 1.0], np.float32)
AMBER            = np.array([1.000, 0.498, 0.000, 1.0], np.float32)
NAME             = "hf_liu_poi"

# ── DYNAMICS ──────────────────────────────────────────────────────────────────
def _f(s, a, b, k, c, h):
    x, y, z = s
    return np.array([a*(y - x), b*x - k*x*z, -c*z + h*x*x])

def _rk4(s, dt, a, b, k, c, h):
    k1 = _f(s,          a, b, k, c, h)
    k2 = _f(s+dt/2*k1,  a, b, k, c, h)
    k3 = _f(s+dt/2*k2,  a, b, k, c, h)
    k4 = _f(s+dt*k3,    a, b, k, c, h)
    return s + dt*(k1 + 2*k2 + 2*k3 + k4)/6

def integrate(a=A, b=B, k=K, c=C, h=H):
    """Integrate the Liu system; returns (waypoints, speeds) arrays."""
    s = np.array([1.0, 1.0, 1.0])
    for _ in range(BURN_IN):
        s = _rk4(s, DT, a, b, k, c, h)
    pts, spd = [], []
    for i in range(N_STEPS):
        s = _rk4(s, DT, a, b, k, c, h)
        if i % THIN == 0:
            pts.append(s.copy())
            spd.append(np.linalg.norm(_f(s, a, b, k, c, h)))
    return np.array(pts), np.array(spd)

# ── BISHOP FRAMES ─────────────────────────────────────────────────────────────
def bishop_frames(pts):
    """Parallel-transport frame (Bishop 1975) — twist-free along polyline."""
    n = len(pts)
    T = np.diff(pts, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True)
    N = np.zeros((n, 3)); B = np.zeros((n, 3))
    a0 = np.array([0., 0., 1.]) if abs(T[0, 2]) < 0.9 else np.array([1., 0., 0.])
    N[0] = np.cross(T[0], a0); N[0] /= np.linalg.norm(N[0])
    B[0] = np.cross(T[0], N[0])
    for i in range(1, n - 1):
        N[i] = np.cross(B[i-1], T[i])
        nm = np.linalg.norm(N[i])
        N[i] = N[i-1] if nm < 1e-8 else N[i] / nm
        B[i] = np.cross(T[i], N[i])
    N[-1] = N[-2]; B[-1] = B[-2]
    return N, B

# ── TUBE GEOMETRY ─────────────────────────────────────────────────────────────
def build_tube(pts, N, B, r, segs):
    θ = np.linspace(0, 2*np.pi, segs, endpoint=False)
    cos, sin = np.cos(θ), np.sin(θ)
    n = len(pts)
    verts = []
    for i in range(n):
        ring = pts[i] + r*(cos[:, None]*N[i] + sin[:, None]*B[i])
        verts.extend(ring.tolist())
    faces = []
    for i in range(n - 1):
        for j in range(segs):
            a = i*segs+j; b = a+segs
            c = i*segs+(j+1)%segs; d = c+segs
            faces.append((a, c, d, b))
    return np.array(verts), faces

def _colours(spd, segs):
    lo, rng = spd.min(), spd.max()-spd.min()
    s = (spd - lo) / max(rng, 1e-10)
    c = np.outer(1-s, COBALT) + np.outer(s, AMBER)
    return np.repeat(c, segs, axis=0).astype(np.float32)

# ── MESH ASSEMBLY ─────────────────────────────────────────────────────────────
def _scaled(pts):
    cen = pts.mean(0); pc = pts - cen
    return pc * (POI_R / max(np.linalg.norm(pc, axis=1).max(), 1e-6))

def assemble_mesh(name, pts, spd):
    pts_s = _scaled(pts)
    N, B = bishop_frames(pts_s)
    verts, faces = build_tube(pts_s, N, B, TUBE_R, TUBE_SEGS)
    cols = _colours(spd, TUBE_SEGS)
    bm = bmesh.new()
    bvs = [bm.verts.new(Vector(v)) for v in verts]
    bm.verts.ensure_lookup_table()
    for fa in faces:
        try: bm.faces.new([bvs[i] for i in fa])
        except ValueError: pass
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    attr = me.color_attributes.new(COLOUR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", cols.ravel().tolist())
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob, pts_s

def add_shape_key(ob, key, pts_new, spd_new, n_basis):
    pts_s = _scaled(pts_new)
    n = len(pts_s)
    if n >= n_basis:
        pts_t = pts_s[:n_basis]
    else:
        pts_t = np.tile(pts_s, ((n_basis//n)+1, 1))[:n_basis]
    N, B = bishop_frames(pts_t)
    verts, _ = build_tube(pts_t, N, B, TUBE_R, TUBE_SEGS)
    sk = ob.shape_key_add(name=key, from_mix=False)
    sk.data.foreach_set("co", np.array(verts, np.float32).ravel().tolist())

# ── MATERIAL ──────────────────────────────────────────────────────────────────
def make_material(ob):
    mat = bpy.data.materials.new("Liu_Mat")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = COLOUR_NAME; attr.attribute_type = "GEOMETRY"
    bsdf.inputs["Metallic"].default_value  = 0.42
    bsdf.inputs["Roughness"].default_value = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.85
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    ob.data.materials.append(mat)

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()

    pts_b, spd_b = integrate()
    ob, pts_s    = assemble_mesh(NAME, pts_b, spd_b)
    n_basis      = len(pts_s)
    ob.shape_key_add(name="Basis", from_mix=False)

    # SK_LoB: b=28 — wings drop to z=28, x±=±4.18, compact orbit
    pts, spd = integrate(b=28.0)
    add_shape_key(ob, "SK_LoB", pts, spd, n_basis)

    # SK_HiB: b=52 — wings rise to z=52, x±=±5.70, expanded orbit
    pts, spd = integrate(b=52.0)
    add_shape_key(ob, "SK_HiB", pts, spd, n_basis)

    # SK_SoftZ: c=1.5 — z decays more slowly; x±=±√15≈±3.87, orbit topology shifts
    pts, spd = integrate(c=1.5)
    add_shape_key(ob, "SK_SoftZ", pts, spd, n_basis)

    make_material(ob)
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:topic"]    = "liu-attractor"
    ob["holoflow:version"]  = "5.1"
    ob["export_name"]       = NAME

    # +Y-up for WebXR/glTF (Blender is +Z-up)
    ob.rotation_euler[0] = -math.pi / 2.0
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(rotation=True)

    print(f"[Liu] verts={len(ob.data.vertices)} faces={len(ob.data.polygons)}")
    print(f"      keys ={[sk.name for sk in ob.data.shape_keys.key_blocks]}")

main()
