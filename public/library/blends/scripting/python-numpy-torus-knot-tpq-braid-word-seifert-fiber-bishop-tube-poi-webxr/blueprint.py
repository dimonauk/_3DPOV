# ─────────────────────────────────────────────────────────────────────
# blueprint.py — Torus Knot T(p,q): Braid-Word Closure,
#                Bishop Parallel-Transport Tube & Four Shape-Key
#                Poi Light Trail for WebXR  (Blender 5.1)
# ─────────────────────────────────────────────────────────────────────
# TECHNIQUE
# A torus knot K = T(p,q), gcd(p,q)=1, sits on the standard torus
# T² ⊂ S³ and winds p times around the central (z) axis and q times
# around the tube.  The parametrisation:
#
#   c(t) = ((R + r cos qt) cos pt,
#            (R + r cos qt) sin pt,
#                   r sin qt),  t ∈ [0, 2π)
#
# produces a closed smooth curve because both coordinates return to
# their start after one full t-period: the pt factor completes p full
# circles while qt completes q — and since gcd(p,q)=1 the curve is a
# single connected component, not a link.
#
# INVARIANTS (Seifert 1934, Alexander 1928)
#   genus g(T(p,q))       = (p-1)(q-1)/2   — minimal Seifert surface
#   signature σ(T(p,q))  = −(p-1)(q-1)    — Tristram–Levine at −1
#   braid word            = (σ₁σ₂…σ_{p-1})^q  in B_p  (p-braid)
#   Alexander poly        = (t^{pq}−1)(t−1) / ((t^p−1)(t^q−1))
#   self-linking (Seifert framing): lk(K, K') = pq
#
# Implemented shape keys:
#   Trefoil   T(2,3)  g=1  σ=−2   3-fold rotational symmetry
#   Solomon   T(2,5)  g=2  σ=−4   5-fold; cinquefoil knot 5₁
#   Torus34   T(3,4)  g=3  σ=−6   algebraic knot 8₁₉-type
#   Torus35   T(3,5)  g=4  σ=−8   Solomon's seal 10₁₂₄
#
# BISHOP PARALLEL-TRANSPORT FRAME (Bishop 1975)
# The Frenet frame fails at inflection points (curvature → 0).
# Bishop's correction propagates a normal N by rotating the frame
# as little as possible at each step — Rodrigues' rotation formula
# about the axis T_{i-1} × T_i — then applies a linear end-closure
# correction to eliminate the accumulated torsion mismatch between
# N_0 and the transported final N.  The result is a smooth,
# singularity-free tube regardless of the torsion profile.
# ─────────────────────────────────────────────────────────────────────

import os
import bpy
import numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────
KNOT_VARIANTS    = [(2, 3), (2, 5), (3, 4), (3, 5)]
SHAPE_KEY_NAMES  = ["Trefoil_T23", "Solomon_T25", "Torus_T34", "Torus_T35"]
N_CURVE          = 480    # sample points along the centreline (≥ 6·max(p,q))
N_TUBE           = 10     # polygon edges around the cross-section
TUBE_RADIUS      = 0.048  # metres — tube cross-section radius
POI_DIAMETER     = 0.18   # metres — target bounding-box width for poi
TORUS_R          = 1.0    # major radius of the host torus (arbitrary units)
TORUS_r          = 0.42   # minor radius  (r < R keeps the curve embedded)
EMISSION_STR     = 3.0    # emission shader strength
OBJECT_NAME      = "hf_torus_knot"

# ── Startup: clear scene ──────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for blk in list(bpy.data.meshes) + list(bpy.data.materials):
    bpy.data.meshes.remove(blk) if hasattr(blk, "vertices") else bpy.data.materials.remove(blk)


# ── Knot centreline ───────────────────────────────────────────────────
def knot_curve(p: int, q: int, n: int = N_CURVE) -> np.ndarray:
    """Return (n,3) float64 positions for T(p,q) on the standard torus."""
    t  = np.linspace(0.0, 2.0 * np.pi, n, endpoint=False)
    R, r = TORUS_R, TORUS_r
    x  = (R + r * np.cos(q * t)) * np.cos(p * t)
    y  = (R + r * np.cos(q * t)) * np.sin(p * t)
    z  =      r * np.sin(q * t)
    return np.column_stack([x, y, z])


# ── Bishop parallel-transport tube ────────────────────────────────────
def bishop_tube(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Build tube vertices and arc-length-keyed HSV colours.

    Returns
    -------
    verts  : (N_CURVE * N_TUBE, 3) float64
    colors : (N_CURVE * N_TUBE, 3) float64  (sRGB in [0,1])
    """
    n = len(pts)

    # Tangents via central differences (closed curve)
    tang = np.empty_like(pts)
    tang[1:-1] = pts[2:] - pts[:-2]
    tang[0]    = pts[1]  - pts[n - 1]
    tang[-1]   = pts[0]  - pts[n - 2]
    lens = np.linalg.norm(tang, axis=1, keepdims=True)
    tang /= lens

    # Seed normal — orthogonal to T₀
    T0 = tang[0]
    helper = np.array([0.0, 0.0, 1.0]) if abs(T0[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N0 = helper - np.dot(helper, T0) * T0
    N0 /= np.linalg.norm(N0)

    normals = np.empty_like(pts)
    normals[0] = N0

    # Rodrigues transport step
    for i in range(1, n):
        Tp, Tc = tang[i - 1], tang[i]
        axis   = np.cross(Tp, Tc)
        sin_a  = np.linalg.norm(axis)
        cos_a  = float(np.dot(Tp, Tc))
        if sin_a < 1e-12:
            normals[i] = normals[i - 1]
        else:
            axis  /= sin_a
            Np     = normals[i - 1]
            normals[i] = (
                Np * cos_a
                + np.cross(axis, Np) * sin_a
                + axis * np.dot(axis, Np) * (1.0 - cos_a)
            )

    # End-closure correction: distribute torsion deficit linearly
    Nf      = normals[-1]
    cos_m   = float(np.clip(np.dot(Nf, normals[0]), -1.0, 1.0))
    Bf      = np.cross(tang[-1], Nf)
    sin_m   = float(np.dot(np.cross(Nf, normals[0]), tang[0]))
    mismatch = np.arctan2(sin_m, cos_m)
    for i in range(n):
        angle_i = mismatch * i / n
        Bi = np.cross(tang[i], normals[i])
        normals[i] = normals[i] * np.cos(angle_i) - Bi * np.sin(angle_i)

    # Build ring vertices around each centreline point
    theta  = np.linspace(0.0, 2.0 * np.pi, N_TUBE, endpoint=False)
    ct, st = np.cos(theta), np.sin(theta)
    verts  = np.empty((n, N_TUBE, 3))
    for i in range(n):
        B = np.cross(tang[i], normals[i])
        verts[i] = pts[i] + TUBE_RADIUS * (ct[:, None] * normals[i] + st[:, None] * B)

    # Vertex colours: arc-length parameter → warm-to-cool HSV hue cycle
    def hsv_to_rgb(h: float) -> tuple[float, float, float]:
        i  = int(h * 6.0) % 6
        f  = h * 6.0 - int(h * 6.0)
        v, p_, q_, t_ = 1.0, 0.0, 1.0 - f, f
        return [(1, t_, 0), (q_, 1, 0), (0, 1, t_), (0, q_, 1), (t_, 0, 1), (1, 0, q_)][i]

    t_param = np.linspace(0.0, 1.0, n, endpoint=False)
    hues    = (0.60 + t_param * 0.90) % 1.0
    colors  = np.empty((n, N_TUBE, 3))
    for i in range(n):
        colors[i, :] = hsv_to_rgb(hues[i])

    return verts.reshape(-1, 3), colors.reshape(-1, 3)


# ── Mesh construction from T(2,3) base ───────────────────────────────
p0, q0   = KNOT_VARIANTS[0]
pts0     = knot_curve(p0, q0)
verts0, cols0 = bishop_tube(pts0)

me = bpy.data.meshes.new(OBJECT_NAME)
ob = bpy.data.objects.new(OBJECT_NAME, me)
bpy.context.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

n_v = N_CURVE * N_TUBE
faces = []
for i in range(N_CURVE):
    for j in range(N_TUBE):
        a = i * N_TUBE + j
        b = i * N_TUBE + (j + 1) % N_TUBE
        c = ((i + 1) % N_CURVE) * N_TUBE + (j + 1) % N_TUBE
        d = ((i + 1) % N_CURVE) * N_TUBE + j
        faces.append((a, b, c, d))

me.from_pydata(list(map(tuple, verts0)), [], faces)
me.update()

# Vertex colours  (FLOAT_COLOR + POINT domain)
attr = me.attributes.new("Col", "FLOAT_COLOR", "POINT")
for vi, c in enumerate(cols0):
    attr.data[vi].color = (float(c[0]), float(c[1]), float(c[2]), 1.0)

# ── Shape keys ────────────────────────────────────────────────────────
# Basis shape key first, then one per variant (including the base T(2,3))
ob.shape_key_add(name="Basis", from_mix=False)

for sk_name, (p, q) in zip(SHAPE_KEY_NAMES, KNOT_VARIANTS):
    pts_sk    = knot_curve(p, q)
    v_sk, _   = bishop_tube(pts_sk)
    span      = np.ptp(v_sk, axis=0).max()
    if span > 0:
        v_sk *= POI_DIAMETER / span
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    for vi in range(n_v):
        sk.data[vi].co = Vector(v_sk[vi])

# Activate trefoil at full value
ob.data.shape_keys.key_blocks["Trefoil_T23"].value = 1.0

# ── Scale base mesh to POI_DIAMETER ──────────────────────────────────
span0 = np.ptp(verts0, axis=0).max()
sf    = POI_DIAMETER / span0 if span0 > 0 else 1.0
for v in me.vertices:
    v.co *= sf
for sk in ob.data.shape_keys.key_blocks:
    for sd in sk.data:
        sd.co *= sf

# ── Emission material ─────────────────────────────────────────────────
mat = bpy.data.materials.new(OBJECT_NAME + "_mat")
mat.use_nodes      = True
mat.shadow_method  = "NONE"
nt = mat.node_tree
for nd in list(nt.nodes):
    nt.nodes.remove(nd)
out   = nt.nodes.new("ShaderNodeOutputMaterial")
emit  = nt.nodes.new("ShaderNodeEmission")
atrb  = nt.nodes.new("ShaderNodeAttribute")
atrb.attribute_name = "Col"
atrb.attribute_type  = "GEOMETRY"
emit.inputs["Strength"].default_value = EMISSION_STR
nt.links.new(atrb.outputs["Color"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
out.location, emit.location, atrb.location = (300, 0), (100, 0), (-120, 0)
me.materials.append(mat)

# ── Holoflow metadata ─────────────────────────────────────────────────
ob["holoflow:facet"] = False   # smooth tube, not faceted
ob["holoflow:knot"]  = "T(p,q)"

# ── GLB export ────────────────────────────────────────────────────────
GLB_DIR  = "//../../glbs/scripting/python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
GLB_FILE = os.path.join(GLB_DIR, "hf_torus_knot.glb")
os.makedirs(bpy.path.abspath(GLB_DIR), exist_ok=True)

bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_FILE),
    use_selection=True,
    export_format="GLB",
    export_yup=True,
    export_apply=False,           # keep shape keys alive
    export_colors=True,
    export_morph=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)
print(f"Exported GLB → {GLB_FILE}")
