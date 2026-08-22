"""
Scherk's Doubly Periodic Minimal Surface — Blender 5.1 Blueprint
================================================================
Technique: Scherk's FIRST surface (1835) is the unique complete embedded
doubly-periodic minimal surface other than the plane, found by Heinrich
Ferdinand Scherk as the solution to a prize problem posed by the Berlin
Academy.  Its extraordinary closed-form equation z = ln(cos y / cos x) on
the checkerboard domain — where cos x and cos y share the same sign — makes
it one of only a handful of minimal surfaces with an elementary formula.
We tile nine fundamental saddle domains in a 3 × 3 alternating-sign grid,
vertex-colour by analytic Gaussian curvature K = −sec²x sec²y / W⁴ (W²=1+
tan²x+tan²y), and export a 10.8 m × 10.8 m WebXR stage floor with five
shape keys animating the fold from a flat plane to the full Scherk surface.

Sources
-------
Scherk H F (1835) Bemerkungen über die kleinste Fläche innerhalb gegebener
  Grenzen. J. reine angew. Math. 13:185-208. Public domain.
  https://gdz.sub.uni-goettingen.de/id/PPN243919689_0013
  Related work: Riemann B (1866) minimal surface classification (PD);
    Weierstrass K (1866) Untersuchungen über die Flächen (PD).
NumPy Developers. NumPy 1.26 User Guide. BSD-3-Clause.
  https://numpy.org/doc/1.26/  Related: SciPy (BSD-3).
"""

import bpy
import numpy as np

# ─── Parameters ──────────────────────────────────────────────────────────────
N_GRID      = 52          # vertices per tile axis (52² = 2 704 per tile)
N_TILES     = 3           # N_TILES × N_TILES checkerboard (9 tiles total)
MARGIN      = 0.13        # rad from ±π/2 — keeps singularity out of range
Z_SCALE     = 0.30        # metres per natural-log unit of height
TILE_SCALE  = 1.14        # metres per radian (tile half-width ≈ 1.79 m)
SK_AMPS     = [           # (name, amplitude-multiplier)
    ("Basis",     0.00),  # flat plane — the mesh rest position
    ("SK_Tenth",  0.10),  # 10 % amplitude — barely perceptible ripple
    ("SK_Half",   0.50),  # 50 % — clear undulation
    ("SK_Full",   1.00),  # true Scherk surface
    ("SK_Steep",  1.50),  # 150 % — exaggerated; useful for preview thumbnails
]
COL_DEEP    = (0.08, 0.25, 0.85, 1.0)   # cobalt  — K → −1, most curved
COL_FLAT    = (0.88, 0.62, 0.09, 1.0)   # amber   — K → 0,  least curved
OBJ_NAME    = "scherk_doubly_periodic_floor"
EXPORT_PATH = "//scherk_doubly_periodic_floor.glb"
# ─────────────────────────────────────────────────────────────────────────────


# ─── Step 1: Fundamental domain parametrisation ───────────────────────────────
# u, v ∈ (−π/2 + MARGIN, π/2 − MARGIN)
# WHY MARGIN: ln(cos v / cos u) diverges as |u| → π/2 or |v| → π/2.
# MARGIN trims the singularity so the mesh has a finite bounding box.

u1 = np.linspace(-np.pi / 2 + MARGIN, np.pi / 2 - MARGIN, N_GRID)
v1 = u1.copy()
UU, VV = np.meshgrid(u1, v1, indexing="ij")   # (N_GRID, N_GRID)

CU = np.cos(UU)
CV = np.cos(VV)
# Full-amplitude Scherk z-field (SK_Full)
Z_domain = np.log(CV / CU)                    # saddle: + along u-axis, − along v-axis

# Analytic Gaussian curvature of Scherk's surface:
#   K = (f_uu · f_vv − f_uv²) / (1 + f_u² + f_v²)²
#   f_u = tan u,  f_v = −tan v,  f_uu = sec²u,  f_vv = −sec²v,  f_uv = 0
#   LN − M² = −sec²u sec²y / W²;  EG − F² = W² = 1 + tan²u + tan²v
#   → K = −sec²u sec²y / W⁴
W2    = 1.0 + np.tan(UU) ** 2 + np.tan(VV) ** 2
K_abs = (1.0 / CU ** 2) * (1.0 / CV ** 2) / (W2 ** 2)   # |K|, always ≥ 0
K_norm = K_abs / float(K_abs.max())           # in [0, 1], 1 = most curved


# ─── Step 2: Tile vertex layout ───────────────────────────────────────────────
# Nine tiles in a 3 × 3 grid, centred at the origin.
# WHY alternating sign: adjacent tiles share an infinite "wall" where
# |z| → ∞; flipping sign on neighbours makes both tiles approach the same
# signed ∞, which is the correct topology of Scherk's doubly-flat ends.

n_per_tile  = N_GRID * N_GRID
total_tiles = N_TILES * N_TILES
n_verts     = total_tiles * n_per_tile

# Build flat base positions and per-tile metadata
tile_meta = []          # list of (tile_idx, sign, cx, cy)
verts_flat = np.zeros((n_verts, 3), dtype=np.float64)
k_buf      = np.empty(n_verts, dtype=np.float64)

tile_idx = 0
for i in range(N_TILES):
    for j in range(N_TILES):
        sign = float((-1) ** (i + j))
        cx   = (i - N_TILES / 2 + 0.5) * np.pi * TILE_SCALE
        cy   = (j - N_TILES / 2 + 0.5) * np.pi * TILE_SCALE
        s, e = tile_idx * n_per_tile, (tile_idx + 1) * n_per_tile
        verts_flat[s:e, 0] = (cx + UU * TILE_SCALE).ravel()
        verts_flat[s:e, 1] = (cy + VV * TILE_SCALE).ravel()
        verts_flat[s:e, 2] = 0.0     # flat base; z filled by shape keys
        k_buf[s:e]         = K_norm.ravel()
        tile_meta.append((tile_idx, sign))
        tile_idx += 1


# ─── Step 3: Face list ───────────────────────────────────────────────────────
# WHY quads: quad mesh preserves the C¹ saddle silhouette better than
# triangles; loop subdivide in Blender stays crisp without staircase artefacts.
faces = []
for t in range(total_tiles):
    off = t * n_per_tile
    for li in range(N_GRID - 1):
        for lj in range(N_GRID - 1):
            a = off + li * N_GRID + lj
            b = off + li * N_GRID + lj + 1
            c = off + (li + 1) * N_GRID + lj + 1
            d = off + (li + 1) * N_GRID + lj
            faces.append((a, b, c, d))


# ─── Step 4: Create mesh object ──────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

mesh = bpy.data.meshes.new(OBJ_NAME)
obj  = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

mesh.from_pydata(verts_flat.tolist(), [], faces)
mesh.update()


# ─── Step 5: Vertex colour — Gaussian curvature heat-map ─────────────────────
# FLOAT_COLOR domain=POINT prevents quantisation in the exported GLB;
# the exporter maps to sRGB [0, 1] without 8-bit clamping artefacts.
col_attr = mesh.color_attributes.new("ScherkK", type="FLOAT_COLOR", domain="POINT")
rgba = np.empty((n_verts, 4), dtype=np.float32)
for ch in range(3):
    rgba[:, ch] = (1.0 - k_buf) * COL_FLAT[ch] + k_buf * COL_DEEP[ch]
rgba[:, 3] = 1.0
col_attr.data.foreach_set("color", rgba.ravel().tolist())


# ─── Step 6: Shape keys ──────────────────────────────────────────────────────
# Basis is the flat plane; subsequent keys add the Scherk z-displacement.
obj.shape_key_add(name="Basis", from_mix=False)   # captures flat rest pose

for sk_name, amp in SK_AMPS[1:]:
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    sk_pos = verts_flat.copy()
    for t_idx, sign in tile_meta:
        s, e = t_idx * n_per_tile, (t_idx + 1) * n_per_tile
        sk_pos[s:e, 2] = sign * Z_domain.ravel() * Z_SCALE * amp
    sk.data.foreach_set("co", sk_pos.ravel().tolist())


# ─── Step 7: Material ────────────────────────────────────────────────────────
mat   = bpy.data.materials.new("ScherkMat")
mat.use_nodes = True
ntree = mat.node_tree
ntree.nodes.clear()
out  = ntree.nodes.new("ShaderNodeOutputMaterial")
bsdf = ntree.nodes.new("ShaderNodeBsdfPrincipled")
vcol = ntree.nodes.new("ShaderNodeVertexColor")
vcol.layer_name = "ScherkK"
bsdf.inputs["Metallic"].default_value           = 0.30
bsdf.inputs["Roughness"].default_value          = 0.25
bsdf.inputs["Specular IOR Level"].default_value = 0.55
ntree.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
ntree.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
out.location = (400, 0); bsdf.location = (0, 0); vcol.location = (-300, 0)
mesh.materials.append(mat)


# ─── Step 8: Holoflow metadata + apply +Y-up rotation ────────────────────────
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "stage-floor"

import math
obj.rotation_euler = (math.pi / 2, 0.0, 0.0)      # Blender +Z-up → WebXR +Y-up
bpy.context.view_layer.update()
bpy.ops.object.transform_apply(rotation=True)


# ─── Step 9: Export GLB ──────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath                              = bpy.path.abspath(EXPORT_PATH),
    export_format                         = "GLB",
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format                   = "WEBP",
    export_colors                         = True,
    export_morph                          = True,
    use_selection                         = True,
    use_active_collection                 = False,
)
print("✓ Scherk doubly-periodic floor →", EXPORT_PATH)
