"""
Fermi–Pasta–Ulam–Tsingou  α-FPU Anharmonic Chain  (Blender 5.1)
=================================================================
Fermi, E.; Pasta, J.; Ulam, S.; Tsingou, M. (1955). "Studies of Nonlinear
Problems." Los Alamos Scientific Laboratory Report LA-1940.  Public Domain.
https://www.osti.gov/biblio/4376203

Technique in two sentences
--------------------------
N = 32 particles coupled by cubic-anharmonic springs (α-FPU model) are
integrated via Störmer–Verlet from a single Fourier mode; the displacement
field x_i(t) is sampled into a 32 × 512 height-field stage floor, coloured
by |x_i|, revealing the FPUT recurrence — apparent thermalisation reversing
back to the initial single-mode excitation near T_rec ≈ 800 time units.

Expert notes
============
• α-FPU Hamiltonian: H = Σ pᵢ²/2 + (Δxᵢ)²/2 + (α/3)(Δxᵢ)³
  with fixed-endpoint boundary conditions x₀ = x_{N+1} = 0.
• Force on particle i:
    Fᵢ = (Δxᵢ₊ − Δxᵢ) + α·(Δxᵢ₊² − Δxᵢ²)
  where Δxᵢ = xᵢ − x_{i-1},  Δxᵢ₊ = x_{i+1} − xᵢ.
• Störmer–Verlet is symplectic and time-reversible — it exactly conserves
  a shadow Hamiltonian near the true H, preventing artificial dissipation
  over the thousands of steps needed to observe recurrence.
• Normal-mode energies (Fourier basis for fixed BCs):
    qₖ = √(2/(N+1)) Σᵢ xᵢ sin(kπ(i+1)/(N+1))
    Eₖ = (q̇ₖ² + ωₖ²qₖ²)/2,   ωₖ = 2 sin(kπ/(2(N+1)))
• FPUT recurrence: Kruskal & Zabusky (1965) showed the continuum limit of
  α-FPU is the KdV equation; soliton collisions preserve coherence and
  return energy to mode 1 near T_rec ≈ (N/k)³ in the weakly nonlinear limit.
• Shape keys exhibit the recurrence parameter dependence:
    SK_Linear  α=0.00 → pure standing wave, no mixing;
    SK_Half    α=0.125 → slow recurrence, T_rec ≈ 1 600;
    SK_Double  α=0.50  → fast recurrence, T_rec ≈ 200 (visible in N_T).
• Vertex colour FPUT_Disp: cobalt (|x|=0 nodal lines) → amber (|x|=peak).
• Flat shading is correct for a discrete-particle chain — each quad
  represents one particle × one time interval, so per-quad colour is more
  faithful than interpolated smooth shading.

Author : Holoflow Studio (CC0)
Blender: 5.1
Deps   : numpy (bundled)
Output : fput_floor.blend  →  fput_floor.glb
"""

import bpy, os
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
N_PART   = 32          # particles (Fermi's original number)
ALPHA_0  = 0.25        # cubic anharmonicity — canonical FPUT value
DT       = 0.10        # Störmer–Verlet timestep (natural frequency units)
N_STEPS  = 8192        # total integration steps
SAMPLE   = 16          # store every SAMPLE-th step  →  N_T = 512 frames
A0       = 1.0         # initial mode amplitude (in units of lattice spacing)
MODE_K   = 1           # excite lowest-frequency Fourier mode

FLOOR_W  = 1.60        # mesh width  (particle index, m)
FLOOR_D  = 1.60        # mesh depth  (time axis, m)
H_SCALE  = 0.30        # peak displacement height (m)

COL_LO   = (0.06, 0.14, 0.66, 1.0)   # cobalt  — |x| = 0  (nodal)
COL_HI   = (0.88, 0.52, 0.04, 1.0)   # amber   — |x| = max (antinode)

OBJ_NAME  = "FPUT_Floor"
ATTR_NAME = "FPUT_Disp"

N_T = N_STEPS // SAMPLE   # 512 time snapshots


# ── Physics ───────────────────────────────────────────────────────────────────
def fpu_force(x_ext: np.ndarray, alpha: float) -> np.ndarray:
    """α-FPU force on interior particles from extended array x_ext (length N+2).
    WHY extended array: boundary zeros x[0]=x[N+1]=0 are permanently held in
    x_ext[0] and x_ext[-1], avoiding conditionals inside the hot path.
    """
    dr_r = x_ext[2:] - x_ext[1:-1]    # Δxᵢ₊  =  x_{i+1} − xᵢ  (length N)
    dr_l = x_ext[1:-1] - x_ext[:-2]   # Δxᵢ   =  xᵢ − x_{i-1}
    return (dr_r - dr_l) + alpha * (dr_r ** 2 - dr_l ** 2)


def integrate_fpu(alpha: float) -> np.ndarray:
    """Störmer–Verlet integration of α-FPU for N_STEPS steps.

    Returns x_field of shape (N_PART, N_T): displacement of each particle at
    each sampled time.  Initial condition: single Fourier mode k=MODE_K with
    amplitude A0 and zero velocity (maximum-potential start).
    """
    i_arr = np.arange(1, N_PART + 1, dtype=float)
    x0    = A0 * np.sin(MODE_K * np.pi * i_arr / (N_PART + 1))

    x_ext = np.zeros(N_PART + 2)   # boundary zeros maintained
    x_ext[1:-1] = x0
    v   = np.zeros(N_PART)
    F   = fpu_force(x_ext, alpha)

    x_field = np.zeros((N_PART, N_T))
    saved   = 0

    for step in range(N_STEPS):
        # Störmer–Verlet: half-kick → drift → half-kick
        v_half         = v + 0.5 * DT * F
        x_ext[1:-1]   += DT * v_half
        F              = fpu_force(x_ext, alpha)
        v              = v_half + 0.5 * DT * F

        if step % SAMPLE == 0 and saved < N_T:
            x_field[:, saved] = x_ext[1:-1]
            saved += 1

    return x_field   # (N_PART, N_T)


# ── Geometry ──────────────────────────────────────────────────────────────────
def make_verts(x_field: np.ndarray) -> np.ndarray:
    """Flat height-field: X = particle index, Z = time, Y = displacement."""
    n_p, n_t = x_field.shape
    xv = (np.arange(n_p) / (n_p - 1) - 0.5) * FLOOR_W     # (n_p,)
    zv = (np.arange(n_t) / (n_t - 1) - 0.5) * FLOOR_D     # (n_t,)
    xv = np.broadcast_to(xv[:, None], (n_p, n_t)).ravel()
    zv = np.broadcast_to(zv[None, :], (n_p, n_t)).ravel()
    yv = (x_field * H_SCALE).ravel()
    return np.stack([xv, yv, zv], axis=1)                   # (n_p*n_t, 3)


def make_faces(n_rows: int, n_cols: int) -> list:
    """(n_rows−1)×(n_cols−1) quad faces with CCW winding for correct normals."""
    r  = np.arange(n_rows - 1)
    c  = np.arange(n_cols - 1)
    rr, cc = np.meshgrid(r, c, indexing='ij')
    rr, cc = rr.ravel(), cc.ravel()
    v0 = rr * n_cols + cc
    quads = np.stack([v0, v0 + 1, v0 + n_cols + 1, v0 + n_cols], axis=1)
    return quads.tolist()


# ── Scene ─────────────────────────────────────────────────────────────────────
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# Basis
x_basis = integrate_fpu(ALPHA_0)
x_norm  = np.abs(x_basis) / (np.abs(x_basis).max() or 1.0)

verts_b = make_verts(x_basis)
faces   = make_faces(N_PART, N_T)

me = bpy.data.meshes.new(OBJ_NAME + "_me")
me.from_pydata(verts_b.tolist(), [], faces)
me.update()
ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob

# ── Vertex colours ────────────────────────────────────────────────────────────
attr = me.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
lo, hi = np.array(COL_LO), np.array(COL_HI)
cols   = lo + x_norm.ravel()[:, None] * (hi - lo)
attr.data.foreach_set('color', cols.ravel())

# ── Shape keys ────────────────────────────────────────────────────────────────
ob.shape_key_add(name='Basis', from_mix=False)

for sk_name, alpha in [
    ("SK_Linear",  0.000),   # α=0 → pure standing wave, no inter-mode transfer
    ("SK_Half",    0.125),   # milder coupling → longer recurrence period
    ("SK_Double",  0.500),   # stronger coupling → rapid multi-mode mixing
]:
    x_sk = integrate_fpu(alpha)
    sk   = ob.shape_key_add(name=sk_name, from_mix=False)
    sk.data.foreach_set('co', make_verts(x_sk).ravel())

# ── Material ──────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(OBJ_NAME + "_mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

anode = nt.nodes.new('ShaderNodeAttribute')
anode.attribute_type = 'GEOMETRY'
anode.attribute_name = ATTR_NAME

bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
bsdf.inputs['Roughness'].default_value      = 0.82
bsdf.inputs['Emission Strength'].default_value = 0.55

out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(anode.outputs['Color'], bsdf.inputs['Base Color'])
nt.links.new(anode.outputs['Color'], bsdf.inputs['Emission Color'])
nt.links.new(bsdf.outputs['BSDF'],   out.inputs['Surface'])
me.materials.append(mat)

# Flat shading (each quad = one particle × one timestep; no interpolation needed)
for poly in me.polygons:
    poly.use_smooth = False

ob['holoflow:facet'] = True

# ── Camera ────────────────────────────────────────────────────────────────────
import math
bpy.ops.object.camera_add(location=(0.0, 2.6, 0.8))
cam = bpy.context.object
cam.rotation_euler = (math.radians(57), 0, 0)
bpy.context.scene.camera = cam

# ── Export ────────────────────────────────────────────────────────────────────
HERE       = os.path.dirname(os.path.abspath(__file__))
blend_out  = os.path.join(HERE, "fput_floor.blend")
glb_out    = os.path.join(HERE, "fput_floor.glb")

bpy.ops.wm.save_as_mainfile(filepath=blend_out)

bpy.ops.export_scene.gltf(
    filepath                             = glb_out,
    export_format                        = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_apply                         = True,
    export_morph                         = True,   # include shape keys
    export_colors                        = True,
    export_yup                           = True,   # +Y up for WebXR
    use_selection                        = False,
)

print(f"✓  blend  → {blend_out}")
print(f"✓  GLB    → {glb_out}")
