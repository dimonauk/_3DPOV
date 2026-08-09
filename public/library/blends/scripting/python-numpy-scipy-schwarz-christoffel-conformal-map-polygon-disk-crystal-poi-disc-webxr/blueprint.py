"""
Schwarz–Christoffel Conformal Map — Crystal Poi Disc  (Blender 5.1 blueprint)
==============================================================================
The Schwarz–Christoffel (SC) formula is the only explicit closed-form
conformal map from the unit disk to a polygon interior.  Prevertices
w_k = exp(2πik/n) on ∂D map to the polygon vertices; the derivative is

    f'(w) = C · ∏_{k=0}^{n-1} (1 − w·w̄_k)^{α_k − 1}

For a REGULAR n-gon (all interior angles π(n−2)/n and the polynomial
identity ∏(1−w·w̄_k) = 1−w^n) this collapses elegantly to

    f'(w) = C · (1 − w^n)^{−2/n}

Integrating term-by-term (substitution u = t^n) gives the hypergeometric form

    f(w) = C · w · ₂F₁(1/n, 2/n; 1+1/n; w^n)          [Gauss, 1812]

C is pinned by the Gauss–Euler evaluation ₂F₁(a,b;c;1) = Γ(c)Γ(c−a−b)/[Γ(c−a)Γ(c−b)]
(valid when Re(c−a−b) = 1−2/n > 0, i.e., n ≥ 3):

    C = Γ(1−1/n) / [ Γ(1+1/n) · Γ(1−2/n) ]

CONFORMAL DISTORTION MAP  The Jacobian J = |f'|² = C²·|1−w^n|^{−4/n}
is uniform at w=0 and diverges as w → prevertex w_k: the disk's smooth
boundary is "squeezed" into the polygon corner.  Colouring by log J
produces a stained-glass distortion field — violet in the flat interior,
amber at the sharp corners.

Five shape keys cycle: n=3 triangle → n=4 square → n=5 pentagon →
n=6 hexagon → n=8 octagon, each a distinct crystal symmetry.

Run:  blender --background --python blueprint.py
"""

import bpy, bmesh, math, os, pathlib
import numpy as np
from mathutils import Vector

# ── Optional scipy; pure power-series fallback ────────────────────────────────
try:
    from scipy.special import hyp2f1 as _sci_hyp2f1, gamma as _sci_gamma
    _hyp2f1_vec = np.vectorize(
        lambda zi, a, b, c: _sci_hyp2f1(a, b, c, complex(zi)), otypes=[complex])
    def _hyp2f1(a, b, c, z):   return _hyp2f1_vec(z, a, b, c)
    def _gamma(x):              return float(_sci_gamma(x))
except ImportError:
    def _hyp2f1(a, b, c, z, N=90):
        """₂F₁(a,b;c;z) via hypergeometric power series — converges for |z|<1."""
        result, term = np.ones_like(z, dtype=complex), np.ones_like(z, dtype=complex)
        for k in range(1, N):
            term   = term * ((a + k - 1) * (b + k - 1) / ((c + k - 1) * k)) * z
            result += term
            if np.max(np.abs(term)) < 1e-14: break
        return result
    import math as _math
    def _gamma(x):              return _math.gamma(x)

# ── Constants ─────────────────────────────────────────────────────────────────
N_RINGS       = 22        # concentric rings (excluding centre pole vertex)
N_SECTORS     = 48        # angular divisions — divisible by 3,4,6,8,12
R_MAX         = 0.90      # max |w|; keeps |w^n| ≤ 0.90^3=0.73 well inside |z|<1
DISC_THICK    = 0.009     # m — solidify depth
POI_DIAM      = 0.12      # m — target poi head diameter
POLE_R        = 0.0055    # m — pole cylinder radius
POLE_H        = 0.14      # m — pole cylinder height
BASIS_N       = 5         # pentagon is the Basis shape
N_SIDES_LIST  = [3, 4, 5, 6, 8]
SLUG = "python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr"

# ── SC map core ────────────────────────────────────────────────────────────────

def sc_C(n):
    """Normalisation constant: maps w=1 to circumradius 1."""
    return _gamma(1.0 - 1.0/n) / (_gamma(1.0 + 1.0/n) * _gamma(1.0 - 2.0/n))

def sc_map(w, n):
    """f(w) = C·w·₂F₁(1/n, 2/n; 1+1/n; w^n). Input w: complex 1-D array."""
    return sc_C(n) * w * _hyp2f1(1.0/n, 2.0/n, 1.0 + 1.0/n, w**n)

def log_jac(w, n):
    """log|f'(w)| = log|C| − (2/n)·log|1−w^n|. Diverges at polygon corners."""
    return math.log(abs(sc_C(n))) + (-2.0/n) * np.log(np.maximum(np.abs(1.0 - w**n), 1e-7))

# ── Disk polar grid ────────────────────────────────────────────────────────────

def disk_grid(nr, ns, r_max):
    """Returns complex (nr*ns,) grid. Innermost ring at r_max/nr."""
    r  = np.linspace(r_max / nr, r_max, nr)
    th = np.linspace(0, 2 * math.pi, ns, endpoint=False)
    R, TH = np.meshgrid(r, th, indexing='ij')
    return (R * np.exp(1j * TH)).ravel()

def c2xyz(z, z0=0.0):
    """Complex 1-D → float (N, 3)."""
    return np.column_stack([z.real, z.imag, np.full(len(z), z0)]).astype(float)

# ── Face topology ──────────────────────────────────────────────────────────────

def make_faces(nr, ns):
    """Quads for rings + triangle fan from innermost ring to pole (idx = nr*ns)."""
    faces, pole = [], nr * ns
    for ri in range(nr - 1):
        for si in range(ns):
            si1 = (si + 1) % ns
            a = ri*ns + si;  b = ri*ns + si1
            c = (ri+1)*ns + si1;  d = (ri+1)*ns + si
            faces.append((a, b, c, d))
    for si in range(ns):                       # fan → centre pole
        faces.append(((si+1)%ns, si, pole))
    return faces

# ── Vertex colour: log-Jacobian ────────────────────────────────────────────────

def jac_rgba(w_flat, n, n_total):
    """Returns (n_total, 4) float32 RGBA — pole vertex appended as mean."""
    lj  = log_jac(w_flat, n)
    lj  = np.append(lj, lj.mean())
    t   = (lj - lj.min()) / (lj.max() - lj.min() + 1e-12)
    # violet (low distortion, interior) → amber (high distortion, corners)
    h   = 0.75 - t * 0.65
    s   = 0.70 + t * 0.25
    v   = 0.55 + t * 0.40
    i   = (h * 6).astype(int) % 6
    f   = h * 6 - i
    p, q, tv = v*(1-s), v*(1-s*f), v*(1-s*(1-f))
    r = np.choose(i, [v, q, p, p, tv, v])
    g = np.choose(i, [tv, v, v, q, p, p])
    b = np.choose(i, [p, p, tv, v, v, q])
    return np.column_stack([r, g, b, np.ones(n_total)]).astype(np.float32)

# ── Main ───────────────────────────────────────────────────────────────────────

def build():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    w_flat = disk_grid(N_RINGS, N_SECTORS, R_MAX)
    N_VERTS = N_RINGS * N_SECTORS + 1    # +1 pole

    # Basis (pentagon)
    pos_basis = sc_map(w_flat, BASIS_N)
    verts_3d  = np.vstack([c2xyz(pos_basis), [[0, 0, 0]]])   # append pole
    faces     = make_faces(N_RINGS, N_SECTORS)

    mesh = bpy.data.meshes.new("SCDisc")
    mesh.from_pydata(verts_3d.tolist(), [], faces)
    mesh.update()
    obj  = bpy.data.objects.new("SC_CrystalDisc", mesh)
    bpy.context.scene.collection.objects.link(obj)

    # Shape keys
    obj.shape_key_add(name="Basis", from_mix=False)
    for n in N_SIDES_LIST:
        if n == BASIS_N: continue
        pos_n  = sc_map(w_flat, n)
        verts_n = np.vstack([c2xyz(pos_n), [[0, 0, 0]]])
        sk = obj.shape_key_add(name=f"Poly_{n:02d}", from_mix=False)
        sk.data.foreach_set("co", verts_n.ravel())

    # Vertex colours (Jacobian distortion field)
    rgba = jac_rgba(w_flat, BASIS_N, N_VERTS)
    ca = mesh.color_attributes.new("SCDistortion", 'FLOAT_COLOR', 'POINT')
    ca.data.foreach_set("color", rgba.ravel())

    # Material — emission reads conformal distortion attribute
    mat = bpy.data.materials.new("SCCrystal")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    attr = nt.nodes.new('ShaderNodeAttribute'); attr.attribute_name = "SCDistortion"
    emit = nt.nodes.new('ShaderNodeEmission');  emit.inputs['Strength'].default_value = 3.5
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    mat.shadow_method = 'NONE'
    obj.data.materials.append(mat)

    # Solidify gives the flat disc physical thickness
    sol = obj.modifiers.new("Solidify", 'SOLIDIFY')
    sol.thickness = DISC_THICK; sol.offset = 0.0; sol.use_rim = True

    # Holoflow metadata
    obj['holoflow:facet'] = True; obj['holoflow:category'] = 'poi-head'

    # Scale to poi diameter
    bbox = np.max(np.abs(verts_3d[:, :2]))
    if bbox > 0:
        s = (POI_DIAM / 2.0) / bbox
        obj.scale = (s, s, s)
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(scale=True)

    # Pole cylinder
    bpy.ops.mesh.primitive_cylinder_add(radius=POLE_R, depth=POLE_H,
        location=(0, 0, -(DISC_THICK/2 + POLE_H/2)))
    pole = bpy.context.active_object; pole.name = "SC_Pole"
    pm = bpy.data.materials.new("PoleMat"); pm.use_nodes = True
    pm.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.9
    pm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.2
    pole.data.materials.append(pm)

    # GLB export
    out_dir = pathlib.Path(bpy.path.abspath("//")) / "public/library/blends/scripting" / SLUG
    out_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out_dir / "hf_sc_crystal_disc.blend"))
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=str(out_dir / "hf_sc_crystal_disc.glb"),
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True, export_morph=True,
        export_yup=True, export_image_format='WEBP',
        use_selection=True,
    )
    print(f"[SC] Written → {out_dir}")

build()
