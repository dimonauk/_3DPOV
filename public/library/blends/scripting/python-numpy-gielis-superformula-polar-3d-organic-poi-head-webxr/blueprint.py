"""
Gielis Superformula — Polar-Form 3D Organic Surfaces  (Blender 5.1)
====================================================================
Johan Gielis (2003) introduced the superformula as a single polar equation
that unifies a remarkable variety of natural shapes:

    r(θ) = [ |cos(mθ/4)/a|^n2 + |sin(mθ/4)/b|^n3 ]^(−1/n1)

Six parameters (m, n1, n2, n3, a, b) reproduce circles (n1=n2=n3=2, a=b=1),
squares (m=4, large n), pentagons (m=5), starfish (m=5, high n2/n3), and
hypocycloid cusps (small n1).  Setting a=b=1 gives radial symmetry with m-fold
rotational symmetry.  The 3D version (Gielis 2003, Eq. 5) computes two
independent superformula evaluations — one over latitude φ, one over longitude
θ — then assembles the result as a spherical product surface:

    r₁ = SF(φ; m_φ, n1_φ, n2_φ, n3_φ)
    r₂ = SF(θ; m_θ, n1_θ, n2_θ, n3_θ)
    x = r₁·cos φ · r₂·cos θ
    y = r₁·cos φ · r₂·sin θ
    z = r₁·sin φ

This blueprint:
  1. Builds a base mesh from the hexagonal-blob (m=6) parameter set.
  2. Adds four shape keys that morph to starfish, 4-lobe cross, thorny
     spike ball, and rounded cube — all with the same quad topology.
  3. Vertex-colours the surface by normalised radius (violet→cyan).
  4. Attaches an Emission material for WebXR glow.
  5. Exports hf_superformula_poi.glb with Draco-6 compression.
"""

import bpy
import bmesh
import numpy as np

# ── parameters ────────────────────────────────────────────────────────────────
PHI_STEPS   = 60          # latitude rings (south pole → north pole)
THETA_STEPS = 90          # longitude cols; wraps at 360° (endpoint=False)
POI_SCALE   = 0.35        # metres — overall radius after normalisation

OBJECT_NAME = "hf_superformula_poi"
GLB_PATH    = "//hf_superformula_poi.glb"

# Colour ramp: violet (valleys, low r) → cyan (peaks, high r)
COL_LOW  = (0.28, 0.05, 0.70, 1.0)
COL_HIGH = (0.05, 0.85, 0.90, 1.0)

# Shape-key parameter sets: (name, params_phi, params_theta)
# Each params tuple: (m, n1, n2, n3); a = b = 1 throughout.
# Equal phi/theta params give a surface with matching axial/radial symmetry.
MORPHS = [
    ("Basis",    (6, 1.0,  1.0,  1.0), (6, 1.0,  1.0,  1.0)),  # hex blob
    ("Starfish", (5, 2.0,  7.0,  7.0), (5, 2.0,  7.0,  7.0)),  # 5-arm sea star
    ("Cross",    (4, 1.0,  2.0,  2.0), (4, 1.0,  2.0,  2.0)),  # 4-lobe cross
    ("Thorns",   (8, 0.5,  0.5,  8.0), (8, 0.5,  0.5,  8.0)),  # 8-spike thorns
    ("Cube",     (4, 50.0, 50.0, 50.0),(4, 50.0, 50.0, 50.0)), # rounded cube
]


# ── superformula mathematics ──────────────────────────────────────────────────
def _sfm(angle, m, n1, n2, n3, a=1.0, b=1.0):
    """
    Vectorised Gielis superformula r(angle).

    The base [|cos(mθ/4)/a|^n2 + |sin(mθ/4)/b|^n3] is clamped to 1e-10
    before the −1/n1 power to avoid division-by-zero.  When mθ/4 coincides
    with a multiple of π/2 (cos or sin = 0) the non-zero term dominates, so
    the clamp only fires at float rounding noise; numerically safe for n3 ≤ 50.
    """
    t    = m * angle / 4.0
    base = np.abs(np.cos(t) / a) ** n2 + np.abs(np.sin(t) / b) ** n3
    return np.where(base > 1e-10, base ** (-1.0 / n1), 0.0)


def _build_verts(p_phi, p_theta):
    """
    Return (PHI_STEPS × THETA_STEPS, 3) float64 array, normalised to unit sphere.

    Why normalise?  Different parameter sets produce wildly different absolute
    radii (e.g. rounded-cube n1=50 gives r ≈ 1 everywhere, thorny n1=0.5 gives
    r ∈ [0, 50]).  Normalising to max(r) = 1 before applying POI_SCALE lets all
    shape keys live in the same coordinate frame so Blender morph blending
    works correctly.
    """
    phi   = np.linspace(-np.pi / 2.0, np.pi / 2.0, PHI_STEPS)
    theta = np.linspace(-np.pi, np.pi, THETA_STEPS, endpoint=False)

    r1 = _sfm(phi,   *p_phi)    # (PHI,)
    r2 = _sfm(theta, *p_theta)  # (THETA,)

    R1     = r1[:, np.newaxis]               # (PHI, 1)
    R2     = r2[np.newaxis, :]               # (1, THETA)
    PHI2D  = phi[:, np.newaxis]   + np.zeros((PHI_STEPS, THETA_STEPS))
    THETA2D = np.zeros((PHI_STEPS, THETA_STEPS)) + theta[np.newaxis, :]

    x = R1 * np.cos(PHI2D) * R2 * np.cos(THETA2D)
    y = R1 * np.cos(PHI2D) * R2 * np.sin(THETA2D)
    z = R1 * np.sin(PHI2D)

    vmax = np.max(np.sqrt(x**2 + y**2 + z**2))
    if vmax > 1e-10:
        x, y, z = x / vmax, y / vmax, z / vmax

    return np.stack([x.ravel(), y.ravel(), z.ravel()], axis=1)  # (N, 3)


def _idx(i, j):
    """Flat vertex index in the PHI × THETA grid."""
    return i * THETA_STEPS + (j % THETA_STEPS)


# ── delete previous object ────────────────────────────────────────────────────
if OBJECT_NAME in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[OBJECT_NAME], do_unlink=True)

# ── build base mesh ───────────────────────────────────────────────────────────
verts_basis = _build_verts(*MORPHS[0][1:3])

bm = bmesh.new()
for co in verts_basis:
    bm.verts.new(co * POI_SCALE)
bm.verts.ensure_lookup_table()

# Quad grid; last theta column wraps back to column 0 via _idx % THETA_STEPS
for i in range(PHI_STEPS - 1):
    for j in range(THETA_STEPS):
        v0 = bm.verts[_idx(i,   j)]
        v1 = bm.verts[_idx(i,   j + 1)]
        v2 = bm.verts[_idx(i+1, j + 1)]
        v3 = bm.verts[_idx(i+1, j)]
        bm.faces.new([v0, v1, v2, v3])

bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

mesh = bpy.data.meshes.new(OBJECT_NAME)
bm.to_mesh(mesh)
bm.free()

obj = bpy.data.objects.new(OBJECT_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
mesh.shade_flat()     # faceted aesthetic matches studio convention

# ── shape keys ────────────────────────────────────────────────────────────────
# Blender requires the Basis key first; subsequent keys store absolute positions.
obj.shape_key_add(name="Basis", from_mix=False)

for name, p_phi, p_theta in MORPHS[1:]:
    sk_verts = _build_verts(p_phi, p_theta) * POI_SCALE
    sk = obj.shape_key_add(name=name, from_mix=False)
    for idx in range(len(sk_verts)):
        sk.data[idx].co = sk_verts[idx].tolist()

obj.data.shape_keys.use_relative = True

# ── vertex colours ────────────────────────────────────────────────────────────
# Encode the basis surface's local radius r (already normalised to [0,1]) as a
# smoothstep colour ramp from violet (r_min) to cyan (r_max).  Smooth step
# C¹ avoids colour banding at intermediate morph values in the viewer.
vc = mesh.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")

norms = np.linalg.norm(verts_basis, axis=1)        # (N,) — unit-normalised
t     = (norms - norms.min()) / max(float(norms.ptp()), 1e-10)
t_s   = t * t * (3.0 - 2.0 * t)                    # smoothstep

cl = np.array(COL_LOW)
ch = np.array(COL_HIGH)
colours = (1.0 - t_s[:, None]) * cl + t_s[:, None] * ch  # (N, 4)

for idx in range(len(mesh.vertices)):
    vc.data[idx].color = colours[idx].tolist()

# ── emission material ─────────────────────────────────────────────────────────
mat = bpy.data.materials.new("SF_Emit")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

nd_attr = nt.nodes.new("ShaderNodeAttribute"); nd_attr.attribute_name = "Col"
nd_attr.location = (-400, 0)
nd_emit = nt.nodes.new("ShaderNodeEmission")
nd_emit.inputs["Strength"].default_value = 1.8
nd_emit.location = (-180, 0)
nd_out  = nt.nodes.new("ShaderNodeOutputMaterial"); nd_out.location = (40, 0)

nt.links.new(nd_attr.outputs["Color"],    nd_emit.inputs["Color"])
nt.links.new(nd_emit.outputs["Emission"], nd_out.inputs["Surface"])
mesh.materials.append(mat)

# ── export GLB ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(GLB_PATH),
    use_selection                        = True,
    export_format                        = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
    export_apply                         = True,
    export_morph                         = True,
    export_colors                        = True,
)

print(f"[superformula] ✓ exported {GLB_PATH}")
