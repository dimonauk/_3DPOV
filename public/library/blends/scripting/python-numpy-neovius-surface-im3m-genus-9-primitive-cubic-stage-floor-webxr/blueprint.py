"""
Neovius Surface — Im-3m TPMS, Genus 9, Stage Floor (Blender 5.1)
=================================================================
Edvard Rudolf Neovius (1851–1917) published this triply periodic minimal
surface in his 1883 Helsingfors doctoral thesis.  The level-set equation:

    f(x, y, z) = 3(cos x + cos y + cos z) + 4 cos x · cos y · cos z = 0

defines a surface with SPACE GROUP Im-3m (#229, body-centred cubic Oh⁹) —
the same symmetry as BCC iron, tungsten, and molybdenum.

TOPOLOGY & CHANNEL STRUCTURE
    Euler characteristic χ = −16 per conventional cubic cell [0, 2π]³.
    Genus g = (2 − χ)/2 = 9 per primitive BCC unit cell.
    This is far higher than the three canonical TPMS (Schwarz P/D, Gyroid)
    which each have g = 3.

    Two interpenetrating, NON-CONGRUENT channel systems:
      Larger labyrinth:  f > 0 region, ~74% of cell volume, six-connected,
                         channels run along ⟨100⟩ and ⟨110⟩ directions.
      Smaller labyrinth: f < 0 region, ~26%, star-shaped pockets centred
                         on the BCC body-centre at (π, π, π).

COMPARISON WITH OTHER TPMS (companion tutorials cross-referenced below)
    Schwarz P   f = Cx+Cy+Cz                  Pm-3m  g=3  congruent
    Schwarz D   f = Sx·Sy·Sz+Sx·Cy·Cz+…      Fd-3m  g=3  congruent
    Gyroid      f = Sx·Cy+Sy·Cz+Sz·Cx        Ia-3d  g=3  congruent
    Neovius     f = 3(Cx+Cy+Cz)+4·Cx·Cy·Cz   Im-3m  g=9  non-congruent ✓

GAUSSIAN CURVATURE
    Since H = 0 everywhere on a minimal surface: K = κ₁κ₂ = −κ₁² ≤ 0.
    Analytic K from the implicit form via bordered Hessian:
        K = −(∇f · cof(Hf) · ∇f) / |∇f|⁴
    where cof(Hf) is the cofactor matrix of the 3×3 Hessian.
    Vertex colour maps |K|^GAMMA → Cobalt (flat) ↔ Amber (deep saddle).

BLENDER OBJECT
    Stage floor: x,y ∈ [0, 4π], z ∈ [0, 2π] (2 × 2 × 1 periods).
    Marching tetrahedra (6-tet Doi–Koide decomposition, 1991) at N=34
    samples per 2π → ~68 × 68 × 34 grid, ~40–60 k output triangles.
    holoflow:facet=True · holoflow:category=stage-floor · CC0.
"""

import bpy, bmesh, math, pathlib
import numpy as np

# ─── parameters ──────────────────────────────────────────────────────────────
SLUG        = "neovius_floor"
N_GRID      = 34          # voxels per 2π; 68×68×34 over 2×2×1 periods
ISO         = 0.0         # isosurface level (0 = true Neovius approximation)
PHYS_SIZE   = 1.20        # floor side length in metres (x and y extent)
PHYS_THICK  = 0.30        # floor z-extent in metres
K_GAMMA     = 0.45        # colour gamma compression: t = (|K|/K_max)^K_GAMMA

COL_COBALT  = (0.02, 0.12, 0.60, 1.0)    # K ≈ 0, near-flat
COL_TEAL    = (0.04, 0.50, 0.40, 1.0)    # mid saddle
COL_AMBER   = (0.90, 0.55, 0.05, 1.0)    # deep saddle

ISO_SKS     = {"SK_Expand": +0.50, "SK_Compress": -0.50, "SK_Wide": +0.90}
GLB_OUT     = pathlib.Path(bpy.path.abspath("//")) / f"{SLUG}.glb"

# ─── Neovius level-set (vectorised) ──────────────────────────────────────────

def _trig(X, Y, Z):
    return np.cos(X), np.cos(Y), np.cos(Z), np.sin(X), np.sin(Y), np.sin(Z)

def neovius(X, Y, Z):
    Cx, Cy, Cz = np.cos(X), np.cos(Y), np.cos(Z)
    return 3.0*(Cx + Cy + Cz) + 4.0*Cx*Cy*Cz

def neovius_K(X, Y, Z):
    """Gaussian curvature via cofactor formula K = -(∇f · cof(Hf) · ∇f) / |∇f|⁴."""
    Cx, Cy, Cz, Sx, Sy, Sz = _trig(X, Y, Z)
    # gradient
    fx = -(3.0 + 4.0*Cy*Cz)*Sx
    fy = -(3.0 + 4.0*Cx*Cz)*Sy
    fz = -(3.0 + 4.0*Cx*Cy)*Sz
    # Hessian (symmetric)
    fxx = -(3.0 + 4.0*Cy*Cz)*Cx
    fyy = -(3.0 + 4.0*Cx*Cz)*Cy
    fzz = -(3.0 + 4.0*Cx*Cy)*Cz
    fxy =  4.0*Sx*Sy*Cz
    fxz =  4.0*Sx*Sz*Cy
    fyz =  4.0*Sy*Sz*Cx
    # cofactor matrix entries
    c11 = fyy*fzz - fyz**2;  c22 = fxx*fzz - fxz**2;  c33 = fxx*fyy - fxy**2
    c12 = -(fxy*fzz - fxz*fyz)
    c13 =   fxy*fyz - fyy*fxz
    c23 = -(fxx*fyz - fxy*fxz)
    # ∇f · cof · ∇f
    gHg = (fx*(c11*fx + c12*fy + c13*fz) +
           fy*(c12*fx + c22*fy + c23*fz) +
           fz*(c13*fx + c23*fy + c33*fz))
    denom = fx**2 + fy**2 + fz**2
    K = -gHg / (denom**2 + 1e-30)
    return K

# ─── marching tetrahedra ─────────────────────────────────────────────────────
# 6-tet Doi–Koide decomposition: v0 and v7 are opposite cube corners
TETS = [(0,1,3,7),(0,3,2,7),(0,2,6,7),(0,6,4,7),(0,4,5,7),(0,5,1,7)]
COFF = [(0,0,0),(1,0,0),(0,1,0),(1,1,0),(0,0,1),(1,0,1),(0,1,1),(1,1,1)]

def _lerp(Pa, Pb, fa, fb, iso):
    t = (iso - fa) / (fb - fa + 1e-30)
    return Pa + t*(Pb - Pa)

def _march_tet(P4, F4, iso):
    """Return 0, 1, or 2 triangles for one tetrahedron."""
    inside = F4 > iso
    n = inside.sum()
    if n == 0 or n == 4:
        return []
    in_i, out_i = np.where(inside)[0], np.where(~inside)[0]
    if n == 1:
        i = in_i[0]
        pts = [_lerp(P4[i], P4[j], F4[i], F4[j], iso) for j in out_i]
        return [pts]                          # winding: CCW facing outward
    if n == 3:
        j = out_i[0]
        pts = [_lerp(P4[j], P4[i], F4[j], F4[i], iso) for i in in_i]
        return [list(reversed(pts))]          # flip normal
    # n == 2: four edges → quad → two triangles
    i0, i1 = in_i;  j0, j1 = out_i
    p00 = _lerp(P4[i0],P4[j0],F4[i0],F4[j0],iso)
    p01 = _lerp(P4[i0],P4[j1],F4[i0],F4[j1],iso)
    p10 = _lerp(P4[i1],P4[j0],F4[i1],F4[j0],iso)
    p11 = _lerp(P4[i1],P4[j1],F4[i1],F4[j1],iso)
    return [[p00, p01, p11], [p00, p11, p10]]

def extract_neovius(iso=ISO):
    nx = ny = N_GRID * 2          # two periods in x and y
    nz = N_GRID                   # one period in z
    xi = np.linspace(0, 4*math.pi, nx+1)
    yi = np.linspace(0, 4*math.pi, ny+1)
    zi = np.linspace(0, 2*math.pi, nz+1)
    XX, YY, ZZ = np.meshgrid(xi, yi, zi, indexing="ij")
    F = neovius(XX, YY, ZZ)

    # Active cubes: at least one corner inside AND one outside
    ins = (F > iso).astype(np.int8)
    n_in = sum(ins[di:ins.shape[0]-1+di, dj:ins.shape[1]-1+dj, dk:ins.shape[2]-1+dk]
               for di,dj,dk in COFF)
    active = np.argwhere((n_in > 0) & (n_in < 8))

    verts, tris, vkey = [], [], {}

    def vert_id(pt):
        k = (round(float(pt[0]),7), round(float(pt[1]),7), round(float(pt[2]),7))
        if k not in vkey:
            vkey[k] = len(verts);  verts.append(k)
        return vkey[k]

    for ci, cj, ck in active:
        P8 = np.array([(xi[ci+di], yi[cj+dj], zi[ck+dk]) for di,dj,dk in COFF])
        F8 = np.array([F[ci+di, cj+dj, ck+dk] for di,dj,dk in COFF])
        for t4 in TETS:
            for tri in _march_tet(P8[list(t4)], F8[list(t4)], iso):
                ids = [vert_id(p) for p in tri]
                if len(set(ids)) == 3:
                    tris.append(ids)
    return np.array(verts), np.array(tris, dtype=np.int32)

# ─── build Blender mesh ───────────────────────────────────────────────────────
def build_mesh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    # ── basis mesh ──────────────────────────────────────────────────────────
    verts_raw, tris_raw = extract_neovius(ISO)

    # Normalise to physical space
    lo, hi = verts_raw.min(0), verts_raw.max(0)
    span = hi - lo
    scale = np.array([PHYS_SIZE / span[0], PHYS_SIZE / span[1], PHYS_THICK / span[2]])
    verts_norm = (verts_raw - lo) * scale

    # Build bmesh
    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in verts_norm]
    bm.verts.index_update()
    for tri in tris_raw:
        try:
            bm.faces.new([bm_verts[i] for i in tri])
        except Exception:
            pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    for f in bm.faces:
        f.smooth = False

    me = bpy.data.meshes.new(SLUG)
    bm.to_mesh(me);  bm.free()
    obj = bpy.data.objects.new(SLUG, me)
    scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj["holoflow:facet"] = True
    obj["holoflow:category"] = "stage-floor"
    obj.rotation_euler = (math.pi/2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)

    # ── shape keys ──────────────────────────────────────────────────────────
    sk_basis = obj.shape_key_add(name="Basis", from_mix=False)
    sk_basis.interpolation = "KEY_LINEAR"

    for sk_name, iso_val in ISO_SKS.items():
        v_iso, _ = extract_neovius(iso_val)
        v_iso_norm = (v_iso - lo) * scale
        # Re-extract may give different vert count; use nearest-neighbour remap
        v0 = np.array([v.co[:] for v in obj.data.vertices])
        from scipy.spatial import cKDTree
        kd = cKDTree(v_iso_norm)
        _, idx = kd.query(v0)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.interpolation = "KEY_LINEAR"
        coords = v_iso_norm[idx].flatten().tolist()
        sk.data.foreach_set("co", coords)

    # ── Gaussian curvature vertex colour ────────────────────────────────────
    attr = me.color_attributes.new(name="Neovius_K", type="FLOAT_COLOR", domain="POINT")
    v_co = np.array([v.co[:] for v in me.vertices])  # (N,3) in physical space
    # Back-project to mathematical coordinates
    x_math = v_co[:,0] / scale[0] * 4*math.pi
    y_math = v_co[:,1] / scale[1] * 4*math.pi
    z_math = v_co[:,2] / scale[2] * 2*math.pi
    K_vals = neovius_K(x_math, y_math, z_math)          # K ≤ 0 everywhere
    mag = np.abs(K_vals)
    t = np.clip((mag / (np.percentile(mag, 97) + 1e-30))**K_GAMMA, 0.0, 1.0)

    def lerp3(a, b, s):
        return tuple(a[i]*(1-s)+b[i]*s for i in range(4))

    cols = []
    for s in t:
        if s < 0.5:
            cols.append(lerp3(COL_COBALT, COL_TEAL, s*2))
        else:
            cols.append(lerp3(COL_TEAL, COL_AMBER, (s-0.5)*2))
    attr.data.foreach_set("color", [c for rgba in cols for c in rgba])

    # ── material ────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new(f"{SLUG}_mat")
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    nt.nodes.clear()
    vc  = nt.nodes.new("ShaderNodeVertexColor");  vc.layer_name = "Neovius_K"
    bsdf = nt.nodes.new("ShaderNodeBsdfDiffuse")
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(vc.outputs["Color"], bsdf.inputs["Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.append(mat)

    # ── GLB export ──────────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=str(GLB_OUT.with_suffix(".blend")))
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_morph=True,
        export_apply=True,
        export_yup=True,
        export_image_format="WEBP",
        use_selection=False,
    )
    print(f"[Neovius] GLB written → {GLB_OUT}")

build_mesh()
