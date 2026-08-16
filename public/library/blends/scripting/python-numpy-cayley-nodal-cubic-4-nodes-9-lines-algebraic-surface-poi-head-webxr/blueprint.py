"""
Cayley Nodal Cubic — Arthur Cayley 1849, Degree-3 Algebraic Surface,
4 Real Nodes (Maximum for Cubics), Tetrahedron Symmetry Group S₄ (order 24),
9 Lines (6 Edge + 3 Non-Edge) & e₃ Elementary Symmetric Polynomial
Faceted Poi Head for WebXR · Blender 5.1 · Holoflow Studio · CC0
══════════════════════════════════════════════════════════════════════

Node-Count Records for Algebraic Surfaces in ℙ³
──────────────────────────────────────────────────
A degree-d hypersurface in ℙ³ can carry at most μ(d) ordinary double
points (A₁ nodes — isolated singularities where the surface locally looks
like a real quadric cone). The record table:

  d=3:  4 nodes  (Cayley cubic  1849)  ← this blueprint  proven sharp: Salmon 1849
  d=4: 16 nodes  (Kummer quartic 1864) ← studio entry    proven sharp: Kummer 1864
  d=5: 31 nodes  (Togliatti quintic)                      proven sharp: Beauville 1980
  d=6: 65 nodes  (Barth sextic  1996)  ← studio entry    Miyaoka bound tight

The Cayley Nodal Cubic — Equation
────────────────────────────────────
Projective equation in ℙ³(ℝ):
  e₃(x₀,x₁,x₂,x₃) = x₀x₁x₂ + x₀x₁x₃ + x₀x₂x₃ + x₁x₂x₃ = 0

e₃ is the THIRD ELEMENTARY SYMMETRIC POLYNOMIAL in 4 variables.
Equivalently: e₁·e₂ − 2e₃·e₀... no simpler form — e₃ is irreducible.
Symmetry: invariant under ALL 24 permutations of {x₀,x₁,x₂,x₃} (group S₄).

In affine coordinates (x₃=1):
  f(x,y,z) = xyz + xy + xz + yz = 0

Alternatively:  (1+x)(1+y)(1+z) = 1 + x + y + z

The 4 Nodes — Where ∇f = 0 on f = 0
──────────────────────────────────────
  ∂f/∂x = yz+y+z   ∂f/∂y = xz+x+z   ∂f/∂z = xy+x+y

Projective nodes at the 4 coordinate vertices (S₄-orbits of size 1 each):
  N₀=[1:0:0:0]  N₁=[0:1:0:0]  N₂=[0:0:1:0]  N₃=[0:0:0:1]
In affine x₃=1:  N₃=(0,0,0) is visible; N₀,N₁,N₂ lie at projective infinity.

Hessian at N₃ (origin) — the degree-2 part of f:
  Q(x,y,z) = xy+xz+yz   matrix A=½[[0,1,1],[1,0,1],[1,1,0]]
  Eigenvalues: +½ (once), −¼ (twice) → signature (1,2) → REAL quadric cone
  WHY A₁ type? Q=0 is a genuine smooth cone — two nappes meeting at origin.
  This is the mildest possible singularity: locally f ≅ x²+y²−z² (after diag.).

The 9 Lines — Found via the Factorisation
──────────────────────────────────────────
  f = x₀x₁(x₂+x₃) + x₂x₃(x₀+x₁)

  Setting x₀+x₁=0 AND x₂+x₃=0: both terms vanish → f≡0 on this line. ✓
  3 non-edge lines from the 3 pair-partitions of {0,1,2,3}:
    L_A: x₀+x₁=0, x₂+x₃=0  →  affine: y=−x, z=−1
    L_B: x₀+x₂=0, x₁+x₃=0  →  affine: z=−x, y=−1
    L_C: x₀+x₃=0, x₁+x₂=0  →  affine: x=−1, y=−z

  6 edge lines = C(4,2)=6 edges of the tetrahedron of nodes:
    In affine x₃=1: x-axis (N₃–N₀), y-axis (N₃–N₁), z-axis (N₃–N₂) are visible.
    3 edges N₀N₁, N₀N₂, N₁N₂ lie at projective infinity (x₃=0 plane).

  Total: 3 non-edge + 3 visible-edge + 3 infinity-edge = 9 lines. ✓
  (Smooth cubic: 27 lines. Node reduces count. 4 nodes → 9 lines by Segre 1887.)

Marching Tetrahedra
────────────────────
Grid: N³=64³ over [−2.5,2.5]³. Each cube → 6 tets sharing body-diagonal v₀→v₆.
Sign-change edges → linearly interpolated triangle vertices (linear interp. O(1)).
Active-cell filter (argwhere min<0<max) avoids empty-cell traversal (~95% skip).

Vertex Colour — Node-Proximity Map
────────────────────────────────────
|∇f| = 0 at nodes; nonzero everywhere else.  g = |∇f|/max|∇f|  ∈ [0,1].
R = g^0.3,  G = g^0.5 × 0.6,  B = (1−g)^0.4
→ warm amber-gold on smooth patches, deep azure at the node pinch point.

Studio Conventions
───────────────────
POI_RADIUS=0.082m  flat-shaded  +Y-up  apply-transforms  Draco-6  WebP  GLB
"""

import bpy, numpy as np, math
from mathutils import Vector
from pathlib import Path

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
SLUG        = "python-numpy-cayley-nodal-cubic-4-nodes-9-lines-algebraic-surface-poi-head-webxr"
OBJ_NAME    = "hf_cayley_cubic"
MESH_NAME   = "HF_CayleyCubic"
HERE        = Path(__file__).parent
GLB_PATH    = str(HERE / "hf_cayley_cubic.glb")
MAT_NAME    = "HoloflowCayleyCubicMat"

N           = 64                 # grid resolution per axis (64³ ≈ 262 k cubes)
HALF_BOX    = 2.5                # domain [−2.5, 2.5]³
POI_RADIUS  = 0.082              # 8.2 cm standard poi head (metres)

# Cube vertex offsets: index 0…7  →  (i&1, (i>>1)&1, (i>>2)&1)
CUBE_OFF = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.float64,
)
# 6 tetrahedra sharing body-diagonal v₀→v₆ (Kossaczky 1994 decomposition)
CUBE_TETS = ((0,1,2,6),(0,2,3,6),(0,3,7,6),(0,4,5,6),(0,4,7,6),(0,1,5,6))

# ── CAYLEY CUBIC — SCALAR FIELD ───────────────────────────────────────────────
def cayley_f(X, Y, Z):
    """e₃(x,y,z,1) = xyz + xy + xz + yz  (third elementary symmetric polynomial).

    WHY this form? e₃ is the unique (up to scale) degree-3 polynomial in ℙ³
    that vanishes at all 4 coordinate vertices simultaneously and is S₄-invariant.
    """
    return X*Y*Z + X*Y + X*Z + Y*Z

def cayley_grad(X, Y, Z):
    """∇f = (yz+y+z, xz+x+z, xy+x+y)  — vanishes at all 4 projective nodes.

    WHY ∂f/∂x = yz+y+z?  Taking ∂/∂x of xyz+xy+xz+yz gives yz+y+z.
    At the origin (0,0,0): all three partial derivatives = 0 → A₁ singularity.
    """
    return (Y*Z + Y + Z, X*Z + X + Z, X*Y + X + Y)

# ── MARCHING TETRAHEDRA ───────────────────────────────────────────────────────
def _lerp(va, vb, fa, fb):
    """Linear interpolation along an edge where the isosurface crosses."""
    t = np.clip(-fa / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t * (vb - va)

def _march_cube(cv, cf):
    """Yield triangle tuples from one cube; cv (8,3) positions, cf (8,) values."""
    tris = []
    for ti in CUBE_TETS:
        vs = cv[list(ti)]; fs = cf[list(ti)]
        inside = fs < 0.0
        n_in = int(inside.sum())
        if n_in == 0 or n_in == 4:
            continue
        # Compute edge-crossing vertices for all sign-change pairs
        cuts = {}
        for a in range(4):
            for b in range(a+1, 4):
                if inside[a] != inside[b]:
                    cuts[(a,b)] = _lerp(vs[a], vs[b], fs[a], fs[b])
        if n_in in (1, 3):
            # 1 or 3 inside → exactly 3 edge crossings → one triangle
            tris.append(np.array(list(cuts.values())))
        else:
            # 2 inside → 4 edge crossings → two triangles (quadrilateral split)
            iv = [i for i in range(4) if inside[i]]
            ov = [i for i in range(4) if not inside[i]]
            i0,i1 = iv; j0,j1 = ov
            q = [cuts[(min(i0,j0),max(i0,j0))], cuts[(min(i0,j1),max(i0,j1))],
                 cuts[(min(i1,j1),max(i1,j1))], cuts[(min(i1,j0),max(i1,j0))]]
            tris += [np.array([q[0],q[1],q[2]]), np.array([q[0],q[2],q[3]])]
    return tris

def extract_cayley(N=N, half=HALF_BOX):
    """Marching-tetrahedra isosurface of the Cayley nodal cubic over [−half,half]³."""
    step   = 2.0 * half / (N - 1)
    coords = np.linspace(-half, half, N)
    X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')
    field  = cayley_f(X, Y, Z)
    # Active-cell filter: skip cells where all 8 corners have the same sign
    corners = np.stack(
        [field[a:a+N-1, b:b+N-1, c:c+N-1]
         for a,b,c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0)
    active = np.argwhere((corners.min(axis=0) < 0.0) & (corners.max(axis=0) > 0.0))
    verts_out, faces_out, idx_map = [], [], {}
    for ix, iy, iz in active:
        base = np.array([ix, iy, iz], dtype=np.float64) * step - half
        cv   = base + CUBE_OFF * step
        cf   = corners[:, ix, iy, iz]
        for tri in _march_cube(cv, cf):
            face = []
            for pt in tri:
                key = tuple(np.round(pt, 7))
                if key not in idx_map:
                    idx_map[key] = len(verts_out)
                    verts_out.append(pt)
                face.append(idx_map[key])
            faces_out.append(face)
    return (np.array(verts_out) if verts_out else np.zeros((0, 3))), faces_out

# ── BUILD SCENE ───────────────────────────────────────────────────────────────
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)

print("Cayley nodal cubic: extracting isosurface (N=64)…")
verts_np, faces = extract_cayley()
print(f"  {len(verts_np)} vertices, {len(faces)} triangles")

# Scale to poi radius via bounding-sphere normalisation
if len(verts_np):
    radii = np.sqrt((verts_np ** 2).sum(axis=1))
    scale = POI_RADIUS / (radii.max() + 1e-12)
    verts_np = verts_np * scale

# ── VERTEX COLOUR — node-proximity map ───────────────────────────────────────
xs, ys, zs   = verts_np[:,0]/scale, verts_np[:,1]/scale, verts_np[:,2]/scale
gx, gy, gz   = cayley_grad(xs, ys, zs)
gmag         = np.sqrt(gx**2 + gy**2 + gz**2)
g            = gmag / (gmag.max() + 1e-12)       # 0 at node, 1 far away
R_col        = (g ** 0.3).astype(np.float32)     # amber on smooth surface
G_col        = (g ** 0.5 * 0.6).astype(np.float32)
B_col        = ((1.0 - g) ** 0.4).astype(np.float32)  # blue at node
A_col        = np.ones(len(verts_np), dtype=np.float32)
vcols        = np.stack([R_col, G_col, B_col, A_col], axis=1)

# ── MESH ──────────────────────────────────────────────────────────────────────
me = bpy.data.meshes.new(MESH_NAME)
me.from_pydata([Vector(v) for v in verts_np], [], faces)
me.update()

attr = me.color_attributes.new(name="Col", type='FLOAT_COLOR', domain='POINT')
for i, col in enumerate(vcols):
    attr.data[i].color = col

ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
bpy.ops.object.shade_flat()

# ── MATERIAL — warm amber-gold (algebraic-surface series complement) ───────────
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value          = (0.52, 0.28, 0.04, 1.0)
bsdf.inputs["Metallic"].default_value            = 0.42
bsdf.inputs["Roughness"].default_value           = 0.22
bsdf.inputs["Transmission Weight"].default_value = 0.07
bsdf.inputs["IOR"].default_value                 = 1.66
bsdf.inputs["Emission Color"].default_value      = (0.65, 0.30, 0.0, 1.0)
bsdf.inputs["Emission Strength"].default_value   = 0.05
me.materials.append(mat)

# ── SHAPE KEYS ────────────────────────────────────────────────────────────────
ob.shape_key_add(name="Basis", from_mix=False)
basis = [v.co.copy() for v in me.vertices]

def _sk(name, fn):
    sk = ob.shape_key_add(name=name, from_mix=False)
    for i, v in enumerate(me.vertices):
        sk.data[i].co = fn(basis[i])
    return sk

# SK_Tight: bring sheets closer (highlights the node cone geometry)
_sk("SK_Tight",    lambda v: v * 0.65)
# SK_Wide: inflate to show the full extension of the cubic branches
_sk("SK_Wide",     lambda v: v * 1.52)
# SK_Flatten: collapse to 2D cross-section (reveals the 9-line pattern)
_sk("SK_Flatten",  lambda v: Vector((v.x, v.y, v.z * 0.28)))

# ── HOLOFLOW METADATA ─────────────────────────────────────────────────────────
ob["holoflow:slug"]     = SLUG
ob["holoflow:facet"]    = True
ob["holoflow:category"] = "poi-head"
ob["holoflow:nodes"]    = 4          # 4 ordinary double points — maximum for cubic
ob["holoflow:degree"]   = 3
ob["holoflow:symmetry"] = "S4"       # symmetric group S₄, order 24
ob["holoflow:lines"]    = 9          # 6 edge + 3 non-edge lines

# +Y-up orientation for WebXR export
import math
ob.rotation_euler[0] = math.pi / 2
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── EXPORT GLB ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH, export_format='GLB',
    export_yup=True, export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_morph=True,
    export_colors=True,
    use_selection=True,
)
print(f"GLB exported → {GLB_PATH}")
