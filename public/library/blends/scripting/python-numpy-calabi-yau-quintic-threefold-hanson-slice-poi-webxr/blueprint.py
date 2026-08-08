"""
Calabi-Yau Quintic Threefold — 2D Cross-Section Poi Head
=========================================================
Blender 5.1  •  Python 3.11  •  NumPy 1.26  •  Licence CC0-1.0

TECHNIQUE
---------
The Fermat quintic curve  z₁⁵ + z₂⁵ = 1  in ℂ²  is the simplest member of the
Calabi-Yau family: compact Kähler manifolds whose existence Yau proved in 1977 by
solving the complex Monge-Ampère equation ∂∂̄φ = ω.  The curve is a degree-5 branched
cover of ℂP¹ — genus 6 by Riemann-Hurwitz — branching at the five 5th roots of unity
where z₂ = 0.  Each sheet n is selected by rotating arg(1−z₁⁵) by 2πn before the ÷5
step, giving five analytically continued 5th-root branches.  We project each sheet to
ℝ³ via (Re z₁, Im z₁, Re z₂), colour by branch index, and assemble a five-petal
poi-head mesh for WebXR export.

BRANCH STRATEGY
---------------
np.angle returns the principal arg ∈ (−π, π].  For the nth branch:
  z₂ = |1−z₁⁵|^{1/5} · exp( i·(arg(1−z₁⁵) + 2πn) / 5 )
n=0 reproduces pow(1−z₁⁵, 0.2) identically; n=1..4 are analytic continuations
past the branch cut.

FAILURE MODES
-------------
• r → 1 exactly: 1−z₁⁵ = 1−e^{5iφ} passes through 0 at φ = 2πk/5 (branch cut).
  Guard with R_MAX = 0.97; |w| stays above ≈0.03 everywhere on the grid.
• Very fine grid (>150²): 5 sheets × 150² = 112 500 verts → Draco export ~30 s.
  Default 100² is safe.  Scale as needed for higher-res renders.
• Petal seam: sheets do NOT share vertices at z₁=0 (each gives a distinct z₂),
  so no duplicate-merge pass is required.
"""

import bpy
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────

SLUG          = "hf_calabi_yau_poi"

U_STEPS       = 100          # radial samples in [0, R_MAX] per sheet
V_STEPS       = 100          # angular samples in [0, 2π)   per sheet
R_MAX         = 0.97         # stay clear of the branch-cut singularity at |z₁|=1
N_SHEETS      = 5            # degree of the Fermat quintic

EXPORT_SCALE  = 0.05         # bounding-sphere radius in metres (5 cm poi head)
GLB_OUT       = "//hf_calabi_yau_poi.glb"

# Studio faceted palette — one RGBA per branch (warm→cool sequence)
SHEET_COLOURS = [
    (0.95, 0.65, 0.10, 1.0),   # 0  gold
    (0.85, 0.25, 0.55, 1.0),   # 1  coral
    (0.10, 0.65, 0.95, 1.0),   # 2  sky
    (0.40, 0.85, 0.30, 1.0),   # 3  jade
    (0.65, 0.20, 0.90, 1.0),   # 4  violet
]

# ── 1. Parametric surface — five-branch Fermat quintic ────────────────────────

u = np.linspace(0.0, R_MAX, U_STEPS)
v = np.linspace(0.0, 2.0 * np.pi, V_STEPS, endpoint=False)
UU, VV = np.meshgrid(u, v, indexing='ij')      # (U_STEPS, V_STEPS) — row-major u

z1  = UU * np.exp(1j * VV)                     # z₁ = r·e^{iφ}
w   = 1.0 - z1 ** 5                            # quantity whose 5th root gives z₂

mag5  = np.abs(w) ** 0.2                       # |w|^{1/5}  (always real ≥ 0)
arg_w = np.angle(w)                            # principal branch arg ∈ (−π, π]

sheets = []
for n in range(N_SHEETS):
    # Analytically continue to branch n by shifting the argument before ÷5
    z2 = mag5 * np.exp(1j * (arg_w + 2.0 * np.pi * n) / 5.0)

    # 3D projection: real parts of z₁ span the XY plane; Re(z₂) is the height.
    # Im(z₂) is discarded here — it encodes an additional S¹ fibre direction.
    sheets.append((np.real(z1).ravel(), np.imag(z1).ravel(), np.real(z2).ravel()))

# Normalise combined surface so the bounding sphere has radius EXPORT_SCALE
all_pts = np.concatenate([np.column_stack(s) for s in sheets], axis=0)
rmax    = np.sqrt((all_pts ** 2).sum(axis=1)).max()
sc      = EXPORT_SCALE / max(rmax, 1e-9)

# ── 2. Blender mesh from pydata ───────────────────────────────────────────────

mesh = bpy.data.meshes.new(SLUG)
obj  = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

verts, faces, vc = [], [], []
base = 0

for n, (xs, ys, zs) in enumerate(sheets):
    col = SHEET_COLOURS[n % len(SHEET_COLOURS)]

    for i in range(len(xs)):
        verts.append((xs[i] * sc, ys[i] * sc, zs[i] * sc))
        vc.append(col)

    # Quad faces: (iu, iv) → (iu+1, iv) → (iu+1, iv+1) → (iu, iv+1)
    # Vertex layout within this sheet: index = iu * V_STEPS + iv
    for iu in range(U_STEPS - 1):
        for iv in range(V_STEPS - 1):
            a = base + iu * V_STEPS + iv
            faces.append((a, a + 1, a + V_STEPS + 1, a + V_STEPS))

    base += len(xs)

mesh.from_pydata(verts, [], faces)
mesh.update()

# ── 3. FLOAT_COLOR vertex attribute (Blender 4.x+/5.x API) ───────────────────
# POINT domain colours individual vertices; CORNER domain colours face-corners.
# POINT is correct for our per-vertex assignment.
attr = mesh.color_attributes.new("CYBranch", 'FLOAT_COLOR', 'POINT')
for i, col in enumerate(vc):
    attr.data[i].color = col

# ── 4. Principled BSDF material reading the vertex colour attribute ────────────
mat = bpy.data.materials.new(SLUG + "_mat")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

vcol = nt.nodes.new("ShaderNodeVertexColor")
vcol.layer_name = "CYBranch"

bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Roughness"].default_value = 0.25
bsdf.inputs["Metallic"].default_value  = 0.55

out = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
obj.data.materials.append(mat)

# ── 5. Shade smooth with 30° auto-smooth angle (Blender 5.1) ──────────────────
# Keeps inter-sheet seam edges hard while smoothing within each petal.
obj.select_set(True)
bpy.ops.object.shade_smooth(use_auto_smooth=True, auto_smooth_angle=0.5236)

# ── 6. Export GLB — Holoflow conventions ──────────────────────────────────────
# +Y up, apply transforms, Draco level 6, WebP textures
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
)

print(
    f"[CY] {N_SHEETS} sheets  "
    f"{len(verts):,} verts  "
    f"{len(faces):,} quads  "
    f"scale={sc:.4f}  → {GLB_OUT}"
)
