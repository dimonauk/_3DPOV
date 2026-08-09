"""
Euler Elastica — Jacobi-dn Curvature, Lemniscate Connection
& Ribbon Poi Head (Blender 5.1)
============================================================
Expert context
--------------
The Bernoulli-Euler elastica (1744) minimises bending energy

    B = ∫ κ² ds

over curves of fixed length.  The Euler-Lagrange ODE is

    κ'' + κ³/2 = T · κ         (T = tension Lagrange multiplier)

Substituting κ = a · dn(b·s, m) and expanding via the dn ODE

    dn'' = (2 − m²) · dn − 2 · dn³

and matching powers of dn and dn³ forces:

    a = 2b,    T = b²(2 − m²)    (T > 0 for all m ∈ (0, 1))

This is the NON-INFLECTIONAL oval elastica: curvature stays positive,
ranging from 2b (at s = 0, the tip) to 2b·√(1−m²) (at s = K/b, the waist).

Turning angle:  θ(s) = ∫ κ dt = 2 · am(b·s, m)  (Jacobi amplitude)

Since cos(am(u)) = cn(u) and sin(am(u)) = sn(u):

    x(s) = ∫ cos θ ds = (2/b) ∫ cn(b·t, m) dt
    y(s) = ∫ sin θ ds = (2/b) ∫ sn(b·t, m) dt

Over the half-period [0, 2K(m)/b]:
• y always closes: ∫₀^{2K} sn · cn du = 0 by antisymmetry.
• x closes when  E(m)/K(m) = (2 − m²)/2,  solved numerically ≈ m* = 0.3476.

Lemniscate connection
---------------------
The arc length of the lemniscate r² = a² cos(2θ) from θ=0 to θ=π/4 equals
    L_lem = a ∫₀^{K(1/√2)} dn(t, 1/√2) dt = a · π/2 / K(1/√2)
— the same integrand dn(·, 1/√2) as the elastica at modulus m = 1/√2 ≈ 0.7071.
This is why lemniscate arc-length and elastica curvature share the
same special value of the modulus.  Both quantities were historically
computed by Jacob Bernoulli and Euler using this integral.

Blender output: a flat ribbon (10 mm × 3 mm cross-section) swept
along the closed oval elastica via Bishop parallel-transport frame,
with 5 shape-key modulus variants and vertex-colour curvature map.
"""

import bpy, bmesh, mathutils
import numpy as np
from math import pi, sqrt, atan2

# ─── tunable parameters ──────────────────────────────────────────────────────
POI_DIAM   = 0.060    # bounding diameter of the poi head (m)
RIBBON_W   = 0.010    # ribbon width (m)
RIBBON_T   = 0.003    # ribbon thickness (m)
N_SEGS     = 160      # curve divisions per full half-period
Z_LIFT     = 0.008    # gentle z-lift amplitude for 3-D interest (m)

# 5 modulus values: m* ≈ 0.3476 is the exact closed oval elastica
M_VALUES  = [0.10, 0.3476, 0.55, 0.75, 0.95]
SK_NAMES  = ["M_010_circle", "M_348_exact", "M_550_oval", "M_750_elongated", "M_950_cusp"]
BASE_IDX  = 1          # m* = exact closed elastica is the base shape

OBJECT_NAME = "hf_elastica_poi"
CATEGORY    = "poi-head"
EMISSIVE    = True     # Emission node for the glow aesthetic

# ─── AGM: complete elliptic integral K(m) ─────────────────────────────────────
def agm_K(m: float) -> float:
    """K(m) via arithmetic-geometric mean — quadratic convergence, ~15 dp in 7 steps."""
    if m >= 1.0: return float('inf')
    a, b = 1.0, sqrt(max(0.0, 1.0 - m))
    for _ in range(64):
        a2, b2 = (a + b) * 0.5, sqrt(a * b)
        if abs(a2 - b2) < 1e-14: return pi / (2.0 * a2)
        a, b = a2, b2
    return pi / (2.0 * a)

# ─── AGM: complete elliptic integral E(m) ─────────────────────────────────────
def agm_E(m: float) -> float:
    """E(m) via descending AGM — shares iteration with K(m)."""
    if m >= 1.0: return 1.0
    a, b, c = 1.0, sqrt(max(0.0, 1.0 - m)), sqrt(m)
    power, acc = 1.0, m / 2.0
    for _ in range(64):
        a2, b2, c2 = (a + b) * 0.5, sqrt(a * b), (a - b) * 0.5
        power *= 2.0; acc += power * c2 * c2
        if abs(c2) < 1e-14: break
        a, b, c = a2, b2, c2
    return (pi / (2.0 * a)) * (1.0 - acc)

# ─── RK4 Jacobi system ────────────────────────────────────────────────────────
def jacobi_arrays(m: float, n: int):
    """
    RK4 integration of [sn, cn, dn] over half-period [0, 2K(m)].
    WHY RK4 over scipy: avoids dependency; AGM gives exact period
    boundary so the endpoint is never off by a floating-point slice.
    """
    Km = agm_K(m)
    t_end = 2.0 * Km
    dt = t_end / n
    sn = np.zeros(n + 1); cn = np.zeros(n + 1); dn_a = np.zeros(n + 1)
    sn[0], cn[0], dn_a[0] = 0.0, 1.0, 1.0

    def f(s, c, d):
        return c * d, -s * d, -(m ** 2) * s * c

    for i in range(n):
        s, c, d = sn[i], cn[i], dn_a[i]
        ds1, dc1, dd1 = f(s, c, d)
        ds2, dc2, dd2 = f(s+dt/2*ds1, c+dt/2*dc1, d+dt/2*dd1)
        ds3, dc3, dd3 = f(s+dt/2*ds2, c+dt/2*dc2, d+dt/2*dd2)
        ds4, dc4, dd4 = f(s+dt*ds3, c+dt*dc3, d+dt*dd3)
        sn[i+1] = s + dt*(ds1+2*ds2+2*ds3+ds4)/6
        cn[i+1] = c + dt*(dc1+2*dc2+2*dc3+dc4)/6
        dn_a[i+1] = d + dt*(dd1+2*dd2+2*dd3+dd4)/6

    return sn, cn, dn_a

# ─── elastica curve builder ───────────────────────────────────────────────────
def build_curve(m: float, close_x: bool = True):
    """
    Compute N_SEGS-point closed oval elastica for modulus m.
    θ(s) = 2·am(s, m),  cos θ = cn,  sin θ = sn  →  direct integration.

    close_x: if True, linearly blend the x-closure gap across the last
    10% of segments (only needed when m ≠ m*).  Does not change topology.
    Returns (pts, cn_vals) where pts is (N_SEGS, 3).
    """
    sn_a, cn_a, dn_a = jacobi_arrays(m, N_SEGS)
    Km = agm_K(m)
    ds = 2.0 * Km / N_SEGS   # physical arc-length step

    # x and y via cumulative trapezoid  (factor 2 from θ = 2·am)
    x = np.zeros(N_SEGS + 1); y = np.zeros(N_SEGS + 1)
    for i in range(N_SEGS):
        x[i+1] = x[i] + ds * (cn_a[i] + cn_a[i+1])   # factor 2 in κ × factor 1/2 trapz = 1
        y[i+1] = y[i] + ds * (sn_a[i] + sn_a[i+1])

    # x[N_SEGS] is the closure gap (≈0 when m=m*, nonzero otherwise)
    gap_x = x[N_SEGS]
    if close_x and abs(gap_x) > 1e-9:
        blend_start = int(0.90 * N_SEGS)
        for i in range(blend_start, N_SEGS + 1):
            frac = (i - blend_start) / (N_SEGS - blend_start)
            x[i] -= frac * gap_x

    pts2d = np.stack([x[:N_SEGS], y[:N_SEGS]], axis=1)

    # scale so bounding radius = POI_DIAM/2
    radii = np.linalg.norm(pts2d, axis=1)
    r_max = np.max(radii) or 1.0
    scale = (POI_DIAM / 2) / r_max
    pts2d *= scale

    # embed in 3-D with sinusoidal z-lift (adds visual interest without distorting the oval)
    phase = np.linspace(0, 2*pi, N_SEGS, endpoint=False)
    z = Z_LIFT * np.sin(phase)

    pts = np.column_stack([pts2d, z])
    return pts, cn_a[:N_SEGS]   # cn used for vertex colour (curvature proxy)

# ─── Bishop parallel-transport frame ──────────────────────────────────────────
def bishop_frame(pts):
    """
    Parallel-transport normal along a closed curve; distribute closing
    holonomy linearly so the ribbon sits flat with no surprise twist.
    WHY Bishop over Frenet: Frenet blows up wherever κ = 0; Bishop
    is defined for any smooth curve including the elastica waist.
    """
    n = len(pts)
    tangs = np.roll(pts, -1, axis=0) - pts
    norms_t = np.linalg.norm(tangs, axis=1, keepdims=True)
    norms_t[norms_t < 1e-14] = 1.0
    tangs /= norms_t

    normals = np.zeros_like(pts)
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(tangs[0], ref)) > 0.99: ref = np.array([1.0, 0.0, 0.0])
    n0 = np.cross(tangs[0], ref)
    n0 /= np.linalg.norm(n0)
    normals[0] = n0

    for i in range(1, n):
        ni = normals[i-1] - np.dot(normals[i-1], tangs[i]) * tangs[i]
        mag = np.linalg.norm(ni)
        normals[i] = ni / mag if mag > 1e-14 else normals[i-1]

    # closing holonomy angle
    cos_h = np.clip(np.dot(normals[-1], normals[0]), -1, 1)
    cross_h = np.cross(normals[-1], normals[0])
    sign_h = np.sign(np.dot(cross_h, tangs[0]))
    holonomy = sign_h * np.arccos(cos_h)

    for i in range(n):
        frac = i / n
        axis = mathutils.Vector(tangs[i])
        rot = mathutils.Matrix.Rotation(holonomy * frac, 3, axis)
        normals[i] = np.array(rot @ mathutils.Vector(normals[i]))

    return tangs, normals

# ─── assemble ribbon mesh ─────────────────────────────────────────────────────
def assemble_ribbon(bm, pts, tangs, normals, cn_vals):
    """
    Sweep 4-vertex rectangular cross-section along the curve.
    Returns list of BMVerts (base build) or list of co-tuples (shape key build).
    """
    hw, ht = RIBBON_W / 2, RIBBON_T / 2
    offsets = [(hw, ht), (-hw, ht), (-hw, -ht), (hw, -ht)]
    binorms = np.cross(tangs, normals)

    verts = []
    kappa_vals = []   # curvature proxy per ring
    for i in range(len(pts)):
        p, n, bi = pts[i], normals[i], binorms[i]
        k_norm = float(cn_vals[i])   # cn ∈ [−1,1]; at m=0.35, cn ∈ [1, k']
        kappa_vals.extend([k_norm] * 4)
        for (wf, tf) in offsets:
            co = p + wf * n + tf * bi
            verts.append(bm.verts.new(co.tolist()))

    bm.verts.ensure_lookup_table()

    nc = 4
    ns = len(pts)
    for i in range(ns):
        i2 = (i + 1) % ns
        for j in range(nc):
            j2 = (j + 1) % nc
            bm.faces.new([
                verts[i * nc + j],
                verts[i * nc + j2],
                verts[i2 * nc + j2],
                verts[i2 * nc + j],
            ])

    bm.normal_update()
    return verts, kappa_vals

# ─── vertex colour ────────────────────────────────────────────────────────────
def apply_vertex_colour(mesh, kappa_vals, m_base):
    """HSV: high-curvature tips → warm amber; low-curvature waist → cool violet."""
    col_layer = mesh.vertex_colors.new(name="ElasticaKappa")
    k_prime = sqrt(1.0 - m_base)          # theoretical minimum cn at waist
    for poly in mesh.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            kv = kappa_vals[vi]
            t = max(0.0, min(1.0, (kv - k_prime) / max(1e-9, 1.0 - k_prime)))
            # amber (0.12, 0.90, 0.95) → violet (0.72, 0.80, 0.70)
            h = 0.12 + (0.72 - 0.12) * (1.0 - t)
            import colorsys
            r, g, b = colorsys.hsv_to_rgb(h, 0.85, 0.88)
            col_layer.data[li].color = (r, g, b, 1.0)

# ─── material ─────────────────────────────────────────────────────────────────
def create_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes; links = mat.node_tree.links
    nodes.clear()
    vcol = nodes.new("ShaderNodeVertexColor"); vcol.layer_name = "ElasticaKappa"
    emit = nodes.new("ShaderNodeEmission"); emit.inputs["Strength"].default_value = 2.8
    out  = nodes.new("ShaderNodeOutputMaterial")
    links.new(vcol.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

# ─── main build ───────────────────────────────────────────────────────────────
def build():
    # clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # ─── base mesh (m*) ───────────────────────────────────────────────────────
    m_base = M_VALUES[BASE_IDX]
    pts_base, cn_base = build_curve(m_base, close_x=False)  # m* closes exactly
    tangs, normals = bishop_frame(pts_base)

    bm = bmesh.new()
    base_verts, kappa_vals = assemble_ribbon(bm, pts_base, tangs, normals, cn_base)

    mesh = bpy.data.meshes.new(OBJECT_NAME)
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new(OBJECT_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ─── vertex colours & material ────────────────────────────────────────────
    apply_vertex_colour(mesh, kappa_vals, m_base)
    mat = create_material(OBJECT_NAME + "_mat")
    obj.data.materials.append(mat)

    # ─── holoflow metadata ────────────────────────────────────────────────────
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = CATEGORY

    # ─── shape keys ───────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    for idx, (m_val, sk_name) in enumerate(zip(M_VALUES, SK_NAMES)):
        if idx == BASE_IDX: continue   # already the basis
        pts_sk, _ = build_curve(m_val, close_x=True)
        tangs_sk, normals_sk = bishop_frame(pts_sk)
        binorms_sk = np.cross(tangs_sk, normals_sk)

        hw, ht = RIBBON_W / 2, RIBBON_T / 2
        offsets = [(hw, ht), (-hw, ht), (-hw, -ht), (hw, -ht)]

        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for i in range(N_SEGS):
            p, n, bi = pts_sk[i], normals_sk[i], binorms_sk[i]
            for j, (wf, tf) in enumerate(offsets):
                co = p + wf * n + tf * bi
                sk.data[i * 4 + j].co = co.tolist()

    # ─── apply transform (+Y up for WebXR) ────────────────────────────────────
    obj.rotation_euler = (pi/2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)

    # ─── GLB export ───────────────────────────────────────────────────────────
    out_glb = "//hf_elastica_poi.glb"
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_morph=True,
        export_colors=True,
        export_yup=True,
        export_image_format='WEBP',
    )
    print(f"[elastica] GLB exported → {out_glb}")

build()
