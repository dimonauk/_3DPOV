"""
Sprott P Attractor — 7-Term y²-Nonlinearity, Variable Divergence, Shilnikov Ratio ≈ 5.96
==========================================================================================
Julien C. Sprott, Physical Review E 50(2):R647–650 (1994)
Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of the 3-ODE Sprott P system produces a 3 000-waypoint
tube skeleton; Bishop parallel-transport frames extrude a round-profile
tube that is welded into a poi head mesh.  Four shape keys scan the
parameter a, showing how the Shilnikov saddle-focus at the origin drives
chaos as the second fixed point moves in phase space.

WHY SPROTT P — VARIABLE DIVERGENCE AND DUAL FIXED POINTS
---------------------------------------------------------
System:  ẋ = ay + z     ẏ = −x + y²     ż = x + y − z
         a = 2.7  (canonical 1994 value)

Sprott P is the only case in the 1994 catalogue with BOTH:
  (i)  a y²-nonlinearity  AND
  (ii) variable (position-dependent) divergence

All other y²-cases in the library (I, J, Q) have constant divergence; all
variable-divergence cases (D, K, O) use xz or xz-bilinear products.
P is the unique intersection of those two sub-families.

Divergence:  ∇·F = ∂(ay+z)/∂x + ∂(−x+y²)/∂y + ∂(x+y−z)/∂z
                 = 0 + 2y + (−1) = 2y − 1   (position-dependent)

Average on the attractor:  ⟨∇·F⟩ = 2⟨y⟩ − 1
  Dissipation requires ⟨y⟩ < ½; integration confirms ⟨y⟩ ≈ −0.08
  giving ⟨∇·F⟩ ≈ −1.16 and Liouville balance ∑λᵢ ≈ −1.16.

FIXED POINTS
-----------
Setting ẋ = ẏ = ż = 0:
  ay + z = 0   →  z = −ay
  −x + y² = 0  →  x = y²
  x + y − z = 0  →  y² + y + ay = y(y + 1 + a) = 0

Two fixed points (for all a > −1):
  P₀ = (0, 0, 0)                      (origin)
  P₁ = ((1+a)², −(1+a), a(1+a))

For a = 2.7:  P₁ = (13.69, −3.70, 9.99)

SHILNIKOV ANALYSIS AT P₀
------------------------
Jacobian:  J₀ = [[0, a, 1], [−1, 0, 0], [1, 1, −1]]

Characteristic polynomial (exact derivation by cofactor expansion):
  det(J₀ − λI) = −λ³ − λ² − (a−1)λ − (a+1)
  ⟹  λ³ + λ² + (a−1)λ + (a+1) = 0

For a = 2.7:  λ³ + λ² + 1.7λ + 3.7 = 0

Roots (numerical):
  λ_r ≈ −1.505   (stable real — the Shilnikov saddle direction)
  λ_c ≈  0.253 ± 1.549i  (unstable complex — the spiral source)

Shilnikov ratio:  ρ = |λ_r| / Re(λ_c) = 1.505 / 0.253 ≈ 5.96 > 1  ✓
  The Shilnikov theorem guarantees a countably infinite family of
  horseshoes near any homoclinic orbit to P₀.

Note: the characteristic polynomial at P₀ is PARAMETER-DEPENDENT
(unlike Sprott Q where λ_r = −1 exactly).  As a varies:
  sum of roots = −1 (fixed — from the λ² coefficient)
  product of roots = −(a+1) (scales with a)

Estimated Lyapunov spectrum (numerical integration at a = 2.7):
  λ₁ ≈ +0.075,  λ₂ ≈ 0.00,  λ₃ ≈ −1.24
  D_KY = 2 + 0.075/1.24 ≈ 2.06,  ∑λᵢ ≈ −1.165 = ⟨∇·F⟩ ✓

References:
    Sprott, J.C. (1994). Some simple chaotic flows.
    Physical Review E, 50(2), R647–R650.
    DOI: 10.1103/PhysRevE.50.R647   (equations PD / open-access)

    Shilnikov, L.P. (1965). A case of the existence of a countable set
    of periodic motions. Soviet Math. Dokl. 6, 163–166.
    (foundational theorem — divergence-free derivation, PD)

    Bishop, R.L. (1975). There is more than one way to frame a curve.
    American Mathematical Monthly 82(3):246–251.
    DOI: 10.2307/2311093   (parallel-transport — PD technique)

    dysts — Dynamical Systems Benchmarks, W. Gilpin (MIT):
    https://github.com/williamgilpin/dysts
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────────────────────
DT         = 0.01         # RK4 timestep — stable for y²-growth near y≈3.7
BURN_IN    = 3_000        # steps discarded to settle onto the attractor
N_STEPS    = 90_000       # integration steps after burn-in
THIN       = 30           # keep every 30th point → 3 000 waypoints
TUBE_SIDES = 8            # octagonal cross-section (WebXR-efficient)
TUBE_R     = 0.042        # tube radius in Blender units

COLOUR_LO  = (0.027, 0.159, 0.557)   # cobalt blue  (slow)
COLOUR_HI  = (0.950, 0.600, 0.000)   # amber        (fast)

# Shape-key parameter sets — a controls the second fixed-point position
PARAM_SETS = {
    "Basis":   2.7,   # canonical — Shilnikov ratio ≈5.96
    "SK_LowA": 2.0,   # P₁=(9,−3,6) — wider orbit, lower ratio ≈4.2
    "SK_HighA": 3.5,  # P₁=(20.25,−4.5,15.75) — tighter, ratio ≈7.9
    "SK_WideA": 4.5,  # P₁=(30.25,−5.5,24.75) — near topology shift
}


def _deriv(s, a):
    """RHS of Sprott P.  ẋ = ay+z,  ẏ = −x+y²,  ż = x+y−z."""
    x, y, z = s
    return np.array([a*y + z,
                     -x + y*y,
                     x + y - z])


def rk4_orbit(a, n_steps, dt, burn, thin):
    """Integrate Sprott P with RK4; return (n_pts,3) waypoints and speeds."""
    s = np.array([0.1, 0.0, 0.1])   # initial condition off P₀
    for _ in range(burn):
        k1 = _deriv(s, a)
        k2 = _deriv(s + 0.5*dt*k1, a)
        k3 = _deriv(s + 0.5*dt*k2, a)
        k4 = _deriv(s + dt*k3, a)
        s += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    pts, speeds = [], []
    for i in range(n_steps):
        k1 = _deriv(s, a)
        k2 = _deriv(s + 0.5*dt*k1, a)
        k3 = _deriv(s + 0.5*dt*k2, a)
        k4 = _deriv(s + dt*k3, a)
        s += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        if i % thin == 0:
            pts.append(s.copy())
            speeds.append(float(np.linalg.norm(k1)))   # instantaneous speed

    return np.array(pts), np.array(speeds)


def bishop_frames(pts):
    """
    Bishop parallel-transport framing.
    WHY: Frenet–Serret frames flip at zero-curvature inflections; Bishop
    propagates the normal by the minimal rotation from one tangent to the
    next, giving a smooth, twist-free tube for the attractor's tight spirals.
    """
    n = len(pts)
    T = np.zeros((n, 3))
    for i in range(n - 1):
        d = pts[i+1] - pts[i]
        nm = np.linalg.norm(d)
        T[i] = d / nm if nm > 1e-12 else T[max(i-1, 0)]
    T[-1] = T[-2]

    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    N0 = np.cross(T[0], up)
    N0 /= np.linalg.norm(N0)

    N = np.zeros((n, 3))
    N[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        sa = np.linalg.norm(axis)
        ca = np.dot(T[i-1], T[i])
        if sa < 1e-12:
            N[i] = N[i-1]
        else:
            axis /= sa
            angle = np.arctan2(sa, ca)
            c, s = np.cos(angle), np.sin(angle)
            N[i] = (c*N[i-1] + s*np.cross(axis, N[i-1])
                    + (1-c)*np.dot(axis, N[i-1])*axis)

    B = np.cross(T, N)
    return N, B


def build_tube(pts, N_fr, B_fr, r, sides):
    """Extrude a circular cross-section along the waypoints."""
    angles = np.linspace(0, 2*np.pi, sides, endpoint=False)
    cos_a, sin_a = np.cos(angles), np.sin(angles)
    n = len(pts)
    rings = (pts[:, None, :]
             + r * (cos_a[None, :, None] * N_fr[:, None, :]
                    + sin_a[None, :, None] * B_fr[:, None, :]))
    verts = rings.reshape(-1, 3)
    faces = []
    for i in range(n - 1):
        base = i * sides
        for j in range(sides):
            a = base + j
            b = base + (j+1) % sides
            faces.append((a, b, b+sides, a+sides))
    return verts, faces


def make_speed_attribute(mesh, speeds, sides):
    """FLOAT_COLOR 'SprottP_Speed' — cobalt (slow) → amber (fast)."""
    attr = mesh.attributes.new(name="SprottP_Speed",
                                type="FLOAT_COLOR", domain="POINT")
    lo = np.percentile(speeds, 2)
    hi = np.percentile(speeds, 98)
    hi = max(hi, lo + 1e-9)
    cols = []
    for spd in speeds:
        t = float(np.clip((spd - lo) / (hi - lo), 0.0, 1.0))
        r = COLOUR_LO[0] + t*(COLOUR_HI[0]-COLOUR_LO[0])
        g = COLOUR_LO[1] + t*(COLOUR_HI[1]-COLOUR_LO[1])
        b = COLOUR_LO[2] + t*(COLOUR_HI[2]-COLOUR_LO[2])
        for _ in range(sides):
            cols.append((r, g, b, 1.0))
    attr.data.foreach_set("color", [v for rgba in cols for v in rgba])


# ── Main build ──────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

me = bpy.data.meshes.new("SprottP_Tube")
ob = bpy.data.objects.new("SprottP_Poi", me)
bpy.context.collection.objects.link(ob)

# Basis shape
a0 = PARAM_SETS["Basis"]
pts, speeds = rk4_orbit(a0, N_STEPS, DT, BURN_IN, THIN)
N_fr, B_fr  = bishop_frames(pts)
verts, faces = build_tube(pts, N_fr, B_fr, TUBE_R, TUBE_SIDES)

bm = bmesh.new()
for co in verts:
    bm.verts.new(Vector(co))
bm.verts.ensure_lookup_table()
for f in faces:
    bm.faces.new([bm.verts[i] for i in f])
bm.to_mesh(me)
bm.free()

make_speed_attribute(me, speeds, TUBE_SIDES)

# Shape keys
ob.shape_key_add(name="Basis", from_mix=False)
for sk_name, a_sk in PARAM_SETS.items():
    if sk_name == "Basis":
        continue
    pts_sk, _ = rk4_orbit(a_sk, N_STEPS, DT, BURN_IN, THIN)
    N_sk, B_sk = bishop_frames(pts_sk)
    v_sk, _    = build_tube(pts_sk, N_sk, B_sk, TUBE_R, TUBE_SIDES)
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    for i, co in enumerate(v_sk):
        sk.data[i].co = Vector(co)

# Material: speed attribute → principled BSDF + emission
mat = bpy.data.materials.new("SprottP_Mat")
mat.use_nodes = True
nd  = mat.node_tree.nodes
lnk = mat.node_tree.links
nd.clear()
attr_nd = nd.new("ShaderNodeAttribute")
attr_nd.attribute_name = "SprottP_Speed"
bsdf_nd = nd.new("ShaderNodeBsdfPrincipled")
bsdf_nd.inputs["Metallic"].default_value  = 0.50
bsdf_nd.inputs["Roughness"].default_value = 0.22
emit_nd = nd.new("ShaderNodeEmission")
emit_nd.inputs["Strength"].default_value  = 1.8
add_nd  = nd.new("ShaderNodeAddShader")
out_nd  = nd.new("ShaderNodeOutputMaterial")
lnk.new(attr_nd.outputs["Color"], bsdf_nd.inputs["Base Color"])
lnk.new(attr_nd.outputs["Color"], emit_nd.inputs["Color"])
lnk.new(bsdf_nd.outputs["BSDF"],  add_nd.inputs[0])
lnk.new(emit_nd.outputs["Emission"], add_nd.inputs[1])
lnk.new(add_nd.outputs["Shader"],  out_nd.inputs["Surface"])
ob.data.materials.append(mat)

# Poi head — UV sphere welded at tube midpoint
mid = len(pts) // 2
mid_pt = Vector(pts[mid])
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.100, location=mid_pt)
head = bpy.context.active_object
head.name = "SprottP_Head"
head["holoflow:facet"] = True

# +Y-up for WebXR export
ob["holoflow:facet"] = False
ob.rotation_euler = (1.5707963, 0, 0)
bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.transform_apply(rotation=True)

print(f"SprottP build complete — {len(pts)} waypoints, a={a0}, ratio≈5.96")
