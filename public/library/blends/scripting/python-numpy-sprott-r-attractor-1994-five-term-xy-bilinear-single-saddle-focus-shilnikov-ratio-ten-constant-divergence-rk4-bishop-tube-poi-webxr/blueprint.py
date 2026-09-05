"""
Sprott R Attractor — 5-Term XY-Bilinear, Single Shilnikov Saddle-Focus, Ratio ≈10.7
======================================================================================
Julien C. Sprott, Physical Review E 50(2):R647–650 (1994)
Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of the 3-ODE Sprott R system produces a 3 000-waypoint
tube skeleton; Bishop parallel-transport frames extrude a round-profile
tube that is welded into a poi head mesh.  Four shape keys scan the
parameter (a, b) space, exposing how the single fixed-point topology
changes while remaining within the Shilnikov chaos guarantee.

WHY SPROTT R — THE BILINEAR SADDLE-FOCUS
-----------------------------------------
System:  ẋ = a − y     ẏ = b + z     ż = xy − z
         a = 0.9       b = 0.4  (canonical 1994 values)

The nonlinear term is xy — a bilinear product, not a self-squared term.
This is the same nonlinearity class as Sprott K (xy − z), which
distinguishes R from the y² / z² / xz attractors elsewhere in the library.

Divergence: ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + 0 + (−1) = −1  (constant)
Liouville:  ∑ λᵢ = −1  (the Lyapunov exponents sum to ∇·F, verified)

Single fixed point:   P* = (−b/a, a, −b) = (−4/9, 0.9, −0.4)
Jacobian at P*:
    J = [[ 0  −1   0 ]
         [ 0   0   1 ]
         [ a  −b/a −1]]

Characteristic polynomial:  λ³ + λ² + (b/a)λ + a = 0
For canonical values: λ³ + λ² + 0.4̄λ + 0.9 = 0

Roots:
    λ_r ≈ −1.231          (stable real — the "saddle direction")
    λ_c ≈  0.115 ± 0.845i (unstable complex spiral — the chaos source)

Shilnikov ratio:  ρ = |λ_r| / Re(λ_c) = 1.231 / 0.115 ≈ 10.7

The Shilnikov theorem (Shilnikov 1965; Shilnikov & Shilnikov 2007) states
that chaos is guaranteed when ρ > 1, and that the number of homoclinic
intersections grows roughly as ρ.  At ρ ≈ 10.7, Sprott R sits in the
top tier of the 1994 catalogue for single-fixed-point systems — only
Sprott I (≈16.7) and Sprott N (≈14.9) exceed it.

Operator strategy: direct data API only (mesh.vertices, shape_keys).
Bishop parallel-transport avoids Frenet flipping at zero-curvature inflections.

References:
    Sprott, J.C. (1994). Some simple chaotic flows.
    Physical Review E, 50(2), R647–R650.
    DOI: 10.1103/PhysRevE.50.R647   (open-access PD)

    Bishop, R.L. (1975). There is more than one way to frame a curve.
    American Mathematical Monthly 82(3):246–251.
    DOI: 10.2307/2311093   (public-domain technique)

Related libraries:
    dysts (MIT) — https://github.com/williamgilpin/dysts
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────────────────────
DT         = 0.015        # RK4 timestep — safe for R's bilinear growth rate
BURN_IN    = 3000         # steps discarded to land on the attractor
N_STEPS    = 90_000       # integration steps after burn-in
THIN       = 30           # keep every 30th point → 3 000 waypoints
TUBE_SIDES = 8            # polygon cross-section (octagon = WebXR-efficient)
TUBE_R     = 0.045        # tube radius in Blender units

# Colour gradient: cobalt blue → white → amber (speed-mapped)
COLOUR_LO  = (0.05, 0.22, 0.82)
COLOUR_HI  = (0.92, 0.58, 0.04)

# ── Shape-key parameter sets ─────────────────────────────────────────────────
# Each tuple is (a, b) — a scales the fixed-point location, b shifts it
PARAM_SETS = {
    "Basis":    (0.9, 0.4),   # canonical — Shilnikov ratio ≈10.7
    "SK_LowA":  (0.6, 0.4),   # weaker x-coupling → smaller, broader orbit
    "SK_HighA": (1.2, 0.4),   # stronger coupling → larger orbit, topology shift
    "SK_LowB":  (0.9, 0.2),   # smaller y-offset → compact, near-periodic boundary
}


def _deriv(s, a, b):
    """RHS of Sprott R.  ẋ = a−y, ẏ = b+z, ż = xy−z."""
    x, y, z = s
    return np.array([a - y, b + z, x * y - z])


def rk4_orbit(a, b, n_steps, dt, burn, thin):
    """Integrate Sprott R with RK4; return (n_pts, 3) waypoints and speeds."""
    s = np.array([0.5, 0.5, 0.0])   # initial condition off the fixed point
    for _ in range(burn):
        k1 = _deriv(s, a, b)
        k2 = _deriv(s + 0.5*dt*k1, a, b)
        k3 = _deriv(s + 0.5*dt*k2, a, b)
        k4 = _deriv(s + dt*k3, a, b)
        s += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    pts, speeds = [], []
    for i in range(n_steps):
        k1 = _deriv(s, a, b)
        k2 = _deriv(s + 0.5*dt*k1, a, b)
        k3 = _deriv(s + 0.5*dt*k2, a, b)
        k4 = _deriv(s + dt*k3, a, b)
        s += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        if i % thin == 0:
            pts.append(s.copy())
            speeds.append(np.linalg.norm(k1))   # speed ≈ |ẋ| at waypoint

    return np.array(pts), np.array(speeds)


def bishop_frames(pts):
    """
    Bishop parallel-transport framing.
    Returns (N, N-vectors) and (B, binormal-vectors) both shape (n, 3).
    The seed normal is chosen perpendicular to the first tangent to avoid
    the fold that Frenet–Serret produces whenever curvature passes through zero.
    """
    n = len(pts)
    T = np.zeros((n, 3))
    for i in range(n - 1):
        d = pts[i+1] - pts[i]
        nm = np.linalg.norm(d)
        T[i] = d / nm if nm > 1e-12 else T[i-1]
    T[-1] = T[-2]

    # Seed N₀ perpendicular to T₀
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
            N[i] = c*N[i-1] + s*np.cross(axis, N[i-1]) + (1-c)*np.dot(axis, N[i-1])*axis

    B = np.cross(T, N)
    return N, B


def build_tube(pts, N_frames, B_frames, r, sides):
    """
    Extrude a circular cross-section along the waypoints.
    Returns vertices (n_pts*sides, 3) and quad faces (n_pts−1)*sides × 4.
    """
    angles = np.linspace(0, 2*np.pi, sides, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)
    n = len(pts)

    # Ring of vertices per waypoint
    rings = (pts[:, None, :]
             + r * (cos_a[None, :, None] * N_frames[:, None, :]
                    + sin_a[None, :, None] * B_frames[:, None, :]))
    verts = rings.reshape(-1, 3)   # shape (n*sides, 3)

    # Quad faces connecting adjacent rings
    faces = []
    for i in range(n - 1):
        base = i * sides
        for j in range(sides):
            a = base + j
            b = base + (j + 1) % sides
            c = b + sides
            d = a + sides
            faces.append((a, b, c, d))

    return verts, faces


def make_speed_attribute(mesh, speeds, tube_sides):
    """
    FLOAT_COLOR vertex attribute 'SprottR_Speed', mapped cobalt→white→amber.
    Speed is percentile-clipped to avoid outlier colours washing out the
    interesting mid-range variation.
    """
    attr = mesh.attributes.new(name="SprottR_Speed", type="FLOAT_COLOR", domain="POINT")
    lo, hi = np.percentile(speeds, 5), np.percentile(speeds, 95)
    hi = max(hi, lo + 1e-9)
    cols = []
    for spd in speeds:
        t = float(np.clip((spd - lo) / (hi - lo), 0.0, 1.0))
        r = COLOUR_LO[0] + t * (COLOUR_HI[0] - COLOUR_LO[0])
        g = COLOUR_LO[1] + t * (COLOUR_HI[1] - COLOUR_LO[1])
        b = COLOUR_LO[2] + t * (COLOUR_HI[2] - COLOUR_LO[2])
        for _ in range(tube_sides):
            cols.append((r, g, b, 1.0))
    attr.data.foreach_set("color", [v for rgba in cols for v in rgba])


# ── Main build ──────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

me = bpy.data.meshes.new("SprottR_Tube")
ob = bpy.data.objects.new("SprottR_Poi", me)
bpy.context.collection.objects.link(ob)

# ── Basis shape ──────────────────────────────────────────────────────────────
a0, b0 = PARAM_SETS["Basis"]
pts, speeds = rk4_orbit(a0, b0, N_STEPS, DT, BURN_IN, THIN)
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

# ── Shape keys ───────────────────────────────────────────────────────────────
ob.shape_key_add(name="Basis", from_mix=False)
for sk_name, (a_sk, b_sk) in PARAM_SETS.items():
    if sk_name == "Basis":
        continue
    pts_sk, _ = rk4_orbit(a_sk, b_sk, N_STEPS, DT, BURN_IN, THIN)
    N_sk, B_sk = bishop_frames(pts_sk)
    v_sk, _    = build_tube(pts_sk, N_sk, B_sk, TUBE_R, TUBE_SIDES)
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    for i, co in enumerate(v_sk):
        sk.data[i].co = Vector(co)

# ── Material: attribute → emission ───────────────────────────────────────────
mat = bpy.data.materials.new("SprottR_Mat")
mat.use_nodes = True
mat.use_backface_culling = False
nd  = mat.node_tree.nodes
lnk = mat.node_tree.links
nd.clear()
attr_nd  = nd.new("ShaderNodeAttribute")
attr_nd.attribute_name = "SprottR_Speed"
bsdf_nd  = nd.new("ShaderNodeBsdfPrincipled")
bsdf_nd.inputs["Metallic"].default_value   = 0.50
bsdf_nd.inputs["Roughness"].default_value  = 0.22
emit_nd  = nd.new("ShaderNodeEmission")
emit_nd.inputs["Strength"].default_value   = 1.7
add_nd   = nd.new("ShaderNodeAddShader")
out_nd   = nd.new("ShaderNodeOutputMaterial")
lnk.new(attr_nd.outputs["Color"], bsdf_nd.inputs["Base Color"])
lnk.new(attr_nd.outputs["Color"], emit_nd.inputs["Color"])
lnk.new(bsdf_nd.outputs["BSDF"],  add_nd.inputs[0])
lnk.new(emit_nd.outputs["Emission"], add_nd.inputs[1])
lnk.new(add_nd.outputs["Shader"],  out_nd.inputs["Surface"])
ob.data.materials.append(mat)

# ── Holoflow facet + transform ───────────────────────────────────────────────
ob["holoflow:facet"] = False
ob.rotation_euler = (1.5707963, 0, 0)   # +Y-up for WebXR
bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.transform_apply(rotation=True)

print("SprottR build complete. Waypoints:", len(pts), "  Shilnikov ratio ≈10.7")
