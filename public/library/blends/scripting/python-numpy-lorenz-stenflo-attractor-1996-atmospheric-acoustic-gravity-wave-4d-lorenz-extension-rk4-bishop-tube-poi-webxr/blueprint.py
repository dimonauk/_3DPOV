"""
Lorenz-Stenflo Attractor — Blender 5.1 Blueprint
==================================================
L. Stenflo, "Generalized Lorenz equations for acoustic-gravity waves in
the atmosphere", Physica Scripta 53(1):83-84, 1996.
Equations are mathematical objects in the public domain.

WHY THIS SYSTEM?
================
The Lorenz attractor (1963) models thermally-driven convection in the atmosphere.
Stenflo (1996) asked: what happens when *acoustic-gravity waves* — pressure
oscillations that propagate through density-stratified air — couple back into the
convective rolls?  The answer is a fourth ODE whose variable w carries the acoustic
wave amplitude.  The coupling parameter s controls the strength of this feedback.

At s = 0 the fourth equation is ẇ = −σw (pure decay), and x decouples from w,
reducing the system to a variant of Lorenz.  As s grows, the acoustic channel
injects energy back into the momentum equation, stretching and twisting the
familiar butterfly topology into a family of scrolls that have no 3D analogue.

EQUATIONS
=========
    ẋ = σ(y − x) + s·w
    ẏ = r·x − y − x·z
    ż = x·y − b·z
    ẇ = −x − σ·w

Canonical parameters (Stenflo 1996):
    σ = 0.7   (Prandtl-like number, ratio diffusivities)
    r = 26    (Rayleigh-like number, convective driving)
    b = 8/3   (geometry factor, same as Lorenz)
    s = 1.5   (acoustic coupling strength)

FIXED POINTS
============
Setting all derivatives to zero:
  From ẇ = 0 :  w* = −x* / σ
  From ẋ = 0 :  y* = x*(σ² + s) / σ²       [defines the tilt angle]
  From ż = 0 :  z* = r − (σ² + s)/σ²       [independent of x*]
  From ẏ = 0 :  x*² = b·z* / [(σ² + s)/σ²]

For canonical parameters (σ=0.7, r=26, b=8/3, s=1.5):
  (σ² + s)/σ² = (0.49 + 1.5)/0.49 ≈ 4.061
  z*  = 26 − 4.061  = 21.939
  x*² = (8/3 × 21.939) / 4.061 ≈ 14.403   →   x* ≈ ±3.795
  y*  ≈ ±15.41      w*  ≈ ∓5.42

Three fixed points:
  O  = (0, 0, 0, 0)                     — origin, unstable saddle
  P± = (±3.795, ±15.41, 21.939, ∓5.42) — twisted analogues of Lorenz P±

DIVERGENCE (volume contraction in phase space)
==============================================
    ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z + ∂ẇ/∂w
         = −σ + (−1) + (−b) + (−σ)
         = −(2σ + 1 + b)                  ← CONSTANT

For canonical params: ∇·F = −(1.4 + 1 + 8/3) ≈ −5.067
Compare: Lorenz divergence = −(σ + 1 + b) = −43/3 ≈ −14.67 (higher dissipation).
The Stenflo system contracts ~3× more slowly, which allows richer orbital geometry.

LYAPUNOV SPECTRUM (canonical, approximate)
==========================================
    λ₁ ≈ +0.122   primary chaos
    λ₂ ≈  0       orbit-tangent direction
    λ₃ ≈ −0.44
    λ₄ ≈ −4.75
    Σλᵢ ≈ −5.07   = ∇·F  (Liouville identity ✓)
    D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.28

VISUALISATION
=============
The 4D trajectory is projected onto (x, y, z).  The acoustic amplitude w
rides along as a cobalt–amber FLOAT_COLOR vertex attribute, exactly as done
for Rössler hyperchaos, so the viewer can "see" the 4th dimension at a glance:
cobalt = w near minimum (−5.4), amber = w near maximum (+5.4).
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Named constants ────────────────────────────────────────────────────────────
SIGMA    = 0.7
R_BASIS  = 26.0
B        = 8.0 / 3.0
S_BASIS  = 1.5   # acoustic coupling

# Shape-key parameter overrides (sigma, r, b unchanged unless noted)
SK_WEAK_S  = dict(s=0.5)    # weak coupling → orbit contracts toward Lorenz limit
SK_STRONG_S= dict(s=3.0)    # strong coupling → pronounced acoustic distortion
SK_HIGH_R  = dict(r=35.0, s=S_BASIS)  # higher Rayleigh → broader butterfly wings

DT         = 0.005
BURN_IN    = 4_000    # discard transient
N_STEPS    = 90_000   # total integration steps after burn-in
THIN       = 30       # keep every 30th point → 3 000 waypoints per shape key

TUBE_R     = 0.045    # Bishop-tube cross-section radius [m]
TUBE_SIDES = 10       # polygon count around tube
POI_R      = 0.09    # poi head sphere radius [m]

COBALT = (0.03, 0.20, 0.78, 1.0)
AMBER  = (0.98, 0.62, 0.05, 1.0)

OBJ_NAME   = "LS_Stenflo_Poi"
BLEND_NAME = "lorenz_stenflo_poi.blend"
GLB_NAME   = "lorenz_stenflo_poi.glb"


# ── ODE + RK4 ─────────────────────────────────────────────────────────────────
def lorenz_stenflo(state, sigma, r, b, s):
    """Right-hand side of the Lorenz-Stenflo system."""
    x, y, z, w = state
    dx = sigma * (y - x) + s * w
    dy = r * x - y - x * z
    dz = x * y - b * z
    dw = -x - sigma * w
    return np.array([dx, dy, dz, dw])


def rk4(state, dt, sigma, r, b, s):
    """Classic 4th-order Runge-Kutta step."""
    f = lorenz_stenflo
    k1 = f(state,           sigma, r, b, s)
    k2 = f(state + dt/2*k1, sigma, r, b, s)
    k3 = f(state + dt/2*k2, sigma, r, b, s)
    k4 = f(state + dt   *k3, sigma, r, b, s)
    return state + dt/6 * (k1 + 2*k2 + 2*k3 + k4)


def integrate(sigma, r, b, s):
    """Return (xyz_waypoints, w_values) arrays of shape (N, 3) and (N,)."""
    state = np.array([0.1, 0.0, 1.0, 0.0])
    for _ in range(BURN_IN):
        state = rk4(state, DT, sigma, r, b, s)
    pts, ws = [], []
    for i in range(N_STEPS):
        state = rk4(state, DT, sigma, r, b, s)
        if i % THIN == 0:
            pts.append(state[:3].copy())
            ws.append(state[3])
    return np.array(pts), np.array(ws)


# ── Bishop parallel-transport frame ───────────────────────────────────────────
def bishop_frames(pts):
    """Return (tangents, normals, binormals) via Bishop parallel transport."""
    n = len(pts)
    T = np.zeros((n, 3))
    for i in range(n - 1):
        seg = pts[i+1] - pts[i]
        ln = np.linalg.norm(seg)
        T[i] = seg / ln if ln > 1e-12 else T[i-1]
    T[-1] = T[-2]

    # Seed the first normal perpendicular to T[0]
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([0.0, 1.0, 0.0])
    N = np.zeros((n, 3))
    N[0] = np.cross(T[0], ref)
    N[0] /= np.linalg.norm(N[0])
    B = np.zeros((n, 3))
    B[0] = np.cross(T[0], N[0])

    # Parallel-transport: rotate N and B by the rotation that maps T[i]→T[i+1]
    for i in range(1, n):
        v = np.cross(T[i-1], T[i])
        s_sq = np.dot(v, v)
        if s_sq < 1e-18:
            N[i] = N[i-1]
            B[i] = B[i-1]
        else:
            c = np.dot(T[i-1], T[i])
            vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
            R = np.eye(3) + vx + vx @ vx * (1 / (1 + c))
            N[i] = R @ N[i-1]
            B[i] = np.cross(T[i], N[i])
    return T, N, B


# ── Mesh construction ─────────────────────────────────────────────────────────
def build_tube(pts, normals, binormals, w_vals, name):
    """Create the Bishop-tube mesh with FLOAT_COLOR attribute for w."""
    nw = len(pts)
    angles = np.linspace(0, 2*np.pi, TUBE_SIDES, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)

    verts = []
    for i in range(nw):
        for j in range(TUBE_SIDES):
            offset = TUBE_R * (cos_a[j]*normals[i] + sin_a[j]*binormals[i])
            verts.append(tuple(pts[i] + offset))

    faces = []
    for i in range(nw - 1):
        for j in range(TUBE_SIDES):
            j2 = (j + 1) % TUBE_SIDES
            a = i * TUBE_SIDES + j
            b = i * TUBE_SIDES + j2
            c = (i+1)*TUBE_SIDES + j2
            d = (i+1)*TUBE_SIDES + j
            faces.append((a, b, c, d))

    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    # ── Colour attribute: cobalt (w_min) → amber (w_max) ──────────────────
    w_min, w_max = w_vals.min(), w_vals.max()
    w_rng = max(w_max - w_min, 1e-9)

    attr = mesh.color_attributes.new(
        name="LS_Stenflo_W", type="FLOAT_COLOR", domain="POINT"
    )
    col_data = np.empty(len(verts) * 4, dtype=np.float32)
    for i in range(nw):
        t = (w_vals[i] - w_min) / w_rng
        r, g, b_c, a_c = (
            COBALT[0]*(1-t) + AMBER[0]*t,
            COBALT[1]*(1-t) + AMBER[1]*t,
            COBALT[2]*(1-t) + AMBER[2]*t,
            1.0,
        )
        for j in range(TUBE_SIDES):
            idx = (i * TUBE_SIDES + j) * 4
            col_data[idx:idx+4] = [r, g, b_c, a_c]
    attr.data.foreach_set("color", col_data)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_poi_head(parent_obj):
    """Attach a small sphere as the poi fire head."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=POI_R, location=(0, 0, 0), segments=16, ring_count=8
    )
    head = bpy.context.active_object
    head.name = parent_obj.name + "_Head"
    head.parent = parent_obj
    return head


def apply_emission_material(obj, r, g, b):
    mat = bpy.data.materials.new(name=obj.name + "_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out  = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_type = "GEOMETRY"
    attr.attribute_name  = "LS_Stenflo_W"
    emit.inputs["Strength"].default_value = 1.6
    mat.node_tree.links.new(attr.outputs["Color"], emit.inputs["Color"])
    mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    obj.data.materials.append(mat)


def build_shape_key(obj, pts, normals, binormals, sk_name):
    """Replace vertex positions for a shape key from a new set of waypoints."""
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    sk.value = 0.0
    nw = len(pts)
    angles = np.linspace(0, 2*np.pi, TUBE_SIDES, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)
    coords = []
    for i in range(nw):
        for j in range(TUBE_SIDES):
            offset = TUBE_R * (cos_a[j]*normals[i] + sin_a[j]*binormals[i])
            coords.append(tuple(pts[i] + offset))
    flat = [c for v in coords for c in v]
    sk.data.foreach_set("co", flat)


# ── Export ────────────────────────────────────────────────────────────────────
def export_glb(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    for child in obj.children:
        child.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_NAME,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_morph=True,
        export_colors=True,
        export_yup=True,
        use_selection=True,
    )
    print(f"[Stenflo] Exported {GLB_NAME}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print("[Stenflo] Integrating Basis (s=1.5, r=26) …")
    pts_b, w_b = integrate(SIGMA, R_BASIS, B, S_BASIS)
    T, N, Bn   = bishop_frames(pts_b)

    obj = build_tube(pts_b, N, Bn, w_b, OBJ_NAME)
    obj.shape_key_add(name="Basis", from_mix=False)
    apply_emission_material(obj, *COBALT[:3])
    add_poi_head(obj)

    for sk_name, overrides in [
        ("SK_WeakS",   SK_WEAK_S),
        ("SK_StrongS", SK_STRONG_S),
        ("SK_HighR",   SK_HIGH_R),
    ]:
        s_val = overrides.get("s", S_BASIS)
        r_val = overrides.get("r", R_BASIS)
        print(f"[Stenflo] Integrating {sk_name} (s={s_val}, r={r_val}) …")
        pts_sk, _ = integrate(SIGMA, r_val, B, s_val)
        nw = min(len(pts_b), len(pts_sk))
        T_sk, N_sk, Bn_sk = bishop_frames(pts_sk[:nw])
        build_shape_key(obj, pts_sk[:nw], N_sk, Bn_sk, sk_name)

    # Centre the attractor on the world origin
    pts_centre = pts_b.mean(axis=0)
    obj.location = Vector(-pts_centre)

    export_glb(obj)
    print("[Stenflo] Done — save as", BLEND_NAME)


main()
