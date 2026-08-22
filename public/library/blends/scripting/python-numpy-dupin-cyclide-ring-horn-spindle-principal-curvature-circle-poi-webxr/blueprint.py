"""
Dupin Cyclide — Blender 5.1 expert blueprint
=============================================
Charles Dupin, 1822 — "Applications de Géométrie et de Méchanique."

A Dupin cyclide is the unique (up to Möbius / inversive transformation) class
of surfaces ALL of whose lines of curvature are circles.  Every torus, right
circular cone, and cylinder is a degenerate limiting case; the general cyclide
arises by inverting a torus in a sphere whose centre lies off the torus's axis.

Why this matters for WebXR poi heads:
  • Both principal curvature directions are circular arcs → smooth, printable,
    no sharp singular geodesics.
  • The Villarceau-circle duality (latitude circles ↔ longitude circles) gives
    the surface a natural "woven" visual rhythm used in the studio's faceted
    low-poly aesthetic.
  • Bloor–Wilson parametrisation is rational, so all vertices land on exact
    algebraic positions with no irrational accumulation.

Bloor–Wilson (1989) parametrisation
─────────────────────────────────────
Parameters: a > c > 0, b = √(a² − c²), d ∈ (0, b).
Denominator D(u,v) = a − c·cos u·cos v — strictly positive (since c < a).

  x(u,v) = [d(c − a cos u cos v) + b² cos v] / D
  y(u,v) = b·sin u·(a − d·cos v)              / D
  z(u,v) = b·sin v·(c·cos u − d)              / D

WHY this exact form: invert the torus with major/minor radii (a/b, b/c) about
a unit sphere centred at (d/b, 0, 0) in normalised coordinates.  Inversion
maps every latitude/longitude circle on the torus to a circle in ℝ³; hence the
cyclide's curvature lines are circles.  The formula above is the closed-form
result of that inversion map.

Pythagorean choice: (a, b, c) = (5, 4, 3) — exact integer arithmetic, no
floating-point cancellation in the Pythagorean constraint b² = a² − c².

Three cyclide types via d (shape-key sweep)
───────────────────────────────────────────
  Basis      d = 2.0   ring cyclide — balanced proportions
  SK_Wide    d = 0.4   near-symmetric (wider inner ring, approaching torus)
  SK_Spindle d = 3.9   inner ring almost pinched (d → b = 4 → spindle cyclide)

Gaussian curvature K
─────────────────────
Computed numerically via fundamental forms (EG−F², LN−M²) using np.gradient.
For a ring cyclide K changes sign:
  K > 0  outer convex shell (both principal curvatures same sign → elliptic)
  K < 0  inner saddle band  (curvatures opposite sign → hyperbolic)
  K = 0  two waist circles  (exactly the lines of curvature at sign-change)

Colour ramp: deep cobalt (K ≪ 0) → near-white (K ≈ 0) → amber-gold (K > 0).
"""

import bpy, bmesh, numpy as np, os

# ── Constants ─────────────────────────────────────────────────────────────────
SLUG   = "hf_cyclide_poi"
TOPIC  = ("scripting/python-numpy-dupin-cyclide-ring-horn-spindle"
          "-principal-curvature-circle-poi-webxr")

# Bloor–Wilson parameters — 3-4-5 Pythagorean triple keeps b² = a² − c² exact
A, C   = 5.0, 3.0
B      = float(np.sqrt(A**2 - C**2))    # = 4.0
D_BASE    = 2.0                          # Basis shape key
D_WIDE    = 0.4                          # SK_Wide
D_SPINDLE = 3.9                          # SK_Spindle (→ b = 4)

NU, NV  = 72, 72                         # grid; 72² = 5184 vertices
POI_R   = 0.082                          # bounding-sphere radius (m)

# Curvature colour stops
C_NEG  = (0.04, 0.10, 0.82)             # deep cobalt   (K < 0, saddle)
C_ZERO = (0.93, 0.93, 0.93)             # near-white    (K ≈ 0, waist)
C_POS  = (0.88, 0.62, 0.04)             # amber-gold    (K > 0, convex)


# ── Surface parametrisation ───────────────────────────────────────────────────
def cyclide(d, a=A, b=B, c=C, nu=NU, nv=NV):
    """
    Bloor–Wilson ring cyclide.  endpoint=False on both axes gives a true
    periodic grid: NU×NV vertices tile [0, 2π) × [0, 2π) without duplicate
    seam vertices, so wrap-around quads close the surface cleanly.
    """
    u  = np.linspace(0.0, 2.0*np.pi, nu, endpoint=False)
    v  = np.linspace(0.0, 2.0*np.pi, nv, endpoint=False)
    U, V = np.meshgrid(u, v, indexing='ij')
    cu, su = np.cos(U), np.sin(U)
    cv, sv = np.cos(V), np.sin(V)
    D   = a - c*cu*cv                   # denominator > 0 always (c < a)
    x   = (d*(c - a*cu*cv) + b**2*cv) / D
    y   = b*su*(a - d*cv)              / D
    z   = b*sv*(c*cu - d)              / D
    return x, y, z


# ── Numerical Gaussian curvature ─────────────────────────────────────────────
def gauss_curvature(x, y, z):
    """
    K = (LN − M²) / (EG − F²) via the classical fundamental forms.
    Uses np.gradient (central differences) for all partials — accurate to O(h²).
    WHY numerics rather than the analytic formula: the analytic K for a cyclide
    involves a lengthy rational expression that is error-prone to transcribe
    and gives no pedagogical advantage over a clean numerical route.
    """
    du = 2.0*np.pi / NU
    dv = 2.0*np.pi / NV
    P   = np.stack([x, y, z], axis=-1)             # (NU, NV, 3)
    Pu  = np.gradient(P, du, axis=0)
    Pv  = np.gradient(P, dv, axis=1)
    N   = np.cross(Pu, Pv)
    n   = N / (np.linalg.norm(N, axis=-1, keepdims=True) + 1e-15)
    Puu = np.gradient(Pu, du, axis=0)
    Puv = np.gradient(Pu, dv, axis=1)
    Pvv = np.gradient(Pv, dv, axis=1)
    E   = np.einsum('ijk,ijk->ij', Pu,  Pu)
    F   = np.einsum('ijk,ijk->ij', Pu,  Pv)
    G   = np.einsum('ijk,ijk->ij', Pv,  Pv)
    L   = np.einsum('ijk,ijk->ij', Puu, n)
    M   = np.einsum('ijk,ijk->ij', Puv, n)
    Nc  = np.einsum('ijk,ijk->ij', Pvv, n)
    return (L*Nc - M**2) / (E*G - F**2 + 1e-15)


# ── Build base mesh (d = D_BASE) ─────────────────────────────────────────────
X, Y, Z = cyclide(D_BASE)

# Centre at centroid of Basis, then scale to studio poi radius
ctr  = np.array([X.mean(), Y.mean(), Z.mean()])
X   -= ctr[0];  Y -= ctr[1];  Z -= ctr[2]
sc   = POI_R / np.sqrt(X**2 + Y**2 + Z**2).max()
X   *= sc;  Y *= sc;  Z *= sc

# Gaussian curvature → vertex colour
K     = gauss_curvature(X, Y, Z)       # (NU, NV), already at poi scale
K_std = K.std() + 1e-9
# Soft-clip at ±3σ then map linearly to [0, 1]
t     = np.clip((K + 3.0*K_std) / (6.0*K_std), 0.0, 1.0)

def lerp3(t_arr, c0, c1, c2):
    """Three-stop linear ramp: t∈[0,½]→c0..c1, t∈[½,1]→c1..c2."""
    lo = t_arr < 0.5
    tl, th = t_arr * 2.0, (t_arr - 0.5) * 2.0
    ch = lambda i: np.where(lo,
                            c0[i] + tl*(c1[i]-c0[i]),
                            c1[i] + th*(c2[i]-c1[i]))
    return ch(0), ch(1), ch(2)

CR, CG, CB = lerp3(t, C_NEG, C_ZERO, C_POS)
colours    = np.stack([CR, CG, CB, np.ones_like(CR)], axis=-1)  # (NU,NV,4)

# ── Quad faces with periodic (wrap-around) seams ─────────────────────────────
# endpoint=False grid means row NU-1 must connect back to row 0 in u,
# and column NV-1 must connect back to column 0 in v.
I, J  = np.meshgrid(np.arange(NU), np.arange(NV), indexing='ij')
ia    = (I*NV + J).ravel()
ib    = ((I+1) % NU * NV + J).ravel()
ic    = ((I+1) % NU * NV + (J+1) % NV).ravel()
id_   = (I*NV + (J+1) % NV).ravel()
faces = np.stack([ia, ib, ic, id_], axis=1).tolist()     # NU·NV quads

# ── Blender mesh ──────────────────────────────────────────────────────────────
verts = np.stack([X, Y, Z], axis=-1).reshape(-1, 3).tolist()
mesh  = bpy.data.meshes.new(SLUG)
mesh.from_pydata(verts, [], faces)
mesh.update()

obj   = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# Flat-shaded faceted look (studio convention for poi heads)
for poly in mesh.polygons:
    poly.use_smooth = False

# ── Vertex colour — Gaussian curvature ───────────────────────────────────────
attr = mesh.color_attributes.new(
    name="K_curvature", type='FLOAT_COLOR', domain='POINT')
attr.data.foreach_set('color', colours.reshape(-1).tolist())

# ── Shape keys ────────────────────────────────────────────────────────────────
obj.shape_key_add(name="Basis", from_mix=False)

for sk_name, d_val in [("SK_Wide", D_WIDE), ("SK_Spindle", D_SPINDLE)]:
    Xs, Ys, Zs = cyclide(d_val)
    # Apply same centring and scale as Basis so morphing is purely shape change
    Xs -= ctr[0]; Ys -= ctr[1]; Zs -= ctr[2]
    Xs *= sc;      Ys *= sc;      Zs *= sc
    sk  = obj.shape_key_add(name=sk_name, from_mix=False)
    sk.data.foreach_set(
        'co', np.stack([Xs, Ys, Zs], axis=-1).reshape(-1).tolist())

# ── Material — vertex colour driven ──────────────────────────────────────────
mat  = bpy.data.materials.new(name=f"{SLUG}_mat")
mat.use_nodes = True
nt   = mat.node_tree
nt.nodes.clear()

vcol = nt.nodes.new('ShaderNodeVertexColor')
vcol.layer_name = "K_curvature"

bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
bsdf.inputs['Roughness'].default_value = 0.55
bsdf.inputs['Metallic'].default_value  = 0.08

out  = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(vcol.outputs['Color'], bsdf.inputs['Base Color'])
nt.links.new(bsdf.outputs['BSDF'],  out.inputs['Surface'])
mesh.materials.append(mat)

# Holoflow custom property — marks this object for the faceted WebXR pipeline
obj["holoflow:facet"] = True

# ── GLB export (Draco 6, +Y up, WebP, morph targets) ─────────────────────────
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(scale=True, rotation=True, location=True)

blend_dir = os.path.dirname(bpy.data.filepath) or os.getcwd()
glb_path  = os.path.join(
    blend_dir, "public", "library", "glbs",
    "scripting",
    "python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr",
    f"{SLUG}.glb")
os.makedirs(os.path.dirname(glb_path), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath                             = glb_path,
    use_selection                        = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_morph                         = True,
    export_colors                        = True,
    export_yup                           = True,
)
print(f"[holoflow] Dupin Cyclide GLB → {glb_path}")
