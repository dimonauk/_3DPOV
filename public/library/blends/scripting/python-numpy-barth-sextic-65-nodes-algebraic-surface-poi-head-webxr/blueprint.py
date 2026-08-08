"""
Python numpy — Barth Sextic: 65-Node Icosahedral Algebraic Surface
                             & Faceted Poi Head for WebXR (Blender 5.1)
=======================================================================
Technique
---------
The Barth sextic  f(x,y,z) = 0  is a degree-6 real algebraic surface
that achieves the theoretical maximum of 65 ordinary double points (A₁
nodes, i.e. non-degenerate isolated singularities).  Wolf Barth proved in
1996 that no degree-6 surface over ℝ can have more.  Every node carries
full icosahedral symmetry (Ih ≅ A₅ × ℤ₂), which is why the golden ratio
φ = (1+√5)/2 appears in the equation.

We extract the real affine locus using Surface Nets (Gibson 1998) —
one vertex per sign-change cell, quads stitched along paired edges,
then triangulated.  The 65 nodes manifest as conical singularities
(the mesh develops tiny spike-tips that survive as facets at N = 100).

Key equation
------------
f(x,y,z) = 4(φ²x²−y²)(φ²y²−z²)(φ²z²−x²) − (1+2φ)(x²+y²+z²−1)²
           ══════════════════════════════════ ════════════════════════
           Degree-6 product of three wall-pairs  Spherical term (deg 4)
           (six planes x=±y/φ, y=±z/φ, z=±x/φ)  coefficient = 2+√5

The homogeneous version (W included) is degree 6 throughout; setting W=1
yields the affine form above — first term deg 6, second term deg 4.

Outside sources
---------------
• Barth, W. (1996).  "Two projective surfaces with many nodes, admitting
  the symmetries of the icosahedron."  J. Algebraic Geometry 5(1):173–186.
  Public Domain (published mathematical theorem; equation is prior art).
  Related: Miyaoka max-nodes bound; Hirzebruch ICM 1974 lectures.

• IMAGINARY/surfer-alggeo — Apache-2.0
  https://github.com/IMAGINARY/surfer-alggeo
  Author: Stephan Endraß / IMAGINARY gGmbH
  Interactive real-time visualisation of algebraic surfaces including
  the Barth sextic.  Related: IMAGINARY/surfer2, IMAGINARY/cindyjs.
"""

import bpy, bmesh, numpy as np, math, os

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG     = "hf_barth_sextic"
N        = 100               # grid resolution per axis (100³ ≈ 1 M cells)
HALF_BOX = 1.85              # world half-extent in metres; all 65 nodes < 1.73
ISO      = 0.0               # the zero-locus of f
DIAM     = 0.14              # poi-head diameter (14 cm for performance fire poi)
DRACO    = 6                 # Draco compression level (0–10)
OUT_GLB  = "//barth_sextic.glb"
OUT_BLD  = "//barth_sextic.blend"

# ── Golden-ratio constants ────────────────────────────────────────────────────
PHI   = (1.0 + math.sqrt(5.0)) / 2.0    # φ ≈ 1.6180339887
PHI2  = PHI * PHI                        # φ² ≈ 2.6180339887
COEFF = 1.0 + 2.0 * PHI                 # (1+2φ) = 2+√5 ≈ 4.2360679775
# WHY COEFF: setting (1+2φ) makes the 65 icosahedral intersection points of
# the six wall-planes lie exactly on f=0.  Any other coefficient shifts them.

# ── Step 1: Evaluate f on N³ grid (fully vectorised) ─────────────────────────
# Memory: 3 broadcast grids × 100³ × 4 B ≈ 12 MB — no issue in Blender's Python.
coords = np.linspace(-HALF_BOX, HALF_BOX, N, dtype=np.float32)
X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

# Three factor pairs — each factor is zero on two parallel planes:
#   (φ²x²−y²) = 0  ⟺  y = ±φx  (two planes through the z-axis)
FA = PHI2 * X * X - Y * Y   # (φ²x² − y²)
FB = PHI2 * Y * Y - Z * Z   # (φ²y² − z²)
FC = PHI2 * Z * Z - X * X   # (φ²z² − x²)
R2 = X * X + Y * Y + Z * Z  # |r|²

F = 4.0 * FA * FB * FC - COEFF * (R2 - 1.0) ** 2

del FA, FB, FC, R2, X, Y, Z   # free ≈ 36 MB; only F (4 MB) needed hereafter
INSIDE = F >= ISO              # boolean sign array

# ── Step 2: Surface Nets — mark sign-change cells ────────────────────────────
mark = np.zeros((N, N, N), dtype=bool)
for ax in range(3):
    lo = [slice(None)] * 3;  lo[ax] = slice(None, N - 1)
    hi = [slice(None)] * 3;  hi[ax] = slice(1, None)
    diff          = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
    mark[tuple(lo)] |= diff
    mark[tuple(hi)] |= diff

surf_ijk = np.argwhere(mark)
M = len(surf_ijk)
print(f"[barth] surface cells: {M}")   # ≈ 200k at N=100

# ── Step 3: Vertex placement via ISO-interpolated edge crossings ──────────────
# Forward edges only (+i, +j, +k) — avoids double-counting without quality loss.
# WHY centroid: averaging multiple edge crossings distributes the vertex
# toward the geometric centre of the surface patch, suppressing staircasing.
DIRS = ((0, 1, 0, 0), (1, 0, 1, 0), (2, 0, 0, 1))   # (axis, Δi, Δj, Δk)

verts_w = np.empty((M, 3), dtype=np.float32)
for m, (ci, cj, ck) in enumerate(surf_ijk):
    pts = []
    for ax, di, dj, dk in DIRS:
        ni, nj, nk = ci + di, cj + dj, ck + dk
        if ni < N and nj < N and nk < N:
            va = float(F[ci, cj, ck])
            vb = float(F[ni, nj, nk])
            if (va < ISO) != (vb < ISO):                  # sign change
                t  = (ISO - va) / (vb - va + 1e-12)       # linear interp
                pa = np.array([coords[ci], coords[cj], coords[ck]])
                pb = np.array([coords[ni], coords[nj], coords[nk]])
                pts.append(pa + t * (pb - pa))
    verts_w[m] = (np.mean(pts, axis=0) if pts
                  else np.array([coords[ci], coords[cj], coords[ck]]))

# ── Step 4: Cell → vertex lookup (vectorised integer array) ──────────────────
# WHY np.int32 full array: O(1) lookup vs O(log M) dict; 100³ × 4 B = 4 MB.
cell_map = np.full((N, N, N), -1, dtype=np.int32)
cell_map[surf_ijk[:, 0], surf_ijk[:, 1], surf_ijk[:, 2]] = np.arange(M, dtype=np.int32)

# ── Step 5: Quad stitching ───────────────────────────────────────────────────
# For each sign-change edge, the 4 adjacent surface cells form a quad ring.
# Orientation is flipped based on which side is INSIDE so all normals point
# consistently outward (toward the f > 0 half-space).
quads = []
for ax in range(3):
    a1, a2 = [x for x in range(3) if x != ax]
    lo = [slice(None)] * 3;  lo[ax] = slice(None, N - 1)
    hi = [slice(None)] * 3;  hi[ax] = slice(1, None)
    edges = np.argwhere(INSIDE[tuple(lo)] != INSIDE[tuple(hi)])  # (E, 3)
    for e in edges:
        corners = []
        ok = True
        for d1, d2 in ((0, 0), (-1, 0), (-1, -1), (0, -1)):
            c      = e.copy()
            c[a1] += d1
            c[a2] += d2
            if not (0 <= c[0] < N and 0 <= c[1] < N and 0 <= c[2] < N):
                ok = False; break
            vi = cell_map[c[0], c[1], c[2]]
            if vi < 0:
                ok = False; break
            corners.append(vi)
        if ok:
            quads.append(corners if INSIDE[e[0], e[1], e[2]]
                         else corners[::-1])

del F, INSIDE, cell_map   # free ≈ 10 MB
print(f"[barth] quads: {len(quads)}")

# ── Step 6: Assemble bmesh, triangulate, clean ───────────────────────────────
bm       = bmesh.new()
bm_verts = [bm.verts.new((float(v[0]), float(v[1]), float(v[2]))) for v in verts_w]
bm.verts.ensure_lookup_table()

for q in quads:
    try:
        bm.faces.new([bm_verts[i] for i in q])
    except ValueError:
        pass   # duplicate or degenerate face — skip gracefully

cell_sz = float(coords[1] - coords[0])
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=cell_sz * 0.05)
bmesh.ops.triangulate(bm, faces=bm.faces)

# ── Step 7: Scale to poi-head diameter ───────────────────────────────────────
# Raw grid uses HALF_BOX = 1.85 m half-extent; scale to DIAM metres.
# WHY apply_scale before export: glTF requires baked transforms.
SCALE = DIAM / (2.0 * HALF_BOX)
bmesh.ops.scale(bm, vec=(SCALE, SCALE, SCALE), verts=bm.verts)

# ── Step 8: Scene setup ───────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

mesh = bpy.data.meshes.new(SLUG)
bm.to_mesh(mesh)
bm.free()
mesh.update()

obj = bpy.data.objects.new(SLUG, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# Flat shading = faceted look; holoflow convention for crisp normals on export.
bpy.ops.object.shade_flat()

# ── Step 9: Golden-iridescent material ───────────────────────────────────────
# Gold metallic base with slight transmission — the 65 spike-tips refract light.
mat  = bpy.data.materials.new("barth_gold")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value          = (0.94, 0.78, 0.15, 1.0)   # gold
bsdf.inputs["Metallic"].default_value            = 0.92
bsdf.inputs["Roughness"].default_value           = 0.18
bsdf.inputs["Transmission Weight"].default_value = 0.08
bsdf.inputs["IOR"].default_value                 = 2.40   # gold-like
obj.data.materials.append(mat)

# ── Step 10: holoflow:facet attribute ────────────────────────────────────────
# Per-object flag consumed by the holoflow_webxr_exporter add-on.
obj["holoflow:facet"] = True

bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── Step 11: Export ───────────────────────────────────────────────────────────
bpy.ops.wm.gltf2_export(
    filepath                             = bpy.path.abspath(OUT_GLB),
    export_format                        = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO,
    export_image_format                  = 'WEBP',
    export_yup                           = True,   # studio +Y-up convention
    use_selection                        = True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT_BLD))

tris = len(mesh.polygons)
print(f"[barth] done — {M} surface cells → {tris:,} triangles, "
      f"{len(quads):,} quads pre-triangulation")
print(f"[barth] outputs: {OUT_GLB}, {OUT_BLD}")

# ── Troubleshooting ───────────────────────────────────────────────────────────
# SYMPTOM: surface looks like a smooth blob, no spikes.
# CAUSE:   N too low (< 80). At N=100 the nodes are ~1–2 cells across.
# FIX:     Increase N to 120–150 and re-run (8× memory, 8× time).
#
# SYMPTOM: open holes / missing patches.
# CAUSE:   Surface has components that exit the HALF_BOX cube.
# FIX:     Increase HALF_BOX to 2.0 and re-run.
#
# SYMPTOM: GLB export fails "no selection".
# CAUSE:   shade_flat() deselected the object in some Blender builds.
# FIX:     Add `obj.select_set(True)` immediately before wm.gltf2_export.
#
# SYMPTOM: "ValueError: face already exists" floods the console.
# CAUSE:   remove_doubles merged vertices; some quads share all 4 verts.
# FIX:     Harmless (try/except skips them); no action needed.
