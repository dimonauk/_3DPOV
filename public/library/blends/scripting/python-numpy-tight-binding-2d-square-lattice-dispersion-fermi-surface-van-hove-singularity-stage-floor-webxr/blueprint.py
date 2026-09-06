"""
2-D Tight-Binding Band Dispersion — Square / Triangular Lattice (Blender 5.1)
==============================================================================
Technique: Evaluate the single-band tight-binding dispersion E(kx,ky) on a
128×128 grid covering the first Brillouin zone [−π,π]², map the energy to
vertex Z-height, and bake four chemically distinct band structures as shape
keys.  The result is a faceted stage-floor height field showing the band
landscape that electrons navigate in a crystal.

Physics: nearest-neighbour hopping creates a cosine dispersion.
E_sq(k) = −2t[cos(kx)+cos(ky)] − 4t′cos(kx)cos(ky)

High-symmetry points of the square BZ:
  Γ=(0,0)  → E=−4t−4t′ (band bottom)
  M=(π,π)  → E=+4t−4t′ (band top)
  X=(π,0)  → E=0 (saddle point / Van Hove singularity ∀t′)

Sources (public domain):
  Bloch F (1929) Z Phys 52:555; Slater JC & Koster GF (1954) PR 94:1498.
  NumPy: Harris et al (2020) Nature 585:357, BSD-3-Clause.

Shape keys: Basis(t=1,t′=0) / SK_NNN(t′=−0.3) / SK_TriLattice /
            SK_DWave(d-wave gap Δ₀|cos kx − cos ky|)
Colour attr: BandE  (cobalt = band bottom, amber = band top)
"""

import bpy, bmesh
import numpy as np

# ── grid ─────────────────────────────────────────────────────────────────────
GRID_N        = 128           # vertices per BZ side  → 128×128=16384V, 16129Q
WORLD_SCALE   = 4.0           # BZ half-width in Blender metres (kx∈[−π,π] → [−4,4])
HEIGHT_SCALE  = 0.55          # max absolute energy → metres

# ── hopping constants ─────────────────────────────────────────────────────────
T_NN   = 1.0    # nearest-neighbour hopping (eV, normalised to 1)
T_NNN  = -0.3   # next-nearest-neighbour (breaks particle-hole symmetry)
DELTA0 = 1.0    # d-wave gap amplitude (eV)

# ── colour (cobalt = min energy, amber = max energy) ─────────────────────────
COBALT    = np.array([0.030, 0.200, 0.780, 1.0])
AMBER     = np.array([0.980, 0.620, 0.050, 1.0])
ATTR_NAME = "BandE"
MESH_NAME = "tb_band_floor"
OBJ_NAME  = "tb_band_floor"


# ─────────────────────────────────────────────────────────────────────────────
# 1. Band-structure evaluators
# ─────────────────────────────────────────────────────────────────────────────

def bz_grid(N):
    """Return (KX, KY) meshgrid over [−π, π]², endpoint-exclusive (periodic BZ)."""
    k1 = np.linspace(-np.pi, np.pi, N, endpoint=False)
    return np.meshgrid(k1, k1, indexing='ij')   # shape (N, N)


def sq_nn(KX, KY, t=T_NN, tp=0.0):
    """Square-lattice nearest-neighbour tight-binding.

    E(k) = −2t[cos kx + cos ky] − 4t′cos(kx)cos(ky)

    t′=0: particle-hole symmetric, saddle at X=(π,0) with E=0.
    t′≠0: shifts Fermi level; models cuprate CuO₂ planes where t′/t≈−0.3.
    """
    return -2.0*t*(np.cos(KX) + np.cos(KY)) - 4.0*tp*np.cos(KX)*np.cos(KY)


def tri_lattice(KX, KY, t=T_NN):
    """Triangular-lattice nearest-neighbour dispersion.

    Three NN vectors: δ₁=(1,0), δ₂=(½, √3/2), δ₃=(−½, √3/2)
    E(k) = −2t[cos(kx) + cos(ky) + cos(kx−ky)]

    Produces a hexagonal Fermi surface at half-filling.  Geometrical
    frustration in the triangular lattice originates from this dispersion.
    """
    return -2.0*t*(np.cos(KX) + np.cos(KY) + np.cos(KX - KY))


def dwave_gap(KX, KY, delta0=DELTA0):
    """d_{x²−y²} superconducting gap function amplitude.

    Δ(k) = Δ₀(cos kx − cos ky)
    |Δ(k)| vanishes on the nodal lines kx=±ky (Fermi-arc nodes).
    Visualising |Δ| shows the characteristic four-lobe structure that
    makes cuprate superconductors d-wave rather than s-wave.
    """
    return delta0 * np.abs(np.cos(KX) - np.cos(KY))


# ─────────────────────────────────────────────────────────────────────────────
# 2. Height-field normalisation
# ─────────────────────────────────────────────────────────────────────────────

def normalise_to_height(E, scale=HEIGHT_SCALE):
    """Map energy array to Z in [−scale, +scale], preserving zero crossing."""
    emax = np.max(np.abs(E))
    if emax < 1e-8:
        return np.zeros_like(E)
    return (E / emax) * scale


def energy_colours(E):
    """Cobalt–amber vertex colours from energy, full dynamic range."""
    emin, emax = E.min(), E.max()
    t = np.clip((E - emin) / max(emax - emin, 1e-8), 0.0, 1.0)
    flat = t.flatten()
    rgba = np.outer(1.0 - flat, COBALT) + np.outer(flat, AMBER)
    return rgba.astype(np.float32)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Mesh construction (shared topology, varying Z)
# ─────────────────────────────────────────────────────────────────────────────

def make_verts_faces(Z, N=GRID_N, ws=WORLD_SCALE):
    """Build (verts, faces) for a GRID_N×GRID_N height field.

    X = kx mapped to [−ws, ws]; Y = ky mapped to [−ws, ws].
    Faces are CCW quads → outward normal = +Z.
    """
    k1 = np.linspace(-ws, ws, N, endpoint=False)
    KX2, KY2 = np.meshgrid(k1, k1, indexing='ij')
    xs = KX2.flatten()
    ys = KY2.flatten()
    zs = Z.flatten()
    verts = list(zip(xs.tolist(), ys.tolist(), zs.tolist()))

    faces = []
    for iy in range(N - 1):
        for ix in range(N - 1):
            a = iy * N + ix
            b = iy * N + (ix + 1)
            c = (iy + 1) * N + (ix + 1)
            d = (iy + 1) * N + ix
            faces.append((a, b, c, d))
    return verts, faces


# ─────────────────────────────────────────────────────────────────────────────
# 4. Blender scene
# ─────────────────────────────────────────────────────────────────────────────

def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'

    KX, KY = bz_grid(GRID_N)

    # ── Basis: square NN, t′=0 (particle-hole symmetric) ─────────────────
    print("Basis: square NN …")
    E_basis = sq_nn(KX, KY, t=T_NN, tp=0.0)
    Z_basis = normalise_to_height(E_basis)
    verts, faces = make_verts_faces(Z_basis)
    colours = energy_colours(E_basis)

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts, [], faces)
    me.update()
    for p in me.polygons:
        p.use_smooth = False          # faceted

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    # vertex colour attribute
    attr = me.color_attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    for i, c in enumerate(colours):
        attr.data[i].color = c.tolist()

    # ── Shape key: SK_NNN (t′=−0.3, cuprate model) ───────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    print("SK_NNN …")
    E_nnn = sq_nn(KX, KY, t=T_NN, tp=T_NNN)
    Z_nnn = normalise_to_height(E_nnn)
    verts_nnn, _ = make_verts_faces(Z_nnn)
    sk_nnn = obj.shape_key_add(name="SK_NNN", from_mix=False)
    for i, v in enumerate(verts_nnn):
        sk_nnn.data[i].co = v

    # ── Shape key: SK_TriLattice (triangular lattice) ─────────────────────
    print("SK_TriLattice …")
    E_tri = tri_lattice(KX, KY, t=T_NN)
    Z_tri = normalise_to_height(E_tri)
    verts_tri, _ = make_verts_faces(Z_tri)
    sk_tri = obj.shape_key_add(name="SK_TriLattice", from_mix=False)
    for i, v in enumerate(verts_tri):
        sk_tri.data[i].co = v

    # ── Shape key: SK_DWave (d-wave gap amplitude) ────────────────────────
    print("SK_DWave …")
    E_dw = dwave_gap(KX, KY, delta0=DELTA0)
    Z_dw = normalise_to_height(E_dw)
    verts_dw, _ = make_verts_faces(Z_dw)
    sk_dw = obj.shape_key_add(name="SK_DWave", from_mix=False)
    for i, v in enumerate(verts_dw):
        sk_dw.data[i].co = v

    # ── Material: BandE attribute drives emission ─────────────────────────
    mat = bpy.data.materials.new("BandE_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    attr_n = nt.nodes.new('ShaderNodeAttribute');  attr_n.attribute_name = ATTR_NAME
    bsdf   = nt.nodes.new('ShaderNodeBsdfPrincipled')
    emit   = nt.nodes.new('ShaderNodeEmission')
    mix    = nt.nodes.new('ShaderNodeMixShader')
    out    = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf.inputs['Metallic'].default_value  = 0.60
    bsdf.inputs['Roughness'].default_value = 0.18
    emit.inputs['Strength'].default_value  = 1.6
    mix.inputs['Fac'].default_value        = 0.35
    nt.links.new(attr_n.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(attr_n.outputs['Color'], emit.inputs['Color'])
    nt.links.new(bsdf.outputs['BSDF'],    mix.inputs[1])
    nt.links.new(emit.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'],    out.inputs['Surface'])
    me.materials.append(mat)

    # ── holoflow metadata ─────────────────────────────────────────────────
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "stage-floor"

    # ── +Y-up for WebXR export ────────────────────────────────────────────
    import mathutils
    rot = mathutils.Matrix.Rotation(1.5707963, 4, 'X')
    obj.data.transform(rot)

    # ── Save .blend ───────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath="//tb_band_floor.blend")
    print(f"Done. {len(verts)}V, {len(faces)}Q, 4 shape keys.")


build_scene()
