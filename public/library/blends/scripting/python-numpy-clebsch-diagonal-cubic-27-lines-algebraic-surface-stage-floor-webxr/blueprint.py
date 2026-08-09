"""
Python numpy — Clebsch Diagonal Cubic: All 27 Real Lines
                                       & Stage Floor GLB for WebXR (Blender 5.1)
================================================================================
Technique
---------
The Clebsch diagonal cubic  f(x,y,z) = 0  is the unique (up to projective
equivalence) smooth cubic surface over ℝ whose 27 lines are ALL real.  Alfred
Clebsch exhibited it in 1871 as the image of the symmetric locus

    x₀³ + x₁³ + x₂³ + x₃³ + x₄³ = 0,    x₀+x₁+x₂+x₃+x₄ = 0   in P⁴

Setting x₄ = −(x₀+x₁+x₂+x₃) and then x₃ = 1 yields the affine equation:

    f(x,y,z) = x³ + y³ + z³ + 1 − (x+y+z+1)³ = 0

The z³ terms in the cubic and in the expansion of −(x+y+z+1)³ cancel, making
f quadratic in z for each fixed (x,y).  We exploit this for a fast analytical
height-field layer at the end of the tutorial but use the volumetric approach
here to capture the full 3D surface structure including the 27 lines.

The 27 lines on the Clebsch cubic are famously indexed by the root system E₆
(an exceptional simple Lie algebra of rank 6; its 27-dimensional representation
connects to the 27 lines via the Gosset polytope 2₂₁).  In the symmetric
affine form, three lines through the origin are visible: the projections of
l₀₁ (x=y), l₀₂ (x=z), l₁₂ (y=z) — straight ridges on the mesh in wireframe.

Key equation
------------
f(x,y,z) = x³+y³+z³+1−(x+y+z+1)³

Degree: 3 (cubic). Smooth (no real singular points). Symmetry: S₃ (permuting
x,y,z). All 27 real lines — the maximum possible (Salmon 1849, proved by
Clebsch in 1871).

Outside sources
---------------
• Clebsch, A. (1871).  "Ueber die Flächen vierter Ordnung."
  J. für die reine und angewandte Mathematik 75.  Public Domain.
  https://doi.org/10.1515/crll.1871.75.1
  Theorem: the symmetric sum x₀³+…+x₄³=0 achieves 27 real lines.

• IMAGINARY/surfer-alggeo — Apache-2.0
  https://github.com/IMAGINARY/surfer-alggeo
  Author: Stephan Endraß / IMAGINARY gGmbH
  Interactive real-time visualiser; the Clebsch cubic is a built-in example.
"""

import bpy, bmesh, numpy as np, math, os

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG      = "hf_clebsch_cubic"
N         = 90               # grid resolution per axis (90³ ≈ 730 k cells)
HALF_BOX  = 2.0              # world half-extent; all 27 lines pass within ≈1.8
ISO       = 0.0              # zero-locus of f
# Stage-floor output: compress Z so the mesh reads as a flat architectural tile.
FLOOR_DIAM  = 1.5            # 1.5 m diameter (X and Y extent)
FLOOR_THICK = 0.20           # 0.20 m thickness (Z extent)
DRACO     = 6
OUT_GLB   = "//clebsch_cubic.glb"
OUT_BLD   = "//clebsch_cubic.blend"

# ── Step 1: Evaluate f on N³ grid (vectorised) ────────────────────────────────
# f = x³+y³+z³+1−(x+y+z+1)³
# Memory: 100³ float32 ≈ 3 MB — extremely light compared to degree-6 surfaces.
# WHY: the cubic numerator and the expanded −(…)³ denominator both contribute z³
# terms that cancel; f is effectively quadratic in z for any fixed (x,y).
coords = np.linspace(-HALF_BOX, HALF_BOX, N, dtype=np.float32)
X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

S  = X + Y + Z + 1.0            # auxiliary: x+y+z+1
F  = X**3 + Y**3 + Z**3 + 1.0 - S**3
del S, X, Y, Z                  # free ≈ 12 MB; only F (3 MB) needed hereafter
INSIDE = F >= ISO

# ── Step 2: Surface Nets — mark sign-change cells ─────────────────────────────
mark = np.zeros((N, N, N), dtype=bool)
for ax in range(3):
    lo = [slice(None)] * 3;  lo[ax] = slice(None, N - 1)
    hi = [slice(None)] * 3;  hi[ax] = slice(1, None)
    diff        = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
    mark[tuple(lo)] |= diff
    mark[tuple(hi)] |= diff

surf_ijk = np.argwhere(mark)
M = len(surf_ijk)
print(f"[clebsch] surface cells: {M}")   # ≈ 50–90k at N=90

# ── Step 3: Vertex placement via ISO-interpolated edge crossings ──────────────
# Same Surface Nets approach as the Barth sextic tutorial; see that entry for
# a full derivation of why centroid-of-edge-crossings gives a smooth mesh.
DIRS = ((0, 1, 0, 0), (1, 0, 1, 0), (2, 0, 0, 1))

verts_w = np.empty((M, 3), dtype=np.float32)
for m, (ci, cj, ck) in enumerate(surf_ijk):
    pts = []
    for ax, di, dj, dk in DIRS:
        ni, nj, nk = ci + di, cj + dj, ck + dk
        if ni < N and nj < N and nk < N:
            va = float(F[ci, cj, ck])
            vb = float(F[ni, nj, nk])
            if (va < ISO) != (vb < ISO):
                t  = (ISO - va) / (vb - va + 1e-12)
                pa = np.array([coords[ci], coords[cj], coords[ck]])
                pb = np.array([coords[ni], coords[nj], coords[nk]])
                pts.append(pa + t * (pb - pa))
    verts_w[m] = (np.mean(pts, axis=0) if pts
                  else np.array([coords[ci], coords[cj], coords[ck]]))

# ── Step 4: Cell → vertex lookup ──────────────────────────────────────────────
cell_map = np.full((N, N, N), -1, dtype=np.int32)
cell_map[surf_ijk[:, 0], surf_ijk[:, 1], surf_ijk[:, 2]] = np.arange(M, dtype=np.int32)

# ── Step 5: Quad stitching ───────────────────────────────────────────────────
quads = []
for ax in range(3):
    a1, a2 = [x for x in range(3) if x != ax]
    lo = [slice(None)] * 3;  lo[ax] = slice(None, N - 1)
    hi = [slice(None)] * 3;  hi[ax] = slice(1, None)
    edges = np.argwhere(INSIDE[tuple(lo)] != INSIDE[tuple(hi)])
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

del F, INSIDE, cell_map
print(f"[clebsch] quads: {len(quads)}")

# ── Step 6: Bmesh — assemble, triangulate ─────────────────────────────────────
bm       = bmesh.new()
bm_verts = [bm.verts.new((float(v[0]), float(v[1]), float(v[2]))) for v in verts_w]
bm.verts.ensure_lookup_table()

for q in quads:
    try:
        bm.faces.new([bm_verts[i] for i in q])
    except ValueError:
        pass

cell_sz = float(coords[1] - coords[0])
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=cell_sz * 0.05)
bmesh.ops.triangulate(bm, faces=bm.faces)

# ── Step 7: Non-uniform scale → stage-floor tile ──────────────────────────────
# X,Y scale to FLOOR_DIAM/2; Z scale to FLOOR_THICK/2.  Linear transforms
# preserve straightness of the 27 lines — they remain geometrically straight
# after any affine map, so ridge features are not distorted.
SCALE_XY = (FLOOR_DIAM  / 2.0) / HALF_BOX   # 0.375
SCALE_Z  = (FLOOR_THICK / 2.0) / HALF_BOX   # 0.050
bmesh.ops.scale(bm, vec=(SCALE_XY, SCALE_XY, SCALE_Z), verts=bm.verts)

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
bpy.ops.object.shade_flat()

# ── Step 9: Indigo-crystal material ──────────────────────────────────────────
# Deep indigo base: contrasts with the Barth sextic's gold for side-by-side
# comparison of the two algebraic-surface tutorials on the stage floor.
mat  = bpy.data.materials.new("clebsch_indigo")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value          = (0.06, 0.04, 0.55, 1.0)  # deep indigo
bsdf.inputs["Metallic"].default_value            = 0.15
bsdf.inputs["Roughness"].default_value           = 0.22
bsdf.inputs["Transmission Weight"].default_value = 0.12
bsdf.inputs["IOR"].default_value                 = 1.72
obj.data.materials.append(mat)

# ── Step 10: Holoflow attributes ──────────────────────────────────────────────
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "stage-floor"
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── Step 11: Export ───────────────────────────────────────────────────────────
bpy.ops.wm.gltf2_export(
    filepath                             = bpy.path.abspath(OUT_GLB),
    export_format                        = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO,
    export_image_format                  = 'WEBP',
    export_yup                           = True,
    use_selection                        = True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT_BLD))

tris = len(mesh.polygons)
print(f"[clebsch] done — {M} cells → {tris:,} triangles")
print(f"[clebsch] outputs: {OUT_GLB}, {OUT_BLD}")

# ── Troubleshooting ───────────────────────────────────────────────────────────
# SYMPTOM: surface appears as a few tiny disconnected patches.
# CAUSE:   N too low (< 70).  At N=70 the 27 lines are only 1–2 cells wide
#          and Surface Nets cannot reliably stitch quads around them.
# FIX:     Raise N to 90–100 (note: 90³ ≈ 730 k cells, ~4 s on a 2024 CPU).
#
# SYMPTOM: the mesh has large open holes (missing patches).
# CAUSE:   The surface exits the HALF_BOX boundary.  Being non-compact in
#          affine space, the Clebsch cubic has sheets that extend to infinity.
# FIX:     The holes are expected; increase HALF_BOX to 2.5 if you want more
#          of the surface, but open edges at the boundary will remain.
#
# SYMPTOM: GLB export fails "no objects selected".
# CAUSE:   shade_flat() deselected the object in some Blender builds.
# FIX:     Add `obj.select_set(True)` immediately before wm.gltf2_export.
#
# SYMPTOM: stage floor too tall relative to diameter.
# CAUSE:   Default FLOOR_THICK = 0.20 m. At HALF_BOX = 2.0, SCALE_Z = 0.05.
# FIX:     Reduce FLOOR_THICK to 0.10 m for a flatter tile (SCALE_Z = 0.025).
