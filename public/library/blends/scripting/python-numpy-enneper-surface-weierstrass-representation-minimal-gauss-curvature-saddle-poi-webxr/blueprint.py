"""
Enneper Surface — Blender 5.1 expert blueprint
==============================================
Alfred Enneper, 1864.  The simplest complete minimal surface whose
Weierstrass–Enneper data are both entire (holomorphic on all of ℂ):
  g(z) = z      — the Gauss map is the identity
  dh   = dz     — the height differential is flat

Technique summary
-----------------
The Weierstrass–Enneper integral (Osserman 1986 convention):
  x = Re ∫ (1 − g²) dh  =  Re[z − z³/3]   →  u − u³/3 + u·v²
  y = Re ∫ i(1 + g²) dh =  −Im[z + z³/3]  →  −v + v³/3 − u²·v
  z = Re ∫ 2g dh        =  Re[z²]          →  u² − v²

Why this factorisation matters: (1−g²) and i(1+g²) are the real/imaginary
parts of the holomorphic null-curve Φ = ((1−g²), i(1+g²), 2g) satisfying
Φ₁² + Φ₂² + Φ₃² = 0.  The nullity condition is exactly what forces H = 0.

Conformal metric: E = G = (1 + u² + v²)², F = 0.
Gauss curvature:  K(u,v) = −4 / (1 + u² + v²)⁴  — purely negative saddle.
  → maximum |K| = 4 at origin (most curved)
  → K → 0 as r → ∞   (arms flatten toward the boundary)
"""

import bpy, bmesh, numpy as np, os

# ── Constants ──────────────────────────────────────────────────────────────
SLUG      = "enneper_poi"
PMAX      = 2.0       # u,v ∈ [−PMAX, PMAX]; self-intersection appears at ~1.5
NU = NV   = 80        # grid resolution; 80×80 = 6400 verts, 6241 quads
POI_R     = 0.082     # target bounding-sphere radius (m) — studio standard

# Three-stop curvature colour ramp: edge (low|K|) → teal → centre (high|K|)
C_EDGE   = (0.88, 0.62, 0.04)   # amber-gold  — outer arms, |K| → 0
C_MID    = (0.04, 0.72, 0.65)   # teal
C_CENTRE = (0.04, 0.10, 0.82)   # deep cobalt — origin, |K| = 4

# ── Surface ───────────────────────────────────────────────────────────────
u = np.linspace(-PMAX, PMAX, NU)
v = np.linspace(-PMAX, PMAX, NV)
U, V = np.meshgrid(u, v, indexing='ij')        # shape (NU, NV)

X = U - U**3/3.0 + U*V**2
Y = -V + V**3/3.0 - U**2*V
Z = U**2 - V**2

# Scale: bounding sphere of raw coords → POI_R
dists = np.sqrt(X**2 + Y**2 + Z**2)            # centroid is near origin
sc    = POI_R / dists.max()
X *= sc;  Y *= sc;  Z *= sc

# ── Analytic Gauss curvature vertex colour ─────────────────────────────────
# K = −4/(1+r²)⁴, r² = u²+v²; gamma-compressed for visual range
r2    = U**2 + V**2
Kmag  = 4.0 / (1.0 + r2)**4                    # |K| in [0, 4]
t     = (Kmag / Kmag.max()) ** 0.30             # t=1 at origin (most curved)

def lerp3(t_arr, c0, c1, c2):
    """Three-stop linear ramp.  t∈[0,½]→c0..c1, t∈[½,1]→c1..c2."""
    lo = t_arr < 0.5
    tl = t_arr * 2.0
    th = (t_arr - 0.5) * 2.0
    ch = lambda i: np.where(lo, c0[i] + tl*(c1[i]-c0[i]),
                                 c1[i] + th*(c2[i]-c1[i]))
    return ch(0), ch(1), ch(2)

CR, CG, CB = lerp3(t, C_EDGE, C_MID, C_CENTRE)
colours = np.stack([CR, CG, CB, np.ones_like(CR)], axis=-1)  # (NU,NV,4)

# ── Quad faces (numpy, no Python loop) ────────────────────────────────────
# Why: vectorised index arithmetic is ~100× faster than nested for-loops.
I, J = np.meshgrid(np.arange(NU-1), np.arange(NV-1), indexing='ij')
a = (I*NV + J).ravel();     b = ((I+1)*NV + J).ravel()
c = ((I+1)*NV + J+1).ravel(); d = (I*NV + J+1).ravel()
faces = np.stack([a, b, c, d], axis=1).tolist()

# ── Blender mesh ────────────────────────────────────────────────────────────
verts = np.stack([X, Y, Z], axis=-1).reshape(-1, 3).tolist()
mesh  = bpy.data.meshes.new(SLUG)
mesh.from_pydata(verts, [], faces)
mesh.update()

obj = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# Flat shading: each quad shows its independent normal → faceted saddle aesthetic
bpy.ops.object.shade_flat()

# ── Vertex colour attribute ────────────────────────────────────────────────
col = mesh.color_attributes.new("K_curvature", 'FLOAT_COLOR', 'POINT')
col.data.foreach_set("color", colours.reshape(-1, 4).astype(np.float32).ravel())

# ── Material ───────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(f"{SLUG}_mat")
mat.use_nodes        = True
mat.use_backface_culling = False      # surface self-intersects; both sides visible
nt  = mat.node_tree;  nt.nodes.clear()

nd_attr = nt.nodes.new("ShaderNodeAttribute");   nd_attr.location = (-400, 0)
nd_attr.attribute_name = "K_curvature"
nd_bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); nd_bsdf.location = (0, 0)
nd_bsdf.inputs["Metallic"].default_value  = 0.22
nd_bsdf.inputs["Roughness"].default_value = 0.32
nd_out  = nt.nodes.new("ShaderNodeOutputMaterial"); nd_out.location = (300, 0)
nt.links.new(nd_attr.outputs["Color"], nd_bsdf.inputs["Base Color"])
nt.links.new(nd_bsdf.outputs["BSDF"],  nd_out.inputs["Surface"])
mesh.materials.append(mat)

# ── Shape keys ─────────────────────────────────────────────────────────────
# Three keys let WebXR viewers explore the parameter space interactively.
obj.shape_key_add(name="Basis", from_mix=False)

def enneper_verts_flat(pmax, poi_r, nu=NU, nv=NV):
    """Return (nu*nv, 3) float32 array for given PMAX."""
    uu = np.linspace(-pmax, pmax, nu)
    vv = np.linspace(-pmax, pmax, nv)
    UU, VV = np.meshgrid(uu, vv, indexing='ij')
    XX = UU - UU**3/3.0 + UU*VV**2
    YY = -VV + VV**3/3.0 - UU**2*VV
    ZZ = UU**2 - VV**2
    dd = np.sqrt(XX**2 + YY**2 + ZZ**2).max()
    s  = poi_r / dd
    return np.stack([XX*s, YY*s, ZZ*s], axis=-1).reshape(-1, 3).astype(np.float32)

# SK_Tight: PMAX=1.0 — clean saddle, no self-intersection
sk_t = obj.shape_key_add(name="SK_Tight", from_mix=False)
sk_t.data.foreach_set("co", enneper_verts_flat(1.0, POI_R).ravel())

# SK_Wide: PMAX=3.0 — wide arms, deep self-intersection, richer curvature range
sk_w = obj.shape_key_add(name="SK_Wide", from_mix=False)
sk_w.data.foreach_set("co", enneper_verts_flat(3.0, POI_R).ravel())

# SK_Rotate45: (u+iv) → (u+iv)·e^(iπ/4) — 45° param rotation → new saddle axis
UU, VV = np.meshgrid(u, v, indexing='ij')
s45 = np.sqrt(0.5)
UR = s45*UU - s45*VV;   VR = s45*UU + s45*VV
XR = UR - UR**3/3.0 + UR*VR**2
YR = -VR + VR**3/3.0 - UR**2*VR
ZR = UR**2 - VR**2
sc_r = POI_R / np.sqrt(XR**2+YR**2+ZR**2).max()
rot_v = np.stack([XR*sc_r, YR*sc_r, ZR*sc_r], axis=-1).reshape(-1,3).astype(np.float32)
sk_r = obj.shape_key_add(name="SK_Rotate45", from_mix=False)
sk_r.data.foreach_set("co", rot_v.ravel())

# ── +Y-up for glTF/WebXR ────────────────────────────────────────────────────
obj.rotation_euler[0] = 1.5707963    # π/2 — Blender Z-up → glTF Y-up
bpy.ops.object.transform_apply(rotation=True)

# ── holoflow metadata ────────────────────────────────────────────────────────
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-head"
obj["holoflow:surface"]  = "minimal"
obj["holoflow:K"]        = "analytic: -4/(1+u^2+v^2)^4"

# ── GLB export ───────────────────────────────────────────────────────────────
SLUG_DIR = ("python-numpy-enneper-surface-weierstrass-representation"
            "-minimal-gauss-curvature-saddle-poi-webxr")
OUT = os.path.join(os.path.dirname(bpy.data.filepath),
                   f"public/library/glbs/scripting/{SLUG_DIR}/")
os.makedirs(OUT, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "hf_enneper_poi.glb"),
    use_selection=True,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_morph=True,
    export_colors=True,
    export_yup=True,
)

print(f"[holoflow] Enneper surface — {len(mesh.vertices)} verts · "
      f"{len(mesh.polygons)} faces  →  {OUT}")
print(f"  K at origin = -4.000  K at r=PMAX = {-4.0/(1+PMAX**2)**4:.5f}")
