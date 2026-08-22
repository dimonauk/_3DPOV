"""
Klein Bottle — Felix Klein's 1882 Non-Orientable Closed Surface,
Figure-8 Tube Immersion, χ=0 Euler Characteristic,
Self-Intersection Circle & Faceted Poi Head for WebXR
Blender 5.1 · Holoflow Studio · CC0
═══════════════════════════════════════════════════════════════

Topology
────────
The Klein bottle K is a compact, connected, non-orientable surface with
no boundary. Topological invariants:

  χ(K) = 0    (CW proof: V=1, E=2, F=1 → 1−2+1 = 0)
  H₀ = ℤ,  H₁ = ℤ ⊕ ℤ₂,  H₂ = 0
  Fundamental polygon: a·b·a⁻¹·b   (torus is a·b·a⁻¹·b⁻¹)
  Connected-sum: K = RP² # RP²     (χ = 1+1−2 = 0 ✓)

Whitney (1944): every compact non-orientable surface requires ℝ⁴ for
a smooth embedding; in ℝ³ only an immersion (self-intersection) exists.

Relation to the Möbius band
────────────────────────────
Cutting K along the equatorial self-intersection circle produces exactly
two Möbius bands. The normal field must reverse sign after traversing the
equatorial loop — this is what makes K non-orientable.

Figure-8 Tube Immersion
────────────────────────
Domain: u ∈ [0, 2π), v ∈ [0, 2π)  (both periodic)

  radial(u,v) = r + cos(u/2)·sin(v) − sin(u/2)·sin(2v)

  x(u,v) = radial · cos(u)
  y(u,v) = radial · sin(u)
  z(u,v) = sin(u/2)·sin(v) + cos(u/2)·sin(2v)

  r = 2.5  [radial amplitude ≤ 5/4, so radial ≥ r − 1.25 = 1.25 > 0]

WHY sin(v) as the cross-section driver?
  v = 0 and v = π both give sin(v) = 0, sin(2v) = 0
  → radial = r, z = 0 at both, so (u,0) and (u,π) map to the same point:
  SELF-INTERSECTION CIRCLE:  {(r·cos(u), r·sin(u), 0) : u ∈ [0,2π)}

Shape keys
──────────
  Basis   — r=2.5, poi scale (d=100 mm)
  SK_Wide — r=4.0, wider tube separation (equatorial ring larger)
  SK_Flat — z × 0.25 (reveals equatorial self-intersection prominently)
  SK_Tall — z × 2.5, xy × 0.55 (elongated wand-head aspect)
"""

import bpy, numpy as np
from pathlib import Path

# ── CONSTANTS ─────────────────────────────────────────────────────────────
SLUG       = "python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr"
OBJ_NAME   = "hf_klein_bottle"
MESH_NAME  = "HF_KleinBottle"
HERE       = Path(__file__).parent
GLB_PATH   = str(HERE / "hf_klein_bottle.glb")
BLEND_PATH = str(HERE / "hf_klein_bottle.blend")

NU          = 120     # longitude samples: u ∈ [0, 2π)
NV          = 60      # cross-section samples: v ∈ [0, 2π)
R_TUBE      = 2.5     # main-circle radius; needs r > 1.25 (amplitude bound)
POI_RADIUS  = 0.050   # 50 mm — half-diameter of target poi head


# ── PARAMETRIC SURFACE ────────────────────────────────────────────────────
def _figure8(U, V, r=R_TUBE):
    """Figure-8 tube Klein bottle immersion (arrays, broadcast-safe)."""
    su2 = np.sin(U * 0.5);  cu2 = np.cos(U * 0.5)
    sv  = np.sin(V);         s2v = np.sin(2.0 * V)
    rad = r + cu2 * sv - su2 * s2v
    return rad * np.cos(U),  rad * np.sin(U),  su2 * sv + cu2 * s2v


# ── COLOUR HELPER ─────────────────────────────────────────────────────────
def _hsv_to_rgb(H, S, V_):
    """Vectorised HSV → linear RGB.  All args: flat 1-D arrays, [0,1]."""
    i = (H * 6.0).astype(int) % 6
    f = H * 6.0 - np.floor(H * 6.0)
    p = V_ * (1.0 - S)
    q = V_ * (1.0 - f * S)
    t = V_ * (1.0 - (1.0 - f) * S)
    RGB = np.zeros((len(H), 3))
    for idx, (r_, g_, b_) in enumerate(
            [(V_, t, p), (q, V_, p), (p, V_, t), (p, q, V_), (t, p, V_), (V_, p, q)]):
        m = (i == idx)
        RGB[m] = np.stack([r_[m], g_[m], b_[m]], axis=1)
    return RGB


# ── GRID + FACES ──────────────────────────────────────────────────────────
def _grid():
    u_1d = np.linspace(0.0, 2.0 * np.pi, NU, endpoint=False)
    v_1d = np.linspace(0.0, 2.0 * np.pi, NV, endpoint=False)
    return np.meshgrid(u_1d, v_1d, indexing="ij")   # (NU, NV) each


def _normalise(X, Y, Z):
    """Scale to POI_RADIUS (furthest vertex = 50 mm)."""
    s = POI_RADIUS / np.sqrt(X**2 + Y**2 + Z**2).max()
    return X * s, Y * s, Z * s


def _quads():
    """Periodic quad connectivity for NU×NV torus-topology mesh."""
    faces = []
    for i in range(NU):
        i1 = (i + 1) % NU
        for j in range(NV):
            j1 = (j + 1) % NV
            faces.append((i*NV+j,  i*NV+j1,  i1*NV+j1,  i1*NV+j))
    return faces


# ── MAIN ──────────────────────────────────────────────────────────────────
def main():
    # ── Clean scene ──────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[blk])

    # ── Parameter grid ───────────────────────────────────────────────────
    U, V = _grid()                               # (NU, NV)
    U_f, V_f = U.ravel(), V.ravel()              # flat, N=NU×NV

    X, Y, Z  = _normalise(*_figure8(U, V))       # Basis coords, (NU, NV)

    verts = list(zip(X.ravel().tolist(), Y.ravel().tolist(), Z.ravel().tolist()))
    faces = _quads()

    # ── Build mesh ───────────────────────────────────────────────────────
    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts, [], faces)
    me.update()
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    obj["holoflow:category"] = "poi-head"
    obj["holoflow:facet"]    = True
    obj["holoflow:slug"]     = SLUG

    # ── Vertex colours ───────────────────────────────────────────────────
    # H = u/(2π): longitude rainbow reveals the main-circle structure.
    # The self-intersection circle lies at z ≈ 0; making it brightest
    # (V = 1.0 − 0.60·|z/z_max|) highlights the double-locus geometrically.
    Zf    = Z.ravel()
    H_col = U_f / (2.0 * np.pi)
    S_col = np.full_like(H_col, 0.88)
    V_col = 1.0 - 0.60 * np.abs(Zf) / (np.abs(Zf).max() or 1.0)
    rgb   = _hsv_to_rgb(H_col, S_col, V_col)

    vcol = me.color_attributes.new("KleinCol", "FLOAT_COLOR", "POINT")
    for k, (r_c, g_c, b_c) in enumerate(rgb.tolist()):
        vcol.data[k].color = (r_c, g_c, b_c, 1.0)

    # ── Material ─────────────────────────────────────────────────────────
    mat = bpy.data.materials.new("KleinMat")
    mat.use_nodes = True
    mat.use_backface_culling = False   # NON-ORIENTABLE: both faces must render
    nt  = mat.node_tree
    nt.nodes.clear()
    a_n = nt.nodes.new("ShaderNodeAttribute"); a_n.attribute_name = "KleinCol"
    a_n.location = (-260, 0)
    p_n = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p_n.inputs["Roughness"].default_value = 0.50
    p_n.inputs["Metallic"].default_value  = 0.0
    p_n.location = (0, 0)
    o_n = nt.nodes.new("ShaderNodeOutputMaterial"); o_n.location = (280, 0)
    nt.links.new(a_n.outputs["Color"],  p_n.inputs["Base Color"])
    nt.links.new(p_n.outputs["BSDF"],   o_n.inputs["Surface"])
    obj.data.materials.append(mat)

    # ── Shape keys ───────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    def _add_sk(sk_name, Xs, Ys, Zs):
        Xs2, Ys2, Zs2 = _normalise(Xs, Ys, Zs)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for k, co in enumerate(zip(Xs2.ravel().tolist(),
                                    Ys2.ravel().tolist(),
                                    Zs2.ravel().tolist())):
            sk.data[k].co = co

    # SK_Wide: r=4.0 — larger equatorial self-intersection circle
    _add_sk("SK_Wide", *_figure8(U, V, r=4.0))

    # SK_Flat: z × 0.25 — flatten to reveal the equatorial ring in silhouette
    _add_sk("SK_Flat", X * 1.0, Y * 1.0, Z * 0.25)

    # SK_Tall: z × 2.5, xy × 0.55 — wand-head aspect for vertical spinning
    _add_sk("SK_Tall", X * 0.55, Y * 0.55, Z * 2.5)

    # ── Export ────────────────────────────────────────────────────────────
    bpy.ops.export_scene.gltf(
        filepath           = GLB_PATH,
        export_format      = "GLB",
        export_yup         = True,
        export_apply       = True,
        export_morph       = True,
        export_colors      = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
    )
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[holoflow] Klein Bottle → {GLB_PATH}")
    print(f"[holoflow]              → {BLEND_PATH}")


if __name__ == "__main__":
    main()
