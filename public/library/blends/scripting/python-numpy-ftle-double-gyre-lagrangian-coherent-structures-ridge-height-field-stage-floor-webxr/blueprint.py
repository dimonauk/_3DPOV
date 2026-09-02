"""
FTLE / Lagrangian Coherent Structures — Double Gyre (Shadden 2005)
Stage-Floor Height-Field for WebXR (Blender 5.1 / bpy)
==========================================================
Finite-Time Lyapunov Exponents (FTLE) reveal hidden transport barriers in
time-dependent flows.  Ridges of the FTLE field are Lagrangian Coherent
Structures — the "skeleton of mixing" that separates fluid parcels with
qualitatively different fates.

Sources (public-domain mathematics):
  Shadden SC, Lekien F, Marsden JE (2005). "Definition and properties of
  Lagrangian coherent structures from finite-time Lyapunov exponents in
  two-dimensional aperiodic flows." Physica D 212(3–4):271–304.
  DOI 10.1016/j.physd.2005.10.007.
  Preprint: https://shaddenlab.berkeley.edu/uploads/LCS-theory.pdf
  [Double-gyre definition, FTLE formula: public domain]

  Haller G, Yuan G (2000). "Lagrangian coherent structures and mixing in
  two-dimensional turbulence." Physica D 147(3–4):352–370.
  DOI 10.1016/S0167-2789(00)00142-1 [PD mathematics]

TECHNIQUE — DOUBLE GYRE FLOW
──────────────────────────────────────────
Domain [0,2] × [0,1].  Stream function:
    ψ(x,y,t) = A·sin(π·f)·sin(π·y)
    f(x,t) = ε·sin(ωt)·x² + (1 − 2ε·sin(ωt))·x

Velocity (no-flux at all walls by construction):
    u = −∂ψ/∂y = −πA·sin(πf)·cos(πy)
    v = +∂ψ/∂x = +πA·cos(πf)·sin(πy)·f′
    f′ = 2ε·sin(ωt)·x + (1 − 2ε·sin(ωt))

At ε=0 two counter-rotating gyres share an exact heteroclinic orbit.
At ε>0 the boundary oscillates, breaking the heteroclinic orbit into a
chaotic transport zone — fluid leaks between gyres along transient lobes.

NUMERICAL FTLE
  1. Seed NX×NY tracers on a regular grid at t=0.
  2. Integrate by T_int using 4th-order Runge–Kutta (forward → repelling LCS;
     backward → attracting LCS).
  3. At each interior grid point compute the 2×2 deformation gradient F
     from central-difference finite differences of final particle positions.
  4. Cauchy-Green tensor C = FᵀF; largest eigenvalue λ_max via 2×2 formula.
  5. FTLE(x,y) = log(√λ_max) / (2·|T_int|)

WHY CAUCHY-GREEN: C measures the maximum stretching of an infinitesimal
material sphere.  log(√λ_max) / T is the time-averaged stretching rate
(Lyapunov exponent) along the most-stretched direction.  Ridges in this
field are exponentially more persistent than generic material lines, making
them the natural "bones" of the flow.

Shape keys:
  Basis    ε=0.10, T=+10  forward FTLE → repelling LCS (mid-channel ridge)
  SK_Bwd   ε=0.10, T=−10  backward FTLE → attracting LCS (lobe boundaries)
  SK_HiEps ε=0.25, T=+10  stronger oscillation → wider chaotic zone
  SK_LongT ε=0.10, T=+20  double integration → finer LCS filaments

holoflow: stage-floor | facet=False | category=scripting
"""

import bpy
import bmesh
import numpy as np

# ── PARAMETERS ─────────────────────────────────────────────────────────────────
NX = 120          # grid columns (x-direction, along gyre width)
NY = 60           # grid rows    (y-direction, across gyre height)

A        = 0.10   # stream-function amplitude  (sets velocity scale)
EPS_STD  = 0.10   # gyre-boundary oscillation  (canonical Shadden 2005)
EPS_HIGH = 0.25   # stronger oscillation for SK_HiEps
OMG      = 2.0 * np.pi / 10.0  # angular frequency  (period T_period=10)

T_FWD  =  10.0    # forward  integration: repelling LCS
T_BWD  = -10.0    # backward integration: attracting LCS
T_LONG =  20.0    # double-length: finer filaments

DT          = 0.025   # RK4 timestep (|DT| < 0.5·Δx / max|u| ≈ 0.28 ok)
HEIGHT_SC   = 2.0     # metres height per FTLE unit (FTLE ≈ 0–0.5 → 0–1 m)
FLOOR_W     = 4.0     # Blender floor width  (x: 0→2 mapped to ±FLOOR_W/2)
FLOOR_H     = 2.0     # Blender floor height (y: 0→1 mapped to ±FLOOR_H/2)
OBJ_NAME    = "FTLE_DoubleGyre"
COLOUR_ATTR = "FTLE_Value"
COBALT = (0.03, 0.15, 0.58, 1.0)
AMBER  = (1.00, 0.65, 0.00, 1.0)


# ── FTLE COMPUTATION ────────────────────────────────────────────────────────────
def compute_ftle(eps: float, T_int: float) -> np.ndarray:
    """Return (NX, NY) array of FTLE values for given ε and integration time."""
    xs = np.linspace(0, 2, NX)
    ys = np.linspace(0, 1, NY)
    # particle positions; shape (NX, NY)
    Xp, Yp = np.meshgrid(xs, ys, indexing='ij')

    t       = 0.0
    dt_step = DT if T_int >= 0 else -DT
    n_steps = int(round(abs(T_int) / abs(DT)))

    def vel(x: np.ndarray, y: np.ndarray, t: float):
        s  = np.sin(OMG * t)
        f  = eps * s * x**2 + (1.0 - 2.0 * eps * s) * x
        fp = 2.0 * eps * s * x + (1.0 - 2.0 * eps * s)
        u  = -np.pi * A * np.sin(np.pi * f) * np.cos(np.pi * y)
        v  =  np.pi * A * np.cos(np.pi * f) * np.sin(np.pi * y) * fp
        return u, v

    for _ in range(n_steps):
        # RK4 — vectorised over the full (NX, NY) grid
        u1, v1 = vel(Xp, Yp, t)
        k  = 0.5 * dt_step
        u2, v2 = vel(Xp + k*u1, Yp + k*v1, t + k)
        u3, v3 = vel(Xp + k*u2, Yp + k*v2, t + k)
        u4, v4 = vel(Xp + dt_step*u3, Yp + dt_step*v3, t + dt_step)
        Xp += (dt_step / 6.0) * (u1 + 2*u2 + 2*u3 + u4)
        Yp += (dt_step / 6.0) * (v1 + 2*v2 + 2*v3 + v4)
        t  += dt_step

    # deformation gradient via central differences
    dx = xs[1] - xs[0]
    dy = ys[1] - ys[0]
    Fxx = np.zeros((NX, NY)); Fxy = np.zeros((NX, NY))
    Fyx = np.zeros((NX, NY)); Fyy = np.zeros((NX, NY))
    # WHY 2·Δx: central difference uses the two neighbours, span = 2Δ
    Fxx[1:-1, :]  = (Xp[2:, :]  - Xp[:-2, :])  / (2 * dx)
    Fxy[:, 1:-1]  = (Xp[:, 2:]  - Xp[:, :-2])  / (2 * dy)
    Fyx[1:-1, :]  = (Yp[2:, :]  - Yp[:-2, :])  / (2 * dx)
    Fyy[:, 1:-1]  = (Yp[:, 2:]  - Yp[:, :-2])  / (2 * dy)

    # Cauchy-Green C = FᵀF (symmetric) — analytic 2×2 eigenvalue
    C11 = Fxx**2 + Fyx**2
    C12 = Fxx*Fxy + Fyx*Fyy
    C22 = Fxy**2 + Fyy**2
    half_tr  = 0.5 * (C11 + C22)
    det      = C11 * C22 - C12**2
    # λ_max = tr/2 + sqrt((tr/2)² − det)
    disc     = np.sqrt(np.maximum(half_tr**2 - det, 0.0))
    lam_max  = half_tr + disc
    ftle     = np.log(np.maximum(np.sqrt(lam_max), 1e-12)) / (2.0 * abs(T_int))
    return np.maximum(ftle, 0.0)   # border is 0 (unmeasured)


# ── MESH CONSTRUCTION ───────────────────────────────────────────────────────────
def build_mesh(ftle_data: np.ndarray) -> bpy.types.Object:
    """Create the floor-mesh object from the Basis FTLE array."""
    xs = np.linspace(-FLOOR_W / 2, FLOOR_W / 2, NX)
    ys = np.linspace(-FLOOR_H / 2, FLOOR_H / 2, NY)
    bm = bmesh.new()
    verts = {}
    for i in range(NX):
        for j in range(NY):
            z = float(ftle_data[i, j]) * HEIGHT_SC
            v = bm.verts.new((xs[i], ys[j], z))
            verts[(i, j)] = v
    # quads: (i,j)-(i+1,j)-(i+1,j+1)-(i,j+1)  right-hand → normal up
    for i in range(NX - 1):
        for j in range(NY - 1):
            bm.faces.new([
                verts[(i,   j)], verts[(i+1, j)],
                verts[(i+1, j+1)], verts[(i,  j+1)],
            ])
    me = bpy.data.meshes.new(OBJ_NAME + "_Mesh")
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


def add_colour(obj: bpy.types.Object, ftle_data: np.ndarray) -> None:
    """Add FLOAT_COLOR attribute interpolated cobalt→amber by FTLE."""
    me = obj.data
    attr = me.attributes.new(COLOUR_ATTR, 'FLOAT_COLOR', 'POINT')
    fmax = float(ftle_data.max()) or 1.0
    flat = ftle_data.ravel(order='C')  # row-major matches vertex order
    colours = []
    for val in flat:
        t = float(val) / fmax
        r = COBALT[0] + t * (AMBER[0] - COBALT[0])
        g = COBALT[1] + t * (AMBER[1] - COBALT[1])
        b = COBALT[2] + t * (AMBER[2] - COBALT[2])
        colours.append((r, g, b, 1.0))
    attr.data.foreach_set("color", [c for col in colours for c in col])


def add_shape_key(obj: bpy.types.Object, name: str, ftle_data: np.ndarray) -> None:
    """Add a shape key driven by a different FTLE field."""
    bpy.ops.object.shape_key_add(from_mix=False)
    sk = obj.data.shape_keys.key_blocks[-1]
    sk.name = name
    xs = np.linspace(-FLOOR_W / 2, FLOOR_W / 2, NX)
    ys = np.linspace(-FLOOR_H / 2, FLOOR_H / 2, NY)
    idx = 0
    for i in range(NX):
        for j in range(NY):
            sk.data[idx].co = (xs[i], ys[j], float(ftle_data[i, j]) * HEIGHT_SC)
            idx += 1


def add_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(OBJ_NAME + "_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    attr  = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = COLOUR_ATTR
    emit  = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = 1.6
    bsdf  = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value    = 0.40
    bsdf.inputs['Roughness'].default_value   = 0.35
    mix   = nt.nodes.new('ShaderNodeMixShader')
    mix.inputs['Fac'].default_value = 0.55
    out   = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(emit.outputs['Emission'], mix.inputs[1])
    nt.links.new(bsdf.outputs['BSDF'],     mix.inputs[2])
    nt.links.new(mix.outputs['Shader'],    out.inputs['Surface'])
    obj.data.materials.append(mat)


# ── MAIN ────────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

print("Computing Basis FTLE (ε=0.10, T=+10) …")
ftle_basis   = compute_ftle(EPS_STD, T_FWD)
print(f"  FTLE range: {ftle_basis.min():.4f} – {ftle_basis.max():.4f}")

obj = build_mesh(ftle_basis)
add_colour(obj, ftle_basis)

# Basis shape key (reference)
bpy.ops.object.shape_key_add(from_mix=False)
obj.data.shape_keys.key_blocks[-1].name = "Basis"

print("Computing SK_Bwd (backward FTLE, attracting LCS) …")
add_shape_key(obj, "SK_Bwd",   compute_ftle(EPS_STD,  T_BWD))
print("Computing SK_HiEps (ε=0.25) …")
add_shape_key(obj, "SK_HiEps", compute_ftle(EPS_HIGH, T_FWD))
print("Computing SK_LongT (T=+20) …")
add_shape_key(obj, "SK_LongT", compute_ftle(EPS_STD,  T_LONG))

add_material(obj)

# Holoflow metadata
obj["holoflow:facet"]    = False
obj["holoflow:category"] = "stage-floor"
obj["holoflow:topic"]    = "scripting"

# +Y-up: apply a -90° rotation so the floor is horizontal in WebXR (+Y up)
obj.rotation_euler = (-1.5707963, 0, 0)
bpy.ops.object.transform_apply(rotation=True)

# GLB export (Draco 6, WebP)
glb_path = bpy.path.abspath("//ftle_double_gyre_floor.glb")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_colors=True,
    export_morph=True,
    export_image_format='WEBP',
)
print(f"Exported → {glb_path}")
print("Done.  Save as ftle_double_gyre_floor.blend")
