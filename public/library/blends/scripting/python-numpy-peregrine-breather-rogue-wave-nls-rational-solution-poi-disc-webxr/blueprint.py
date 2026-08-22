"""
Peregrine Breather — Doubly-Localised Rational Solution to 1D NLS
=================================================================
Howell Peregrine (1983): exact analytical rogue-wave solution to the
focusing Nonlinear Schrödinger equation (NLS).

The NLS equation:   i Ψ_t + ½ Ψ_xx + |Ψ|² Ψ = 0

Peregrine ansatz:
    Ψ_P(x,t) = [1 − 4(1+2it) / D(x,t)] · e^{it}
    D(x,t)   = 1 + 4x² + 4t²

Modulus squared:
    |Ψ_P|² = [(D−4)² + 64t²] / D²

Boundary behaviour:
    |Ψ_P(x,t)| → 1  as  (x,t) → ∞   (plane-wave background)
    |Ψ_P(0,0)| = 3                    (rogue peak: triple the background)

This is the unique rational, doubly-localised solution of the NLS hierarchy.
The amplitude ratio 3:1 is an exact, parameter-free result — it does not
depend on any free constant the way soliton amplitude does.

Blueprint renders the amplitude landscape |Ψ_P(x,t)| on an 80×80 planar
grid as a poi disc for WebXR export.

SHAPE KEYS
    Basis       full landscape (mathematical x,t ∈ [−4.5, +4.5])
    SK_Flat     background plane at z = HEIGHT_SCALE (|Ψ|=1 far-field)
    SK_Perturb  background subtracted: z = (|Ψ_P|−1)·HEIGHT_SCALE
    SK_Narrow   t-axis compressed ×0.4 — shows the spatial ridge profile
    SK_Wide     t-axis stretched ×2.0 — reveals slow algebraic decay

VERTEX COLOUR  (FLOAT_COLOR POINT attribute "Peregrine_Amp")
    cobalt   → |Ψ_P| = 1.0  (background)
    amber    → |Ψ_P| = 2.0  (half-way up)
    crimson  → |Ψ_P| = 3.0  (rogue peak)

Blender 5.1 · bpy direct-API · NumPy vectorised.

Usage:
    blender --background --python blueprint.py
    # or paste into Blender Scripting editor and press Run Script
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─────────────────────────── parameters ────────────────────────────────────
SLUG          = "hf_peregrine_poi"
N             = 80            # vertices per side of the grid (N×N)
X_HALF        = 4.5           # mathematical x domain half-width
T_HALF        = 4.5           # mathematical t domain half-width
PHYS_SIZE     = 1.0           # physical edge length of the mesh (metres)
HEIGHT_SCALE  = 0.22          # z-scale: background → 0.22 m, peak → 0.66 m

# colour stops  (r, g, b, a)  in linear sRGB
COL_COBALT  = (0.02, 0.12, 0.60, 1.0)
COL_AMBER   = (0.90, 0.55, 0.05, 1.0)
COL_CRIMSON = (0.75, 0.04, 0.10, 1.0)

# ──────────────────── analytical Peregrine field ────────────────────────────
xs = np.linspace(-X_HALF, X_HALF, N)
ts = np.linspace(-T_HALF, T_HALF, N)
XX, TT = np.meshgrid(xs, ts, indexing="ij")   # shape (N, N)

# D(x,t) = 1 + 4x² + 4t²
D = 1.0 + 4.0 * XX**2 + 4.0 * TT**2

# |Ψ_P|² = [(D−4)² + 64t²] / D²
#   Why not expand the complex modulus directly?  Because numpy complex
#   division accumulates rounding error near (0,0); the real formula is exact.
amp2 = ((D - 4.0)**2 + 64.0 * TT**2) / (D**2)
amp  = np.sqrt(np.clip(amp2, 0.0, None))  # |Ψ_P| ∈ [0, 3], theoretically ≥ 0

# ─────────────────────── physical vertex positions ──────────────────────────
# Map mathematical (x,t) → physical (px,py) so the disc is PHYS_SIZE across.
scale_xy = PHYS_SIZE / (2.0 * max(X_HALF, T_HALF))

PX = XX * scale_xy   # x position in metres
PY = TT * scale_xy   # y position in metres
PZ_basis  = amp * HEIGHT_SCALE

PZ_flat    = np.ones_like(amp) * HEIGHT_SCALE           # SK_Flat
PZ_perturb = (amp - 1.0) * HEIGHT_SCALE                 # SK_Perturb
# SK_Narrow: compress t-axis by 0.4 — same amplitude, t→t·0.4 in maths
D_narrow   = 1.0 + 4.0*XX**2 + 4.0*(TT*0.4)**2
amp_narrow = np.sqrt(np.clip(
    ((D_narrow-4.0)**2 + 64.0*(TT*0.4)**2) / D_narrow**2, 0.0, None))
PZ_narrow  = amp_narrow * HEIGHT_SCALE
# SK_Wide: stretch t by 2.0 (slow-decay view, keeps amplitude exact)
D_wide     = 1.0 + 4.0*XX**2 + 4.0*(TT*2.0)**2
amp_wide   = np.sqrt(np.clip(
    ((D_wide-4.0)**2 + 64.0*(TT*2.0)**2) / D_wide**2, 0.0, None))
PZ_wide    = amp_wide * HEIGHT_SCALE

# ─────────────────────── vertex colour (normalised 0→1) ─────────────────────
# c = (|Ψ_P| − 1) / 2  maps 1→0, 2→0.5, 3→1
c = np.clip((amp - 1.0) / 2.0, 0.0, 1.0)   # shape (N,N)

def lerp_col(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * float(t) for i in range(4))

# piece-wise: cobalt→amber for c in [0,0.5], amber→crimson for c in [0.5,1]
vc_flat = np.empty((N * N, 4), dtype=np.float32)
c_flat  = c.ravel()
for vi, cv in enumerate(c_flat):
    if cv <= 0.5:
        vc_flat[vi] = lerp_col(COL_COBALT, COL_AMBER, cv * 2.0)
    else:
        vc_flat[vi] = lerp_col(COL_AMBER, COL_CRIMSON, (cv - 0.5) * 2.0)

# ───────────────────────── build mesh ───────────────────────────────────────
# Delete any previous object with the same name
for obj in bpy.data.objects:
    if obj.name.startswith(SLUG):
        bpy.data.objects.remove(obj, do_unlink=True)
for m in bpy.data.meshes:
    if m.name.startswith(SLUG):
        bpy.data.meshes.remove(m)

mesh = bpy.data.meshes.new(SLUG)
obj  = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)

bm = bmesh.new()

# Add all vertices (row-major: i=x index, j=t index)
verts_2d = [[None]*N for _ in range(N)]
for i in range(N):
    for j in range(N):
        v = bm.verts.new((float(PX[i,j]),
                          float(PY[i,j]),
                          float(PZ_basis[i,j])))
        verts_2d[i][j] = v

bm.verts.ensure_lookup_table()

# Add faces (quads)
for i in range(N - 1):
    for j in range(N - 1):
        bm.faces.new([
            verts_2d[i    ][j    ],
            verts_2d[i + 1][j    ],
            verts_2d[i + 1][j + 1],
            verts_2d[i    ][j + 1],
        ])

bm.to_mesh(mesh)
bm.free()

# ─────────────────────────── shape keys ─────────────────────────────────────
# Basis key must exist before adding others
obj.shape_key_add(name="Basis", from_mix=False)

sk_configs = {
    "SK_Flat":    PZ_flat,
    "SK_Perturb": PZ_perturb,
    "SK_Narrow":  PZ_narrow,
    "SK_Wide":    PZ_wide,
}

for sk_name, pz in sk_configs.items():
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for i in range(N):
        for j in range(N):
            idx = i * N + j
            sk.data[idx].co = Vector((
                float(PX[i, j]),
                float(PY[i, j]),
                float(pz[i, j]),
            ))

# ─────────────────────────── vertex colours ──────────────────────────────────
# FLOAT_COLOR on POINT domain — the correct domain for per-vertex colour in
# Blender 5.1 GLB export (GLTF_COLOR_0).  Using "FLOAT_COLOR" avoids the
# sRGB gamma-bake that BYTE_COLOR applies when reading back.
vcol = mesh.color_attributes.new(
    name="Peregrine_Amp",
    type="FLOAT_COLOR",
    domain="POINT",
)
for vi in range(N * N):
    vcol.data[vi].color = vc_flat[vi].tolist()

# ─────────────────────────── shading & tags ──────────────────────────────────
mesh.shade_flat()
if "holoflow:facet" not in obj:
    obj["holoflow:facet"] = True

# Set origin to geometry centre
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.origin_set(type="ORIGIN_CENTER_OF_MASS", center="BOUNDS")

print(f"[Peregrine] {SLUG} built: {N*N} verts, peak amplitude 3×.")
print(f"  Basis z range: [{PZ_basis.min():.4f}, {PZ_basis.max():.4f}] m")
print(f"  Background z:  {HEIGHT_SCALE:.4f} m")
