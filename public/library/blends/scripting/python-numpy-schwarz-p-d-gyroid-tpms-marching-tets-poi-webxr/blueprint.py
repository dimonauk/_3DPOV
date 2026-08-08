"""
Schwarz P, D & Gyroid — Holoflow Blueprint (Blender 5.1)
=========================================================
TECHNIQUE  Triply-Periodic Minimal Surfaces (TPMS) tile ℝ³ by three linearly
independent translation vectors while keeping mean curvature H = (κ₁+κ₂)/2 = 0
everywhere.  Alan Schoen catalogued the principal families in his 1970 NASA
report TN D-5541.  The three fundamental TPMS are:

  Schwarz Primitive P (1867):  cos x + cos y + cos z = 0          [cubic  Pm-3m]
  Schwarz Diamond D   (1867):  sin x sin y sin z + sin x cos y cos z
                               + cos x sin y cos z + cos x cos y sin z = 0 [Fd-3m]
  Schoen Gyroid G     (1970):  sin x cos y + sin y cos z + sin z cos x = 0 [I4₁32]

The Bonnet rotation family θ ∈ [0°, 90°] maps P → G → D isometrically:
same intrinsic metric, different extrinsic embedding.  Gyroid sits at θ≈38.015°.
The Gyroid is chiral (no mirror planes) and appears in butterfly wing scales
(structural colour), lipid bicontinuous phases, and additive-manufacturing
lattice scaffolds.

ISOSURFACE EXTRACTION  Marching Tetrahedra (Doi & Koide 1991): split each cube
of the N³ grid into 6 tetrahedra sharing the body-diagonal edge (v₀, v₆).
Each tet has only 2⁴=16 sign-pattern cases vs. 256 in Lorensen–Cline MC (1987),
reducing to 3 topological outcomes: 1 triangle (1 or 3 vertices inside),
quad=2 triangles (2 vertices inside), or empty (0 or 4 inside).  Linear
interpolation on each sign-change edge gives sub-cell accuracy.

VERTEX COLOUR  The unit normal n̂ = ∇F/|∇F| is computed analytically at each
extracted vertex.  Its z-component n_z ∈ [−1, 1] drives a Gauss-map palette:
red for upward normals (n_z > 0), green for horizontal saddles (n_z ≈ 0),
blue for downward normals (n_z < 0).  On any minimal surface κ₁ = −κ₂, so
K = κ₁κ₂ = −κ₁² ≤ 0 everywhere — every point is a saddle.  The colour map
reveals the rhythmic up-down alternation that makes TPMS structurally rigid.

STUDIO CONVENTIONS  Three poi heads (Schwarz P, Gyroid, Schwarz D) centred at
X = −0.20, 0, +0.20 m.  POI_RADIUS = 0.082 m.  Flat-shaded for the faceted
aesthetic.  GLB: +Y up, apply transforms, Draco level 6, WebP textures.
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── Parameters ───────────────────────────────────────────────────────────────
SLUG         = "hf_tpms_poi"
N            = 32          # grid resolution per axis — 31³ ≈ 29 000 cubes
POI_RADIUS   = 0.082       # 8.2 cm poi head (metres)
MAT_NAME     = "HoloflowTPMSMat"
X_SPREAD     = 0.22        # lateral spacing between the three poi heads (m)

# Six tetrahedra sharing the body-diagonal edge v₀=(0,0,0)→v₆=(1,1,1).
# Each tet is uniquely defined by v₀, v₆, and two of the six intermediate
# cube vertices cycling around the diagonal.
CUBE_TETS = (
    (0, 1, 5, 6),
    (0, 1, 2, 6),
    (0, 2, 3, 6),
    (0, 3, 7, 6),
    (0, 4, 7, 6),
    (0, 4, 5, 6),
)

# Cube vertex offsets matching index order 0…7:
# 0:(0,0,0) 1:(1,0,0) 2:(1,1,0) 3:(0,1,0) 4:(0,0,1) 5:(1,0,1) 6:(1,1,1) 7:(0,1,1)
CUBE_OFF = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.float64,
)

# ── TPMS implicit functions F(X,Y,Z) = 0 ────────────────────────────────────
def tpms_p(X, Y, Z):
    """Schwarz Primitive: nodal approximation of a cube-corner soap film."""
    return np.cos(X) + np.cos(Y) + np.cos(Z)

def tpms_d(X, Y, Z):
    """Schwarz Diamond: nodal approximation of the diamond crystal lattice."""
    return (np.sin(X)*np.sin(Y)*np.sin(Z)
          + np.sin(X)*np.cos(Y)*np.cos(Z)
          + np.cos(X)*np.sin(Y)*np.cos(Z)
          + np.cos(X)*np.cos(Y)*np.sin(Z))

def tpms_gyroid(X, Y, Z):
    """Schoen Gyroid (1970): chiral — no inversion or mirror symmetry."""
    return np.sin(X)*np.cos(Y) + np.sin(Y)*np.cos(Z) + np.sin(Z)*np.cos(X)

# ── Analytic unit normals n̂ = ∇F/|∇F| for Gauss-map vertex colour ──────────
def _norm(gx, gy, gz):
    n = np.sqrt(gx*gx + gy*gy + gz*gz) + 1e-12
    return gx/n, gy/n, gz/n

def normal_p(x, y, z):
    return _norm(-np.sin(x), -np.sin(y), -np.sin(z))

def normal_gyroid(x, y, z):
    return _norm(
        np.cos(x)*np.cos(y) - np.sin(z)*np.sin(x),
        np.cos(y)*np.cos(z) - np.sin(x)*np.sin(y),
        np.cos(z)*np.cos(x) - np.sin(y)*np.sin(z),
    )

def normal_d(x, y, z):
    gx = (np.cos(x)*np.sin(y)*np.sin(z) + np.cos(x)*np.cos(y)*np.cos(z)
        - np.sin(x)*np.sin(y)*np.cos(z) - np.sin(x)*np.cos(y)*np.sin(z))
    gy = (np.sin(x)*np.cos(y)*np.sin(z) - np.sin(x)*np.sin(y)*np.cos(z)
        + np.cos(x)*np.cos(y)*np.cos(z) - np.cos(x)*np.sin(y)*np.sin(z))
    gz = (np.sin(x)*np.sin(y)*np.cos(z) - np.sin(x)*np.cos(y)*np.sin(z)
        - np.cos(x)*np.sin(y)*np.sin(z) + np.cos(x)*np.cos(y)*np.cos(z))
    return _norm(gx, gy, gz)

# ── Marching Tetrahedra ──────────────────────────────────────────────────────
def _lerp(va, vb, fa, fb, iso=0.0):
    """Sub-cell linear interpolation to iso-crossing on edge (va, vb)."""
    t = np.clip((iso - fa) / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t * (vb - va)

def _march_cube(cv, cf, iso=0.0):
    """Yield triangle vertex-triplets (each shape (3,3)) from one cube."""
    tris = []
    for ti in CUBE_TETS:
        vs = cv[list(ti)]       # (4, 3) world positions
        fs = cf[list(ti)]       # (4,)   scalar values
        ins = fs < iso
        n_in = int(ins.sum())
        if n_in == 0 or n_in == 4:
            continue

        # Collect edge mid-points where sign changes
        cuts: dict = {}
        for a in range(4):
            for b in range(a + 1, 4):
                if ins[a] != ins[b]:
                    cuts[(a, b)] = _lerp(vs[a], vs[b], fs[a], fs[b], iso)

        if n_in == 1 or n_in == 3:
            tris.append(np.array(list(cuts.values())))  # exactly 3 cut points
        else:                                            # n_in == 2
            iv = [i for i in range(4) if ins[i]]
            ov = [i for i in range(4) if not ins[i]]
            i0, i1 = iv;  j0, j1 = ov
            q = [cuts[(min(i0,j0), max(i0,j0))],
                 cuts[(min(i0,j1), max(i0,j1))],
                 cuts[(min(i1,j1), max(i1,j1))],
                 cuts[(min(i1,j0), max(i1,j0))]]
            tris.append(np.array([q[0], q[1], q[2]]))
            tris.append(np.array([q[0], q[2], q[3]]))
    return tris

def extract_tpms(fn, N=32, iso=0.0):
    """
    Marching-Tetrahedra isosurface of fn over [0, 2π]³.
    Returns (verts: ndarray (V,3), faces: list of 3-int-lists).
    Only visits cells where min/max corners straddle iso (sparse pass).
    """
    step  = 2.0 * math.pi / (N - 1)
    coords = np.linspace(0.0, 2.0 * math.pi, N)
    X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')
    field = fn(X, Y, Z)

    # Stack 8 corner sub-fields for all (N-1)³ cells simultaneously
    corners = np.stack(
        [field[a:a+N-1, b:b+N-1, c:c+N-1]
         for a, b, c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0,
    )  # (8, N-1, N-1, N-1)
    active = np.argwhere((corners.min(axis=0) < iso) & (corners.max(axis=0) > iso))

    verts_out: list = []
    faces_out: list = []
    idx_map:   dict = {}

    for ix, iy, iz in active:
        base = np.array([ix, iy, iz], dtype=np.float64) * step
        cv   = base + CUBE_OFF * step            # (8, 3) world positions
        cf   = corners[:, ix, iy, iz]            # (8,)   pre-computed values
        for tri in _march_cube(cv, cf, iso):
            face = []
            for pt in tri:
                key = tuple(np.round(pt, 8))
                if key not in idx_map:
                    idx_map[key] = len(verts_out)
                    verts_out.append(pt)
                face.append(idx_map[key])
            faces_out.append(face)

    return (np.array(verts_out) if verts_out else np.zeros((0, 3))), faces_out

# ── Gauss-map vertex colour ──────────────────────────────────────────────────
def _gauss_colours(fn_normal, verts_grid):
    """RGBA per vertex: red=upward n_z>0, green=saddle n_z≈0, blue=downward."""
    xs, ys, zs = verts_grid[:, 0], verts_grid[:, 1], verts_grid[:, 2]
    _, _, nz = fn_normal(xs, ys, zs)
    R = np.clip( nz, 0.0, 1.0)
    G = np.clip(1.0 - np.abs(nz) * 0.85, 0.0, 1.0) * 0.25
    B = np.clip(-nz, 0.0, 1.0)
    A = np.ones(len(verts_grid), dtype=np.float32)
    return np.stack([R, G, B, A], axis=1).astype(np.float32)

# ── Mesh builder ─────────────────────────────────────────────────────────────
def _make_mat():
    mat = bpy.data.materials.get(MAT_NAME)
    if mat:
        return mat
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree;  nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfDiffuse")
    vc   = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "GaussMap"
    nt.links.new(vc.outputs["Color"],  bsdf.inputs["Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

def build_poi(fn, fn_normal, name, N=32):
    """Extract TPMS, scale to poi-head radius, apply Gauss-map colours."""
    vg, faces = extract_tpms(fn, N=N)
    if vg.shape[0] == 0:
        raise RuntimeError(f"No surface extracted for {name}; try larger N.")
    centre = vg.mean(axis=0)
    extent = np.max(np.abs(vg - centre))
    scale  = POI_RADIUS / extent
    vm     = (vg - centre) * scale          # mesh coords (metres)

    me = bpy.data.meshes.new(name)
    me.from_pydata([Vector(v) for v in vm], [], faces)
    me.update()
    for poly in me.polygons:                # flat shading — faceted studio look
        poly.use_smooth = False

    # Vertex colours from unit normal z-component (grid coordinates)
    cols  = _gauss_colours(fn_normal, vg)
    attr  = me.color_attributes.new("GaussMap", 'FLOAT_COLOR', 'POINT')
    for i, c in enumerate(cols):
        attr.data[i].color = tuple(c)

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    me.materials.append(_make_mat())
    return ob

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    for name in ("schwarz_p", "gyroid", "schwarz_d"):
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)

    specs = [
        (tpms_p,      normal_p,       "schwarz_p",  -X_SPREAD),
        (tpms_gyroid, normal_gyroid,  "gyroid",       0.0),
        (tpms_d,      normal_d,       "schwarz_d",   +X_SPREAD),
    ]
    objects = []
    for fn, fn_n, name, x in specs:
        print(f"  Extracting {name}…")
        ob = build_poi(fn, fn_n, name, N=N)
        ob.location.x = x
        objects.append(ob)

    print(f"Done — {len(objects)} TPMS poi heads: "
          f"{sum(len(o.data.polygons) for o in objects)} triangles total.")

    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects:
        ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath       = f"//{SLUG}.glb",
        use_selection  = True,
        export_format  = 'GLB',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_yup     = True,
        export_apply   = True,
        export_image_format = 'WEBP',
    )
    print(f"GLB exported: {SLUG}.glb")

main()
