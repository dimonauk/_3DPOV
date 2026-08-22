"""
Python bpy — Lattice Boltzmann D2Q9 Fluid:
BGK Streaming-Collision for Kármán Vortex Street
& Poi Wake Visualisation (Blender 5.1)
=========================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

The Lattice Boltzmann Method (LBM) simulates incompressible fluid dynamics
through the kinetic theory of a fictitious particle gas on a regular lattice.
Rather than solving Navier-Stokes directly, each lattice node stores nine
distribution functions f_i representing the probability flux in each of the
nine D2Q9 discrete velocity directions.

BGK collision operator (Bhatnagar, Gross, Krook 1954 — Public Domain):
    f_i(x, t+1) = f_i(x,t) − (f_i − f_i^eq) / τ

    τ  = relaxation time     kinematic viscosity ν = (τ−0.5)/3 (lattice units)
    f_i^eq = w_i ρ [ 1 + 3(e_i·u) + 9/2(e_i·u)² − 3/2|u|² ]

Macroscopic quantities:   ρ = Σᵢ fᵢ     u = (Σᵢ fᵢ eᵢ) / ρ

Streaming step: each fᵢ propagates one lattice cell per frame in direction eᵢ,
implemented as numpy.roll along the appropriate axis.

Kármán vortex street: a cylinder at Re ≈ 96 sheds alternating counter-rotating
vortices — the same wake structure that makes a spinning poi head appear as a
living flame. Vorticity ω = ∂uy/∂x − ∂ux/∂y is colour-mapped blue→white→red
as a per-vertex FLOAT_COLOR attribute, updated live via a frame_change_pre
handler.  The handler does one BGK step per frame — play back at 1× to see the
vortex street develop from ≈frame 80 onward.

Outside sources:
  PyLBM  BSD-3-Clause  Loïc Gouarin et al.
    https://github.com/pylbm/pylbm
    related: pylbm/pylbm-doc · pylbm/pylbm-gallery
  Blender Foundation Python API 5.1  CC-BY-SA 4.0
    https://docs.blender.org/api/5.1/bpy.types.Mesh.html
    related: projects.blender.org/blender/blender
"""

import math, bpy, numpy as np

# ── Parameters ───────────────────────────────────────────────────────────────
NX        = 160     # grid columns
NY        =  80     # grid rows
TAU       = 0.55    # BGK relaxation time → ν = (0.55−0.5)/3 ≈ 0.0167 l.u.
U_INFLOW  = 0.10    # left-wall inflow speed (lattice units; keep ≤ 0.15)
OBS_CX    = 30      # obstacle centre column
OBS_CY    = NY // 2 # obstacle centre row
OBS_R     = 8       # obstacle radius (lattice cells); D=16, Re≈96
VOR_MAX   = 0.025   # vorticity saturation for colour ramp  (±VOR_MAX)
CELL_M    = 0.04    # metres per lattice cell → 6.4 m × 3.2 m domain
FRAME_END = 360
WARMUP    = 80      # BGK steps before frame 1 to seed the asymmetry
SLUG      = "python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr"

# ── D2Q9 velocity set ────────────────────────────────────────────────────────
#   6  2  5      e_i = (EX[i], EY[i]) · lattice units / step
#   3  0  1      weights W: 4/9 (rest), 1/9 (axis), 1/36 (diagonal)
#   7  4  8
EX  = np.array([ 0, 1, 0,-1, 0, 1,-1,-1, 1], np.float64)
EY  = np.array([ 0, 0, 1, 0,-1, 1, 1,-1,-1], np.float64)
W   = np.array([4/9,1/9,1/9,1/9,1/9,1/36,1/36,1/36,1/36], np.float64)
OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6]   # opposite-direction indices (bounce-back)

# Precomputed inflow equilibrium (ρ=1, u=(U_INFLOW,0)) — shape (9,)
_eu_in  = 3.0 * EX * U_INFLOW
F_EQ_IN = W * (1.0 + _eu_in + 0.5*_eu_in**2 - 1.5*U_INFLOW**2)

# Module-level simulation state — updated by frame handler
F   = None   # shape (9, NY, NX) float64 distribution functions
OBS = None   # shape (NY, NX) bool obstacle mask


# ── Physics ──────────────────────────────────────────────────────────────────

def _feq(rho, ux, uy):
    """Equilibrium distribution f_i^eq.  Inputs/output: (NY,NX) → (9,NY,NX)."""
    eu = 3.0 * (EX[:,None,None]*ux[None] + EY[:,None,None]*uy[None])
    return W[:,None,None] * rho[None] * (1.0 + eu + 0.5*eu**2 - 1.5*(ux**2+uy**2)[None])


def lbm_step(f, obs):
    """One LBM step: BGK collision → streaming → boundary conditions."""
    rho = f.sum(0)
    np.maximum(rho, 1e-10, out=rho)                           # guard ÷0
    ux  = (f[1]+f[5]+f[8] - f[3]-f[6]-f[7]) / rho
    uy  = (f[2]+f[5]+f[6] - f[4]-f[7]-f[8]) / rho

    # BGK: relax toward equilibrium with rate 1/τ
    f_post = f - (f - _feq(rho, ux, uy)) / TAU

    # Streaming: f_post[i][j,k] propagates one step in direction e_i
    # For slice f_post[i] with shape (NY,NX): axis=0→y, axis=1→x
    fn      = np.empty_like(f_post)
    fn[0]   = f_post[0]
    fn[1]   = np.roll(f_post[1],  1, 1)                       # +x
    fn[2]   = np.roll(f_post[2],  1, 0)                       # +y
    fn[3]   = np.roll(f_post[3], -1, 1)                       # −x
    fn[4]   = np.roll(f_post[4], -1, 0)                       # −y
    fn[5]   = np.roll(np.roll(f_post[5],  1, 1),  1, 0)       # +x+y
    fn[6]   = np.roll(np.roll(f_post[6], -1, 1),  1, 0)       # −x+y
    fn[7]   = np.roll(np.roll(f_post[7], -1, 1), -1, 0)       # −x−y
    fn[8]   = np.roll(np.roll(f_post[8],  1, 1), -1, 0)       # +x−y

    # Obstacle bounce-back: reverse each distribution at solid nodes
    for i, opp in enumerate(OPP):
        fn[i][obs] = f_post[opp][obs]

    # Left inflow: equilibrium at (ρ=1, U_INFLOW) — same for every row
    fn[:, :, 0] = F_EQ_IN[:, None]

    # Right outflow: zero-gradient Neumann copy
    fn[:, :, -1] = fn[:, :, -2]

    return fn


def _macroscopic(f):
    rho = f.sum(0); np.maximum(rho, 1e-10, out=rho)
    ux  = (f[1]+f[5]+f[8] - f[3]-f[6]-f[7]) / rho
    uy  = (f[2]+f[5]+f[6] - f[4]-f[7]-f[8]) / rho
    return ux, uy


# ── Colour mapping ────────────────────────────────────────────────────────────

def _vorticity_rgba(ux, uy, obs):
    """Map vorticity ω → blue-white-red RGBA flat array (length 4·NX·NY)."""
    omega = np.gradient(uy, axis=1) - np.gradient(ux, axis=0)
    t = np.clip(omega / (2.0*VOR_MAX) + 0.5, 0.0, 1.0)       # 0=CW red · 1=CCW blue
    r = np.where(t < 0.5, 1.0, 2.0*(1.0-t)).ravel().astype(np.float32)
    g = (1.0 - np.abs(t - 0.5)*2.0).ravel().astype(np.float32)
    b = np.where(t > 0.5, 1.0, 2.0*t).ravel().astype(np.float32)
    obs_f = obs.ravel()
    r[obs_f] = g[obs_f] = b[obs_f] = 0.04                     # obstacle → near-black
    n = NX * NY
    rgba = np.empty(n*4, np.float32)
    rgba[0::4], rgba[1::4], rgba[2::4], rgba[3::4] = r, g, b, 1.0
    return rgba


def _write_colours(mesh, ux, uy, obs):
    mesh.attributes['Col'].data.foreach_set('color', _vorticity_rgba(ux, uy, obs))
    mesh.update()


# ── Frame handler ─────────────────────────────────────────────────────────────

def lbm_handler(scene):
    global F, OBS
    if F is None:
        return
    obj = bpy.data.objects.get('LBM_Flow')
    if obj is None:
        return
    F = lbm_step(F, OBS)
    _write_colours(obj.data, *_macroscopic(F), OBS)


# ── Scene construction ────────────────────────────────────────────────────────

def _obstacle_mask():
    jj, ii = np.mgrid[0:NY, 0:NX]
    return (ii - OBS_CX)**2 + (jj - OBS_CY)**2 <= OBS_R**2


def _build_mesh():
    me = bpy.data.meshes.new('lbm_flow')
    verts = [(i*CELL_M, j*CELL_M, 0.0) for j in range(NY) for i in range(NX)]
    faces = [(j*NX+i, j*NX+i+1, (j+1)*NX+i+1, (j+1)*NX+i)
             for j in range(NY-1) for i in range(NX-1)]
    me.from_pydata(verts, [], faces)
    me.attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    return me


def _build_material():
    mat = bpy.data.materials.new('lbm_flow')
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    attr = nt.nodes.new('ShaderNodeAttribute');  attr.attribute_name = 'Col'
    emit = nt.nodes.new('ShaderNodeEmission');   emit.inputs['Strength'].default_value = 3.5
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def setup():
    global F, OBS

    for o in list(bpy.data.objects):   bpy.data.objects.remove(o,  do_unlink=True)
    for m in list(bpy.data.meshes):    bpy.data.meshes.remove(m)
    for ma in list(bpy.data.materials):bpy.data.materials.remove(ma)

    OBS = _obstacle_mask()

    # Initialise f at inflow equilibrium everywhere
    rho0 = np.ones((NY, NX)); ux0 = np.full((NY,NX), U_INFLOW); uy0 = np.zeros((NY,NX))
    F = _feq(rho0, ux0, uy0)

    # Warmup steps — break left-right symmetry so vortex street can develop
    for _ in range(WARMUP):
        F = lbm_step(F, OBS)

    me  = _build_mesh()
    mat = _build_material(); me.materials.append(mat)
    obj = bpy.data.objects.new('LBM_Flow', me)
    bpy.context.collection.objects.link(obj)

    # Orthographic camera — top-down over the XY flow domain
    cd = bpy.data.cameras.new('Cam'); cd.type = 'ORTHO'
    cd.ortho_scale = NY * CELL_M * 1.08          # height with small padding
    cam = bpy.data.objects.new('Camera', cd)
    cam.location     = (NX*CELL_M/2, NY*CELL_M/2, 14.0)
    cam.rotation_euler = (0.0, 0.0, 0.0)          # looks −Z (downward)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    bpy.context.scene.world.use_nodes = True
    bpy.context.scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.0

    sc = bpy.context.scene
    sc.frame_end = FRAME_END
    sc.render.engine             = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x       = 1920
    sc.render.resolution_y       = 960
    sc.render.film_transparent   = False
    sc.eevee.use_bloom           = True
    sc.eevee.bloom_threshold     = 0.3
    sc.eevee.bloom_intensity     = 0.4

    _write_colours(me, *_macroscopic(F), OBS)

    if lbm_handler not in bpy.app.handlers.frame_change_pre:
        bpy.app.handlers.frame_change_pre.append(lbm_handler)

    re = U_INFLOW * 2*OBS_R / ((TAU-0.5)/3.0)
    print(f"[{SLUG}] grid {NX}×{NY}  Re≈{re:.0f}  τ={TAU}  warmup={WARMUP}")
    print(f"  Press Space in Rendered shading — vortex street appears ~frame 80")


setup()
