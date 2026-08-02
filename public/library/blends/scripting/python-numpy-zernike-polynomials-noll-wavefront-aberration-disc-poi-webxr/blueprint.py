"""
Zernike Polynomials — Noll-Ordered Wavefront Aberration Disc  (Blender 5.1)
============================================================================
Frits Zernike (Nobel Prize 1953, phase-contrast microscopy) defined an
orthonormal polynomial basis on the unit disc whose low-order terms map
one-for-one onto classical optical aberrations: defocus, astigmatism, coma,
trefoil, spherical aberration.  The radial polynomial R_n^|m|(ρ) is an exact
closed-form expression; the angular factor is cos(mθ) or sin(|m|θ).  Because
the basis is orthonormal over the disc, summing modes gives the RMS wavefront
error as the quadrature sum of individual coefficients — every Hubble Space
Telescope correction, every adaptive-optics actuator command, every corneal
topography map uses this basis.  Here we sculpt a poi disc as the height field
of a single normalised mode, with shape keys that morph through four canonical
aberrations so the viewer can feel the topology of each.
"""

import bpy
import numpy as np
from math import factorial, sqrt, pi

# ── parameters ────────────────────────────────────────────────────────────────
N_RINGS      = 48        # radial rings (excludes centre)
N_SECTORS    = 96        # angular sectors (closed loop)
DISC_RADIUS  = 0.50      # metres
HEIGHT_SCALE = 0.28      # metres per unit normalised Zernike amplitude
OBJECT_NAME  = "hf_zernike_poi"
GLB_PATH     = "//hf_zernike_poi.glb"

# Noll 1976 single-index → (n, m) for j = 1..11
NOLL = {
    1: (0,  0),   4: (2,  0),   5: (2,  2),
    7: (3,  1),   9: (3,  3),  11: (4,  0),
}

# Basis mode (ring volcano shape) + morphs
BASIS_J  = 11                            # primary spherical aberration
MORPH_JS = [4, 5, 7, 9]                  # defocus, astigmatism 0°, coma X, trefoil X
MORPH_NAMES = {4: "defocus", 5: "astigmatism_0", 7: "coma_x", 9: "trefoil_x"}

# Colour palette: signed amplitude → hue
COL_POS   = (0.05, 0.72, 0.90, 1.0)     # teal — positive wavefront
COL_NEG   = (0.92, 0.32, 0.05, 1.0)     # amber — negative wavefront
COL_ZERO  = (1.00, 1.00, 1.00, 1.0)     # white — zero crossing
W_THRESH  = 0.08                         # amplitude fraction → smoothstep to white


# ── Zernike maths ─────────────────────────────────────────────────────────────
def _radial(n, m, rho):
    """Closed-form radial polynomial R_n^|m|(rho).

    Uses the Rodrigues summation formula (Noll 1976 eq. 2).  Each term is
    (-1)^s * (n-s)! / [s! * ((n+m)/2-s)! * ((n-m)/2-s)!] * rho^(n-2s).
    The factorial arithmetic is exact for Python integers; no float instability.
    """
    m = abs(m)
    result = np.zeros_like(rho, dtype=np.float64)
    for s in range((n - m) // 2 + 1):
        coeff = ((-1)**s * factorial(n - s)
                 / (factorial(s)
                    * factorial((n + m) // 2 - s)
                    * factorial((n - m) // 2 - s)))
        result += coeff * rho ** (n - 2 * s)
    return result


def eval_zernike(j, rho, theta):
    """Evaluate normalised Zernike Z_j(rho, theta).

    Normalisation: sqrt(2(n+1)) for m≠0, sqrt(n+1) for m=0.  This ensures
    ∫∫_disc Z_j Z_k dA = π·δ_jk over the unit disc.  The norm is the standard
    ANSI Z80.28 / OSA / Noll convention.
    """
    n, m = NOLL[j]
    R    = _radial(n, m, rho)
    norm = sqrt(2 * (n + 1)) if m != 0 else sqrt(n + 1)
    if m > 0:
        return norm * R * np.cos(m * theta)
    elif m < 0:
        return norm * R * np.sin(abs(m) * theta)
    return norm * R


# ── polar grid ────────────────────────────────────────────────────────────────
_rho   = np.linspace(1.0 / N_RINGS, 1.0, N_RINGS)
_theta = np.linspace(0.0, 2 * pi, N_SECTORS, endpoint=False)
RHO, THETA = np.meshgrid(_rho, _theta, indexing='ij')   # (N_RINGS, N_SECTORS)


# ── mesh topology ─────────────────────────────────────────────────────────────
def _make_verts(Z):
    """Centre vertex + ring vertices.  Centre Z interpolated as inner ring mean."""
    verts = [(0.0, 0.0, float(Z[0].mean()) * HEIGHT_SCALE)]
    x = DISC_RADIUS * RHO * np.cos(THETA)
    y = DISC_RADIUS * RHO * np.sin(THETA)
    z = Z * HEIGHT_SCALE
    for i in range(N_RINGS):
        for j in range(N_SECTORS):
            verts.append((float(x[i, j]), float(y[i, j]), float(z[i, j])))
    return verts


def _make_faces():
    """Triangle fan (centre → ring 0) + quad strips for rings 1..N_RINGS-1."""
    faces = []
    rs0 = 1   # ring-0 start index in vertex list
    for j in range(N_SECTORS):
        faces.append((0, rs0 + j, rs0 + (j + 1) % N_SECTORS))
    for i in range(N_RINGS - 1):
        rs  = 1 + i * N_SECTORS
        rsn = 1 + (i + 1) * N_SECTORS
        for j in range(N_SECTORS):
            jn = (j + 1) % N_SECTORS
            faces.append((rs + j, rs + jn, rsn + jn, rsn + j))
    return faces


# ── colour helper ─────────────────────────────────────────────────────────────
def _lerp4(a, b, t):
    return tuple((1 - t) * ac + t * bc for ac, bc in zip(a, b))


def _z_to_col(val, amp_max):
    a_n = abs(val) / amp_max if amp_max else 0.0
    t   = min(a_n / W_THRESH, 1.0)
    t   = t * t * (3.0 - 2.0 * t)   # C¹ smoothstep
    base = COL_POS if val >= 0 else COL_NEG
    return _lerp4(COL_ZERO, base, t)


def _assign_colours(ob, Z):
    me   = ob.data
    attr = me.color_attributes.new(name="Col", type='FLOAT_COLOR', domain='POINT')
    amp_max = float(np.abs(Z).max()) or 1.0
    # centre vertex
    attr.data[0].color = _z_to_col(float(Z[0].mean()), amp_max)
    for i in range(N_RINGS):
        for j in range(N_SECTORS):
            vi = 1 + i * N_SECTORS + j
            attr.data[vi].color = _z_to_col(float(Z[i, j]), amp_max)


# ── material ──────────────────────────────────────────────────────────────────
def _add_emission_mat(ob):
    mat = bpy.data.materials.new("ZernikeMat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    vcol = nt.nodes.new('ShaderNodeVertexColor')
    vcol.layer_name = "Col"
    emit.inputs['Strength'].default_value = 2.5
    nt.links.new(vcol.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    mat.shadow_method = 'NONE'
    ob.data.materials.append(mat)


# ── shape keys ────────────────────────────────────────────────────────────────
def _add_shape_keys(ob):
    """Basis key first, then one key per morph mode.

    Shape keys store ABSOLUTE vertex positions (not offsets), so each key must
    set x/y as well as z — the ring radii are constant but must be re-stated
    because Blender's shape-key data replaces the full coordinate.
    shape_key_add(from_mix=False) prevents Blender from blending the current
    active key into the new key's starting positions.
    """
    ob.shape_key_add(name="Basis", from_mix=False)
    for j in MORPH_JS:
        sk = ob.shape_key_add(name=MORPH_NAMES[j], from_mix=False)
        Z  = eval_zernike(j, RHO, THETA)
        sk.data[0].co.z = float(Z[0].mean()) * HEIGHT_SCALE
        for i in range(N_RINGS):
            for js in range(N_SECTORS):
                vi = 1 + i * N_SECTORS + js
                sk.data[vi].co.x = float(DISC_RADIUS * RHO[i, js] * np.cos(THETA[i, js]))
                sk.data[vi].co.y = float(DISC_RADIUS * RHO[i, js] * np.sin(THETA[i, js]))
                sk.data[vi].co.z = float(Z[i, js]) * HEIGHT_SCALE


# ── export ────────────────────────────────────────────────────────────────────
def _export_glb(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_morph=True,
        export_colors=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"[zernike] ✓ exported {GLB_PATH}")


# ── main ──────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

Z_basis = eval_zernike(BASIS_J, RHO, THETA)
me      = bpy.data.meshes.new(OBJECT_NAME)
me.from_pydata(_make_verts(Z_basis), [], _make_faces())
me.update()
ob      = bpy.data.objects.new(OBJECT_NAME, me)
bpy.context.scene.collection.objects.link(ob)
ob["holoflow:facet"] = True

_assign_colours(ob, Z_basis)
_add_emission_mat(ob)
_add_shape_keys(ob)
_export_glb(ob)
print("[zernike] done — mesh:", len(me.vertices), "verts,", len(me.polygons), "faces")
