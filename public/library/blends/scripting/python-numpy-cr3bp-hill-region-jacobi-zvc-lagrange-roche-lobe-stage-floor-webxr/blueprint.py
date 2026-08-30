"""
blueprint.py — CR3BP Hill Regions & Roche Lobe
================================================
Circular Restricted Three-Body Problem effective potential Ω(x,y) and its
zero-velocity curves (ZVCs / Hill regions) rendered as a height-field stage
floor for WebXR.

Technique in brief:
  In the rotating frame of two massive bodies (here Earth + Moon), a third
  test particle conserves the Jacobi constant  C_J = 2Ω(x,y) − v².
  Setting v = 0 gives the zero-velocity curve 2Ω = C_J, which is the hard
  boundary of accessible space for that energy.  Four shape keys sweep C_J
  through the four critical Jacobi constants at L1–L4, revealing how the
  Hill topology changes: fully-closed Roche lobe → L1 neck opens → L2
  escape route → full tadpole/horseshoe regime.

Parameters at top, loops only for shape-key assignment.
Run from Blender 5.1 Scripting workspace.

Blender 5.1 · licence CC0 · Holoflow Studio
"""

import bpy
import numpy as np

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
MU          = 0.012_150_585   # Earth-Moon mass parameter μ = m_Moon/(m_E+m_M)
NX, NY      = 180, 180        # grid resolution → 32 400 vertices
XMIN, XMAX  = -1.85, 1.85    # normalised units (Earth-Moon distance = 1)
YMIN, YMAX  = -1.40, 1.40
H_SCALE     = 0.32            # vertical scale of height field (Blender units)
SHARPNESS   = 2.8             # tanh sharpness: higher = crisper ZVC ridge
CLAMP_OMEGA = 3.6             # cap Ω to prevent singularity spikes dominating
MESH_NAME   = "CR3BP_Hill_Floor"
OBJ_NAME    = "CR3BP_Hill_Floor"
MAT_NAME    = "CR3BP_Hill_Mat"
ATTR_NAME   = "CR3BP_Omega"   # FLOAT_COLOR vertex attribute


# ── EFFECTIVE POTENTIAL ────────────────────────────────────────────────────────
def omega_grid(xx, yy):
    """Ω(x,y) = ½(x²+y²) + (1-μ)/r₁ + μ/r₂  (rotating-frame potential).

    WHY this form: the centrifugal term ½(x²+y²) and the two gravitational
    wells combine so that the gradient  ∇Ω  equals the net force on a
    co-rotating test particle at rest (v=0).  The Jacobi constant
    C_J = 2Ω − v² is conserved along any trajectory, making Ω the energy
    surface in configuration space.
    """
    r1 = np.sqrt((xx + MU)**2        + yy**2)  # distance from M₁ (Earth, x = −μ)
    r2 = np.sqrt((xx - 1.0 + MU)**2  + yy**2)  # distance from M₂ (Moon, x = 1−μ)
    r1 = np.maximum(r1, 0.025)   # soft clamp; real orbits never touch primaries
    r2 = np.maximum(r2, 0.025)
    return 0.5*(xx**2 + yy**2) + (1.0 - MU)/r1 + MU/r2


def height_field(two_omega, c_jacobi):
    """Map 2Ω into height relative to ZVC.

    WHY tanh: it saturates so singularity peaks don't dominate the mesh.
    Accessible region  (2Ω < C): tanh < 0  → below ground (white floor).
    Forbidden region   (2Ω ≥ C): tanh > 0  → raised walls (amber).
    ZVC  (2Ω = C): z = 0  → the ridge between the two regimes.
    """
    return H_SCALE * np.tanh(SHARPNESS * (two_omega - c_jacobi))


# ── FIND COLLINEAR LAGRANGE POINTS ────────────────────────────────────────────
def quintic_L2(gamma, mu):
    """Szebehely quintic for L2 (beyond the Moon).  Root = γ₂ > 0.
    WHY: L2 satisfies force-balance on the x-axis at x = 1−μ+γ₂.
    Expanded: γ⁵ − (3−μ)γ⁴ + (3−2μ)γ³ − μγ² + 2μγ − μ = 0.
    """
    return np.polyval([1, -(3-mu), (3-2*mu), -mu, 2*mu, -mu], gamma)


def quintic_L1(gamma, mu):
    """Szebehely quintic for L1 (between Earth and Moon at x = 1−μ−γ₁)."""
    return np.polyval([1, (3-mu), (3-2*mu), -mu, -2*mu, -mu], gamma)


def newton_quintic(poly_fn, mu, gamma0, tol=1e-13, steps=80):
    """Newton-Raphson root finder for the libration-point quintics."""
    g = gamma0
    for _ in range(steps):
        f  = poly_fn(g, mu)
        # Finite-difference derivative (avoids computing polyder symbolically)
        df = (poly_fn(g + 1e-8, mu) - poly_fn(g - 1e-8, mu)) / 2e-8
        if abs(df) < 1e-18:
            break
        delta = f / df
        g -= delta
        if abs(delta) < tol:
            break
    return g


# Initial guess from Szebehely (1967): γ ≈ (μ/3)^(1/3)
gamma0 = (MU / 3.0) ** (1.0 / 3.0)

g2 = newton_quintic(quintic_L2, MU, gamma0)   # L2 beyond Moon
g1 = newton_quintic(quintic_L1, MU, gamma0)   # L1 between Earth–Moon

x_L1 = 1.0 - MU - g1
x_L2 = 1.0 - MU + g2
# L3 uses a simpler approximation (opposite side; Szebehely §2.5)
x_L3 = -(1.0 - 7.0 * MU / 12.0)
# L4 / L5: equilateral triangle with both primaries
x_L45 = 0.5 - MU
y_L4  =  0.5 * np.sqrt(3.0)
y_L5  = -0.5 * np.sqrt(3.0)

# Jacobi constants at each Lagrange point (C = 2Ω at v = 0)
C_L1 = 2.0 * float(omega_grid(np.array([x_L1]), np.array([0.0])))
C_L2 = 2.0 * float(omega_grid(np.array([x_L2]), np.array([0.0])))
C_L3 = 2.0 * float(omega_grid(np.array([x_L3]), np.array([0.0])))
C_L4 = 2.0 * float(omega_grid(np.array([x_L45]), np.array([y_L4])))

print(f"[CR3BP] γ₁={g1:.8f}  x_L1={x_L1:.8f}  C_L1={C_L1:.8f}")
print(f"[CR3BP] γ₂={g2:.8f}  x_L2={x_L2:.8f}  C_L2={C_L2:.8f}")
print(f"[CR3BP] x_L3={x_L3:.8f}  C_L3={C_L3:.8f}  C_L4={C_L4:.8f}")

# Shape-key Jacobi-constant targets
# Basis    : slightly above C_L1 → Moon fully enclosed in its Roche lobe
# SK_L1Open: between C_L2 and C_L1 → L1 neck open (Earth-Moon mass transfer)
# SK_L2Open: at C_L2 → L2 escape point reached (outer space connects to Moon)
# SK_Wide  : below C_L4 → all forbidden zones collapse (tadpole/horseshoe orbits)
C_BASIS   = C_L1 + 0.04
C_L1_OPEN = (C_L1 + C_L2) * 0.5
C_L2_OPEN = C_L2 - 0.01
C_WIDE    = C_L4 - 0.06


# ── BUILD GRID ────────────────────────────────────────────────────────────────
xs = np.linspace(XMIN, XMAX, NX, dtype=np.float64)
ys = np.linspace(YMIN, YMAX, NY, dtype=np.float64)
XX, YY = np.meshgrid(xs, ys)              # shapes (NY, NX), row = y, col = x

OM      = omega_grid(XX, YY)
TWO_OM  = np.minimum(2.0 * OM, CLAMP_OMEGA)   # clamped 2Ω; shape (NY, NX)

NV = NX * NY
NF = (NX - 1) * (NY - 1)

# ── VERTEX CO-ORDINATES ───────────────────────────────────────────────────────
z_basis  = height_field(TWO_OM, C_BASIS).ravel().astype(np.float32)
x_flat   = XX.ravel().astype(np.float32)
y_flat   = YY.ravel().astype(np.float32)
# interleave: [x0,y0,z0, x1,y1,z1, ...]
co_flat  = np.column_stack([x_flat, y_flat, z_basis]).ravel()

# ── FACE INDICES (quads) ──────────────────────────────────────────────────────
# Row-major: vertex (row, col) → flat index  row*NX + col
row_idx = np.arange(NY - 1, dtype=np.int32)
col_idx = np.arange(NX - 1, dtype=np.int32)
# Broadcasting: shape (NY-1, NX-1)
base = row_idx[:, None] * NX + col_idx[None, :]
i00 = base.ravel()
i10 = (base + NX).ravel()
i11 = (base + NX + 1).ravel()
i01 = (base + 1).ravel()
# Quad vertex order: i00, i10, i11, i01  → winding matches right-hand normal (+z)
loop_verts = np.column_stack([i00, i10, i11, i01]).ravel()  # (NF*4,)

# ── CREATE MESH ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

me = bpy.data.meshes.new(MESH_NAME)
ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(ob)

me.vertices.add(NV)
me.vertices.foreach_set("co", co_flat.tolist())

me.loops.add(NF * 4)
me.loops.foreach_set("vertex_index", loop_verts.tolist())

me.polygons.add(NF)
me.polygons.foreach_set("loop_start",  (np.arange(NF, dtype=np.int32) * 4).tolist())
me.polygons.foreach_set("loop_total",  [4] * NF)

me.update(calc_edges=True)


# ── SHAPE KEYS ────────────────────────────────────────────────────────────────
# WHY shape keys here: they let a WebXR morph target smoothly animate the
# topology transition between Jacobi-constant regimes so a viewer can
# "open" or "close" the Roche lobe interactively.
ob.shape_key_add(name="Basis", from_mix=False)

for sk_name, c_val in [
    ("SK_L1Open",  C_L1_OPEN),
    ("SK_L2Open",  C_L2_OPEN),
    ("SK_Wide",    C_WIDE),
]:
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    z_sk = height_field(TWO_OM, c_val).ravel().astype(np.float32)
    for idx, vd in enumerate(sk.data):
        vd.co.z = float(z_sk[idx])


# ── FLOAT_COLOR ATTRIBUTE ─────────────────────────────────────────────────────
# Encode the normalised effective potential so the EEVEE shader can display
# the potential well / forbidden zone gradient without UV unwrapping.
attr = me.attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')

om_raw   = TWO_OM.ravel()
om_norm  = (om_raw - om_raw.min()) / (om_raw.max() - om_raw.min() + 1e-9)
COBALT   = np.array([0.067, 0.290, 0.678, 1.0])  # accessible / low Ω
AMBER    = np.array([1.000, 0.553, 0.016, 1.0])  # forbidden / high Ω
colours  = (1.0 - om_norm)[:, None] * COBALT + om_norm[:, None] * AMBER
attr.data.foreach_set("color", colours.ravel().tolist())
me.update()


# ── MATERIAL ──────────────────────────────────────────────────────────────────
mat   = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
nt    = mat.node_tree
nt.nodes.clear()

anode = nt.nodes.new("ShaderNodeAttribute")
anode.attribute_name = ATTR_NAME
anode.attribute_type = 'GEOMETRY'

bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Roughness"].default_value = 0.68
bsdf.inputs["Metallic"].default_value  = 0.12

out   = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(anode.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

me.materials.append(mat)


# ── CUSTOM PROPERTIES ─────────────────────────────────────────────────────────
ob["holoflow:facet"] = True
ob["cr3bp:mu"]       = float(MU)
ob["cr3bp:C_L1"]     = float(C_L1)
ob["cr3bp:C_L2"]     = float(C_L2)
ob["cr3bp:C_L3"]     = float(C_L3)
ob["cr3bp:C_L4"]     = float(C_L4)


# ── CAMERA + SUN ──────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -4.5, 3.2))
cam_ob = bpy.context.object
cam_ob.rotation_euler = (0.88, 0.0, 0.0)
bpy.context.scene.camera = cam_ob

sun_data = bpy.data.lights.new("Sun", type='SUN')
sun_ob   = bpy.data.objects.new("Sun", sun_data)
bpy.context.scene.collection.objects.link(sun_ob)
sun_ob.location    = (2.0, -2.0, 4.5)
sun_data.energy    = 3.0

bpy.context.view_layer.objects.active = ob
ob.select_set(True)

print(f"[CR3BP] Mesh: {NV} verts, {NF} quads. Shape keys: Basis / SK_L1Open / SK_L2Open / SK_Wide")
print("[CR3BP] Blueprint complete. Export → File > Export > glTF 2.0, include shape keys + custom attrs.")
