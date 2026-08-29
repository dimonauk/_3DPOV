"""
Dini's Surface — Blender 5.1 Blueprint
=======================================
Technique: the pseudosphere (tractricoid) models the hyperbolic plane H² in ℝ³
with constant Gaussian curvature K = −1/a².  Ulisse Dini (1865) generalised it
by twisting the surface helically, introducing the free parameter b (helix pitch).
The result — Dini's surface — still has *constant* negative curvature K = −1/(a²+b²),
so it is an isometric immersion of H² for every value of b.  The surface is
related to the pure pseudosphere through the Bäcklund–Darboux transform, and
the angle between the two pseudospherical sheets satisfies the **sine-Gordon
equation** φ_uv = sin φ — connecting every Dini surface to the ±1 topological
soliton of field theory.

GEOMETRY
Parametrisation (u ∈ [0, 4π], v ∈ (0, π)):
  x = a · cos(u) · sin(v)
  y = a · sin(u) · sin(v)
  z = a · ( cos(v) + ln( tan(v/2) ) ) + b · u

  First FF: E = a²sin²v + b²,  F = ab·cos²v/sinv,  G = a²cos²v/sin²v
  Gaussian curvature: K = −1/(a²+b²)   (exact, constant)
  The ln(tan(v/2)) term is the Gudermannian-related tractrix altitude; it
  ensures zero mean curvature in the b=0 limit (pseudosphere).

COLOUR
Dini_Radius attribute = a·sin(v) = cross-sectional radius of the helicoid.
Broad equatorial bands → amber (1.00, 0.65, 0.00).
Narrow tip regions    → cobalt (0.03, 0.15, 0.58).

SHAPE KEYS
Four keys explore constant-K isometries with different helix pitch b:
  Basis        b = 0.20  standard Dini (visibly helical)
  SK_Tight     b = 0.40  tighter spiral — K = −1/1.16
  SK_Loose     b = 0.08  looser spiral  — K ≈ −0.994
  SK_Pseudo    b = 0.01  near-pseudosphere — K ≈ −0.9999
"""

import bpy
import bmesh
import numpy as np

# ─── NAMED CONSTANTS ────────────────────────────────────────────────────────
SLUG      = "hf_dini_poi"
OBJ_NAME  = "Dini_Surface"
MAT_NAME  = "Dini_Mat"
ATTR_NAME = "Dini_Radius"

A          = 1.0          # radius parameter (fixed across all shape keys)
B_BASIS    = 0.20         # helix pitch — Basis
B_TIGHT    = 0.40         # SK_Tight
B_LOOSE    = 0.08         # SK_Loose
B_PSEUDO   = 0.01         # SK_Pseudo (near-pseudosphere)

N_U        = 160          # azimuthal steps  (u ∈ [0, 4π])
N_V        = 120          # polar steps      (v ∈ [V_MIN, V_MAX])
V_MIN      = 0.10         # avoid cusp at v = 0
V_MAX      = np.pi - 0.10 # avoid cusp at v = π
MAX_EXTENT = 0.35         # bounding radius after centring (m)

# Cobalt / amber palette (matches studio standard)
COL_COBALT = (0.03, 0.15, 0.58, 1.0)
COL_AMBER  = (1.00, 0.65, 0.00, 1.0)

SHAPE_KEYS = [
    ("Basis",     B_BASIS),
    ("SK_Tight",  B_TIGHT),
    ("SK_Loose",  B_LOOSE),
    ("SK_Pseudo", B_PSEUDO),
]


# ─── SURFACE FUNCTIONS ──────────────────────────────────────────────────────
def dini_surface(a: float, b: float) -> np.ndarray:
    """Return (N_U × N_V, 3) vertex positions for Dini's surface."""
    u = np.linspace(0.0, 4.0 * np.pi, N_U, endpoint=False)  # (N_U,)
    v = np.linspace(V_MIN, V_MAX, N_V)                        # (N_V,)
    uu, vv = np.meshgrid(u, v, indexing="ij")                 # (N_U, N_V)

    x = a * np.cos(uu) * np.sin(vv)
    y = a * np.sin(uu) * np.sin(vv)
    # Tractrix altitude: a·(cos v + ln tan(v/2)) + b·u
    z = a * (np.cos(vv) + np.log(np.tan(vv * 0.5))) + b * uu

    pts = np.stack([x, y, z], axis=-1).reshape(-1, 3)  # (N_U·N_V, 3)
    return pts


def radius_colours(pts: np.ndarray) -> np.ndarray:
    """Cobalt–amber FLOAT_COLOR from the yz-radial distance (≈ a·sin v)."""
    r_xy = np.sqrt(pts[:, 0] ** 2 + pts[:, 1] ** 2)
    t = r_xy / (r_xy.max() + 1e-9)  # [0, 1]
    # lerp cobalt → amber
    c = np.array(COL_COBALT[:3])
    a_ = np.array(COL_AMBER[:3])
    rgb = c[None, :] * (1.0 - t[:, None]) + a_[None, :] * t[:, None]
    return np.concatenate([rgb, np.ones((len(pts), 1))], axis=1)   # (N, 4)


def centre_and_scale(pts: np.ndarray) -> np.ndarray:
    """Centre at centroid, scale so max distance from origin = MAX_EXTENT."""
    pts = pts - pts.mean(axis=0)
    mx = np.linalg.norm(pts, axis=1).max()
    if mx > 1e-9:
        pts *= MAX_EXTENT / mx
    return pts


def build_quad_faces():
    """Row-major quad indices for the (N_U-1)×(N_V-1) grid — no wrap."""
    faces = []
    for i in range(N_U - 1):
        for j in range(N_V - 1):
            a = i * N_V + j
            b = a + 1
            c = (i + 1) * N_V + j + 1
            d = (i + 1) * N_V + j
            faces.append((a, b, c, d))
    return faces


# ─── CLEAN SCENE ────────────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# ─── BUILD BASE MESH (Basis) ─────────────────────────────────────────────────
pts_basis = centre_and_scale(dini_surface(A, B_BASIS))
faces     = build_quad_faces()

bm = bmesh.new()
for p in pts_basis:
    bm.verts.new(p)
bm.verts.ensure_lookup_table()
for f in faces:
    try:
        bm.faces.new([bm.verts[i] for i in f])
    except ValueError:
        pass

mesh = bpy.data.meshes.new(SLUG)
bm.to_mesh(mesh)
bm.free()

obj = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# ─── FLOAT_COLOR ATTRIBUTE ────────────────────────────────────────────────────
cols = radius_colours(pts_basis)
attr = mesh.color_attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
flat = cols.ravel().tolist()
attr.data.foreach_set("color", flat)

# ─── MATERIAL ────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

attr_node = nt.nodes.new("ShaderNodeAttribute")
attr_node.attribute_name = ATTR_NAME
attr_node.location = (-400, 0)

bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Metallic"].default_value  = 0.45
bsdf.inputs["Roughness"].default_value = 0.28
bsdf.location = (-100, 0)

out = nt.nodes.new("ShaderNodeOutputMaterial")
out.location = (200, 0)

nt.links.new(attr_node.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(attr_node.outputs["Color"], bsdf.inputs["Emission Color"])
bsdf.inputs["Emission Strength"].default_value = 1.8
nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
mesh.materials.append(mat)

# holoflow metadata
obj["holoflow:category"]    = "poi-head"
obj["holoflow:facet"]       = True
obj["holoflow:export_name"] = SLUG

# ─── SHAPE KEYS ────────────────────────────────────────────────────────────
obj.shape_key_add(name="Basis", from_mix=False)

for sk_name, b_val in SHAPE_KEYS[1:]:
    pts_sk = centre_and_scale(dini_surface(A, b_val))
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for idx, p in enumerate(pts_sk):
        sk.data[idx].co = p

# ─── +Y-UP TRANSFORM ─────────────────────────────────────────────────────────
import mathutils
obj.rotation_euler = (np.pi / 2, 0.0, 0.0)  # Blender Z-up → export Y-up
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.ops.object.transform_apply(rotation=True)

# ─── GLB EXPORT ──────────────────────────────────────────────────────────────
import os
out_dir = os.path.join(os.path.dirname(bpy.data.filepath) or "/tmp", "export")
os.makedirs(out_dir, exist_ok=True)
glb_path = os.path.join(out_dir, f"{SLUG}.glb")

bpy.ops.export_scene.gltf(
    filepath              = glb_path,
    export_format         = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_morph          = True,
    export_colors         = True,
    export_yup            = True,
    export_textures       = False,
)

print(f"[Dini] GLB written → {glb_path}")
print(f"[Dini] K(Basis) = {-1/(A**2 + B_BASIS**2):.6f}  (constant negative curvature)")
print(f"[Dini] Verts={N_U*N_V}  Quads={(N_U-1)*(N_V-1)}")
