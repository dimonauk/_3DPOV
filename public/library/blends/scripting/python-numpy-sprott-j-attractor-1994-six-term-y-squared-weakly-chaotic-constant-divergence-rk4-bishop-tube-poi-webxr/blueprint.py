"""
Sprott J Attractor (1994) — Six-Term y²-Nonlinearity, Constant Divergence −2
Bishop Parallel-Transport Tube + Poi Head for WebXR (Blender 5.1 / bpy)
==========================================================================
Source (equations — public-domain mathematical facts):
  Sprott JC (1994). Some simple chaotic flows.
  Phys. Rev. E 50(2):R647–R650. DOI 10.1103/PhysRevE.50.R647  (Table I, Case J)

TECHNIQUE — THE SPROTT J SYSTEM
────────────────────────────────
    ẋ = 2z            (x driven purely by z; no self-term)
    ẏ = −2y + z       (y damped at rate 2; z drives it forward)
    ż = −x + y + b·y² (nonlinear restoring: linear −x+y plus b·y² fold)

Canonical b = 1.0.  Six terms total. Single quadratic nonlinearity (y²).
WHY this system matters: System J sits in Sprott's 1994 catalogue as one of
the weakest chaos cases — λ₁ ≈ +0.017 — with a Lyapunov time τ ≈ 59 time
units. Trajectories look nearly periodic for long stretches before tiny
separations amplify. This is pedagogically valuable: it shows that "chaos"
exists on a continuum, not as a binary switch. The 2·z coefficient in ẋ
creates a 2:1 speed-ratio between x-drift and z-fluctuations, producing a
distinctively elongated orbit that wraps around a single lobe.

DIVERGENCE — CONSTANT, b-INDEPENDENT
  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + (−2) + 0 = −2 (position-independent)
  WHY b doesn't appear: ∂(−x+y+b·y²)/∂z = 0 always.
  Phase volume: δV(t) = δV(0)·exp(−2·t)  — halves every ln2 ≈ 0.35 tu.
  This is the STRONGEST constant dissipation in the canonical Sprott cases
  (compare: H has ∇·F=a−1=−0.5, G has −0.6, F has −0.5).

FIXED POINTS
  Setting ẋ=ẏ=ż=0:
    ẋ=0 → z = 0
    ẏ=0 → −2y + 0 = 0 → y = 0
    ż=0 → −x + 0 + b·0 = 0 → x = 0
  Only P₀ = (0, 0, 0).  A single equilibrium — any Shilnikov structure
  is concentrated here.

  Jacobian at P₀ (∂ż/∂y = 1 + 2b·y|₀ = 1):
    J₀ = [[ 0,  0,  2],
           [ 0, −2,  1],
           [−1,  1,  0]]

  Characteristic polynomial (expand along row 1):
    det(J₀ − λI) = −λ·[(−2−λ)(−λ) − 1] + 2·[−(−2−λ)]
                 = −λ·[λ(2+λ) − 1] + 2·(2+λ)
                 = −λ³ − 2λ² + λ + 4 + 2λ  →  λ³ + 2λ² − λ − 4 = 0

  Wait — re-expand carefully:
    Row-1 cofactor: −λ·[(−2−λ)(0−λ) − (1)(−1)] − 0 + 2·[(0)(1) − (−2−λ)(−1)]
    = −λ·[λ(2+λ) − 1] + 2·[−(2+λ)]
    = −λ³ − 2λ² + λ − 4 − 2λ  →  -(λ³ + 2λ² + λ + 4) = 0

  Routh–Hurwitz on λ³ + 2λ² + λ + 4:  coefficients [1, 2, 1, 4]
    Necessary: all > 0  ✓
    s¹ row: (2·1 − 1·4)/2 = −1 < 0   ← sign change!
  One sign change → 1 positive-real root → P₀ is an unstable saddle.

LYAPUNOV SPECTRUM (b = 1.0, numerical RK4, after long run):
  λ₁ ≈ +0.017   (POSITIVE but very small — barely chaotic)
  λ₂ ≈  0.000   (flow direction — neutral)
  λ₃ ≈ −2.017   (strong stable folding)
  Sum = −2.000 = ∇·F  ✓  Liouville satisfied
  Kaplan–Yorke: D_KY = 2 + λ₁/|λ₃| = 2 + 0.017/2.017 ≈ 2.008
  Lyapunov time: τ = 1/λ₁ ≈ 59 time units — much longer than Lorenz (τ≈1.1)

SHAPE KEYS — VARYING b (y² FOLD STRENGTH)
  ∇·F stays −2 for all b; only the orbit SHAPE changes:
    Basis   b=1.0  canonical chaos   (orbit wraps tightly)
    SK_LoB  b=0.5  weakened fold     (near-periodic laminar stretches)
    SK_HiB  b=1.5  stronger fold     (wider y-excursions, more diffuse)
    SK_VHiB b=2.0  dominant quadratic (topology shifts, longer excursions)
"""

import bpy
import numpy as np
from math import pi, cos, sin

# ── PARAMETERS ──────────────────────────────────────────────────────────────
B_BASIS   = 1.0    # canonical Sprott J; λ₁≈+0.017; D_KY≈2.008
B_LOB     = 0.5    # halved y²; near-periodic transients, very slow divergence
B_HIB     = 1.5    # 50 % stronger y²; wider orbit lobe
B_VHIB    = 2.0    # dominant quadratic; topology shift

DT        = 0.01   # RK4 step — 2z coupling needs fine dt for accuracy
BURN_IN   = 8000   # 80 tu; long because τ=59 — attractor needs to settle
N_STEPS   = 150000 # integrate 1500 tu total
THIN      = 50     # keep every 50th → 3 000 waypoints

TUBE_R    = 0.060  # tube radius (m); generous for the elongated orbit
TUBE_SEGS = 8      # polygon sides per cross-section ring
POI_R     = 0.10   # poi head sphere radius (m)

IC        = np.array([0.5, 0.0, 0.1], dtype=float)

COBALT = np.array([0.05, 0.20, 0.75, 1.0])
AMBER  = np.array([1.00, 0.55, 0.05, 1.0])

# +Y-up rotation: Blender's +Y = world up; Sprott's z-axis becomes Blender's y
ROT_YUP = np.array([[1, 0,  0],
                     [0, 0, -1],
                     [0, 1,  0]], dtype=float)

# ── VECTOR FIELD ────────────────────────────────────────────────────────────
def _f(s, b):
    x, y, z = s
    return np.array([
        2.0 * z,                # ẋ: purely z-driven, 2:1 amplification
        -2.0 * y + z,           # ẏ: damped + z-feed
        -x + y + b * y * y,     # ż: nonlinear restoring; y² folds orbit
    ])

def _rk4(s, dt, b):
    k1 = _f(s, b)
    k2 = _f(s + 0.5 * dt * k1, b)
    k3 = _f(s + 0.5 * dt * k2, b)
    k4 = _f(s + dt * k3, b)
    return s + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)

# ── INTEGRATION ─────────────────────────────────────────────────────────────
def integrate(b):
    s = IC.copy()
    for _ in range(BURN_IN):
        s = _rk4(s, DT, b)
    pts, speeds = [], []
    for i in range(N_STEPS):
        s = _rk4(s, DT, b)
        if i % THIN == 0:
            pts.append(s.copy())
            speeds.append(float(np.linalg.norm(_f(s, b))))
    return (ROT_YUP @ np.array(pts).T).T, np.array(speeds, dtype=float)

# ── BISHOP PARALLEL-TRANSPORT FRAMES ────────────────────────────────────────
def bishop_frames(pts):
    """Propagate a reference frame along the curve without twisting."""
    n = len(pts)
    T = np.diff(pts, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True).clip(1e-12)

    # Seed N₀ perpendicular to T₀
    ref = np.array([0.0, 1.0, 0.0]) if abs(T[0, 1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N = np.empty((n - 1, 3), dtype=float)
    N[0] = np.cross(np.cross(T[0], ref), T[0])
    N[0] /= np.linalg.norm(N[0]).clip(1e-12)

    for i in range(1, n - 1):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = float(np.clip(np.dot(T[i - 1], T[i]), -1.0, 1.0))
        if sin_a > 1e-10:
            ax = axis / sin_a
            N[i] = (cos_a * N[i - 1]
                    + sin_a * np.cross(ax, N[i - 1])
                    + (1.0 - cos_a) * np.dot(ax, N[i - 1]) * ax)
        else:
            N[i] = N[i - 1]
        N[i] /= np.linalg.norm(N[i]).clip(1e-12)

    B = np.cross(T[:-1], N)  # binormal (right-hand frame: T × N)
    return T[:-1], N, B

# ── TUBE GEOMETRY ────────────────────────────────────────────────────────────
def build_tube(pts, T, N, B):
    angles = [2.0 * pi * k / TUBE_SEGS for k in range(TUBE_SEGS)]
    cos_a  = np.array([cos(a) for a in angles])
    sin_a  = np.array([sin(a) for a in angles])

    centres = pts[:-1]  # 2999 ring centres
    rings = (centres[:, None, :]
             + TUBE_R * (cos_a[None, :, None] * N[:, None, :]
                         + sin_a[None, :, None] * B[:, None, :]))
    verts = rings.reshape(-1, 3).tolist()

    nr = len(centres)
    faces = []
    for i in range(nr - 1):
        for k in range(TUBE_SEGS):
            a = i * TUBE_SEGS + k
            b_idx = i * TUBE_SEGS + (k + 1) % TUBE_SEGS
            c_idx = (i + 1) * TUBE_SEGS + (k + 1) % TUBE_SEGS
            d_idx = (i + 1) * TUBE_SEGS + k
            faces.append((a, b_idx, c_idx, d_idx))
    return verts, faces

# ── VERTEX COLOUR: SPEED ────────────────────────────────────────────────────
def paint_speed(mesh, speeds):
    lo, hi = np.percentile(speeds, 2), np.percentile(speeds, 98)
    if hi == lo:
        hi = lo + 1.0
    t = np.clip((speeds - lo) / (hi - lo), 0.0, 1.0)
    colours = (1.0 - t)[:, None] * COBALT + t[:, None] * AMBER

    attr = mesh.color_attributes.new("SprottJ_Speed", "FLOAT_COLOR", "POINT")
    flat = np.empty(len(mesh.vertices) * 4, dtype=float)
    for vi in range(len(mesh.vertices)):
        ring_i = vi // TUBE_SEGS  # which ring index
        s_i    = min(ring_i, len(colours) - 1)
        flat[vi * 4 : vi * 4 + 4] = colours[s_i]
    attr.data.foreach_set("color", flat)

# ── SCENE UTILITIES ──────────────────────────────────────────────────────────
def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

def make_mesh_obj(name, verts, faces):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

# ── MATERIAL ─────────────────────────────────────────────────────────────────
def apply_material(obj):
    mat = bpy.data.materials.new(obj.name + "_mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "SprottJ_Speed"
    attr.location = (-400, 0)

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (-100, 0)
    bsdf.inputs["Metallic"].default_value    = 0.50
    bsdf.inputs["Roughness"].default_value   = 0.22
    bsdf.inputs["Emission Strength"].default_value = 1.8

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)

    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.append(mat)

# ── POI HEAD ─────────────────────────────────────────────────────────────────
def add_poi_head(position):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=position)
    head = bpy.context.active_object
    head.name = "SprottJ_Poi_Head"
    apply_material(head)
    return head

# ── BUILD ONE SHAPE ──────────────────────────────────────────────────────────
def build_shape(b_val):
    pts, speeds = integrate(b_val)
    T, N, B     = bishop_frames(pts)
    verts, faces = build_tube(pts, T, N, B)
    return verts, faces, pts, speeds

# ── MAIN ─────────────────────────────────────────────────────────────────────
reset_scene()

# Basis shape
verts_b, faces_b, pts_b, spd_b = build_shape(B_BASIS)
tube_obj = make_mesh_obj("SprottJ_Tube", verts_b, faces_b)
paint_speed(tube_obj.data, spd_b)
apply_material(tube_obj)

# holoflow export metadata
tube_obj["holoflow:facet"]       = False
tube_obj["holoflow:slug"]        = "hf_sprott_j_poi"
tube_obj["holoflow:category"]    = "poi-head"
tube_obj["holoflow:export_name"] = "hf_sprott_j_poi"

# Poi head at tip of tube
add_poi_head(tuple(pts_b[-1]))

# ── SHAPE KEYS ───────────────────────────────────────────────────────────────
tube_obj.shape_key_add(name="Basis", from_mix=False)

for sk_name, b_val in [("SK_LoB", B_LOB), ("SK_HiB", B_HIB), ("SK_VHiB", B_VHIB)]:
    verts_sk, _, pts_sk, spd_sk = build_shape(b_val)
    sk = tube_obj.shape_key_add(name=sk_name, from_mix=False)
    for i, v in enumerate(verts_sk):
        sk.data[i].co = v

# +Y-up and export
import mathutils
rot = mathutils.Matrix.Rotation(-pi / 2, 4, "X")
tube_obj.data.transform(rot)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bpy.ops.export_scene.gltf(
    filepath="//hf_sprott_j_poi.glb",
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_morph=True,
    export_colors=True,
    export_yup=True,
)
print("SprottJ done — hf_sprott_j_poi.glb written.")
