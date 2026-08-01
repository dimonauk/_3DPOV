"""
Discrete Exterior Calculus — Harmonic 1-Form on a Perturbed Torus
Blender 5.1 · Python 3.11 · numpy · scipy.sparse

THEORY
------
A triangulated surface K carries three chain groups:
  C₀ = ℝ^V (vertex 0-cochains / scalar fields)
  C₁ = ℝ^E (edge 1-cochains / "flow" on each edge)
  C₂ = ℝ^F (face 2-cochains / "flux" through each triangle)

The exterior derivative d: Cₖ → Cₖ₊₁ is the signed incidence matrix.
  d₀ : C₀ → C₁   (gradient:  discrete df for a function f)
  d₁ : C₁ → C₂   (discrete curl)
  Identity: d₁ ∘ d₀ = 0   (closed ↔ boundary of boundary = 0)

The discrete Hodge star ⋆₁ on 1-cochains uses the cotangent formula:
  for edge (i,j) shared by triangles (i,j,k) and (i,j,l),
  w_ij = (cot α_k + cot α_l) / 2   (α = opposite angle in each triangle)
This is the Pinkall–Polthier (1993) cotan Laplacian weight.

The cotan Laplacian:  L = d₀ᵀ ⋆₁ d₀
A function u ∈ C₀ is harmonic when L u = 0.

For a torus T², H¹(T²; ℝ) ≅ ℝ².  We isolate the longitude generator [dθ]:
  — cut T² along a meridian (θ = 0 ≡ 2π) → a cylinder with two boundary circles
  — impose Dirichlet BCs: u = 0 on the left boundary, u = 1 on the right
  — solve L_II u_I = − L_IB u_B  (conjugate gradient)
  — ∇u on each triangle approximates the harmonic 1-form dual to dθ

On a flat torus, u(i,j) = i/N_T exactly.  On a perturbed torus the weights
differ face-to-face, so the harmonic function deviates from the linear ramp
in an analytically non-trivial way — the DEC solve is necessary.

OUTSIDE SOURCES
  Pinkall & Polthier, "Computing Discrete Minimal Surfaces" (1993)
    Experimental Mathematics 2(1):15-36, MIT-like academic open access.
  Keenan Crane et al., "Discrete Differential Geometry: An Applied Introduction"
    (2019, CC BY-NC-SA 4.0 → educational use):
    https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf
"""

import bpy
import bmesh
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla
from mathutils import Vector

# ── Named constants ───────────────────────────────────────────────────
R_MAJOR   = 1.60     # major radius (hole-centre to tube-centre)
R_MINOR   = 0.50     # tube radius
N_T       = 64       # longitude divisions (cut axis, θ direction)
N_P       = 32       # latitude divisions  (φ direction, closed/periodic)
BUMP_FREQ = 3        # spatial frequency of radial perturbation
BUMP_AMP  = 0.18     # perturbation amplitude (fraction of R_MINOR)
OBJ_NAME  = "hf_dec_torus"
GLB_PATH  = "//hf_dec_torus.glb"
CG_TOL    = 1e-10
CG_MAXIT  = 8000

# ── 1. Cut-torus vertex / triangle arrays ─────────────────────────────
# N_T+1 longitude slices: index 0 = left boundary (u=0),
#                          index N_T = right boundary (u=1, same geometry).
T_CUT = np.linspace(0.0, 2.0 * np.pi, N_T + 1)            # N_T+1 values
P_CUT = np.linspace(0.0, 2.0 * np.pi, N_P, endpoint=False) # N_P values (periodic)

TT, PP = np.meshgrid(T_CUT, P_CUT, indexing="ij")           # (N_T+1, N_P)

# Deterministic sinusoidal bump (not random — result is reproducible)
R_EFF = R_MINOR + BUMP_AMP * R_MINOR * np.sin(BUMP_FREQ * TT) * np.cos(BUMP_FREQ * PP)
Vx = (R_MAJOR + R_EFF * np.cos(PP)) * np.cos(TT)
Vy = (R_MAJOR + R_EFF * np.cos(PP)) * np.sin(TT)
Vz =  R_EFF * np.sin(PP)
verts_cut = np.column_stack([Vx.ravel(), Vy.ravel(), Vz.ravel()])  # nVC × 3
nVC = verts_cut.shape[0]    # (N_T+1)*N_P

def vid(i, j):
    """Cut-torus vertex index.  i ∈ [0, N_T], j periodic mod N_P."""
    return i * N_P + (j % N_P)

tris_cut = []
for i in range(N_T):
    for j in range(N_P):
        a, b = vid(i, j),   vid(i+1, j)
        c, d = vid(i+1, j+1), vid(i,  j+1)
        tris_cut.append((a, b, c))
        tris_cut.append((a, c, d))
tris_cut = np.asarray(tris_cut, dtype=np.int32)    # (2·N_T·N_P) × 3

# ── 2. Cotangent Laplacian ────────────────────────────────────────────
# For each triangle, iterate over the three "opposite-angle" contributions.
# The weight w at angle k  =  (cot θ_k) / 2  =  dot(e1,e2) / (2·|e1×e2|)
# This is split as w/2 added here and w/2 from the adjacent triangle → cotan formula.
def cotan_laplacian(verts, tris):
    n = len(verts)
    rows, cols, data = [], [], []
    for f in tris:
        v = verts[f]
        for k in range(3):
            i_v, j_v = f[(k+1) % 3], f[(k+2) % 3]
            e1 = v[(k+1)%3] - v[k]
            e2 = v[(k+2)%3] - v[k]
            area2  = np.linalg.norm(np.cross(e1, e2)) + 1e-14
            cot_k  = np.dot(e1, e2) / area2
            w      = 0.5 * cot_k
            rows  += [i_v, j_v, i_v, j_v]
            cols  += [j_v, i_v, i_v, j_v]
            data  += [-w,  -w,  +w,  +w]
    return sp.csr_matrix((data, (rows, cols)), shape=(n, n))

L = cotan_laplacian(verts_cut, tris_cut)

# ── 3. Dirichlet solve  L_II u_I = -L_IB u_B ─────────────────────────
bc_left  = np.arange(N_P, dtype=np.int32)                       # i=0,  u=0
bc_right = np.arange(N_T * N_P, (N_T+1) * N_P, dtype=np.int32) # i=N_T, u=1
bc_idx   = np.concatenate([bc_left, bc_right])
bc_val   = np.concatenate([np.zeros(N_P), np.ones(N_P)])

free  = np.setdiff1d(np.arange(nVC), bc_idx)
rhs   = -(L[np.ix_(free, bc_idx)] @ bc_val)
u     = np.zeros(nVC)
u[bc_idx] = bc_val

u_free, info = spla.cg(L[np.ix_(free, free)], rhs, tol=CG_TOL, maxiter=CG_MAXIT)
if info != 0:
    print(f"[DEC] CG did not fully converge (info={info})")
u[free] = u_free

# Diagnostic: compare DEC result to the analytical flat-torus prediction
u_cut = u[:N_T * N_P]              # first N_T rows → closed-torus vertices
analytic = np.arange(N_T * N_P) // N_P / N_T   # i/N_T for each vertex
print(f"[DEC] Max deviation from analytic: {np.abs(u_cut - analytic).max():.4e}")
print(f"[DEC] u range [{u_cut.min():.4f}, {u_cut.max():.4f}]")

# ── 4. Closed-torus mesh (N_T × N_P, periodic in θ) ──────────────────
T_CL = np.linspace(0.0, 2.0 * np.pi, N_T, endpoint=False)
P_CL = P_CUT
TT_CL, PP_CL = np.meshgrid(T_CL, P_CL, indexing="ij")
R_EFF_CL = R_MINOR + BUMP_AMP * R_MINOR * np.sin(BUMP_FREQ*TT_CL)*np.cos(BUMP_FREQ*PP_CL)
Vx_cl = (R_MAJOR + R_EFF_CL * np.cos(PP_CL)) * np.cos(TT_CL)
Vy_cl = (R_MAJOR + R_EFF_CL * np.cos(PP_CL)) * np.sin(TT_CL)
Vz_cl =  R_EFF_CL * np.sin(PP_CL)
verts_cl = np.column_stack([Vx_cl.ravel(), Vy_cl.ravel(), Vz_cl.ravel()])
nV = verts_cl.shape[0]   # N_T * N_P

def vid_cl(i, j): return (i % N_T) * N_P + (j % N_P)

tris_cl = []
for i in range(N_T):
    for j in range(N_P):
        a, b = vid_cl(i, j), vid_cl(i+1, j)
        c, d = vid_cl(i+1, j+1), vid_cl(i, j+1)
        tris_cl.append((a, b, c))
        tris_cl.append((a, c, d))
tris_cl = np.asarray(tris_cl, dtype=np.int32)

# Circular HSV colormap: hue = u mod 1 → RGB
# Maps u=0 and u=1 both to red, so the cohomological seam is invisible.
h   = u_cut % 1.0
h6  = h * 6.0
r_c = np.clip(np.abs(h6 - 3.0) - 1.0, 0.0, 1.0)
g_c = np.clip(2.0 - np.abs(h6 - 2.0), 0.0, 1.0)
b_c = np.clip(2.0 - np.abs(h6 - 4.0), 0.0, 1.0)
colors = np.column_stack([r_c, g_c, b_c])   # nV × 3

# ── 5. Build Blender mesh ─────────────────────────────────────────────
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):  bpy.data.meshes.remove(m, do_unlink=True)

mesh = bpy.data.meshes.new(OBJ_NAME)
bm   = bmesh.new()
bverts = [bm.verts.new(Vector(verts_cl[k])) for k in range(nV)]
bm.verts.ensure_lookup_table()
for f in tris_cl:
    try: bm.faces.new([bverts[idx] for idx in f])
    except ValueError: pass
bm.normal_update()
bm.to_mesh(mesh)
bm.free()

col_layer = mesh.color_attributes.new("harmonic_phase", "FLOAT_COLOR", "POINT")
for k, (r, g, b) in enumerate(colors):
    col_layer.data[k].color = (r, g, b, 1.0)

# ── 6. Emission material (colour attribute → emission) ────────────────
mat = bpy.data.materials.new("M_HarmonicPhase")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()
out   = nt.nodes.new("ShaderNodeOutputMaterial")
mix   = nt.nodes.new("ShaderNodeMixShader")
emit  = nt.nodes.new("ShaderNodeEmission")
diff  = nt.nodes.new("ShaderNodeBsdfDiffuse")
attr  = nt.nodes.new("ShaderNodeAttribute")
attr.attribute_name = "harmonic_phase"
attr.attribute_type = "GEOMETRY"
emit.inputs["Strength"].default_value = 1.4
mix.inputs["Fac"].default_value = 0.65
nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
nt.links.new(attr.outputs["Color"], diff.inputs["Color"])
nt.links.new(emit.outputs[0],       mix.inputs[1])
nt.links.new(diff.outputs[0],       mix.inputs[2])
nt.links.new(mix.outputs[0],        out.inputs["Surface"])
mesh.materials.append(mat)

obj = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── 7. Export GLB ─────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    use_selection=True,
    export_format="GLB",
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_colors=True,
    export_image_format="WEBP",
)
print(f"[DEC] Exported → {bpy.path.abspath(GLB_PATH)}")
