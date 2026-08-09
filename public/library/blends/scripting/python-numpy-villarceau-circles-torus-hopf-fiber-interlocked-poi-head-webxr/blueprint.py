"""
Villarceau Circles — Holoflow poi-head blueprint.
Blender 5.1 · Python 3.12 · numpy

TECHNIQUE
---------
A ring torus (major R, minor r, with R > r) admits three distinct families
of circles:
  1. Meridian circles  — fixed u, cut by half-planes through the Z-axis.
  2. Latitude circles  — fixed v, cut by horizontal planes z = const.
  3. Villarceau circles — Yvon Villarceau (1848): cut by oblique planes
     tangent to the inner equator circle at two antipodal points.

The Villarceau planes each tilt at angle arcsin(r/R) from horizontal.
There are TWO such families (ascending and descending), giving a total of
four circle families on any ring torus.

PARAMETRISATION — derivation
-----------------------------
Let A = √(R² − r²) (the half-chord distance to the torus axis of symmetry
at the Villarceau tangent points).

For a direction angle φ ∈ [0, 2π) and curve parameter t ∈ [0, 2π):

  Family 1 (ascending, z = +(r/A)·(x·cos φ + y·sin φ)):
    x = A·cos t·cos φ − (R·sin t + r)·sin φ
    y = A·cos t·sin φ + (R·sin t + r)·cos φ
    z = r·cos t

  Family 2 (descending, z = +(r/A)·(x·cos φ + y·sin φ) but reflected):
    x = A·cos t·cos φ − (R·sin t − r)·sin φ
    y = A·cos t·sin φ + (R·sin t − r)·cos φ
    z = r·cos t

PROOF lies on torus: ρ = √(x²+y²) = R + r·sin t (Fam 1) → (ρ−R)² + z² = r² ✓
RADIUS of every Villarceau circle = R (the major torus radius).
  Proof: centre = (0, r, 0) for Fam-1 φ=0; radius² = R²cos²t + R²sin²t = R².

HOPF connection: every Villarceau circle on the Clifford torus in S³
is a Hopf fibre (a great circle of S³) under stereographic projection to R³.
The two families correspond to the two opposite orientations of the fibres.

POI HEAD
--------
16 circles (8 ascending + 8 descending), φ_k = 2πk/8, each extruded into a
thin tube via Bishop (parallel-transport) framing.  5 shape keys morph the
minor radius r, sweeping tilt angle arcsin(r/R) from ~11° to ~42°, showing
the continuous family of armillary-sphere ring structures.
"""

import math
import bpy
import numpy as np
import colorsys

# ---------------------------------------------------------------------------
# Parameters
# ---------------------------------------------------------------------------
TORUS_R    = 0.30    # major radius (distance, axis to tube centre)
TORUS_r    = 0.12    # minor radius (tube radius) — Basis key value
N_FAM      = 8       # circles per family (8 ascending + 8 descending = 16 total)
N_SEGS     = 60      # arc samples per circle
N_TUBE     = 8       # tube cross-section sides
TUBE_R     = 0.013   # tube cross-section radius

OBJECT_NAME = "hf_villarceau_poi"
GLB_PATH    = "//hf_villarceau_poi.glb"

# Shape keys: 5 minor-radius variants, R fixed
SK_R_LIST = [
    ("Basis",      TORUS_r),   # 0.12 — tilt ≈ 23.6°
    ("SK_Slender", 0.06),      # 0.06 — tilt ≈ 11.5°  thin torus
    ("SK_Medium",  0.09),      # 0.09 — tilt ≈ 17.5°
    ("SK_Full",    0.15),      # 0.15 — tilt ≈ 30.0°
    ("SK_Horn",    0.20),      # 0.20 — tilt ≈ 41.8°  near horn torus
]


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def villarceau_pts(R, r, phi, family, n):
    """(n, 3) float64 — one Villarceau circle on torus(R, r)."""
    A   = math.sqrt(max(R * R - r * r, 1e-12))
    t   = np.linspace(0.0, 2.0 * math.pi, n, endpoint=False)
    ct  = np.cos(t);  st = np.sin(t)
    cp  = math.cos(phi); sp = math.sin(phi)
    sgn = 1.0 if family == 1 else -1.0
    w   = R * st + sgn * r                  # lateral offset in tilted plane
    x   = A * ct * cp - w * sp
    y   = A * ct * sp + w * cp
    z   = r * ct
    return np.column_stack([x, y, z])


def bishop_frame(pts):
    """Parallel-transport (Bishop) frame for a CLOSED curve.
    Returns N, B each of shape (n, 3).  Holonomy is distributed
    uniformly so the frame closes without a seam twist.
    """
    n = len(pts)
    T = np.zeros((n, 3)); N = np.zeros((n, 3)); B = np.zeros((n, 3))

    # Tangents via central differences (closed curve)
    for i in range(n):
        d  = pts[(i + 1) % n] - pts[(i - 1) % n]
        ln = np.linalg.norm(d)
        T[i] = d / ln if ln > 1e-12 else T[i - 1]

    # Seed N₀ — avoid being parallel to T[0]
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([1.0, 0.0, 0.0])
    n0   = ref - np.dot(ref, T[0]) * T[0]
    N[0] = n0 / np.linalg.norm(n0)
    B[0] = np.cross(T[0], N[0])

    # Parallel transport
    for i in range(1, n):
        ni  = N[i - 1] - np.dot(N[i - 1], T[i]) * T[i]
        ln  = np.linalg.norm(ni)
        N[i] = ni / ln if ln > 1e-12 else N[i - 1]
        B[i] = np.cross(T[i], N[i])

    # Holonomy correction — distribute closing angle linearly
    cos_h = float(np.clip(np.dot(N[-1], N[0]), -1.0, 1.0))
    sin_h = float(np.dot(np.cross(N[-1], N[0]), T[0]))
    theta = math.atan2(sin_h, cos_h)
    for i in range(n):
        a  = (i / n) * theta
        ca = math.cos(a);  sa = math.sin(a)
        N[i], B[i] = ca * N[i] + sa * B[i], -sa * N[i] + ca * B[i]

    return N, B


def tube_verts(pts, N, B, tube_r, n_tube):
    """Flat list of (x,y,z) for a closed tube around pts.
    Ordering: ring 0 vertex 0..n_tube-1, ring 1 vertex 0..n_tube-1, ...
    """
    angs = [2.0 * math.pi * j / n_tube for j in range(n_tube)]
    ca   = [math.cos(a) for a in angs]
    sa_  = [math.sin(a) for a in angs]
    out  = []
    for i, p in enumerate(pts):
        for j in range(n_tube):
            v = p + tube_r * (ca[j] * N[i] + sa_[j] * B[i])
            out.append(tuple(v))
    return out


def all_verts(R, r):
    """Build all 16-circle tube vertices for torus(R, r)."""
    verts = []
    for fam in (1, 2):
        for k in range(N_FAM):
            phi = 2.0 * math.pi * k / N_FAM
            pts = villarceau_pts(R, r, phi, fam, N_SEGS)
            Nf, Bf = bishop_frame(pts)
            verts.extend(tube_verts(pts, Nf, Bf, TUBE_R, N_TUBE))
    return verts


def all_faces():
    """Face index quads — topology-only, independent of vertex positions."""
    faces = []; offset = 0
    for _ in range(2 * N_FAM):
        for i in range(N_SEGS):
            i1 = (i + 1) % N_SEGS
            for j in range(N_TUBE):
                j1 = (j + 1) % N_TUBE
                a = offset + i  * N_TUBE + j
                b = offset + i  * N_TUBE + j1
                c = offset + i1 * N_TUBE + j1
                d = offset + i1 * N_TUBE + j
                faces.append((a, b, c, d))
        offset += N_SEGS * N_TUBE
    return faces


# ---------------------------------------------------------------------------
# Build scene
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.bloom_threshold = 0.08

me = bpy.data.meshes.new(OBJECT_NAME)
ob = bpy.data.objects.new(OBJECT_NAME, me)
bpy.context.collection.objects.link(ob)

# Base geometry
verts_basis = all_verts(TORUS_R, TORUS_r)
me.from_pydata(verts_basis, [], all_faces())
me.update()

# Smooth shading
for poly in me.polygons:
    poly.use_smooth = True
me.use_auto_smooth = True
me.auto_smooth_angle = math.radians(60)

# ---------------------------------------------------------------------------
# Vertex colours — hue by circle index, saturation by family
# ---------------------------------------------------------------------------
col_attr = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
v_idx = 0
for fam_i, _fam in enumerate((1, 2)):
    for k in range(N_FAM):
        hue = (k / N_FAM + 0.5 * fam_i) % 1.0   # fam 1: 0→7/8; fam 2: 0.5→1.375
        rc, gc, bc = colorsys.hsv_to_rgb(hue, 0.90, 1.0)
        for _ in range(N_SEGS * N_TUBE):
            col_attr.data[v_idx].color = (rc, gc, bc, 1.0)
            v_idx += 1

# ---------------------------------------------------------------------------
# Material — emissive glow via vertex colour
# ---------------------------------------------------------------------------
mat = bpy.data.materials.new("VillarceauGlow")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

vcol = nt.nodes.new("ShaderNodeVertexColor"); vcol.layer_name = "Col"; vcol.location = (-300, 100)
emit = nt.nodes.new("ShaderNodeEmission");    emit.inputs["Strength"].default_value = 5.5; emit.location = (-80, 100)
out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (120, 100)
nt.links.new(vcol.outputs["Color"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
ob.data.materials.append(mat)

# ---------------------------------------------------------------------------
# Shape keys
# ---------------------------------------------------------------------------
ob.shape_key_add(name="Basis", from_mix=False)
for sk_name, sk_r in SK_R_LIST[1:]:
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    new_v = all_verts(TORUS_R, sk_r)
    for i, co in enumerate(new_v):
        sk.data[i].co = co

# ---------------------------------------------------------------------------
# Holoflow metadata + export orientation
# ---------------------------------------------------------------------------
ob["holoflow:facet"]    = True
ob["holoflow:category"] = "poi-head"

ob.rotation_euler = (math.pi / 2, 0.0, 0.0)
bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.transform_apply(rotation=True)

# ---------------------------------------------------------------------------
# GLB export — Draco L6, WebP, morph targets
# ---------------------------------------------------------------------------
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_morph=True,
    export_colors=True,
)

print("✓ Villarceau poi head exported →", GLB_PATH)
print(f"  {len(verts_basis)} vertices · {len(all_faces())} quads · 5 shape keys")
print(f"  Torus R={TORUS_R:.3f} r={TORUS_r:.3f}  A={math.sqrt(TORUS_R**2-TORUS_r**2):.4f}")
print(f"  Circle radius = R = {TORUS_R:.3f}  tilt = arcsin(r/R) = {math.degrees(math.asin(TORUS_r/TORUS_R)):.1f}°")
