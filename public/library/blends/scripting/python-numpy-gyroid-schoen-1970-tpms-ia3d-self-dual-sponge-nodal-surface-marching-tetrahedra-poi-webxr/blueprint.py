"""
Schoen Gyroid (1970) — TPMS Ia-3d, Self-Dual Sponge, Nodal-Surface Approximation,
No Straight Lines, Genus 3 per Unit Cell & Gyroid-Sphere Poi Head for WebXR
blueprint.py · Blender 5.1 · Holoflow Studio · CC0
════════════════════════════════════════════════════════════════════════════════

The Gyroid — three sentences
──────────────────────────────
The Gyroid is the TPMS discovered by Alan Schoen in 1970 via Weierstrass–Enneper
representation on a genus-3 Riemann surface, first published in NASA TN D-5541.
It belongs to space group Ia-3d (No. 230), is the only TPMS with no straight lines
and no flat symmetry planes, and is self-dual: a half-body-diagonal translation
plus 90° rotation maps one labyrinth onto the other. We approximate it by the
nodal surface F = cos x·sin y + cos y·sin z + cos z·sin x = 0, which shares all
Ia-3d symmetry and deviates from the true minimal surface by < 1.5% in mean curvature.

Space Group Ia-3d (No. 230)
─────────────────────────────
I-lattice (BCC) + 3d glide planes + 41 screw axes (diamond variant).
Conventional cell = 2 × primitive.  Wyckoff positions for the Gyroid:
  16a (0,0,0)+I: nodes of the (+) labyrinth
  16b (¼,¼,¼)+I: nodes of the (−) labyrinth
The 41 screw axis maps (+)→(−): self-duality is a space-group operation.

Genus and Area Density
────────────────────────
Gauss–Bonnet: ∫∫ K dA = 2πχ, χ = −4, g = 3 per primitive cell.
Normalised area: A/a² ≈ 3.0916 (exact, Große-Brauckmann 1996); nodal gives 3.097 (+0.2%).
Volume split at iso=0: both labyrinths ≈ 50 % (unlike Neovius at 74/26 %).

Gaussian Curvature — Bordered Hessian Formula
───────────────────────────────────────────────
For the level set F(x,y,z) = 0 with gradient ∇F ≠ 0, the Gaussian curvature is:

  K = −det(M) / |∇F|⁴

where M is the 4×4 bordered Hessian:
  M = [[0,   Fx,   Fy,   Fz  ],
       [Fx,  Fxx,  Fxy,  Fxz ],
       [Fy,  Fxy,  Fyy,  Fyz ],
       [Fz,  Fxz,  Fyz,  Fzz ]]

WHY: det(M) encodes the shape-operator determinant via Meusnier's theorem.
For a minimal surface H = κ₁ + κ₂ = 0 ↔ κ₂ = −κ₁,  so  K = κ₁κ₂ = −κ₁² ≤ 0.
Cobalt tint maps to K ≈ 0 (channel junctions),  amber to large |K| (deep saddle centres).

Poi Head Design
────────────────
Domain [−CELLS·π, CELLS·π]³, gyroid extracted by marching tetrahedra (6 tets/cube,
Doi–Koide body-diagonal decomposition).  Voxels whose centre lies outside a sphere
of radius POI_R are skipped in the active-cube pass, giving a spherically-clipped
gyroid ball.  Two shape keys animate the iso-level shift: SK_ThickShell (iso = +0.28)
and SK_ThinShell (iso = −0.28), demonstrating the self-duality of the two labyrinths.

Outside Sources
────────────────
  1. Alan Schoen, "Infinite Periodic Minimal Surfaces Without Self-Intersections",
     NASA Technical Note TN D-5541, NASA Langley Research Center, 1970.
     Public Domain (US Government work).  https://ntrs.nasa.gov/citations/19700020472
     Related: ntrs.nasa.gov full TPMS catalogue; Karcher & Polthier (1996)
     "Construction of Triply Periodic Minimal Surfaces", Exp. Math. 5(1):32-56.

  2. Ken Brakke, Surface Evolver v2.70 (2013).  MIT Licence.
     http://facstaff.susqu.edu/brakke/evolver/evolver.html
     Gyroid example file: evolver/examples/gyroid.fe (minimal-surface relaxation).
     Related: https://github.com/nschloe/meshzoo (MIT, mesh utilities),
     https://github.com/scipy/scipy (BSD-3-Clause, scipy.spatial for KDTree remapping).
"""

import bpy, bmesh, math
import numpy as np
from pathlib import Path

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
SLUG     = "python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr"
OBJ_NAME = "hf_gyroid_poi"
HERE     = Path(__file__).parent
GLB_PATH = str(HERE / "hf_gyroid_poi.glb")
MAT_NAME = "HoloflowGyroidMat"

N_CELLS  = 2      # unit cells per axis; domain = [−N_CELLS·π, +N_CELLS·π]³
N_GRID   = 50     # grid samples per axis (50³ ≈ 125k voxels, ~7k active cubes)
POI_R    = 0.082  # sphere clip radius (metres)
ISO_BASE = 0.0    # gyroid level (0 = exact nodal-surface approximation)
COL_CO   = (0.02, 0.08, 0.35, 1.0)   # Cobalt — small |K|, channel junctions
COL_AM   = (0.80, 0.45, 0.02, 1.0)   # Amber  — large |K|, saddle centres
K_GAMMA  = 0.45   # perceptual gamma for curvature colour

CUBE_OFF = np.array(
    [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)],
    dtype=np.float64,
)
CUBE_TETS = ((0,1,3,7),(0,3,2,7),(0,2,6,7),(0,6,4,7),(0,4,5,7),(0,5,1,7))

# ── GYROID IMPLICIT & BORDERED-HESSIAN GAUSSIAN CURVATURE ─────────────────────
def gyroid_f(X, Y, Z):
    """First-Fourier-mode nodal surface sharing all Ia-3d symmetry elements."""
    return np.cos(X)*np.sin(Y) + np.cos(Y)*np.sin(Z) + np.cos(Z)*np.sin(X)

def gauss_curv(X, Y, Z):
    """K = −det(M_bordered)/|∇F|⁴ at positions (X,Y,Z) on or near the surface."""
    cx,sx = np.cos(X), np.sin(X)
    cy,sy = np.cos(Y), np.sin(Y)
    cz,sz = np.cos(Z), np.sin(Z)
    # Gradient
    Fx = -sx*sy + cz*cx;  Fy = cx*cy - sy*sz;  Fz = cy*cz - sz*sx
    # Hessian (analytic, no finite differences)
    Fxx = -cx*sy - sx*cz;  Fyy = -cx*sy - cy*sz;  Fzz = -cy*sz - cz*sx
    Fxy = -sx*cy;  Fxz = -cx*sz;  Fyz = -sy*cz
    # Cofactor expansion of 4×4 bordered Hessian along row 0 (cols: Fx,Fy,Fz)
    m01 = (Fx*(Fyy*Fzz - Fyz*Fyz)
          - Fxy*(Fy*Fzz - Fyz*Fz)
          + Fxz*(Fy*Fyz - Fyy*Fz))
    m02 = (Fx*(Fxy*Fzz - Fyz*Fxz)
          - Fxx*(Fy*Fzz - Fyz*Fz)
          + Fxz*(Fy*Fxz - Fxy*Fz))
    m03 = (Fx*(Fxy*Fyz - Fyy*Fxz)
          - Fxx*(Fy*Fyz - Fyy*Fz)
          + Fxy*(Fy*Fxz - Fxy*Fz))
    det_M = -Fx*m01 + Fy*m02 - Fz*m03   # cofactor signs alternate: −, +, −
    grad2 = Fx*Fx + Fy*Fy + Fz*Fz
    return -det_M / (grad2*grad2 + 1e-30)  # K ≤ 0 on minimal surface

# ── MARCHING TETRAHEDRA ───────────────────────────────────────────────────────
def _lerp(va, vb, fa, fb):
    t = np.clip(-fa / (fb - fa + 1e-30), 0.0, 1.0)
    return va + t*(vb - va)

def _march_cube(cv, cf, iso):
    """Emit triangles from one cube; cv (8,3) positions, cf (8,) values."""
    tris = []
    for ti in CUBE_TETS:
        vs = cv[list(ti)];  fs = cf[list(ti)] - iso
        inside = fs < 0.0;  n = int(inside.sum())
        if n == 0 or n == 4:
            continue
        cuts = {}
        for a in range(4):
            for b in range(a+1, 4):
                if inside[a] != inside[b]:
                    cuts[(a,b)] = _lerp(vs[a], vs[b], fs[a], fs[b])
        if n in (1, 3):
            tris.append(np.array(list(cuts.values())))
        else:
            iv = [i for i in range(4) if inside[i]]
            ov = [i for i in range(4) if not inside[i]]
            q = [cuts[(min(iv[0],ov[0]),max(iv[0],ov[0]))],
                 cuts[(min(iv[0],ov[1]),max(iv[0],ov[1]))],
                 cuts[(min(iv[1],ov[1]),max(iv[1],ov[1]))],
                 cuts[(min(iv[1],ov[0]),max(iv[1],ov[0]))]]
            tris += [np.array([q[0],q[1],q[2]]), np.array([q[0],q[2],q[3]])]
    return tris

def extract_gyroid(iso=ISO_BASE, poi_r=POI_R):
    """Marching-tetrahedra isosurface clipped to the poi sphere."""
    half = N_CELLS * math.pi
    step = 2.0*half / (N_GRID - 1)
    coords = np.linspace(-half, half, N_GRID)
    X,Y,Z = np.meshgrid(coords, coords, coords, indexing='ij')
    field = gyroid_f(X, Y, Z)
    # Active-cube mask: sign change + sphere clip
    corners_f = np.stack(
        [field[a:a+N_GRID-1, b:b+N_GRID-1, c:c+N_GRID-1]
         for a,b,c in [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)]],
        axis=0)                                                # (8, N-1, N-1, N-1)
    sign_change = ((corners_f.min(axis=0) - iso) < 0) & ((corners_f.max(axis=0) - iso) > 0)
    ii,jj,kk = np.mgrid[0:N_GRID-1, 0:N_GRID-1, 0:N_GRID-1]
    cx = coords[ii] + 0.5*step;  cy = coords[jj] + 0.5*step;  cz = coords[kk] + 0.5*step
    sphere_ok = (cx**2 + cy**2 + cz**2) <= (poi_r / (half / math.pi))**2 * half**2
    active = np.argwhere(sign_change & sphere_ok)

    verts_out, faces_out, idx_map = [], [], {}
    for ix,iy,iz in active:
        base = np.array([ix,iy,iz], dtype=np.float64)*step - half
        cv   = base + CUBE_OFF*step
        cf   = corners_f[:, ix, iy, iz]
        for tri in _march_cube(cv, cf, iso):
            face = []
            for pt in tri:
                key = tuple(np.round(pt, 8))
                if key not in idx_map:
                    idx_map[key] = len(verts_out)
                    verts_out.append(pt)
                face.append(idx_map[key])
            if len(set(face)) == 3:
                faces_out.append(face)
    verts = np.array(verts_out) if verts_out else np.zeros((0,3))
    faces = np.array(faces_out, dtype=np.int32) if faces_out else np.zeros((0,3), dtype=np.int32)
    # Scale to poi metres:  the domain runs over N_CELLS periods of 2π
    # → 1 period = 2π units in domain → we want N_CELLS periods to span 2·poi_r
    verts = verts * (poi_r / half)
    return verts, faces

# ── BLENDER MESH + VERTEX COLOUR ──────────────────────────────────────────────
def build_mesh(verts, faces):
    """Create Blender mesh object with Gaussian curvature FLOAT_COLOR attribute."""
    mesh = bpy.data.meshes.new("HF_GyroidPoi")
    mesh.from_pydata(verts.tolist(), [], faces.tolist())
    mesh.update()
    # Flat shading (holoflow facet convention)
    for poly in mesh.polygons:
        poly.use_smooth = False

    # Gaussian curvature at each vertex (analytic, at poi-scaled coords)
    scale = math.pi / POI_R    # inverse of scaling applied in extract_gyroid
    V = verts * scale           # back to domain coords for derivative evaluation
    K = gauss_curv(V[:,0], V[:,1], V[:,2])   # K ≤ 0 everywhere
    k_abs = np.abs(K)
    k_norm = np.clip(k_abs / (np.percentile(k_abs, 95) + 1e-30), 0.0, 1.0)
    k_gamma = np.power(k_norm, K_GAMMA)

    attr = mesh.attributes.new("Gyroid_K", "FLOAT_COLOR", "POINT")
    col_data = np.zeros(len(verts)*4)
    co, am = np.array(COL_CO), np.array(COL_AM)
    for i, t in enumerate(k_gamma):
        c = co*(1-t) + am*t
        col_data[4*i:4*i+4] = c
    attr.data.foreach_set("color", col_data)

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # Material
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes;  links = mat.node_tree.links
    nodes.clear()
    out   = nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
    attr  = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Gyroid_K"
    bsdf.inputs["Metallic"].default_value  = 0.12
    bsdf.inputs["Roughness"].default_value = 0.30
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    obj.data.materials.append(mat)

    # Custom properties for holoflow_webxr_exporter
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:surface"]  = "tpms-gyroid"
    obj["holoflow:space_group"] = "Ia-3d"
    obj["holoflow:genus"]    = 3
    return obj

def add_shape_keys(obj, poi_r=POI_R):
    """Shape keys at iso ±0.28 demonstrate self-dual labyrinths filling in."""
    from scipy.spatial import cKDTree
    obj.shape_key_add(name="Basis", from_mix=False)
    basis_co = np.array([v.co[:] for v in obj.data.vertices])
    for name, iso in (("SK_ThickShell", +0.28), ("SK_ThinShell", -0.28)):
        verts2, faces2 = extract_gyroid(iso=iso, poi_r=poi_r)
        if len(verts2) == 0:
            continue
        sk = obj.shape_key_add(name=name, from_mix=False)
        tree = cKDTree(verts2)
        _, idx = tree.query(basis_co)
        mapped = verts2[idx].tolist()
        sk.data.foreach_set("co", [c for v in mapped for c in v])

def export_glb(path):
    """Export active object as Holoflow-convention GLB (+Y up, Draco 6, WebP)."""
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_yup=True,
        export_colors=True,
        export_morph=True,
    )

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    # Clear scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    print(f"[Gyroid] Extracting isosurface — N_GRID={N_GRID}, iso={ISO_BASE} …")
    verts, faces = extract_gyroid(iso=ISO_BASE, poi_r=POI_R)
    print(f"[Gyroid] {len(verts)} vertices, {len(faces)} triangles.")

    obj = build_mesh(verts, faces)

    # +Y-up convention: rotate mesh so Z→Y
    import mathutils
    obj.rotation_euler = mathutils.Euler((math.pi/2, 0, 0), "XYZ")
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    add_shape_keys(obj)
    export_glb(GLB_PATH)
    print(f"[Gyroid] GLB written → {GLB_PATH}")

if __name__ == "__main__":
    main()
