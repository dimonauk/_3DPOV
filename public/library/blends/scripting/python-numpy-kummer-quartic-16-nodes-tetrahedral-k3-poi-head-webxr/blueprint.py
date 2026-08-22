"""
Python numpy — Kummer Quartic: 16-Node Maximum-Singularity Surface,
               Tetrahedral Symmetry, K3 Resolution & Faceted Poi Head
               for WebXR (Blender 5.1)
====================================================================
Technique
---------
The Kummer surface is a degree-4 algebraic surface holding the maximum
possible number of ordinary double points (A₁ nodes) for a quartic: 16.
Ernst Eduard Kummer proved this bound in 1864.  Each node is a cone-type
singularity, locally f ≈ x² + y² − z².  Resolving all 16 by blowing each
point up to a ℙ¹ yields a smooth K3 surface — a central object of
algebraic geometry and the model for Calabi–Yau 2-folds in string theory.

Equation (Hudson 1905 tetrahedral form — public domain, > 100 years old):
────────────────────────────────────────────────────────────────────────────
    f(x,y,z) = (x²+y²+z²−μ²)² − λ(μ) · P · Q   = 0

    P = (1−z)² − 2x²  =  (1−z−√2·x)(1−z+√2·x)   ← two planes A, B
    Q = (1+z)² − 2y²  =  (1+z+√2·y)(1+z−√2·y)   ← two planes C, D
    λ(μ) = (3μ² − 1) / 3           (positive for μ > 1/√3 ≈ 0.577)

For μ = 1.2 (λ ≈ 1.107): 12 of the 16 nodes are in ℝ³; the remaining 4
sit on the hyperplane at infinity in ℝP³.  The 12 affine nodes are the
pairwise intersections of {A=0, B=0, C=0, D=0} with the sphere R² = μ²
(six pairs × 2 intersection points each = 12).

Isosurface extraction uses Surface Nets (Gibson 1998): one vertex per
sign-change cell, quads stitched along paired sign-change edges.  No
256-case lookup table; ~60 % fewer triangles than Marching Cubes on
smooth quartics.

Vertex colours: Gaussian proximity to the 12 affine nodes.
  amber (1.0, 0.6, 0.1) at nodes → violet (0.15, 0.05, 0.9) far away.

Outside sources
---------------
• Hudson, R.W.H.T. (1905). Kummer's Quartic Surface. Cambridge
  University Press. §§ 1–3, pp. 1–18.
  Public Domain (published > 100 years ago).
  Related: Nikulin (1979) K3 lattice theory; Mukai (1984) abelian surfaces.

• IMAGINARY / surfer-alggeo — Apache-2.0
  https://github.com/IMAGINARY/surfer-alggeo
  Author: Stephan Endraß / IMAGINARY gGmbH
  Interactive real-time algebraic surface visualiser including Kummer.
  Related: IMAGINARY/surfer2, IMAGINARY/cindyjs.
"""

import bpy, bmesh, numpy as np, math

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG     = "hf_kummer"
N        = 90                # grid resolution per axis; 90³ ≈ 730 k cells
HALF_BOX = 2.0               # world half-extent in metres; all nodes at r = μ
ISO      = 0.0               # the zero-locus of f
MU       = 1.2               # family parameter; 12 affine nodes real for μ > 1
DIAM     = 0.14              # poi-head diameter in metres (14 cm fire poi)
DRACO    = 6                 # Draco compression level (0–10)
OUT_GLB  = "//hf_kummer_poi.glb"
OUT_BLD  = "//hf_kummer_poi.blend"

MU2   = MU * MU                       # 1.44
LMBD  = (3.0 * MU2 - 1.0) / 3.0      # λ ≈ 1.107
SCALE = DIAM / (2.0 * HALF_BOX)       # grid → world → poi-head size

# ── Step 1: Evaluate Kummer quartic on N³ grid (vectorised) ──────────────────
# float32 halves memory vs float64; grid cells are ~44 mm wide at N=90,
# far larger than the numerical precision we actually need here.
coords  = np.linspace(-HALF_BOX, HALF_BOX, N, dtype=np.float32)
X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

R2   = X*X + Y*Y + Z*Z
P    = (1.0 - Z)**2 - 2.0*X*X    # (1-z-√2x)(1-z+√2x) — two planes factored
Q    = (1.0 + Z)**2 - 2.0*Y*Y    # (1+z+√2y)(1+z-√2y) — two more planes
# WHY split P,Q: each is degree-2; P·Q is the degree-4 "tetrahedral" factor.
F    = (R2 - MU2)**2 - LMBD * P * Q

INSIDE = F >= ISO
del P, Q, R2   # free ~36 MB; keep F (~4 MB) for ISO-edge interpolation

# ── Step 2: Surface Nets — mark sign-change cells ────────────────────────────
mark = np.zeros((N, N, N), dtype=bool)
for ax in range(3):
    lo = [slice(None)]*3; lo[ax] = slice(None, N - 1)
    hi = [slice(None)]*3; hi[ax] = slice(1, None)
    diff = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
    mark[tuple(lo)] |= diff
    mark[tuple(hi)] |= diff

surf_ijk = np.argwhere(mark)
M        = len(surf_ijk)
print(f"[kummer] surface cells: {M}")

# ── Step 3: Vertex placement — ISO-interpolated edge centroids ────────────────
DIRS    = ((0, 1, 0, 0), (1, 0, 1, 0), (2, 0, 0, 1))
verts_w = np.empty((M, 3), dtype=np.float32)
for m, (ci, cj, ck) in enumerate(surf_ijk):
    pts = []
    for _, di, dj, dk in DIRS:
        ni, nj, nk = ci + di, cj + dj, ck + dk
        if ni < N and nj < N and nk < N:
            va = float(F[ci, cj, ck]); vb = float(F[ni, nj, nk])
            if (va < ISO) != (vb < ISO):
                t   = (ISO - va) / (vb - va + 1e-12)
                pa  = np.array([coords[ci], coords[cj], coords[ck]])
                pb  = np.array([coords[ni], coords[nj], coords[nk]])
                pts.append(pa + t * (pb - pa))
    verts_w[m] = (np.mean(pts, axis=0)
                  if pts else np.array([coords[ci], coords[cj], coords[ck]]))

# ── Step 4: Cell → vertex lookup ─────────────────────────────────────────────
# np.int32 array of shape (N,N,N) with −1 for non-surface cells: O(1) lookup.
cell_map = np.full((N, N, N), -1, dtype=np.int32)
cell_map[surf_ijk[:, 0], surf_ijk[:, 1], surf_ijk[:, 2]] = np.arange(M, dtype=np.int32)

# ── Step 5: Quad stitching ────────────────────────────────────────────────────
# For every sign-change edge the 4 surrounding surface cells form a quad ring.
# Orientation flips based on INSIDE so all normals point outward (f > 0 side).
quads = []
for ax in range(3):
    a1, a2 = [x for x in range(3) if x != ax]
    lo = [slice(None)]*3; lo[ax] = slice(None, N - 1)
    hi = [slice(None)]*3; hi[ax] = slice(1, None)
    edges = np.argwhere(INSIDE[tuple(lo)] != INSIDE[tuple(hi)])
    for e in edges:
        corners = []; ok = True
        for d1, d2 in ((0, 0), (-1, 0), (-1, -1), (0, -1)):
            c = e.copy(); c[a1] += d1; c[a2] += d2
            if not (0 <= c[0] < N and 0 <= c[1] < N and 0 <= c[2] < N):
                ok = False; break
            vi = cell_map[c[0], c[1], c[2]]
            if vi < 0: ok = False; break
            corners.append(int(vi))
        if ok:
            quads.append(corners if INSIDE[e[0], e[1], e[2]] else corners[::-1])

del F, INSIDE, cell_map
print(f"[kummer] quads: {len(quads)}")

# ── Step 6: Assemble bmesh, scale, triangulate ───────────────────────────────
bm       = bmesh.new()
bm_verts = [bm.verts.new((float(v[0]), float(v[1]), float(v[2]))) for v in verts_w]
bm.verts.ensure_lookup_table()
for q in quads:
    try: bm.faces.new([bm_verts[i] for i in q])
    except ValueError: pass   # duplicate or degenerate — skip

cell_sz = float(coords[1] - coords[0])
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=cell_sz * 0.05)
bmesh.ops.triangulate(bm, faces=bm.faces)
# WHY scale in bmesh before scene link: avoids the need for transform_apply later.
bmesh.ops.scale(bm, vec=(SCALE, SCALE, SCALE), verts=bm.verts)

# ── Step 7: Scene setup ───────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
mesh = bpy.data.meshes.new(SLUG)
bm.to_mesh(mesh); bm.free(); mesh.update()
obj  = bpy.data.objects.new(SLUG, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.shade_flat()   # faceted aesthetic: holoflow studio convention

# ── Step 8: Vertex colours — node-proximity heat map ─────────────────────────
# 12 affine nodes of the μ=1.2 Kummer surface (mathematical, pre-scale).
# Derivation: each node lies where two of {A,B,C,D}=0 and x²+y²+z²=μ².
_yr = math.sqrt(MU2 - 1.0)           # ≈ 0.663  (nodes at z=±1)
_zx = math.sqrt((MU2 - 1.0) / 2.0)  # ≈ 0.469  (cross-pair z-value)
_rb = (1.0 - _zx) / math.sqrt(2)     # ≈ 0.375  (near coord of cross pairs)
_ra = (1.0 + _zx) / math.sqrt(2)     # ≈ 1.038  (far coord of cross pairs)

_NODES = (np.array([
    ( 0,  _yr,  1.0), ( 0, -_yr,  1.0),          # A∩B  z=+1
    ( _yr, 0,  -1.0), (-_yr,  0, -1.0),           # C∩D  z=-1
    ( _rb,-_ra,  _zx), ( _rb, _ra, _zx),           # A∩C, A∩D  z=+_zx
    (-_rb,-_ra,  _zx), (-_rb, _ra, _zx),           # B∩C, B∩D  z=+_zx
    ( _ra,-_rb, -_zx), ( _ra, _rb,-_zx),           # A∩C, A∩D  z=-_zx
    (-_ra,-_rb, -_zx), (-_ra, _rb,-_zx),           # B∩C, B∩D  z=-_zx
], dtype=np.float32) * SCALE)   # scale matches the bmesh-scaled vertices

col_attr = mesh.color_attributes.new(name="node_heat", type='FLOAT_COLOR', domain='POINT')
vpos     = np.array([v.co for v in mesh.vertices], dtype=np.float32)   # (V,3)

# Vectorised Gaussian proximity — no Python loop over vertices needed.
dists = np.min(
    np.linalg.norm(_NODES[np.newaxis, :, :] - vpos[:, np.newaxis, :], axis=2),
    axis=1)   # (V,)
t     = np.exp(-dists / (0.55 * SCALE))   # decay radius ≈ 0.55 mathematical units
r_ch  = (1.00*t + 0.15*(1.0-t)).tolist()
g_ch  = (0.60*t + 0.05*(1.0-t)).tolist()
b_ch  = (0.10*t + 0.90*(1.0-t)).tolist()
for i, (r, g, b) in enumerate(zip(r_ch, g_ch, b_ch)):
    col_attr.data[i].color = (r, g, b, 1.0)

# ── Step 9: Emission material driven by node-heat attribute ──────────────────
mat   = bpy.data.materials.new("kummer_glow")
mat.use_nodes = True
nt    = mat.node_tree; nt.nodes.clear()
attr  = nt.nodes.new('ShaderNodeAttribute'); attr.attribute_name = "node_heat"
emit  = nt.nodes.new('ShaderNodeEmission');  emit.inputs['Strength'].default_value = 2.5
out   = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(attr.outputs['Color'],    emit.inputs['Color'])
nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
obj.data.materials.append(mat)
obj["holoflow:facet"] = True

# ── Step 10: Export GLB + save .blend ────────────────────────────────────────
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
print(f"[kummer] done — {M} cells → {tris:,} tris, {len(quads):,} quads")

# ── Troubleshooting ───────────────────────────────────────────────────────────
# SYMPTOM: no visible node-tips; surface looks like a smooth sphere.
# CAUSE:   N too low — at N=90 each node is ~3 cells wide.
# FIX:     Set N = 120 (×1.9 memory, ×2.4 time) and re-run.
#
# SYMPTOM: fragments / open holes near box edges.
# CAUSE:   HALF_BOX < actual surface extent.
# FIX:     Increase HALF_BOX to 2.5 and re-run.
#
# SYMPTOM: all vertex colours are uniform violet (no amber near nodes).
# CAUSE:   SCALE in _NODES already applies but vpos not yet scaled?
# FIX:     Confirm bmesh.ops.scale runs BEFORE bm.to_mesh(mesh).
#
# SYMPTOM: export error "no active object selected".
# CAUSE:   shade_flat() can silently deselect in some Blender builds.
# FIX:     Add obj.select_set(True) immediately before wm.gltf2_export.
