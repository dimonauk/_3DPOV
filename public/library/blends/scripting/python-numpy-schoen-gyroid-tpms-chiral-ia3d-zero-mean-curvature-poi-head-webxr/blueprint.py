# SPDX-License-Identifier: CC0-1.0
"""
Schoen Gyroid TPMS — Triply Periodic Minimal Surface (Alan Schoen 1970)
=======================================================================
Holoflow Studio · Blender 5.1 tutorial

The gyroid is the unique associate-family member of Schwarz-P/D that has
NO straight lines or mirror planes — it is intrinsically chiral.
Nodal (Fourier) approximation, space group Ia-3d (#230):

    f(x,y,z) = sin x · cos y + sin y · cos z + sin z · cos x = 0

The exact gyroid has H = 0 everywhere.  The nodal approximation deviates
by < 1 % in mean curvature [Lord & Mackay 2003].  Genus = 3 per unit cell
(χ = −4 per 2π-period cell: two interlocked channel networks, neither
connects to the other).

Shape keys implement the offset-surface family (level-set sweep):
  Basis       level = 0.0  — exact nodal gyroid
  SK_LevelP4  level = +0.4 — one channel network tightens
  SK_LevelN4  level = −0.4 — the complementary network tightens
Each offset δv ≈ Δc · ∇f/|∇f|² (first-order level-set gradient flow).

Vertex colour "Gyroid_Nz" maps the surface-normal z-component
n_z = (∂f/∂z) / |∇f| from cobalt (n_z = −1) to amber (n_z = +1),
making the gyroid's helical twist visible at a glance.

References
----------
Schoen AH (1970) Infinite Periodic Minimal Surfaces Without Self-
  Intersections. NASA Technical Note D-5541. US government work (PD).
  https://ntrs.nasa.gov/citations/19700020490
Lord EA, Mackay AL (2003) Periodic minimal surfaces of cubic symmetry.
  Current Science 85(3): 346–362.
  https://www.currentscience.ac.in/Volumes/85/03/0346.pdf
NumPy (BSD-3-Clause) https://numpy.org/

Cross-references (Holoflow Studio)
------------------------------------
/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr
/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr
/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr
"""

import bpy, math, numpy as np
from mathutils import Vector
from pathlib import Path

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG        = "python-numpy-schoen-gyroid-tpms-chiral-ia3d-zero-mean-curvature-poi-head-webxr"
OBJ_NAME    = "hf_gyroid"
MESH_NAME   = "HF_Gyroid"
HERE        = Path(__file__).parent
GLB_PATH    = str(HERE / "hf_gyroid.glb")
MAT_NAME    = "HoloflowGyroidMat"

N           = 60               # grid resolution — 60³ ≈ 216 k voxels
HALF_BOX    = math.pi * 2.0   # domain [−2π, 2π]³ — two full unit cells
POI_RADIUS  = 0.082            # 8.2 cm poi head bounding sphere (metres)
LEVEL_P4    = 0.40             # offset level for SK_LevelP4
LEVEL_N4    = -0.40            # offset level for SK_LevelN4
COBALT      = (0.13, 0.35, 0.80, 1.0)
AMBER       = (1.00, 0.55, 0.10, 1.0)
COLOUR_ATTR = "Gyroid_Nz"

# Cube-vertex offsets: v₀=(0,0,0) … v₇=(1,1,1), row = (xi,yi,zi)
CUBE_OFF  = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.float64)
# Six tetrahedra sharing body-diagonal v₀→v₆
CUBE_TETS = ((0,1,2,6),(0,2,3,6),(0,3,7,6),(0,4,5,6),(0,4,7,6),(0,1,5,6))


# ── GYROID IMPLICIT FUNCTION & GRADIENT ──────────────────────────────────────

def gyroid_f(X, Y, Z):
    """Nodal approximation: sin x cos y + sin y cos z + sin z cos x."""
    return np.sin(X)*np.cos(Y) + np.sin(Y)*np.cos(Z) + np.sin(Z)*np.cos(X)


def gyroid_grad(X, Y, Z):
    """Analytic ∇f — used for vertex colour (n_z) and shape-key offsets."""
    gx = np.cos(X)*np.cos(Y) - np.sin(Z)*np.sin(X)
    gy = -np.sin(X)*np.sin(Y) + np.cos(Y)*np.cos(Z)
    gz = -np.sin(Y)*np.sin(Z) + np.cos(Z)*np.cos(X)
    return gx, gy, gz


# ── MARCHING TETRAHEDRA ───────────────────────────────────────────────────────

def _lerp(va, vb, fa, fb):
    """Linear interpolation on edge (va,vb) to find f = 0 crossing."""
    t = np.clip(-fa / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t * (vb - va)


def _march_cube(cv, cf):
    """
    Yield triangles from one cube.

    cv : (8, 3) float64 — world positions at cube corners
    cf : (8,) float64  — field values at corners (shifted so iso = 0)
    """
    tris = []
    for ti in CUBE_TETS:
        vs = cv[list(ti)]      # (4, 3)
        fs = cf[list(ti)]      # (4,)
        inside = fs < 0.0
        n_in = int(inside.sum())
        if n_in == 0 or n_in == 4:
            continue
        # Interpolate all sign-change edges
        cuts = {}
        for a in range(4):
            for b in range(a + 1, 4):
                if inside[a] != inside[b]:
                    cuts[(a, b)] = _lerp(vs[a], vs[b], fs[a], fs[b])
        if n_in in (1, 3):
            # Single triangle at the three cut edges
            tris.append(np.array(list(cuts.values())))
        else:
            # Two triangles (quad case): 2 inside, 2 outside
            iv = [i for i in range(4) if inside[i]]
            ov = [i for i in range(4) if not inside[i]]
            i0, i1 = iv; j0, j1 = ov
            q = [
                cuts[(min(i0, j0), max(i0, j0))],
                cuts[(min(i0, j1), max(i0, j1))],
                cuts[(min(i1, j1), max(i1, j1))],
                cuts[(min(i1, j0), max(i1, j0))],
            ]
            tris += [np.array([q[0], q[1], q[2]]),
                     np.array([q[0], q[2], q[3]])]
    return tris


def extract_gyroid():
    """Marching-tetrahedra isosurface of the gyroid over [−2π, 2π]³."""
    step   = 2.0 * HALF_BOX / (N - 1)
    coords = np.linspace(-HALF_BOX, HALF_BOX, N)
    X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')
    field = gyroid_f(X, Y, Z)

    # Active-cell filter (vectorised): only cubes with a sign change
    corners = np.stack(
        [field[a:a+N-1, b:b+N-1, c:c+N-1]
         for a, b, c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),
                          (0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0)
    active = np.argwhere(
        (corners.min(axis=0) < 0.0) & (corners.max(axis=0) > 0.0))

    verts_out, faces_out, idx_map = [], [], {}
    for ix, iy, iz in active:
        base = np.array([ix, iy, iz], dtype=np.float64) * step - HALF_BOX
        cv   = base + CUBE_OFF * step           # (8, 3) corner world positions
        cf   = corners[:, ix, iy, iz]           # (8,)  corner field values
        for tri in _march_cube(cv, cf):
            face = []
            for pt in tri:
                key = tuple(np.round(pt, 7))
                if key not in idx_map:
                    idx_map[key] = len(verts_out)
                    verts_out.append(pt)
                face.append(idx_map[key])
            faces_out.append(face)

    V = np.array(verts_out) if verts_out else np.zeros((0, 3))
    return V, faces_out


# ── BUILD SCENE ───────────────────────────────────────────────────────────────
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)

print("Gyroid: extracting isosurface (N=60)…")
verts_np, faces = extract_gyroid()
print(f"  {len(verts_np)} vertices, {len(faces)} triangles")

# Scale to poi radius (bounding sphere)
radii = np.linalg.norm(verts_np, axis=1)
scale = POI_RADIUS / (radii.max() + 1e-12)
verts_np = verts_np * scale
raw_coords = verts_np / scale   # unscaled for gradient evaluation

# ── VERTEX COLOUR — n_z ───────────────────────────────────────────────────────
gx, gy, gz = gyroid_grad(raw_coords[:,0], raw_coords[:,1], raw_coords[:,2])
gmag = np.sqrt(gx**2 + gy**2 + gz**2) + 1e-12
nz   = gz / gmag                                        # n_z ∈ [−1, +1]
t_col = (nz + 1.0) * 0.5                                # 0=cobalt, 1=amber
cols = np.outer(1.0 - t_col, COBALT) + np.outer(t_col, AMBER)
cols = cols.astype(np.float32)

# ── MESH ──────────────────────────────────────────────────────────────────────
me = bpy.data.meshes.new(MESH_NAME)
me.from_pydata([Vector(v) for v in verts_np], [], faces)
me.update()

attr = me.color_attributes.new(
    name=COLOUR_ATTR, type='FLOAT_COLOR', domain='POINT')
for i, col in enumerate(cols):
    attr.data[i].color = tuple(col)
me.color_attributes.active_color       = attr
me.color_attributes.render_color_index = 0

ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
bpy.ops.object.shade_flat()

# ── MATERIAL ──────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value    = (0.06, 0.22, 0.42, 1.0)
bsdf.inputs["Metallic"].default_value      = 0.20
bsdf.inputs["Roughness"].default_value     = 0.22
bsdf.inputs["Emission Color"].default_value   = (0.10, 0.35, 0.80, 1.0)
bsdf.inputs["Emission Strength"].default_value = 0.08
me.materials.append(mat)

# ── SHAPE KEYS — offset-surface family ───────────────────────────────────────
ob.shape_key_add(name="Basis", from_mix=False)

# Gradient offset: δv = Δc · ∇f / |∇f|²   (level-set gradient flow)
delta_pos = (LEVEL_P4 / (gmag**2)) * np.stack([gx, gy, gz], axis=1)
delta_neg = (LEVEL_N4 / (gmag**2)) * np.stack([gx, gy, gz], axis=1)
# Apply scale to keep units consistent
delta_pos *= scale
delta_neg *= scale

def _add_sk(name, delta):
    sk = ob.shape_key_add(name=name, from_mix=False)
    for i, v in enumerate(me.vertices):
        sk.data[i].co = v.co + Vector(delta[i])

_add_sk("SK_LevelP4", delta_pos)
_add_sk("SK_LevelN4", delta_neg)

# ── HOLOFLOW METADATA ─────────────────────────────────────────────────────────
ob["holoflow:slug"]        = SLUG
ob["holoflow:facet"]       = True
ob["holoflow:category"]    = "poi-head"
ob["holoflow:space_group"] = "Ia-3d"
ob["holoflow:genus"]       = 3          # per unit cell
ob["holoflow:h_min"]       = True       # minimal surface H=0

# ── EXPORT GLB ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH, export_format='GLB',
    export_yup=True, export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    use_selection=True,
)
print(f"Gyroid GLB exported → {GLB_PATH}")
