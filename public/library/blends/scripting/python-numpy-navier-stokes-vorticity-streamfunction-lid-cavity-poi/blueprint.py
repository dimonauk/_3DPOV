"""
holoflow/blends/scripting/python-numpy-navier-stokes-vorticity-streamfunction-lid-cavity-poi
Blender 5.1 — Python + numpy

2D Incompressible Navier-Stokes via Vorticity-Streamfunction:
Lid-Driven Cavity → Steady-State Streamlines as Poi Light-Painting Ribbons

Technique
---------
The incompressible 2D NS equations are recast in terms of two scalar fields:

  ω  =  ∂v/∂x − ∂u/∂y          vorticity (spin density, z-component of curl u)
  ψ  where  u = ∂ψ/∂y,  v = −∂ψ/∂x   streamfunction (auto-enforces ∇·u = 0)

This eliminates the pressure–velocity coupling entirely.  The two PDEs are:

  ∇²ψ = −ω                                  (Poisson — solved by SOR iteration)
  ∂ω/∂t + u·∂ω/∂x + v·∂ω/∂y = ν·∇²ω       (vorticity transport — Euler march)

Boundary setup: unit-square cavity, three static no-slip walls, top lid at
u = U_LID, v = 0.  All streamfunction boundaries fixed at ψ = 0 (closed loop).

At Re = 400 the cavity reaches a steady state dominated by one primary
recirculation vortex plus two small corner eddies (Ghia et al. 1982).
Traced streamlines become bevel-profile poi-ribbon curves for WebXR export.
"""

import numpy as np
import bpy
import mathutils

# ── PARAMETERS ─────────────────────────────────────────────────────────────
N            = 64          # grid side (N×N);  64 ↔ ~25 s on a modern CPU
RE           = 400         # Reynolds number U·L/ν  (< ~7400 → steady state)
U_LID        = 1.0         # top-lid x-velocity (velocity scale, L=1)
N_STEPS      = 8000        # explicit-Euler time steps
POISSON_IT   = 40          # SOR sweeps per transport step (inner loop)
SOR_W        = 1.85        # over-relaxation factor; near-optimal ≈ 2 − π/N
DT           = 4.0e-4      # time step — satisfies both CFL and diffusion limits
N_STREAMS    = 22          # streamlines seeded from left inlet x = 0.05
N_TRACE      = 800         # Euler steps per streamline
DS_TARGET    = 0.0018      # arc-length increment (normalises fast / slow regions)
BEVEL_D      = 0.012       # ribbon bevel radius  (world units after scaling)
BEVEL_RES    = 2
OBJ_PREFIX   = "ns_poi"
# ───────────────────────────────────────────────────────────────────────────

h    = 1.0 / (N - 1)           # grid spacing (unit square, L = 1)
nu   = U_LID / RE              # kinematic viscosity from Re definition
h2   = h * h

print(f"NS lid-cavity  N={N}  Re={RE}  ν={nu:.6f}  h={h:.5f}")
print(f"Diffusion CFL  dt_max={h2/(4.0*nu):.5f}   using DT={DT}")


# ── SOR POISSON SOLVER  ∇²ψ = −ω ──────────────────────────────────────────
# Gauss-Seidel successive over-relaxation solves the discrete Poisson equation
#   ψ[i,j] = ¼·(ψ[i±1,j] + ψ[i,j±1] + h²·ω[i,j])
# SOR_W accelerates convergence; the near-optimal value on a square grid is
# 2 − π/N.  All four boundary rows are fixed at ψ = 0 (closed streamlines).
def poisson_sor(psi: np.ndarray, omega: np.ndarray) -> np.ndarray:
    rhs = omega[1:-1, 1:-1]
    for _ in range(POISSON_IT):
        p     = psi[1:-1, 1:-1]
        nbrs  = (psi[:-2,  1:-1] + psi[2:,   1:-1]
               + psi[1:-1,  :-2] + psi[1:-1,  2:])
        gs    = 0.25 * (nbrs + h2 * rhs)
        psi[1:-1, 1:-1] = (1.0 - SOR_W) * p + SOR_W * gs
    return psi


# ── VELOCITY FIELD FROM STREAMFUNCTION ────────────────────────────────────
# u =  ∂ψ/∂y   v = −∂ψ/∂x   (central differences on interior)
# The top row is forced to the lid velocity exactly — central difference
# there gives a slightly smeared value because ψ is zero at the lid.
def velocity(psi: np.ndarray):
    u = np.zeros((N, N));  v = np.zeros((N, N))
    u[:, 1:-1] = (psi[:, 2:] - psi[:, :-2]) / (2.0 * h)
    v[1:-1, :] = -(psi[2:, :] - psi[:-2, :]) / (2.0 * h)
    u[:, -1]   = U_LID          # enforce lid boundary exactly
    return u, v


# ── VORTICITY BOUNDARY CONDITIONS (Thom 1933) ──────────────────────────────
# Taylor-expand ψ around each wall (ψ_wall = 0, ψ_adjacent = first interior).
# For a static no-slip wall:  ω_wall ≈ −2·ψ_adjacent / h²
# For the sliding top lid (u_wall = U_LID):  +extra term −2·U_LID / h
def apply_bc(omega: np.ndarray, psi: np.ndarray) -> np.ndarray:
    inv_h2 = 2.0 / h2
    omega[:,  0] = -inv_h2 * psi[:,  1]                        # bottom (static)
    omega[:, -1] = -inv_h2 * psi[:, -2] - 2.0 * U_LID / h    # top lid
    omega[0,  :] = -inv_h2 * psi[1,  :]                        # left (static)
    omega[-1, :] = -inv_h2 * psi[-2, :]                        # right (static)
    return omega


# ── UPWIND VORTICITY TRANSPORT ─────────────────────────────────────────────
# Central-difference advection is unstable at moderate Re (upwind diffusion
# needed).  First-order upwind selects backward or forward stencil from the
# local velocity sign — diffusive but unconditionally stable at any Re.
# Viscous diffusion uses the standard centred 5-point Laplacian.
def transport(omega: np.ndarray, u: np.ndarray, v: np.ndarray) -> np.ndarray:
    oc  = omega[1:-1, 1:-1]
    ui  = u[1:-1, 1:-1];  vi = v[1:-1, 1:-1]

    dox_bwd = (oc - omega[:-2,  1:-1]) / h        # (ω[i]   − ω[i−1]) / h
    dox_fwd = (omega[2:,  1:-1] - oc)  / h        # (ω[i+1] − ω[i])   / h
    adv_x   = np.where(ui > 0, ui * dox_bwd, ui * dox_fwd)

    doy_bwd = (oc - omega[1:-1,  :-2]) / h
    doy_fwd = (omega[1:-1, 2:]  - oc)  / h
    adv_y   = np.where(vi > 0, vi * doy_bwd, vi * doy_fwd)

    lap = (omega[2:,  1:-1] + omega[:-2, 1:-1]
         + omega[1:-1, 2:]  + omega[1:-1, :-2]
         - 4.0 * oc) / h2

    new_w              = omega.copy()
    new_w[1:-1, 1:-1] += DT * (nu * lap - adv_x - adv_y)
    return new_w


# ── TIME MARCH ─────────────────────────────────────────────────────────────
psi   = np.zeros((N, N))
omega = np.zeros((N, N))

for step in range(N_STEPS):
    psi   = poisson_sor(psi, omega)
    u, v  = velocity(psi)
    omega = transport(omega, u, v)
    omega = apply_bc(omega, psi)
    if (step + 1) % 1000 == 0:
        res = float(np.max(np.abs(omega[1:-1, 1:-1])))
        print(f"  step {step+1:5d}  |ω|_max = {res:.4f}")

print("Time march complete.  Building velocity field …")
u, v = velocity(psi)


# ── BILINEAR SAMPLER ───────────────────────────────────────────────────────
# Interpolate field (axis-0 = x, axis-1 = y) at fractional grid position.
def sample(field: np.ndarray, px: float, py: float) -> float:
    xi  = max(0.0, min(px * (N - 1), N - 1.001))
    yi  = max(0.0, min(py * (N - 1), N - 1.001))
    i0  = int(xi);  i1 = i0 + 1
    j0  = int(yi);  j1 = j0 + 1
    tx  = xi - i0;  ty = yi - j0
    return ((1-tx)*(1-ty)*field[i0, j0] + tx*(1-ty)*field[i1, j0]
          + (1-tx)* ty  *field[i0, j1] + tx* ty   *field[i1, j1])


# ── STREAMLINE TRACING ─────────────────────────────────────────────────────
# Seeds are evenly spaced in y along the left interior band (x = 0.05).
# Arc-length–normalised Euler: step_size = DS_TARGET / |vel| so slow
# corner eddies trace fine detail while the fast main vortex strides further.
streams = []
for k in range(N_STREAMS):
    sx  = 0.05
    sy  = 0.10 + k * (0.82 / max(N_STREAMS - 1, 1))
    pts = [(sx, sy)]
    for _ in range(N_TRACE):
        pu = sample(u, sx, sy)
        pv = sample(v, sx, sy)
        spd = max((pu*pu + pv*pv) ** 0.5, 1e-9)
        dt_s = DS_TARGET / spd
        sx  += pu * dt_s
        sy  += pv * dt_s
        if not (0.001 < sx < 0.999 and 0.001 < sy < 0.999):
            break
        pts.append((sx, sy))
    if len(pts) >= 4:
        streams.append(pts)

print(f"Traced {len(streams)} streamlines.")


# ── BLENDER SCENE ──────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

crv               = bpy.data.curves.new(OBJ_PREFIX + "_c", 'CURVE')
crv.dimensions    = '3D'
crv.bevel_depth   = BEVEL_D
crv.bevel_resolution = BEVEL_RES
crv.use_fill_caps = True

# Centre cavity at origin; 1 world-unit = 1 m in the scene
for pts in streams:
    sp = crv.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, (px, py) in enumerate(pts):
        sp.points[i].co = (px - 0.5, py - 0.5, 0.0, 1.0)

obj = bpy.data.objects.new(OBJ_PREFIX, crv)
bpy.context.scene.collection.objects.link(obj)
obj["holoflow:facet"] = True      # studio export flag


# ── EMISSION MATERIAL ──────────────────────────────────────────────────────
mat   = bpy.data.materials.new("ns_ribbon")
mat.use_nodes = True
nd    = mat.node_tree.nodes;  nd.clear()
em    = nd.new("ShaderNodeEmission")
em.inputs["Strength"].default_value = 2.5
em.inputs["Color"].default_value    = (0.04, 0.52, 1.0, 1.0)   # electric blue
out   = nd.new("ShaderNodeOutputMaterial")
mat.node_tree.links.new(em.outputs["Emission"], out.inputs["Surface"])
crv.materials.append(mat)


# ── CAMERA ─────────────────────────────────────────────────────────────────
cam_d = bpy.data.cameras.new("cam")
cam_d.type = 'ORTHO';  cam_d.ortho_scale = 1.1
cam_o = bpy.data.objects.new("cam", cam_d)
bpy.context.scene.collection.objects.link(cam_o)
cam_o.location       = mathutils.Vector((0.0, 0.0, 2.0))
cam_o.rotation_euler = mathutils.Euler((0.0, 0.0, 0.0), 'XYZ')
bpy.context.scene.camera = cam_o
bpy.context.scene.render.resolution_x = 1024
bpy.context.scene.render.resolution_y = 1024

print(f"Scene ready — {len(streams)} poi-ribbon streamlines.")
print("Export: File → Export → glTF 2.0 → hf_lid_cavity.glb")
print("  Options: Draco level 6 · Include: Mesh · Materials: Export")
